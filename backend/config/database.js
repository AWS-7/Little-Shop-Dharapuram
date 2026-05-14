/**
 * MySQL Database Configuration
 * Connection Pool Setup
 */

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'littleshop_db',
  port: process.env.DB_PORT || 3306,
  
  // Pool configuration
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
  // Connection timeout
  connectTimeout: 10000,
  
  // Date handling
  dateStrings: true,
  
  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development' && process.env.DB_DEBUG === 'true'
});

// Database helper functions
const database = {
  // Get connection from pool
  getConnection: async () => {
    return await pool.getConnection();
  },
  
  // Execute query
  query: async (sql, params) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  },
  
  // Execute query with connection (for transactions)
  queryWithConnection: async (connection, sql, params) => {
    const [rows] = await connection.execute(sql, params);
    return rows;
  },
  
  // Transaction helper
  transaction: async (callback) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  
  // Insert and get ID
  insert: async (sql, params) => {
    const [result] = await pool.execute(sql, params);
    return result.insertId;
  },
  
  // Update and get affected rows
  update: async (sql, params) => {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  },
  
  // Delete and get affected rows
  delete: async (sql, params) => {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  },
  
  // Get single row
  getOne: async (sql, params) => {
    const rows = await database.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },
  
  // Get multiple rows
  getMany: async (sql, params) => {
    return await database.query(sql, params);
  },
  
  // Count rows
  count: async (table, whereClause = '', params = []) => {
    const sql = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
    const [rows] = await pool.execute(sql, params);
    return rows[0].count;
  },
  
  // Escape string (basic)
  escape: (value) => {
    return pool.escape(value);
  },
  
  // Close pool
  end: async () => {
    await pool.end();
  }
};

module.exports = database;
