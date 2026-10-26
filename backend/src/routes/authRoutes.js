const router = require("express").Router();
const auth = require("../middleware/auth");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiters");
const { login, register, me } = require("../controllers/authController");

router.post("/login", loginLimiter, login);
router.post("/register", registerLimiter, register);
router.get("/me", auth, me);

module.exports = router;
