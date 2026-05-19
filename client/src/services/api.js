// Tự động nhận diện URL máy chủ Backend thích ứng môi trường Local và Production
const getApiBaseUrl = () => {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  return 'http://localhost:3000/api';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Hàm hỗ trợ gửi request kèm hoặc không kèm token bảo mật
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Yêu cầu thất bại với mã lỗi ${response.status}`);
  }

  return response.json();
}

export const api = {
  // --- THỰC ĐƠN & ĐƠN HÀNG ---
  /**
   * Lấy danh sách món ăn từ thực đơn
   */
  getMenu: () => apiRequest('/menu'),

  /**
   * Gửi đơn đặt hàng mới
   */
  placeOrder: (orderData) => apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),

  // --- HỆ THỐNG XÁC THỰC (AUTHENTICATION) ---
  /**
   * Đăng ký tài khoản mới
   */
  register: (email, password, fullName) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, full_name: fullName })
  }),

  /**
   * Đăng nhập tài khoản
   */
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),

  /**
   * Lấy thông tin cá nhân hiện tại
   */
  getProfile: () => apiRequest('/auth/profile'),

  // --- HỆ THỐNG KIỂM TRA CHẨN ĐOÁN (DIAGNOSTICS & DB OPERATIONS) ---
  /**
   * Gọi API kiểm tra hiệu năng & tình trạng kết nối CSDL MySQL
   */
  getDiagnostics: () => apiRequest('/diagnostics'),

  /**
   * Lấy sơ đồ dữ liệu quan hệ ERD (foreign keys, columns)
   */
  getERD: () => apiRequest('/diagnostics/erd'),

  /**
   * Lấy danh sách toàn bộ bản ghi của một bảng cụ thể
   */
  getTableRows: (tableName) => apiRequest(`/diagnostics/table-rows/${tableName}`),

  /**
   * Cập nhật giá trị của một ô dữ liệu cụ thể trong bảng
   */
  updateCell: (tableName, id, field, value) => apiRequest(`/diagnostics/update-cell/${tableName}/${id}`, {
    method: 'POST',
    body: JSON.stringify({ field, value })
  }),

  /**
   * Xóa một dòng dữ liệu theo ID
   */
  deleteRow: (tableName, id) => apiRequest(`/diagnostics/delete-row/${tableName}/${id}`, {
    method: 'DELETE'
  }),

  /**
   * Thực hiện khởi tạo cấu trúc các bảng CSDL gốc
   */
  createTables: () => apiRequest('/diagnostics/create-table', {
    method: 'POST'
  }),

  /**
   * Thực hiện nạp dữ liệu món ăn mẫu
   */
  insertSampleData: () => apiRequest('/diagnostics/insert-data', {
    method: 'POST'
  })
};
