const { Business, MerchantPaymentSettings } = require("../models");
const { canAccessBusiness } = require("../middleware/ownership");
const { isValidPhone, truncateText } = require("../utils/validators");

exports.getByBusiness = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    if (!canAccessBusiness(req.user, businessId)) {
      return res.status(403).json({ success: false, message: "Acces refuse a ce commerce." });
    }

    const business = await Business.findByPk(businessId);
    if (!business) return res.status(404).json({ success: false, message: "Commerce introuvable." });

    const [settings] = await MerchantPaymentSettings.findOrCreate({
      where: { business_id: businessId },
      defaults: { business_id: businessId },
    });

    res.json(settings);
  } catch (err) {
    next(err);
  }
};

exports.upsertByBusiness = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    if (!canAccessBusiness(req.user, businessId)) {
      return res.status(403).json({ success: false, message: "Acces refuse a ce commerce." });
    }

    const business = await Business.findByPk(businessId);
    if (!business) return res.status(404).json({ success: false, message: "Commerce introuvable." });

    const { wave_phone_number, payment_mode, is_wave_enabled, is_whatsapp_enabled } = req.body;
    if (wave_phone_number && !isValidPhone(wave_phone_number)) {
      return res.status(400).json({ success: false, message: "Numero Wave invalide." });
    }

    const [settings] = await MerchantPaymentSettings.findOrCreate({
      where: { business_id: businessId },
      defaults: { business_id: businessId },
    });

    if (is_wave_enabled && !wave_phone_number && !settings.wave_phone_number) {
      return res.status(400).json({ success: false, message: "Renseignez un numero Wave avant d'activer Wave manuel." });
    }

    if (wave_phone_number !== undefined) settings.wave_phone_number = truncateText(wave_phone_number, 30);
    if (payment_mode !== undefined) settings.payment_mode = truncateText(payment_mode, 50) || "manual";
    if (is_wave_enabled !== undefined) settings.is_wave_enabled = Boolean(is_wave_enabled);
    if (is_whatsapp_enabled !== undefined) settings.is_whatsapp_enabled = Boolean(is_whatsapp_enabled);

    await settings.save();
    res.json(settings);
  } catch (err) {
    next(err);
  }
};
