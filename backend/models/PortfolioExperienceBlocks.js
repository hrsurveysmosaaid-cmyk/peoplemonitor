// backend/models/PortfolioExperienceBlocks.js
const { executeQuery } = require('../config/database');

/**
 * Create portfolio_experience_blocks table
 */
const createPortfolioExperienceBlocksTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS portfolio_experience_blocks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      portfolio_id INT NOT NULL,
      block_type ENUM('work', 'education', 'project', 'award', 'volunteer') NOT NULL,
      institution_title VARCHAR(255) NOT NULL,
      role_designation VARCHAR(255) NULL,
      date_start DATE NULL,
      date_end DATE NULL,
      description_narrative TEXT NULL,
      attached_asset_url VARCHAR(255) NULL,
      external_navigation_url VARCHAR(255) NULL,
      FOREIGN KEY (portfolio_id) REFERENCES core_portfolios(id) ON DELETE CASCADE,
      INDEX idx_portfolio_id (portfolio_id),
      INDEX idx_block_type (block_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  try {
    await executeQuery(query);
    console.log('✅ Table portfolio_experience_blocks created successfully');
  } catch (error) {
    console.error('❌ Error creating portfolio_experience_blocks table:', error.message);
    throw error;
  }
};

/**
 * Create new experience block
 */
const createExperienceBlock = async (blockData) => {
  const {
    portfolioId,
    blockType,
    institutionTitle,
    roleDesignation,
    dateStart,
    dateEnd,
    descriptionNarrative,
    attachedAssetUrl,
    externalNavigationUrl
  } = blockData;
  
  const query = `
    INSERT INTO portfolio_experience_blocks 
    (portfolio_id, block_type, institution_title, role_designation, date_start, date_end, description_narrative, attached_asset_url, external_navigation_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  try {
    const result = await executeQuery(query, [
      portfolioId,
      blockType,
      institutionTitle,
      roleDesignation,
      dateStart,
      dateEnd,
      descriptionNarrative,
      attachedAssetUrl,
      externalNavigationUrl
    ]);
    return { id: result.insertId, ...blockData };
  } catch (error) {
    throw new Error(`Failed to create experience block: ${error.message}`);
  }
};

/**
 * Get experience block by ID
 */
const getExperienceBlockById = async (id) => {
  const query = `SELECT * FROM portfolio_experience_blocks WHERE id = ?`;
  
  try {
    const results = await executeQuery(query, [id]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw new Error(`Failed to fetch experience block: ${error.message}`);
  }
};

/**
 * Get all experience blocks for portfolio
 */
const getExperienceBlocksByPortfolioId = async (portfolioId) => {
  const query = `
    SELECT * FROM portfolio_experience_blocks 
    WHERE portfolio_id = ? 
    ORDER BY date_start DESC, id DESC
  `;
  
  try {
    const results = await executeQuery(query, [portfolioId]);
    return results;
  } catch (error) {
    throw new Error(`Failed to fetch experience blocks: ${error.message}`);
  }
};

/**
 * Get experience blocks by type
 */
const getExperienceBlocksByType = async (portfolioId, blockType) => {
  const query = `
    SELECT * FROM portfolio_experience_blocks 
    WHERE portfolio_id = ? AND block_type = ? 
    ORDER BY date_start DESC
  `;
  
  try {
    const results = await executeQuery(query, [portfolioId, blockType]);
    return results;
  } catch (error) {
    throw new Error(`Failed to fetch experience blocks: ${error.message}`);
  }
};

/**
 * Update experience block
 */
const updateExperienceBlock = async (id, blockData) => {
  const {
    blockType,
    institutionTitle,
    roleDesignation,
    dateStart,
    dateEnd,
    descriptionNarrative,
    attachedAssetUrl,
    externalNavigationUrl
  } = blockData;
  
  const query = `
    UPDATE portfolio_experience_blocks SET 
      block_type = COALESCE(?, block_type),
      institution_title = COALESCE(?, institution_title),
      role_designation = COALESCE(?, role_designation),
      date_start = COALESCE(?, date_start),
      date_end = COALESCE(?, date_end),
      description_narrative = COALESCE(?, description_narrative),
      attached_asset_url = COALESCE(?, attached_asset_url),
      external_navigation_url = COALESCE(?, external_navigation_url)
    WHERE id = ?
  `;
  
  try {
    await executeQuery(query, [
      blockType,
      institutionTitle,
      roleDesignation,
      dateStart,
      dateEnd,
      descriptionNarrative,
      attachedAssetUrl,
      externalNavigationUrl,
      id
    ]);
  } catch (error) {
    throw new Error(`Failed to update experience block: ${error.message}`);
  }
};

/**
 * Delete experience block
 */
const deleteExperienceBlock = async (id) => {
  const query = `DELETE FROM portfolio_experience_blocks WHERE id = ?`;
  
  try {
    await executeQuery(query, [id]);
  } catch (error) {
    throw new Error(`Failed to delete experience block: ${error.message}`);
  }
};

module.exports = {
  createPortfolioExperienceBlocksTable,
  createExperienceBlock,
  getExperienceBlockById,
  getExperienceBlocksByPortfolioId,
  getExperienceBlocksByType,
  updateExperienceBlock,
  deleteExperienceBlock,
};
