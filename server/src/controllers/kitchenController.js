const KitchenModel = require('../models/kitchenModel');
const http = require('http'); // For standard API calls if needed

// Công thức Haversine tính khoảng cách theo tọa độ (đơn vị: km)
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

class KitchenController {
  /** GET /api/kitchens — Danh sách bếp hoạt động (Public) */
  static async getAll(req, res) {
    try {
      const onlyActive = req.query.all !== 'true'; // staff xem toàn bộ bằng cách truyền query all=true
      const kitchens = await KitchenModel.getAll(onlyActive);
      res.json({ success: true, data: kitchens });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** GET /api/kitchens/default — Lấy bếp mặc định Trần Thị Huyền */
  static async getDefault(req, res) {
    try {
      const kitchen = await KitchenModel.getDefault();
      if (!kitchen) return res.status(404).json({ success: false, error: 'Không tìm thấy bếp mặc định.' });
      res.json({ success: true, data: kitchen });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** POST /api/kitchens — Thêm bếp mới (Staff/Admin) */
  static async create(req, res) {
    try {
      const { name, address, lat, lng, staff_id, is_active } = req.body;
      if (!name || !address) {
        return res.status(400).json({ success: false, error: 'Vui lòng cung cấp Tên và Địa chỉ.' });
      }

      // Nếu không truyền staff_id, lấy chính ID của staff đang đăng nhập
      const targetStaffId = staff_id || req.user.id;

      const kitchen = await KitchenModel.create({
        name, address, lat: lat || 0, lng: lng || 0, staff_id: targetStaffId, is_active
      });

      console.log(`🍲 [Staff] ${req.user.email} đã thêm chi nhánh bếp mới: ${name}`);
      res.status(201).json({ success: true, data: kitchen, message: `Thêm chi nhánh "${name}" thành công!` });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** PUT /api/kitchens/:id — Cập nhật bếp (Staff/Admin) */
  static async update(req, res) {
    try {
      const kitchen = await KitchenModel.findById(req.params.id);
      if (!kitchen) return res.status(404).json({ success: false, error: 'Không tìm thấy chi nhánh bếp này.' });

      // Phân quyền: Staff chỉ được sửa chi nhánh do mình phụ trách
      if (req.user.role === 'staff' && kitchen.staff_id !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Bạn không có quyền sửa thông tin của chi nhánh bếp khác.' });
      }

      const updatedFields = {
        ...req.body,
        lat: req.body.lat || kitchen.lat || 0,
        lng: req.body.lng || kitchen.lng || 0
      };

      const updated = await KitchenModel.update(req.params.id, updatedFields);
      console.log(`🍲 [Staff] ${req.user.email} đã cập nhật bếp: ${updated.name}`);
      res.json({ success: true, data: updated, message: 'Cập nhật thông tin chi nhánh thành công!' });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** DELETE /api/kitchens/:id — Xóa bếp (Staff/Admin) */
  static async delete(req, res) {
    try {
      const kitchen = await KitchenModel.findById(req.params.id);
      if (!kitchen) return res.status(404).json({ success: false, error: 'Không tìm thấy chi nhánh bếp.' });

      // Phân quyền: Chỉ có Admin mới được xóa chi nhánh bếp
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Chỉ có Quản Trị Viên (Admin) mới có quyền xóa chi nhánh bếp.' });
      }

      await KitchenModel.delete(req.params.id);
      console.log(`🍲 [Staff] ${req.user.email} đã xóa bếp: ${kitchen.name}`);
      res.json({ success: true, message: `Đã xóa chi nhánh "${kitchen.name}" khỏi hệ thống.` });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /** POST /api/kitchens/nearest — Tìm bếp gần nhất (Đã bỏ map -> Trả về bếp mặc định) */
  static async getNearest(req, res) {
    try {
      const defaultKitchen = await KitchenModel.getDefault();
      if (defaultKitchen) {
        return res.json({ success: true, data: defaultKitchen, isDefault: true, distance_km: 0 });
      }
      const kitchens = await KitchenModel.getAll(true);
      if (kitchens.length === 0) {
        return res.status(404).json({ success: false, error: 'Không có chi nhánh bếp nào hoạt động.' });
      }
      res.json({
        success: true,
        data: kitchens[0],
        distance_km: 0,
        isDefault: false
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = KitchenController;
