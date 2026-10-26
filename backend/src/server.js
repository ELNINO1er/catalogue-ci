// Variables : backend/.env (local), puis .env du dossier de lancement (Hostinger l'ecrit a la racine).
// dotenv ne remplace jamais une variable deja definie.
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  console.error("Configuration invalide : JWT_SECRET est obligatoire.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production") {
  const problems = [];
  if (process.env.JWT_SECRET.length < 32) problems.push("JWT_SECRET doit contenir au moins 32 caracteres.");
  if (/changez_moi/i.test(process.env.JWT_SECRET)) problems.push("JWT_SECRET est encore la valeur d'exemple.");
  if (!process.env.PUBLIC_APP_URL) problems.push("PUBLIC_APP_URL est obligatoire (liens des emails et retour Wave).");
  if (!process.env.DB_PASSWORD) problems.push("DB_PASSWORD est vide.");
  if (problems.length) {
    console.error(`Configuration de production invalide :\n- ${problems.join("\n- ")}`);
    process.exit(1);
  }
}

const app = require("./app");
const { sequelize } = require("./models");


const PORT = process.env.PORT || 4000;

// Colonnes ajoutees apres la creation initiale des tables (sync() ne modifie pas une table existante).
const EXTRA_COLUMNS = {
  businesses: [
    { name: "banner_url", sql: "VARCHAR(500) NULL AFTER `logo_url`" },
    { name: "template_id", sql: "INT NULL AFTER `category_id`" },
    { name: "email", sql: "VARCHAR(180) NULL AFTER `phone_number`" },
    { name: "terms_text", sql: "TEXT NULL AFTER `opening_hours`" },
    { name: "delivery_policy", sql: "TEXT NULL AFTER `terms_text`" },
    { name: "welcome_message", sql: "TEXT NULL AFTER `delivery_policy`" },
    { name: "primary_color", sql: "VARCHAR(20) NULL AFTER `welcome_message`" },
    { name: "secondary_color", sql: "VARCHAR(20) NULL AFTER `primary_color`" },
    { name: "button_color", sql: "VARCHAR(20) NULL AFTER `secondary_color`" },
    { name: "display_style", sql: "VARCHAR(30) NULL AFTER `button_color`" },
    { name: "theme_mode", sql: "VARCHAR(20) NULL AFTER `display_style`" },
    { name: "font_family", sql: "VARCHAR(80) NULL AFTER `theme_mode`" },
    { name: "text_color", sql: "VARCHAR(20) NULL AFTER `font_family`" },
    { name: "background_color", sql: "VARCHAR(20) NULL AFTER `text_color`" },
    { name: "business_type", sql: "VARCHAR(80) NULL AFTER `background_color`" },
    { name: "city", sql: "VARCHAR(100) NULL AFTER `business_type`" },
    { name: "commune", sql: "VARCHAR(100) NULL AFTER `city`" },
    { name: "onboarding_completed", sql: "TINYINT(1) NOT NULL DEFAULT 0 AFTER `commune`" },
    { name: "onboarding_step", sql: "INT NOT NULL DEFAULT 0 AFTER `onboarding_completed`" },
  ],
  merchant_payment_settings: [
    { name: "wave_account_name", sql: "VARCHAR(120) NULL AFTER `wave_phone_number`" },
    { name: "payment_instructions", sql: "TEXT NULL AFTER `wave_account_name`" },
    { name: "is_wave_checkout_enabled", sql: "TINYINT(1) NOT NULL DEFAULT 0 AFTER `payment_mode`" },
    { name: "is_cod_enabled", sql: "TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_wave_enabled`" },
  ],
  orders: [
    { name: "wave_checkout_session_id", sql: "VARCHAR(120) NULL AFTER `payment_method`" },
    { name: "wave_launch_url", sql: "VARCHAR(500) NULL AFTER `wave_checkout_session_id`" },
    { name: "wave_transaction_id", sql: "VARCHAR(120) NULL AFTER `wave_launch_url`" },
    { name: "paid_at", sql: "DATETIME NULL AFTER `wave_transaction_id`" },
    { name: "payment_proof_reference", sql: "VARCHAR(120) NULL AFTER `paid_at`" },
    { name: "payment_proof_sender", sql: "VARCHAR(120) NULL AFTER `payment_proof_reference`" },
    { name: "payment_proof_note", sql: "TEXT NULL AFTER `payment_proof_sender`" },
    { name: "payment_proof_image", sql: "VARCHAR(500) NULL AFTER `payment_proof_note`" },
  ],
  platform_payments: [
    { name: "plan_id", sql: "INT NULL AFTER `subscription_id`" },
  ],
  users: [
    { name: "reset_token_hash", sql: "VARCHAR(64) NULL AFTER `is_active`" },
    { name: "reset_token_expires_at", sql: "DATETIME NULL AFTER `reset_token_hash`" },
    { name: "password_changed_at", sql: "DATETIME NULL AFTER `reset_token_expires_at`" },
    { name: "terms_accepted_at", sql: "DATETIME NULL AFTER `password_changed_at`" },
  ],
};

async function ensureExtraColumns() {
  for (const [table, columns] of Object.entries(EXTRA_COLUMNS)) {
    for (const column of columns) {
      const [existing] = await sequelize.query(`SHOW COLUMNS FROM \`${table}\` LIKE '${column.name}'`);
      if (!existing.length) {
        await sequelize.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column.name}\` ${column.sql}`);
        console.log(`Colonne ${table}.${column.name} ajoutee.`);
      }
    }
  }
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connexion MySQL reussie.");
    await sequelize.sync(process.env.DB_SYNC_ALTER === "true" ? { alter: true } : {});
    await ensureExtraColumns();
    console.log("Modeles synchronises.");
    const server = app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}`));
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} deja utilise. Arretez l'ancienne instance backend ou changez PORT dans .env.`);
        process.exit(1);
      }
      throw err;
    });
  } catch (err) {
    console.error("Demarrage impossible :", err.message);
    process.exit(1);
  }
})();
