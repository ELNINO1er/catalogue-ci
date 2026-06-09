const router = require("express").Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/orderController");
const { orderCreationLimiter, waveCheckoutLimiter } = require("../middleware/rateLimiters");

router.post("/public/catalogue/:slug/orders", orderCreationLimiter, ctrl.createPublic);
router.post("/public/orders/track", ctrl.trackPublic);
router.post("/orders/:id/wave-checkout", waveCheckoutLimiter, ctrl.createWaveCheckout);
router.post("/orders/:id/payment-sent", waveCheckoutLimiter, ctrl.markPaymentSent);
router.get("/businesses/:businessId/orders", auth, ctrl.listByBusiness);
router.get("/orders/:id", auth, ctrl.getById);
router.patch("/orders/:id/status", auth, ctrl.updateStatus);

module.exports = router;
