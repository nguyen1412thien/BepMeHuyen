import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './services/api';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Diagnostics from './pages/Diagnostics';
import MyOrders from './pages/MyOrders';
import StaffDashboard from './pages/StaffDashboard';

const App = () => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Kiểm tra token và khôi phục phiên đăng nhập khi khởi động ứng dụng
  useEffect(() => {
    const restoreSession = async () => {
      // Đọc token từ localStorage (ghi nhớ lâu dài) hoặc sessionStorage (trong phiên làm việc hiện tại)
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        try {
          const profile = await api.getProfile();
          setUser(profile);
          console.log(`✨ Khôi phục phiên đăng nhập thành công cho: ${profile.email}`);
        } catch (err) {
          console.warn('⚠️ Token hết hạn hoặc không hợp lệ. Đang xóa phiên đăng nhập cũ.');
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
        }
      }
      setInitializing(false);
    };

    restoreSession();
  }, []);



  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    setUser(null);
    console.log('🔒 Đã đăng xuất khỏi hệ thống.');
  };

  const isStaff = user && (user.role === 'staff' || user.role === 'admin');

  if (initializing) {
    return (
      <div className="app-loader">
        <i className="fa-solid fa-utensils spinner"></i>
        <p>Bếp Mẹ Huyền đang khởi tạo...</p>
        <style dangerouslySetInnerHTML={{ __html: `
          .app-loader {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: var(--bg-dark);
            color: var(--text-secondary);
            font-family: var(--font-main);
          }
          .app-loader i {
            font-size: 3rem;
            color: var(--primary);
            margin-bottom: 16px;
          }
        ` }} />
      </div>
    );
  }

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} />
      <div className="navbar-spacer"></div>
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        <Route path="/auth" element={<Auth onLoginSuccess={handleLoginSuccess} />} />
        <Route 
          path="/my-orders" 
          element={user ? <MyOrders /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/dashboard" 
          element={isStaff ? <StaffDashboard user={user} /> : <Navigate to="/" />} 
        />
        <Route 
          path="/database" 
          element={user && user.role === 'admin' ? <Diagnostics /> : <Navigate to="/" />} 
        />
      </Routes>
    </Router>
  );
};

export default App;
