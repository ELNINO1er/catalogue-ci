# Backend Catalogue Digital WhatsApp — Étapes 1 → 3

Stack : **Node.js + Express + MySQL (Sequelize/mysql2) + JWT + bcrypt**

---

## ÉTAPE 1 — Architecture & initialisation

### 1.1 Créer le projet et installer les dépendances

```bash
mkdir -p digital-catalogue-whatsapp/backend
cd digital-catalogue-whatsapp/backend
npm init -y

# Dépendances de production
npm install express cors dotenv bcryptjs jsonwebtoken sequelize mysql2 slugify

# Dépendances de développement
npm install --save-dev nodemon
```

### 1.2 Structure des dossiers à créer

```text
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── role.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── index.js
│   │   ├── User.js
│   │   ├── Business.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── PaymentMethod.js
│   │   ├── BusinessPaymentMethod.js
│   │   └── OrderTracking.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── utils/
│   │   └── jwt.js
│   └── server.js
├── database.sql
├── .env
├── .env.example
├── .gitignore
└── package.json
```

Commande rapide pour tout créer d'un coup :

```bash
mkdir -p src/{config,controllers,middleware,models,routes,utils}
touch src/server.js database.sql .env .env.example .gitignore
```

### 1.3 `package.json` (scripts à ajouter)

Remplacez la section `"scripts"` par :

```json
{
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

### 1.4 `.env.example` — emplacement : `backend/.env.example`

```text
# Serveur
PORT=4000
NODE_ENV=development

# Base de données MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=catalogue_ci
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=changez_moi_par_une_longue_chaine_aleatoire
JWT_EXPIRES_IN=7d

# Frontend autorisé (CORS)
CLIENT_URL=http://localhost:5173
```

### 1.5 `.env` — emplacement : `backend/.env`

Copiez `.env.example` vers `.env` et renseignez vos vraies valeurs (surtout `DB_PASSWORD` et un `JWT_SECRET` solide) :

```bash
cp .env.example .env
```

> ⚠️ Le fichier `.env` ne doit **jamais** être versionné sur Git.

### 1.6 `.gitignore` — emplacement : `backend/.gitignore`

```text
node_modules/
.env
*.log
```

---

## ÉTAPE 2 — Base MySQL : schéma, connexion & modèles

### 2.1 Schéma SQL — emplacement : `backend/database.sql`

À exécuter une fois pour créer la base (les tables seront ensuite gérées/synchronisées par Sequelize, mais ce fichier sert de référence et permet de créer la base manuellement) :

```sql
CREATE DATABASE IF NOT EXISTS catalogue_ci
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE catalogue_ci;

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS businesses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(180) NOT NULL UNIQUE,
  logo_url VARCHAR(500),
  description TEXT,
  category_id INT,
  whatsapp_number VARCHAR(20) NOT NULL,
  phone_number VARCHAR(20),
  address VARCHAR(255),
  google_maps_url VARCHAR(500),
  opening_hours VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('SUPER_ADMIN','MERCHANT') NOT NULL DEFAULT 'MERCHANT',
  business_id INT,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  image_url VARCHAR(500),
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  description TEXT,
  category VARCHAR(100),
  is_available TINYINT(1) DEFAULT 1,
  is_active TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS business_payment_methods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  payment_method_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_biz_pm (business_id, payment_method_id)
);

CREATE TABLE IF NOT EXISTS orders_tracking (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  product_id INT,
  customer_message TEXT,
  clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(64),
  user_agent VARCHAR(255),
  FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);
```

Exécution :

```bash
mysql -u root -p < database.sql
```

### 2.2 Connexion Sequelize — `backend/src/config/database.js`

```javascript
const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    define: {
      underscored: true,      // colonnes en snake_case
      timestamps: true,       // created_at / updated_at
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = sequelize;
```

### 2.3 Modèles

#### `backend/src/models/User.js`

```javascript
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(180), allowNull: false, unique: true,
      validate: { isEmail: true } },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.ENUM("SUPER_ADMIN", "MERCHANT"), defaultValue: "MERCHANT" },
    business_id: { type: DataTypes.INTEGER, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "users" }
);

module.exports = User;
```

#### `backend/src/models/Category.js`

```javascript
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Category = sequelize.define(
  "Category",
  {
    name: { type: DataTypes.STRING(100), allowNull: false },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  },
  { tableName: "categories" }
);

module.exports = Category;
```

#### `backend/src/models/PaymentMethod.js`

```javascript
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PaymentMethod = sequelize.define(
  "PaymentMethod",
  {
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "payment_methods" }
);

module.exports = PaymentMethod;
```

#### `backend/src/models/Business.js`

```javascript
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Business = sequelize.define(
  "Business",
  {
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    logo_url: { type: DataTypes.STRING(500) },
    description: { type: DataTypes.TEXT },
    category_id: { type: DataTypes.INTEGER, allowNull: true },
    whatsapp_number: { type: DataTypes.STRING(20), allowNull: false },
    phone_number: { type: DataTypes.STRING(20) },
    address: { type: DataTypes.STRING(255) },
    google_maps_url: { type: DataTypes.STRING(500) },
    opening_hours: { type: DataTypes.STRING(255) },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "businesses" }
);

module.exports = Business;
```

#### `backend/src/models/Product.js`

```javascript
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Product = sequelize.define(
  "Product",
  {
    business_id: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(150), allowNull: false },
    image_url: { type: DataTypes.STRING(500) },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    description: { type: DataTypes.TEXT },
    category: { type: DataTypes.STRING(100) },
    is_available: { type: DataTypes.BOOLEAN, defaultValue: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "products" }
);

module.exports = Product;
```

#### `backend/src/models/BusinessPaymentMethod.js`

```javascript
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BusinessPaymentMethod = sequelize.define(
  "BusinessPaymentMethod",
  {
    business_id: { type: DataTypes.INTEGER, allowNull: false },
    payment_method_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "business_payment_methods" }
);

module.exports = BusinessPaymentMethod;
```

#### `backend/src/models/OrderTracking.js`

```javascript
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrderTracking = sequelize.define(
  "OrderTracking",
  {
    business_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: true },
    customer_message: { type: DataTypes.TEXT },
    clicked_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ip_address: { type: DataTypes.STRING(64) },
    user_agent: { type: DataTypes.STRING(255) },
  },
  { tableName: "orders_tracking", timestamps: false }
);

module.exports = OrderTracking;
```

#### `backend/src/models/index.js` (associations centralisées)

```javascript
const sequelize = require("../config/database");
const User = require("./User");
const Business = require("./Business");
const Product = require("./Product");
const Category = require("./Category");
const PaymentMethod = require("./PaymentMethod");
const BusinessPaymentMethod = require("./BusinessPaymentMethod");
const OrderTracking = require("./OrderTracking");

// Catégorie 1—N Commerces
Category.hasMany(Business, { foreignKey: "category_id", as: "businesses" });
Business.belongsTo(Category, { foreignKey: "category_id", as: "category" });

// Commerce 1—N Produits
Business.hasMany(Product, { foreignKey: "business_id", as: "products", onDelete: "CASCADE" });
Product.belongsTo(Business, { foreignKey: "business_id", as: "business" });

// Commerce 1—N Utilisateurs (commerçants)
Business.hasMany(User, { foreignKey: "business_id", as: "users" });
User.belongsTo(Business, { foreignKey: "business_id", as: "business" });

// Commerce N—N Moyens de paiement
Business.belongsToMany(PaymentMethod, {
  through: BusinessPaymentMethod, foreignKey: "business_id",
  otherKey: "payment_method_id", as: "paymentMethods",
});
PaymentMethod.belongsToMany(Business, {
  through: BusinessPaymentMethod, foreignKey: "payment_method_id",
  otherKey: "business_id", as: "businesses",
});

// Tracking
Business.hasMany(OrderTracking, { foreignKey: "business_id", as: "tracking" });
OrderTracking.belongsTo(Business, { foreignKey: "business_id", as: "business" });
OrderTracking.belongsTo(Product, { foreignKey: "product_id", as: "product" });

module.exports = {
  sequelize, User, Business, Product, Category,
  PaymentMethod, BusinessPaymentMethod, OrderTracking,
};
```

---

## ÉTAPE 3 — Authentification JWT

### 3.1 Utilitaire JWT — `backend/src/utils/jwt.js`

```javascript
const jwt = require("jsonwebtoken");

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, verifyToken };
```

### 3.2 Middleware d'authentification — `backend/src/middleware/auth.js`

```javascript
const { verifyToken } = require("../utils/jwt");
const { User } = require("../models");

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: "Token manquant." });

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active)
      return res.status(401).json({ message: "Compte invalide ou désactivé." });

    req.user = {
      id: user.id, role: user.role,
      business_id: user.business_id, name: user.name, email: user.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
};
```

### 3.3 Middleware RBAC (rôles) — `backend/src/middleware/role.js`

```javascript
// Usage : router.get('/x', auth, requireRole('SUPER_ADMIN'), handler)
module.exports = function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès refusé." });
    }
    next();
  };
};
```

### 3.4 Gestionnaire d'erreurs global — `backend/src/middleware/errorHandler.js`

```javascript
module.exports = function errorHandler(err, req, res, next) {
  console.error("Erreur:", err.message);
  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ message: "Cette ressource existe déjà." });
  }
  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({ message: err.errors.map((e) => e.message).join(", ") });
  }
  res.status(err.status || 500).json({ message: err.message || "Erreur serveur." });
};
```

### 3.5 Contrôleur d'authentification — `backend/src/controllers/authController.js`

```javascript
const bcrypt = require("bcryptjs");
const { User, Business } = require("../models");
const { signToken } = require("../utils/jwt");

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Email et mot de passe requis." });

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.is_active)
      return res.status(401).json({ message: "Identifiants invalides." });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Identifiants invalides." });

    const token = signToken({ id: user.id, role: user.role });
    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, business_id: user.business_id,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
exports.me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password_hash"] },
      include: [{ model: Business, as: "business" }],
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
```

### 3.6 Routes d'authentification — `backend/src/routes/authRoutes.js`

```javascript
const router = require("express").Router();
const auth = require("../middleware/auth");
const { login, me } = require("../controllers/authController");

router.post("/login", login);
router.get("/me", auth, me);

module.exports = router;
```

### 3.7 Point d'entrée — `backend/src/server.js`

```javascript
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { sequelize } = require("./models");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// Santé
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/auth", authRoutes);
// (les routes businesses, products, merchants, etc. seront ajoutées aux étapes suivantes)

// 404 + erreurs
app.use((req, res) => res.status(404).json({ message: "Route introuvable." }));
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion MySQL réussie.");
    // alter:true synchronise les modèles avec la base en développement
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

## Lancer et tester

```bash
# 1. Créer la base
mysql -u root -p < database.sql

# 2. Démarrer le serveur
npm run dev
```

Test rapide (sans données pour l'instant, on les ajoutera avec les seeders) :

```bash
curl http://localhost:4000/api/health
# → {"status":"ok"}
```

---

## Erreurs courantes & solutions

| Erreur | Cause probable | Solution |
|---|---|---|
| `ER_ACCESS_DENIED_ERROR` | Mauvais `DB_USER` / `DB_PASSWORD` | Vérifiez le `.env` et les droits MySQL |
| `ECONNREFUSED 127.0.0.1:3306` | MySQL non démarré | Lancez le service MySQL |
| `Unknown database 'catalogue_ci'` | Base non créée | Exécutez `database.sql` |
| `JsonWebTokenError: invalid signature` | `JWT_SECRET` modifié après émission | Reconnectez-vous pour un nouveau token |
| `Cannot read properties of undefined (sequelize)` | Import direct d'un modèle au lieu de `./models` | Importez toujours depuis `src/models/index.js` |

---

## Ce qui vient ensuite

- **Étape 4** — Modèles & routes **businesses** (CRUD admin + page publique `/api/public/catalogue/:slug`, génération du slug)
- **Étape 5** — Modèles & routes **products** (CRUD côté commerçant)
- **Étape 6+** — merchants, payment-methods, tracking WhatsApp, stats
- **Seeders** — Super Admin, commerçant test, « Chez Awa Food » + produits
- **README** final

Dites-moi « **on continue** » et je livre l'Étape 4.
