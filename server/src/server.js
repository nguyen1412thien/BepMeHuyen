const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 3000;

/**
 * Hàm kiểm thử kết nối CSDL khi khởi chạy ứng dụng (hỗ trợ thử lại 5 lần)
 */
async function testConnectionOnStartup(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[Database] Đang thử kết nối database... (Lần ${i + 1}/${retries})`);
      const conn = await pool.getConnection();
      console.log('✅ [Database] Kết nối CSDL thành công!');
      conn.release();
      return true;
    } catch (err) {
      console.error(`⚠️ [Database] Thử kết nối thất bại (Lần ${i + 1}/${retries}): ${err.message}`);
      if (i < retries - 1) {
        console.log(`[Database] Đang đợi ${delay / 1000}s để thử lại...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('❌ [Database] Không thể thiết lập kết nối CSDL sau các lượt thử. Hệ thống API CSDL sẽ tự động chuyển sang chế độ dự phòng.');
  return false;
}

// Khởi chạy lắng nghe cổng mạng
app.listen(PORT, async () => {
  console.log(`----------------------------------------------------`);
  console.log(`🚀 BACKEND BẾP MẸ HUYỀN ĐANG HOẠT ĐỘNG!`);
  console.log(`📡 Cổng API: http://localhost:${PORT}`);
  console.log(`----------------------------------------------------`);
  
  await testConnectionOnStartup();
});
