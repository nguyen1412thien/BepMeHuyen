// Dùng đường dẫn tương đối /api:
// - Khi dev local: Vite proxy tự chuyển tiếp sang backend (không cần build)
// - Khi production: Express server phục vụ trực tiếp
const API_BASE_URL = '/api';

/**
 * Hàm hỗ trợ gửi request kèm hoặc không kèm token bảo mật
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
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
  // --- THỰC ĐƠN ---
  /**
   * Lấy danh sách món ăn từ thực đơn (lọc theo chi nhánh bếp nếu có)
   */
  getMenu: (kitchenId = null) => {
    const url = kitchenId ? `/menu?kitchen_id=${kitchenId}` : '/menu';
    return apiRequest(url).then(res => res.data || res);
  },

  /**
   * Thêm món ăn mới (Staff/Admin)
   */
  createMenuItem: (data) => apiRequest('/menu', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  /**
   * Cập nhật thông tin món ăn (Staff/Admin)
   */
  updateMenuItem: (id, data) => apiRequest(`/menu/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  /**
   * Xóa món ăn khỏi thực đơn (Staff/Admin)
   */
  deleteMenuItem: (id) => apiRequest(`/menu/${id}`, {
    method: 'DELETE'
  }),

  /**
   * Upload ảnh món ăn mới (chụp ảnh hoặc upload file)
   */
  uploadMenuItemImage: (formData) => apiRequest('/menu/upload', {
    method: 'POST',
    body: formData
  }),

  // --- ĐỊA CHỈ GIAO HÀNG (USERS) ---
  /**
   * Lấy các địa chỉ giao hàng đã lưu của user
   */
  getAddresses: () => apiRequest('/addresses').then(res => res.data || []),

  /**
   * Lưu địa chỉ giao hàng mới
   */
  createAddress: (data) => apiRequest('/addresses', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  /**
   * Đặt địa chỉ làm mặc định
   */
  setDefaultAddress: (id) => apiRequest(`/addresses/${id}/default`, {
    method: 'PATCH'
  }),

  /**
   * Xóa địa chỉ đã lưu
   */
  deleteAddress: (id) => apiRequest(`/addresses/${id}`, {
    method: 'DELETE'
  }),

  // --- CHI NHÁNH NHÀ BẾP (KITCHENS) ---
  /**
   * Lấy danh sách toàn bộ các chi nhánh nhà bếp
   */
  getKitchens: (all = false) => {
    const url = all ? '/kitchens?all=true' : '/kitchens';
    return apiRequest(url).then(res => res.data || []);
  },

  /**
   * Tìm nhà bếp gần nhất dựa trên tọa độ
   */
  getNearestKitchen: (lat, lng) => apiRequest('/kitchens/nearest', {
    method: 'POST',
    body: JSON.stringify({ lat, lng })
  }).then(res => res.data || res),

  /**
   * Lấy bếp mặc định (Trần Thị Huyền)
   */
  getDefaultKitchen: () => apiRequest('/kitchens/default').then(res => res.data || null),

  /**
   * Tạo chi nhánh bếp mới (Staff/Admin)
   */
  createKitchen: (data) => apiRequest('/kitchens', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  /**
   * Cập nhật thông tin chi nhánh bếp (Staff/Admin)
   */
  updateKitchen: (id, data) => apiRequest(`/kitchens/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  /**
   * Xóa chi nhánh bếp (Staff/Admin)
   */
  deleteKitchen: (id) => apiRequest(`/kitchens/${id}`, {
    method: 'DELETE'
  }),

  // --- ĐƠN HÀNG ---
  /**
   * Gửi đơn đặt hàng mới
   */
  placeOrder: (orderData) => apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),

  /**
   * Lấy lịch sử đơn hàng cá nhân (User)
   */
  getMyOrders: () => apiRequest('/orders/my').then(res => res.data || []),

  /**
   * Lấy toàn bộ đơn hàng (Staff/Admin)
   */
  getAllOrders: (status = null) => {
    const url = status ? `/orders?status=${status}` : '/orders';
    return apiRequest(url).then(res => res.data || []);
  },

  /**
   * Cập nhật trạng thái của đơn hàng (Staff/Admin)
   */
  updateOrderStatus: (id, status, cancelReason = null) => apiRequest(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ order_status: status, cancel_reason: cancelReason })
  }),

  /**
   * Lấy đơn hàng cho khách vãng lai bằng số điện thoại / danh sách orderIds
   */
  getGuestOrders: (phone = '', orderIds = []) => {
    let url = `/orders/guest?`;
    const params = [];
    if (phone) params.push(`phone=${encodeURIComponent(phone)}`);
    if (orderIds && orderIds.length > 0) params.push(`orderIds=${orderIds.join(',')}`);
    url += params.join('&');
    return apiRequest(url).then(res => res.data || []);
  },

  /**
   * Tính toán phí giao hàng & khoảng cách (Google Maps / Coords)
   */
  calculateShipping: (payload) => apiRequest('/orders/calculate-shipping', {
    method: 'POST',
    body: JSON.stringify(payload)
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
  }),

  // --- QUẢN LÝ NGƯỜI DÙNG (ADMIN) ---
  /**
   * Lấy danh sách người dùng (có phân trang và bộ lọc)
   */
  getAllUsers: (page = 1, limit = 10, filters = {}) => {
    let url = `/users?page=${page}&limit=${limit}`;
    if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
    if (filters.role) url += `&role=${encodeURIComponent(filters.role)}`;
    if (filters.status !== undefined && filters.status !== '') url += `&status=${filters.status}`;
    return apiRequest(url).then(res => res);
  },

  /**
   * Tạo người dùng mới
   */
  createUser: (data) => apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  /**
   * Cập nhật thông tin người dùng
   */
  updateUser: (id, data) => apiRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  /**
   * Xóa người dùng
   */
  deleteUser: (id) => apiRequest(`/users/${id}`, {
    method: 'DELETE'
  }),
};
