const crypto = require("crypto");

const WAVE_API_BASE_URL = "https://api.wave.com";

// Cache des clés Wave lues depuis la DB (rafraîchi toutes les 60s)
let _waveConfigCache = null;
let _waveConfigCacheTime = 0;
const CACHE_TTL = 60_000;

async function getWaveConfig() {
  if (_waveConfigCache && Date.now() - _waveConfigCacheTime < CACHE_TTL) {
    return _waveConfigCache;
  }
  try {
    const { PlatformSetting } = require("../models");
    const rows = await PlatformSetting.findAll({
      where: { key: ["wave_api_key", "wave_signing_secret", "wave_webhook_secret", "wave_currency", "wave_checkout_enabled"] },
    });
    const config = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    _waveConfigCache = config;
    _waveConfigCacheTime = Date.now();
    return config;
  } catch {
    return {};
  }
}

function clearWaveConfigCache() {
  _waveConfigCache = null;
  _waveConfigCacheTime = 0;
}

async function getWaveApiKey() {
  const config = await getWaveConfig();
  const key = config.wave_api_key || process.env.WAVE_API_KEY;
  if (!key) {
    const error = new Error("Wave Checkout n'est pas configure sur cette plateforme. Contactez l'administrateur.");
    error.status = 400;
    throw error;
  }
  return key;
}

async function getWaveSigningSecret({ required = false } = {}) {
  const config = await getWaveConfig();
  const secret = config.wave_signing_secret || config.wave_webhook_secret || process.env.WAVE_SIGNING_SECRET || process.env.WAVE_WEBHOOK_SECRET;
  if (!secret && required) {
    const error = new Error("WAVE_SIGNING_SECRET n'est pas configure.");
    error.status = 500;
    throw error;
  }
  return secret;
}

async function getWaveCurrency() {
  const config = await getWaveConfig();
  return config.wave_currency || process.env.WAVE_CURRENCY || "XOF";
}

async function isWaveCheckoutAvailable() {
  const config = await getWaveConfig();
  const enabledInDb = config.wave_checkout_enabled === "true";
  const hasApiKey = Boolean(config.wave_api_key || process.env.WAVE_API_KEY);
  const hasSecret = Boolean(config.wave_signing_secret || config.wave_webhook_secret || process.env.WAVE_SIGNING_SECRET || process.env.WAVE_WEBHOOK_SECRET);
  return enabledInDb && hasApiKey && hasSecret;
}

function getPublicAppUrl(req) {
  const configuredUrl = process.env.PUBLIC_APP_URL || process.env.CLIENT_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

function normalizeAmount(amount) {
  const value = Math.round(Number(amount));
  if (!Number.isFinite(value) || value <= 0) {
    const error = new Error("Montant Wave invalide.");
    error.status = 400;
    throw error;
  }
  return String(value);
}

function buildOrderReturnUrl(req, order) {
  const publicAppUrl = getPublicAppUrl(req);
  const phone = encodeURIComponent(order.customer_phone || "");
  return `${publicAppUrl}/suivi-commande?order=${order.id}&phone=${phone}`;
}

async function requestWave(path, options = {}) {
  const apiKey = await getWaveApiKey();
  const response = await fetch(`${WAVE_API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const error = new Error(data.message || data.error || "Wave Checkout a refuse la requete.");
    error.status = 502;
    error.details = data;
    throw error;
  }

  return data;
}

async function createCheckoutSession({ req, order }) {
  const returnUrl = buildOrderReturnUrl(req, order);
  const currency = await getWaveCurrency();
  return requestWave("/v1/checkout/sessions", {
    method: "POST",
    body: JSON.stringify({
      amount: normalizeAmount(order.total_amount),
      currency,
      client_reference: `catalogueci_order_${order.id}`,
      success_url: returnUrl,
      error_url: returnUrl,
    }),
  });
}

async function getPaymentStatus(sessionId) {
  if (!sessionId) {
    const error = new Error("Identifiant de session Wave manquant.");
    error.status = 400;
    throw error;
  }
  return requestWave(`/v1/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

function parseWaveSignature(waveSignature) {
  if (!waveSignature) return null;
  const parts = waveSignature.split(",").reduce((acc, part) => {
    const [key, value] = part.split("=");
    if (!key || !value) return acc;
    if (key === "v1") acc.signatures.push(value);
    if (key === "t") acc.timestamp = value;
    return acc;
  }, { timestamp: null, signatures: [] });

  if (!parts.timestamp || !parts.signatures.length) return null;
  return parts;
}

function isRecentTimestamp(timestamp) {
  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds)) return false;
  return Math.abs(Date.now() / 1000 - seconds) <= 5 * 60;
}

async function verifyWebhookSignature({ rawBody, waveSignature }) {
  const signingSecret = await getWaveSigningSecret({ required: true });

  const parsed = parseWaveSignature(waveSignature);
  if (!parsed || !isRecentTimestamp(parsed.timestamp)) return false;

  const payloads = [`${parsed.timestamp}${rawBody}`, `${parsed.timestamp}.${rawBody}`];
  const expectedSignatures = payloads.map((payload) => (
    crypto
      .createHmac("sha256", signingSecret)
      .update(payload)
      .digest("hex")
  ));

  return parsed.signatures.some((signature) => {
    const provided = Buffer.from(signature, "hex");
    return expectedSignatures.some((expected) => {
      const calculated = Buffer.from(expected, "hex");
      return provided.length === calculated.length && crypto.timingSafeEqual(provided, calculated);
    });
  });
}

module.exports = {
  createCheckoutSession,
  getPaymentStatus,
  verifyWebhookSignature,
  isWaveCheckoutAvailable,
  clearWaveConfigCache,
};
