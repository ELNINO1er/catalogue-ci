const { Subscription, Plan, Product, Order } = require("../models");
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
 * Get the active subscription for a business (TRIAL or ACTIVE, not expired).
 * Returns { subscription, plan, isExpired, isTrial, daysLeft } or null.
 */
async function getBusinessSubscription(businessId) {
  const subscription = await Subscription.findOne({
    where: {
      business_id: businessId,
      status: { [Op.in]: ["TRIAL", "ACTIVE"] },
    },
    include: [{ model: Plan, as: "plan" }],
    order: [["created_at", "DESC"]],
  });

  if (!subscription) return null;

  const now = new Date();
  const isExpired = subscription.ends_at && new Date(subscription.ends_at) < now;
  const isTrial = subscription.status === "TRIAL";
  const daysLeft = subscription.ends_at
    ? Math.max(0, Math.ceil((new Date(subscription.ends_at) - now) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    subscription,
    plan: subscription.plan,
    isExpired,
    isTrial,
    daysLeft,
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
    subscription: {
      id: sub.subscription.id,
      status: sub.subscription.status,
      starts_at: sub.subscription.starts_at,
      ends_at: sub.subscription.ends_at,
    },
  };
}

module.exports = {
  FEATURES,
  getBusinessSubscription,
  parsePlanFeatures,
  canUseFeature,
  checkProductLimit,
  checkOrderLimit,
  getBusinessPlanInfo,
};
