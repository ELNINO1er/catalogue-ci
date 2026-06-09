const rateLimit = require("express-rate-limit");

function rateLimitMessage(message) {
  return {
    success: false,
    message,
  };
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("Trop de tentatives de connexion. Reessayez dans quelques minutes."),
});

const publicCatalogueLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("Trop de consultations du catalogue. Reessayez dans quelques minutes."),
});

const trackingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("Trop de demandes WhatsApp. Reessayez dans quelques minutes."),
});

const orderCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("Trop de commandes creees. Reessayez dans quelques minutes."),
});

const waveCheckoutLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("Trop de tentatives de paiement. Reessayez dans quelques minutes."),
});

module.exports = {
  loginLimiter,
  publicCatalogueLimiter,
  trackingLimiter,
  orderCreationLimiter,
  waveCheckoutLimiter,
};
