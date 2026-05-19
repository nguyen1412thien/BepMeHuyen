# Tài Liệu Phát Triển - Bếp Mẹ Huyền

Tài liệu này tổng hợp toàn bộ các tính năng, thay đổi và tối ưu hóa cấu trúc dự án (Refactoring) đã được thực hiện trong quá trình phát triển gần đây, đặc biệt là hệ thống Quản Lý Tài Khoản và chuẩn hóa cấu trúc thư mục.

---

## 1. Phát Triển Tính Năng: Quản Lý Tài Khoản (User Management)

### 1.1. Cập Nhật Database & Model (Backend)
- **Database Schema**: Bổ sung trường `phone` (VARCHAR) vào bảng `users` nhằm lưu trữ số điện thoại của người dùng và nhân viên.
- **Model `userModel.js`**:
  - `findAll()`: Phương thức truy vấn toàn bộ người dùng từ CSDL.
  - `createAdmin()`: Cấp quyền cho Admin tự do khởi tạo tài khoản mới với chỉ định `role` (Admin/Staff/User) và `is_active`.
  - `update()`: Phương thức linh hoạt cho phép cập nhật từng trường dữ liệu (full_name, phone, role, is_active, password_hash).
  - `delete()`: Phương thức xóa tài khoản ra khỏi hệ thống.

### 1.2. Phân Quyền & API Controller (Backend)
- **Admin Middleware (`adminMiddleware.js`)**: Tạo lớp bảo mật mới (chạy ngay sau xác thực token), đảm bảo chỉ những tài khoản có `role === 'admin'` mới có quyền gọi các API quản lý nhạy cảm.
- **User Controller (`userController.js`)**: 
  - Khởi tạo controller xử lý Logic nghiệp vụ: kiểm tra định dạng, băm mật khẩu (`bcryptjs`), phòng chống lỗi (ví dụ: tự xóa tài khoản của chính mình).
- **User Routes (`userRoutes.js`)**: 
  - Đăng ký hệ thống API chuẩn RESTful cho bảng người dùng tại endpoint `/api/users`.

### 1.3. Giao Diện & Tích Hợp (Frontend)
- **API Services (`api.js`)**: Viết các lời gọi hàm tương ứng cho Frontend (GET, POST, PUT, DELETE tới `/api/users`).
- **Component `AccountsManager`**:
  - Giao diện dạng Bảng (Table) gọn gàng, liệt kê toàn bộ người dùng.
  - Form (Modal) dùng chung để **Thêm Mới** hoặc **Chỉnh Sửa** thông tin tài khoản.
  - Trực quan hóa **Vai Trò (Role)**: Sử dụng các Badge bo góc với icon (Khiên 🛡️ cho Admin, Cà vạt 👔 cho Staff, Người 👤 cho User).
  - Trực quan hóa **Trạng Thái (Status)**: Tối giản hóa giao diện bằng icon Check Xanh (Hoạt động) và Dấu X Đỏ (Bị khóa).
  - **Nút Thao Tác (Actions)**: Thiết kế dạng hộp với hiệu ứng Hover, đổ bóng chuyên nghiệp.
- **Tích Hợp `StaffDashboard`**: 
  - Gắn Tab **Quản Lý Tài Khoản** vào thanh điều hướng bên (Sidebar). Tab này được ẩn đi và chỉ xuất hiện nếu người dùng đang đăng nhập là **Admin**.

### 1.4. Tính Năng Phân Trang (Pagination)
- **Backend**: Cập nhật `findAll` trong `userModel.js` để nhận tham số `limit` và `offset`. Thêm hàm `countAll` để lấy tổng số lượng bản ghi. Điều chỉnh `getAllUsers` ở `userController.js` để trả về dữ liệu phân trang (bao gồm `total`, `page`, `totalPages`).
- **Frontend**: Tạo một Component UI dùng chung là `Pagination` (tại `client/src/components/Pagination/index.jsx` và `.css`) và tích hợp nó vào giao diện `AccountsManager`. Component hỗ trợ logic thông minh để giới hạn số trang hiển thị (thêm dấu `...` khi vượt qua giới hạn), ngăn tràn giao diện.

### 1.5. Tìm Kiếm & Lọc (Search & Filter)
- **Backend**: Bổ sung object `filters` vào `findAll` và `countAll` trong `userModel.js`. Cho phép truy vấn linh hoạt bằng mệnh đề `LIKE` cho các trường `email`, `full_name`, `phone` và khớp chính xác (`=`) cho `role`, `status`. Controller tự động trích xuất các tham số này từ `req.query`.
- **Frontend**: Bổ sung thanh công cụ tìm kiếm và lọc (`AccountsManager/index.jsx`). Sử dụng tính năng `debounce` (kỹ thuật trì hoãn 500ms sau khi người dùng ngừng gõ) để tối ưu hóa việc gọi API, giảm tải cho Server. Khi có bất kỳ thay đổi nào về bộ lọc, giao diện tự động reset về trang 1.

### 1.6. Upload Ảnh Đại Diện (Avatar)
- **Database**: Sử dụng Script `ALTER TABLE` thêm trường `avatar_url` vào bảng `users`. Update các hàm trong `userModel.js` (`findById`, `findAll`, `createAdmin`, `update`) để hỗ trợ trường này.
- **Backend API**: Bổ sung endpoint POST `/api/users/upload-avatar` tại `userRoutes.js` bằng thư viện `multer`. Hệ thống kiểm soát việc lưu trữ file vào thư mục `/public/uploads` với định dạng tên `avatar-<timestamp>.<ext>` và giới hạn dung lượng là 5MB.
- **Frontend**:
  - Giao diện dạng tròn thay thế ảnh đại diện, có icon upload thay thế trực quan khi chưa có ảnh.
  - Sử dụng hàm gọi API `uploadUserAvatar` để tải ảnh lên máy chủ, nhận lại `imageUrl` ngay lập tức và render trực tiếp trong Form. Bảng người dùng ở Dashboard cũng tự động thu nhỏ và hiển thị Avatar của từng người.

---

## 2. Chuẩn Hóa Cấu Trúc Dự Án (Refactoring)
Để đảm bảo khả năng mở rộng (scalability) và dễ dàng bảo trì (maintainability), toàn bộ cấu trúc mã nguồn đã được phân vùng lại theo các tiêu chuẩn chuyên nghiệp.

### 2.1. Phân Vùng Backend (Server)
- Tổ chức theo mô hình **MVC** tiêu chuẩn: `controllers/`, `models/`, `routes/`, `middlewares/`, `config/`.
- **Dọn dẹp Root**: Gom tất cả các script kiểm thử, script thao tác CSDL đơn lẻ (như `test_alter.js`, `test_schema.js`, `test_users.js`) vào thư mục chuyên biệt `server/scripts/`.

### 2.2. Phân Vùng Frontend (Client)
Chuyển đổi từ mô hình file phẳng (Flat structure) sang mô hình **Tính Năng / Thư mục (Feature-based/Folder-based structure)** cho toàn bộ giao diện:

**Hiện tại (Đã chuẩn hóa):**
```text
client/src/
  ├── components/
  │   ├── Navbar/
  │   │   ├── index.jsx
  │   │   └── style.css
  │   ├── AccountsManager/
  │   │   ├── index.jsx
  │   │   └── style.css
  │   └── ...
  ├── pages/
  │   ├── Auth/
  │   │   ├── index.jsx
  │   │   └── style.css
  │   ├── StaffDashboard/
  │   │   ├── index.jsx
  │   │   └── style.css
  │   └── ...
```
- **Lợi ích**: 
  - Giữ cho Component và các tệp liên quan trực tiếp đến nó (như CSS, hoặc test sau này) được đóng gói trong một thư mục duy nhất.
  - Quản lý Import linh hoạt thông qua file `index.jsx`, giúp các Component khác khi import sẽ sạch sẽ hơn (ví dụ: `import Navbar from '../components/Navbar'`).

---

## Tổng Kết
Dự án đã hình thành đầy đủ các lớp (layer) bảo mật, các API cần thiết để quản trị toàn diện người dùng, cùng với một cấu trúc code khoa học, sạch sẽ, sẵn sàng đáp ứng yêu cầu cho các giai đoạn phát triển và mở rộng trong tương lai.