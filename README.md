# CatalogueCI

Application de catalogue digital pour petits commerces avec commande WhatsApp, QR code, dashboard admin/commercant et tracking des clics.

## Structure

```text
backend/   API Express + Sequelize + MySQL
frontend/  App React + Vite + Tailwind
```

## Installation

Backend :

```bash
cd backend
npm install
mysql -u root -p < database.sql
npm run seed
npm run dev
```

Frontend :

```bash
cd frontend
npm install
npm run dev
```

URLs :

- API : `http://localhost:4000/api/health`
- Frontend : `http://localhost:5173`
- Catalogue demo : `http://localhost:5173/catalogue/chez-awa-food`

## Comptes de test

- Admin : `admin@catalogueci.com` / `Admin123@`
- Commercant : `merchant@catalogueci.com` / `Merchant123@`

## Configuration

Adaptez `backend/.env` selon votre MySQL local, surtout `DB_PASSWORD`.
En production, remplacez `JWT_SECRET`, limitez `CLIENT_URL` au vrai domaine et utilisez des migrations plutot que `sequelize.sync({ alter: true })`.
