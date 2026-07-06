// backend/models/MicroSuccessStories.js
const { executeQuery } = require('../config/database');

/**
 * Create micro_success_stories table
 */
const createMicroSuccessStoriesTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS micro_success_stories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      experience_block_id INT NOT NULL,
      story_essay_text TEXT NOT NULL,
      FOREIGN KEY (experience_block_id) REFERENCES portfolio_experience_blocks(id) ON DELETE CASCADE,
      INDEX idx_experience_block_id (experience_block_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `;
  
  try {
    await executeQuery(query);
    console.log('✅ Table micro_success_stories created successfully');
  } catch (error) {
    console.error('❌ Error creating micro_success_stories table:', error.message);
    throw error;
  }
};

/**
 * Create new success story
 */
const createSuccessStory = async (storyData) => {
  const { experienceBlockId, storyEssayText } = storyData;
  
  const query = `
    INSERT INTO micro_success_stories 
    (experience_block_id, story_essay_text)
    VALUES (?, ?)
  `;
  
  try {
    const result = await executeQuery(query, [experienceBlockId, storyEssayText]);
    return { id: result.insertId, ...storyData };
  } catch (error) {
    throw new Error(`Failed to create success story: ${error.message}`);
  }
};

/**
 * Get success story by ID
 */
const getSuccessStoryById = async (id) => {
  const query = `SELECT * FROM micro_success_stories WHERE id = ?`;
  
  try {
    const results = await executeQuery(query, [id]);
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    throw new Error(`Failed to fetch success story: ${error.message}`);
  }
};

/**
 * Get all success stories for experience block
 */
const getSuccessStoriesByExperienceBlockId = async (experienceBlockId) => {
  const query = `
    SELECT * FROM micro_success_stories 
    WHERE experience_block_id = ? 
    ORDER BY id DESC
  `;
  
  try {
    const results = await executeQuery(query, [experienceBlockId]);
    return results;
  } catch (error) {
    throw new Error(`Failed to fetch success stories: ${error.message}`);
  }
};

/**
 * Update success story
 */
const updateSuccessStory = async (id, storyData) => {
  const { storyEssayText } = storyData;
  
  const query = `
    UPDATE micro_success_stories SET 
      story_essay_text = COALESCE(?, story_essay_text)
    WHERE id = ?
  `;
  
  try {
    await executeQuery(query, [storyEssayText, id]);
  } catch (error) {
    throw new Error(`Failed to update success story: ${error.message}`);
  }
};

/**
 * Delete success story
 */
const deleteSuccessStory = async (id) => {
  const query = `DELETE FROM micro_success_stories WHERE id = ?`;
  
  try {
    await executeQuery(query, [id]);
  } catch (error) {
    throw new Error(`Failed to delete success story: ${error.message}`);
  }
};

/**
 * Delete all success stories for experience block
 */
const deleteSuccessStoriesByExperienceBlockId = async (experienceBlockId) => {
  const query = `DELETE FROM micro_success_stories WHERE experience_block_id = ?`;
  
  try {
    await executeQuery(query, [experienceBlockId]);
  } catch (error) {
    throw new Error(`Failed to delete success stories: ${error.message}`);
  }
};

module.exports = {
  createMicroSuccessStoriesTable,
  createSuccessStory,
  getSuccessStoryById,
  getSuccessStoriesByExperienceBlockId,
  updateSuccessStory,
  deleteSuccessStory,
  deleteSuccessStoriesByExperienceBlockId,
};
