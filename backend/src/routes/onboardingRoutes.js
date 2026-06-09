const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/onboardingController");

router.use(auth, requireRole("MERCHANT"));

router.get("/", ctrl.getData);
router.put("/step", ctrl.saveStep);
router.post("/complete", ctrl.complete);
router.post("/quick-products", ctrl.quickProducts);

module.exports = router;
