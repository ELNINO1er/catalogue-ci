# Backend — Étape 5 : Module Produits (products)

Cette étape ajoute le **CRUD des produits** avec une règle de sécurité essentielle :

> Un `MERCHANT` ne peut voir et modifier que les produits de **son propre commerce**.
> Le `SUPER_ADMIN`, lui, peut tout gérer.

---

## 5.1 Middleware d'appartenance — `backend/src/middleware/ownership.js`

Ce middleware vérifie que l'utilisateur a le droit d'agir sur un commerce donné. Réutilisable pour les produits, les stats, etc.

```javascript
// Vérifie que req.user peut agir sur le business identifié par businessId.
// - SUPER_ADMIN : accès total
// - MERCHANT : uniquement si businessId === son business_id
function canAccessBusiness(user, businessId) {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  return Number(user.business_id) === Number(businessId);
}

// Middleware basé sur :businessId dans l'URL
function requireBusinessAccess(req, res, next) {
  const businessId = req.params.businessId || req.body.business_id;
  if (!canAccessBusiness(req.user, businessId)) {
    return res.status(403).json({ message: "Accès refusé à ce commerce." });
  }
  next();
}

module.exports = { canAccessBusiness, requireBusinessAccess };
```

---

## 5.2 Contrôleur — `backend/src/controllers/productController.js`

```javascript
const { Product, Business } = require("../models");
const { canAccessBusiness } = require("../middleware/ownership");

// GET /api/businesses/:businessId/products
exports.listByBusiness = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    if (!canAccessBusiness(req.user, businessId))
      return res.status(403).json({ message: "Accès refusé à ce commerce." });

    const products = await Product.findAll({
      where: { business_id: businessId },
      order: [["created_at", "DESC"]],
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
};

// POST /api/businesses/:businessId/products
exports.create = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    if (!canAccessBusiness(req.user, businessId))
      return res.status(403).json({ message: "Accès refusé à ce commerce." });

    const business = await Business.findByPk(businessId);
    if (!business) return res.status(404).json({ message: "Commerce introuvable." });

    const { name, image_url, price, description, category, is_available } = req.body;
    if (!name || price === undefined)
      return res.status(400).json({ message: "Nom et prix obligatoires." });

    const product = await Product.create({
      business_id: businessId,
      name, image_url,
      price, description, category,
      is_available: is_available ?? true,
    });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

// GET /api/products/:id
exports.getById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produit introuvable." });
    if (!canAccessBusiness(req.user, product.business_id))
      return res.status(403).json({ message: "Accès refusé." });
    res.json(product);
  } catch (err) {
    next(err);
  }
};

// PUT /api/products/:id
exports.update = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produit introuvable." });
    if (!canAccessBusiness(req.user, product.business_id))
      return res.status(403).json({ message: "Accès refusé." });

    const { name, image_url, price, description, category, is_available, is_active } = req.body;
    Object.assign(product, {
      name: name ?? product.name,
      image_url: image_url ?? product.image_url,
      price: price ?? product.price,
      description: description ?? product.description,
      category: category ?? product.category,
      is_available: is_available ?? product.is_available,
      is_active: is_active ?? product.is_active,
    });
    await product.save();
    res.json(product);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/products/:id
exports.remove = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produit introuvable." });
    if (!canAccessBusiness(req.user, product.business_id))
      return res.status(403).json({ message: "Accès refusé." });

    await product.destroy();
    res.json({ message: "Produit supprimé." });
  } catch (err) {
    next(err);
  }
};
```

---

## 5.3 Routes — `backend/src/routes/productRoutes.js`

Toutes les routes exigent une connexion (`auth`). Le contrôle fin (admin OU propriétaire) est fait par `canAccessBusiness` dans le contrôleur.

```javascript
const router = require("express").Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/productController");

// Produits rattachés à un commerce
router.get("/businesses/:businessId/products", auth, ctrl.listByBusiness);
router.post("/businesses/:businessId/products", auth, ctrl.create);

// Produit individuel
router.get("/products/:id", auth, ctrl.getById);
router.put("/products/:id", auth, ctrl.update);
router.delete("/products/:id", auth, ctrl.remove);

module.exports = router;
```

> Note : ces routes sont montées à la racine `/api` (et non sous `/api/products`) car elles mélangent les chemins `/businesses/...` et `/products/...`.

---

## 5.4 Mettre à jour `backend/src/server.js`

Ajoutez l'import et le montage (`// + AJOUT`) :

```javascript
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const businessRoutes = require("./routes/businessRoutes");
const publicRoutes = require("./routes/publicRoutes");
const productRoutes = require("./routes/productRoutes");      // + AJOUT

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/public", publicRoutes);
app.use("/api", productRoutes);                               // + AJOUT

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

> ⚠️ **Ordre de montage important** : `app.use("/api", productRoutes)` doit venir **après** `app.use("/api/businesses", businessRoutes)`. Comme productRoutes contient `/businesses/:businessId/products`, Express évalue les routes dans l'ordre de déclaration ; les routes plus spécifiques de `businessRoutes` (`GET /:id`) restent prioritaires sur leur préfixe `/api/businesses`. Le découpage ci-dessus évite tout conflit car les chemins ne se recouvrent pas (`/api/businesses/:id` vs `/api/businesses/:businessId/products`).

---

## 5.5 Tester

```bash
# (TOKEN admin récupéré comme à l'étape 4)

# Ajouter un produit au commerce n°1
curl -X POST http://localhost:4000/api/businesses/1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Garba complet","price":1500,"description":"Attiéké + thon","is_available":true}'

# Lister les produits du commerce n°1
curl http://localhost:4000/api/businesses/1/products \
  -H "Authorization: Bearer $TOKEN"

# Modifier un produit
curl -X PUT http://localhost:4000/api/products/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":1800,"is_available":false}'
```

**Vérifier la sécurité d'appartenance** (essentiel à tester) : connectez-vous en tant que commerçant rattaché au commerce n°1, puis tentez d'accéder aux produits du commerce n°2 :

```bash
curl http://localhost:4000/api/businesses/2/products \
  -H "Authorization: Bearer $TOKEN_MERCHANT"
# → 403 Accès refusé à ce commerce.
```

---

## Points de conception importants

- **Une seule règle, appliquée partout** : `canAccessBusiness(user, businessId)` centralise toute la logique « admin = tout / commerçant = son commerce ». Aucune route produit ne fait confiance à un `business_id` venant du corps de la requête sans le revérifier.
- **Pas de fuite entre commerçants** : même en devinant l'`id` d'un produit d'un autre commerce, un commerçant reçoit `403`. La vérification se fait toujours à partir du `business_id` réel du produit en base, jamais d'une valeur fournie par le client.
- **`is_active` vs `is_available`** : `is_available` = disponibilité ponctuelle (épuisé/dispo), affichée au client ; `is_active` = le produit est-il publié du tout. Un produit `is_active = false` n'apparaît pas sur la page publique (filtre posé à l'Étape 4).

---

## Erreurs courantes

| Erreur | Cause | Solution |
|---|---|---|
| `403` alors qu'on est admin | Token expiré ou rôle incorrect | Reconnectez-vous, vérifiez le rôle dans `/api/auth/me` |
| `Produit introuvable` après création | Mauvais `business_id` dans l'URL | Vérifiez l'id du commerce avec `GET /api/businesses` |
| Le produit n'apparaît pas sur la page publique | `is_active = false` ou commerce inactif | Activez le produit et le commerce |
| `Cannot POST /api/businesses/1/products` | productRoutes non monté | Vérifiez `app.use("/api", productRoutes)` dans server.js |

---

## Suite

- **Étape 6** — Module **merchants** (créer/associer/désactiver un compte commerçant, admin uniquement)
- **Étape 7** — **payment-methods** (gestion par l'admin)
- **Étape 8** — **tracking WhatsApp** + **stats** (le cœur de votre suivi de clics)
- **Seeders** (Super Admin, commerçant, Chez Awa Food + produits) puis **README** final

Dites « **on continue** » pour l'Étape 6.
