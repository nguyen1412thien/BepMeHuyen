const AddressModel = require('../models/addressModel');

class AddressController {
  /** GET /api/addresses — Lấy địa chỉ của user đang đăng nhập */
  static async getAll(req, res) {
    try {
      const addresses = await AddressModel.getByUserId(req.user.id);
      res.json({ success: true, data: addresses });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** POST /api/addresses — Thêm địa chỉ mới */
  static async create(req, res) {
    try {
      const { label, full_address, lat, lng, is_default } = req.body;
      if (!full_address) {
        return res.status(400).json({ success: false, error: 'Địa chỉ giao hàng là bắt buộc.' });
      }
      const address = await AddressModel.create({
        user_id: req.user.id, label, full_address, lat, lng, is_default
      });
      res.status(201).json({ success: true, data: address, message: 'Đã lưu địa chỉ mới!' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** PATCH /api/addresses/:id/default — Đặt làm địa chỉ mặc định */
  static async setDefault(req, res) {
    try {
      const address = await AddressModel.findById(req.params.id);
      if (!address || address.user_id != req.user.id) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy địa chỉ.' });
      }
      const updated = await AddressModel.setDefault(req.params.id, req.user.id);
      res.json({ success: true, data: updated, message: 'Đã đặt làm địa chỉ mặc định!' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** DELETE /api/addresses/:id — Xóa địa chỉ */
  static async delete(req, res) {
    try {
      const deleted = await AddressModel.delete(req.params.id, req.user.id);
      if (!deleted) return res.status(404).json({ success: false, error: 'Không tìm thấy địa chỉ.' });
      res.json({ success: true, message: 'Đã xóa địa chỉ.' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = AddressController;
