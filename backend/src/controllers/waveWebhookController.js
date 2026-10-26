const { Order, OrderStatusHistory } = require("../models");
const { verifyWebhookSignature } = require("../services/waveService");

function extractOrderId(event) {
  const data = event.data || event;
  const reference = data.client_reference || data.clientReference || "";
  const match = String(reference).match(/^catalogueci_order_(\d+)$/);
  return match ? Number(match[1]) : null;
}

function normalizeWaveStatus(event) {
  const data = event.data || event;
  const status = String(data.payment_status || data.status || event.type || "").toUpperCase();
  if (["SUCCEEDED", "SUCCESS", "COMPLETED", "CHECKOUT.SESSION.COMPLETED", "PAID"].includes(status)) return "PAID";
  if (["FAILED", "EXPIRED"].includes(status)) return "FAILED";
  if (["CANCELLED", "CANCELED"].includes(status)) return "CANCELLED";
  return "PENDING";
}

function extractTransactionId(event) {
  const data = event.data || event;
  return data.transaction_id || data.transactionId || data.payment_id || data.id || null;
}

exports.handle = async (req, res, next) => {
  try {
    const rawBody = req.body.toString("utf8");
    const isValidSignature = await verifyWebhookSignature({
      rawBody,
      waveSignature: req.get("Wave-Signature"),
    });

    if (!isValidSignature) {
      return res.status(401).json({ success: false, message: "Signature Wave invalide." });
    }

    const event = JSON.parse(rawBody);
    const orderId = extractOrderId(event);
    if (!orderId) {
      return res.status(200).json({ success: true, message: "Evenement Wave ignore." });
    }

    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(200).json({ success: true, message: "Commande introuvable, evenement ignore." });
    }

    const paymentStatus = normalizeWaveStatus(event);

    // Idempotence : une commande deja payee n'est jamais retrogradee par un evenement
    // en retard ou rejoue, et un evenement "en attente" ne change rien.
    if (order.payment_status === "PAID" || paymentStatus === "PENDING") {
      return res.json({ success: true, message: "Evenement Wave deja pris en compte." });
    }
    if (order.payment_method !== "wave_checkout") {
      return res.status(200).json({ success: true, message: "Commande hors Wave Checkout, evenement ignore." });
    }

    const oldStatus = order.status;
    const oldPayment = order.payment_status;
    order.payment_status = paymentStatus;
    order.wave_transaction_id = extractTransactionId(event);

    if (paymentStatus === "PAID") {
      order.status = "PAID";
      order.paid_at = new Date();
    } else {
      // Echec ou abandon du paiement : la commande reste en attente et le client peut reessayer
      // (une nouvelle session Wave sera creee).
      order.status = "AWAITING_PAYMENT";
      order.wave_checkout_session_id = null;
      order.wave_launch_url = null;
    }

    await order.save();
    await OrderStatusHistory.create({
      order_id: order.id,
      old_status: oldStatus,
      new_status: order.status,
      old_payment_status: oldPayment,
      new_payment_status: order.payment_status,
      actor: "system",
      note: `Webhook Wave : ${paymentStatus}`,
    });
    return res.json({ success: true, message: "Webhook Wave traite." });
  } catch (err) {
    next(err);
  }
};
