const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/businessController");
const paymentCtrl = require("../controllers/paymentController");
const trackingCtrl = require("../controllers/trackingController");

router.get("/", auth, requireRole("SUPER_ADMIN"), ctrl.list);
router.post("/", auth, requireRole("SUPER_ADMIN"), ctrl.create);
router.get("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.getById);
router.put("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.update);
router.delete("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.remove);

router.post("/:businessId/payment-methods", auth, requireRole("SUPER_ADMIN"), paymentCtrl.setForBusiness);
router.get("/:businessId/stats", auth, trackingCtrl.businessStats);

module.exports = router;
