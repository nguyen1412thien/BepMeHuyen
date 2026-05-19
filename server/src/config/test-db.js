const pool = require('./db');
const path = require('path');

// Đảm bảo nạp file .env chính xác tuyệt đối để hiển thị thông số cấu hình
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * BẢNG ĐIỀU KHIỂN CẤU HÌNH & CHẨN ĐOÁN CƠ SỞ DỮ LIỆU
 * Tiện ích dòng lệnh gọn nhẹ để kiểm tra nhanh kết nối CSDL MySQL thực tế.
 */
async function runDiagnosticDashboard() {
  console.clear();
  console.log('======================================================');
  console.log('    🖥️  BẢNG ĐIỀU KHIỂN CHẨN ĐOÁN CƠ SỞ DỮ LIỆU  🖥️    ');
  console.log('                  BẾP MẸ HUYỀN                        ');
  console.log('======================================================');
  
  console.log(`🌐 Đang quét cấu hình mạng từ tệp .env...`);
  console.log(`   🔹 Địa chỉ Host: ${process.env.DB_HOST || '136.110.9.77'}`);
  console.log(`   🔹 Cổng Port    : ${process.env.DB_PORT || '3306'}`);
  console.log(`   🔹 Người dùng   : ${process.env.DB_USER || 'root'}`);
  console.log(`   🔹 Cơ sở dữ liệu: ${process.env.DB_NAME || 'bepmehuyen'}`);
  console.log('------------------------------------------------------');
  console.log('🔄 Đang tiến hành kết nối kiểm thử MySQL thực tế...');

  try {
    const startTime = Date.now();
    const conn = await pool.getConnection();
    const duration = Date.now() - startTime;

    console.log('\n🟢 KẾT NỐI THÀNH CÔNG MỸ MÃN!');
    console.log(`⚡ Độ trễ phản hồi (Latency): ${duration} ms`);
    console.log('------------------------------------------------------');

    // 1. Quét thời gian máy chủ CSDL
    const [timeResult] = await conn.query('SELECT NOW() as currentTime');
    const formattedTime = new Date(timeResult[0].currentTime).toLocaleString('vi-VN');
    console.log(`⏰ Giờ thực tế trên MySQL : ${formattedTime}`);

    // 2. Quét danh sách các bảng hiện hữu
    const [tables] = await conn.query('SHOW TABLES');
    console.log(`📋 Tổng số bảng hiện có   : ${tables.length}`);

    if (tables.length === 0) {
      console.log('   ⚠️ CẢNH BÁO: Cơ sở dữ liệu đang rỗng (chưa có bảng nào được khởi tạo).');
      console.log('   👉 Gợi ý: Bạn vui lòng chạy tệp tin schema.sql để khởi tạo cấu trúc cơ sở dữ liệu.');
    } else {
      console.log('   Danh sách các bảng đã quét thấy:');
      tables.forEach((t, i) => {
        const tableName = Object.values(t)[0];
        console.log(`     [${i + 1}] 📊 ${tableName}`);
      });
    }

    console.log('======================================================');
    console.log('💡 Kết nối pool hoạt động hoàn hảo. Backend đã sẵn sàng!');
    console.log('======================================================\n');

    conn.release();
    process.exit(0);
  } catch (error) {
    console.log('\n🔴 THỬ NGHIỆM KẾT NỐI THẤT BẠI!');
    console.log('------------------------------------------------------');
    console.log(`❌ Thông tin lỗi: ${error.message}`);
    console.log(`❌ Mã lỗi (Code) : ${error.code || 'N/A'}`);
    console.log('------------------------------------------------------');
    console.log('👉 HƯỚNG DẪN KHẮC PHỤC NHANH:');
    console.log('   1. Đảm bảo máy chủ cơ sở dữ liệu MySQL đang hoạt động trực tuyến.');
    console.log('   2. Kiểm tra xem mật khẩu hoặc địa chỉ IP host trong');
    console.log('      tệp server/.env có bị gõ sai hay không.');
    console.log('   3. Kiểm tra xem tường lửa (Firewall) của máy chủ có chặn');
    console.log('      cổng 3306 hay không.');
    console.log('======================================================\n');
    process.exit(1);
  }
}

runDiagnosticDashboard();
