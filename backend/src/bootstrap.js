const bcrypt = require("bcryptjs");
const slugify = require("slugify");
const { User, Category, PaymentMethod, Plan, PlatformSetting } = require("./models");

// Donnees de reference indispensables au fonctionnement (inscription, onboarding, plans).
// Execute a chaque demarrage : ne cree que ce qui manque, ne modifie jamais l'existant.
const CATEGORIES = ["Restaurant", "Boutique", "Salon", "Service", "Autre"];
const PAYMENT_METHODS = ["Wave", "Orange Money", "MTN Money", "Moov Money", "Paiement a la livraison"];
const PLANS = [
  { name: "Starter", price: 0, product_limit: 10, order_limit: 30, features_json: JSON.stringify(["custom_fields"]) },
  { name: "Pro", price: 5000, product_limit: 50, order_limit: 500, features_json: JSON.stringify(["custom_fields", "advanced_stats", "premium_templates"]) },
  { name: "Business", price: 15000, product_limit: null, order_limit: null, features_json: JSON.stringify(["custom_fields", "advanced_stats", "premium_templates", "pdf_catalog", "promo_codes", "multi_staff"]) },
];
const PLATFORM_SETTINGS = [
  { key: "platform_name", value: "CatalogueCI" },
  { key: "currency", value: "XOF" },
  { key: "country", value: "CI" },
  { key: "platform_wave_number", value: "2250700000000" },
  { key: "platform_wave_name", value: "CatalogueCI SAS" },
  // Mode lancement gratuit : passer a "true" depuis les reglages admin pour activer les abonnements payants.
  { key: "billing_enabled", value: "false" },
  { key: "platform_payment_instructions", value: "Envoyez le montant exact sur le numero Wave ci-dessus, puis entrez la reference de la transaction." },
];

async function findOrCreate(Model, where, defaults = {}) {
  const existing = await Model.findOne({ where });
  if (existing) return { instance: existing, created: false };
  const instance = await Model.create({ ...where, ...defaults });
  return { instance, created: true };
}

async function ensureReferenceData() {
  const categories = {};
  for (const name of CATEGORIES) {
    const { instance } = await findOrCreate(Category, { slug: slugify(name, { lower: true, strict: true }) }, { name });
    categories[name] = instance;
  }
  const payments = {};
  for (const name of PAYMENT_METHODS) {
    const code = slugify(name, { lower: true, strict: true, replacement: "_" });
    const { instance } = await findOrCreate(PaymentMethod, { code }, { name, is_active: true });
    payments[name] = instance;
  }
  for (const plan of PLANS) await findOrCreate(Plan, { name: plan.name }, { ...plan, is_active: true });
  for (const setting of PLATFORM_SETTINGS) await findOrCreate(PlatformSetting, { key: setting.key }, { value: setting.value });
  return { categories, payments };
}

// Super admin cree depuis SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD s'il n'existe pas encore.
// Un compte existant n'est jamais modifie (le mot de passe se change ensuite dans l'application).
async function ensureAdminFromEnv() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) return null;
  const { created } = await findOrCreate(User, { email }, {
    name: "Super Admin",
    password_hash: await bcrypt.hash(password, 12),
    role: "SUPER_ADMIN",
    is_active: true,
  });
  if (created) console.log(`Super admin cree : ${email}`);
  return created;
}

module.exports = { ensureReferenceData, ensureAdminFromEnv, findOrCreate };
