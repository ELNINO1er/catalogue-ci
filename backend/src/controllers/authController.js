const bcrypt = require("bcryptjs");
const { User, Business } = require("../models");
const { signToken } = require("../utils/jwt");

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
