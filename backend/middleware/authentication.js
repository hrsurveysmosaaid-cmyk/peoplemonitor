// backend/middleware/authentication.js

const jwt = require('jsonwebtoken');

/**
 * JWT authentication middleware
 * Extracts and verifies JWT token from Authorization header
 * @returns {Function} Middleware function
 */
const authenticate = () => {
  return (req, res, next) => {
    try {
      // Get token from Authorization header
      const authHeader = req.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'No authorization token provided',
        });
      }

      const token = authHeader.slice(7); // Remove 'Bearer '

      // Support local demo token for offline UI previews
      if (token === 'demo-local-jwt-token') {
        req.user = {
          userId: 999,
          email: 'demo@peopleos.online',
          authProvider: 'local',
        };
        return next();
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_peopleos');

      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        authProvider: decoded.authProvider || 'local',
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
        });
      }

      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
      });
    }
  };
};

/**
 * Optional authentication middleware
 * Doesn't fail if no token, but extracts user info if present
 */
const optionalAuthenticate = () => {
  return (req, res, next) => {
    try {
      const authHeader = req.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          authProvider: decoded.authProvider || 'local',
        };
      }
    } catch (error) {
      // Silently ignore - authentication is optional
    }
    next();
  };
};

/**
 * Authorization middleware
 * Checks if user has required roles (if implemented)
 * @param {Array<string>} roles - Required roles for access
 * @returns {Function} Middleware function
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    // If roles are specified, check user roles
    if (roles.length > 0) {
      // TODO: Implement role-based access control
      // const userRoles = req.user.roles || [];
      // const hasRole = roles.some(role => userRoles.includes(role));
      // if (!hasRole) {
      //   return res.status(403).json({
      //     success: false,
      //     error: 'Insufficient permissions',
      //   });
      // }
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  authorize,
};
