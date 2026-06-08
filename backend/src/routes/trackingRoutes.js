const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/trackingController");

router.post("/tracking/whatsapp-click", ctrl.whatsappClick);
router.get("/stats/overview", auth, requireRole("SUPER_ADMIN"), ctrl.adminOverview);

module.exports = router;
