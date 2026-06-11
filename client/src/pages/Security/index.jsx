import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import AlertModal from '../../components/AlertModal';
import './style.css';

const Security = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [alertState, setAlertState] = useState({ isOpen: false, message: '', type: 'info' });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showAlert = (message, type = 'info') => {
    setAlertState({ isOpen: true, message, type });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      showAlert('Mật khẩu xác nhận không khớp.', 'warning');
      return;
    }

    if (formData.newPassword.length < 6) {
      showAlert('Mật khẩu mới phải có tối thiểu 6 ký tự.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.changePassword(formData.oldPassword, formData.newPassword);
      if (response.success) {
        showAlert('Đổi mật khẩu thành công!', 'success');
        setFormData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showAlert(response.error || 'Có lỗi xảy ra', 'error');
      }
    } catch (err) {
      showAlert(err.message || 'Lỗi kết nối máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="security-page container">
      <div className="security-header">
        <h1>Bảo Mật Tài Khoản</h1>
        <p>Quản lý mật khẩu và thông tin bảo mật của bạn</p>
      </div>

      <div className="security-grid">
        {/* Cột 1: Thông tin tài khoản & Khuyên dùng bảo mật */}
        <div className="security-info-card glass-panel">
          <div className="info-card-header">
            <i className="fa-solid fa-shield-halved info-icon"></i>
            <h3>Trạng Thái Bảo Mật</h3>
          </div>
          <div className="info-card-body">
            <div className="user-info-row">
              <span className="info-label">Tài khoản email:</span>
              <span className="info-value">{user?.email || 'N/A'}</span>
            </div>
            <div className="user-info-row">
              <span className="info-label">Vai trò hệ thống:</span>
              <span className={`role-badge ${user?.role}`}>
                {user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'staff' ? 'Nhân viên bếp' : 'Khách hàng'}
              </span>
            </div>
            <div className="user-info-row">
              <span className="info-label">Trạng thái mật khẩu:</span>
              <span className="info-value text-success">
                <i className="fa-solid fa-circle-check"></i> Đang hoạt động
              </span>
            </div>

            <div className="security-tips">
              <h4>💡 Khuyên dùng bảo mật:</h4>
              <ul>
                <li>Sử dụng mật khẩu mạnh kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.</li>
                <li>Không chia sẻ mật khẩu của bạn với bất kỳ ai khác.</li>
                <li>Thay đổi mật khẩu định kỳ mỗi 3-6 tháng để đảm bảo an toàn tối đa.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Cột 2: Form đổi mật khẩu */}
        <div className="security-form-card glass-panel">
          <div className="form-card-header">
            <i className="fa-solid fa-key form-icon"></i>
            <h3>Đổi Mật Khẩu</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="security-form">
            <div className="form-group">
              <label htmlFor="oldPassword">
                <i className="fa-solid fa-lock"></i> Mật khẩu hiện tại *
              </label>
              <input
                type="password"
                id="oldPassword"
                name="oldPassword"
                placeholder="Nhập mật khẩu hiện tại"
                value={formData.oldPassword}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">
                <i className="fa-solid fa-key"></i> Mật khẩu mới *
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                placeholder="Nhập mật khẩu mới (Tối thiểu 6 ký tự)"
                value={formData.newPassword}
                onChange={handleInputChange}
                minLength={6}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <i className="fa-solid fa-circle-check"></i> Xác nhận mật khẩu mới *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu mới"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                minLength={6}
                required
              />
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => navigate('/')} 
                disabled={loading}
              >
                Quay lại Trang chủ
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Đang cập nhật...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk"></i> Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AlertModal 
        isOpen={alertState.isOpen}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Security;
