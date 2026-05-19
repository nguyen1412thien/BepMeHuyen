const mysql = require('mysql2/promise');
const path = require('path');

// Đảm bảo nạp file .env chính xác tuyệt đối từ thư mục gốc của server
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '14122005',
  database: process.env.DB_NAME || 'bepmehuyen',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Cấu hình tên thực thể kết nối Google Cloud SQL
const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME || 'bepmehuyen-496800:asia-southeast1:bepmehuyen';

// Tự động chuyển đổi giữa Unix Socket (đám mây) và TCP (local development)
if (process.env.NODE_ENV === 'production' || process.env.INSTANCE_CONNECTION_NAME) {
  dbConfig.socketPath = `/cloudsql/${instanceConnectionName}`;
  console.log(`[Database] Đang khởi tạo kết nối Cloud SQL qua Unix Socket: ${dbConfig.socketPath}, database: ${dbConfig.database}`);
} else {
  dbConfig.host = process.env.DB_HOST || '136.110.9.77';
  dbConfig.port = parseInt(process.env.DB_PORT, 10) || 3306;
  console.log(`[Database] Đang khởi tạo kết nối TCP tới host: ${dbConfig.host}, database: ${dbConfig.database}`);
}

const pool = mysql.createPool(dbConfig);

module.exports = pool;
