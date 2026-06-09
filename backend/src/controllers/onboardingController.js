const {
  Business,
  Category,
  StoreTemplate,
  MerchantPaymentSettings,
  MessageTemplate,
  Product,
  CustomField,
  Subscription,
  Plan,
} = require("../models");
const { truncateText, isValidPhone, isValidEmail } = require("../utils/validators");

const HEX_RE = /^#[0-9A-Fa-f]{3,8}$/;
const URL_RE = /^https?:\/\/.+/i;
const SAFE_URL = (v) => v && URL_RE.test(v) && !v.toLowerCase().includes("javascript:");

function getBusinessId(req) {
  return req.user?.business_id;
}

// GET /api/merchant/onboarding — load all data for the wizard
exports.getData = async (req, res, next) => {
  try {
    const businessId = getBusinessId(req);
    if (!businessId) return res.status(400).json({ success: false, message: "Aucune boutique associee." });

    const [business, paymentSettings, messageTemplates, products, categories, templates] = await Promise.all([
      Business.findByPk(businessId, { include: [{ model: Category, as: "category" }, { model: StoreTemplate, as: "template" }] }),
      MerchantPaymentSettings.findOne({ where: { business_id: businessId } }),
      MessageTemplate.findAll({ where: { business_id: businessId }, order: [["type", "ASC"]] }),
      Product.findAll({ where: { business_id: businessId, is_active: true }, limit: 10, order: [["created_at", "DESC"]], include: [{ model: CustomField, as: "customFields" }] }),
      Category.findAll({ where: {}, order: [["name", "ASC"]] }),
      StoreTemplate.findAll({ where: { is_active: true }, order: [["name", "ASC"]] }),
    ]);

    if (!business) return res.status(404).json({ success: false, message: "Boutique introuvable." });

    res.json({
      business,
      paymentSettings,
      messageTemplates,
      products,
      categories,
      templates,
      currentStep: business.onboarding_step || 0,
      completed: business.onboarding_completed || false,
    });
  } catch (err) {
    next(err);
  }
};

// PUT /api/merchant/onboarding/step — save one step's data
exports.saveStep = async (req, res, next) => {
  try {
    const businessId = getBusinessId(req);
    if (!businessId) return res.status(400).json({ success: false, message: "Aucune boutique associee." });

    const business = await Business.findByPk(businessId);
    if (!business) return res.status(404).json({ success: false, message: "Boutique introuvable." });

    const { step, data } = req.body;
    if (step === undefined || !data) return res.status(400).json({ success: false, message: "step et data requis." });

    switch (Number(step)) {
      case 1: // Welcome — nothing to save, just advance
        break;

      case 2: // Business info
        if (data.name) business.name = truncateText(data.name, 150);
        if (data.description !== undefined) business.description = truncateText(data.description, 2000);
        if (data.category_id) business.category_id = Number(data.category_id) || null;
        if (data.city !== undefined) business.city = truncateText(data.city, 100);
        if (data.commune !== undefined) business.commune = truncateText(data.commune, 100);
        if (data.logo_url !== undefined) business.logo_url = data.logo_url ? truncateText(data.logo_url, 500) : null;
        if (data.banner_url !== undefined) business.banner_url = data.banner_url ? truncateText(data.banner_url, 500) : null;
        break;

      case 3: // Business type
        if (data.business_type) business.business_type = truncateText(data.business_type, 80);
        break;

      case 4: // Contact & location
        if (data.whatsapp_number) {
          if (!isValidPhone(data.whatsapp_number)) return res.status(400).json({ success: false, message: "Numero WhatsApp invalide." });
          business.whatsapp_number = truncateText(data.whatsapp_number, 20);
        }
        if (data.phone_number !== undefined) business.phone_number = truncateText(data.phone_number, 20) || null;
        if (data.email !== undefined) {
          if (data.email && !isValidEmail(data.email)) return res.status(400).json({ success: false, message: "Email invalide." });
          business.email = data.email ? truncateText(data.email, 180) : null;
        }
        if (data.address !== undefined) business.address = truncateText(data.address, 255) || null;
        if (data.google_maps_url !== undefined) {
          if (data.google_maps_url && !SAFE_URL(data.google_maps_url)) return res.status(400).json({ success: false, message: "URL Google Maps invalide." });
          business.google_maps_url = data.google_maps_url ? truncateText(data.google_maps_url, 500) : null;
        }
        if (data.opening_hours !== undefined) business.opening_hours = truncateText(data.opening_hours, 255) || null;
        break;

      case 5: // Payment
        await savePaymentSettings(businessId, data);
        break;

      case 6: // Design
        if (data.primary_color && HEX_RE.test(data.primary_color)) business.primary_color = data.primary_color;
        if (data.secondary_color && HEX_RE.test(data.secondary_color)) business.secondary_color = data.secondary_color;
        if (data.button_color && HEX_RE.test(data.button_color)) business.button_color = data.button_color;
        if (data.text_color && HEX_RE.test(data.text_color)) business.text_color = data.text_color;
        if (data.background_color && HEX_RE.test(data.background_color)) business.background_color = data.background_color;
        if (data.font_family) business.font_family = truncateText(data.font_family, 80);
        if (data.theme_mode) business.theme_mode = truncateText(data.theme_mode, 20);
        if (data.template_id !== undefined) business.template_id = Number(data.template_id) || null;
        if (data.display_style) business.display_style = truncateText(data.display_style, 30);
        break;

      case 7: // Messages
        if (Array.isArray(data.templates)) {
          await saveMessageTemplates(businessId, data.templates);
        }
        break;

      case 8: // Quick products — handled separately
        break;

      case 9: // Preview — nothing to save
        break;

      case 10: // Publish
        break;

      default:
        return res.status(400).json({ success: false, message: "Etape invalide." });
    }

    // Save step progress
    if (Number(step) > (business.onboarding_step || 0)) {
      business.onboarding_step = Number(step);
    }
    await business.save();

    res.json({ success: true, step: Number(step), business });
  } catch (err) {
    next(err);
  }
};

// POST /api/merchant/onboarding/complete — mark done
exports.complete = async (req, res, next) => {
  try {
    const businessId = getBusinessId(req);
    if (!businessId) return res.status(400).json({ success: false, message: "Aucune boutique associee." });

    const business = await Business.findByPk(businessId);
    if (!business) return res.status(404).json({ success: false, message: "Boutique introuvable." });

    business.onboarding_completed = true;
    business.onboarding_step = 10;
    business.is_active = true;
    await business.save();

    res.json({ success: true, business, slug: business.slug });
  } catch (err) {
    next(err);
  }
};

// POST /api/merchant/onboarding/quick-products — add up to 5 products
exports.quickProducts = async (req, res, next) => {
  try {
    const businessId = getBusinessId(req);
    if (!businessId) return res.status(400).json({ success: false, message: "Aucune boutique associee." });

    const { products } = req.body;
    if (!Array.isArray(products) || !products.length) {
      return res.status(400).json({ success: false, message: "Tableau de produits requis." });
    }

    const created = [];
    for (const p of products.slice(0, 5)) {
      if (!p.name || p.price === undefined) continue;

      const product = await Product.create({
        business_id: businessId,
        name: truncateText(p.name, 150),
        price: Math.max(0, Number(p.price) || 0),
        description: truncateText(p.description, 2000) || null,
        category: truncateText(p.category, 80) || null,
        image_url: p.image_url ? truncateText(p.image_url, 500) : null,
        is_available: p.is_available !== false,
        is_active: true,
      });

      // Auto-create suggested custom fields
      if (Array.isArray(p.suggested_fields)) {
        for (let i = 0; i < Math.min(p.suggested_fields.length, 10); i++) {
          const f = p.suggested_fields[i];
          if (!f.label || !f.field_type) continue;
          await CustomField.create({
            business_id: businessId,
            product_id: product.id,
            label: truncateText(f.label, 150),
            field_type: f.field_type,
            options_json: f.options ? JSON.stringify(f.options) : null,
            is_required: f.is_required || false,
            sort_order: i,
          });
        }
      }

      created.push(product);
    }

    res.status(201).json({ success: true, products: created });
  } catch (err) {
    next(err);
  }
};

// POST /api/merchant/onboarding/upload-image — upload logo or banner
exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier envoye." });
    const imageUrl = `/uploads/businesses/${req.file.filename}`;
    res.json({ success: true, image_url: imageUrl });
  } catch (err) {
    next(err);
  }
};

// POST /api/merchant/onboarding/upload-product-image — upload product image
exports.uploadProductImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier envoye." });
    const imageUrl = `/uploads/products/${req.file.filename}`;
    res.json({ success: true, image_url: imageUrl });
  } catch (err) {
    next(err);
  }
};

// ─── Helpers ───

async function savePaymentSettings(businessId, data) {
  const [settings] = await MerchantPaymentSettings.findOrCreate({
    where: { business_id: businessId },
    defaults: { business_id: businessId },
  });

  if (data.wave_phone_number !== undefined) settings.wave_phone_number = truncateText(data.wave_phone_number, 30) || null;
  if (data.wave_account_name !== undefined) settings.wave_account_name = truncateText(data.wave_account_name, 120) || null;
  if (data.is_wave_enabled !== undefined) settings.is_wave_enabled = !!data.is_wave_enabled;
  if (data.is_cod_enabled !== undefined) settings.is_cod_enabled = !!data.is_cod_enabled;
  if (data.is_whatsapp_enabled !== undefined) settings.is_whatsapp_enabled = !!data.is_whatsapp_enabled;
  if (data.payment_instructions !== undefined) settings.payment_instructions = truncateText(data.payment_instructions, 1000) || null;

  await settings.save();
}

async function saveMessageTemplates(businessId, templates) {
  for (const t of templates) {
    if (!t.type || !t.content) continue;
    const [tmpl] = await MessageTemplate.findOrCreate({
      where: { business_id: businessId, type: t.type },
      defaults: { business_id: businessId, type: t.type, title: t.title || t.type, content: t.content },
    });
    tmpl.title = truncateText(t.title || t.type, 150);
    tmpl.content = truncateText(t.content, 2000);
    tmpl.is_active = t.is_active !== false;
    await tmpl.save();
  }
}
