require("dotenv").config();
const express = require("express");
const cors = require("cors");
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

if (process.env.NODE_ENV === "production") app.set("trust proxy", 1);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`Origin CORS non autorisee: ${origin}`));
  },
}));
app.use(express.json());

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

app.use((req, res) => res.status(404).json({ success: false, message: "Route introuvable." }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function ensureBusinessTemplateColumn() {
  const [columns] = await sequelize.query("SHOW COLUMNS FROM `businesses` LIKE 'template_id'");
  if (columns.length) return;

  await sequelize.query("ALTER TABLE `businesses` ADD COLUMN `template_id` INT NULL AFTER `category_id`");
  console.log("Colonne businesses.template_id ajoutee.");
}

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connexion MySQL reussie.");
    await sequelize.sync(process.env.DB_SYNC_ALTER === "true" ? { alter: true } : {});
    await ensureBusinessTemplateColumn();
    console.log("Modeles synchronises.");
    app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}`));
  } catch (err) {
    console.error("Demarrage impossible :", err.message);
    process.exit(1);
  }
})();
