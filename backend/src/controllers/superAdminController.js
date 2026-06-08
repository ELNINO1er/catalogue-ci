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
    });
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
      include: [{ model: Business, as: "business", attributes: ["id", "name", "slug"] }],
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
    ["amount", "method", "status", "reference"].forEach((field) => {
      if (req.body[field] !== undefined) payment[field] = req.body[field];
    });
    if (req.body.status === "PAID" && !payment.paid_at) payment.paid_at = new Date();
    await payment.save();
    await logActivity(req, { action: "UPDATE_PLATFORM_PAYMENT", module: "platform_payments", business_id: payment.business_id, details: { id: payment.id } });
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
    res.json(rows.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {}));
  } catch (err) {
    next(err);
  }
};

exports.saveSettings = async (req, res, next) => {
  try {
    const allowed = ["platform_name", "currency", "country", "support_email", "support_whatsapp", "maintenance_mode"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        const [setting] = await PlatformSetting.findOrCreate({ where: { key }, defaults: { value: "" } });
        setting.value = truncateText(req.body[key], 2000);
        await setting.save();
      }
    }
    await logActivity(req, { action: "UPDATE_PLATFORM_SETTINGS", module: "settings" });
    exports.getSettings(req, res, next);
  } catch (err) {
    next(err);
  }
};
