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
      'SELECT id, email, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?', 
      [id]
    );
    if (rows.length === 0) return null;
    return rows[0];
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
}

module.exports = UserModel;
