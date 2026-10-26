module.exports = function errorHandler(err, req, res, next) {
  // Erreurs d'envoi de fichier (taille, format) et JSON mal forme : erreurs du client.
  if (err.name === "MulterError") {
    const message = err.code === "LIMIT_FILE_SIZE" ? "Fichier trop volumineux (max 3 Mo)." : `Erreur d'envoi : ${err.message}`;
    return res.status(400).json({ success: false, message });
  }
  if (err.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Requete trop volumineuse." });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Donnees JSON invalides." });
  }
  if (err.message?.startsWith("Format image invalide")) {
    return res.status(400).json({ success: false, message: err.message });
  }

  const statusCode = err.status || err.statusCode || 500;
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
