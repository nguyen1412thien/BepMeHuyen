const express = require('express');
const router = express.Router();
const MenuController = require('../controllers/menuController');
const authMiddleware = require('../middlewares/authMiddleware');
const staffMiddleware = require('../middlewares/staffMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình thư mục lưu ảnh upload
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer lưu trữ file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, 'dish-' + uniqueSuffix + ext);
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

// Tuyến đường công khai (có thể đính kèm thông tin token không bắt buộc để lọc is_available của staff)
router.get('/', MenuController.getAll);
router.get('/:id', MenuController.getOne);

// Các tuyến bảo vệ cho Staff/Admin
router.post('/', authMiddleware, staffMiddleware, MenuController.create);
router.put('/:id', authMiddleware, staffMiddleware, MenuController.update);
router.delete('/:id', authMiddleware, staffMiddleware, MenuController.delete);

// Route upload ảnh món ăn (hỗ trợ cả chọn file và chụp ảnh webcam)
router.post('/upload', authMiddleware, staffMiddleware, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
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

module.exports = router;
