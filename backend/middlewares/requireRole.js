const requireRole = (role) => {
    return (req, res, next) => {
      if (req.role !== role) {
        return res.status(403).json({ message: `Access denied: ${role}s only` });
      }
      next();
    };
  };
  
  module.exports = requireRole;
  