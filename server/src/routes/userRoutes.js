const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình thư mục lưu ảnh upload
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer lưu trữ file avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, webp, gif)!'));
  }
});

// Tất cả các route trong file này đều yêu cầu đăng nhập và có role là admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Route upload ảnh đại diện (avatar)
router.post('/upload-avatar', (req, res) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Không nhận được file ảnh!' });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      imageUrl: fileUrl
    });
  });
});

// Quản lý người dùng
router.get('/', UserController.getAllUsers);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);
router.delete('/:id', UserController.deleteUser);

module.exports = router;
