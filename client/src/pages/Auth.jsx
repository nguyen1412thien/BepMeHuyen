import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const Auth = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  
  // Login Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
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
      
      // Lưu Token vào localStorage để duy trì trạng thái đăng nhập
      localStorage.setItem('auth_token', data.token);
      
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
            <h2>Chào Mừng Bồ Quay Lại!</h2>
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
                placeholder="Nhập mật khẩu của bồ" 
                value={loginPassword} 
                onChange={(e) => setLoginPassword(e.target.value)} 
                required 
              />
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
              <label><i className="fa-solid fa-signature"></i> Họ và tên của bồ</label>
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

      <style dangerouslySetInnerHTML={{ __html: `
        .auth-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 120px);
          padding-top: 20px;
          padding-bottom: 40px;
        }

        .auth-card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-radius: 28px;
          padding: 40px;
          width: 100%;
          max-width: 460px;
          box-shadow: 0 15px 40px var(--glass-shadow);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Tabs Header */
        .tabs-header {
          display: flex;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 4px;
          margin-bottom: 30px;
        }

        .tab-btn {
          flex: 1;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-family: var(--font-main);
          font-weight: 600;
          font-size: 0.95rem;
          padding: 10px 0;
          border-radius: 12px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          background: var(--surface-dark);
          color: var(--primary);
          border: 1px solid var(--border-glow);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
        }

        /* Forms Layout */
        .auth-form h2 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #FFF;
          margin-bottom: 6px;
          letter-spacing: -0.5px;
        }

        .form-subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }

        .auth-form .form-group {
          margin-bottom: 20px;
        }

        .auth-form .form-group label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 8px;
        }

        .auth-form .form-group label i {
          color: var(--primary);
        }

        .auth-form .form-group input {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 12px 16px;
          color: var(--text-primary);
          font-family: var(--font-main);
          font-size: 0.9rem;
          transition: var(--transition-smooth);
        }

        .auth-form .form-group input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
        }

        .btn-auth {
          margin-top: 10px;
          padding: 14px;
          border-radius: 14px;
          font-size: 1rem;
        }
      ` }} />
    </div>
  );
};

export default Auth;
