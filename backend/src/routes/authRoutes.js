const router = require("express").Router();
const auth = require("../middleware/auth");
const { loginLimiter } = require("../middleware/rateLimiters");
const { login, register, me } = require("../controllers/authController");

router.post("/login", loginLimiter, login);
router.post("/register", loginLimiter, register);
router.get("/me", auth, me);

module.exports = router;
