const router = require("express").Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/productController");
const upload = require("../middleware/upload");

router.get("/businesses/:businessId/products", auth, ctrl.listByBusiness);
router.post("/businesses/:businessId/products/image", auth, upload.single("image"), ctrl.uploadImage);
router.post("/businesses/:businessId/products", auth, ctrl.create);
router.get("/products/:id", auth, ctrl.getById);
router.put("/products/:id", auth, ctrl.update);
router.delete("/products/:id", auth, ctrl.remove);

module.exports = router;
