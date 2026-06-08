const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/merchantController");

router.use(auth, requireRole("SUPER_ADMIN"));

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.patch("/:id/disable", ctrl.toggleActive);

module.exports = router;
