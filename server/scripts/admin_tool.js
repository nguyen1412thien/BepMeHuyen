const db = require('../src/config/db');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const passwordsFilePath = path.resolve(__dirname, 'passwords.txt');

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function listAccounts() {
  try {
    const [rows] = await db.query('SELECT id, email, full_name, role, is_active, password_hash FROM users ORDER BY id ASC');
    if (rows.length === 0) {
      console.log('\n⚠️ Chưa có tài khoản nào trong hệ thống.');
      return [];
    }
    
    console.log('\n================ DANH SÁCH TÀI KHOẢN ================');
    console.table(rows.map(r => ({
      ID: r.id,
      Email: r.email,
      'Họ và tên': r.full_name || 'N/A',
      'Vai trò': r.role.toUpperCase(),
      'Mã băm Bcrypt': r.password_hash,
      'Trạng thái': r.is_active ? 'Hoạt động ✅' : 'Bị khóa ❌'
    })));
    console.log('=====================================================');
    return rows;
  } catch (err) {
    console.error('\n❌ Không thể truy vấn tài khoản:', err.message);
    return [];
  }
}

async function resetPassword() {
  console.log('\n--- ĐẶT LẠI / THAY MẬT KHẨU TỪNG TÀI KHOẢN ---');
  
  const accounts = await listAccounts();
  if (accounts.length === 0) {
    console.log('⚠️ Không có tài khoản nào để đổi mật khẩu.');
    return;
  }
  
  const targetInput = await prompt('\n👉 Nhập ID hoặc Email của tài khoản muốn đổi mật khẩu: ');
  if (!targetInput) {
    console.log('❌ Vui lòng nhập thông tin hợp lệ.');
    return;
  }
  
  let targetUser = null;
  
  if (/^\d+$/.test(targetInput)) {
    const targetId = parseInt(targetInput, 10);
    targetUser = accounts.find(a => a.id === targetId);
  } else {
    targetUser = accounts.find(a => a.email.toLowerCase() === targetInput.toLowerCase());
  }
  
  if (!targetUser) {
    console.log(`❌ Không tìm thấy tài khoản nào khớp với thông tin "${targetInput}".`);
    return;
  }
  
  console.log(`\nĐang tiến hành đổi mật khẩu cho tài khoản: ${targetUser.email} (${targetUser.full_name || 'N/A'})`);
  
  const password = await prompt('🔑 Nhập mật khẩu mới (Tối thiểu 6 ký tự): ');
  if (!password || password.length < 6) {
    console.log('❌ Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
    return;
  }

  const role = await prompt(`🛡️ Chọn vai trò mới (admin / staff / user) [Nhấn Enter để giữ nguyên vai trò "${targetUser.role}"]: `);
  
  try {
    const hash = await bcrypt.hash(password, 10);
    const targetRole = role ? role.toLowerCase() : targetUser.role;
    
    await db.query(
      'UPDATE users SET password_hash = ?, role = ?, is_active = 1 WHERE id = ?',
      [hash, targetRole, targetUser.id]
    );
    
    // Ghi nhận mật khẩu chữ thường vào file passwords.txt để sao lưu
    const timestamp = new Date().toLocaleString('vi-VN');
    const logLine = `[${timestamp}] Email: ${targetUser.email} | Mật khẩu: ${password} | Vai trò: ${targetRole.toUpperCase()}\n`;
    fs.appendFileSync(passwordsFilePath, logLine, 'utf8');

    console.log(`\n🎉 Đã cập nhật thành công tài khoản: ${targetUser.email}`);
    console.log(`   🔹 Vai trò mới: ${targetRole.toUpperCase()}`);
    console.log(`   🔹 Mật khẩu mới: ${password}`);
    console.log(`   💾 Đã lưu mật khẩu gốc vào file: server/scripts/passwords.txt`);
  } catch (err) {
    console.error('\n❌ Lỗi khi thiết lập mật khẩu:', err.message);
  }
}

function showSavedPlaintextPasswords() {
  console.log('\n--- DANH SÁCH MẬT KHẨU GỐC ĐÃ LƯU ---');
  if (!fs.existsSync(passwordsFilePath)) {
    console.log('⚠️ Chưa có lịch sử mật khẩu nào được lưu (file passwords.txt chưa được tạo).');
    return;
  }

  try {
    const data = fs.readFileSync(passwordsFilePath, 'utf8');
    if (!data.trim()) {
      console.log('⚠️ File lưu mật khẩu hiện tại đang trống.');
    } else {
      console.log(data);
    }
  } catch (err) {
    console.error('❌ Không thể đọc file mật khẩu:', err.message);
  }
}

async function main() {
  console.clear();
  let exit = false;
  
  while (!exit) {
    console.log('\n======================================================');
    console.log('     🛡️  TRÌNH QUẢN TRỊ TÀI KHOẢN - BẾP MẸ HUYỀN  🛡️    ');
    console.log('======================================================');
    console.log('1. 📋 Liệt kê danh sách tài khoản (Show Accounts)');
    console.log('2. 🔑 Đặt lại / Thay mật khẩu từng tài khoản (Reset Password)');
    console.log('3. 📄 Xem danh sách mật khẩu gốc đã đặt (View Plaintext)');
    console.log('4. ❌ Thoát');
    console.log('------------------------------------------------------');
    
    const choice = await prompt('Chọn chức năng (1-4): ');
    
    switch (choice) {
      case '1':
        await listAccounts();
        break;
      case '2':
        await resetPassword();
        break;
      case '3':
        showSavedPlaintextPasswords();
        break;
      case '4':
        exit = true;
        break;
      default:
        console.log('\n⚠️ Lựa chọn không hợp lệ, vui lòng chọn lại.');
    }
    
    if (!exit) {
      await prompt('\nNhấn Enter để quay lại menu chính...');
      console.clear();
    }
  }
  
  rl.close();
  console.log('\n👋 Đã thoát trình quản trị.');
  process.exit(0);
}

main();
