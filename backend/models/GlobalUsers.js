// backend/models/GlobalUsers.js
const { executeQuery } = require('../config/database');

/**
 * Create global_users table
 */
const createGlobalUsersTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS global_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      pass_secure_hash VARCHAR(255) NULL,
      auth_provider ENUM('local', 'google') DEFAULT 'local',
      is_verified BOOLEAN DEFAULT FALSE,
      otp_token_string VARCHAR(6) NULL,
      otp_expiration TIMESTAMP NULL,
      record_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_auth_provider (auth_provider)
    )
  `;
  
  try {
    await executeQuery(query);
    console.log('✅ Table global_users created successfully');
  } catch (error) {
    console.error('❌ Error creating global_users table:', error.message);
    throw error;
  }
};

/**
 * Create new user
 */
const createUser = async (userData) => {
  const { fullName, email, passSecureHash, authProvider = 'local', isVerified = false, partnerId = null } = userData;
  
  const query = `
    INSERT INTO global_users 
    (full_name, email, pass_secure_hash, auth_provider, is_verified, partner_id) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  try {
    const result = await executeQuery(query, [fullName, email, passSecureHash, authProvider, isVerified, partnerId]);
    return { id: result.insertId, ...userData };
  } catch (error) {
    throw new Error(`Failed to create user: ${error.message}`);
  }
};

/**
 * Get user by email
 */
const getUserByEmail = async (email) => {
  const query = `SELECT * FROM global_users WHERE email = ?`;
  
  try {
    const results = await executeQuery(query, [email]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};

/**
 * Get user by ID
 */
const getUserById = async (id) => {
  const query = `SELECT * FROM global_users WHERE id = ?`;
  
  try {
    const results = await executeQuery(query, [id]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
};

/**
 * Update user
 * Note: OTP fields can be explicitly set to NULL to clear them after verification.
 */
const updateUser = async (id, userData) => {
  const { fullName, email, passSecureHash, authProvider, isVerified, otpTokenString, otpExpiration } = userData;
  
  // Build dynamic SET clause to only update provided fields
  const setClauses = [];
  const values = [];

  if (fullName !== undefined) { setClauses.push('full_name = ?'); values.push(fullName); }
  if (email !== undefined) { setClauses.push('email = ?'); values.push(email); }
  if (passSecureHash !== undefined) { setClauses.push('pass_secure_hash = ?'); values.push(passSecureHash); }
  if (authProvider !== undefined) { setClauses.push('auth_provider = ?'); values.push(authProvider); }
  if (isVerified !== undefined) { setClauses.push('is_verified = ?'); values.push(isVerified); }
  // OTP fields: always include if key is present (allows explicit NULL to clear them)
  if ('otpTokenString' in userData) { setClauses.push('otp_token_string = ?'); values.push(otpTokenString ?? null); }
  if ('otpExpiration' in userData) { setClauses.push('otp_expiration = ?'); values.push(otpExpiration ?? null); }

  if (setClauses.length === 0) {
    return { id, ...userData };
  }

  const query = `UPDATE global_users SET ${setClauses.join(', ')} WHERE id = ?`;
  values.push(id);
  
  try {
    await executeQuery(query, values);
    return { id, ...userData };
  } catch (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }
};

/**
 * Delete user
 */
const deleteUser = async (id) => {
  const query = `DELETE FROM global_users WHERE id = ?`;
  
  try {
    await executeQuery(query, [id]);
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
};

/**
 * Verify email and set OTP
 */
const setOTPToken = async (userId, otpToken, expirationMinutes = 10) => {
  const query = `
    UPDATE global_users 
    SET otp_token_string = ?, otp_expiration = DATE_ADD(NOW(), INTERVAL ? MINUTE)
    WHERE id = ?
  `;
  
  try {
    await executeQuery(query, [otpToken, expirationMinutes, userId]);
  } catch (error) {
    throw new Error(`Failed to set OTP: ${error.message}`);
  }
};

/**
 * Verify OTP token
 */
const verifyOTPToken = async (userId, otpToken) => {
  const query = `
    SELECT * FROM global_users 
    WHERE id = ? AND otp_token_string = ? AND otp_expiration > NOW()
  `;
  
  try {
    const results = await executeQuery(query, [userId, otpToken]);
    return results.length > 0;
  } catch (error) {
    throw new Error(`Failed to verify OTP: ${error.message}`);
  }
};

module.exports = {
  createGlobalUsersTable,
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  deleteUser,
  setOTPToken,
  verifyOTPToken,
};
