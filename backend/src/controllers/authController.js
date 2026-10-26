const bcrypt = require("bcryptjs");
const slugify = require("slugify");
const { Op } = require("sequelize");
const { sequelize, User, Business, Subscription, Plan } = require("../models");
const { signToken } = require("../utils/jwt");
const { validatePasswordStrength } = require("../utils/passwordPolicy");
const { isValidEmail, isValidPhone, truncateText } = require("../utils/validators");
const { notifyAdminNewMerchant, sendWelcomeEmail } = require("../services/emailService");

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    const user = await User.findOne({ where: { email: email.trim().toLowerCase() } });
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Identifiants invalides." });

    if (user.role === "MERCHANT" && user.business_id) {
      const business = await Business.findByPk(user.business_id, { attributes: ["id", "is_active"] });
      if (business && !business.is_active) {
        return res.status(403).json({ code: "BUSINESS_SUSPENDED", message: "Votre boutique est suspendue. Contactez le support." });
      }
    }

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

    let baseSlug = slugify(business_name, { lower: true, strict: true });
    if (!baseSlug) baseSlug = "boutique";
    let slug = baseSlug;
    let suffix = 1;
    while (await Business.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Boutique + compte + essai crees ensemble : en cas d'erreur, rien n'est conserve.
    const { business, user } = await sequelize.transaction(async (transaction) => {
      const business = await Business.create({
        name: truncateText(business_name, 150),
        slug,
        whatsapp_number: truncateText(whatsapp_number, 20),
        description: business_category ? truncateText(business_category, 2000) : null,
        is_active: true,
      }, { transaction });

      const user = await User.create({
        name: truncateText(name, 150),
        email: email.trim().toLowerCase(),
        password_hash,
        role: "MERCHANT",
        business_id: business.id,
        is_active: true,
      }, { transaction });

      // Essai de 7 jours sur le premier plan payant ; sans plan payant, plan gratuit sans expiration.
      // (En mode lancement gratuit, cet abonnement est ignore jusqu'a l'activation de la facturation.)
      const trialPlan = await Plan.findOne({ where: { is_active: true, price: { [Op.gt]: 0 } }, order: [["price", "ASC"]], transaction })
        || await Plan.findOne({ where: { is_active: true }, order: [["price", "ASC"]], transaction });
      if (trialPlan) {
        const isFree = Number(trialPlan.price) === 0;
        const now = new Date();
        const endsAt = new Date(now);
        if (isFree) endsAt.setFullYear(endsAt.getFullYear() + 10);
        else endsAt.setDate(endsAt.getDate() + 7);
        await Subscription.create({
          business_id: business.id,
          plan_id: trialPlan.id,
          status: isFree ? "ACTIVE" : "TRIAL",
          starts_at: now,
          ends_at: endsAt,
        }, { transaction });
      }

      return { business, user };
    });

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
