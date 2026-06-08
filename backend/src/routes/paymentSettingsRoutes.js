const router = require("express").Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/paymentSettingsController");

router.get("/businesses/:businessId/payment-settings", auth, ctrl.getByBusiness);
router.put("/businesses/:businessId/payment-settings", auth, ctrl.upsertByBusiness);

module.exports = router;
