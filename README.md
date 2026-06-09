# CatalogueCI

Plateforme SaaS multi-commerce pour petits commerces en Cote d'Ivoire. Catalogue digital, QR code, commandes WhatsApp, paiement Wave, dashboard admin/commercant.

## Structure

```text
backend/   API Express + Sequelize + MySQL
frontend/  App React + Vite + Tailwind CSS
```

## Installation

1. Copiez et configurez les variables d'environnement :

```bash
cp backend/.env.example backend/.env
# Editez backend/.env avec vos identifiants DB, email admin, etc.
```

2. Backend :

```bash
cd backend
npm install
npm run dev
```

3. Seed (premiere utilisation) :

```bash
cd backend
node seeders/seed.js
```

4. Frontend :

```bash
cd frontend
npm install
npm run dev
```

## URLs

- API : `http://localhost:4000/api/health`
- Frontend : `http://localhost:5173`
- Catalogue demo : `http://localhost:5173/catalogue/chez-awa-food`

## Comptes

Les identifiants sont configures dans `backend/.env` via les variables `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD`. Voir `.env.example` pour le detail.

## Configuration

Adaptez `backend/.env` selon votre environnement :
- `DB_*` : connexion MySQL
- `JWT_SECRET` : cle secrete JWT (min 32 caracteres en production)
- `SEED_ADMIN_*` : identifiants Super Admin
- `SMTP_*` : configuration email (optionnel)
- `WAVE_*` : integration Wave API (optionnel)
- `ADMIN_EMAIL` : email qui recoit les notifications d'inscription
