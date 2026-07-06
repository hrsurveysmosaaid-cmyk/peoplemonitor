// backend/models/ExternalLiveEndorsements.js
const { executeQuery } = require('../config/database');
const crypto = require('crypto');

const createExternalLiveEndorsementsTable = async () => {
  const createQuery = `
    CREATE TABLE IF NOT EXISTS external_live_endorsements (
      id INT AUTO_INCREMENT PRIMARY KEY,
      portfolio_id INT NULL,
      experience_block_id INT NULL,
      requestor_full_name VARCHAR(255) NULL,
      requestor_email VARCHAR(255) NULL,
      requestor_job_title VARCHAR(255) NULL,
      requestor_portfolio_slug VARCHAR(255) NULL,
      requestor_experience_title VARCHAR(255) NULL,
      requestor_company_name VARCHAR(255) NULL,
      endorser_name VARCHAR(255) NULL,
      endorser_email VARCHAR(255) NULL,
      endorser_title_role VARCHAR(255) NULL,
      endorsement_body_text TEXT NULL,
      signature_vector_stream TEXT NULL,
      token_auth_string VARCHAR(64) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (portfolio_id) REFERENCES core_portfolios(id) ON DELETE CASCADE,
      FOREIGN KEY (experience_block_id) REFERENCES portfolio_experience_blocks(id) ON DELETE CASCADE,
      INDEX idx_portfolio_id (portfolio_id),
      INDEX idx_experience_block_id (experience_block_id),
      INDEX idx_token_auth (token_auth_string),
      INDEX idx_portfolio_slug (requestor_portfolio_slug)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;

  try {
    await executeQuery(createQuery);
    await executeQuery(`ALTER TABLE external_live_endorsements MODIFY portfolio_id INT NULL`);
    await executeQuery(`ALTER TABLE external_live_endorsements MODIFY experience_block_id INT NULL`);
    console.log('✅ Table external_live_endorsements created or updated successfully');
  } catch (error) {
    console.error('❌ Error creating or updating external_live_endorsements table:', error.message);
    throw error;
  }
};

const generateAuthToken = () => crypto.randomBytes(32).toString('hex');

const createPendingEndorsement = async (endorsementData) => {
  const {
    portfolioId = null,
    experienceBlockId = null,
    requestorFullName = null,
    requestorEmail = null,
    requestorJobTitle = null,
    requestorPortfolioSlug = null,
    requestorExperienceTitle = null,
    requestorCompanyName = null,
    tokenAuthString = generateAuthToken(),
  } = endorsementData;

  const query = `
    INSERT INTO external_live_endorsements 
    (portfolio_id, experience_block_id, requestor_full_name, requestor_email, requestor_job_title, requestor_portfolio_slug, requestor_experience_title, requestor_company_name, token_auth_string)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const result = await executeQuery(query, [
      portfolioId,
      experienceBlockId,
      requestorFullName,
      requestorEmail,
      requestorJobTitle,
      requestorPortfolioSlug,
      requestorExperienceTitle,
      requestorCompanyName,
      tokenAuthString,
    ]);
    return { id: result.insertId, tokenAuthString, ...endorsementData };
  } catch (error) {
    throw new Error(`Failed to create pending endorsement: ${error.message}`);
  }
};

const getEndorsementById = async (id) => {
  const query = `SELECT * FROM external_live_endorsements WHERE id = ?`;
  try {
    const results = await executeQuery(query, [id]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw new Error(`Failed to fetch endorsement: ${error.message}`);
  }
};

const getEndorsementByAuthToken = async (tokenAuthString) => {
  const query = `SELECT * FROM external_live_endorsements WHERE token_auth_string = ?`;
  try {
    const results = await executeQuery(query, [tokenAuthString]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw new Error(`Failed to fetch endorsement: ${error.message}`);
  }
};

const getEndorsementsByPortfolioId = async (portfolioId) => {
  const query = `
    SELECT * FROM external_live_endorsements 
    WHERE portfolio_id = ? 
    ORDER BY created_at DESC
  `;
  try {
    const results = await executeQuery(query, [portfolioId]);
    return results;
  } catch (error) {
    throw new Error(`Failed to fetch endorsements: ${error.message}`);
  }
};

const getEndorsementsByExperienceBlockId = async (experienceBlockId) => {
  const query = `
    SELECT * FROM external_live_endorsements 
    WHERE experience_block_id = ? 
    ORDER BY created_at DESC
  `;
  try {
    const results = await executeQuery(query, [experienceBlockId]);
    return results;
  } catch (error) {
    throw new Error(`Failed to fetch endorsements: ${error.message}`);
  }
};

const getEndorsementsByPortfolioSlug = async (portfolioSlug) => {
  const query = `
    SELECT * FROM external_live_endorsements 
    WHERE requestor_portfolio_slug = ?
    ORDER BY created_at DESC
  `;
  try {
    const results = await executeQuery(query, [portfolioSlug]);
    return results;
  } catch (error) {
    throw new Error(`Failed to fetch endorsements by slug: ${error.message}`);
  }
};

const updateEndorsementByToken = async (tokenAuthString, endorsementData) => {
  const {
    endorserName,
    endorserEmail,
    endorserTitleRole,
    endorsementBodyText,
    signatureVectorStream,
  } = endorsementData;

  const query = `
    UPDATE external_live_endorsements SET 
      endorser_name = COALESCE(?, endorser_name),
      endorser_email = COALESCE(?, endorser_email),
      endorser_title_role = COALESCE(?, endorser_title_role),
      endorsement_body_text = COALESCE(?, endorsement_body_text),
      signature_vector_stream = COALESCE(?, signature_vector_stream),
      updated_at = CURRENT_TIMESTAMP
    WHERE token_auth_string = ?
  `;

  try {
    await executeQuery(query, [
      endorserName,
      endorserEmail,
      endorserTitleRole,
      endorsementBodyText,
      signatureVectorStream,
      tokenAuthString,
    ]);
  } catch (error) {
    throw new Error(`Failed to update endorsement: ${error.message}`);
  }
};

const deleteEndorsement = async (id) => {
  const query = `DELETE FROM external_live_endorsements WHERE id = ?`;
  try {
    await executeQuery(query, [id]);
  } catch (error) {
    throw new Error(`Failed to delete endorsement: ${error.message}`);
  }
};

const deleteEndorsementsByExperienceBlockId = async (experienceBlockId) => {
  const query = `DELETE FROM external_live_endorsements WHERE experience_block_id = ?`;
  try {
    await executeQuery(query, [experienceBlockId]);
  } catch (error) {
    throw new Error(`Failed to delete endorsements: ${error.message}`);
  }
};

module.exports = {
  createExternalLiveEndorsementsTable,
  createPendingEndorsement,
  getEndorsementById,
  getEndorsementByAuthToken,
  getEndorsementsByPortfolioId,
  getEndorsementsByExperienceBlockId,
  getEndorsementsByPortfolioSlug,
  updateEndorsementByToken,
  deleteEndorsement,
  deleteEndorsementsByExperienceBlockId,
};
