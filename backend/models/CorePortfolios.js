// backend/models/CorePortfolios.js
const { executeQuery } = require('../config/database');

/**
 * Create core_portfolios table
 */
const createCorePortfoliosTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS core_portfolios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      unique_slug_string VARCHAR(255) UNIQUE NOT NULL,
      personal_data_json JSON NOT NULL,
      professional_summary TEXT NOT NULL,
      skills_classified_json JSON NOT NULL,
      is_published_live BOOLEAN DEFAULT FALSE,
      record_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES global_users(id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_unique_slug (unique_slug_string),
      INDEX idx_published (is_published_live)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  try {
    await executeQuery(query);
    console.log('✅ Table core_portfolios created successfully');
  } catch (error) {
    console.error('❌ Error creating core_portfolios table:', error.message);
    throw error;
  }
};

/**
 * Create new portfolio
 */
const createPortfolio = async (portfolioData) => {
  const { userId, uniqueSlugString, personalDataJson, professionalSummary, skillsClassifiedJson, isPublishedLive = false } = portfolioData;
  
  const query = `
    INSERT INTO core_portfolios 
    (user_id, unique_slug_string, personal_data_json, professional_summary, skills_classified_json, is_published_live)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  try {
    const result = await executeQuery(query, [
      userId,
      uniqueSlugString,
      JSON.stringify(personalDataJson),
      professionalSummary,
      JSON.stringify(skillsClassifiedJson),
      isPublishedLive
    ]);
    return { id: result.insertId, ...portfolioData };
  } catch (error) {
    throw new Error(`Failed to create portfolio: ${error.message}`);
  }
};

/**
 * Get portfolio by ID
 */
const getPortfolioById = async (id) => {
  const query = `SELECT * FROM core_portfolios WHERE id = ?`;
  
  try {
    const results = await executeQuery(query, [id]);
    if (results.length > 0) {
      results[0].personal_data_json = JSON.parse(results[0].personal_data_json);
      results[0].skills_classified_json = JSON.parse(results[0].skills_classified_json);
    }
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw new Error(`Failed to fetch portfolio: ${error.message}`);
  }
};

/**
 * Get portfolio by slug
 */
const getPortfolioBySlug = async (slug) => {
  const query = `SELECT * FROM core_portfolios WHERE unique_slug_string = ?`;
  
  try {
    const results = await executeQuery(query, [slug]);
    if (results.length > 0) {
      results[0].personal_data_json = JSON.parse(results[0].personal_data_json);
      results[0].skills_classified_json = JSON.parse(results[0].skills_classified_json);
    }
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw new Error(`Failed to fetch portfolio: ${error.message}`);
  }
};

/**
 * Get all portfolios for user
 */
const getPortfoliosByUserId = async (userId) => {
  const query = `SELECT * FROM core_portfolios WHERE user_id = ? ORDER BY record_updated DESC`;
  
  try {
    const results = await executeQuery(query, [userId]);
    return results.map(portfolio => ({
      ...portfolio,
      personal_data_json: JSON.parse(portfolio.personal_data_json),
      skills_classified_json: JSON.parse(portfolio.skills_classified_json)
    }));
  } catch (error) {
    throw new Error(`Failed to fetch portfolios: ${error.message}`);
  }
};

/**
 * Update portfolio
 */
const updatePortfolio = async (id, portfolioData) => {
  const { personalDataJson, professionalSummary, skillsClassifiedJson, isPublishedLive, uniqueSlugString } = portfolioData;
  
  const query = `
    UPDATE core_portfolios SET 
      personal_data_json = COALESCE(?, personal_data_json),
      professional_summary = COALESCE(?, professional_summary),
      skills_classified_json = COALESCE(?, skills_classified_json),
      is_published_live = COALESCE(?, is_published_live),
      unique_slug_string = COALESCE(?, unique_slug_string),
      record_updated = CURRENT_TIMESTAMP
    WHERE id = ?
  `;
  
  try {
    await executeQuery(query, [
      personalDataJson ? JSON.stringify(personalDataJson) : null,
      professionalSummary,
      skillsClassifiedJson ? JSON.stringify(skillsClassifiedJson) : null,
      isPublishedLive,
      uniqueSlugString || null,
      id
    ]);
  } catch (error) {
    throw new Error(`Failed to update portfolio: ${error.message}`);
  }
};

/**
 * Delete portfolio
 */
const deletePortfolio = async (id) => {
  const query = `DELETE FROM core_portfolios WHERE id = ?`;
  
  try {
    await executeQuery(query, [id]);
  } catch (error) {
    throw new Error(`Failed to delete portfolio: ${error.message}`);
  }
};

/**
 * Publish portfolio
 */
const publishPortfolio = async (id) => {
  const query = `UPDATE core_portfolios SET is_published_live = TRUE WHERE id = ?`;
  
  try {
    await executeQuery(query, [id]);
  } catch (error) {
    throw new Error(`Failed to publish portfolio: ${error.message}`);
  }
};

/**
 * Unpublish portfolio
 */
const unpublishPortfolio = async (id) => {
  const query = `UPDATE core_portfolios SET is_published_live = FALSE WHERE id = ?`;
  
  try {
    await executeQuery(query, [id]);
  } catch (error) {
    throw new Error(`Failed to unpublish portfolio: ${error.message}`);
  }
};

module.exports = {
  createCorePortfoliosTable,
  createPortfolio,
  getPortfolioById,
  getPortfolioBySlug,
  getPortfoliosByUserId,
  updatePortfolio,
  deletePortfolio,
  publishPortfolio,
  unpublishPortfolio,
};
