// backend/middleware/errorHandler.js

/**
 * Async error wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Request validation middleware
 * @param {Array<string>} requiredFields - Required fields to validate
 * @returns {Function} Middleware function
 */
const validateRequest = (requiredFields = []) => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => {
      return !req.body[field] || req.body[field].toString().trim() === '';
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        missingFields
      });
    }

    next();
  };
};

/**
 * Rate limiting middleware (placeholder)
 * @returns {Function} Middleware function
 */
const rateLimiter = () => {
  return (req, res, next) => {
    // TODO: Implement rate limiting logic
    // Use packages like express-rate-limit
    next();
  };
};

module.exports = {
  asyncHandler,
  validateRequest,
  rateLimiter,
};
