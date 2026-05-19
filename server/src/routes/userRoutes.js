const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Tất cả các route trong file này đều yêu cầu đăng nhập và có role là admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Quản lý người dùng
router.get('/', UserController.getAllUsers);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

module.exports = router;
