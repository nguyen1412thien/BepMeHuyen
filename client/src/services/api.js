const API_BASE_URL = 'http://localhost:3000/api';

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

  // --- HỆ THỐNG KIỂM TRA CHẨN ĐOÁN (DIAGNOSTICS) ---
  /**
   * Gọi API kiểm tra hiệu năng & tình trạng kết nối CSDL MySQL
   */
  getDiagnostics: () => apiRequest('/diagnostics')
};
