require("dotenv").config();
const bcrypt = require("bcryptjs");
const slugify = require("slugify");
const { sequelize, User, Business, Product, Category, PaymentMethod } = require("../src/models");

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

  await findOrCreate(User, { email: "admin@catalogueci.com" }, {
    name: "Super Admin",
    password_hash: await bcrypt.hash("Admin123@", 10),
    role: "SUPER_ADMIN",
    is_active: true,
  });

  const { instance: merchant } = await findOrCreate(User, { email: "merchant@catalogueci.com" }, {
    name: "Awa Kone",
    password_hash: await bcrypt.hash("Merchant123@", 10),
    role: "MERCHANT",
    business_id: business.id,
    is_active: true,
  });

  if (!merchant.business_id) {
    merchant.business_id = business.id;
    await merchant.save();
  }

  console.log("Seeding termine.");
  console.log("Admin: admin@catalogueci.com / Admin123@");
  console.log("Commercant: merchant@catalogueci.com / Merchant123@");
  console.log("Catalogue: /catalogue/chez-awa-food");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Erreur de seeding :", err);
    process.exit(1);
  });
