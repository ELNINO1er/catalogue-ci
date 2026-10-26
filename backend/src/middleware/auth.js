const { verifyToken } = require("../utils/jwt");
const { User, Business } = require("../models");

module.exports = async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, message: "Token manquant." });
    }

    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Business, as: "business", attributes: ["id", "is_active"] }],
    });
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: "Compte invalide ou desactive." });
    }
    if (user.role === "MERCHANT" && user.business && !user.business.is_active) {
      return res.status(403).json({ success: false, code: "BUSINESS_SUSPENDED", message: "Votre boutique est suspendue. Contactez le support." });
    }

    req.user = {
      id: user.id,
      role: user.role,
      business_id: user.business_id,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Token invalide ou expire." });
  }
};
