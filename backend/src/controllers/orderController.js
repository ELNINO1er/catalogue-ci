const {
  Business,
  Product,
  CustomField,
  Order,
  OrderFieldValue,
  MerchantPaymentSettings,
} = require("../models");
const { canAccessBusiness } = require("../middleware/ownership");
const { createCheckoutSession } = require("../services/waveService");
const { isPositiveInteger, isValidEmail, isValidPhone, truncateText } = require("../utils/validators");
const { logActivity } = require("../utils/activityLogger");

const ORDER_STATUSES = new Set([
  "PENDING",
  "AWAITING_PAYMENT",
  "AWAITING_VERIFICATION",
  "PAID",
  "CONFIRMED",
  "IN_PROGRESS",
  "READY",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

const PAYMENT_STATUSES = new Set(["PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED", "REFUNDED"]);

function normalizeFieldValues(field_values) {
  if (!field_values) return {};
  if (Array.isArray(field_values)) {
    return field_values.reduce((acc, item) => {
      if (item?.field_id !== undefined) acc[String(item.field_id)] = item.value;
      return acc;
    }, {});
  }
  return field_values;
}

function validateValueForField(field, value) {
  const text = value === undefined || value === null ? "" : String(value).trim();
  if (field.is_required && !text) return `${field.label} est obligatoire.`;
  if (!text) return null;
  if (field.field_type === "email" && !isValidEmail(text)) return `${field.label} doit etre un email valide.`;
  if (field.field_type === "phone" && !isValidPhone(text)) return `${field.label} doit etre un telephone valide.`;
  if (field.field_type === "number" && Number.isNaN(Number(text))) return `${field.label} doit etre un nombre.`;
  return null;
}

function orderIncludes() {
  return [
    { model: Product, as: "product", attributes: ["id", "name", "price"] },
    {
      model: OrderFieldValue,
      as: "fieldValues",
      include: [{ model: CustomField, as: "field", attributes: ["id", "label", "field_type"] }],
    },
  ];
}

function publicOrderPayload(order) {
  const json = order.toJSON();
  return {
    id: json.id,
    customer_name: json.customer_name,
    customer_phone: json.customer_phone,
    customer_email: json.customer_email,
    total_amount: json.total_amount,
    status: json.status,
    payment_status: json.payment_status,
    payment_method: json.payment_method,
    wave_checkout_session_id: json.wave_checkout_session_id,
    wave_launch_url: json.wave_launch_url,
    created_at: json.created_at,
    product: json.product,
    fieldValues: json.fieldValues,
  };
}

function getAllowedPaymentMethods(settings = {}) {
  const allowed = new Set();
  if (settings.is_wave_checkout_enabled) allowed.add("wave_checkout");
  if (settings.is_wave_enabled) allowed.add("wave");
  if (settings.is_cod_enabled) allowed.add("cod");
  if (settings.is_whatsapp_enabled !== false) allowed.add("whatsapp");
  return allowed;
}

exports.createPublic = async (req, res, next) => {
  try {
    const business = await Business.findOne({
      where: { slug: req.params.slug, is_active: true },
      include: [{ model: MerchantPaymentSettings, as: "paymentSettings" }],
    });
    if (!business) return res.status(404).json({ success: false, message: "Catalogue introuvable." });

    const { product_id, customer_name, customer_phone, customer_email, payment_method, field_values } = req.body;
    if (!isPositiveInteger(product_id)) {
      return res.status(400).json({ success: false, message: "product_id invalide." });
    }
    if (!customer_name || truncateText(customer_name, 150).length < 2) {
      return res.status(400).json({ success: false, message: "Nom client obligatoire." });
    }
    if (!isValidPhone(customer_phone)) {
      return res.status(400).json({ success: false, message: "Telephone client invalide." });
    }
    if (customer_email && !isValidEmail(customer_email)) {
      return res.status(400).json({ success: false, message: "Email client invalide." });
    }

    const product = await Product.findOne({
      where: { id: product_id, business_id: business.id, is_active: true },
    });
    if (!product) {
      return res.status(400).json({ success: false, message: "Produit indisponible pour ce commerce." });
    }

    const fields = await CustomField.findAll({
      where: { product_id: product.id, business_id: business.id },
      order: [["sort_order", "ASC"]],
    });
    const values = normalizeFieldValues(field_values);

    for (const field of fields) {
      const error = validateValueForField(field, values[String(field.id)]);
      if (error) return res.status(400).json({ success: false, message: error });
    }

    const safePaymentMethod = payment_method ? truncateText(payment_method, 50) : null;
    const allowedPaymentMethods = getAllowedPaymentMethods(business.paymentSettings || {});
    if (safePaymentMethod && !allowedPaymentMethods.has(safePaymentMethod)) {
      return res.status(400).json({ success: false, message: "Methode de paiement indisponible pour cette boutique." });
    }

    const order = await Order.create({
      business_id: business.id,
      product_id: product.id,
      customer_name: truncateText(customer_name, 150),
      customer_phone: truncateText(customer_phone, 30),
      customer_email: customer_email ? truncateText(customer_email, 180) : null,
      total_amount: product.price,
      status: ["wave", "wave_checkout"].includes(safePaymentMethod) ? "AWAITING_PAYMENT" : "PENDING",
      payment_status: "PENDING",
      payment_method: safePaymentMethod,
    });

    for (const field of fields) {
      const rawValue = values[String(field.id)];
      if (rawValue !== undefined && rawValue !== null && String(rawValue).trim() !== "") {
        await OrderFieldValue.create({
          order_id: order.id,
          field_id: field.id,
          value: truncateText(rawValue, 1000),
        });
      }
    }

    const fullOrder = await Order.findByPk(order.id, { include: orderIncludes() });
    res.status(201).json({
      success: true,
      order: fullOrder,
      payment_settings: business.paymentSettings || null,
    });
  } catch (err) {
    next(err);
  }
};

exports.listByBusiness = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    if (!canAccessBusiness(req.user, businessId)) {
      return res.status(403).json({ success: false, message: "Acces refuse a ce commerce." });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const offset = (page - 1) * limit;

    const where = { business_id: businessId };
    if (req.query.status && ORDER_STATUSES.has(req.query.status)) where.status = req.query.status;

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: orderIncludes(),
      order: [["created_at", "DESC"]],
      limit,
      offset,
      distinct: true,
    });
    res.json({ data: rows, pagination: { page, limit, total: count, pages: Math.ceil(count / limit) } });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: orderIncludes() });
    if (!order) return res.status(404).json({ success: false, message: "Commande introuvable." });
    if (!canAccessBusiness(req.user, order.business_id)) {
      return res.status(403).json({ success: false, message: "Acces refuse a cette commande." });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Commande introuvable." });
    if (!canAccessBusiness(req.user, order.business_id)) {
      return res.status(403).json({ success: false, message: "Acces refuse a cette commande." });
    }

    const { status, payment_status } = req.body;
    if (status !== undefined) {
      if (!ORDER_STATUSES.has(status)) return res.status(400).json({ success: false, message: "Statut commande invalide." });
      order.status = status;
    }
    if (payment_status !== undefined) {
      if (!PAYMENT_STATUSES.has(payment_status)) return res.status(400).json({ success: false, message: "Statut paiement invalide." });
      order.payment_status = payment_status;
    }

    await order.save();
    logActivity(req, { action: "update_order_status", module: "order", business_id: order.business_id, details: { order_id: order.id, status: order.status, payment_status: order.payment_status } });
    res.json(await Order.findByPk(order.id, { include: orderIncludes() }));
  } catch (err) {
    next(err);
  }
};

exports.markPaymentSent = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Commande introuvable." });

    const customerPhone = req.body?.customer_phone ? truncateText(req.body.customer_phone, 30) : null;
    if (!customerPhone || customerPhone !== order.customer_phone) {
      return res.status(403).json({ success: false, message: "Telephone invalide pour cette commande." });
    }

    if (order.payment_status === "PAID") {
      return res.status(400).json({ success: false, message: "Cette commande est deja payee." });
    }

    order.status = "AWAITING_VERIFICATION";
    order.payment_status = "PROCESSING";
    await order.save();
    res.json({ success: true, order: publicOrderPayload(await Order.findByPk(order.id, { include: orderIncludes() })) });
  } catch (err) {
    next(err);
  }
};

exports.createWaveCheckout = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: orderIncludes() });
    if (!order) return res.status(404).json({ success: false, message: "Commande introuvable." });

    if (order.payment_method !== "wave_checkout") {
      return res.status(400).json({ success: false, message: "Cette commande n'utilise pas Wave Checkout." });
    }

    if (order.payment_status === "PAID") {
      return res.status(400).json({ success: false, message: "Cette commande est deja payee." });
    }

    if (order.wave_launch_url && order.wave_checkout_session_id) {
      return res.json({
        success: true,
        order: publicOrderPayload(order),
        checkout: {
          id: order.wave_checkout_session_id,
          wave_launch_url: order.wave_launch_url,
        },
      });
    }

    const business = await Business.findByPk(order.business_id, {
      include: [{ model: MerchantPaymentSettings, as: "paymentSettings" }],
    });
    if (!business || !business.paymentSettings?.is_wave_checkout_enabled) {
      return res.status(400).json({ success: false, message: "Wave Checkout n'est pas active pour cette boutique." });
    }

    const customerPhone = req.body?.customer_phone ? truncateText(req.body.customer_phone, 30) : null;
    if (customerPhone && customerPhone !== order.customer_phone) {
      return res.status(403).json({ success: false, message: "Acces refuse a cette commande." });
    }

    const session = await createCheckoutSession({ req, order });
    const waveLaunchUrl = session.wave_launch_url || session.launch_url || session.checkout_url;
    if (!waveLaunchUrl) {
      return res.status(502).json({ success: false, message: "Wave n'a pas retourne de lien de paiement." });
    }

    order.wave_checkout_session_id = session.id || session.session_id || null;
    order.wave_launch_url = waveLaunchUrl;
    order.status = "AWAITING_PAYMENT";
    order.payment_status = "PENDING";
    await order.save();

    res.json({
      success: true,
      order: publicOrderPayload(await Order.findByPk(order.id, { include: orderIncludes() })),
      checkout: {
        id: order.wave_checkout_session_id,
        wave_launch_url: waveLaunchUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.trackPublic = async (req, res, next) => {
  try {
    const { order_id, customer_phone } = req.body;
    if (!isPositiveInteger(order_id)) {
      return res.status(400).json({ success: false, message: "Numero de commande invalide." });
    }
    if (!isValidPhone(customer_phone)) {
      return res.status(400).json({ success: false, message: "Telephone client invalide." });
    }

    const order = await Order.findOne({
      where: {
        id: Number(order_id),
        customer_phone: truncateText(customer_phone, 30),
      },
      include: orderIncludes(),
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Commande introuvable avec ces informations." });
    }

    res.json({ success: true, order: publicOrderPayload(order) });
  } catch (err) {
    next(err);
  }
};
