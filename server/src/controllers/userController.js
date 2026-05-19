const UserModel = require('../models/userModel');
const bcrypt = require('bcryptjs');

class UserController {
  /**
   * Lấy danh sách tất cả người dùng (dành cho Admin)
   */
  static async getAllUsers(req, res) {
    try {
      const users = await UserModel.findAll();
      res.json({ success: true, data: users });
    } catch (error) {
      console.error('Lỗi khi lấy danh sách user:', error);
      res.status(500).json({ success: false, error: 'Lỗi server' });
    }
  }

  /**
   * Admin tạo người dùng mới
   */
  static async createUser(req, res) {
    try {
      const { email, password, full_name, phone, role, is_active } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email và mật khẩu là bắt buộc' });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'Email đã được sử dụng' });
      }

      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      const newUser = await UserModel.createAdmin({ 
        email, 
        password_hash, 
        full_name, 
        phone,
        role: role || 'user',
        is_active: is_active !== undefined ? is_active : 1
      });

      res.status(201).json({ success: true, data: newUser, message: 'Tạo tài khoản thành công' });
    } catch (error) {
      console.error('Lỗi khi tạo user:', error);
      res.status(500).json({ success: false, error: 'Lỗi server' });
    }
  }

  /**
   * Admin cập nhật thông tin người dùng
   */
  static async updateUser(req, res) {
    try {
      const id = req.params.id;
      const { full_name, phone, role, is_active, password } = req.body;
      
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
      }

      const updateData = { full_name, phone, role, is_active };

      if (password) {
        const saltRounds = 10;
        updateData.password_hash = await bcrypt.hash(password, saltRounds);
      }

      // Xóa các key undefined
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

      await UserModel.update(id, updateData);
      
      const updatedUser = await UserModel.findById(id);
      
      res.json({ success: true, data: updatedUser, message: 'Cập nhật tài khoản thành công' });
    } catch (error) {
      console.error('Lỗi khi cập nhật user:', error);
      res.status(500).json({ success: false, error: 'Lỗi server' });
    }
  }

  /**
   * Admin xóa người dùng
   */
  static async deleteUser(req, res) {
    try {
      const id = req.params.id;
      
      if (parseInt(id) === req.user.id) {
         return res.status(400).json({ success: false, error: 'Không thể xóa tài khoản của chính bạn' });
      }

      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ success: false, error: 'Không tìm thấy người dùng' });
      }

      await UserModel.delete(id);
      res.json({ success: true, message: 'Xóa tài khoản thành công' });
    } catch (error) {
      console.error('Lỗi khi xóa user:', error);
      res.status(500).json({ success: false, error: 'Lỗi server' });
    }
  }
}

module.exports = UserController;