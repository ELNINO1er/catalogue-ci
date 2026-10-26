const { Subscription, Plan, Product, Order, PlatformSetting } = require("../models");
const { Op } = require("sequelize");

const FEATURES = {
  CUSTOM_FIELDS: "custom_fields",
  ADVANCED_STATS: "advanced_stats",
  PDF_CATALOG: "pdf_catalog",
  PROMO_CODES: "promo_codes",
  PREMIUM_TEMPLATES: "premium_templates",
  MULTI_STAFF: "multi_staff",
};

/**
 * Mode lancement gratuit : tant que le reglage "billing_enabled" n'est pas a "true",
 * toutes les boutiques ont acces a tout, sans limite ni expiration.
 */
let _billingCache = null;
let _billingCacheTime = 0;
const BILLING_CACHE_TTL = 30_000;

async function isBillingEnabled() {
  if (_billingCache !== null && Date.now() - _billingCacheTime < BILLING_CACHE_TTL) return _billingCache;
  const setting = await PlatformSetting.findOne({ where: { key: "billing_enabled" } });
  _billingCache = setting?.value === "true";
  _billingCacheTime = Date.now();
  return _billingCache;
}

function clearBillingCache() {
  _billingCache = null;
  _billingCacheTime = 0;
}

const FREE_LAUNCH_PLAN = {
  id: null,
  name: "Lancement gratuit",
  price: 0,
  product_limit: null,
  order_limit: null,
  features_json: JSON.stringify(Object.values(FEATURES)),
};

/**
 * Get the active subscription for a business (TRIAL or ACTIVE, not expired).
 * Returns { subscription, plan, isExpired, isTrial, daysLeft } or null.
 */
async function getBusinessSubscription(businessId) {
  if (!(await isBillingEnabled())) {
    return { subscription: null, plan: FREE_LAUNCH_PLAN, isExpired: false, isTrial: false, daysLeft: null, freeMode: true };
  }

  const subscription = await Subscription.findOne({
    where: {
      business_id: businessId,
      status: { [Op.in]: ["TRIAL", "ACTIVE"] },
    },
    include: [{ model: Plan, as: "plan" }],
    order: [["created_at", "DESC"]],
  });

  const now = new Date();
  const isExpired = subscription?.ends_at && new Date(subscription.ends_at) < now;

  // Pas d'abonnement, ou essai / abonnement payant expire : on retombe sur le plan gratuit
  // s'il existe, pour que la boutique continue de recevoir des commandes (dans ses limites).
  if (!subscription || isExpired) {
    const freePlan = await Plan.findOne({ where: { is_active: true, price: 0 }, order: [["id", "ASC"]] });
    if (freePlan) {
      return { subscription, plan: freePlan, isExpired: false, isTrial: false, daysLeft: null, freeMode: false, fallbackFree: true };
    }
  }
  if (!subscription) return null;

  const isTrial = subscription.status === "TRIAL";
  const daysLeft = subscription.ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.ends_at) - now) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    subscription,
    plan: subscription.plan,
    isExpired: Boolean(isExpired),
    isTrial,
    daysLeft,
    freeMode: false,
  };
}

/**
 * Parse features_json from Plan. Returns a Set of feature keys.
 */
function parsePlanFeatures(plan) {
  if (!plan?.features_json) return new Set();
  try {
    const parsed = JSON.parse(plan.features_json);
    if (Array.isArray(parsed)) return new Set(parsed);
    if (typeof parsed === "object") return new Set(Object.keys(parsed).filter((k) => parsed[k]));
    return new Set();
  } catch {
    return new Set();
  }
}

/**
 * Check if a business can use a specific feature based on its plan.
 */
async function canUseFeature(businessId, featureKey) {
  const sub = await getBusinessSubscription(businessId);
  if (!sub || sub.isExpired) return false;
  const features = parsePlanFeatures(sub.plan);
  return features.has(featureKey);
}

/**
 * Get current product count and check against plan limit.
 * Returns { current, limit, allowed, remaining }.
 */
async function checkProductLimit(businessId) {
  const sub = await getBusinessSubscription(businessId);
  if (!sub || sub.isExpired) {
    return { current: 0, limit: 0, allowed: false, remaining: 0, reason: "Abonnement expire ou inexistant." };
  }

  const limit = sub.plan.product_limit;
  if (!limit) return { current: 0, limit: null, allowed: true, remaining: Infinity };

  const current = await Product.count({ where: { business_id: businessId, is_active: true } });
  return {
    current,
    limit,
    allowed: current < limit,
    remaining: Math.max(0, limit - current),
  };
}

/**
 * Get current monthly order count and check against plan limit.
 * Returns { current, limit, allowed, remaining }.
 */
async function checkOrderLimit(businessId) {
  const sub = await getBusinessSubscription(businessId);
  if (!sub || sub.isExpired) {
    return { current: 0, limit: 0, allowed: false, remaining: 0, reason: "Abonnement expire ou inexistant." };
  }

  const limit = sub.plan.order_limit;
  if (!limit) return { current: 0, limit: null, allowed: true, remaining: Infinity };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const current = await Order.count({
    where: {
      business_id: businessId,
      created_at: { [Op.gte]: monthStart },
    },
  });

  return {
    current,
    limit,
    allowed: current < limit,
    remaining: Math.max(0, limit - current),
  };
}

/**
 * Get full plan info for a business: subscription, limits, features.
 */
async function getBusinessPlanInfo(businessId) {
  const sub = await getBusinessSubscription(businessId);
  if (!sub) {
    return {
      freeMode: false,
      hasSubscription: false,
      isExpired: true,
      isTrial: false,
      daysLeft: 0,
      plan: null,
      features: [],
      limits: { products: { current: 0, limit: 0, allowed: false }, orders: { current: 0, limit: 0, allowed: false } },
    };
  }

  const features = parsePlanFeatures(sub.plan);
  const [products, orders] = await Promise.all([
    checkProductLimit(businessId),
    checkOrderLimit(businessId),
  ]);

  return {
    freeMode: sub.freeMode,
    fallbackFree: Boolean(sub.fallbackFree),
    hasSubscription: true,
    isExpired: sub.isExpired,
    isTrial: sub.isTrial,
    daysLeft: sub.daysLeft,
    plan: {
      id: sub.plan.id,
      name: sub.plan.name,
      price: sub.plan.price,
      product_limit: sub.plan.product_limit,
      order_limit: sub.plan.order_limit,
    },
    features: [...features],
    limits: { products, orders },
    subscription: sub.subscription && !sub.fallbackFree ? {
      id: sub.subscription.id,
      status: sub.subscription.status,
      starts_at: sub.subscription.starts_at,
      ends_at: sub.subscription.ends_at,
    } : null,
  };
}

module.exports = {
  FEATURES,
  isBillingEnabled,
  clearBillingCache,
  getBusinessSubscription,
  parsePlanFeatures,
  canUseFeature,
  checkProductLimit,
  checkOrderLimit,
  getBusinessPlanInfo,
};
