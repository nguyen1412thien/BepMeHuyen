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

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'user',
    is_active: true
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.getAllUsers(currentPage, limit);
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
  }, [currentPage]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        email: user.email,
        password: '',
        full_name: user.full_name || '',
        phone: user.phone || '',
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

      {loading ? (
        <div className="loader"><i className="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</div>
      ) : (
        <div className="accounts-table-container">
          <table className="accounts-table">
            <thead>
              <tr>
                <th>ID</th>
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
