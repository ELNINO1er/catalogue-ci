function canAccessBusiness(user, businessId) {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  return Number(user.business_id) === Number(businessId);
}

function requireBusinessAccess(req, res, next) {
  const businessId = req.params.businessId || req.body.business_id;
  if (!canAccessBusiness(req.user, businessId)) {
    return res.status(403).json({ success: false, message: "Acces refuse a ce commerce." });
  }
  next();
}

module.exports = { canAccessBusiness, requireBusinessAccess };
