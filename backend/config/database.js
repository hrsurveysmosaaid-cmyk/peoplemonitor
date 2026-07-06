// backend/config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection pool
let connectionPool;

/**
 * Initialize database connection pool
 */
const initializeDatabase = async () => {
  try {
    connectionPool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0,
    });

    console.log('✅ Database connection pool initialized successfully');
    return connectionPool;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

/**
 * Get database connection
 */
const getConnection = async () => {
  if (!connectionPool) {
    await initializeDatabase();
  }
  return connectionPool.getConnection();
};

/**
 * Execute query with prepared statements
 */
const executeQuery = async (query, values = []) => {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(query, values);
    return results;
  } catch (error) {
    throw new Error(`Query execution failed: ${error.message}`);
  } finally {
    connection.release();
  }
};

/**
 * Close database connection pool
 */
const closePool = async () => {
  if (connectionPool) {
    await connectionPool.end();
    console.log('✅ Database connection pool closed');
  }
};

module.exports = {
  initializeDatabase,
  getConnection,
  executeQuery,
  closePool,
};
