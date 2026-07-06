const crypto = require('crypto');

const buildSessionToken = (email, password) => {
  // Derive session token from both email and password for stronger binding
  return crypto
    .createHash('sha256')
    .update(`${email}:${password}`)
    .digest('hex');
};

const parseCookie = (cookieHeader, cookieName) => {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((item) => item.trim());
  const entry = cookies.find((item) => item.startsWith(`${cookieName}=`));
  if (!entry) return null;
  return entry.split('=')[1] || null;
};

/**
 * Validate supplied email and password against environment-level super admin credentials.
 * These credentials are INDEPENDENT of the global_users table.
 */
const validateSuperAdminCredentials = (email, password) => {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('❌ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not configured in .env');
    return false;
  }

  return (
    email === adminEmail &&
    password === adminPassword
  );
};

const isValidSuperAdminSession = (req) => {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return false;

  const cookieValue = parseCookie(req.get('cookie'), 'super_admin_session');
  if (!cookieValue) return false;

  return cookieValue === buildSessionToken(adminEmail, adminPassword);
};

const validateSuperAdminSession = () => {
  return (req, res, next) => {
    if (!isValidSuperAdminSession(req)) {
      return res.status(401).json({ success: false, error: 'Super admin session required or invalid' });
    }
    next();
  };
};

const createSuperAdminSessionCookie = (res) => {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const token = buildSessionToken(adminEmail, adminPassword);
  const secure = process.env.NODE_ENV === 'production';
  const cookieParts = [
    `super_admin_session=${token}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
  ];
  if (secure) {
    cookieParts.push('Secure');
  }
  res.setHeader('Set-Cookie', cookieParts.join('; '));
};

module.exports = {
  validateSuperAdminCredentials,
  validateSuperAdminSession,
  createSuperAdminSessionCookie,
  isValidSuperAdminSession,
};
