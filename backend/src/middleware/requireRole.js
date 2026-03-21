const normalizeRole = (value) => String(value || "").trim().toLowerCase();

const requireRole = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole).filter(Boolean);

  return (req, res, next) => {
    const currentRole = normalizeRole(req?.admin?.role);
    if (!currentRole) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!normalizedAllowedRoles.includes(currentRole)) {
      return res.status(403).json({ message: "You do not have access to this action" });
    }

    return next();
  };
};

export default requireRole;
