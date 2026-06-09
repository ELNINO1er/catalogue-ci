require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { sequelize } = require("./models");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const businessRoutes = require("./routes/businessRoutes");
const publicRoutes = require("./routes/publicRoutes");
const productRoutes = require("./routes/productRoutes");
const merchantRoutes = require("./routes/merchantRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const trackingRoutes = require("./routes/trackingRoutes");
const customFieldRoutes = require("./routes/customFieldRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentSettingsRoutes = require("./routes/paymentSettingsRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const merchantPortalRoutes = require("./routes/merchantPortalRoutes");
const onboardingRoutes = require("./routes/onboardingRoutes");
const waveWebhookController = require("./controllers/waveWebhookController");

if (!process.env.JWT_SECRET) {
  console.error("Configuration invalide : JWT_SECRET est obligatoire.");
  process.exit(1);
}

if (
  process.env.NODE_ENV === "production" &&
  process.env.JWT_SECRET.length < 32
) {
  console.error("Configuration invalide : JWT_SECRET doit contenir au moins 32 caracteres en production.");
  process.exit(1);
}

const app = express();

const allowedOrigins = new Set([
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean));

function isAllowedDevLanOrigin(origin) {
  if (process.env.NODE_ENV === "production") return false;
  return /^http:\/\/(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}):5173$/.test(origin);
}

if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || isAllowedDevLanOrigin(origin)) return callback(null, true);
    return callback(new Error(`Origin CORS non autorisee: ${origin}`));
  },
}));
app.post("/api/wave/webhook", express.raw({ type: "application/json" }), waveWebhookController.handle);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/public", publicRoutes);
app.use("/api", productRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/payment-methods", paymentRoutes);
app.use("/api", trackingRoutes);
app.use("/api", customFieldRoutes);
app.use("/api", orderRoutes);
app.use("/api", paymentSettingsRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/merchant", merchantPortalRoutes);
app.use("/api/merchant/onboarding", onboardingRoutes);

// ─── Production: serve React frontend ───
const frontendDist = path.join(__dirname, "../../frontend/dist");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(frontendDist));
}

// API 404 — only for /api/* routes
app.use("/api", (req, res) => res.status(404).json({ success: false, message: "Route API introuvable." }));

// SPA fallback — serve React index.html for all other routes
if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function ensureBusinessColumns() {
  const columns = [
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
  ];

  for (const column of columns) {
    const [existing] = await sequelize.query(`SHOW COLUMNS FROM \`businesses\` LIKE '${column.name}'`);
    if (!existing.length) {
      await sequelize.query(`ALTER TABLE \`businesses\` ADD COLUMN \`${column.name}\` ${column.sql}`);
      console.log(`Colonne businesses.${column.name} ajoutee.`);
    }
  }
}

async function ensurePaymentSettingsColumns() {
  const columns = [
    { name: "wave_account_name", sql: "VARCHAR(120) NULL AFTER `wave_phone_number`" },
    { name: "payment_instructions", sql: "TEXT NULL AFTER `wave_account_name`" },
    { name: "is_wave_checkout_enabled", sql: "TINYINT(1) NOT NULL DEFAULT 0 AFTER `payment_mode`" },
    { name: "is_cod_enabled", sql: "TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_wave_enabled`" },
  ];

  for (const column of columns) {
    const [existing] = await sequelize.query(`SHOW COLUMNS FROM \`merchant_payment_settings\` LIKE '${column.name}'`);
    if (!existing.length) {
      await sequelize.query(`ALTER TABLE \`merchant_payment_settings\` ADD COLUMN \`${column.name}\` ${column.sql}`);
      console.log(`Colonne merchant_payment_settings.${column.name} ajoutee.`);
    }
  }
}

async function ensureOrderColumns() {
  const columns = [
    { name: "wave_checkout_session_id", sql: "VARCHAR(120) NULL AFTER `payment_method`" },
    { name: "wave_launch_url", sql: "VARCHAR(500) NULL AFTER `wave_checkout_session_id`" },
    { name: "wave_transaction_id", sql: "VARCHAR(120) NULL AFTER `wave_launch_url`" },
    { name: "paid_at", sql: "DATETIME NULL AFTER `wave_transaction_id`" },
    { name: "payment_proof_reference", sql: "VARCHAR(120) NULL AFTER `paid_at`" },
    { name: "payment_proof_sender", sql: "VARCHAR(120) NULL AFTER `payment_proof_reference`" },
    { name: "payment_proof_note", sql: "TEXT NULL AFTER `payment_proof_sender`" },
    { name: "payment_proof_image", sql: "VARCHAR(500) NULL AFTER `payment_proof_note`" },
  ];

  for (const column of columns) {
    const [existing] = await sequelize.query(`SHOW COLUMNS FROM \`orders\` LIKE '${column.name}'`);
    if (!existing.length) {
      await sequelize.query(`ALTER TABLE \`orders\` ADD COLUMN \`${column.name}\` ${column.sql}`);
      console.log(`Colonne orders.${column.name} ajoutee.`);
    }
  }
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connexion MySQL reussie.");
    await sequelize.sync(process.env.DB_SYNC_ALTER === "true" ? { alter: true } : {});
    await ensureBusinessColumns();
    await ensurePaymentSettingsColumns();
    await ensureOrderColumns();
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
