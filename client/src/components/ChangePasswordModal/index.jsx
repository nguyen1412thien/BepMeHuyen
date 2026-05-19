import React, { useState } from 'react';
import { api } from '../../services/api';
import './style.css';

const ChangePasswordModal = ({ onClose, showAlert }) => {
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      if (showAlert) showAlert('Mật khẩu xác nhận không khớp.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await api.changePassword(formData.oldPassword, formData.newPassword);
      if (response.success) {
        if (showAlert) showAlert('Đổi mật khẩu thành công!', 'success');
        onClose();
      } else {
        if (showAlert) showAlert(response.error || 'Có lỗi xảy ra', 'error');
      }
    } catch (err) {
      if (showAlert) showAlert(err.message || 'Lỗi kết nối máy chủ', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content premium-modal">
        <div className="modal-header-accent">
          <i className="fa-solid fa-key header-icon"></i>
          <h3>Đổi Mật Khẩu</h3>
          <button className="btn-close-accent" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="premium-form">
          <div className="premium-form-body">
            <div className="form-group">
              <label><i className="fa-solid fa-lock"></i> Mật khẩu cũ*</label>
              <input
                type="password"
                name="oldPassword"
                placeholder="Nhập mật khẩu hiện tại"
                value={formData.oldPassword}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-key"></i> Mật khẩu mới*</label>
              <input
                type="password"
                name="newPassword"
                placeholder="Nhập mật khẩu mới (Tối thiểu 6 ký tự)"
                value={formData.newPassword}
                onChange={handleInputChange}
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label><i className="fa-solid fa-circle-check"></i> Xác nhận mật khẩu mới*</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Nhập lại mật khẩu mới"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                minLength={6}
                required
              />
            </div>
          </div>
          <div className="premium-form-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><i className="fa-solid fa-spinner fa-spin"></i> Đang xử lý</> : 'Xác nhận đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
