import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const COMPANY_EMAIL = 'contact@bisopeto.com';
export const COMPANY_NAME = 'BISO PETO Group SARL';

/**
 * Interface pour les messages de contact enregistrés dans Firestore
 */
export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  message: string;
  recipientEmail: string;
  status?: 'unread' | 'read' | 'replied';
  createdAt?: any;
}

/**
 * Construit un message MIME brut encodé en base64URL pour l'API Gmail REST
 */
function createRawEmail(to: string, fromName: string, fromEmail: string, subject: string, bodyText: string): string {
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const emailLines = [
    `To: ${to}`,
    `From: "${fromName}" <${fromEmail}>`,
    `Subject: ${utf8Subject}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    bodyText
  ];
  const fullEmail = emailLines.join('\r\n');
  
  // Conversion en base64url
  return btoa(unescape(encodeURIComponent(fullEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Envoie un e-mail directement via l'API Gmail (requiert un jeton OAuth avec le scope gmail.send)
 */
export async function sendEmailViaGmailApi(
  accessToken: string,
  to: string,
  subject: string,
  bodyText: string,
  senderName: string = COMPANY_NAME,
  senderEmail: string = COMPANY_EMAIL
): Promise<boolean> {
  try {
    const raw = createRawEmail(to, senderName, senderEmail, subject, bodyText);
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erreur API Gmail:', response.status, errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception lors de l\'envoi d\'e-mail via Gmail API:', error);
    return false;
  }
}

/**
 * Ouvre le client de messagerie par défaut ou la page Web Gmail pré-remplie vers l'adresse entreprise
 */
export function openCompanyEmailComposer(name: string, senderEmail: string, message: string) {
  const subject = `[BISO PETO Contact] Message de ${name}`;
  const body = `Nom / Organisation: ${name}\nE-mail expéditeur: ${senderEmail}\n\nMessage:\n${message}\n\n---\nEnvoyé depuis la plateforme Biso Peto (Kin Eco-Map)`;
  
  // Option 1: Gmail Web Direct Composer (ouvre directement l'interface d'envoi Gmail)
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(COMPANY_EMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  // Option 2: Lien mailto standard
  const mailtoUrl = `mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  // Détection si l'utilisateur est sur mobile ou desktop pour rediriger de manière optimale
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    window.location.href = mailtoUrl;
  } else {
    // Essaye d'ouvrir l'interface Web Gmail dans un nouvel onglet, fallback sur mailto
    const newTab = window.open(gmailWebUrl, '_blank');
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      window.location.href = mailtoUrl;
    }
  }
}

/**
 * Enregistre le message dans la base de données Firestore
 */
export async function saveContactMessage(name: string, email: string, message: string): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'contact_messages'), {
      name,
      email,
      message,
      recipientEmail: COMPANY_EMAIL,
      status: 'unread',
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Erreur sauvegarde message de contact dans Firestore:', error);
    return null;
  }
}

/**
 * Envoie un e-mail de réponse/notification à un utilisateur depuis l'adresse entreprise contact@bisopeto.com
 */
export async function sendEmailToUserFromCompany(
  accessToken: string | null,
  userEmail: string,
  subject: string,
  messageText: string
): Promise<boolean> {
  if (accessToken) {
    const sent = await sendEmailViaGmailApi(
      accessToken,
      userEmail,
      subject,
      messageText,
      COMPANY_NAME,
      COMPANY_EMAIL
    );
    if (sent) return true;
  }

  // Fallback si pas de token OAuth ou si l'API échoue
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(userEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageText)}`;
  window.open(gmailUrl, '_blank');
  return true;
}
