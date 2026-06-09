module.exports = function errorHandler(err, req, res, next) {
  const statusCode = err.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  if (statusCode >= 500) {
    console.error("Erreur serveur:", err.message, isProduction ? "" : err.stack);
  } else {
    console.error("Erreur:", err.message);
  }

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ success: false, message: "Cette ressource existe deja." });
  }

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      success: false,
      message: err.errors.map((error) => error.message).join(", "),
    });
  }

  const safeMessage = statusCode >= 500 && isProduction
    ? "Erreur interne du serveur."
    : err.message || "Erreur serveur.";

  return res.status(statusCode).json({
    success: false,
    message: safeMessage,
  });
};
