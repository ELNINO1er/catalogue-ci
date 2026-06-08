const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { User, Business } = require("../models");
const { validatePasswordStrength } = require("../utils/passwordPolicy");

exports.list = async (req, res, next) => {
  try {
    const merchants = await User.findAll({
      where: { role: "MERCHANT" },
      attributes: { exclude: ["password_hash"] },
      include: [{ model: Business, as: "business", attributes: ["id", "name", "slug"] }],
      order: [["created_at", "DESC"]],
    });
    return res.json(merchants);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, email, password, business_id } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Nom, email et mot de passe obligatoires." });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await User.findOne({ where: { email: normalizedEmail } });
    if (exists) return res.status(409).json({ message: "Cet email est deja utilise." });

    if (business_id) {
      const business = await Business.findByPk(business_id);
      if (!business) return res.status(404).json({ message: "Commerce introuvable." });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      password_hash: await bcrypt.hash(password, 10),
      role: "MERCHANT",
      business_id: business_id || null,
    });

    const { password_hash, ...safe } = user.toJSON();
    return res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || user.role !== "MERCHANT") {
      return res.status(404).json({ message: "Commercant introuvable." });
    }

    const { name, email, password, business_id } = req.body;
    if (email && email.trim().toLowerCase() !== user.email) {
      const normalizedEmail = email.trim().toLowerCase();
      const exists = await User.findOne({
        where: { email: normalizedEmail, id: { [Op.ne]: user.id } },
      });
      if (exists) return res.status(409).json({ message: "Cet email est deja utilise." });
      user.email = normalizedEmail;
    }

    if (business_id !== undefined) {
      if (business_id) {
        const business = await Business.findByPk(business_id);
        if (!business) return res.status(404).json({ message: "Commerce introuvable." });
      }
      user.business_id = business_id || null;
    }

    if (name) user.name = name;
    if (password) {
      const passwordError = validatePasswordStrength(password);
      if (passwordError) {
        return res.status(400).json({ success: false, message: passwordError });
      }
      user.password_hash = await bcrypt.hash(password, 10);
    }

    await user.save();
    const { password_hash, ...safe } = user.toJSON();
    return res.json(safe);
  } catch (err) {
    next(err);
  }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user || user.role !== "MERCHANT") {
      return res.status(404).json({ message: "Commercant introuvable." });
    }

    user.is_active =
      typeof req.body.is_active === "boolean" ? req.body.is_active : !user.is_active;
    await user.save();

    return res.json({
      id: user.id,
      is_active: user.is_active,
      message: user.is_active ? "Compte reactive." : "Compte desactive.",
    });
  } catch (err) {
    next(err);
  }
};
