const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/paymentController");

router.get("/", ctrl.listPublic);
router.get("/all", auth, requireRole("SUPER_ADMIN"), ctrl.listAll);
router.post("/", auth, requireRole("SUPER_ADMIN"), ctrl.create);
router.put("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.update);
router.delete("/:id", auth, requireRole("SUPER_ADMIN"), ctrl.remove);

module.exports = router;
