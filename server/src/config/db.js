const mysql = require('mysql2/promise');
const path = require('path');

// Đảm bảo nạp file .env chính xác tuyệt đối từ thư mục gốc của server
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || '136.110.9.77',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '14122005',
  database: process.env.DB_NAME || 'bepmehuyen',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log(`[Database] Đang khởi tạo kết nối MySQL pool tới host: ${dbConfig.host}, database: ${dbConfig.database}`);

const pool = mysql.createPool(dbConfig);

module.exports = pool;
