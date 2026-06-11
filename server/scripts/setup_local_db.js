const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '14122005',
};

async function run() {
  try {
    console.log('1. Đang kết nối tới MySQL local (127.0.0.1:3306)...');
    const conn = await mysql.createConnection(dbConfig);
    
    console.log('2. Đang tạo cơ sở dữ liệu bepmehuyen...');
    await conn.query('CREATE DATABASE IF NOT EXISTS bepmehuyen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await conn.query('USE bepmehuyen;');
    
    console.log('3. Đang đọc tệp tin schema.sql...');
    const schemaSql = fs.readFileSync(path.resolve(__dirname, '../src/config/schema/schema.sql'), 'utf8');
    
    // Tách các câu truy vấn SQL bằng dấu chấm phẩy
    const queries = schemaSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);
      
    console.log('4. Đang khởi tạo các bảng CSDL...');
    for (const query of queries) {
      await conn.query(query);
    }
    
    console.log('5. Đang đồng bộ 3 tài khoản từ Production...');
    const hash = await bcrypt.hash('10011984', 10);
    
    const usersToSeed = [
      { email: 'nguyenthanhthien.1412thien@gmail.com', name: 'Nguyễn Thanh Thiên', role: 'admin' },
      { email: 'phuonganhnguye01082007@gmail.com', name: 'Nguyễn Trần Phương Anh', role: 'user' },
      { email: 'tranhuyen1011984@gmail.com', name: 'Trần Thị Huyền', role: 'staff' }
    ];
    
    for (const u of usersToSeed) {
      const [existing] = await conn.query('SELECT * FROM users WHERE email = ?', [u.email]);
      if (existing.length > 0) {
        // Cập nhật vai trò & trạng thái nếu đã tồn tại
        await conn.query(
          'UPDATE users SET role = ?, is_active = 1 WHERE email = ?',
          [u.role, u.email]
        );
        console.log(`🔹 Đã cập nhật quyền: ${u.email} -> ${u.role}`);
      } else {
        // Thêm mới
        await conn.query(
          'INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, 1)',
          [u.email, hash, u.name, u.role]
        );
        console.log(`✅ Đã thêm mới tài khoản: ${u.email} (Mật khẩu mặc định: 10011984)`);
      }
    }
    
    await conn.end();
    console.log('✨ Hoàn thành đồng bộ CSDL cục bộ!');
  } catch (err) {
    console.error('❌ Lỗi thiết lập:', err.message);
  }
}

run();
