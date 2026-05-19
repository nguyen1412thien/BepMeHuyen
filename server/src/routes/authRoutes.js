const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// 1. Tuyến công khai (Public Routes)
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// 2. Tuyến bảo mật (Protected Routes)
router.get('/profile', authMiddleware, AuthController.getProfile);

module.exports = router;
