const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/role");
const ctrl = require("../controllers/onboardingController");
const uploadBusiness = require("../middleware/uploadBusiness");
const uploadProduct = require("../middleware/upload");

router.use(auth, requireRole("MERCHANT"));

router.get("/", ctrl.getData);
router.put("/step", ctrl.saveStep);
router.post("/complete", ctrl.complete);
router.post("/quick-products", ctrl.quickProducts);
router.post("/upload-image", uploadBusiness.single("image"), ctrl.uploadImage);
router.post("/upload-product-image", uploadProduct.single("image"), ctrl.uploadProductImage);

module.exports = router;
