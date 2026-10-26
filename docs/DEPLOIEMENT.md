# Mise en production de CatalogueCI

## 1. Avant chaque déploiement

```bash
npm --prefix backend test          # 57 scénarios sur SQLite
npm --prefix backend run test:mysql # mêmes scénarios sur une base MySQL de test (créée puis supprimée)
```

Les deux doivent afficher `0 echec(s)`.

## 2. Variables d'environnement de production (`backend/.env`)

| Variable | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | 64 caractères aléatoires (ex. `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`) |
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | base MySQL de production (mot de passe obligatoire) |
| `PUBLIC_APP_URL` | `https://<votre-domaine>` (liens des emails, retour Wave) |
| `CLIENT_URL` | identique à `PUBLIC_APP_URL` |
| `FORCE_HTTPS` | `true` **seulement après avoir vérifié** que le site fonctionne en HTTPS (sinon risque de boucle de redirection) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | indispensables pour « mot de passe oublié » |
| `ADMIN_EMAIL` | reçoit les alertes de nouvelles inscriptions |
| `WAVE_*` | seulement si Wave Checkout est utilisé |

Le serveur **refuse de démarrer** en production si `JWT_SECRET` est trop court ou d'exemple, si `PUBLIC_APP_URL` manque ou si `DB_PASSWORD` est vide.

## 3. Déployer

```bash
bash deploy.sh
```

Le script lance les tests, construit le frontend, le copie dans `backend/public`, puis installe les dépendances de production. Envoyez ensuite le dossier `backend/` sur l'hébergeur (point d'entrée : `backend/src/server.js`).

Au démarrage, les nouvelles colonnes de la base sont ajoutées automatiquement (rien à faire à la main).

## 4. Recette manuelle sur la vraie base (15 minutes)

À faire après chaque mise en ligne, avec un compte de test :

1. **Inscription** : créer une boutique, cocher les CGU → arrivée sur l'assistant.
2. **Onboarding** : remplir les étapes, publier → le lien `/catalogue/...` s'ouvre.
3. **Produit** : ajouter un produit avec photo, le modifier (prix), le rendre indisponible puis disponible.
4. **Commande client** (navigation privée) : commander, payer en « Wave manuel », cliquer « J'ai envoyé le paiement » → la commande apparaît « Paiement à vérifier » côté commerçant, la cloche affiche 1.
5. **Suivi** : `/suivi-commande` avec le numéro et le téléphone → statut affiché.
6. **Mot de passe oublié** : demander un lien, recevoir l'email, changer le mot de passe → l'ancien ne marche plus.
7. **Admin** : voir la boutique dans « Boutiques », la suspendre → le commerçant est déconnecté ; la réactiver.
8. **Pages légales** : `/cgu` et `/confidentialite` s'affichent, liens présents sur l'accueil et l'inscription.
9. **Mobile** : refaire 4 et 5 sur un téléphone.

## 5. À mettre en place côté hébergeur

- **Sauvegardes quotidiennes** de la base MySQL et du dossier `backend/uploads/` (photos).
- **Surveillance** : une sonde sur `https://<domaine>/api/health` (ex. UptimeRobot, gratuit).
- **HTTPS** actif sur le domaine, puis `FORCE_HTTPS=true`.
