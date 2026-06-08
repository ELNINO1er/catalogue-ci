const router = require("express").Router();
const auth = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimiters");
const { login, me } = require("../controllers/authController");

router.post("/login", loginLimiter, login);
router.get("/me", auth, me);

module.exports = router;
