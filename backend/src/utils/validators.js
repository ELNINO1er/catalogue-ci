function isPositiveInteger(value) {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function isValidPhone(value) {
  return /^[0-9+()\s.-]{8,30}$/.test(String(value || ""));
}

function truncateText(value, max = 1000) {
  if (value === undefined || value === null) return null;
  return String(value).trim().slice(0, max);
}

// URL http(s) absolue, ou chemin d'upload local. Bloque javascript:, data:, etc.
function isSafeUrl(value) {
  const text = String(value || "").trim();
  if (text.startsWith("/uploads/") && !text.includes("..")) return true;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isHexColor(value) {
  return /^#[0-9A-Fa-f]{3,8}$/.test(String(value || ""));
}

const URL_FIELDS = ["logo_url", "banner_url", "google_maps_url"];
const COLOR_FIELDS = ["primary_color", "secondary_color", "button_color", "text_color", "background_color"];

// Valide les champs d'une boutique modifiables par le commercant. Retourne un message d'erreur ou null.
function validateBusinessFields(data = {}) {
  for (const field of URL_FIELDS) {
    if (data[field] && !isSafeUrl(data[field])) return `Lien invalide pour ${field}.`;
  }
  for (const field of COLOR_FIELDS) {
    if (data[field] && !isHexColor(data[field])) return `Couleur invalide pour ${field}.`;
  }
  if (data.whatsapp_number !== undefined && !isValidPhone(data.whatsapp_number)) return "Numero WhatsApp invalide.";
  if (data.phone_number && !isValidPhone(data.phone_number)) return "Numero de telephone invalide.";
  if (data.email && !isValidEmail(data.email)) return "Email invalide.";
  return null;
}

module.exports = {
  isSafeUrl,
  isHexColor,
  validateBusinessFields,
  isPositiveInteger,
  isValidEmail,
  isValidPhone,
  truncateText,
};
