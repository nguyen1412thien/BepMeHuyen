const express = require('express');
const router = express.Router();
const AddressController = require('../controllers/addressController');
const authMiddleware = require('../middlewares/authMiddleware');

// Tất cả các tuyến đường địa chỉ đều yêu cầu đăng nhập
router.use(authMiddleware);

router.get('/', AddressController.getAll);
router.post('/', AddressController.create);
router.patch('/:id/default', AddressController.setDefault);
router.delete('/:id', AddressController.delete);

module.exports = router;
