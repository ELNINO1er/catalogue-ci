const jwt = require("jsonwebtoken");

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// Empreinte du dernier changement de mot de passe, embarquee dans le jeton :
// si le mot de passe change, tous les jetons emis avant deviennent invalides.
function passwordStamp(user) {
  return user.password_changed_at ? new Date(user.password_changed_at).getTime() : 0;
}

function signUserToken(user) {
  return signToken({ id: user.id, role: user.role, pwd: passwordStamp(user) });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signToken, signUserToken, verifyToken, passwordStamp };
