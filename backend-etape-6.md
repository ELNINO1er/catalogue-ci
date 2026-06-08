# Backend — Étape 6 : Module Commerçants (merchants)

Réservé au `SUPER_ADMIN`. Permet de :
- **lister** les comptes commerçants (avec leur commerce associé)
- **créer** un compte commerçant (mot de passe hashé via bcrypt)
- **associer** un commerçant à un commerce
- **modifier** un compte
- **désactiver / réactiver** un compte (sans le supprimer)

---

## 6.1 Contrôleur — `backend/src/controllers/merchantController.js`

```javascript
const bcrypt = require("bcryptjs");
const { User, Business } = require("../models");

// GET /api/merchants  — liste des commerçants
exports.list = async (req, res, next) => {
  try {
    const merchants = await User.findAll({
      where: { role: "MERCHANT" },
      attributes: { exclude: ["password_hash"] },
      include: [{ model: Business, as: "business", attributes: ["id", "name", "slug"] }],
      order: [["created_at", "DESC"]],
    });
    res.json(merchants);
  } catch (err) {
    next(err);
  }
};

// POST /api/merchants  — créer un compte commerçant
exports.create = async (req, res, next) => {
  try {
    const { name, email, password, business_id } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: "Nom, email et mot de passe obligatoires." });

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await User.findOne({ where: { email: normalizedEmail } });
    if (exists) return res.status(409).json({ message: "Cet email est déjà utilisé." });

    // si un commerce est fourni, on vérifie qu'il existe
    if (business_id) {
      const business = await Business.findByPk(business_id);
      if (!business) return res.status(404).json({ message: "Commerce introuvable." });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name, email: normalizedEmail, password_hash,
      role: "MERCHANT", business_id: business_id || null,
    });

    const { password_hash: _, ...safe } = user.toJSON();
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
};

// PUT /api/merchants/:id  — modifier un compte (et son association commerce)
exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || user.role !== "MERCHANT")
      return res.status(404).json({ message: "Commerçant introuvable." });

    const { name, email, password, business_id } = req.body;

    if (email && email.trim().toLowerCase() !== user.email) {
      const normalizedEmail = email.trim().toLowerCase();
      const exists = await User.findOne({ where: { email: normalizedEmail } });
      if (exists) return res.status(409).json({ message: "Cet email est déjà utilisé." });
      user.email = normalizedEmail;
    }

    if (business_id !== undefined) {
      if (business_id) {
        const business = await Business.findByPk(business_id);
        if (!business) return res.status(404).json({ message: "Commerce introuvable." });
      }
      user.business_id = business_id || null;
    }

    if (name) user.name = name;
    if (password) user.password_hash = await bcrypt.hash(password, 10);

    await user.save();

    const { password_hash: _, ...safe } = user.toJSON();
    res.json(safe);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/merchants/:id/disable  — bascule actif/inactif
exports.toggleActive = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || user.role !== "MERCHANT")
      return res.status(404).json({ message: "Commerçant introuvable." });

    // on accepte un is_active explicite, sinon on inverse l'état actuel
    const next_state =
      typeof req.body.is_active === "boolean" ? req.body.is_active : !user.is_active;

    user.is_active = next_state;
    await user.save();

    res.json({
      id: user.id,
      is_active: user.is_active,
      message: user.is_active ? "Compte réactivé." : "Compte désactivé.",
    });
  } catch (err) {
    next(err);
  }
};
```

---

## 6.2 Routes — `backend/src/routes/merchantRoutes.js`

```javascript
const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/merchantController");

// Tout le module est réservé au SUPER_ADMIN
router.use(auth, requireRole("SUPER_ADMIN"));

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.patch("/:id/disable", ctrl.toggleActive);

module.exports = router;
```

> Astuce : `router.use(auth, requireRole("SUPER_ADMIN"))` applique la protection à **toutes** les routes du fichier d'un coup — pas besoin de la répéter ligne par ligne.

---

## 6.3 Mettre à jour `backend/src/server.js`

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
const merchantRoutes = require("./routes/merchantRoutes");    // + AJOUT

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);
app.use("/api/public", publicRoutes);
app.use("/api", productRoutes);
app.use("/api/merchants", merchantRoutes);                    // + AJOUT

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

## 6.4 Tester

```bash
# (TOKEN admin)

# Créer un commerçant associé au commerce n°1
curl -X POST http://localhost:4000/api/merchants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Awa Koné",
    "email": "merchant@catalogueci.com",
    "password": "Merchant123@",
    "business_id": 1
  }'

# Lister les commerçants
curl http://localhost:4000/api/merchants -H "Authorization: Bearer $TOKEN"

# Désactiver le commerçant n°2
curl -X PATCH http://localhost:4000/api/merchants/2/disable \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{}'

# Vérifier : ce commerçant désactivé ne peut plus se connecter
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"merchant@catalogueci.com","password":"Merchant123@"}'
# → 401 Identifiants invalides.  (car is_active = false)
```

---

## Points de conception importants

- **Désactivation plutôt que suppression** : on garde le compte en base (`is_active = false`) au lieu de le supprimer. Ça préserve l'historique (commerce, tracking) et permet une réactivation. Le blocage à la connexion est déjà géré : le contrôleur de login et le middleware `auth` refusent tout compte `is_active = false`.
- **Le mot de passe ne ressort jamais** : `password_hash` est systématiquement exclu des réponses. À la création/modification on hashe avec bcrypt (coût 10) avant stockage.
- **Email normalisé** : on stocke et compare toujours l'email en minuscules et sans espaces, pour éviter les doublons du type `Awa@x.com` vs `awa@x.com`.
- **Association souple** : un commerçant peut être créé sans commerce (`business_id` null) puis associé plus tard via `PUT /api/merchants/:id`.

---

## Erreurs courantes

| Erreur | Cause | Solution |
|---|---|---|
| `409 Cet email est déjà utilisé` | Email en double | Utilisez un autre email |
| Le commerçant ne voit aucun produit | `business_id` non associé | Associez-le à un commerce via `PUT` |
| `401` à la connexion d'un commerçant existant | Compte désactivé | Réactivez via `PATCH .../disable` avec `{"is_active":true}` |
| `password_hash` visible dans la réponse | Oubli de l'exclusion | Vérifiez `attributes: { exclude: ['password_hash'] }` |

---

## Suite

- **Étape 7** — **payment-methods** : gestion des moyens de paiement par l'admin + association à un commerce
- **Étape 8** — **tracking WhatsApp** + **stats** (enregistrement des clics, compteurs pour les dashboards)
- **Seeders** (Super Admin, commerçant, Chez Awa Food + produits + paiements) puis **README** final

Dites « **on continue** » pour l'Étape 7.
