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
      'SELECT id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at FROM users WHERE id = ?', 
      [id]
    );
    if (rows.length === 0) return null;
    return rows[0];
  }

  /**
   * Lấy danh sách tất cả người dùng (hỗ trợ phân trang và tìm kiếm/lọc)
   * @param {number} limit
   * @param {number} offset
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  static async findAll(limit = 10, offset = 0, filters = {}) {
    let query = 'SELECT id, email, full_name, phone, avatar_url, role, is_active, created_at, updated_at FROM users';
    const queryParams = [];
    const whereConditions = [];

    if (filters.search) {
      whereConditions.push('(email LIKE ? OR full_name LIKE ? OR phone LIKE ?)');
      const searchParam = `%${filters.search}%`;
      queryParams.push(searchParam, searchParam, searchParam);
    }
    if (filters.role) {
      whereConditions.push('role = ?');
      queryParams.push(filters.role);
    }
    if (filters.status !== undefined && filters.status !== '') {
      whereConditions.push('is_active = ?');
      queryParams.push(filters.status);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    const [rows] = await db.query(query, queryParams);
    return rows;
  }

  /**
   * Đếm tổng số lượng người dùng
   * @param {Object} filters
   * @returns {Promise<number>}
   */
  static async countAll(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM users';
    const queryParams = [];
    const whereConditions = [];

    if (filters.search) {
      whereConditions.push('(email LIKE ? OR full_name LIKE ? OR phone LIKE ?)');
      const searchParam = `%${filters.search}%`;
      queryParams.push(searchParam, searchParam, searchParam);
    }
    if (filters.role) {
      whereConditions.push('role = ?');
      queryParams.push(filters.role);
    }
    if (filters.status !== undefined && filters.status !== '') {
      whereConditions.push('is_active = ?');
      queryParams.push(filters.status);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    const [rows] = await db.query(query, queryParams);
    return rows[0].total;
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
  static async createAdmin({ email, password_hash, full_name, phone, avatar_url, role = 'user', is_active = 1 }) {
    const [result] = await db.query(
      'INSERT INTO users (email, password_hash, full_name, phone, avatar_url, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [email, password_hash, full_name || null, phone || null, avatar_url || null, role, is_active]
    );
    
    return {
      id: result.insertId,
      email,
      full_name,
      phone,
      avatar_url,
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
    if (updateData.avatar_url !== undefined) {
      fields.push('avatar_url = ?');
      values.push(updateData.avatar_url);
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
