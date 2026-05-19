import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

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
    </nav>
  );
};

export default Navbar;
