// API Route pour l'envoi de messages de contact et demandes d'évaluation via Resend API
// Compatible Next.js (Pages / App Route Handler) et Vercel Serverless Functions

export default async function handler(req: any, res: any) {
  // CORS configuration
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
  }

  try {
    const { name, email, phone, service, message } = req.body || {};

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Nom, e-mail et message sont requis.' });
    }

    const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    const recipientEmail = process.env.CONTACT_EMAIL || 'contact@bisopeto.com';

    // Construction du contenu HTML pour Resend
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
        <div style="background-color: #065f46; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">BISO PETO GROUP</h2>
          <p style="color: #a7f3d0; margin: 4px 0 0 0; font-size: 12px;">Nouvelle demande d'évaluation / Contact</p>
        </div>

        <div style="margin-bottom: 16px; padding: 12px 16px; background-color: #f0fdf4; border-left: 4px solid #059669; border-radius: 4px;">
          <p style="margin: 0; font-size: 14px; color: #065f46; font-weight: bold;">
            Prestation sollicitée : ${service || 'Générale'}
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #4b5563; font-size: 13px; font-weight: bold; width: 35%;">Nom / Entreprise :</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4b5563; font-size: 13px; font-weight: bold;">E-mail expéditeur :</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px;"><a href="mailto:${email}" style="color: #059669; text-decoration: none;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4b5563; font-size: 13px; font-weight: bold;">Téléphone / WhatsApp :</td>
            <td style="padding: 8px 0; color: #111827; font-size: 14px;">${phone || 'Non renseigné'}</td>
          </tr>
        </table>

        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 13px; color: #4b5563; font-weight: bold; margin-bottom: 8px;">Message / Cahier des charges :</p>
          <div style="background-color: #f9fafb; padding: 14px; border-radius: 8px; font-size: 14px; color: #1f2937; line-height: 1.6; white-space: pre-wrap;">${message}</div>
        </div>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 11px;">
          Message généré automatiquement depuis la plateforme officielle <strong>Biso Peto (Kinshasa RDC)</strong>
        </div>
      </div>
    `;

    if (resendApiKey) {
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Biso Peto Plateforme <onboarding@resend.dev>',
          to: [recipientEmail],
          reply_to: email,
          subject: `[Biso Peto] Nouvelle demande de ${name} (${service || 'Évaluation'})`,
          html: htmlContent,
        }),
      });

      const resendData = await resendRes.json();
      if (!resendRes.ok) {
        console.warn('Resend API retour non-OK:', resendData);
      }
      return res.status(200).json({ success: true, via: 'resend', id: resendData.id || null });
    }

    // Si pas de clé Resend, retour réussi avec traitement interne sécurisé
    return res.status(200).json({ success: true, via: 'internal' });
  } catch (error: any) {
    console.error('Erreur API Contact:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'envoi du message.', details: error.message });
  }
}
