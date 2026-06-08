# Backend — Étape 9 : Seeders (données de test)

Un script unique et **idempotent** (on peut le relancer sans créer de doublons) qui crée :
- les **catégories** (Restaurant, Boutique, Salon, Service, Autre)
- les **moyens de paiement** (Wave, Orange Money, MTN Money, Moov Money, Paiement à la livraison)
- le **Super Admin**
- le **commerçant** de test
- le commerce **« Chez Awa Food »** + ses **produits** + ses **moyens de paiement**

---

## 9.1 Le script — `backend/seeders/seed.js`

```javascript
require("dotenv").config();
const bcrypt = require("bcryptjs");
const slugify = require("slugify");
const {
  sequelize, User, Business, Product, Category, PaymentMethod,
} = require("../src/models");

// petit utilitaire "trouver ou créer" par un champ unique
async function findOrCreate(Model, where, defaults = {}) {
  const existing = await Model.findOne({ where });
  if (existing) return { instance: existing, created: false };
  const instance = await Model.create({ ...where, ...defaults });
  return { instance, created: true };
}

async function seed() {
  console.log("🌱 Démarrage du seeding...");
  await sequelize.authenticate();
  // on synchronise pour être sûr que les tables existent
  await sequelize.sync();

  /* 1) Catégories */
  const categoriesData = ["Restaurant", "Boutique", "Salon", "Service", "Autre"];
  const categories = {};
  for (const name of categoriesData) {
    const slug = slugify(name, { lower: true, strict: true });
    const { instance } = await findOrCreate(Category, { slug }, { name });
    categories[name] = instance;
  }
  console.log("✅ Catégories prêtes.");

  /* 2) Moyens de paiement */
  const paymentsData = ["Wave", "Orange Money", "MTN Money", "Moov Money", "Paiement à la livraison"];
  const payments = {};
  for (const name of paymentsData) {
    const code = slugify(name, { lower: true, strict: true, replacement: "_" });
    const { instance } = await findOrCreate(
      PaymentMethod, { code }, { name, is_active: true }
    );
    payments[name] = instance;
  }
  console.log("✅ Moyens de paiement prêts.");

  /* 3) Commerce "Chez Awa Food" (créé avant le commerçant pour l'associer) */
  const bizSlug = "chez-awa-food";
  const { instance: business } = await findOrCreate(
    Business,
    { slug: bizSlug },
    {
      name: "Chez Awa Food",
      logo_url: null,
      description: "Spécialités ivoiriennes maison, fraîches et généreuses.",
      category_id: categories["Restaurant"].id,
      whatsapp_number: "2250700000000",
      phone_number: "2250700000000",
      address: "Cocody, Abidjan",
      google_maps_url: "https://maps.google.com/?q=Cocody+Abidjan",
      opening_hours: "Lun–Dim · 09h00 – 22h00",
      is_active: true,
    }
  );

  // associer 3 moyens de paiement au commerce
  await business.setPaymentMethods([
    payments["Wave"].id,
    payments["Orange Money"].id,
    payments["Paiement à la livraison"].id,
  ]);
  console.log("✅ Commerce « Chez Awa Food » prêt.");

  /* 4) Produits du commerce */
  const productsData = [
    { name: "Garba complet", price: 1500, description: "Attiéké + thon frit + piment", is_available: true },
    { name: "Poulet braisé", price: 3500, description: "Demi-poulet braisé + alloco", is_available: true },
    { name: "Alloco poisson", price: 2500, description: "Alloco + poisson frit + sauce", is_available: true },
    { name: "Jus de bissap", price: 500, description: "Maison, bien frais", is_available: false },
  ];
  for (const p of productsData) {
    const exists = await Product.findOne({
      where: { business_id: business.id, name: p.name },
    });
    if (!exists) {
      await Product.create({ ...p, business_id: business.id, is_active: true });
    }
  }
  console.log("✅ Produits prêts.");

  /* 5) Super Admin */
  const { created: adminCreated } = await findOrCreate(
    User,
    { email: "admin@catalogueci.com" },
    {
      name: "Super Admin",
      password_hash: await bcrypt.hash("Admin123@", 10),
      role: "SUPER_ADMIN",
      is_active: true,
    }
  );
  console.log(adminCreated ? "✅ Super Admin créé." : "ℹ️  Super Admin déjà existant.");

  /* 6) Commerçant associé à "Chez Awa Food" */
  const { instance: merchant, created: merchantCreated } = await findOrCreate(
    User,
    { email: "merchant@catalogueci.com" },
    {
      name: "Awa Koné",
      password_hash: await bcrypt.hash("Merchant123@", 10),
      role: "MERCHANT",
      business_id: business.id,
      is_active: true,
    }
  );
  // s'assurer de l'association même si le compte existait déjà
  if (!merchant.business_id) {
    merchant.business_id = business.id;
    await merchant.save();
  }
  console.log(merchantCreated ? "✅ Commerçant créé." : "ℹ️  Commerçant déjà existant.");

  console.log("\n🎉 Seeding terminé !");
  console.log("───────────────────────────────");
  console.log("👑 Admin       : admin@catalogueci.com / Admin123@");
  console.log("🏪 Commerçant  : merchant@catalogueci.com / Merchant123@");
  console.log("📱 Catalogue   : /catalogue/chez-awa-food");
  console.log("───────────────────────────────");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Erreur de seeding :", err);
    process.exit(1);
  });
```

---

## 9.2 Ajouter le script dans `package.json`

Dans `backend/package.json`, complétez la section `scripts` :

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node seeders/seed.js"
  }
}
```

---

## 9.3 Lancer le seeding

```bash
# Depuis backend/ — assurez-vous que MySQL tourne et que la base existe
npm run seed
```

Sortie attendue :

```text
🌱 Démarrage du seeding...
✅ Catégories prêtes.
✅ Moyens de paiement prêts.
✅ Commerce « Chez Awa Food » prêt.
✅ Produits prêts.
✅ Super Admin créé.
✅ Commerçant créé.

🎉 Seeding terminé !
───────────────────────────────
👑 Admin       : admin@catalogueci.com / Admin123@
🏪 Commerçant  : merchant@catalogueci.com / Merchant123@
📱 Catalogue   : /catalogue/chez-awa-food
───────────────────────────────
```

---

## 9.4 Vérifier

```bash
# Connexion admin
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@catalogueci.com","password":"Admin123@"}'

# Catalogue public peuplé
curl http://localhost:4000/api/public/catalogue/chez-awa-food
```

Vous devriez voir le commerce, ses 4 produits et ses 3 moyens de paiement.

---

## Points de conception importants

- **Idempotent** : le script utilise un « trouver ou créer » sur les champs uniques (email, slug, code). Vous pouvez le **relancer autant de fois que vous voulez** sans créer de doublons — pratique pendant le développement.
- **Ordre de création respecté** : catégories et paiements d'abord, puis le commerce (qui en dépend), puis les produits et enfin les utilisateurs. Cet ordre évite les erreurs de clé étrangère.
- **Mots de passe hashés** : même en seed, jamais de mot de passe en clair en base. On passe par `bcrypt.hash` exactement comme en production.
- **Association garantie** : si le commerçant existait déjà sans commerce, le script le rattache quand même à « Chez Awa Food ».

---

## Erreurs courantes

| Erreur | Cause | Solution |
|---|---|---|
| `Unknown database` | Base non créée | `mysql -u root -p < database.sql` ou lancez `server.js` une fois |
| `SequelizeConnectionError` | MySQL éteint / mauvais `.env` | Vérifiez le service et les identifiants |
| Doublons malgré tout | Champ unique manquant en base | Vérifiez les `unique` des modèles (Étape 2) |
| `setPaymentMethods is not a function` | Import direct d'un modèle | Importez depuis `../src/models` |

---

## Dernière étape

- **Étape 10** — **README final** : guide d'installation complet (backend + frontend), structure du projet, tableau récapitulatif de **tous les endpoints**, identifiants de test, et conseils de déploiement/commercialisation.

Dites « **on continue** » pour le README final et clôturer le backend.
