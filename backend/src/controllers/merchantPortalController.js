const { Op, fn, col, literal } = require("sequelize");
const {
  Business,
  Category,
  Product,
  Order,
  OrderTracking,
  Subscription,
  Plan,
  StoreTemplate,
} = require("../models");
const { generateUniqueSlug } = require("../utils/slug");
const { truncateText } = require("../utils/validators");

function getBusinessId(req) {
  return req.user?.business_id;
}

function startOfDay() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfMonth() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date;
}

async function getCurrentSubscription(businessId) {
  return Subscription.findOne({
    where: {
      business_id: businessId,
      status: { [Op.in]: ["TRIAL", "ACTIVE", "SUSPENDED", "EXPIRED"] },
    },
    include: [{ model: Plan, as: "plan" }],
    order: [["created_at", "DESC"]],
  });
}

function businessIncludes() {
  return [
    { model: Category, as: "category" },
    { model: StoreTemplate, as: "template" },
    { model: Product, as: "products", attributes: ["id"] },
    { model: Subscription, as: "subscriptions", include: [{ model: Plan, as: "plan" }] },
  ];
}

async function loadOwnedBusiness(req, res) {
  const businessId = getBusinessId(req);
  if (!businessId) {
    res.status(403).json({ success: false, message: "Compte commercant non associe a une boutique." });
    return null;
  }

  const business = await Business.findByPk(businessId, { include: businessIncludes() });
  if (!business) {
    res.status(404).json({ success: false, message: "Boutique introuvable." });
    return null;
  }
  return business;
}

exports.dashboard = async (req, res, next) => {
  try {
    const business = await loadOwnedBusiness(req, res);
    if (!business) return;

    const today = startOfDay();
    const month = startOfMonth();
    const businessId = business.id;

    const [
      subscription,
      productsCount,
      ordersToday,
      ordersMonth,
      totalSales,
      pendingPayments,
      untreatedOrders,
      whatsappClicks,
      topProducts,
    ] = await Promise.all([
      getCurrentSubscription(businessId),
      Product.count({ where: { business_id: businessId, is_active: true } }),
      Order.count({ where: { business_id: businessId, created_at: { [Op.gte]: today } } }),
      Order.count({ where: { business_id: businessId, created_at: { [Op.gte]: month } } }),
      Order.sum("total_amount", { where: { business_id: businessId, payment_status: "PAID" } }),
      Order.count({ where: { business_id: businessId, payment_status: { [Op.in]: ["PENDING", "PROCESSING"] } } }),
      Order.count({ where: { business_id: businessId, status: { [Op.in]: ["PENDING", "AWAITING_PAYMENT", "AWAITING_VERIFICATION"] } } }),
      OrderTracking.count({ where: { business_id: businessId } }),
      Order.findAll({
        where: { business_id: businessId },
        attributes: ["product_id", [fn("COUNT", col("Order.id")), "orders_count"]],
        include: [{ model: Product, as: "product", attributes: ["id", "name"] }],
        group: ["product_id", "product.id"],
        order: [[literal("orders_count"), "DESC"]],
        limit: 5,
      }),
    ]);

    const json = business.toJSON();
    json.products_count = productsCount;
    delete json.products;
    delete json.subscriptions;

    res.json({
      business: json,
      subscription,
      stats: {
        products_count: productsCount,
        orders_today: ordersToday,
        orders_month: ordersMonth,
        total_sales: Number(totalSales || 0),
        pending_payments: pendingPayments,
        untreated_orders: untreatedOrders,
        whatsapp_clicks: whatsappClicks,
        top_products: topProducts.map((item) => ({
          product_id: item.product_id,
          name: item.product?.name || "Produit supprime",
          orders_count: Number(item.get("orders_count")),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getBusiness = async (req, res, next) => {
  try {
    const business = await loadOwnedBusiness(req, res);
    if (!business) return;
    res.json(business);
  } catch (err) {
    next(err);
  }
};

exports.updateBusiness = async (req, res, next) => {
  try {
    const business = await loadOwnedBusiness(req, res);
    if (!business) return;

    const fields = [
      "logo_url",
      "banner_url",
      "description",
      "category_id",
      "template_id",
      "whatsapp_number",
      "phone_number",
      "email",
      "address",
      "google_maps_url",
      "opening_hours",
      "terms_text",
      "delivery_policy",
      "welcome_message",
      "primary_color",
      "secondary_color",
      "button_color",
      "display_style",
      "theme_mode",
      "font_family",
    ];

    if (req.body.name && req.body.name !== business.name) {
      business.name = truncateText(req.body.name, 150);
      business.slug = await generateUniqueSlug(Business, business.name);
    }

    if (req.body.template_id) {
      const template = await StoreTemplate.findByPk(req.body.template_id);
      const subscription = await getCurrentSubscription(business.id);
      const hasPaidPlan = Number(subscription?.plan?.price || 0) > 0;
      if (!template || !template.is_active) {
        return res.status(400).json({ success: false, message: "Template invalide." });
      }
      if (template.is_premium && !hasPaidPlan) {
        return res.status(403).json({ success: false, message: "Ce template est reserve aux plans payants." });
      }
    }

    fields.forEach((field) => {
      if (req.body[field] !== undefined) business[field] = req.body[field] || null;
    });

    await business.save();
    res.json(await Business.findByPk(business.id, { include: businessIncludes() }));
  } catch (err) {
    next(err);
  }
};

exports.listTemplates = async (req, res, next) => {
  try {
    const businessId = getBusinessId(req);
    const subscription = businessId ? await getCurrentSubscription(businessId) : null;
    const hasPaidPlan = Number(subscription?.plan?.price || 0) > 0;
    const where = hasPaidPlan ? { is_active: true } : { is_active: true, is_premium: false };
    res.json(await StoreTemplate.findAll({ where, order: [["name", "ASC"]] }));
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
