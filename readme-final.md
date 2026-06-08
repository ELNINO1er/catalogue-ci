# 📱 Catalogue Digital WhatsApp

Plateforme de catalogues digitaux pour les petits commerces d'Abidjan : restaurants, boutiques, salons, services. Chaque commerce dispose d'une page publique avec ses produits, un bouton de commande WhatsApp, un QR code, ses moyens de paiement mobile money, sa localisation et son contact.

**Stack** : React + Tailwind CSS · Node.js + Express · MySQL (Sequelize) · JWT · bcrypt

---

## 📋 Sommaire

1. Fonctionnalités
2. Architecture
3. Prérequis
4. Installation backend
5. Installation frontend
6. Connecter le frontend au backend
7. Identifiants de test
8. Récapitulatif de l'API
9. Déploiement
10. Modèle économique

---

## 1. Fonctionnalités

**Trois rôles :**
- `SUPER_ADMIN` — gère tous les commerces, les commerçants, les catégories et les moyens de paiement ; consulte les statistiques globales.
- `MERCHANT` — gère uniquement son commerce et ses produits ; consulte ses statistiques et son QR code.
- `CUSTOMER_PUBLIC` — consulte la page publique, commande via WhatsApp, appelle, localise (sans connexion).

**Côté client :** page publique responsive, bouton « Commander sur WhatsApp » avec message pré-rempli, QR code, moyens de paiement, horaires, localisation.

**Suivi :** chaque clic « Commander » est enregistré → statistiques de demandes par commerce et top produits.

---

## 2. Architecture

```text
digital-catalogue-whatsapp/
│
├── frontend/                 # React + Tailwind (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/         # appels API (axios/fetch)
│   │   ├── utils/            # generateWhatsAppLink, etc.
│   │   ├── routes/
│   │   └── App.jsx
│   └── package.json
│
├── backend/                  # Node.js + Express + MySQL
│   ├── src/
│   │   ├── config/           # database.js
│   │   ├── controllers/      # auth, business, product, merchant, payment, tracking
│   │   ├── middleware/       # auth, role, ownership, errorHandler
│   │   ├── models/           # index.js + 7 modèles
│   │   ├── routes/
│   │   ├── utils/            # jwt.js, slug.js
│   │   └── server.js
│   ├── seeders/seed.js
│   ├── database.sql
│   └── package.json
│
└── README.md
```

---

## 3. Prérequis

- **Node.js** ≥ 18
- **MySQL** ≥ 8 (ou MariaDB ≥ 10.4)
- **npm** (ou yarn / pnpm)

---

## 4. Installation backend

```bash
cd backend

# 1. Dépendances
npm install

# 2. Configuration
cp .env.example .env
#   → renseignez DB_PASSWORD et un JWT_SECRET solide

# 3. Créer la base (optionnel : server.js la synchronise aussi)
mysql -u root -p < database.sql

# 4. Lancer le serveur (crée/synchronise les tables)
npm run dev

# 5. Remplir les données de test
npm run seed
```

API disponible sur **http://localhost:4000**. Test : `curl http://localhost:4000/api/health`.

**Variables `.env` :**

```text
PORT=4000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=catalogue_ci
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
JWT_SECRET=une_longue_chaine_aleatoire
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

---

## 5. Installation frontend

Le prototype React livré sert de **référence d'interface**. Pour une vraie app Vite :

```bash
# À la racine du projet
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install react-router-dom axios qrcode.react

# Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Dans `tailwind.config.js`, configurez les chemins :

```javascript
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

Dans `src/index.css` (en tête) :

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Créez `frontend/.env` :

```text
VITE_API_URL=http://localhost:4000/api
```

Lancez : `npm run dev` → **http://localhost:5173**.

---

## 6. Connecter le frontend au backend

### 6.1 Client API — `frontend/src/services/api.js`

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
});

// joindre le token JWT à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// déconnexion auto si token expiré
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
    }
    return Promise.reject(err);
  }
);

export default api;
```

### 6.2 Service d'authentification — `frontend/src/services/authService.js`

```javascript
import api from "./api";

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  localStorage.setItem("token", data.token);
  return data.user; // { id, name, role, business_id }
}

export async function me() {
  const { data } = await api.get("/auth/me");
  return data.user;
}

export function logout() {
  localStorage.removeItem("token");
}
```

### 6.3 Vrai QR code — remplacer le faux QR du prototype

```jsx
import { QRCodeCanvas } from "qrcode.react";

function BusinessQR({ slug }) {
  const url = `${window.location.origin}/catalogue/${slug}`;
  return <QRCodeCanvas value={url} size={200} includeMargin />;
}
```

> Le prototype utilisait un QR décoratif ; en production, `qrcode.react` génère un vrai QR scannable pointant vers la page publique.

---

## 7. Identifiants de test

Après `npm run seed` :

| Rôle | Email | Mot de passe |
|---|---|---|
| 👑 Super Admin | `admin@catalogueci.com` | `Admin123@` |
| 🏪 Commerçant | `merchant@catalogueci.com` | `Merchant123@` |

Page publique de démo : `/catalogue/chez-awa-food`

---

## 8. Récapitulatif de l'API

Base : `http://localhost:4000/api`

### Authentification
| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Connexion, renvoie le token JWT |
| GET | `/auth/me` | Connecté | Profil de l'utilisateur courant |

### Commerces
| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/businesses` | Admin | Liste (recherche, filtre catégorie) |
| POST | `/businesses` | Admin | Créer (slug auto) |
| GET | `/businesses/:id` | Admin | Détail |
| PUT | `/businesses/:id` | Admin | Modifier |
| DELETE | `/businesses/:id` | Admin | Supprimer |
| POST | `/businesses/:id/payment-methods` | Admin | Affecter les moyens de paiement |
| GET | `/businesses/:id/stats` | Admin / propriétaire | Statistiques du commerce |
| GET | `/public/catalogue/:slug` | Public | Page publique (produits actifs) |

### Produits
| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/businesses/:businessId/products` | Admin / propriétaire | Lister |
| POST | `/businesses/:businessId/products` | Admin / propriétaire | Créer |
| GET | `/products/:id` | Admin / propriétaire | Détail |
| PUT | `/products/:id` | Admin / propriétaire | Modifier |
| DELETE | `/products/:id` | Admin / propriétaire | Supprimer |

### Commerçants
| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/merchants` | Admin | Lister |
| POST | `/merchants` | Admin | Créer un compte |
| PUT | `/merchants/:id` | Admin | Modifier / associer |
| PATCH | `/merchants/:id/disable` | Admin | Activer / désactiver |

### Moyens de paiement
| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| GET | `/payment-methods` | Public | Moyens actifs |
| GET | `/payment-methods/all` | Admin | Tous |
| POST | `/payment-methods` | Admin | Créer |
| PUT | `/payment-methods/:id` | Admin | Modifier |
| DELETE | `/payment-methods/:id` | Admin | Supprimer |

### Tracking & statistiques
| Méthode | Endpoint | Accès | Description |
|---|---|---|---|
| POST | `/tracking/whatsapp-click` | Public | Enregistrer un clic « Commander » |
| GET | `/stats/overview` | Admin | Chiffres globaux du dashboard |
| GET | `/businesses/:id/stats` | Admin / propriétaire | Stats d'un commerce |

---

## 9. Déploiement

**Recommandations :**
- **Backend** : un VPS (Hetzner, Contabo, OVH) ou Railway/Render. Lancez via `pm2 start src/server.js`. En production : `NODE_ENV=production`, `app.set("trust proxy", 1)`, et passez de `sequelize.sync({ alter })` à de vraies migrations.
- **Base** : MySQL managé ou sur le même VPS, avec sauvegardes quotidiennes.
- **Frontend** : build statique (`npm run build`) hébergé sur Netlify, Vercel ou le même serveur via Nginx.
- **HTTPS** : indispensable (Let's Encrypt). WhatsApp et les QR codes inspirent confiance sur un domaine sécurisé.
- **Images** : passez à Cloudinary pour `logo_url` / `image_url` (upload géré, redimensionnement automatique).

**Checklist sécurité avant mise en ligne :**
- [ ] `JWT_SECRET` long et unique en production
- [ ] `.env` jamais versionné
- [ ] CORS restreint à votre vrai domaine frontend
- [ ] `trust proxy` activé derrière Nginx
- [ ] Migrations au lieu de `sync({ alter: true })`
- [ ] Sauvegardes automatiques de la base

---

## 10. Modèle économique

**Objectif : 100 000 FCFA / mois.**

Pistes de tarification (à adapter au marché local) :
- **Création** : forfait unique par commerce (mise en place, photos, QR code imprimé).
- **Abonnement mensuel** : hébergement + maintenance + modifications. C'est le revenu récurrent qui assure les 100 000 FCFA/mois.

Quelques scénarios indicatifs :
- 20 commerces × 5 000 FCFA/mois = 100 000 FCFA/mois
- 10 commerces × 10 000 FCFA/mois = 100 000 FCFA/mois

**Argument de vente clé** : les statistiques. Au renouvellement, montrez le tableau de bord — « votre catalogue a généré X demandes WhatsApp ce mois-ci, voici vos produits les plus demandés ». La donnée transforme un abonnement en évidence.

**Astuces terrain :**
- Imprimez le **QR code sur un autocollant/chevalet** à poser sur le comptoir ou la devanture.
- Faites une **démo en 2 minutes** avec « Chez Awa Food » (le prototype) directement sur votre téléphone.
- Proposez le **premier mois offert** pour lever la friction, puis facturez une fois la valeur prouvée par les stats.

---

🎉 **Le projet est complet : backend fonctionnel, frontend de référence, API documentée et données de test.** Bonne commercialisation à Abidjan !
