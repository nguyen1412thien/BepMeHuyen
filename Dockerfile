# Sử dụng image Node.js 18 nhẹ trên Alpine Linux
FROM node:18-alpine

# Thiết lập thư mục làm việc bên trong container
WORKDIR /usr/src/app

# Sao chép các file định nghĩa package từ thư mục server/
COPY server/package*.json ./

# Cài đặt các thư viện sản xuất (bỏ qua devDependencies để tối ưu dung lượng)
RUN npm ci --only=production

# Sao chép toàn bộ mã nguồn backend vào container
COPY server/ ./

# Mở cổng API backend (mặc định cổng 3000)
EXPOSE 3000

# Khởi chạy ứng dụng backend qua src/server.js
CMD [ "node", "src/server.js" ]
