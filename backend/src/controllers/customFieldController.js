const { CustomField, Product } = require("../models");
const { canAccessBusiness } = require("../middleware/ownership");
const { isPositiveInteger, truncateText } = require("../utils/validators");

const FIELD_TYPES = new Set([
  "text",
  "textarea",
  "number",
  "phone",
  "email",
  "date",
  "time",
  "select",
  "checkbox",
  "radio",
  "file",
  "address",
]);

function parseOptions(options) {
  if (options === undefined || options === null || options === "") return null;
  if (Array.isArray(options)) return JSON.stringify(options.map((item) => String(item).trim()).filter(Boolean));
  try {
    const parsed = JSON.parse(options);
    if (!Array.isArray(parsed)) return null;
    return JSON.stringify(parsed.map((item) => String(item).trim()).filter(Boolean));
  } catch {
    return JSON.stringify(String(options).split(",").map((item) => item.trim()).filter(Boolean));
  }
}

async function getProductOrFail(productId, res) {
  if (!isPositiveInteger(productId)) {
    res.status(400).json({ success: false, message: "productId invalide." });
    return null;
  }
  const product = await Product.findByPk(productId);
  if (!product) {
    res.status(404).json({ success: false, message: "Produit introuvable." });
    return null;
  }
  return product;
}

exports.listByProduct = async (req, res, next) => {
  try {
    const product = await getProductOrFail(req.params.productId, res);
    if (!product) return;

    const fields = await CustomField.findAll({
      where: { product_id: product.id },
      order: [["sort_order", "ASC"], ["id", "ASC"]],
    });
    res.json(fields);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const product = await getProductOrFail(req.params.productId, res);
    if (!product) return;
    if (!canAccessBusiness(req.user, product.business_id)) {
      return res.status(403).json({ success: false, message: "Acces refuse a ce commerce." });
    }

    const { label, field_type, options_json, is_required, sort_order } = req.body;
    if (!label || !field_type) {
      return res.status(400).json({ success: false, message: "label et field_type sont obligatoires." });
    }
    if (!FIELD_TYPES.has(field_type)) {
      return res.status(400).json({ success: false, message: "field_type invalide." });
    }

    const field = await CustomField.create({
      business_id: product.business_id,
      product_id: product.id,
      label: truncateText(label, 150),
      field_type,
      options_json: parseOptions(options_json),
      is_required: Boolean(is_required),
      sort_order: Number(sort_order || 0),
    });

    res.status(201).json(field);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const field = await CustomField.findByPk(req.params.id);
    if (!field) return res.status(404).json({ success: false, message: "Champ introuvable." });
    if (!canAccessBusiness(req.user, field.business_id)) {
      return res.status(403).json({ success: false, message: "Acces refuse a ce commerce." });
    }

    const { label, field_type, options_json, is_required, sort_order } = req.body;
    if (field_type && !FIELD_TYPES.has(field_type)) {
      return res.status(400).json({ success: false, message: "field_type invalide." });
    }

    if (label !== undefined) field.label = truncateText(label, 150);
    if (field_type !== undefined) field.field_type = field_type;
    if (options_json !== undefined) field.options_json = parseOptions(options_json);
    if (is_required !== undefined) field.is_required = Boolean(is_required);
    if (sort_order !== undefined) field.sort_order = Number(sort_order || 0);

    await field.save();
    res.json(field);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const field = await CustomField.findByPk(req.params.id);
    if (!field) return res.status(404).json({ success: false, message: "Champ introuvable." });
    if (!canAccessBusiness(req.user, field.business_id)) {
      return res.status(403).json({ success: false, message: "Acces refuse a ce commerce." });
    }
    await field.destroy();
    res.json({ success: true, message: "Champ supprime." });
  } catch (err) {
    next(err);
  }
};
