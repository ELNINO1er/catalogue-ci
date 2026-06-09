#!/bin/bash
# Script de deploiement CatalogueCI pour Hostinger Cloud
set -e

echo "=== Build Frontend ==="
cd frontend
npm install
VITE_API_URL=/api npm run build
echo "Frontend build OK -> frontend/dist/"

echo ""
echo "=== Install Backend ==="
cd ../backend
npm install --production
echo "Backend dependencies OK"

echo ""
echo "=== Deploiement pret ==="
echo "Structure a uploader sur Hostinger :"
echo "  backend/       (tout le dossier)"
echo "  frontend/dist/ (seulement le build)"
echo ""
echo "Point d'entree Node.js : backend/src/server.js"
echo "Variables .env a configurer sur Hostinger"
