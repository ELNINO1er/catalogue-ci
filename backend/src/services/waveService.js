async function createCheckoutSession(order) {
  return {
    implemented: false,
    message: "Wave Checkout API not implemented yet.",
    order_id: order?.id || null,
  };
}

async function verifyWebhook(payload) {
  return {
    implemented: false,
    message: "Wave webhook verification not implemented yet.",
    payload_received: Boolean(payload),
  };
}

async function getPaymentStatus(reference) {
  return {
    implemented: false,
    message: "Wave payment status lookup not implemented yet.",
    reference: reference || null,
  };
}

module.exports = {
  createCheckoutSession,
  verifyWebhook,
  getPaymentStatus,
};
