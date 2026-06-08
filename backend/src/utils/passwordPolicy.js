function validatePasswordStrength(password) {
  if (typeof password !== "string") {
    return "Le mot de passe est obligatoire.";
  }

  if (password.length < 8) {
    return "Le mot de passe doit contenir au moins 8 caracteres.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Le mot de passe doit contenir au moins une majuscule.";
  }

  if (!/[a-z]/.test(password)) {
    return "Le mot de passe doit contenir au moins une minuscule.";
  }

  if (!/[0-9]/.test(password)) {
    return "Le mot de passe doit contenir au moins un chiffre.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Le mot de passe doit contenir au moins un caractere special.";
  }

  return null;
}

module.exports = { validatePasswordStrength };
