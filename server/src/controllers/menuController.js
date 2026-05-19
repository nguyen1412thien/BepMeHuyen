const MenuModel = require('../models/menuModel');

class MenuController {
  /** GET /api/menu — Lấy danh sách món (public, lọc theo kitchen_id) */
  static async getAll(req, res) {
    try {
      const { kitchen_id } = req.query;
      const isStaff = req.user && (req.user.role === 'staff' || req.user.role === 'admin');
      
      const items = await MenuModel.getAll(!isStaff, kitchen_id || null);
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** GET /api/menu/:id */
  static async getOne(req, res) {
    try {
      const item = await MenuModel.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy món ăn.' });
      res.json({ success: true, data: item });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** POST /api/menu — Tạo món mới (staff/admin) */
  static async create(req, res) {
    try {
      const { name, description, price, category, image_url, is_available, kitchen_id } = req.body;
      if (!name || !price) {
        return res.status(400).json({ success: false, error: 'Tên món và giá là bắt buộc.' });
      }
      const item = await MenuModel.create({
        name, description, price, category, image_url, is_available, kitchen_id
      });
      console.log(`🍽️ [Staff] ${req.user?.email || 'System'} tạo món mới: ${name}`);
      res.status(201).json({ success: true, data: item, message: `Đã thêm món "${name}" vào thực đơn!` });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** PUT /api/menu/:id — Cập nhật món (staff/admin) */
  static async update(req, res) {
    try {
      const item = await MenuModel.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy món ăn.' });

      const updated = await MenuModel.update(req.params.id, req.body);
      console.log(`✏️ [Staff] ${req.user?.email || 'System'} cập nhật món: ${updated.name}`);
      res.json({ success: true, data: updated, message: 'Cập nhật món ăn thành công!' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** DELETE /api/menu/:id — Xóa món (staff/admin) */
  static async delete(req, res) {
    try {
      const item = await MenuModel.findById(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Không tìm thấy món ăn.' });

      await MenuModel.delete(req.params.id);
      console.log(`🗑️ [Staff] ${req.user?.email || 'System'} xóa món: ${item.name}`);
      res.json({ success: true, message: `Đã xóa món "${item.name}" khỏi thực đơn.` });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = MenuController;
