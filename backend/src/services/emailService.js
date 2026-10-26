const nodemailer = require("nodemailer");

// Les noms saisis par les utilisateurs sont echappes avant d'etre inseres dans le HTML.
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

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
      <div style="background:#F76707;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#FFFFFF;margin:0;font-size:20px">CatalogueCI</h1>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
        <h2 style="color:#111827;margin:0 0 16px">Nouveau commercant inscrit</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#667085;font-size:14px">Nom</td><td style="padding:8px 0;font-weight:600;color:#111B4D">${esc(merchantName)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085;font-size:14px">Email</td><td style="padding:8px 0;font-weight:600;color:#111B4D">${esc(merchantEmail)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085;font-size:14px">Boutique</td><td style="padding:8px 0;font-weight:600;color:#111B4D">${esc(businessName)}</td></tr>
          <tr><td style="padding:8px 0;color:#667085;font-size:14px">WhatsApp</td><td style="padding:8px 0;font-weight:600;color:#111B4D">${esc(businessPhone)}</td></tr>
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
  const subject = `Bienvenue sur CatalogueCI, ${esc(merchantName)} !`;
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8f9fc;border-radius:12px">
      <div style="background:#F76707;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#FFFFFF;margin:0;font-size:20px">CatalogueCI</h1>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
        <h2 style="color:#111827;margin:0 0 8px">Bienvenue ${esc(merchantName)} !</h2>
        <p style="color:#667085;font-size:14px;line-height:1.6">Votre boutique <strong>${esc(businessName)}</strong> a ete creee avec succes sur CatalogueCI.</p>
        <p style="color:#667085;font-size:14px;line-height:1.6">Voici ce que vous pouvez faire maintenant :</p>
        <ul style="color:#667085;font-size:14px;line-height:1.8">
          <li>Ajoutez vos produits et services</li>
          <li>Configurez vos moyens de paiement</li>
          <li>Partagez votre QR code et lien public</li>
        </ul>
        <div style="text-align:center;margin:24px 0">
          <a href="${appUrl}/catalogue/${encodeURIComponent(businessSlug)}" style="background:#F76707;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Voir ma boutique</a>
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

async function sendPasswordResetEmail({ name, email, resetUrl }) {
  const subject = "Reinitialisation de votre mot de passe CatalogueCI";
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f7f6f3;border-radius:12px">
      <div style="background:#F76707;padding:20px 24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#FFFFFF;margin:0;font-size:20px">CatalogueCI</h1>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e5e7eb">
        <h2 style="color:#111827;margin:0 0 8px">Bonjour ${esc(name)},</h2>
        <p style="color:#4b5563;font-size:14px;line-height:1.6">Vous avez demande a reinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien est valable 1 heure et ne peut servir qu'une fois.</p>
        <div style="text-align:center;margin:24px 0">
          <a href="${esc(resetUrl)}" style="background:#F76707;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Choisir un nouveau mot de passe</a>
        </div>
        <p style="color:#6b7280;font-size:12px;line-height:1.6">Si vous n'etes pas a l'origine de cette demande, ignorez cet email : votre mot de passe actuel reste inchange.</p>
      </div>
    </div>
  `;
  await sendMail({ to: email, subject, html });
}

module.exports = { sendMail, notifyAdminNewMerchant, sendWelcomeEmail, sendPasswordResetEmail };
