const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const slugify = require("slugify");
const { Op } = require("sequelize");
const { sequelize, User, Business, Subscription, Plan } = require("../models");
const { signUserToken } = require("../utils/jwt");
const { validatePasswordStrength } = require("../utils/passwordPolicy");
const { isValidEmail, isValidPhone, truncateText } = require("../utils/validators");
const { notifyAdminNewMerchant, sendWelcomeEmail, sendPasswordResetEmail } = require("../services/emailService");

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

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

    const token = signUserToken(user);
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
    const { name, email, password, business_name, whatsapp_number, business_category, accept_terms } = req.body;

    // Validation
    if (!name || !email || !password || !business_name || !whatsapp_number) {
      return res.status(400).json({ message: "Tous les champs obligatoires doivent etre remplis." });
    }
    if (accept_terms !== true) {
      return res.status(400).json({ message: "Vous devez accepter les conditions d'utilisation et la politique de confidentialite." });
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
        terms_accepted_at: new Date(),
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
    const token = signUserToken(user);
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

// Reponse identique que l'email existe ou non : on ne revele pas qui a un compte.
exports.forgotPassword = async (req, res, next) => {
  try {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const generic = { success: true, message: "Si un compte existe pour cet email, un lien de reinitialisation vient d'etre envoye." };
    if (!isValidEmail(email)) return res.json(generic);

    const user = await User.findOne({ where: { email } });
    if (!user || !user.is_active) return res.json(generic);

    const token = crypto.randomBytes(32).toString("hex");
    user.reset_token_hash = hashToken(token);
    user.reset_token_expires_at = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    const appUrl = (process.env.PUBLIC_APP_URL || process.env.CLIENT_URL || "").replace(/\/$/, "");
    sendPasswordResetEmail({
      name: user.name,
      email: user.email,
      resetUrl: `${appUrl}/reinitialiser-mot-de-passe?token=${token}`,
    }).catch((err) => console.error("Erreur envoi email reinitialisation:", err.message));

    return res.json(generic);
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
      return res.status(400).json({ message: "Lien invalide ou expire. Refaites une demande." });
    }
    const passwordError = validatePasswordStrength(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    const user = await User.findOne({ where: { reset_token_hash: hashToken(token) } });
    if (!user || !user.reset_token_expires_at || new Date(user.reset_token_expires_at) < new Date()) {
      return res.status(400).json({ message: "Lien invalide ou expire. Refaites une demande." });
    }

    user.password_hash = await bcrypt.hash(password, 12);
    user.reset_token_hash = null;
    user.reset_token_expires_at = null;
    user.password_changed_at = new Date();
    await user.save();

    return res.json({ success: true, message: "Mot de passe modifie. Vous pouvez vous connecter." });
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
