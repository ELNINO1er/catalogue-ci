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

module.exports = {
  isPositiveInteger,
  isValidEmail,
  isValidPhone,
  truncateText,
};
