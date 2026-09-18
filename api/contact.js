const COMPANY_EMAIL = 'contact@bisopeto.com';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  // Autoriser uniquement POST.
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Méthode non autorisée.',
    });
  }

  try {
    const {
      name,
      email,
      phone = '',
      service = 'Demande générale',
      message,
    } = req.body || {};

    // Validation.
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        error: 'Nom, e-mail et message sont obligatoires.',
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPhone = String(phone).trim();
    const cleanService = String(service).trim();
    const cleanMessage = String(message).trim();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Adresse e-mail invalide.',
      });
    }

    if (cleanName.length > 150) {
      return res.status(400).json({
        success: false,
        error: 'Le nom est trop long.',
      });
    }

    if (cleanMessage.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Le message est trop long.',
      });
    }

    // La clé reste UNIQUEMENT côté serveur.
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error(
        '[BISO PETO] RESEND_API_KEY est absente des variables serveur.'
      );

      return res.status(500).json({
        success: false,
        error: 'Service e-mail temporairement indisponible.',
      });
    }

    /*
     * IMPORTANT :
     * Cette adresse doit appartenir à un domaine vérifié
     * dans Resend.
     *
     * Dans Vercel :
     * RESEND_FROM_EMAIL=BISO PETO GROUP <contact@bisopeto.com>
     */
    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      'BISO PETO GROUP <contact@bisopeto.com>';

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle demande de contact</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f3f6f4;
  font-family:Arial,Helvetica,sans-serif;
  color:#1f2937;
">

  <div style="
    max-width:680px;
    margin:30px auto;
    background:#ffffff;
    border-radius:16px;
    overflow:hidden;
    border:1px solid #e5e7eb;
  ">

    <!-- En-tête -->
    <div style="
      background:#047857;
      padding:28px 30px;
      color:#ffffff;
    ">
      <h1 style="
        margin:0;
        font-size:24px;
        font-weight:700;
      ">
        BISO PETO GROUP
      </h1>

      <p style="
        margin:7px 0 0;
        font-size:14px;
        color:#d1fae5;
      ">
        Nouvelle demande de contact
      </p>
    </div>

    <!-- Contenu -->
    <div style="padding:30px;">

      <h2 style="
        margin:0 0 22px;
        font-size:20px;
        color:#111827;
      ">
        Demande reçue depuis le site
      </h2>

      <table style="
        width:100%;
        border-collapse:collapse;
        font-size:14px;
      ">

        <tr>
          <td style="
            padding:12px 0;
            font-weight:bold;
            width:180px;
            border-bottom:1px solid #e5e7eb;
          ">
            Nom / Entreprise
          </td>

          <td style="
            padding:12px 0;
            border-bottom:1px solid #e5e7eb;
          ">
            ${escapeHtml(cleanName)}
          </td>
        </tr>

        <tr>
          <td style="
            padding:12px 0;
            font-weight:bold;
            border-bottom:1px solid #e5e7eb;
          ">
            E-mail
          </td>

          <td style="
            padding:12px 0;
            border-bottom:1px solid #e5e7eb;
          ">
            <a
              href="mailto:${escapeHtml(cleanEmail)}"
              style="color:#047857;"
            >
              ${escapeHtml(cleanEmail)}
            </a>
          </td>
        </tr>

        <tr>
          <td style="
            padding:12px 0;
            font-weight:bold;
            border-bottom:1px solid #e5e7eb;
          ">
            Téléphone
          </td>

          <td style="
            padding:12px 0;
            border-bottom:1px solid #e5e7eb;
          ">
            ${escapeHtml(cleanPhone || 'Non renseigné')}
          </td>
        </tr>

        <tr>
          <td style="
            padding:12px 0;
            font-weight:bold;
            border-bottom:1px solid #e5e7eb;
          ">
            Prestation
          </td>

          <td style="
            padding:12px 0;
            border-bottom:1px solid #e5e7eb;
          ">
            ${escapeHtml(cleanService || 'Demande générale')}
          </td>
        </tr>

      </table>

      <!-- Message -->
      <div style="margin-top:28px;">

        <h3 style="
          margin:0 0 10px;
          font-size:15px;
          color:#111827;
        ">
          Message
        </h3>

        <div style="
          background:#f8faf9;
          border:1px solid #e5e7eb;
          border-radius:12px;
          padding:18px;
          font-size:14px;
          line-height:1.7;
          white-space:pre-wrap;
        ">
          ${escapeHtml(cleanMessage)}
        </div>

      </div>

      <!-- Bouton réponse -->
      <div style="margin-top:28px;">

        <a
          href="mailto:${escapeHtml(cleanEmail)}"
          style="
            display:inline-block;
            background:#047857;
            color:#ffffff;
            text-decoration:none;
            padding:12px 20px;
            border-radius:10px;
            font-size:14px;
            font-weight:bold;
          "
        >
          Répondre au demandeur
        </a>

      </div>

    </div>

    <!-- Pied -->
    <div style="
      background:#f9fafb;
      padding:18px 30px;
      border-top:1px solid #e5e7eb;
      font-size:12px;
      color:#6b7280;
    ">
      Message automatique envoyé depuis la plateforme BISO PETO GROUP.
    </div>

  </div>

</body>
</html>
`;

    // Appel sécurisé à Resend.
    const resendResponse = await fetch(
      'https://api.resend.com/emails',
      {
        method: 'POST',

        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          from: fromEmail,
          to: [COMPANY_EMAIL],
          reply_to: cleanEmail,
          subject: `[BISO PETO] Nouvelle demande — ${cleanName}`,
          html,
        }),
      }
    );

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error(
        '[BISO PETO] Resend error:',
        resendData
      );

      return res.status(502).json({
        success: false,
        error: 'Resend n’a pas pu envoyer le message.',
      });
    }

    return res.status(200).json({
      success: true,
      id: resendData.id,
      via: 'resend',
    });

  } catch (error) {
    console.error(
      '[BISO PETO] API contact error:',
      error
    );

    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur.',
    });
  }
}
