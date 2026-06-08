const {
  Business,
  Product,
  CustomField,
  Order,
  OrderFieldValue,
  MerchantPaymentSettings,
} = require("../models");
const { canAccessBusiness } = require("../middleware/ownership");
const { isPositiveInteger, isValidEmail, isValidPhone, truncateText } = require("../utils/validators");

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
    const order = await Order.create({
      business_id: business.id,
      product_id: product.id,
      customer_name: truncateText(customer_name, 150),
      customer_phone: truncateText(customer_phone, 30),
      customer_email: customer_email ? truncateText(customer_email, 180) : null,
      total_amount: product.price,
      status: safePaymentMethod === "wave" ? "AWAITING_PAYMENT" : "PENDING",
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

    const where = { business_id: businessId };
    if (req.query.status && ORDER_STATUSES.has(req.query.status)) where.status = req.query.status;

    const orders = await Order.findAll({
      where,
      include: orderIncludes(),
      order: [["created_at", "DESC"]],
    });
    res.json(orders);
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
    res.json(await Order.findByPk(order.id, { include: orderIncludes() }));
  } catch (err) {
    next(err);
  }
};

exports.markPaymentSent = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Commande introuvable." });
    order.status = "AWAITING_VERIFICATION";
    order.payment_status = "PROCESSING";
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
