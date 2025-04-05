/**
 * Role-based access control middleware
 * Checks if authenticated user has one of the allowed roles
 * 
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
const roleMiddleware = (roles) => {
  return (req, res, next) => {
    // Verify user exists and has a role
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.'
      });
    }

    // Check if user's role is in the allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${req.user.role} role is not authorized.`
      });
    }

    // User has an allowed role
    next();
  };
};

module.exports = roleMiddleware;
