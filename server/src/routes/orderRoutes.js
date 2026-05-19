const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const staffMiddleware = require('../middlewares/staffMiddleware');

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'bepmehuyen_super_secret_token_key_14122005';

// Optional Auth: Nếu có token thì giải mã lấy thông tin user, không có cũng không báo lỗi 401
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return next();
  }
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7, authHeader.length).trim() 
    : authHeader;

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    console.warn(`⚠️ Optional auth verification failed: ${error.message}`);
  }
  next();
};

// Đặt hàng (Công khai - Public cho cả khách và thành viên)
router.post('/', optionalAuth, OrderController.create);
router.post('/calculate-shipping', OrderController.calculateShipping); // Tính phí ship
router.get('/guest', OrderController.getGuestOrders); // Tra cứu cho khách vãng lai

// Lịch sử đơn hàng của người dùng đang đăng nhập
router.get('/my', authMiddleware, OrderController.getMyOrders);

// Dành cho Staff/Admin: Quản lý đơn hàng
router.get('/', authMiddleware, staffMiddleware, OrderController.getAll);
router.patch('/:id/status', authMiddleware, staffMiddleware, OrderController.updateStatus);

module.exports = router;
