// backend/models/Partners.js
const { executeQuery } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Create partners table and alter global_users to add partner_id
 */
const createPartnersTable = async () => {
  const createTable = `
    CREATE TABLE IF NOT EXISTS partners (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) UNIQUE NOT NULL,
      logo_url VARCHAR(255) NULL,
      admin_email VARCHAR(255) UNIQUE NOT NULL,
      pass_secure_hash VARCHAR(255) NOT NULL,
      record_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_slug (slug),
      INDEX idx_admin_email (admin_email)
    )
  `;
  await executeQuery(createTable);
  console.log('✅ Table partners created/verified successfully');

  // Add partner_id to global_users if it does not exist
  const addColumn = `
    ALTER TABLE global_users
    ADD COLUMN IF NOT EXISTS partner_id INT NULL DEFAULT NULL
  `;
  try {
    await executeQuery(addColumn);
    console.log('✅ Column partner_id added to global_users');
  } catch (err) {
    // Column may already exist in some MySQL versions that don't support IF NOT EXISTS
    if (!err.message.includes('Duplicate column')) {
      throw err;
    }
  }
};

/**
 * Create a new partner/center
 */
const createPartner = async ({ name, slug, logoUrl, adminEmail, password }) => {
  const passSecureHash = await bcrypt.hash(password, 10);
  const query = `
    INSERT INTO partners (name, slug, logo_url, admin_email, pass_secure_hash)
    VALUES (?, ?, ?, ?, ?)
  `;
  const result = await executeQuery(query, [name, slug, logoUrl || null, adminEmail.toLowerCase().trim(), passSecureHash]);
  return { id: result.insertId, name, slug, adminEmail };
};

/**
 * Get partner by ID
 */
const getPartnerById = async (id) => {
  const results = await executeQuery('SELECT * FROM partners WHERE id = ?', [id]);
  return results.length > 0 ? results[0] : null;
};

/**
 * Get partner by slug (for referral lookup)
 */
const getPartnerBySlug = async (slug) => {
  const results = await executeQuery('SELECT * FROM partners WHERE slug = ?', [slug]);
  return results.length > 0 ? results[0] : null;
};

/**
 * Get partner by admin email (for login)
 */
const getPartnerByEmail = async (email) => {
  const results = await executeQuery('SELECT * FROM partners WHERE admin_email = ?', [email.toLowerCase().trim()]);
  return results.length > 0 ? results[0] : null;
};

/**
 * List all partners with their student counts
 */
const listAllPartners = async () => {
  const query = `
    SELECT
      p.id,
      p.name,
      p.slug,
      p.logo_url      AS logoUrl,
      p.admin_email   AS adminEmail,
      p.record_created AS createdAt,
      COUNT(u.id)      AS totalStudents
    FROM partners p
    LEFT JOIN global_users u ON u.partner_id = p.id
    GROUP BY p.id
    ORDER BY p.id DESC
  `;
  return executeQuery(query);
};

/**
 * Delete a partner
 */
const deletePartner = async (id) => {
  // Unlink students first
  await executeQuery('UPDATE global_users SET partner_id = NULL WHERE partner_id = ?', [id]);
  await executeQuery('DELETE FROM partners WHERE id = ?', [id]);
};

/**
 * Get students belonging to a specific partner
 */
const getPartnerStudents = async (partnerId) => {
  const query = `
    SELECT
      u.id,
      u.full_name       AS fullName,
      u.email,
      u.is_verified     AS isVerified,
      u.auth_provider   AS authProvider,
      u.record_created  AS registeredAt,
      cp.unique_slug_string AS portfolioSlug,
      cp.is_published_live  AS isPublished
    FROM global_users u
    LEFT JOIN core_portfolios cp ON cp.user_id = u.id
    WHERE u.partner_id = ?
    ORDER BY u.id DESC
  `;
  const rows = await executeQuery(query, [partnerId]);

  // Merge duplicate rows (user may have multiple portfolios)
  return rows.reduce((acc, row) => {
    const existing = acc.find((s) => s.id === row.id);
    if (existing) {
      if (row.portfolioSlug) {
        existing.portfolios.push({ slug: row.portfolioSlug, isPublished: !!row.isPublished });
      }
      return acc;
    }
    acc.push({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      isVerified: !!row.isVerified,
      authProvider: row.authProvider,
      registeredAt: row.registeredAt,
      portfolios: row.portfolioSlug ? [{ slug: row.portfolioSlug, isPublished: !!row.isPublished }] : [],
    });
    return acc;
  }, []);
};

module.exports = {
  createPartnersTable,
  createPartner,
  getPartnerById,
  getPartnerBySlug,
  getPartnerByEmail,
  listAllPartners,
  deletePartner,
  getPartnerStudents,
};
