const db = require('../config/db');

class KitchenModel {
  /** Lấy tất cả bếp đang hoạt động */
  static async getAll(onlyActive = true) {
    const sql = onlyActive
      ? 'SELECT k.*, u.full_name AS staff_name FROM kitchens k JOIN users u ON k.staff_id = u.id WHERE k.is_active = 1'
      : 'SELECT k.*, u.full_name AS staff_name FROM kitchens k JOIN users u ON k.staff_id = u.id';
    const [rows] = await db.query(sql);
    return rows;
  }

  /** Lấy bếp theo ID */
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT k.*, u.full_name AS staff_name FROM kitchens k JOIN users u ON k.staff_id = u.id WHERE k.id = ?',
      [id]
    );
    return rows[0] || null;
  }

  /** Lấy bếp mặc định (Trần Thị Huyền) */
  static async getDefault() {
    const [rows] = await db.query(`
      SELECT k.*, u.full_name AS staff_name 
      FROM kitchens k 
      JOIN users u ON k.staff_id = u.id 
      WHERE u.full_name = 'Trần Thị Huyền' OR u.email = 'tranhuyen1011984@gmail.com'
      LIMIT 1
    `);
    if (rows[0]) return rows[0];
    
    // Fallback: lấy bếp đầu tiên
    const [all] = await db.query('SELECT k.*, u.full_name AS staff_name FROM kitchens k JOIN users u ON k.staff_id = u.id LIMIT 1');
    return all[0] || null;
  }

  /** Tạo bếp mới (staff/admin) */
  static async create({ name, address, lat, lng, staff_id, is_active = 1 }) {
    const [result] = await db.query(
      `INSERT INTO kitchens (name, address, lat, lng, staff_id, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, address, lat, lng, staff_id, is_active]
    );
    return this.findById(result.insertId);
  }

  /** Cập nhật thông tin bếp (staff/admin) */
  static async update(id, { name, address, lat, lng, staff_id, is_active }) {
    await db.query(
      `UPDATE kitchens SET
        name = COALESCE(?, name),
        address = COALESCE(?, address),
        lat = COALESCE(?, lat),
        lng = COALESCE(?, lng),
        staff_id = COALESCE(?, staff_id),
        is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [name, address, lat, lng, staff_id, is_active, id]
    );
    return this.findById(id);
  }

  /** Xóa bếp (staff/admin) */
  static async delete(id) {
    const [result] = await db.query('DELETE FROM kitchens WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = KitchenModel;
