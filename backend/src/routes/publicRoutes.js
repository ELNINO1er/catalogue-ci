const router = require("express").Router();
const ctrl = require("../controllers/businessController");
const { publicCatalogueLimiter } = require("../middleware/rateLimiters");

router.get("/catalogue/:slug", publicCatalogueLimiter, ctrl.publicCatalogue);

module.exports = router;
