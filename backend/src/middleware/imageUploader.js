const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

// Extension deduite du type MIME verifie, jamais du nom d'origine : un fichier
// "page.html" envoye comme image ne peut pas etre servi comme une page web.
const EXTENSIONS = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_SIZE = 3 * 1024 * 1024;

function makeImageUploader(subfolder) {
  const uploadRoot = path.join(__dirname, "../../uploads", subfolder);
  fs.mkdirSync(uploadRoot, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadRoot),
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${EXTENSIONS[file.mimetype]}`);
    },
  });

  function fileFilter(req, file, cb) {
    if (!EXTENSIONS[file.mimetype]) {
      return cb(new Error("Format image invalide. Utilisez JPG, PNG, WEBP ou GIF."));
    }
    cb(null, true);
  }

  return multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE, files: 1 } });
}

module.exports = { makeImageUploader, IMAGE_EXTENSIONS: Object.values(EXTENSIONS) };
