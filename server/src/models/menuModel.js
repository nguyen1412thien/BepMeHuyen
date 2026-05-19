const db = require('../config/db');

class MenuModel {
  /** Lấy toàn bộ món ăn (kèm thông tin danh mục, lọc theo is_available và kitchen_id) */
  static async getAll(onlyAvailable = false, kitchenId = null) {
    let sql = `
      SELECT p.*, c.slug AS category, c.name AS category_name, k.name AS kitchen_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN kitchens k ON p.kitchen_id = k.id
    `;
    const conditions = [];
    const params = [];

    if (onlyAvailable) {
      conditions.push('p.is_available = 1');
    }

    if (kitchenId) {
      conditions.push('p.kitchen_id = ?');
      params.push(kitchenId);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY c.slug, p.name';

    const [rows] = await db.query(sql, params);
    return rows;
  }

  /** Lấy 1 món theo ID */
  static async findById(id) {
    const [rows] = await db.query(`
      SELECT p.*, c.slug AS category, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);
    return rows[0] || null;
  }

  /** Lấy ID của danh mục dựa trên slug/name */
  static async getCategoryIdBySlug(slug) {
    const [rows] = await db.query('SELECT id FROM categories WHERE slug = ? OR name = ? LIMIT 1', [slug, slug]);
    return rows[0] ? rows[0].id : null;
  }

  /** Tạo món mới (staff/admin) */
  static async create({ name, description, price, category, image_url, is_available = 1, kitchen_id }) {
    // Tìm category_id từ slug
    let categoryId = await this.getCategoryIdBySlug(category || 'Main Course');
    if (!categoryId) {
      // Mặc định lấy category đầu tiên
      const [firstCat] = await db.query('SELECT id FROM categories LIMIT 1');
      categoryId = firstCat[0]?.id;
    }

    // Nếu không truyền kitchen_id, tự động lấy bếp mặc định
    let targetKitchenId = kitchen_id;
    if (!targetKitchenId) {
      const [defaultKit] = await db.query(`
        SELECT k.id FROM kitchens k 
        JOIN users u ON k.staff_id = u.id 
        WHERE u.full_name = 'Trần Thị Huyền' LIMIT 1
      `);
      targetKitchenId = defaultKit[0]?.id || null;
    }

    const [result] = await db.query(
      `INSERT INTO products (category_id, name, description, price, image_url, is_available, kitchen_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [categoryId, name, description || null, price, image_url || null, is_available, targetKitchenId]
    );
    return this.findById(result.insertId);
  }

  /** Cập nhật món (staff/admin) */
  static async update(id, { name, description, price, category, image_url, is_available, kitchen_id }) {
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }
    if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
    if (is_available !== undefined) { updates.push('is_available = ?'); params.push(is_available); }
    if (kitchen_id !== undefined) { updates.push('kitchen_id = ?'); params.push(kitchen_id); }

    if (category !== undefined) {
      const categoryId = await this.getCategoryIdBySlug(category);
      if (categoryId) {
        updates.push('category_id = ?');
        params.push(categoryId);
      }
    }

    if (updates.length === 0) return this.findById(id);

    params.push(id);
    await db.query(`UPDATE products SET ${updates.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  /** Xóa món (staff/admin) */
  static async delete(id) {
    const [result] = await db.query('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = MenuModel;
