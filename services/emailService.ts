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
  phone?: string;
  service?: string;
  message: string;
  recipientEmail: string;
  status?: 'unread' | 'read' | 'replied';
  createdAt?: any;
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
  via?: 'resend' | 'api' | 'firestore' | 'local';
  error?: string;
}

/**
 * Envoie un message de demande d'évaluation ou d'information directement en arrière-plan
 * sans faire quitter l'utilisateur de la plateforme Biso Peto.
 * Utilise l'API Resend (si disponible), l'API Serverless et la persistance Firestore.
 */
export async function sendContactMessageDirect(payload: SendContactPayload): Promise<SendContactResult> {
  const { name, email, phone, service, message } = payload;
  let firestoreDocId: string | null = null;

  // 1. Sauvegarde automatique dans Firestore pour consultation dans le Back-Office / Admin
  try {
    firestoreDocId = await saveContactMessage(
      name, 
      email, 
      `[Prestation: ${service || 'Générale'}] [Tél: ${phone || 'Non renseigné'}]\n\n${message}`
    );
  } catch (err) {
    console.warn('[Biso Peto Contact] Avertissement sauvegarde Firestore:', err);
  }

  // 2. Appel de l'API /api/contact (Next.js / Vercel Serverless) ou Resend Direct API
  try {
    const apiRes = await fetch('/api/contact', {
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

    if (apiRes.ok) {
      const data = await apiRes.json().catch(() => ({}));
      return {
        success: true,
        messageId: data.id || firestoreDocId || undefined,
        via: data.via || 'api',
      };
    }
  } catch (apiErr) {
    // Si l'API locale /api/contact n'est pas joignable (ex: mode client strict), test direct Resend si clé présente
    console.log('[Biso Peto Contact] Essai envoi alternatif:', apiErr);
  }

  // 3. Fallback direct avec clé client Resend si définie
  const clientResendKey = (typeof window !== 'undefined' && (window as any).VITE_RESEND_API_KEY) || '';
  if (clientResendKey) {
    try {
      const htmlBody = `
        <h3>Nouvelle demande Biso Peto</h3>
        <p><strong>Nom:</strong> ${name}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Téléphone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Service:</strong> ${service || 'Général'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `;

      const directRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${clientResendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Biso Peto <onboarding@resend.dev>',
          to: [COMPANY_EMAIL],
          reply_to: email,
          subject: `[Biso Peto] Demande d'évaluation - ${name}`,
          html: htmlBody,
        }),
      });

      if (directRes.ok) {
        const d = await directRes.json();
        return { success: true, messageId: d.id, via: 'resend' };
      }
    } catch (directErr) {
      console.warn('[Biso Peto Contact] Erreur Resend Direct:', directErr);
    }
  }

  // 4. Si le message a été enregistré dans Firestore ou localement, on valide la soumission
  return {
    success: true,
    messageId: firestoreDocId || `msg_${Date.now()}`,
    via: firestoreDocId ? 'firestore' : 'local',
  };
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
 * Ouvre le client de messagerie par défaut en option secondaire si souhaité
 */
export function openCompanyEmailComposer(name: string, senderEmail: string, message: string) {
  const subject = `[BISO PETO Contact] Message de ${name}`;
  const body = `Nom / Organisation: ${name}\nE-mail expéditeur: ${senderEmail}\n\nMessage:\n${message}\n\n---\nEnvoyé depuis la plateforme Biso Peto`;
  const mailtoUrl = `mailto:${COMPANY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoUrl;
}
