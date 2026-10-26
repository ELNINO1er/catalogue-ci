require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const bcrypt = require("bcryptjs");
const { sequelize, User, Business, Product } = require("../src/models");
const { ensureReferenceData, ensureAdminFromEnv, findOrCreate } = require("../src/bootstrap");

// Developpement local : donnees de reference (comme au demarrage du serveur) + boutique de demo.
// En production, le serveur cree lui-meme les donnees de reference et le super admin : pas de boutique de demo.
async function seed() {
  console.log("Demarrage du seeding...");
  await sequelize.authenticate();
  await sequelize.sync();

  const { categories, payments } = await ensureReferenceData();

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
  if (await ensureAdminFromEnv() === null) {
    console.warn("SEED_ADMIN_EMAIL et SEED_ADMIN_PASSWORD non definis dans .env — creation admin ignoree.");
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
