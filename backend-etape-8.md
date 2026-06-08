# Backend — Étape 8 : Tracking WhatsApp + Statistiques

Le module qui prouve la valeur du service. Il :
- **enregistre** chaque clic « Commander » (public, sans auth)
- fournit les **stats d'un commerce** (dashboard commerçant)
- fournit les **stats globales** (dashboard admin)
- documente le **branchement frontend** (appel au tracking + ouverture WhatsApp)

---

## 8.1 Contrôleur — `backend/src/controllers/trackingController.js`

```javascript
const { Op, fn, col, literal } = require("sequelize");
const {
  OrderTracking, Business, Product, User,
} = require("../models");
const { canAccessBusiness } = require("../middleware/ownership");

// Récupère l'IP réelle même derrière un proxy/Nginx
function getClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress || null;
}

// POST /api/tracking/whatsapp-click  — PUBLIC
exports.whatsappClick = async (req, res, next) => {
  try {
    const { business_id, product_id, customer_message } = req.body;
    if (!business_id)
      return res.status(400).json({ message: "business_id requis." });

    // on vérifie que le commerce existe (évite de polluer la base)
    const business = await Business.findByPk(business_id);
    if (!business) return res.status(404).json({ message: "Commerce introuvable." });

    await OrderTracking.create({
      business_id,
      product_id: product_id || null,
      customer_message: customer_message ? String(customer_message).slice(0, 1000) : null,
      ip_address: getClientIp(req),
      user_agent: (req.headers["user-agent"] || "").slice(0, 255),
    });

    // réponse légère : le frontend n'attend pas, il ouvre WhatsApp dans la foulée
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
};

// GET /api/businesses/:businessId/stats  — commerçant (son commerce) ou admin
exports.businessStats = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    if (!canAccessBusiness(req.user, businessId))
      return res.status(403).json({ message: "Accès refusé à ce commerce." });

    const totalClicks = await OrderTracking.count({ where: { business_id: businessId } });
    const productsCount = await Product.count({ where: { business_id: businessId } });

    // clics des 30 derniers jours
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const clicks30d = await OrderTracking.count({
      where: { business_id: businessId, clicked_at: { [Op.gte]: since } },
    });

    // top 5 produits les plus "cliqués"
    const topProducts = await OrderTracking.findAll({
      where: { business_id: businessId, product_id: { [Op.ne]: null } },
      attributes: ["product_id", [fn("COUNT", col("OrderTracking.id")), "clicks"]],
      include: [{ model: Product, as: "product", attributes: ["name"] }],
      group: ["product_id", "product.id"],
      order: [[literal("clicks"), "DESC"]],
      limit: 5,
    });

    res.json({
      total_clicks: totalClicks,
      clicks_30d: clicks30d,
      products_count: productsCount,
      top_products: topProducts.map((t) => ({
        product_id: t.product_id,
        name: t.product ? t.product.name : "Produit supprimé",
        clicks: Number(t.get("clicks")),
      })),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/stats/overview  — admin : chiffres globaux du dashboard
exports.adminOverview = async (req, res, next) => {
  try {
    const [businesses, products, merchants, clicks] = await Promise.all([
      Business.count(),
      Product.count(),
      User.count({ where: { role: "MERCHANT" } }),
      OrderTracking.count(),
    ]);

    const recentBusinesses = await Business.findAll({
      attributes: ["id", "name", "slug", "created_at"],
      order: [["created_at", "DESC"]],
      limit: 5,
    });

    res.json({
      totals: {
        businesses,
        products,
        merchants,
        whatsapp_clicks: clicks,
      },
      recent_businesses: recentBusinesses,
    });
  } catch (err) {
    next(err);
  }
};
```

---

## 8.2 Routes

### Tracking + overview — `backend/src/routes/trackingRoutes.js`

```javascript
const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/trackingController");

// Public : enregistrer un clic WhatsApp
router.post("/tracking/whatsapp-click", ctrl.whatsappClick);

// Admin : vue d'ensemble du dashboard
router.get("/stats/overview", auth, requireRole("SUPER_ADMIN"), ctrl.adminOverview);

module.exports = router;
```

### Stats par commerce — à ajouter dans `businessRoutes.js`

Ajoutez cette route (et l'import du contrôleur) à `backend/src/routes/businessRoutes.js` :

```javascript
const trackingCtrl = require("../controllers/trackingController");   // + AJOUT

// Stats d'un commerce (commerçant propriétaire OU admin)            // + AJOUT
router.get("/:businessId/stats", auth, trackingCtrl.businessStats);
```

> `businessStats` fait lui-même le contrôle `canAccessBusiness`, donc pas besoin de `requireRole` ici : un commerçant accède à SON commerce, l'admin à tous.

Le fichier `businessRoutes.js` complet à ce stade :

```javascript
const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/businessController");
const paymentCtrl = require("../controllers/paymentController");
const trackingCtrl = require("../controllers/trackingController");

router.get("/", auth, requireRole("SUPER_ADMIN"), ctrl.list);
router.post("/", auth, requireRole("SUPER_ADMIN"), ctrl.create);
router.get("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.getById);
router.put("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.update);
router.delete("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.remove);

router.post(
  "/:businessId/payment-methods",
  auth, requireRole("SUPER_ADMIN"),
  paymentCtrl.setForBusiness
);

router.get("/:businessId/stats", auth, trackingCtrl.businessStats);

module.exports = router;
```

---

## 8.3 Mettre à jour `backend/src/server.js`

```javascript
// ... imports existants ...
const trackingRoutes = require("./routes/trackingRoutes");    // + AJOUT

// ... après les autres app.use ...
app.use("/api", trackingRoutes);                              // + AJOUT
```

> Monté sur `/api` car il expose deux chemins distincts : `/api/tracking/whatsapp-click` et `/api/stats/overview`.

---

## 8.4 Branchement frontend (rappel)

Quand le client clique sur « Commander », on **enregistre d'abord le clic** puis on **ouvre WhatsApp**. Voici la fonction réutilisable côté React :

```javascript
// frontend/src/utils/whatsapp.js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export function generateWhatsAppLink(number, productName, price, businessName) {
  const message = `Bonjour, je veux commander : ${productName} à ${price} FCFA chez ${businessName}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export async function orderOnWhatsApp({ business, product }) {
  const link = generateWhatsAppLink(
    business.whatsapp_number, product.name, product.price, business.name
  );
  const message = `Bonjour, je veux commander : ${product.name} à ${product.price} FCFA chez ${business.name}.`;

  // 1) enregistrer le clic (on n'attend pas l'échec : l'UX prime)
  try {
    await fetch(`${API_URL}/tracking/whatsapp-click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        business_id: business.id,
        product_id: product.id,
        customer_message: message,
      }),
      keepalive: true, // permet l'envoi même si l'onglet change
    });
  } catch (_) {
    /* on ignore : ne jamais bloquer la commande à cause du tracking */
  }

  // 2) ouvrir WhatsApp
  window.open(link, "_blank");
}
```

> Le `keepalive: true` garantit que la requête de tracking part même si le navigateur ouvre WhatsApp immédiatement après. Et on enveloppe dans un `try/catch` silencieux : **le tracking ne doit jamais empêcher une commande**.

---

## 8.5 Tester

```bash
# Enregistrer un clic (public, sans token)
curl -X POST http://localhost:4000/api/tracking/whatsapp-click \
  -H "Content-Type: application/json" \
  -d '{"business_id":1,"product_id":1,"customer_message":"Bonjour, je veux commander : Garba complet à 1500 FCFA chez Chez Awa Food."}'

# Stats du commerce n°1 (commerçant ou admin)
curl http://localhost:4000/api/businesses/1/stats \
  -H "Authorization: Bearer $TOKEN"
# → { total_clicks, clicks_30d, products_count, top_products: [...] }

# Vue d'ensemble admin
curl http://localhost:4000/api/stats/overview \
  -H "Authorization: Bearer $TOKEN"
```

---

## Points de conception importants

- **Le tracking ne bloque jamais la commande** : côté frontend, l'appel est en `try/catch` silencieux avec `keepalive`. Si le réseau échoue, le client va quand même sur WhatsApp. La donnée statistique est précieuse, mais jamais au prix d'une vente perdue.
- **Capture de l'IP derrière un proxy** : `getClientIp` lit `x-forwarded-for` en premier. En production derrière Nginx, pensez à `app.set("trust proxy", 1)` dans `server.js` pour que l'IP soit fiable.
- **Robustesse de la base** : on vérifie l'existence du commerce avant d'insérer, et on tronque `customer_message` (1000) et `user_agent` (255) pour respecter les colonnes et éviter les abus.
- **Top produits = argument de vente** : `top_products` montre au commerçant ce qui intéresse le plus ses clients. C'est une donnée concrète à mettre en avant lors du renouvellement d'abonnement.
- **Stat « 30 derniers jours »** : `clicks_30d` colle à votre logique d'abonnement mensuel — « ce mois-ci, votre page a généré X demandes ».

---

## Erreurs courantes

| Erreur | Cause | Solution |
|---|---|---|
| Les clics ne s'enregistrent pas | `business_id` manquant ou erroné | Vérifiez le corps de la requête |
| `top_products` vide | Clics enregistrés sans `product_id` | Envoyez bien `product_id` côté frontend |
| IP toujours `::1` ou identique | Pas de `trust proxy` en prod | Ajoutez `app.set("trust proxy", 1)` |
| `clicks_30d` = `total_clicks` | Normal si toutes les données ont < 30 jours | Rien à corriger |

---

## Suite — on arrive au bout 🎉

- **Étape 9** — **Seeders** : créer automatiquement le Super Admin, le commerçant, « Chez Awa Food » + produits + moyens de paiement (vos données de test).
- **Étape 10** — **README final** : installation, commandes, structure, identifiants de test, et le récapitulatif complet de l'API.

Dites « **on continue** » pour les seeders.
