const { checkProductLimit, checkOrderLimit, canUseFeature, getBusinessSubscription } = require("../services/planService");

/**
 * Middleware: block if business subscription is expired.
 */
function requireActiveSubscription(req, res, next) {
  const businessId = req.user?.business_id || req.params?.businessId;
  if (!businessId) return res.status(400).json({ success: false, message: "Business ID manquant." });

  getBusinessSubscription(Number(businessId))
    .then((sub) => {
      if (!sub) return res.status(403).json({ success: false, code: "NO_SUBSCRIPTION", message: "Aucun abonnement actif. Veuillez choisir un plan." });
      if (sub.isExpired) return res.status(403).json({ success: false, code: "SUBSCRIPTION_EXPIRED", message: "Votre abonnement a expire. Veuillez renouveler votre plan." });
      req.subscription = sub;
      next();
    })
    .catch(next);
}

/**
 * Middleware: block product creation if limit reached.
 */
function guardProductLimit(req, res, next) {
  const businessId = req.user?.business_id || req.params?.businessId;
  if (!businessId) return res.status(400).json({ success: false, message: "Business ID manquant." });

  checkProductLimit(Number(businessId))
    .then((result) => {
      if (!result.allowed) {
        return res.status(403).json({
          success: false,
          code: "PRODUCT_LIMIT_REACHED",
          message: `Limite de produits atteinte (${result.current}/${result.limit}). Passez a un plan superieur.`,
          limits: result,
        });
      }
      next();
    })
    .catch(next);
}

/**
 * Middleware: block order creation if monthly limit reached.
 */
function guardOrderLimit(businessId) {
  return (req, res, next) => {
    const bid = businessId || req.businessId;
    if (!bid) return next();

    checkOrderLimit(Number(bid))
      .then((result) => {
        if (!result.allowed) {
          return res.status(403).json({
            success: false,
            code: "ORDER_LIMIT_REACHED",
            message: `Limite de commandes mensuelles atteinte (${result.current}/${result.limit}).`,
            limits: result,
          });
        }
        next();
      })
      .catch(next);
  };
}

/**
 * Middleware factory: block if feature not available on plan.
 */
function requireFeature(featureKey) {
  return (req, res, next) => {
    const businessId = req.user?.business_id || req.params?.businessId;
    if (!businessId) return res.status(400).json({ success: false, message: "Business ID manquant." });

    canUseFeature(Number(businessId), featureKey)
      .then((allowed) => {
        if (!allowed) {
          return res.status(403).json({
            success: false,
            code: "FEATURE_NOT_AVAILABLE",
            message: `Cette fonctionnalite n'est pas disponible avec votre plan actuel.`,
            feature: featureKey,
          });
        }
        next();
      })
      .catch(next);
  };
}

module.exports = {
  requireActiveSubscription,
  guardProductLimit,
  guardOrderLimit,
  requireFeature,
};
