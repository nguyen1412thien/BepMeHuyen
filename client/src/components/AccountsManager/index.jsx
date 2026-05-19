import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Pagination from '../Pagination';
import './style.css';

const AccountsManager = ({ showAlert }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: ''
  });
  
  // Debounce search input
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters.search]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    avatar_url: '',
    role: 'user',
    is_active: true
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const currentFilters = {
        search: debouncedSearch,
        role: filters.role,
        status: filters.status
      };
      const response = await api.getAllUsers(currentPage, limit, currentFilters);
      // Giả sử API trả về { success: true, data: [...], pagination: { totalPages, ... } }
      setUsers(response.data || []);
      if (response.pagination) {
        setTotalPages(response.pagination.totalPages);
      } else {
        // Fallback for non-paginated API
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách người dùng:', error);
      if (showAlert) showAlert('Lỗi khi tải danh sách người dùng', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [currentPage, debouncedSearch, filters.role, filters.status]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters.role, filters.status]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || '',
        role: user.role,
        is_active: user.is_active === 1
      });
    } else {
      setEditingUser(null);
      setFormData({
        email: '',
        password: '',
        full_name: '',
        phone: '',
        avatar_url: '',
        role: 'user',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formPayload = new FormData();
      formPayload.append('avatar', file);
      
      const result = await api.uploadUserAvatar(formPayload);
      if (result.success) {
        setFormData(prev => ({ ...prev, avatar_url: result.imageUrl }));
        if (showAlert) showAlert('Tải ảnh đại diện lên thành công!', 'success');
      } else {
        if (showAlert) showAlert(result.error || 'Tải ảnh thất bại!', 'error');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      if (showAlert) showAlert('Lỗi khi tải ảnh lên: ' + err.message, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        is_active: formData.is_active ? 1 : 0
      };

      if (editingUser) {
        // Cập nhật người dùng (Không gửi email, chỉ update password nếu có nhập)
        if (!payload.password) {
           delete payload.password;
        }
        delete payload.email; // Email không được phép đổi

        await api.updateUser(editingUser.id, payload);
        if (showAlert) showAlert('Cập nhật người dùng thành công', 'success');
      } else {
        // Tạo mới
        if (!payload.email || !payload.password) {
           if (showAlert) showAlert('Email và Mật khẩu là bắt buộc', 'warning');
           return;
        }
        await api.createUser(payload);
        if (showAlert) showAlert('Tạo người dùng mới thành công', 'success');
      }
      handleCloseModal();
      loadUsers();
    } catch (error) {
      console.error('Lỗi khi lưu người dùng:', error);
      if (showAlert) showAlert('Lỗi khi lưu người dùng: ' + error.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      try {
        await api.deleteUser(id);
        if (showAlert) showAlert('Xóa người dùng thành công', 'success');
        loadUsers();
      } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        if (showAlert) showAlert('Lỗi khi xóa người dùng: ' + error.message, 'error');
      }
    }
  };

  return (
    <div className="accounts-manager">
      <div className="accounts-header">
        <h3>Quản Lý Tài Khoản</h3>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <i className="fa-solid fa-user-plus"></i> Thêm Tài Khoản
        </button>
      </div>

      <div className="accounts-filters">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input 
            type="text" 
            placeholder="Tìm theo Tên, Email, SĐT..." 
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        <div className="filter-group">
          <select 
            value={filters.role} 
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
          >
            <option value="">Tất cả Vai Trò</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
            <option value="user">User</option>
          </select>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">Tất cả Trạng Thái</option>
            <option value="1">Hoạt động</option>
            <option value="0">Đã khóa</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loader"><i className="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</div>
      ) : (
        <div className="accounts-table-container">
          <table className="accounts-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ảnh</th>
                <th>Email</th>
                <th>Họ Tên</th>
                <th>SĐT</th>
                <th>Vai Trò</th>
                <th className="text-center">Trạng Thái</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="Avatar" className="user-avatar-sm" />
                    ) : (
                      <div className="user-avatar-placeholder"><i className="fa-solid fa-user"></i></div>
                    )}
                  </td>
                  <td>{u.email}</td>
                  <td>{u.full_name || '-'}</td>
                  <td>{u.phone || '-'}</td>
                  <td>
                    <div className={`role-badge role-${u.role}`}>
                      {u.role === 'admin' && <i className="fa-solid fa-shield-halved"></i>}
                      {u.role === 'staff' && <i className="fa-solid fa-user-tie"></i>}
                      {u.role === 'user' && <i className="fa-solid fa-user"></i>}
                      <span>{u.role}</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="status-cell" title={u.is_active ? 'Hoạt động' : 'Đã khóa'}>
                      {u.is_active ? (
                        <i className="fa-solid fa-circle-check"></i>
                      ) : (
                        <i className="fa-solid fa-circle-xmark"></i>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon edit" onClick={() => handleOpenModal(u)} title="Sửa">
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(u.id)} title="Xóa">
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center">Chưa có người dùng nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && totalPages > 1 && (
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          onPageChange={(page) => setCurrentPage(page)} 
        />
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingUser ? 'Chỉnh Sửa Tài Khoản' : 'Thêm Tài Khoản Mới'}</h2>
              <button className="btn-close" onClick={handleCloseModal}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="account-form">
              <div className="form-group avatar-upload-group">
                <label>Ảnh Đại Diện</label>
                <div className="avatar-preview-container">
                  {formData.avatar_url ? (
                    <img src={formData.avatar_url} alt="Avatar Preview" className="avatar-preview" />
                  ) : (
                    <div className="avatar-preview-placeholder">
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      <span>Chọn ảnh</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="avatar-file-input"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar && <div className="avatar-upload-overlay"><i className="fa-solid fa-spinner fa-spin"></i></div>}
                </div>
              </div>

              <div className="form-group">
                <label>Email <span className="text-danger">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!!editingUser}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mật Khẩu {editingUser ? '(Để trống nếu không đổi)' : '<span className="text-danger">*</span>'}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingUser}
                  minLength="6"
                />
              </div>

              <div className="form-group">
                <label>Họ và Tên</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Số Điện Thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Vai Trò</label>
                <select name="role" value={formData.role} onChange={handleInputChange}>
                  <option value="user">User</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                  />
                  <span>Tài khoản đang hoạt động</span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>Hủy</button>
                <button type="submit" className="btn btn-primary">{editingUser ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountsManager;
