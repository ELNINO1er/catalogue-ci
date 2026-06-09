const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("SMTP non configure (SMTP_HOST, SMTP_USER, SMTP_PASS). Les emails seront affiches en console.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@catalogueci.com";

  if (!t) {
    console.log("=== EMAIL (console mode) ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html}`);
    console.log("============================");
    return;
  }

  await t.sendMail({ from, to, subject, html });
}

async function notifyAdminNewMerchant({ merchantName, merchantEmail, businessName, businessPhone }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("ADMIN_EMAIL non configure. Notification admin ignoree.");
    return;
  }

  const subject = `Nouvelle inscription commercant : ${businessName}`;
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8f9fc;border-radius:12px">
      <div style="background:#272C68;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#FFD633;margin:0;font-size:20px">CatalogueCI</h1>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
        <h2 style="color:#272C68;margin:0 0 16px">Nouveau commercant inscrit</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#667085;font-size:14px">Nom</td><td style="padding:8px 0;font-weight:600;color:#111B4D">${merchantName}</td></tr>
          <tr><td style="padding:8px 0;color:#667085;font-size:14px">Email</td><td style="padding:8px 0;font-weight:600;color:#111B4D">${merchantEmail}</td></tr>
          <tr><td style="padding:8px 0;color:#667085;font-size:14px">Boutique</td><td style="padding:8px 0;font-weight:600;color:#111B4D">${businessName}</td></tr>
          <tr><td style="padding:8px 0;color:#667085;font-size:14px">WhatsApp</td><td style="padding:8px 0;font-weight:600;color:#111B4D">${businessPhone}</td></tr>
        </table>
        <p style="margin:20px 0 0;color:#667085;font-size:13px">Ce commercant a ete automatiquement active. Vous pouvez le gerer depuis le dashboard Super Admin.</p>
      </div>
    </div>
  `;

  try {
    await sendMail({ to: adminEmail, subject, html });
  } catch (err) {
    console.error("Erreur envoi email admin:", err.message);
  }
}

async function sendWelcomeEmail({ merchantName, merchantEmail, businessName, businessSlug }) {
  const appUrl = process.env.PUBLIC_APP_URL || "http://localhost:5173";
  const subject = `Bienvenue sur CatalogueCI, ${merchantName} !`;
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8f9fc;border-radius:12px">
      <div style="background:#272C68;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#FFD633;margin:0;font-size:20px">CatalogueCI</h1>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
        <h2 style="color:#272C68;margin:0 0 8px">Bienvenue ${merchantName} !</h2>
        <p style="color:#667085;font-size:14px;line-height:1.6">Votre boutique <strong>${businessName}</strong> a ete creee avec succes sur CatalogueCI.</p>
        <p style="color:#667085;font-size:14px;line-height:1.6">Voici ce que vous pouvez faire maintenant :</p>
        <ul style="color:#667085;font-size:14px;line-height:1.8">
          <li>Ajoutez vos produits et services</li>
          <li>Configurez vos moyens de paiement</li>
          <li>Partagez votre QR code et lien public</li>
        </ul>
        <div style="text-align:center;margin:24px 0">
          <a href="${appUrl}/catalogue/${businessSlug}" style="background:#272C68;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Voir ma boutique</a>
        </div>
        <p style="color:#9ca3af;font-size:12px;text-align:center">Connectez-vous sur ${appUrl} pour gerer votre boutique.</p>
      </div>
    </div>
  `;

  try {
    await sendMail({ to: merchantEmail, subject, html });
  } catch (err) {
    console.error("Erreur envoi email bienvenue:", err.message);
  }
}

module.exports = { sendMail, notifyAdminNewMerchant, sendWelcomeEmail };
