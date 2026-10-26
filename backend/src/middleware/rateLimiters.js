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

const orderTrackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("Trop de recherches de commande. Reessayez dans quelques minutes."),
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("Trop d'inscriptions depuis cette connexion. Reessayez plus tard."),
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("Trop de demandes de reinitialisation. Reessayez dans quelques minutes."),
});

const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: rateLimitMessage("Trop de tentatives. Reessayez dans quelques minutes."),
});

module.exports = {
  passwordResetLimiter,
  passwordChangeLimiter,
  orderTrackingLimiter,
  registerLimiter,
  loginLimiter,
  publicCatalogueLimiter,
  trackingLimiter,
  orderCreationLimiter,
  waveCheckoutLimiter,
};
