module.exports = function errorHandler(err, req, res, next) {
  console.error("Erreur:", err.message);

  if (err.name === "SequelizeUniqueConstraintError") {
    return res.status(409).json({ message: "Cette ressource existe deja." });
  }

  if (err.name === "SequelizeValidationError") {
    return res.status(400).json({
      message: err.errors.map((error) => error.message).join(", "),
    });
  }

  return res.status(err.status || 500).json({
    message: err.message || "Erreur serveur.",
  });
};
