const { Op } = require("sequelize");
const { Order, Product, Business, Category } = require("../models");

// Statistiques des tableaux de bord (admin : toute la plateforme ; marchand : sa boutique).
// L'agregation se fait en JS sur les commandes de la periode : simple, portable,
// et largement suffisant pour les volumes d'une boutique ou de la plateforme au lancement.

const RANGES = {
  today: { days: 1, hourly: true },
  "7d": { days: 7 },
  "30d": { days: 30 },
};

const STATUS_GROUPS = {
  completed: ["DELIVERED"],
  in_progress: ["PAID", "CONFIRMED", "IN_PROGRESS", "READY"],
  pending: ["PENDING", "AWAITING_PAYMENT", "AWAITING_VERIFICATION"],
  cancelled: ["CANCELLED", "REFUNDED"],
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function periodBounds(rangeKey) {
  const range = RANGES[rangeKey] || RANGES["7d"];
  const end = new Date();
  const start = range.hourly ? startOfDay(end) : startOfDay(new Date(end.getTime() - (range.days - 1) * 86400000));
  const length = end.getTime() - start.getTime();
  const prevStart = range.hourly ? new Date(start.getTime() - 86400000) : new Date(start.getTime() - range.days * 86400000);
  // Periode precedente de meme duree (ex. hier jusqu'a la meme heure) pour les variations.
  const prevEnd = new Date(prevStart.getTime() + length);
  return { range, start, end, prevStart, prevEnd };
}

function bucketKey(date, hourly) {
  const d = new Date(date);
  if (hourly) return String(d.getHours());
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildBuckets(start, range, end) {
  const buckets = [];
  if (range.hourly) {
    // Aujourd'hui : seulement les heures deja passees.
    for (let h = 0; h <= end.getHours(); h++) buckets.push({ key: String(h), label: `${String(h).padStart(2, "0")}h`, revenue: 0, orders: 0 });
    return buckets;
  }
  for (let i = 0; i < range.days; i++) {
    const day = new Date(start.getTime() + i * 86400000);
    buckets.push({
      key: bucketKey(day, false),
      label: new Intl.DateTimeFormat("fr-FR", range.days > 7 ? { day: "2-digit", month: "2-digit" } : { weekday: "short", day: "2-digit" }).format(day),
      revenue: 0,
      orders: 0,
    });
  }
  return buckets;
}

function summarize(orders) {
  const paid = orders.filter((o) => o.payment_status === "PAID");
  const revenue = paid.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const customers = new Set(orders.map((o) => o.customer_phone)).size;
  return {
    revenue,
    orders: orders.length,
    customers,
    average_basket: paid.length ? Math.round(revenue / paid.length) : 0,
  };
}

function variation(current, previous) {
  if (!previous) return current ? null : 0; // null = pas de base de comparaison
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * @param {object} options
 * @param {number} [options.businessId] - limite a une boutique (marchand)
 * @param {string} [options.range] - "today" | "7d" | "30d"
 * @param {"product"|"business"} [options.categoryBy] - regroupement du camembert
 */
async function getDashboardTrends({ businessId, range: rangeKey = "7d", categoryBy = "product" } = {}) {
  const { range, start, end, prevStart, prevEnd } = periodBounds(rangeKey);
  const scope = businessId ? { business_id: businessId } : {};

  const include = categoryBy === "business"
    ? [{ model: Business, as: "business", attributes: ["id", "name"], include: [{ model: Category, as: "category", attributes: ["name"] }] }]
    : [{ model: Product, as: "product", attributes: ["id", "name", "category"] }];

  const [orders, previousOrders] = await Promise.all([
    Order.findAll({
      where: { ...scope, created_at: { [Op.gte]: start, [Op.lte]: end } },
      attributes: ["id", "business_id", "product_id", "total_amount", "status", "payment_status", "customer_phone", "created_at"],
      include,
    }),
    Order.findAll({
      where: { ...scope, created_at: { [Op.gte]: prevStart, [Op.lt]: prevEnd } },
      attributes: ["id", "total_amount", "payment_status", "customer_phone"],
    }),
  ]);

  // Courbe ventes / commandes
  const buckets = buildBuckets(start, range, end);
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const order of orders) {
    const bucket = byKey.get(bucketKey(order.created_at, range.hourly));
    if (!bucket) continue;
    bucket.orders += 1;
    if (order.payment_status === "PAID") bucket.revenue += Number(order.total_amount || 0);
  }

  // Repartition par categorie (5 premieres + "Autres")
  const categoryCounts = new Map();
  for (const order of orders) {
    const name = categoryBy === "business"
      ? order.business?.category?.name || "Sans categorie"
      : order.product?.category || "Sans categorie";
    categoryCounts.set(name, (categoryCounts.get(name) || 0) + 1);
  }
  const sortedCategories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]);
  const categories = sortedCategories.slice(0, 4).map(([name, count]) => ({ name, count }));
  const others = sortedCategories.slice(4).reduce((sum, [, count]) => sum + count, 0);
  if (others) categories.push({ name: "Autres", count: others });

  // Statuts des commandes
  const statuses = Object.fromEntries(Object.keys(STATUS_GROUPS).map((k) => [k, 0]));
  for (const order of orders) {
    const group = Object.keys(STATUS_GROUPS).find((k) => STATUS_GROUPS[k].includes(order.status));
    if (group) statuses[group] += 1;
  }

  // Pic d'activite
  const peak = buckets.reduce((best, b) => (b.revenue > (best?.revenue ?? -1) ? b : best), null);
  const peakOrders = buckets.reduce((best, b) => (b.orders > (best?.orders ?? -1) ? b : best), null);

  // Classement : produits (marchand) ou boutiques (admin)
  const rankMap = new Map();
  for (const order of orders) {
    const entity = categoryBy === "business" ? order.business : order.product;
    if (!entity) continue;
    const item = rankMap.get(entity.id) || { id: entity.id, name: entity.name, orders: 0, revenue: 0 };
    item.orders += 1;
    if (order.payment_status === "PAID") item.revenue += Number(order.total_amount || 0);
    rankMap.set(entity.id, item);
  }
  const ranking = [...rankMap.values()].sort((a, b) => b.orders - a.orders || b.revenue - a.revenue).slice(0, 5);

  const current = summarize(orders);
  const previous = summarize(previousOrders);

  return {
    range: RANGES[rangeKey] ? rangeKey : "7d",
    summary: {
      ...current,
      changes: {
        revenue: variation(current.revenue, previous.revenue),
        orders: variation(current.orders, previous.orders),
        customers: variation(current.customers, previous.customers),
        average_basket: variation(current.average_basket, previous.average_basket),
      },
    },
    series: buckets.map(({ label, revenue, orders: count }) => ({ label, revenue, orders: count })),
    categories,
    statuses,
    ranking,
    peak: {
      revenue: peak && peak.revenue > 0 ? { label: peak.label, value: peak.revenue } : null,
      orders: peakOrders && peakOrders.orders > 0 ? { label: peakOrders.label, value: peakOrders.orders } : null,
    },
  };
}

module.exports = { getDashboardTrends, RANGES };
