require("dotenv").config();
const bcrypt = require("bcryptjs");
const slugify = require("slugify");
const { sequelize, User, Business, Product, Category, PaymentMethod, Plan, PlatformSetting } = require("../src/models");

async function findOrCreate(Model, where, defaults = {}) {
  const existing = await Model.findOne({ where });
  if (existing) return { instance: existing, created: false };
  const instance = await Model.create({ ...where, ...defaults });
  return { instance, created: true };
}

async function seed() {
  console.log("Demarrage du seeding...");
  await sequelize.authenticate();
  await sequelize.sync();

  const categories = {};
  for (const name of ["Restaurant", "Boutique", "Salon", "Service", "Autre"]) {
    const slug = slugify(name, { lower: true, strict: true });
    const { instance } = await findOrCreate(Category, { slug }, { name });
    categories[name] = instance;
  }

  const payments = {};
  for (const name of ["Wave", "Orange Money", "MTN Money", "Moov Money", "Paiement a la livraison"]) {
    const code = slugify(name, { lower: true, strict: true, replacement: "_" });
    const { instance } = await findOrCreate(PaymentMethod, { code }, { name, is_active: true });
    payments[name] = instance;
  }

  const { instance: business } = await findOrCreate(
    Business,
    { slug: "chez-awa-food" },
    {
      name: "Chez Awa Food",
      logo_url: null,
      description: "Specialites ivoiriennes maison, fraiches et genereuses.",
      category_id: categories.Restaurant.id,
      whatsapp_number: "2250700000000",
      phone_number: "2250700000000",
      address: "Cocody, Abidjan",
      google_maps_url: "https://maps.google.com/?q=Cocody+Abidjan",
      opening_hours: "Lun-Dim 09h00-22h00",
      is_active: true,
    }
  );

  await business.setPaymentMethods([
    payments.Wave.id,
    payments["Orange Money"].id,
    payments["Paiement a la livraison"].id,
  ]);

  const productsData = [
    { name: "Garba complet", price: 1500, description: "Attieke + thon frit + piment", is_available: true },
    { name: "Poulet braise", price: 3500, description: "Demi-poulet braise + alloco", is_available: true },
    { name: "Alloco poisson", price: 2500, description: "Alloco + poisson frit + sauce", is_available: true },
    { name: "Jus de bissap", price: 500, description: "Maison, bien frais", is_available: false },
  ];

  for (const product of productsData) {
    const exists = await Product.findOne({ where: { business_id: business.id, name: product.name } });
    if (!exists) await Product.create({ ...product, business_id: business.id, is_active: true });
  }

  // Admin credentials from .env (SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD)
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    console.warn("SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD non definis dans .env — creation admin ignoree.");
  } else {
    await findOrCreate(User, { email: adminEmail }, {
      name: "Super Admin",
      password_hash: await bcrypt.hash(adminPassword, 12),
      role: "SUPER_ADMIN",
      is_active: true,
    });
  }

  // Demo merchant from .env (optional)
  const merchantEmail = process.env.SEED_MERCHANT_EMAIL;
  const merchantPassword = process.env.SEED_MERCHANT_PASSWORD;
  if (merchantEmail && merchantPassword) {
    const { instance: merchant } = await findOrCreate(User, { email: merchantEmail }, {
      name: "Demo Merchant",
      password_hash: await bcrypt.hash(merchantPassword, 10),
      role: "MERCHANT",
      business_id: business.id,
      is_active: true,
    });
    if (!merchant.business_id) {
      merchant.business_id = business.id;
      await merchant.save();
    }
  }

  // Plans
  const plansData = [
    { name: "Starter", price: 0, product_limit: 10, order_limit: 30, features_json: JSON.stringify(["custom_fields"]) },
    { name: "Pro", price: 5000, product_limit: 50, order_limit: 500, features_json: JSON.stringify(["custom_fields", "advanced_stats", "premium_templates"]) },
    { name: "Business", price: 15000, product_limit: null, order_limit: null, features_json: JSON.stringify(["custom_fields", "advanced_stats", "premium_templates", "pdf_catalog", "promo_codes", "multi_staff"]) },
  ];
  for (const plan of plansData) {
    await findOrCreate(Plan, { name: plan.name }, { ...plan, is_active: true });
  }

  // Platform settings for subscription payments
  const settingsData = [
    { key: "platform_name", value: "CatalogueCI" },
    { key: "currency", value: "XOF" },
    { key: "country", value: "CI" },
    { key: "platform_wave_number", value: "2250700000000" },
    { key: "platform_wave_name", value: "CatalogueCI SAS" },
    { key: "platform_payment_instructions", value: "Envoyez le montant exact sur le numero Wave ci-dessus, puis entrez la reference de la transaction." },
  ];
  for (const setting of settingsData) {
    await findOrCreate(PlatformSetting, { key: setting.key }, { value: setting.value });
  }

  console.log("Seeding termine.");
  if (adminEmail) console.log(`Admin: ${adminEmail}`);
  if (merchantEmail) console.log(`Commercant: ${merchantEmail}`);
  console.log("Catalogue: /catalogue/chez-awa-food");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Erreur de seeding :", err);
    process.exit(1);
  });
