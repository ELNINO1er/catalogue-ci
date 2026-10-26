const { Op, fn, col } = require("sequelize");
const {
  Business,
  User,
  Product,
  Order,
  Plan,
  Subscription,
  PlatformPayment,
  Category,
  StoreTemplate,
  ActivityLog,
  PlatformSetting,
} = require("../models");
const { logActivity } = require("../utils/activityLogger");
const { truncateText } = require("../utils/validators");
const { generateUniqueSlug } = require("../utils/slug");
const { clearWaveConfigCache } = require("../services/waveService");
const { clearBillingCache } = require("../services/planService");
const { getDashboardTrends } = require("../services/statsService");

function parseJson(value) {
  if (!value) return null;
  if (typeof value === "object") return JSON.stringify(value);
  try {
    return JSON.stringify(JSON.parse(value));
  } catch {
    return JSON.stringify(String(value).split(",").map((item) => item.trim()).filter(Boolean));
  }
}

exports.dashboard = async (req, res, next) => {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const yearStart = new Date(monthStart.getFullYear(), 0, 1);

    const [
      businesses,
      activeBusinesses,
      suspendedBusinesses,
      merchants,
      products,
      orders,
      platformPayments,
      monthlyRevenue,
      yearlyRevenue,
      newClientsThisMonth,
      ordersThisMonth,
      latestBusinesses,
      latestOrders,
      latestPayments,
      topBusinesses,
    ] = await Promise.all([
      Business.count(),
      Business.count({ where: { is_active: true } }),
      Business.count({ where: { is_active: false } }),
      User.count({ where: { role: "MERCHANT" } }),
      Product.count(),
      Order.count(),
      PlatformPayment.count(),
      PlatformPayment.sum("amount", { where: { status: "PAID", paid_at: { [Op.gte]: monthStart } } }),
      PlatformPayment.sum("amount", { where: { status: "PAID", paid_at: { [Op.gte]: yearStart } } }),
      Order.count({ distinct: true, col: "customer_phone", where: { created_at: { [Op.gte]: monthStart } } }),
      Order.count({ where: { created_at: { [Op.gte]: monthStart } } }),
      Business.findAll({ limit: 5, order: [["created_at", "DESC"]] }),
      Order.findAll({ limit: 5, include: [{ model: Business, as: "business", attributes: ["id", "name"] }], order: [["created_at", "DESC"]] }),
      PlatformPayment.findAll({ limit: 5, include: [{ model: Business, as: "business", attributes: ["id", "name"] }], order: [["created_at", "DESC"]] }),
      Order.findAll({
        attributes: ["business_id", [fn("COUNT", col("Order.id")), "orders_count"]],
        include: [{ model: Business, as: "business", attributes: ["id", "name", "slug"] }],
        group: ["business_id", "business.id"],
        order: [[fn("COUNT", col("Order.id")), "DESC"]],
        limit: 5,
      }),
    ]);

    res.json({
      totals: {
        businesses,
        active_businesses: activeBusinesses,
        suspended_businesses: suspendedBusinesses,
        merchants,
        products,
        orders,
        platform_payments: platformPayments,
        monthly_revenue: Number(monthlyRevenue || 0),
        yearly_revenue: Number(yearlyRevenue || 0),
        new_clients_this_month: newClientsThisMonth,
        orders_this_month: ordersThisMonth,
      },
      top_businesses: topBusinesses,
      latest_businesses: latestBusinesses,
      latest_orders: latestOrders,
      latest_payments: latestPayments,
      alerts: suspendedBusinesses ? [`${suspendedBusinesses} boutique(s) suspendue(s).`] : [],
      trends: await getDashboardTrends({ range: req.query.range, categoryBy: "business" }),
    });
  } catch (err) {
    next(err);
  }
};

// Compteurs de la cloche de l'en-tete : ce que l'admin doit traiter.
exports.notifications = async (req, res, next) => {
  try {
    const [paymentsToCheck, suspended] = await Promise.all([
      PlatformPayment.count({ where: { status: "PENDING", reference: { [Op.ne]: null } } }),
      Business.count({ where: { is_active: false } }),
    ]);
    const items = [];
    if (paymentsToCheck) items.push({ key: "payments", view: "platform-payments", label: `${paymentsToCheck} paiement(s) d'abonnement a valider` });
    if (suspended) items.push({ key: "suspended", view: "businesses", label: `${suspended} boutique(s) suspendue(s)` });
    res.json({ total: paymentsToCheck, items });
  } catch (err) {
    next(err);
  }
};

exports.listPlans = async (req, res, next) => {
  try {
    res.json(await Plan.findAll({ order: [["price", "ASC"]] }));
  } catch (err) {
    next(err);
  }
};

exports.createPlan = async (req, res, next) => {
  try {
    const plan = await Plan.create({
      name: truncateText(req.body.name, 100),
      price: Number(req.body.price || 0),
      product_limit: req.body.product_limit || null,
      order_limit: req.body.order_limit || null,
      features_json: parseJson(req.body.features_json),
      is_active: req.body.is_active ?? true,
    });
    await logActivity(req, { action: "CREATE_PLAN", module: "plans", details: { id: plan.id } });
    res.status(201).json(plan);
  } catch (err) {
    next(err);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan introuvable." });
    ["name", "price", "product_limit", "order_limit", "is_active"].forEach((field) => {
      if (req.body[field] !== undefined) plan[field] = req.body[field];
    });
    if (req.body.features_json !== undefined) plan.features_json = parseJson(req.body.features_json);
    await plan.save();
    await logActivity(req, { action: "UPDATE_PLAN", module: "plans", details: { id: plan.id } });
    res.json(plan);
  } catch (err) {
    next(err);
  }
};

exports.listSubscriptions = async (req, res, next) => {
  try {
    res.json(await Subscription.findAll({
      include: [
        { model: Business, as: "business", attributes: ["id", "name", "slug"] },
        { model: Plan, as: "plan" },
      ],
      order: [["created_at", "DESC"]],
    }));
  } catch (err) {
    next(err);
  }
};

exports.upsertSubscription = async (req, res, next) => {
  try {
    const { business_id, plan_id, status, starts_at, ends_at } = req.body;
    const business = await Business.findByPk(business_id);
    const plan = await Plan.findByPk(plan_id);
    if (!business || !plan) return res.status(400).json({ success: false, message: "Boutique ou plan invalide." });

    const [subscription] = await Subscription.findOrCreate({
      where: { business_id },
      defaults: { business_id, plan_id, status: status || "TRIAL", starts_at, ends_at },
    });
    Object.assign(subscription, { plan_id, status: status || subscription.status, starts_at, ends_at });
    await subscription.save();
    await logActivity(req, { action: "UPSERT_SUBSCRIPTION", module: "subscriptions", business_id, details: { id: subscription.id } });
    res.json(subscription);
  } catch (err) {
    next(err);
  }
};

exports.listPlatformPayments = async (req, res, next) => {
  try {
    res.json(await PlatformPayment.findAll({
      include: [
        { model: Business, as: "business", attributes: ["id", "name", "slug"] },
        { model: Plan, as: "plan", attributes: ["id", "name", "price"] },
      ],
      order: [["created_at", "DESC"]],
    }));
  } catch (err) {
    next(err);
  }
};

exports.createPlatformPayment = async (req, res, next) => {
  try {
    const payment = await PlatformPayment.create({
      business_id: req.body.business_id,
      subscription_id: req.body.subscription_id || null,
      plan_id: req.body.plan_id || null,
      amount: Number(req.body.amount || 0),
      method: truncateText(req.body.method || "wave", 50),
      status: req.body.status || "PENDING",
      reference: truncateText(req.body.reference, 120),
      paid_at: req.body.status === "PAID" ? new Date() : null,
    });
    await logActivity(req, { action: "CREATE_PLATFORM_PAYMENT", module: "platform_payments", business_id: payment.business_id, details: { id: payment.id } });
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
};

exports.updatePlatformPayment = async (req, res, next) => {
  try {
    const payment = await PlatformPayment.findByPk(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Paiement introuvable." });

    const wasPending = payment.status !== "PAID";
    if (req.body.status !== undefined && !["PENDING", "PAID", "FAILED", "CANCELLED"].includes(req.body.status)) {
      return res.status(400).json({ success: false, message: "Statut de paiement invalide." });
    }
    ["amount", "method", "status", "reference"].forEach((field) => {
      if (req.body[field] !== undefined) payment[field] = req.body[field];
    });
    if (req.body.status === "PAID" && !payment.paid_at) payment.paid_at = new Date();
    await payment.save();

    // Paiement confirme : on applique le plan demande et on prolonge d'un mois
    // (a partir de la fin actuelle si l'abonnement payant est encore en cours).
    if (wasPending && payment.status === "PAID") {
      let subscription = payment.subscription_id
        ? await Subscription.findByPk(payment.subscription_id)
        : await Subscription.findOne({ where: { business_id: payment.business_id }, order: [["created_at", "DESC"]] });
      const planId = payment.plan_id || subscription?.plan_id;

      if (planId) {
        const now = new Date();
        const stillRunning = subscription?.status === "ACTIVE" && subscription.plan_id === planId
          && subscription.ends_at && new Date(subscription.ends_at) > now;
        const endsAt = new Date(stillRunning ? subscription.ends_at : now);
        endsAt.setMonth(endsAt.getMonth() + 1);

        if (subscription) {
          Object.assign(subscription, {
            plan_id: planId,
            status: "ACTIVE",
            starts_at: stillRunning ? subscription.starts_at : now,
            ends_at: endsAt,
          });
          await subscription.save();
        } else {
          subscription = await Subscription.create({ business_id: payment.business_id, plan_id: planId, status: "ACTIVE", starts_at: now, ends_at: endsAt });
        }
        if (!payment.subscription_id) {
          payment.subscription_id = subscription.id;
          await payment.save();
        }
      }
    }
    // Paiement refuse : l'abonnement reste tel quel (le commercant peut reessayer).

    await logActivity(req, { action: "UPDATE_PLATFORM_PAYMENT", module: "platform_payments", business_id: payment.business_id, details: { id: payment.id, status: payment.status } });
    res.json(payment);
  } catch (err) {
    next(err);
  }
};

exports.listCategories = async (req, res, next) => {
  try {
    res.json(await Category.findAll({ order: [["name", "ASC"]] }));
  } catch (err) {
    next(err);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const category = await Category.create({
      name: truncateText(req.body.name, 100),
      slug: await generateUniqueSlug(Category, req.body.name || "categorie"),
    });
    await logActivity(req, { action: "CREATE_CATEGORY", module: "categories", details: { id: category.id } });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

exports.listTemplates = async (req, res, next) => {
  try {
    res.json(await StoreTemplate.findAll({ order: [["name", "ASC"]] }));
  } catch (err) {
    next(err);
  }
};

exports.createTemplate = async (req, res, next) => {
  try {
    const template = await StoreTemplate.create({
      name: truncateText(req.body.name, 100),
      slug: await generateUniqueSlug(StoreTemplate, req.body.name || "template"),
      description: truncateText(req.body.description, 1000),
      colors_json: parseJson(req.body.colors_json),
      is_premium: Boolean(req.body.is_premium),
      is_active: req.body.is_active ?? true,
    });
    await logActivity(req, { action: "CREATE_TEMPLATE", module: "templates", details: { id: template.id } });
    res.status(201).json(template);
  } catch (err) {
    next(err);
  }
};

exports.listLogs = async (req, res, next) => {
  try {
    res.json(await ActivityLog.findAll({
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email"] },
        { model: Business, as: "business", attributes: ["id", "name", "slug"] },
      ],
      order: [["created_at", "DESC"]],
      limit: Number(req.query.limit || 100),
    }));
  } catch (err) {
    next(err);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    const rows = await PlatformSetting.findAll();
    const sensitiveKeys = new Set(["wave_api_key", "wave_signing_secret", "wave_webhook_secret"]);
    const settings = {};
    for (const row of rows) {
      if (sensitiveKeys.has(row.key) && row.value) {
        settings[row.key] = row.value.slice(0, 6) + "****" + row.value.slice(-4);
      } else {
        settings[row.key] = row.value;
      }
    }
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

exports.saveSettings = async (req, res, next) => {
  try {
    const allowed = [
      "platform_name", "currency", "country", "support_email", "support_whatsapp", "maintenance_mode",
      "wave_api_key", "wave_signing_secret", "wave_webhook_secret", "wave_currency", "wave_checkout_enabled",
      "platform_wave_number", "platform_wave_name", "platform_payment_instructions",
      "billing_enabled",
    ];
    let waveChanged = false;
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        const [setting] = await PlatformSetting.findOrCreate({ where: { key }, defaults: { value: "" } });
        setting.value = truncateText(req.body[key], 2000);
        await setting.save();
        if (key.startsWith("wave_")) waveChanged = true;
      }
    }
    if (waveChanged) clearWaveConfigCache();
    if (req.body.billing_enabled !== undefined) clearBillingCache();
    await logActivity(req, { action: "UPDATE_PLATFORM_SETTINGS", module: "settings" });
    exports.getSettings(req, res, next);
  } catch (err) {
    next(err);
  }
};

exports.getWaveStatus = async (req, res, next) => {
  try {
    const { isWaveCheckoutAvailable } = require("../services/waveService");
    const available = await isWaveCheckoutAvailable();
    res.json({ wave_checkout_available: available });
  } catch (err) {
    next(err);
  }
};
