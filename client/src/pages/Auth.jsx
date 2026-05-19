import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './Auth.css';

const Auth = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  
  // Login Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true); // Ghi nhớ đăng nhập mặc định là True
  
  // Register Form states
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');

  // Status Alerts
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const clearAlerts = () => {
    setError(null);
    setSuccess(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearAlerts();
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu!');
      return;
    }

    setLoading(true);
    clearAlerts();

    try {
      const data = await api.login(loginEmail, loginPassword);
      
      // Nếu chọn "Ghi nhớ thiết bị này", lưu Token vào localStorage (bền vững qua các lần đóng/mở trình duyệt)
      // Ngược lại, chỉ lưu vào sessionStorage (sẽ tự động hủy khi đóng Tab trình duyệt)
      if (rememberMe) {
        localStorage.setItem('auth_token', data.token);
        sessionStorage.removeItem('auth_token'); // Clean up sessionStorage
      } else {
        sessionStorage.setItem('auth_token', data.token);
        localStorage.removeItem('auth_token'); // Clean up localStorage
      }
      
      // Gọi callback cập nhật State của App.jsx
      onLoginSuccess(data.user);
      
      navigate('/'); // Chuyển về trang chủ đặt món
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regEmail || !regPassword || !regName) {
      setError('Vui lòng điền đầy đủ tất cả các trường thông tin!');
      return;
    }

    if (regPassword.length < 6) {
      setError('Mật khẩu bảo mật phải dài từ 6 ký tự trở lên!');
      return;
    }

    setLoading(true);
    clearAlerts();

    try {
      const data = await api.register(regEmail, regPassword, regName);
      setSuccess(`${data.message} Vui lòng đăng nhập bằng tài khoản vừa tạo.`);
      
      // Auto pre-fill và chuyển sang tab login cho tiện
      setLoginEmail(regEmail);
      setRegEmail('');
      setRegPassword('');
      setRegName('');
      setActiveTab('login');
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Email có thể đã tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page container">
      <div className="auth-card">
        {/* Sliding Tabs Header */}
        <div className="tabs-header">
          <button 
            onClick={() => handleTabChange('login')} 
            className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
          >
            Đăng Nhập
          </button>
          <button 
            onClick={() => handleTabChange('register')} 
            className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Display Alert Messages */}
        {error && <div className="alert-box alert-error"><i className="fa-solid fa-circle-exclamation"></i> {error}</div>}
        {success && <div className="alert-box alert-success"><i className="fa-solid fa-circle-check"></i> {success}</div>}

        {/* Tab contents */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <h2>Chào Mừng Bạn Quay Lại!</h2>
            <p className="form-subtitle">Đăng nhập tài khoản để nhận ưu đãi và xem lịch sử đặt cơm.</p>

            <div className="form-group">
              <label><i className="fa-solid fa-envelope"></i> Email cá nhân</label>
              <input 
                type="email" 
                placeholder="email@example.com" 
                value={loginEmail} 
                onChange={(e) => setLoginEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label><i className="fa-solid fa-lock"></i> Mật khẩu</label>
              <input 
                type="password" 
                placeholder="Nhập mật khẩu của bạn" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                required 
              />
            </div>

            <div className="form-options">
              <label className="remember-me-label">
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                  className="remember-checkbox"
                />
                <span>Ghi nhớ thiết bị này</span>
              </label>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-auth w-100">
              {loading ? (
                <><i className="fa-solid fa-rotate spinner"></i> Đang xác thực...</>
              ) : (
                <><i className="fa-solid fa-right-to-bracket"></i> Đăng Nhập Ngay</>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <h2>Tạo Tài Khoản Mới</h2>
            <p className="form-subtitle">Đăng ký ngay để đặt cơm nhanh chóng và tiện lợi nhất.</p>

            <div className="form-group">
              <label><i className="fa-solid fa-signature"></i> Họ và tên của bạn</label>
              <input 
                type="text" 
                placeholder="Ví dụ: Nguyễn Văn Khách" 
                value={regName} 
                onChange={(e) => setRegName(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label><i className="fa-solid fa-envelope"></i> Email cá nhân</label>
              <input 
                type="email" 
                placeholder="email@example.com" 
                value={regEmail} 
                onChange={(e) => setRegEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="form-group">
              <label><i className="fa-solid fa-lock"></i> Mật khẩu bảo mật</label>
              <input 
                type="password" 
                placeholder="Tối thiểu 6 ký tự" 
                value={regPassword} 
                onChange={(e) => setRegPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-auth w-100">
              {loading ? (
                <><i className="fa-solid fa-rotate spinner"></i> Đang khởi tạo tài khoản...</>
              ) : (
                <><i className="fa-solid fa-user-plus"></i> Đăng Ký Tài Khoản</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
