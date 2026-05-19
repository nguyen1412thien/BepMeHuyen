const express = require('express');
const router = express.Router();
const KitchenController = require('../controllers/kitchenController');
const authMiddleware = require('../middlewares/authMiddleware');
const staffMiddleware = require('../middlewares/staffMiddleware');

// Tuyến đường công khai (Public)
router.get('/', KitchenController.getAll);
router.get('/default', KitchenController.getDefault);
router.post('/nearest', KitchenController.getNearest);

// Tuyến đường bảo vệ dành riêng cho Staff/Admin
router.post('/', authMiddleware, staffMiddleware, KitchenController.create);
router.put('/:id', authMiddleware, staffMiddleware, KitchenController.update);
router.delete('/:id', authMiddleware, staffMiddleware, KitchenController.delete);

module.exports = router;
