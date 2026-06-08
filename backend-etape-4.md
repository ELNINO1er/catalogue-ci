# Backend — Étape 4 : Module Commerces (businesses)

Cette étape ajoute :
- le **CRUD complet** des commerces (réservé au `SUPER_ADMIN`)
- la **génération automatique du slug** (unique)
- la **route publique** `/api/public/catalogue/:slug` (sans authentification)
- la mise à jour de `server.js` pour monter ces routes

---

## 4.1 Utilitaire slug — `backend/src/utils/slug.js`

Génère un slug propre et garantit son unicité (ajoute `-2`, `-3`… si déjà pris).

```javascript
const slugify = require("slugify");

// Crée un slug unique pour un modèle donné (Business ici)
async function generateUniqueSlug(Model, name) {
  const base = slugify(name, { lower: true, strict: true, locale: "fr" });
  let slug = base || "commerce";
  let suffix = 1;

  // tant que le slug existe déjà, on incrémente
  while (await Model.findOne({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

module.exports = { generateUniqueSlug };
```

---

## 4.2 Contrôleur — `backend/src/controllers/businessController.js`

```javascript
const { Business, Category, Product, PaymentMethod, OrderTracking } = require("../models");
const { generateUniqueSlug } = require("../utils/slug");
const { Op } = require("sequelize");

// GET /api/businesses  (admin) — liste avec recherche + filtre catégorie
exports.list = async (req, res, next) => {
  try {
    const { search, category_id } = req.query;
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (category_id) where.category_id = Number(category_id);

    const businesses = await Business.findAll({
      where,
      include: [
        { model: Category, as: "category" },
        { model: Product, as: "products", attributes: ["id"] },
      ],
      order: [["created_at", "DESC"]],
    });

    // on ajoute un compteur de produits pratique pour le frontend
    const data = businesses.map((b) => {
      const json = b.toJSON();
      json.products_count = json.products ? json.products.length : 0;
      delete json.products;
      return json;
    });

    res.json(data);
  } catch (err) {
    next(err);
  }
};

// GET /api/businesses/:id  (admin)
exports.getById = async (req, res, next) => {
  try {
    const business = await Business.findByPk(req.params.id, {
      include: [
        { model: Category, as: "category" },
        { model: Product, as: "products" },
        { model: PaymentMethod, as: "paymentMethods", through: { attributes: [] } },
      ],
    });
    if (!business) return res.status(404).json({ message: "Commerce introuvable." });
    res.json(business);
  } catch (err) {
    next(err);
  }
};

// POST /api/businesses  (admin)
exports.create = async (req, res, next) => {
  try {
    const {
      name, logo_url, description, category_id,
      whatsapp_number, phone_number, address,
      google_maps_url, opening_hours, payment_method_ids,
    } = req.body;

    if (!name || !whatsapp_number)
      return res.status(400).json({ message: "Nom et numéro WhatsApp obligatoires." });

    const slug = await generateUniqueSlug(Business, name);

    const business = await Business.create({
      name, slug, logo_url, description, category_id,
      whatsapp_number, phone_number, address, google_maps_url, opening_hours,
    });

    // associer les moyens de paiement si fournis
    if (Array.isArray(payment_method_ids) && payment_method_ids.length) {
      await business.setPaymentMethods(payment_method_ids);
    }

    res.status(201).json(business);
  } catch (err) {
    next(err);
  }
};

// PUT /api/businesses/:id  (admin)
exports.update = async (req, res, next) => {
  try {
    const business = await Business.findByPk(req.params.id);
    if (!business) return res.status(404).json({ message: "Commerce introuvable." });

    const {
      name, logo_url, description, category_id,
      whatsapp_number, phone_number, address,
      google_maps_url, opening_hours, is_active, payment_method_ids,
    } = req.body;

    // si le nom change, on régénère le slug
    if (name && name !== business.name) {
      business.slug = await generateUniqueSlug(Business, name);
    }

    Object.assign(business, {
      name: name ?? business.name,
      logo_url, description, category_id,
      whatsapp_number: whatsapp_number ?? business.whatsapp_number,
      phone_number, address, google_maps_url, opening_hours,
      is_active: is_active ?? business.is_active,
    });
    await business.save();

    if (Array.isArray(payment_method_ids)) {
      await business.setPaymentMethods(payment_method_ids);
    }

    res.json(business);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/businesses/:id  (admin)
exports.remove = async (req, res, next) => {
  try {
    const business = await Business.findByPk(req.params.id);
    if (!business) return res.status(404).json({ message: "Commerce introuvable." });
    await business.destroy(); // supprime produits & tracking en cascade
    res.json({ message: "Commerce supprimé." });
  } catch (err) {
    next(err);
  }
};

// GET /api/public/catalogue/:slug  (public, sans auth)
exports.publicCatalogue = async (req, res, next) => {
  try {
    const business = await Business.findOne({
      where: { slug: req.params.slug, is_active: true },
      include: [
        { model: Category, as: "category", attributes: ["id", "name", "slug"] },
        {
          model: Product, as: "products",
          where: { is_active: true },
          required: false,
          attributes: ["id", "name", "image_url", "price", "description", "is_available"],
        },
        {
          model: PaymentMethod, as: "paymentMethods",
          attributes: ["id", "name", "code"],
          through: { attributes: [] },
        },
      ],
      // on n'expose pas les champs internes inutiles
      attributes: {
        exclude: ["category_id", "is_active", "created_at", "updated_at"],
      },
    });

    if (!business)
      return res.status(404).json({ message: "Catalogue introuvable." });

    res.json(business);
  } catch (err) {
    next(err);
  }
};
```

---

## 4.3 Routes — `backend/src/routes/businessRoutes.js`

```javascript
const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/businessController");

// --- Routes admin (protégées) ---
router.get("/", auth, requireRole("SUPER_ADMIN"), ctrl.list);
router.post("/", auth, requireRole("SUPER_ADMIN"), ctrl.create);
router.get("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.getById);
router.put("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.update);
router.delete("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.remove);

module.exports = router;
```

### Routes publiques — `backend/src/routes/publicRoutes.js`

On sépare le public dans son propre fichier pour bien marquer qu'il n'y a **aucune authentification** ici.

```javascript
const router = require("express").Router();
const ctrl = require("../controllers/businessController");

// Catalogue public consultable par les clients
router.get("/catalogue/:slug", ctrl.publicCatalogue);

module.exports = router;
```

---

## 4.4 Mettre à jour `backend/src/server.js`

Ajoutez les deux imports et les deux lignes de montage (repérées par `// + AJOUT`) :

```javascript
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const businessRoutes = require("./routes/businessRoutes");   // + AJOUT
const publicRoutes = require("./routes/publicRoutes");        // + AJOUT

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);                   // + AJOUT
app.use("/api/public", publicRoutes);                         // + AJOUT

app.use((req, res) => res.status(404).json({ message: "Route introuvable." }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion MySQL réussie.");
    await sequelize.sync({ alter: process.env.NODE_ENV === "development" });
    console.log("✅ Modèles synchronisés.");
    app.listen(PORT, () => console.log(`🚀 API sur http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Démarrage impossible :", err.message);
    process.exit(1);
  }
})();
```

---

## 4.5 Tester les endpoints

> Les seeders viendront plus tard. Pour tester dès maintenant, créez un Super Admin à la main (voir encadré ci-dessous), connectez-vous, puis utilisez le token.

**Connexion et récupération du token :**

```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@catalogueci.com","password":"Admin123@"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')
```

**Créer un commerce :**

```bash
curl -X POST http://localhost:4000/api/businesses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Chez Awa Food",
    "category_id": 1,
    "whatsapp_number": "2250700000000",
    "phone_number": "2250700000000",
    "address": "Cocody, Abidjan",
    "opening_hours": "Lun-Dim 09h-22h"
  }'
```

**Consulter le catalogue public (aucun token) :**

```bash
curl http://localhost:4000/api/public/catalogue/chez-awa-food
```

<br>

> 💡 **Créer un Super Admin temporaire à la main** (en attendant les seeders) — exécutez ce petit script depuis `backend/` :
> ```bash
> node -e "require('dotenv').config(); const b=require('bcryptjs'); const {sequelize,User}=require('./src/models'); (async()=>{await sequelize.sync(); await User.create({name:'Super Admin',email:'admin@catalogueci.com',password_hash:await b.hash('Admin123@',10),role:'SUPER_ADMIN'}); console.log('OK'); process.exit(0);})();"
> ```

---

## Points de conception importants

- **Génération du slug** : le slug est créé automatiquement à partir du nom (`Chez Awa Food` → `chez-awa-food`). S'il existe déjà, on suffixe (`-2`, `-3`…). C'est ce slug qui forme l'URL publique `/catalogue/:slug` et le contenu du QR code.
- **Sécurité par rôle** : toutes les routes `/api/businesses` exigent `SUPER_ADMIN`. La route publique est volontairement isolée dans `publicRoutes.js`, sans middleware `auth`.
- **Filtrage du contenu public** : la route publique n'expose **que** les produits actifs et masque les champs internes — le client ne voit jamais d'information de gestion.
- **Suppression en cascade** : supprimer un commerce supprime aussi ses produits et son tracking (configuré dans les associations à l'Étape 2).

---

## Erreurs courantes

| Erreur | Cause | Solution |
|---|---|---|
| `403 Accès refusé` sur `/api/businesses` | Token d'un `MERCHANT` ou absent | Connectez-vous en `SUPER_ADMIN` |
| `setPaymentMethods is not a function` | Associations non chargées | Importez bien depuis `./models` (index.js) |
| Slug en double / erreur unique | Création concurrente rare | `generateUniqueSlug` gère le cas standard ; relancez |
| Catalogue public `404` alors que le commerce existe | `is_active = false` | Activez le commerce ou retirez le filtre |

---

## Suite

- **Étape 5** — Module **produits** : CRUD côté commerçant (un commerçant ne gère que SON commerce), avec contrôle d'appartenance.
- Puis : merchants, payment-methods, tracking WhatsApp + stats, seeders, README.

Dites « **on continue** » pour l'Étape 5.
