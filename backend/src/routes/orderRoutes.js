const router = require("express").Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/orderController");

router.post("/public/catalogue/:slug/orders", ctrl.createPublic);
router.post("/orders/:id/payment-sent", ctrl.markPaymentSent);
router.get("/businesses/:businessId/orders", auth, ctrl.listByBusiness);
router.get("/orders/:id", auth, ctrl.getById);
router.patch("/orders/:id/status", auth, ctrl.updateStatus);

module.exports = router;
