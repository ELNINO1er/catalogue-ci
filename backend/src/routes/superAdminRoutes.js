const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/superAdminController");

router.use(auth, requireRole("SUPER_ADMIN"));

router.get("/dashboard", ctrl.dashboard);

router.get("/plans", ctrl.listPlans);
router.post("/plans", ctrl.createPlan);
router.put("/plans/:id", ctrl.updatePlan);

router.get("/subscriptions", ctrl.listSubscriptions);
router.post("/subscriptions", ctrl.upsertSubscription);

router.get("/platform-payments", ctrl.listPlatformPayments);
router.post("/platform-payments", ctrl.createPlatformPayment);
router.put("/platform-payments/:id", ctrl.updatePlatformPayment);

router.get("/categories", ctrl.listCategories);
router.post("/categories", ctrl.createCategory);

router.get("/templates", ctrl.listTemplates);
router.post("/templates", ctrl.createTemplate);

router.get("/activity-logs", ctrl.listLogs);

router.get("/settings", ctrl.getSettings);
router.put("/settings", ctrl.saveSettings);
router.get("/wave-status", ctrl.getWaveStatus);

module.exports = router;
