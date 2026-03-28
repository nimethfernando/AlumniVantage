const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user || !user.role) {
        return res.status(403).json({ message: "Access denied. No role found." });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          message: "Access denied. Insufficient permissions."
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Role authorization failed" });
    }
  };
};

module.exports = requireRole;