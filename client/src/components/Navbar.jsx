import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [guestPhone, setGuestPhone] = useState(localStorage.getItem('guest_phone') || '');
  const [searchPhoneInput, setSearchPhoneInput] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  const handleLogoutClick = () => {
    onLogout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;
  const isStaff = user && (user.role === 'staff' || user.role === 'admin');

  // Fetch notifications based on user status
  const fetchNotifications = async () => {
    try {
      let ordersList = [];
      if (user) {
        // Logged-in user
        ordersList = await api.getMyOrders();
      } else {
        // Guest user
        const storedIds = JSON.parse(localStorage.getItem('guest_order_ids') || '[]');
        const phoneToUse = guestPhone || localStorage.getItem('guest_phone') || '';
        
        if (storedIds.length > 0 || phoneToUse) {
          ordersList = await api.getGuestOrders(phoneToUse, storedIds);
        }
      }

      // Convert orders to notifications format
      const notifs = ordersList.map(order => {
        let text = '';
        let icon = '';
        let type = '';

        if (order.order_status === 'pending') {
          text = `Đơn hàng #${order.id} đang chờ Bếp nhận đơn.`;
          icon = 'fa-clock';
          type = 'pending';
        } else if (order.order_status === 'confirmed') {
          text = `Đơn hàng #${order.id} đã được nhận đơn và đang chuẩn bị!`;
          icon = 'fa-bowl-food';
          type = 'confirmed';
        } else if (order.order_status === 'completed') {
          text = `Đơn hàng #${order.id} đã giao thành công! Chúc ngon miệng.`;
          icon = 'fa-circle-check';
          type = 'completed';
        } else if (order.order_status === 'cancelled') {
          text = `Đơn hàng #${order.id} đã bị hủy.`;
          icon = 'fa-ban';
          type = 'cancelled';
        }

        return {
          id: order.id,
          text,
          status: order.order_status,
          cancelReason: order.cancel_reason,
          time: new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(order.created_at).toLocaleDateString('vi-VN'),
          icon,
          type
        };
      });

      setNotifications(notifs);

      // Simple unread logic
      const lastCount = parseInt(localStorage.getItem('last_notif_count') || '0');
      if (notifs.length > lastCount) {
        setUnreadCount(notifs.length - lastCount);
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      console.warn('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Check for updates every 15 seconds
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user, guestPhone]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setUnreadCount(0);
      localStorage.setItem('last_notif_count', notifications.length.toString());
    }
  };

  const handlePhoneSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchPhoneInput.trim()) return;
    localStorage.setItem('guest_phone', searchPhoneInput.trim());
    setGuestPhone(searchPhoneInput.trim());
    setSearchPhoneInput('');
  };

  const handleClearPhone = () => {
    localStorage.removeItem('guest_phone');
    setGuestPhone('');
  };

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
          
          {user && !isStaff && (
            <Link to="/my-orders" className={`nav-link ${isActive('/my-orders') ? 'active' : ''}`}>
              <i className="fa-solid fa-clock-rotate-left"></i> Đơn Hàng Của Tôi
            </Link>
          )}

          {isStaff && (
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              <i className="fa-solid fa-chart-line"></i> Quản Lý Nghiệp Vụ
            </Link>
          )}

          {user && user.role === 'admin' && (
            <Link to="/database" className={`nav-link ${isActive('/database') ? 'active' : ''}`}>
              <i className="fa-solid fa-database"></i> Chẩn Đoán CSDL
            </Link>
          )}

          {/* Notification Icon */}
          <div className="notification-wrapper" ref={dropdownRef}>
            <button 
              className={`nav-link notification-bell-btn ${showNotifications ? 'active' : ''}`} 
              onClick={handleToggleNotifications}
              style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
            >
              <i className="fa-solid fa-bell"></i>
              {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
            </button>

            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notif-header">
                  <h4><i className="fa-solid fa-bell text-primary"></i> Thông Báo Đơn Hàng</h4>
                  {unreadCount > 0 && <span className="badge-new">{unreadCount} mới</span>}
                </div>

                {!user && (
                  <div className="notif-guest-search">
                    {guestPhone ? (
                      <div className="guest-phone-display">
                        <span>Đang tra cứu SĐT: <strong>{guestPhone}</strong></span>
                        <button className="btn-clear-phone" onClick={handleClearPhone} title="Hủy lưu SĐT">
                          <i className="fa-solid fa-circle-xmark"></i>
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handlePhoneSearchSubmit} className="notif-phone-form">
                        <input 
                          type="tel" 
                          placeholder="Nhập SĐT để đồng bộ đơn..." 
                          value={searchPhoneInput}
                          onChange={(e) => setSearchPhoneInput(e.target.value)}
                          required
                        />
                        <button type="submit" className="btn btn-primary btn-sm">Tìm</button>
                      </form>
                    )}
                  </div>
                )}

                <div className="notif-body">
                  {notifications.length === 0 ? (
                    <div className="notif-empty">
                      <i className="fa-solid fa-bell-slash"></i>
                      <p>Không có thông báo đơn hàng nào.</p>
                      {!user && !guestPhone && <small className="text-secondary">Nhập số điện thoại ở trên để đồng bộ đơn hàng.</small>}
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} className={`notif-item ${notif.type}`}>
                        <div className="notif-icon-circle">
                          <i className={`fa-solid ${notif.icon}`}></i>
                        </div>
                        <div className="notif-content">
                          <p className="notif-text">{notif.text}</p>
                          {notif.status === 'cancelled' && notif.cancelReason && (
                            <div className="notif-reason">
                              <strong>Lý do:</strong> {notif.cancelReason}
                            </div>
                          )}
                          <span className="notif-time">{notif.time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

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
