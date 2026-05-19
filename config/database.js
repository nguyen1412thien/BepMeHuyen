const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Configure database settings.
 * Defaults are tailored for running within Docker containers ('db' service name),
 * but can be overridden by environment variables in localhost development.
 */
const dbConfig = {
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'bep_user',
  password: process.env.DB_PASSWORD || 'bep_password',
  database: process.env.DB_NAME || 'bep_me_huyen',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log(`[Database] Initializing MySQL pool for host: ${dbConfig.host}, database: ${dbConfig.database}`);

const pool = mysql.createPool(dbConfig);

module.exports = pool;
