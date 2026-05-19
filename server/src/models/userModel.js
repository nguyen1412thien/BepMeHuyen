const db = require('../config/db');

class UserModel {
  /**
   * Tìm kiếm người dùng bằng email
   * @param {string} email 
   * @returns {Promise<Object|null>}
   */
  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * Tìm kiếm người dùng bằng ID
   * @param {number} id 
   * @returns {Promise<Object|null>}
   */
  static async findById(id) {
    const [rows] = await db.query(
      'SELECT id, email, full_name, phone, role, is_active, created_at, updated_at FROM users WHERE id = ?', 
      [id]
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * Lấy danh sách tất cả người dùng
   * @returns {Promise<Array>}
   */
  static async findAll() {
    const [rows] = await db.query(
      'SELECT id, email, full_name, phone, role, is_active, created_at, updated_at FROM users ORDER BY id DESC'
    );
    return rows;
  }

  /**
   * Tạo người dùng mới trong database
   * @param {Object} userData 
   * @param {string} userData.email
   * @param {string} userData.password_hash
   * @param {string} userData.full_name
   * @param {string} [userData.role]
   * @returns {Promise<Object>} Trả về bản ghi người dùng mới tạo (không có mật khẩu)
   */
  static async create({ email, password_hash, full_name, role = 'user' }) {
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
      [email, password_hash, full_name || null, role]
    );
    
    return {
      id: result.insertId,
      email,
      full_name,
      role,
      is_active: 1
    };
  }

  /**
   * Admin tạo người dùng mới
   */
  static async createAdmin({ email, password_hash, full_name, phone, role = 'user', is_active = 1 }) {
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, full_name, phone, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      [email, password_hash, full_name || null, phone || null, role, is_active]
    );
    
    return {
      id: result.insertId,
      email,
      full_name,
      phone,
      role,
      is_active
    };
  }

  /**
   * Cập nhật thông tin người dùng
   * @param {number} id 
   * @param {Object} updateData 
   */
  static async update(id, updateData) {
    const fields = [];
    const values = [];

    if (updateData.full_name !== undefined) {
      fields.push('full_name = ?');
      values.push(updateData.full_name);
    }
    if (updateData.phone !== undefined) {
      fields.push('phone = ?');
      values.push(updateData.phone);
    }
    if (updateData.role !== undefined) {
      fields.push('role = ?');
      values.push(updateData.role);
    }
    if (updateData.is_active !== undefined) {
      fields.push('is_active = ?');
      values.push(updateData.is_active);
    }
    if (updateData.password_hash !== undefined) {
      fields.push('password_hash = ?');
      values.push(updateData.password_hash);
    }

    if (fields.length === 0) return true;

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    
    await db.query(query, values);
    return true;
  }

  /**
   * Xóa người dùng
   * @param {number} id 
   */
  static async delete(id) {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    return true;
  }
}

module.exports = UserModel;
