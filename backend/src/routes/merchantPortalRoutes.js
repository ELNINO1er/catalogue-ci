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

module.exports = router;
