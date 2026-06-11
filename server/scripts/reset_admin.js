const db = require('../src/config/db');
const bcrypt = require('bcryptjs');

async function run() {
  const newPassword = '10011984';
  const email = 'tranhuyen1011984@gmail.com';
  
  try {
    console.log(`Đang kết nối tới CSDL qua config/db.js...`);
    const hash = await bcrypt.hash(newPassword, 10);
    
    // Kiểm tra xem user có tồn tại không
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      // Cập nhật mật khẩu mới và đảm bảo quyền là admin
      await db.query(
        'UPDATE users SET password_hash = ?, role = "admin", is_active = 1 WHERE email = ?',
        [hash, email]
      );
      console.log(`🎉 Đã cập nhật mật khẩu mới cho admin ${email} thành công!`);
      console.log(`🔑 Mật khẩu mới: ${newPassword}`);
    } else {
      // Tạo mới tài khoản admin
      await db.query(
        'INSERT INTO users (email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, "admin", 1)',
        [email, hash, 'Trần Thị Huyền']
      );
      console.log(`🎉 Đã tạo mới tài khoản admin ${email} thành công!`);
      console.log(`🔑 Mật khẩu mặc định: ${newPassword}`);
    }
  } catch (err) {
    console.error('❌ Lỗi kết nối CSDL:', err.message);
  }
  process.exit(0);
}

run();
