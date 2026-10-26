#!/bin/bash
# Prepare CatalogueCI pour le deploiement (Hostinger). Voir docs/DEPLOIEMENT.md.
set -e
cd "$(dirname "$0")"

echo "=== Tests de l'API ==="
npm --prefix backend install
npm --prefix backend test

echo ""
echo "=== Build du frontend ==="
npm --prefix frontend install
(cd frontend && VITE_API_URL=/api npx vite build)

echo ""
echo "=== Copie du build dans backend/public (servi par Express en production) ==="
rm -rf backend/public
mkdir -p backend/public
cp -r frontend/dist/. backend/public/

echo ""
echo "=== Dependances de production ==="
npm --prefix backend install --omit=dev

echo ""
echo "Pret. Dossier a envoyer sur l'hebergeur : backend/ (avec public/)."
echo "Point d'entree Node.js : backend/src/server.js — variables a definir : voir backend/.env.example"
