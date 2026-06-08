const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/trackingController");
const { trackingLimiter } = require("../middleware/rateLimiters");

router.post("/tracking/whatsapp-click", trackingLimiter, ctrl.whatsappClick);
router.get("/stats/overview", auth, requireRole("SUPER_ADMIN"), ctrl.adminOverview);

module.exports = router;
