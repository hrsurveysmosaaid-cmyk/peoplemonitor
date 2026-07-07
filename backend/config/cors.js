// backend/config/cors.js
require('dotenv').config();

const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://peopleos.online',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: process.env.ALLOW_CREDENTIALS === 'true',
  optionsSuccessStatus: 200,
  maxAge: 86400, // 24 hours
};

/**
 * Custom CORS middleware with strict validation
 * Supports both production (strict) and development (permissive localhost)
 */
const strictCorsMiddleware = (req, res, next) => {
  const origin = req.get('origin');
    const allowedOrigins = [
      'https://peopleos.online',
      'https://www.peopleos.online'
    ];

    // Always allow localhost/127.0.0.1 for zero-CORS dev via Vite proxy
    const isLocalhostOrigin = origin && (
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    );

    // Block requests from disallowed origins except trusted localhost origins
    if (origin && !allowedOrigins.includes(origin) && !isLocalhostOrigin) {
      console.warn(`🚫 CORS blocked: Unauthorized origin - ${origin}`);
      return res.status(403).json({
        success: false,
        error: 'Cross-Origin request forbidden',
      });
    }

    // Determine the effective allowed origin for the response header
    const effectiveOrigin = isLocalhostOrigin ? origin : (allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);


  // Set secure CORS headers
  if (effectiveOrigin) {
    res.header('Access-Control-Allow-Origin', effectiveOrigin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With');
  res.header('Access-Control-Max-Age', '86400');

  // Security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Handle OPTIONS preflight request immediately
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

module.exports = {
  corsOptions,
  strictCorsMiddleware,
};

