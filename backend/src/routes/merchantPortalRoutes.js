const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/merchantPortalController");

router.use(auth, requireRole("MERCHANT"));

router.get("/dashboard", ctrl.dashboard);
router.get("/analytics", ctrl.analytics);
router.get("/business", ctrl.getBusiness);
router.put("/business", ctrl.updateBusiness);
router.get("/templates", ctrl.listTemplates);
router.get("/categories", ctrl.listCategories);
router.get("/plan-info", ctrl.getPlanInfo);
router.get("/plans", ctrl.listAvailablePlans);
router.post("/plans/change", ctrl.requestPlanChange);
router.post("/plans/payment", ctrl.submitSubscriptionPayment);
router.get("/plans/wave-info", ctrl.getPaymentWaveInfo);

module.exports = router;
