const { Product, Business } = require("../models");
const { canAccessBusiness } = require("../middleware/ownership");

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

    const { name, image_url, price, description, category, is_available } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: "Nom et prix obligatoires." });
    }

    const product = await Product.create({
      business_id: businessId,
      name,
      image_url,
      price,
      description,
      category,
      is_available: is_available ?? true,
    });
    return res.status(201).json(product);
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

    ["name", "image_url", "price", "description", "category", "is_available", "is_active"].forEach((field) => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

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
