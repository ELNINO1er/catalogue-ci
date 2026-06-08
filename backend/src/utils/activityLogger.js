const { ActivityLog } = require("../models");

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return String(forwarded).split(",")[0].trim();
  return req.socket?.remoteAddress || null;
}

async function logActivity(req, { action, module, business_id = null, details = {} }) {
  try {
    await ActivityLog.create({
      user_id: req.user?.id || null,
      business_id,
      action,
      module,
      ip_address: getClientIp(req),
      details_json: JSON.stringify(details || {}),
    });
  } catch (err) {
    console.error("Activity log failed:", err.message);
  }
}

module.exports = { logActivity };
