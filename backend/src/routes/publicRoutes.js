const router = require("express").Router();
const ctrl = require("../controllers/businessController");

router.get("/catalogue/:slug", ctrl.publicCatalogue);

module.exports = router;
