// backend/middleware/partnerAuth.js
const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate partner JWT token
 * Expects: Authorization: Bearer <partner_token>
 * Attaches req.partner = { partnerId, email, role }
 */
const authenticatePartner = () => {
  return (req, res, next) => {
    try {
      const authHeader = req.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No authorization token provided' });
      }

      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      if (decoded.role !== 'partner') {
        return res.status(403).json({ success: false, error: 'Access denied: partner role required' });
      }

      req.partner = {
        partnerId: decoded.partnerId,
        email: decoded.email,
        role: decoded.role,
      };

      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, error: 'Token expired' });
      }
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
  };
};

module.exports = { authenticatePartner };
