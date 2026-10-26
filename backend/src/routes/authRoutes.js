const router = require("express").Router();
const auth = require("../middleware/auth");
const { loginLimiter, registerLimiter, passwordResetLimiter, passwordChangeLimiter } = require("../middleware/rateLimiters");
const { login, register, me, forgotPassword, resetPassword } = require("../controllers/authController");

router.post("/login", loginLimiter, login);
router.post("/register", registerLimiter, register);
router.get("/me", auth, me);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordChangeLimiter, resetPassword);

module.exports = router;
