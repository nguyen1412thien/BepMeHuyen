# ==========================================
# GIAI ĐOẠN 1: BIÊN DỊCH GIAO DIỆN (CLIENT BUILDER)
# ==========================================
FROM node:18-alpine AS client-builder

WORKDIR /usr/src/app/client

# Sao chép các file định nghĩa thư viện của frontend
COPY client/package*.json ./

# Cài đặt toàn bộ dependencies của client
RUN npm ci

# Sao chép mã nguồn frontend vào container
COPY client/ ./

# Biên dịch React app thành các tệp tin tĩnh (Static Assets)
RUN npm run build

# ==========================================
# GIAI ĐOẠN 2: THIẾT LẬP MÁY CHỦ CHẠY (RUNTIME)
# ==========================================
FROM node:18-alpine

WORKDIR /usr/src/app

# Sao chép file định nghĩa thư viện của backend
COPY server/package*.json ./

# Chỉ cài đặt các thư viện chạy sản xuất (production) để tối ưu hóa kích thước image
RUN npm ci --only=production

# Sao chép mã nguồn backend
COPY server/ ./

# Sao chép các tệp tin tĩnh React đã biên dịch từ Giai đoạn 1 vào thư mục public của Backend
COPY --from=client-builder /usr/src/app/client/dist ./public

# Mở cổng API mạng (Cloud Run sử dụng mặc định là 8080)
EXPOSE 8080

# Khởi chạy máy chủ Node.js
CMD [ "node", "src/server.js" ]
