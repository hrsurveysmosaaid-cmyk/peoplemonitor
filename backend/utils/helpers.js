// backend/utils/helpers.js
const crypto = require('crypto');

/**
 * Generate random string of specified length
 * @param {number} length - Length of the random string
 * @returns {string} Random string
 */
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Validate email format
 * @param {string} email - Email address
 * @returns {boolean} True if valid email
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Hash password (placeholder - implement with bcrypt in production)
 * @param {string} password - Password to hash
 * @returns {string} Hashed password
 */
const hashPassword = (password) => {
  // This is a placeholder. Use bcryptjs in production:
  // const bcrypt = require('bcryptjs');
  // return bcrypt.hashSync(password, 10);
  return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Generate unique portfolio slug
 * @param {string} name - User or portfolio name
 * @returns {string} Unique slug
 */
const generateSlug = (name) => {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-');
  
  return `${baseSlug}-${generateRandomString(6)}`;
};

/**
 * Format date for database
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date (YYYY-MM-DD)
 */
const formatDateForDB = (date) => {
  if (!date) return null;
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Parse JSON safely
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
const safeJsonParse = (jsonString, defaultValue = {}) => {
  try {
    return JSON.parse(jsonString);
  } catch {
    return defaultValue;
  }
};

/**
 * Generate OTP token
 * @param {number} length - Length of OTP (default 6)
 * @returns {string} OTP token
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * 10));
  }
  return otp;
};

/**
 * Sanitize input string
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, 1000); // Limit to 1000 chars
};

module.exports = {
  generateRandomString,
  validateEmail,
  validateUrl,
  hashPassword,
  generateSlug,
  formatDateForDB,
  safeJsonParse,
  generateOTP,
  sanitizeInput,
};
