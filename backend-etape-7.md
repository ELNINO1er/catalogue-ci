# Backend — Étape 7 : Module Moyens de paiement (payment-methods)

Permet à l'admin de gérer le catalogue global des moyens de paiement, et d'associer une sélection à chaque commerce. La liste des moyens **actifs** est consultable publiquement (utile au frontend pour afficher les options disponibles).

---

## 7.1 Contrôleur — `backend/src/controllers/paymentController.js`

```javascript
const slugify = require("slugify");
const { PaymentMethod, Business } = require("../models");

// Génère un code court à partir du nom : "Orange Money" -> "orange_money"
function toCode(name) {
  return slugify(name, { lower: true, strict: true, replacement: "_" });
}

// GET /api/payment-methods  — public : uniquement les actifs
exports.listPublic = async (req, res, next) => {
  try {
    const methods = await PaymentMethod.findAll({
      where: { is_active: true },
      attributes: ["id", "name", "code"],
      order: [["name", "ASC"]],
    });
    res.json(methods);
  } catch (err) {
    next(err);
  }
};

// GET /api/payment-methods/all  — admin : tous (actifs + inactifs)
exports.listAll = async (req, res, next) => {
  try {
    const methods = await PaymentMethod.findAll({ order: [["name", "ASC"]] });
    res.json(methods);
  } catch (err) {
    next(err);
  }
};

// POST /api/payment-methods  — admin
exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Nom obligatoire." });

    const code = toCode(name);
    const exists = await PaymentMethod.findOne({ where: { code } });
    if (exists) return res.status(409).json({ message: "Ce moyen de paiement existe déjà." });

    const method = await PaymentMethod.create({ name, code, is_active: true });
    res.status(201).json(method);
  } catch (err) {
    next(err);
  }
};

// PUT /api/payment-methods/:id  — admin
exports.update = async (req, res, next) => {
  try {
    const method = await PaymentMethod.findByPk(req.params.id);
    if (!method) return res.status(404).json({ message: "Moyen de paiement introuvable." });

    const { name, is_active } = req.body;
    if (name) {
      method.name = name;
      method.code = toCode(name);
    }
    if (typeof is_active === "boolean") method.is_active = is_active;

    await method.save();
    res.json(method);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/payment-methods/:id  — admin
exports.remove = async (req, res, next) => {
  try {
    const method = await PaymentMethod.findByPk(req.params.id);
    if (!method) return res.status(404).json({ message: "Moyen de paiement introuvable." });
    await method.destroy(); // retire aussi les associations (cascade Étape 2)
    res.json({ message: "Moyen de paiement supprimé." });
  } catch (err) {
    next(err);
  }
};

// POST /api/businesses/:businessId/payment-methods  — admin : (ré)affecter la liste
exports.setForBusiness = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { payment_method_ids } = req.body; // tableau d'ids

    const business = await Business.findByPk(businessId);
    if (!business) return res.status(404).json({ message: "Commerce introuvable." });
    if (!Array.isArray(payment_method_ids))
      return res.status(400).json({ message: "payment_method_ids doit être un tableau." });

    // setPaymentMethods remplace entièrement les associations existantes
    await business.setPaymentMethods(payment_method_ids);

    const updated = await Business.findByPk(businessId, {
      include: [{ model: PaymentMethod, as: "paymentMethods", through: { attributes: [] } }],
    });
    res.json(updated.paymentMethods);
  } catch (err) {
    next(err);
  }
};
```

---

## 7.2 Routes — `backend/src/routes/paymentRoutes.js`

```javascript
const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/paymentController");

// Public : liste des moyens actifs
router.get("/", ctrl.listPublic);

// Admin
router.get("/all", auth, requireRole("SUPER_ADMIN"), ctrl.listAll);
router.post("/", auth, requireRole("SUPER_ADMIN"), ctrl.create);
router.put("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.update);
router.delete("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.remove);

module.exports = router;
```

### Association à un commerce — à ajouter dans `businessRoutes.js`

Cette route vit logiquement sous `/api/businesses/:businessId/...`. Ajoutez-la à la fin de `backend/src/routes/businessRoutes.js` :

```javascript
const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/businessController");
const paymentCtrl = require("../controllers/paymentController");   // + AJOUT

// --- Routes admin (protégées) ---
router.get("/", auth, requireRole("SUPER_ADMIN"), ctrl.list);
router.post("/", auth, requireRole("SUPER_ADMIN"), ctrl.create);
router.get("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.getById);
router.put("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.update);
router.delete("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.remove);

// Affecter la liste des moyens de paiement à un commerce          // + AJOUT
router.post(
  "/:businessId/payment-methods",
  auth, requireRole("SUPER_ADMIN"),
  paymentCtrl.setForBusiness
);

module.exports = router;
```

---

## 7.3 Mettre à jour `backend/src/server.js`

```javascript
// ... imports existants ...
const paymentRoutes = require("./routes/paymentRoutes");      // + AJOUT

// ... après les autres app.use ...
app.use("/api/payment-methods", paymentRoutes);               // + AJOUT
```

Le fichier complet à jour :

```javascript
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
const paymentRoutes = require("./routes/paymentRoutes");      // + AJOUT

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/public", publicRoutes);
app.use("/api", productRoutes);
app.use("/api/merchants", merchantRoutes);
app.use("/api/payment-methods", paymentRoutes);               // + AJOUT

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

## 7.4 Tester

```bash
# (TOKEN admin)

# Créer les moyens de paiement de base
for m in "Wave" "Orange Money" "MTN Money" "Moov Money" "Paiement à la livraison"; do
  curl -s -X POST http://localhost:4000/api/payment-methods \
    -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d "{\"name\":\"$m\"}" ; echo
done

# Liste publique (sans token)
curl http://localhost:4000/api/payment-methods

# Affecter Wave + Orange Money + Paiement à la livraison au commerce n°1
curl -X POST http://localhost:4000/api/businesses/1/payment-methods \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"payment_method_ids":[1,2,5]}'

# Vérifier sur la page publique : les paiements apparaissent dans le catalogue
curl http://localhost:4000/api/public/catalogue/chez-awa-food
```

---

## Points de conception importants

- **Code dérivé du nom** : chaque moyen de paiement a un `code` machine (`orange_money`) généré automatiquement à partir du nom. C'est utile côté frontend pour afficher la bonne icône/couleur sans dépendre de l'orthographe exacte.
- **`setPaymentMethods` remplace tout** : appeler la route d'affectation écrase la sélection précédente du commerce. C'est volontaire — le frontend envoie la liste complète des cases cochées, pas un ajout incrémental. Plus simple et sans état incohérent.
- **Désactiver ≠ supprimer** : passer un moyen en `is_active = false` le retire de la liste publique sans casser les commerces qui l'utilisaient déjà. Préférez ça à la suppression si un opérateur disparaît temporairement.
- **Liste publique filtrée** : `GET /api/payment-methods` ne renvoie que les moyens actifs — le frontend public n'a pas besoin de connaître les moyens désactivés.

---

## Erreurs courantes

| Erreur | Cause | Solution |
|---|---|---|
| `409 existe déjà` | Même `code` généré (noms trop proches) | Choisissez un nom distinct |
| Les paiements n'apparaissent pas sur la page publique | Association non faite | Appelez `POST /api/businesses/:id/payment-methods` |
| `payment_method_ids doit être un tableau` | Mauvais format du corps | Envoyez `{"payment_method_ids":[1,2]}` |
| Suppression bloquée | Contrainte FK | Les associations sont en cascade ; vérifiez l'import depuis `./models` |

---

## Suite (la plus importante côté business)

- **Étape 8** — **Tracking WhatsApp + stats** : enregistrer chaque clic « Commander », fournir les compteurs des dashboards admin et commerçant. C'est l'argument qui prouve la valeur de votre service.
- Puis **seeders** (Super Admin, commerçant, Chez Awa Food + produits + paiements) et **README** final.

Dites « **on continue** » pour l'Étape 8.
