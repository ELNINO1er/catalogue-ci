const router = require("express").Router();
const ctrl = require("../controllers/businessController");
const { publicCatalogueLimiter } = require("../middleware/rateLimiters");

router.get("/catalogue/:slug", publicCatalogueLimiter, ctrl.publicCatalogue);

router.get("/wave-status", async (req, res) => {
  try {
    const { isWaveCheckoutAvailable } = require("../services/waveService");
    res.json({ wave_checkout_available: await isWaveCheckoutAvailable() });
  } catch {
    res.json({ wave_checkout_available: false });
  }
});

module.exports = router;
