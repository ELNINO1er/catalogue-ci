const { Product, Business } = require("../models");
const { canAccessBusiness } = require("../middleware/ownership");
const { checkProductLimit } = require("../services/planService");
const { isSafeUrl, truncateText } = require("../utils/validators");

// Valide et nettoie les champs produit envoyes. Retourne { error } ou { values }.
function sanitizeProductInput(body, { partial = false } = {}) {
  const values = {};
  if (body.name !== undefined || !partial) {
    const name = truncateText(body.name, 150);
    if (!name) return { error: "Nom du produit obligatoire." };
    values.name = name;
  }
  if (body.price !== undefined || !partial) {
    const price = Number(body.price);
    if (body.price === "" || body.price === null || !Number.isFinite(price) || price < 0) {
      return { error: "Prix invalide." };
    }
    values.price = price;
  }
  if (body.image_url !== undefined) {
    if (body.image_url && !isSafeUrl(body.image_url)) return { error: "Lien d'image invalide." };
    values.image_url = body.image_url ? truncateText(body.image_url, 500) : null;
  }
  if (body.description !== undefined) values.description = truncateText(body.description, 2000) || null;
  if (body.category !== undefined) values.category = truncateText(body.category, 100) || null;
  if (body.is_available !== undefined) values.is_available = Boolean(body.is_available);
  return { values };
}

exports.listByBusiness = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    if (!canAccessBusiness(req.user, businessId)) {
      return res.status(403).json({ message: "Acces refuse a ce commerce." });
    }

    const products = await Product.findAll({
      where: { business_id: businessId },
      order: [["created_at", "DESC"]],
    });
    return res.json(products);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    if (!canAccessBusiness(req.user, businessId)) {
      return res.status(403).json({ message: "Acces refuse a ce commerce." });
    }

    const business = await Business.findByPk(businessId);
    if (!business) return res.status(404).json({ message: "Commerce introuvable." });
    if (!business.is_active) {
      return res.status(403).json({ success: false, message: "Ce commerce est suspendu." });
    }

    const { error, values } = sanitizeProductInput(req.body);
    if (error) return res.status(400).json({ success: false, message: error });

    const product = await Product.create({
      business_id: businessId,
      is_available: true,
      ...values,
    });
    return res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.uploadImage = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    if (!canAccessBusiness(req.user, businessId)) {
      return res.status(403).json({ success: false, message: "Acces refuse a ce commerce." });
    }

    const business = await Business.findByPk(businessId);
    if (!business) return res.status(404).json({ success: false, message: "Commerce introuvable." });
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image obligatoire." });
    }

    return res.status(201).json({
      success: true,
      image_url: `/uploads/products/${req.file.filename}`,
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produit introuvable." });
    if (!canAccessBusiness(req.user, product.business_id)) {
      return res.status(403).json({ message: "Acces refuse." });
    }
    return res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produit introuvable." });
    if (!canAccessBusiness(req.user, product.business_id)) {
      return res.status(403).json({ message: "Acces refuse." });
    }

    const { error, values } = sanitizeProductInput(req.body, { partial: true });
    if (error) return res.status(400).json({ success: false, message: error });

    // Reactiver un produit compte dans la limite du plan, comme une creation.
    if (req.body.is_active !== undefined) {
      const wantsActive = Boolean(req.body.is_active);
      if (wantsActive && !product.is_active) {
        const limit = await checkProductLimit(product.business_id);
        if (!limit.allowed) {
          return res.status(403).json({
            success: false,
            code: "PRODUCT_LIMIT_REACHED",
            message: `Limite de produits atteinte (${limit.current}/${limit.limit}). Passez a un plan superieur.`,
          });
        }
      }
      values.is_active = wantsActive;
    }

    Object.assign(product, values);
    await product.save();
    return res.json(product);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: "Produit introuvable." });
    if (!canAccessBusiness(req.user, product.business_id)) {
      return res.status(403).json({ message: "Acces refuse." });
    }

    await product.destroy();
    return res.json({ message: "Produit supprime." });
  } catch (err) {
    next(err);
  }
};
