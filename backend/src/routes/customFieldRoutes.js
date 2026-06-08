const router = require("express").Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/customFieldController");

router.get("/products/:productId/fields", ctrl.listByProduct);
router.post("/products/:productId/fields", auth, ctrl.create);
router.put("/custom-fields/:id", auth, ctrl.update);
router.delete("/custom-fields/:id", auth, ctrl.remove);

module.exports = router;
