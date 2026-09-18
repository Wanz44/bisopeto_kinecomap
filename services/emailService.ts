import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const COMPANY_EMAIL = 'contact@bisopeto.com';
export const COMPANY_NAME = 'BISO PETO Group SARL';

export interface ContactMessage {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
  recipientEmail: string;
  status?: 'unread' | 'read' | 'replied';
  createdAt?: unknown;
}

export interface SendContactPayload {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
}

export interface SendContactResult {
  success: boolean;
  messageId?: string;
  via?: 'resend' | 'api' | 'firestore';
  error?: string;
}

/**
 * Envoie une demande de contact à contact@bisopeto.com.
 *
 * Architecture :
 * LandingPage
 *    ↓
 * /api/contact
 *    ↓
 * Resend
 *    ↓
 * contact@bisopeto.com
 *
 * La clé RESEND_API_KEY reste uniquement côté serveur.
 */
export async function sendContactMessageDirect(
  payload: SendContactPayload
): Promise<SendContactResult> {
  const name = payload.name.trim();
  const email = payload.email.trim();
  const phone = payload.phone?.trim() || '';
  const service = payload.service?.trim() || 'Demande générale';
  const message = payload.message.trim();

  if (!name || !email || !message) {
    return {
      success: false,
      error: 'Veuillez remplir tous les champs obligatoires.',
    };
  }

  // Validation simple de l'adresse e-mail.
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      success: false,
      error: 'Adresse e-mail invalide.',
    };
  }

  // 1. Envoi réel vers le serveur Vercel /api/contact.
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        service,
        message,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      console.error(
        '[BISO PETO] Erreur API contact:',
        data?.error || response.statusText
      );

      // On essaie quand même d'enregistrer le message
      // dans Firestore pour ne pas perdre la demande.
      const firestoreDocId = await saveContactMessage(
        name,
        email,
        message,
        phone,
        service
      );

      return {
        success: false,
        messageId: firestoreDocId || undefined,
        via: firestoreDocId ? 'firestore' : undefined,
        error:
          data?.error ||
          'Impossible d’envoyer le message. Veuillez réessayer.',
      };
    }

    return {
      success: true,
      messageId: data.id,
      via: 'resend',
    };
  } catch (error) {
    console.error('[BISO PETO] Erreur réseau:', error);

    // Sauvegarde de secours dans Firestore.
    const firestoreDocId = await saveContactMessage(
      name,
      email,
      message,
      phone,
      service
    );

    return {
      success: false,
      messageId: firestoreDocId || undefined,
      via: firestoreDocId ? 'firestore' : undefined,
      error:
        'Connexion au serveur impossible. Votre demande a été enregistrée et sera traitée dès que possible.',
    };
  }
}

/**
 * Sauvegarde de secours dans Firestore.
 */
export async function saveContactMessage(
  name: string,
  email: string,
  message: string,
  phone = '',
  service = 'Demande générale'
): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, 'contact_messages'), {
      name,
      email,
      phone,
      service,
      message,
      recipientEmail: COMPANY_EMAIL,
      status: 'unread',
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error(
      '[BISO PETO] Erreur sauvegarde Firestore:',
      error
    );

    return null;
  }
}

/**
 * Ouvre le logiciel de messagerie du visiteur.
 *
 * Cette fonction est uniquement un secours manuel.
 * Elle ne remplace pas l'envoi automatique via /api/contact.
 */
export function openCompanyEmailComposer(
  name: string,
  senderEmail: string,
  message: string
) {
  const subject = `[BISO PETO Contact] Message de ${name}`;

  const body = [
    `Nom / Organisation : ${name}`,
    `E-mail : ${senderEmail}`,
    '',
    'Message :',
    message,
    '',
    '---',
    'Envoyé depuis la plateforme BISO PETO.',
  ].join('\n');

  const mailtoUrl =
    `mailto:${COMPANY_EMAIL}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  window.location.href = mailtoUrl;
}
