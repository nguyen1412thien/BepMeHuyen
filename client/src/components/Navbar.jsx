import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <i className="fa-solid fa-utensils"></i>
          <span>Bếp Mẹ Huyền</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            <i className="fa-solid fa-house"></i> Trang Chủ
          </Link>
          
          {user && user.role === 'admin' && (
            <Link to="/database" className={`nav-link ${isActive('/database') ? 'active' : ''}`}>
              <i className="fa-solid fa-database"></i> Chẩn Đoán CSDL
            </Link>
          )}

          {user ? (
            <div className="user-profile-menu">
              <span className="user-greeting">
                <i className="fa-solid fa-circle-user"></i> Chào, <strong>{user.full_name}</strong>
              </span>
              <button onClick={handleLogoutClick} className="btn-logout" title="Đăng xuất">
                <i className="fa-solid fa-right-from-bracket"></i>
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary nav-btn">
              <i className="fa-solid fa-user-plus"></i> Đăng Nhập
            </Link>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 70px;
          background: rgba(11, 15, 25, 0.85);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          z-index: 1000;
          transition: var(--transition-smooth);
        }

        .navbar-container {
          max-width: 1200px;
          height: 100%;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #FFF;
          font-weight: 800;
          font-size: 1.35rem;
          letter-spacing: -0.5px;
        }

        .navbar-logo i {
          color: var(--primary);
          font-size: 1.5rem;
        }

        .navbar-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-link {
          text-decoration: none;
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.95rem;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: var(--transition-smooth);
          padding: 6px 12px;
          border-radius: 8px;
        }

        .nav-link:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-link.active {
          color: var(--primary);
          background: rgba(255, 107, 53, 0.08);
          font-weight: 600;
        }

        .nav-btn {
          padding: 8px 16px;
          font-size: 0.9rem;
        }

        .user-profile-menu {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 6px 12px;
          border-radius: 12px;
        }

        .user-greeting {
          color: var(--text-primary);
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .user-greeting i {
          color: var(--secondary);
        }

        .btn-logout {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 1rem;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition-smooth);
        }

        .btn-logout:hover {
          color: var(--danger);
          background: rgba(239, 68, 68, 0.1);
        }
      ` }} />
    </nav>
  );
};

export default Navbar;
