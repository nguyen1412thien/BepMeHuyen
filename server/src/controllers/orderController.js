const OrderModel = require('../models/orderModel');
const KitchenModel = require('../models/kitchenModel');

// Phí ship đồng giá: 10,000 VNĐ cho mọi đơn hàng
const FLAT_SHIPPING_FEE = 10000;

class OrderController {
  /** POST /api/orders — Đặt hàng mới (Hỗ trợ khách vãng lai và thành viên) */
  static async create(req, res) {
    try {
      const {
        customer_name, customer_phone, customer_address,
        address_id, kitchen_id, shipping_fee, total_amount, 
        payment_method, notes, items
      } = req.body;

      if (!customer_name || !customer_phone || !customer_address) {
        return res.status(400).json({ success: false, error: 'Vui lòng cung cấp đầy đủ thông tin nhận hàng.' });
      }
      if (!items || items.length === 0) {
        return res.status(400).json({ success: false, error: 'Giỏ hàng của bạn đang trống.' });
      }

      // Xác định bếp phục vụ đơn hàng này
      let finalKitchenId = kitchen_id;
      if (!finalKitchenId) {
        // Mặc định lấy bếp Trần Thị Huyền hoặc bếp đầu tiên hoạt động
        const defaultKit = await KitchenModel.getDefault();
        if (defaultKit) {
          finalKitchenId = defaultKit.id;
        } else {
          const allKitchens = await KitchenModel.getAll(true);
          finalKitchenId = allKitchens[0]?.id || null;
        }
      }

      const order = await OrderModel.create({
        user_id: req.user?.id || null,
        kitchen_id: finalKitchenId,
        address_id: address_id || null,
        customer_name, 
        customer_phone, 
        customer_address,
        delivery_lat: null, 
        delivery_lng: null,
        shipping_fee: shipping_fee !== undefined ? shipping_fee : FLAT_SHIPPING_FEE,
        total_amount,
        payment_method, 
        notes, 
        items
      });

      res.status(201).json({ success: true, data: order, message: 'Đã nhận đơn hàng của bạn!' });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** GET /api/orders/my — Lịch sử đơn hàng của user */
  static async getMyOrders(req, res) {
    try {
      const orders = await OrderModel.getByUserId(req.user.id);
      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** GET /api/orders — Xem tất cả đơn hàng (staff/admin) */
  static async getAll(req, res) {
    try {
      const { status, limit, offset } = req.query;
      const orders = await OrderModel.getAll({
        status,
        limit: parseInt(limit) || 50,
        offset: parseInt(offset) || 0
      });
      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** PATCH /api/orders/:id/status — Cập nhật trạng thái đơn (staff/admin) */
  static async updateStatus(req, res) {
    try {
      const { order_status, cancel_reason } = req.body;
      const validStatuses = ['pending', 'confirmed', 'preparing', 'shipping', 'completed', 'cancelled'];
      if (!validStatuses.includes(order_status)) {
        return res.status(400).json({ success: false, error: 'Trạng thái đơn hàng không hợp lệ.' });
      }

      const order = await OrderModel.updateStatus(req.params.id, order_status, cancel_reason || null);
      if (!order) return res.status(404).json({ success: false, error: 'Không tìm thấy đơn hàng.' });

      res.json({ success: true, data: order, message: 'Đã cập nhật trạng thái đơn hàng!' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** POST /api/orders/calculate-shipping — Tính phí ship (Bỏ map -> Đồng giá 15.000đ) */
  static async calculateShipping(req, res) {
    try {
      const { kitchen_id } = req.body;

      const kitchens = await KitchenModel.getAll(true);
      if (kitchens.length === 0) {
        return res.status(404).json({ success: false, error: 'Hiện tại không có chi nhánh bếp nào hoạt động.' });
      }

      let selectedKitchen = null;

      // 1. Nếu user chọn bếp cụ thể
      if (kitchen_id) {
        selectedKitchen = kitchens.find(k => k.id === parseInt(kitchen_id));
      }

      // 2. Không chọn bếp hoặc không tìm thấy bếp đã chọn -> Tìm bếp mặc định
      if (!selectedKitchen) {
        selectedKitchen = await KitchenModel.getDefault();
      }

      // 3. Fallback lấy bếp đầu tiên
      if (!selectedKitchen) {
        selectedKitchen = kitchens[0];
      }

      if (!selectedKitchen) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy bếp hoạt động nào.' });
      }

      res.json({
        success: true,
        kitchen: selectedKitchen,
        distance_km: 0,
        shipping_fee: FLAT_SHIPPING_FEE
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** GET /api/orders/guest — Lấy đơn hàng của khách vãng lai */
  static async getGuestOrders(req, res) {
    try {
      const { phone, orderIds } = req.query;
      if (!phone && !orderIds) {
        return res.status(400).json({ success: false, error: 'Vui lòng cung cấp số điện thoại hoặc danh sách mã đơn hàng.' });
      }

      const idList = orderIds ? orderIds.split(',').map(Number).filter(Boolean) : [];
      const orders = await OrderModel.getGuestOrders({ phone: phone || null, orderIds: idList });
      res.json({ success: true, data: orders });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = OrderController;
