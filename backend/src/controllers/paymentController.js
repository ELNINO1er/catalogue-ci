const slugify = require("slugify");
const { PaymentMethod, Business } = require("../models");

function toCode(name) {
  return slugify(name, { lower: true, strict: true, replacement: "_" });
}

exports.listPublic = async (req, res, next) => {
  try {
    const methods = await PaymentMethod.findAll({
      where: { is_active: true },
      attributes: ["id", "name", "code"],
      order: [["name", "ASC"]],
    });
    return res.json(methods);
  } catch (err) {
    next(err);
  }
};

exports.listAll = async (req, res, next) => {
  try {
    const methods = await PaymentMethod.findAll({ order: [["name", "ASC"]] });
    return res.json(methods);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Nom obligatoire." });

    const code = toCode(name);
    const exists = await PaymentMethod.findOne({ where: { code } });
    if (exists) return res.status(409).json({ message: "Ce moyen de paiement existe deja." });

    const method = await PaymentMethod.create({ name, code, is_active: true });
    return res.status(201).json(method);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const method = await PaymentMethod.findByPk(req.params.id);
    if (!method) return res.status(404).json({ message: "Moyen de paiement introuvable." });

    if (req.body.name) {
      method.name = req.body.name;
      method.code = toCode(req.body.name);
    }
    if (typeof req.body.is_active === "boolean") method.is_active = req.body.is_active;

    await method.save();
    return res.json(method);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const method = await PaymentMethod.findByPk(req.params.id);
    if (!method) return res.status(404).json({ message: "Moyen de paiement introuvable." });
    await method.destroy();
    return res.json({ message: "Moyen de paiement supprime." });
  } catch (err) {
    next(err);
  }
};

exports.setForBusiness = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { payment_method_ids } = req.body;

    const business = await Business.findByPk(businessId);
    if (!business) return res.status(404).json({ message: "Commerce introuvable." });
    if (!Array.isArray(payment_method_ids)) {
      return res.status(400).json({ message: "payment_method_ids doit etre un tableau." });
    }

    await business.setPaymentMethods(payment_method_ids);
    const updated = await Business.findByPk(businessId, {
      include: [{ model: PaymentMethod, as: "paymentMethods", through: { attributes: [] } }],
    });
    return res.json(updated.paymentMethods);
  } catch (err) {
    next(err);
  }
};
