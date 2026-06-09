const { Op } = require("sequelize");
const {
  Business,
  Category,
  Product,
  PaymentMethod,
  CustomField,
  MerchantPaymentSettings,
  StoreTemplate,
  Subscription,
  Plan,
} = require("../models");
const { generateUniqueSlug } = require("../utils/slug");
const { logActivity } = require("../utils/activityLogger");

function addOneMonth(date = new Date()) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + 1);
  return next;
}

async function applyPlanToBusiness(businessId, planId) {
  if (!planId) return null;

  const plan = await Plan.findByPk(planId);
  if (!plan || !plan.is_active) {
    const error = new Error("Plan invalide ou inactif.");
    error.status = 400;
    throw error;
  }

  const now = new Date();
  const [subscription] = await Subscription.findOrCreate({
    where: { business_id: businessId },
    defaults: {
      business_id: businessId,
      plan_id: plan.id,
      status: "ACTIVE",
      starts_at: now,
      ends_at: addOneMonth(now),
    },
  });

  subscription.plan_id = plan.id;
  subscription.status = "ACTIVE";
  subscription.starts_at = subscription.starts_at || now;
  subscription.ends_at = subscription.ends_at || addOneMonth(now);
  await subscription.save();
  return subscription;
}

exports.list = async (req, res, next) => {
  try {
    const { search, category_id } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (category_id) where.category_id = Number(category_id);

    const { count, rows } = await Business.findAndCountAll({
      where,
      include: [
        { model: Category, as: "category" },
        { model: StoreTemplate, as: "template", attributes: ["id", "name", "slug", "is_premium", "colors_json"] },
        { model: Subscription, as: "subscriptions", include: [{ model: Plan, as: "plan" }] },
        { model: Product, as: "products", attributes: ["id"] },
      ],
      order: [["created_at", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.json({
      data: rows.map((business) => {
        const json = business.toJSON();
        json.products_count = json.products ? json.products.length : 0;
        json.current_subscription = (json.subscriptions || []).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )[0] || null;
        delete json.products;
        delete json.subscriptions;
        return json;
      }),
      pagination: { page, limit, total: count, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const business = await Business.findByPk(req.params.id, {
      include: [
        { model: Category, as: "category" },
        { model: StoreTemplate, as: "template" },
        { model: Subscription, as: "subscriptions", include: [{ model: Plan, as: "plan" }] },
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
      template_id,
      plan_id,
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
      template_id: template_id || null,
      whatsapp_number,
      phone_number,
      address,
      google_maps_url,
      opening_hours,
    });

    if (Array.isArray(payment_method_ids)) {
      await business.setPaymentMethods(payment_method_ids);
    }

    if (plan_id) {
      await applyPlanToBusiness(business.id, plan_id);
    }

    logActivity(req, { action: "create_business", module: "business", business_id: business.id, details: { name } });
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
      "template_id",
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

    if (req.body.plan_id) {
      await applyPlanToBusiness(business.id, req.body.plan_id);
    }

    logActivity(req, { action: "update_business", module: "business", business_id: business.id, details: { name: business.name } });
    return res.json(business);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const business = await Business.findByPk(req.params.id);
    if (!business) return res.status(404).json({ message: "Commerce introuvable." });
    const businessName = business.name;
    await business.destroy();
    logActivity(req, { action: "delete_business", module: "business", business_id: business.id, details: { name: businessName } });
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
        { model: StoreTemplate, as: "template", attributes: ["id", "name", "slug", "colors_json", "is_premium"] },
        {
          model: Product,
          as: "products",
          where: { is_active: true },
          required: false,
          attributes: ["id", "name", "image_url", "price", "description", "is_available"],
          include: [
            {
              model: CustomField,
              as: "customFields",
              attributes: ["id", "label", "field_type", "options_json", "is_required", "sort_order"],
            },
          ],
        },
        {
          model: PaymentMethod,
          as: "paymentMethods",
          attributes: ["id", "name", "code"],
          through: { attributes: [] },
        },
        {
          model: MerchantPaymentSettings,
          as: "paymentSettings",
          attributes: [
            "wave_phone_number",
            "wave_account_name",
            "payment_instructions",
            "payment_mode",
            "is_wave_checkout_enabled",
            "is_wave_enabled",
            "is_cod_enabled",
            "is_whatsapp_enabled",
          ],
        },
      ],
      attributes: { exclude: ["category_id", "is_active", "created_at", "updated_at"] },
      order: [
        [{ model: Product, as: "products" }, "created_at", "DESC"],
        [{ model: Product, as: "products" }, { model: CustomField, as: "customFields" }, "sort_order", "ASC"],
      ],
    });

    if (!business) return res.status(404).json({ message: "Catalogue introuvable." });
    return res.json(business);
  } catch (err) {
    next(err);
  }
};
