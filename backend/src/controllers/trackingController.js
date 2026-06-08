const { Op, fn, col, literal } = require("sequelize");
const { OrderTracking, Business, Product, User } = require("../models");
const { canAccessBusiness } = require("../middleware/ownership");

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.socket?.remoteAddress || null;
}

function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

exports.whatsappClick = async (req, res, next) => {
  try {
    const { business_id, product_id, customer_message } = req.body;

    if (!isPositiveInteger(business_id)) {
      return res.status(400).json({
        success: false,
        message: "business_id doit etre un entier positif.",
      });
    }

    if (product_id !== undefined && product_id !== null && product_id !== "" && !isPositiveInteger(product_id)) {
      return res.status(400).json({
        success: false,
        message: "product_id doit etre un entier positif.",
      });
    }

    if (customer_message !== undefined && typeof customer_message !== "string") {
      return res.status(400).json({
        success: false,
        message: "customer_message doit etre une chaine de caracteres.",
      });
    }

    const business = await Business.findByPk(business_id);
    if (!business || !business.is_active) {
      return res.status(404).json({
        success: false,
        message: "Commerce introuvable.",
      });
    }

    let trackedProductId = null;
    if (product_id) {
      const product = await Product.findOne({
        where: {
          id: Number(product_id),
          business_id: Number(business_id),
          is_active: true,
        },
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          message: "Le produit ne correspond pas a ce commerce.",
        });
      }

      trackedProductId = product.id;
    }

    const safeMessage = customer_message
      ? customer_message.trim().slice(0, 1000)
      : null;

    await OrderTracking.create({
      business_id: Number(business_id),
      product_id: trackedProductId,
      customer_message: safeMessage,
      ip_address: getClientIp(req),
      user_agent: (req.headers["user-agent"] || "").slice(0, 255),
    });

    return res.status(201).json({ success: true, message: "Clic WhatsApp enregistre." });
  } catch (err) {
    next(err);
  }
};

exports.businessStats = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    if (!canAccessBusiness(req.user, businessId)) {
      return res.status(403).json({ message: "Acces refuse a ce commerce." });
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [totalClicks, clicks30d, productsCount, topProducts] = await Promise.all([
      OrderTracking.count({ where: { business_id: businessId } }),
      OrderTracking.count({ where: { business_id: businessId, clicked_at: { [Op.gte]: since } } }),
      Product.count({ where: { business_id: businessId } }),
      OrderTracking.findAll({
        where: { business_id: businessId, product_id: { [Op.ne]: null } },
        attributes: ["product_id", [fn("COUNT", col("OrderTracking.id")), "clicks"]],
        include: [{ model: Product, as: "product", attributes: ["name"] }],
        group: ["product_id", "product.id"],
        order: [[literal("clicks"), "DESC"]],
        limit: 5,
      }),
    ]);

    return res.json({
      total_clicks: totalClicks,
      clicks_30d: clicks30d,
      products_count: productsCount,
      top_products: topProducts.map((item) => ({
        product_id: item.product_id,
        name: item.product ? item.product.name : "Produit supprime",
        clicks: Number(item.get("clicks")),
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.adminOverview = async (req, res, next) => {
  try {
    const [businesses, products, merchants, clicks, recentBusinesses] = await Promise.all([
      Business.count(),
      Product.count(),
      User.count({ where: { role: "MERCHANT" } }),
      OrderTracking.count(),
      Business.findAll({
        attributes: ["id", "name", "slug", "created_at"],
        order: [["created_at", "DESC"]],
        limit: 5,
      }),
    ]);

    return res.json({
      totals: {
        businesses,
        products,
        merchants,
        whatsapp_clicks: clicks,
      },
      recent_businesses: recentBusinesses,
    });
  } catch (err) {
    next(err);
  }
};
