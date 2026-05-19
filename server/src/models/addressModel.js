const db = require('../config/db');

class AddressModel {
  /** Lấy tất cả địa chỉ của một user */
  static async getByUserId(userId) {
    const [rows] = await db.query(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      [userId]
    );
    return rows;
  }

  /** Lấy 1 địa chỉ theo ID */
  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM user_addresses WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /** Tạo địa chỉ mới */
  static async create({ user_id, label, full_address, lat, lng, is_default = 0 }) {
    // Nếu đặt làm mặc định, bỏ mặc định của địa chỉ cũ
    if (is_default) {
      await db.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [user_id]);
    }
    const [result] = await db.query(
      `INSERT INTO user_addresses (user_id, label, full_address, lat, lng, is_default)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, label || 'Nhà', full_address, lat || null, lng || null, is_default ? 1 : 0]
    );
    return this.findById(result.insertId);
  }

  /** Đặt địa chỉ làm mặc định */
  static async setDefault(id, userId) {
    await db.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    await db.query('UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [id, userId]);
    return this.findById(id);
  }

  /** Xóa địa chỉ */
  static async delete(id, userId) {
    const [result] = await db.query(
      'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = AddressModel;
