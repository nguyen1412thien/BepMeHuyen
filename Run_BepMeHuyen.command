#!/bin/bash
# Thiết lập làm việc tại thư mục chứa tệp script này
cd "$(dirname "$0")"

clear
echo "=========================================================="
echo "   🍀 KHỞI ĐỘNG HỆ THỐNG BÁN CƠM BẾP MẸ HUYỀN 🍀"
echo "=========================================================="
echo ""

# 1. Tự động giải phóng cổng 3000 và 5500 nếu có tiến trình chạy ngầm cũ bị kẹt
echo "🔄 Bước 1: Đang giải phóng các cổng kết nối cũ (Tránh lỗi EADDRINUSE)..."
kill -9 $(lsof -t -i:3000) 2>/dev/null
kill -9 $(lsof -t -i:5500) 2>/dev/null
sleep 1

# 2. Chạy cài đặt dependencies dự phòng (nếu thư mục cài đặt trống)
if [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "📦 Bước 2: Đang cài đặt thư viện cần thiết tự động..."
    npm run install-all
fi

# 3. Khởi chạy song song cả client và server
echo "🚀 Bước 3: Đang khởi động Backend Server & Frontend Vite..."
npm run dev &
DEV_PID=$!

# 4. Đợi máy chủ khởi động ổn định rồi tự động mở trình duyệt
echo "⏳ Đang đợi 3 giây để hệ thống ổn định..."
sleep 3

echo "🌐 Bước 4: Đang tự động mở trang web Bếp Mẹ Huyền..."
open "http://localhost:5500"

# Giữ cửa sổ terminal mở để hiển thị logs
echo ""
echo "=========================================================="
echo "🎉 HỆ THỐNG ĐÃ SẴN SÀNG HOẠT ĐỘNG!"
echo "👉 Giao diện bán cơm: http://localhost:5500"
echo "👉 Để dừng hệ thống: Nhấn phím Control + C hoặc đóng cửa sổ Terminal này."
echo "=========================================================="
echo ""

# Chờ tiến trình chạy kết thúc
wait $DEV_PID
