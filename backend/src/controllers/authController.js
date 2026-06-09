const bcrypt = require("bcryptjs");
const slugify = require("slugify");
const { User, Business, Subscription, Plan } = require("../models");
const { signToken } = require("../utils/jwt");
const { validatePasswordStrength } = require("../utils/passwordPolicy");
const { isValidEmail, isValidPhone, truncateText } = require("../utils/validators");
const { notifyAdminNewMerchant, sendWelcomeEmail } = require("../services/emailService");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Identifiants invalides." });

    const token = signToken({ id: user.id, role: user.role });
    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        business_id: user.business_id,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, business_name, whatsapp_number, business_category } = req.body;

    // Validation
    if (!name || !email || !password || !business_name || !whatsapp_number) {
      return res.status(400).json({ message: "Tous les champs obligatoires doivent etre remplis." });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Adresse email invalide." });
    }

    if (!isValidPhone(whatsapp_number)) {
      return res.status(400).json({ message: "Numero WhatsApp invalide." });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Check duplicate email
    const existing = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (existing) {
      return res.status(409).json({ message: "Un compte avec cet email existe deja." });
    }

    // Create business
    let baseSlug = slugify(business_name, { lower: true, strict: true });
    if (!baseSlug) baseSlug = "boutique";
    let slug = baseSlug;
    let suffix = 1;
    while (await Business.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const business = await Business.create({
      name: truncateText(business_name, 150),
      slug,
      whatsapp_number: whatsapp_number.trim(),
      description: business_category || null,
      is_active: true,
    });

    // Create user
    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: truncateText(name, 150),
      email: email.trim().toLowerCase(),
      password_hash,
      role: "MERCHANT",
      business_id: business.id,
      is_active: true,
    });

    // Auto-assign free plan if one exists
    const freePlan = await Plan.findOne({ where: { price: 0, is_active: true } });
    if (freePlan) {
      const now = new Date();
      const endsAt = new Date(now);
      endsAt.setFullYear(endsAt.getFullYear() + 10);
      await Subscription.create({
        business_id: business.id,
        plan_id: freePlan.id,
        status: "ACTIVE",
        starts_at: now,
        ends_at: endsAt,
      });
    }

    // Send emails (non-blocking)
    notifyAdminNewMerchant({
      merchantName: user.name,
      merchantEmail: user.email,
      businessName: business.name,
      businessPhone: business.whatsapp_number,
    });
    sendWelcomeEmail({
      merchantName: user.name,
      merchantEmail: user.email,
      businessName: business.name,
      businessSlug: business.slug,
    });

    // Auto-login
    const token = signToken({ id: user.id, role: user.role });
    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        business_id: business.id,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password_hash"] },
      include: [{ model: Business, as: "business" }],
    });
    return res.json({ user });
  } catch (err) {
    next(err);
  }
};
