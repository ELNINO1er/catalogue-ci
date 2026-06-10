const router = require("express").Router();
const multer = require("multer");
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

// Upload with multer error handling
function handleUpload(uploader, handler) {
  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") return res.status(400).json({ success: false, message: "Fichier trop volumineux (max 3 Mo)." });
        return res.status(400).json({ success: false, message: `Erreur upload: ${err.message}` });
      }
      if (err) return res.status(400).json({ success: false, message: err.message });
      handler(req, res, next);
    });
  };
}

router.post("/upload-image", handleUpload(uploadBusiness.single("image"), ctrl.uploadImage));
router.post("/upload-product-image", handleUpload(uploadProduct.single("image"), ctrl.uploadProductImage));

module.exports = router;
