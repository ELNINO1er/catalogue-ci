const { Op } = require("sequelize");
const { Business, Category, Product, PaymentMethod } = require("../models");
const { generateUniqueSlug } = require("../utils/slug");

exports.list = async (req, res, next) => {
  try {
    const { search, category_id } = req.query;
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (category_id) where.category_id = Number(category_id);

    const businesses = await Business.findAll({
      where,
      include: [
        { model: Category, as: "category" },
        { model: Product, as: "products", attributes: ["id"] },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.json(
      businesses.map((business) => {
        const json = business.toJSON();
        json.products_count = json.products ? json.products.length : 0;
        delete json.products;
        return json;
      })
    );
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const business = await Business.findByPk(req.params.id, {
      include: [
        { model: Category, as: "category" },
        { model: Product, as: "products" },
        { model: PaymentMethod, as: "paymentMethods", through: { attributes: [] } },
      ],
    });
    if (!business) return res.status(404).json({ message: "Commerce introuvable." });
    return res.json(business);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      name,
      logo_url,
      description,
      category_id,
      whatsapp_number,
      phone_number,
      address,
      google_maps_url,
      opening_hours,
      payment_method_ids,
    } = req.body;

    if (!name || !whatsapp_number) {
      return res.status(400).json({ message: "Nom et numero WhatsApp obligatoires." });
    }

    const business = await Business.create({
      name,
      slug: await generateUniqueSlug(Business, name),
      logo_url,
      description,
      category_id,
      whatsapp_number,
      phone_number,
      address,
      google_maps_url,
      opening_hours,
    });

    if (Array.isArray(payment_method_ids)) {
      await business.setPaymentMethods(payment_method_ids);
    }

    return res.status(201).json(business);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const business = await Business.findByPk(req.params.id);
    if (!business) return res.status(404).json({ message: "Commerce introuvable." });

    const fields = [
      "logo_url",
      "description",
      "category_id",
      "whatsapp_number",
      "phone_number",
      "address",
      "google_maps_url",
      "opening_hours",
      "is_active",
    ];

    if (req.body.name && req.body.name !== business.name) {
      business.name = req.body.name;
      business.slug = await generateUniqueSlug(Business, req.body.name);
    }

    fields.forEach((field) => {
      if (req.body[field] !== undefined) business[field] = req.body[field];
    });

    await business.save();

    if (Array.isArray(req.body.payment_method_ids)) {
      await business.setPaymentMethods(req.body.payment_method_ids);
    }

    return res.json(business);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const business = await Business.findByPk(req.params.id);
    if (!business) return res.status(404).json({ message: "Commerce introuvable." });
    await business.destroy();
    return res.json({ message: "Commerce supprime." });
  } catch (err) {
    next(err);
  }
};

exports.publicCatalogue = async (req, res, next) => {
  try {
    const business = await Business.findOne({
      where: { slug: req.params.slug, is_active: true },
      include: [
        { model: Category, as: "category", attributes: ["id", "name", "slug"] },
        {
          model: Product,
          as: "products",
          where: { is_active: true },
          required: false,
          attributes: ["id", "name", "image_url", "price", "description", "is_available"],
        },
        {
          model: PaymentMethod,
          as: "paymentMethods",
          attributes: ["id", "name", "code"],
          through: { attributes: [] },
        },
      ],
      attributes: { exclude: ["category_id", "is_active", "created_at", "updated_at"] },
      order: [[{ model: Product, as: "products" }, "created_at", "DESC"]],
    });

    if (!business) return res.status(404).json({ message: "Catalogue introuvable." });
    return res.json(business);
  } catch (err) {
    next(err);
  }
};
