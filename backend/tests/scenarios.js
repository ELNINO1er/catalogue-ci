// Tests de bout en bout de l'API : chargent la vraie application (src/app.js) avec une base dediee.
//
//   npm test              -> base SQLite en memoire (rien a installer)
//   npm run test:mysql    -> base MySQL "catalogue_ci_test" (creee puis supprimee), identifiants de .env
//   node tests/scenarios.js --serve   -> garde l'API ouverte sur le port 4100 avec des donnees de demo
//
// La base de test est videe (sync force) : elle ne doit JAMAIS etre la base reelle.
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

require("dotenv").config({ path: path.join(__dirname, "../.env") });
const USE_MYSQL = process.argv.includes("--mysql");
const SERVE = process.argv.includes("--serve");
const TEST_DB_NAME = process.env.TEST_DB_NAME || "catalogue_ci_test";

// Environnement de test isole : pas d'email reel, pas d'appel a Wave.
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret_test_secret_test_secret_123";
process.env.WAVE_SIGNING_SECRET = "wave_test_secret";
for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "ADMIN_EMAIL", "WAVE_API_KEY", "WAVE_WEBHOOK_SECRET"]) delete process.env[key];
process.env.PUBLIC_APP_URL = "http://localhost:5173";

const { Sequelize } = require("sequelize");
const define = { underscored: true, timestamps: true, createdAt: "created_at", updatedAt: "updated_at" };
let sequelize;
if (USE_MYSQL) {
  if (TEST_DB_NAME === process.env.DB_NAME) {
    console.error(`Refus : TEST_DB_NAME (${TEST_DB_NAME}) est la base reelle.`);
    process.exit(1);
  }
  sequelize = new Sequelize(TEST_DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, port: process.env.DB_PORT || 3306, dialect: "mysql", logging: false, define,
  });
} else {
  sequelize = new Sequelize({ dialect: "sqlite", storage: ":memory:", logging: false, define });
}
// Remplace la connexion de l'application avant de charger les modeles.
const configPath = require.resolve("../src/config/database.js");
require.cache[configPath] = { id: configPath, filename: configPath, loaded: true, exports: sequelize };

// Capture des emails de reinitialisation (avant le chargement des controleurs).
const emailService = require("../src/services/emailService");
const sentResetEmails = [];
emailService.sendPasswordResetEmail = async (payload) => { sentResetEmails.push(payload); };

const bcrypt = require("bcryptjs");
const models = require("../src/models");
const app = require("../src/app");
const { clearBillingCache } = require("../src/services/planService");

let BASE;
let failures = 0;
let passes = 0;
function check(name, cond, extra) {
  if (cond) passes++;
  else failures++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${!cond && extra !== undefined ? "  -> " + JSON.stringify(extra).slice(0, 300) : ""}`);
}
async function call(method, url, body, token, headers = {}) {
  const res = await fetch(BASE + url, {
    method,
    headers: { ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: body ? (typeof body === "string" || body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, headers: res.headers };
}

async function register(n, extra = {}) {
  const res = await call("POST", "/api/auth/register", {
    name: `Marchand ${n}`, email: `m${n}@test.ci`, password: "Motdepasse@1", business_name: `Boutique ${n}`, whatsapp_number: "2250700000001", accept_terms: true, ...extra,
  });
  return res.data;
}

async function prepareDatabase() {
  if (USE_MYSQL) {
    const mysql = require("mysql2/promise");
    const conn = await mysql.createConnection({ host: process.env.DB_HOST, port: process.env.DB_PORT || 3306, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${TEST_DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.end();
  }
  await sequelize.sync({ force: true });
}

async function dropDatabase() {
  if (!USE_MYSQL || process.env.KEEP_TEST_DB === "true") return;
  await sequelize.close();
  const mysql = require("mysql2/promise");
  const conn = await mysql.createConnection({ host: process.env.DB_HOST, port: process.env.DB_PORT || 3306, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
  await conn.query(`DROP DATABASE IF EXISTS \`${TEST_DB_NAME}\``);
  await conn.end();
}

(async () => {
  console.log(`Base de test : ${USE_MYSQL ? `MySQL ${TEST_DB_NAME}` : "SQLite (memoire)"}\n`);
  await prepareDatabase();
  const { Plan, User, Business, Subscription, Product, Order } = models;
  await Plan.bulkCreate([
    { name: "Starter", price: 0, product_limit: 10, order_limit: 30, features_json: '["custom_fields"]' },
    { name: "Pro", price: 5000, product_limit: 50, order_limit: 500, features_json: '["custom_fields","advanced_stats","premium_templates"]' },
    { name: "Business", price: 15000, product_limit: null, order_limit: null, features_json: "[]" },
  ]);
  await User.create({ name: "Admin", email: "admin@test.ci", password_hash: await bcrypt.hash("Admin@1234", 4), role: "SUPER_ADMIN", is_active: true });

  const server = app.listen(SERVE ? 4100 : 0);
  BASE = `http://127.0.0.1:${server.address().port}`;
  const uploadedFiles = [];

  const admin = (await call("POST", "/api/auth/login", { email: "admin@test.ci", password: "Admin@1234" })).data.token;

  // ─── 0. Securite du serveur ───
  const health = await call("GET", "/api/health");
  check("en-tetes de securite (CSP, nosniff, sans x-powered-by)",
    /default-src 'self'/.test(health.headers.get("content-security-policy") || "") && health.headers.get("x-content-type-options") === "nosniff" && !health.headers.get("x-powered-by"),
    Object.fromEntries(health.headers));
  const big = await call("POST", "/api/auth/login", JSON.stringify({ email: "a@b.ci", password: "x".repeat(200_000) }));
  check("requete JSON trop volumineuse refusee (413)", big.status === 413, big.status);
  const badJson = await call("POST", "/api/auth/login", "{pas du json");
  check("JSON invalide -> 400 (pas 500)", badJson.status === 400, badJson);

  // ─── 1. Inscription, consentement, mode gratuit ───
  const noTerms = await call("POST", "/api/auth/register", { name: "X", email: "x@test.ci", password: "Motdepasse@1", business_name: "X", whatsapp_number: "2250700000009" });
  check("inscription sans accepter les CGU refusee", noTerms.status === 400, noTerms);
  const m1 = await register(1);
  check("inscription OK", !!m1.token, m1);
  const terms = await User.findOne({ where: { email: "m1@test.ci" } });
  check("date d'acceptation des CGU enregistree", !!terms.terms_accepted_at, terms.terms_accepted_at);
  const me = await call("GET", "/api/auth/me", null, m1.token);
  check("aucun secret dans /auth/me", me.status === 200 && !("password_hash" in me.data.user) && !("reset_token_hash" in me.data.user), Object.keys(me.data.user || {}));
  let info = (await call("GET", "/api/merchant/plan-info", null, m1.token)).data;
  check("mode gratuit actif par defaut", info.freeMode === true && info.isExpired === false, info);
  const bid1 = m1.user.business_id;
  let created = 0;
  for (let i = 0; i < 12; i++) {
    const res = await call("POST", `/api/businesses/${bid1}/products`, { name: `P${i}`, price: 1000 }, m1.token);
    if (res.status === 201) created++;
  }
  check("mode gratuit : 12 produits crees (pas de limite)", created === 12, created);
  let change = await call("POST", "/api/merchant/plans/change", { plan_id: 3 }, m1.token);
  check("mode gratuit : changement de plan refuse (FREE_MODE)", change.status === 400 && change.data.code === "FREE_MODE", change);

  // ─── 2. Envoi d'images ───
  const png = Buffer.from("89504e470d0a1a0a0000000d4948445200000001000000010806000000", "hex");
  let form = new FormData();
  form.append("image", new Blob([png], { type: "image/png" }), "piege.html");
  const up = await call("POST", `/api/businesses/${bid1}/products/image`, form, m1.token);
  check("image nommee .html : enregistree en .png", up.status === 201 && /\.png$/.test(up.data.image_url || ""), up);
  if (up.data.image_url) uploadedFiles.push(up.data.image_url);
  form = new FormData();
  form.append("image", new Blob(["<script>alert(1)</script>"], { type: "text/html" }), "x.html");
  const upHtml = await call("POST", `/api/businesses/${bid1}/products/image`, form, m1.token);
  check("fichier HTML refuse a l'envoi (400)", upHtml.status === 400, upHtml);
  if (up.data.image_url) {
    const served = await fetch(BASE + up.data.image_url);
    check("image servie avec le bon type", served.status === 200 && /image\/png/.test(served.headers.get("content-type") || ""), served.headers.get("content-type"));
  }
  const notImage = await fetch(`${BASE}/uploads/products/x.html`);
  check("/uploads ne sert jamais de HTML (404)", notImage.status === 404, notImage.status);

  // ─── 3. Mot de passe oublie ───
  const unknown = await call("POST", "/api/auth/forgot-password", { email: "inconnu@test.ci" });
  check("mot de passe oublie : email inconnu -> meme reponse, pas d'email", unknown.status === 200 && sentResetEmails.length === 0, unknown);
  const forgot = await call("POST", "/api/auth/forgot-password", { email: "M1@test.ci" });
  const resetUrl = sentResetEmails[0]?.resetUrl || "";
  const token = new URL(resetUrl || "http://x").searchParams.get("token");
  check("mot de passe oublie : lien envoye", forgot.status === 200 && /^[a-f0-9]{64}$/.test(token || ""), { forgot: forgot.data, resetUrl });
  const stored = await User.findOne({ where: { email: "m1@test.ci" } });
  check("seul le hash du jeton est stocke", stored.reset_token_hash && stored.reset_token_hash !== token, null);
  const weak = await call("POST", "/api/auth/reset-password", { token, password: "faible" });
  check("nouveau mot de passe faible refuse", weak.status === 400, weak);
  const reset = await call("POST", "/api/auth/reset-password", { token, password: "Nouveau@Pass9" });
  check("reinitialisation reussie", reset.status === 200, reset);
  const reuse = await call("POST", "/api/auth/reset-password", { token, password: "Encore@Pass9" });
  check("lien utilisable une seule fois", reuse.status === 400, reuse);
  const oldSession = await call("GET", "/api/auth/me", null, m1.token);
  check("ancienne session fermee apres changement", oldSession.status === 401, oldSession);
  const oldLogin = await call("POST", "/api/auth/login", { email: "m1@test.ci", password: "Motdepasse@1" });
  check("ancien mot de passe refuse", oldLogin.status === 401, oldLogin.status);
  const relog = await call("POST", "/api/auth/login", { email: "m1@test.ci", password: "Nouveau@Pass9" });
  check("connexion avec le nouveau mot de passe", relog.status === 200 && !!relog.data.token, relog.status);
  m1.token = relog.data.token;
  await User.update({ reset_token_hash: "a".repeat(64), reset_token_expires_at: new Date(Date.now() - 1000) }, { where: { email: "m1@test.ci" } });
  const expired = await call("POST", "/api/auth/reset-password", { token: "x".repeat(64).replace(/x/g, "a"), password: "Autre@Pass99" });
  check("lien expire refuse", expired.status === 400, expired);

  // ─── 4. Activation de la facturation ───
  const set = await call("PUT", "/api/super-admin/settings", { billing_enabled: "true" }, admin);
  check("admin active la facturation", set.status === 200 && set.data.billing_enabled === "true", set);
  clearBillingCache();

  const m2 = await register(2);
  info = (await call("GET", "/api/merchant/plan-info", null, m2.token)).data;
  check("facturation : essai 7 jours sur Pro", info.freeMode === false && info.isTrial && info.plan.name === "Pro" && info.daysLeft === 7, info);

  change = await call("POST", "/api/merchant/plans/change", { plan_id: 3 }, m2.token);
  check("demande plan payant : paiement en attente cree", change.status === 200 && change.data.payment?.status === "PENDING" && change.data.payment?.plan_id === 3, change);
  info = (await call("GET", "/api/merchant/plan-info", null, m2.token)).data;
  check("plan inchange avant paiement (toujours Pro)", info.plan.name === "Pro", info.plan);

  const noRef = await call("POST", "/api/merchant/plans/payment", { payment_id: change.data.payment.id, reference: "" }, m2.token);
  check("paiement sans reference refuse", noRef.status === 400, noRef);
  const pay = await call("POST", "/api/merchant/plans/payment", { payment_id: change.data.payment.id, reference: "TXN-42" }, m2.token);
  check("reference de paiement enregistree", pay.status === 200 && pay.data.payment.reference === "TXN-42", pay);

  const payments = (await call("GET", "/api/super-admin/platform-payments", null, admin)).data;
  check("admin voit le plan demande", payments[0]?.plan?.name === "Business", payments[0]);
  const confirm = await call("PUT", `/api/super-admin/platform-payments/${change.data.payment.id}`, { status: "PAID" }, admin);
  check("admin valide le paiement", confirm.status === 200, confirm);
  info = (await call("GET", "/api/merchant/plan-info", null, m2.token)).data;
  check("apres validation : Business actif ~1 mois", info.plan.name === "Business" && !info.isTrial && info.daysLeft >= 28 && info.daysLeft <= 31, info);

  const m3 = await register(3);
  await Subscription.update({ ends_at: new Date(Date.now() - 86400000) }, { where: { business_id: m3.user.business_id } });
  info = (await call("GET", "/api/merchant/plan-info", null, m3.token)).data;
  check("essai expire : retombe sur Starter", info.plan.name === "Starter" && info.isExpired === false && info.fallbackFree, info);

  await Subscription.update({ ends_at: new Date(Date.now() - 86400000) }, { where: { business_id: bid1 } });
  const prods = (await call("GET", `/api/businesses/${bid1}/products`, null, m1.token)).data;
  await call("PUT", `/api/products/${prods[0].id}`, { is_active: false }, m1.token);
  await call("PUT", `/api/products/${prods[1].id}`, { is_active: false }, m1.token);
  const react = await call("PUT", `/api/products/${prods[0].id}`, { is_active: true }, m1.token);
  check("reactivation au-dela de la limite refusee", react.status === 403 && react.data.code === "PRODUCT_LIMIT_REACHED", react);
  const neg = await call("PUT", `/api/products/${prods[3].id}`, { price: -5 }, m1.token);
  check("prix negatif refuse", neg.status === 400, neg);
  const edit = await call("PUT", `/api/products/${prods[3].id}`, { price: 2500, is_available: false }, m1.token);
  check("modification d'un produit", edit.status === 200 && Number(edit.data.price) === 2500 && edit.data.is_available === false, edit.data);
  const badImg = await call("PUT", `/api/products/${prods[3].id}`, { image_url: "javascript:alert(1)" }, m1.token);
  check("image_url javascript: refusee", badImg.status === 400, badImg);

  // ─── 5. Boutique ───
  const xss = await call("PUT", "/api/merchant/business", { google_maps_url: "javascript:alert(document.cookie)" }, m1.token);
  check("google_maps_url javascript: refuse", xss.status === 400, xss);
  const color = await call("PUT", "/api/merchant/business", { primary_color: "red;background:url(x)" }, m1.token);
  check("couleur invalide refusee", color.status === 400, color);
  const slugBefore = (await call("GET", "/api/merchant/business", null, m1.token)).data.slug;
  const ren = await call("PUT", "/api/merchant/business", { name: "Nouveau Nom" }, m1.token);
  check("renommage garde le slug", ren.status === 200 && ren.data.slug === slugBefore && ren.data.name === "Nouveau Nom", { before: slugBefore, after: ren.data.slug });

  // ─── 6. Commandes publiques ───
  const prod = prods[5];
  await models.MerchantPaymentSettings.create({ business_id: bid1, is_wave_checkout_enabled: true, is_wave_enabled: true, wave_phone_number: "0700000000" });
  const order = await call("POST", `/api/public/catalogue/${slugBefore}/orders`, { product_id: prod.id, customer_name: "Awa", customer_phone: "0711111111", payment_method: "wave" });
  check("commande publique creee", order.status === 201, order);
  const oid = order.data.order?.id;
  const wcNoPhone = await call("POST", `/api/orders/${oid}/wave-checkout`, {});
  check("wave-checkout sans telephone -> 404 sans donnees", wcNoPhone.status === 404 && !wcNoPhone.data.order, wcNoPhone);
  const sentBad = await call("POST", `/api/orders/${oid}/payment-sent`, { customer_phone: "0799999999" });
  check("payment-sent mauvais telephone -> 404", sentBad.status === 404, sentBad);
  const sent = await call("POST", `/api/orders/${oid}/payment-sent`, { customer_phone: "0711111111", reference: "W-1" });
  check("payment-sent bon telephone OK", sent.status === 200 && sent.data.order.status === "AWAITING_VERIFICATION", sent);
  const trackStatuses = [];
  for (let i = 0; i < 22; i++) trackStatuses.push((await call("POST", "/api/public/orders/track", { order_id: oid, customer_phone: "07000000" + String(i).padStart(2, "0") })).status);
  check("suivi commande limite (429 apres 20 essais)", trackStatuses.includes(429), trackStatuses.slice(-4));

  // ─── 7. Webhook Wave ───
  const o2 = await Order.create({ business_id: bid1, product_id: prod.id, customer_name: "Koffi", customer_phone: "0722222222", total_amount: 1000, status: "AWAITING_PAYMENT", payment_status: "PENDING", payment_method: "wave_checkout" });
  async function webhook(status) {
    const body = JSON.stringify({ type: "checkout.session.completed", data: { client_reference: `catalogueci_order_${o2.id}`, payment_status: status, transaction_id: "T1" } });
    const t = Math.floor(Date.now() / 1000);
    const sig = crypto.createHmac("sha256", "wave_test_secret").update(`${t}${body}`).digest("hex");
    return call("POST", "/api/wave/webhook", body, null, { "Wave-Signature": `t=${t},v1=${sig}` });
  }
  const bad = await call("POST", "/api/wave/webhook", JSON.stringify({ data: {} }), null, { "Wave-Signature": "t=1,v1=00" });
  check("webhook signature invalide refusee", bad.status === 401, bad);
  await webhook("succeeded");
  await o2.reload();
  check("webhook PAID applique", o2.payment_status === "PAID" && o2.status === "PAID", o2.toJSON());
  await webhook("failed");
  await o2.reload();
  check("webhook FAILED apres PAID ignore", o2.payment_status === "PAID" && o2.status === "PAID", o2.toJSON());

  // ─── 8. Tableaux de bord ───
  for (const range of ["today", "7d", "30d"]) {
    const tr = (await call("GET", `/api/super-admin/dashboard?range=${range}`, null, admin)).data.trends;
    check(`dashboard admin ${range}`, tr && tr.series.length === (range === "today" ? new Date().getHours() + 1 : range === "7d" ? 7 : 30) && tr.summary.orders >= 2 && tr.summary.revenue >= 1000, tr && { s: tr.summary, n: tr.series.length });
  }
  const mDash = (await call("GET", "/api/merchant/dashboard?range=7d", null, m1.token)).data;
  check("dashboard marchand : tendances, statuts, classement", mDash.trends?.ranking?.length > 0 && mDash.trends.statuses.in_progress >= 1, mDash.trends);
  const notif = await call("GET", "/api/merchant/notifications", null, m1.token);
  check("notifications marchand", notif.status === 200 && typeof notif.data.total === "number", notif.data);

  // ─── 9. Boutique suspendue ───
  await Business.update({ is_active: false }, { where: { id: bid1 } });
  const meSusp = await call("GET", "/api/auth/me", null, m1.token);
  check("boutique suspendue : acces API bloque", meSusp.status === 403 && meSusp.data.code === "BUSINESS_SUSPENDED", meSusp);
  const loginSusp = await call("POST", "/api/auth/login", { email: "m1@test.ci", password: "Nouveau@Pass9" });
  check("boutique suspendue : connexion refusee", loginSusp.status === 403, loginSusp);

  // ─── 10. Retour au mode gratuit ───
  await call("PUT", "/api/super-admin/settings", { billing_enabled: "false" }, admin);
  info = (await call("GET", "/api/merchant/plan-info", null, m3.token)).data;
  check("desactivation facturation : retour au mode gratuit", info.freeMode === true, info);

  // Nettoyage des images envoyees pendant le test
  for (const url of uploadedFiles) fs.rmSync(path.join(__dirname, "..", url), { force: true });

  if (SERVE) {
    await Business.update({ is_active: true, onboarding_completed: true, primary_color: "#0E7C66", button_color: "#E85D04", google_maps_url: "https://maps.google.com/?q=Abidjan" }, { where: { id: bid1 } });
    const cats = ["Plats", "Boissons", "Desserts", "Snacks"];
    const allProducts = await Product.findAll({ where: { business_id: bid1 } });
    for (const [i, p] of allProducts.entries()) await p.update({ category: cats[i % cats.length], price: 1000 + (i % 5) * 750, is_active: true });
    const statusPool = ["DELIVERED", "DELIVERED", "DELIVERED", "CONFIRMED", "IN_PROGRESS", "PENDING", "CANCELLED", "PAID"];
    for (let i = 0; i < 160; i++) {
      const p = allProducts[(i * 7) % allProducts.length];
      const st = statusPool[i % statusPool.length];
      const when = new Date(Date.now() - Math.floor(Math.random() * 30 * 86400000));
      await Order.create({
        business_id: bid1, product_id: p.id, customer_name: `Client ${i}`, customer_phone: `07${String(10000000 + (i % 60)).slice(0, 8)}`,
        total_amount: p.price, status: st, payment_status: ["DELIVERED", "CONFIRMED", "IN_PROGRESS", "PAID"].includes(st) ? "PAID" : st === "CANCELLED" ? "CANCELLED" : "PENDING",
        payment_method: "wave", created_at: when, updated_at: when,
      }, { silent: true });
    }
    console.log(`\nAPI de demo ouverte sur http://localhost:4100 (catalogue : /catalogue/${slugBefore})`);
    return;
  }

  server.close();
  await dropDatabase();
  console.log(`\n${passes} reussi(s), ${failures} echec(s)`);
  process.exit(failures ? 1 : 0);
})().catch(async (err) => {
  console.error(err);
  await dropDatabase().catch(() => {});
  process.exit(1);
});
