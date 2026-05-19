const db = require('../config/db');

class OrderModel {
  /** Đặt hàng mới */
  static async create({ user_id, kitchen_id, address_id, customer_name, customer_phone, customer_address,
    delivery_lat, delivery_lng, subtotal, shipping_fee, total_amount,
    payment_method, notes, items }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [orderResult] = await conn.query(
        `INSERT INTO orders
          (user_id, kitchen_id, address_id, receiver_name, receiver_phone, delivery_address,
           delivery_lat, delivery_lng, total_amount, payment_method, note, shipping_fee)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id || null, kitchen_id || null, address_id || null,
          customer_name, customer_phone, customer_address,
          delivery_lat || null, delivery_lng || null,
          total_amount, payment_method || 'COD', notes || null, shipping_fee || 0
        ]
      );
      const orderId = orderResult.insertId;

      // Chèn các dòng order_items
      for (const item of items) {
        // Hỗ trợ cả item.product_id và item.id (từ frontend)
        const productId = item.product_id || item.id;
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES (?, ?, ?, ?)`,
          [orderId, productId, item.quantity, item.price]
        );
      }

      await conn.commit();
      return this.findById(orderId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /** Lấy đơn hàng theo ID (kèm order_items) */
  static async findById(id) {
    const [orders] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (!orders[0]) return null;
    const order = orders[0];
    
    // Join products để lấy tên món ăn
    const [items] = await db.query(`
      SELECT oi.*, p.name AS name, p.image_url 
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);
    
    order.items = items;
    return order;
  }

  /** Lấy tất cả đơn hàng của một user */
  static async getByUserId(userId) {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    for (const order of orders) {
      const [items] = await db.query(`
        SELECT oi.*, p.name AS name, p.image_url
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }
    return orders;
  }

  /** Lấy tất cả đơn hàng (staff/admin) */
  static async getAll({ status, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT o.*, u.full_name AS user_full_name, u.email AS user_email, k.name AS kitchen_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN kitchens k ON o.kitchen_id = k.id
    `;
    const params = [];
    if (status) {
      sql += ' WHERE o.order_status = ?';
      params.push(status);
    }
    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [orders] = await db.query(sql, params);
    for (const order of orders) {
      const [items] = await db.query(`
        SELECT oi.*, p.name AS name, p.image_url
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }
    return orders;
  }

  /** Cập nhật trạng thái đơn hàng (staff/admin) */
  static async updateStatus(id, order_status, cancel_reason = null) {
    if (order_status === 'cancelled') {
      await db.query(
        'UPDATE orders SET order_status = ?, cancel_reason = ? WHERE id = ?',
        [order_status, cancel_reason, id]
      );
    } else {
      await db.query(
        'UPDATE orders SET order_status = ? WHERE id = ?',
        [order_status, id]
      );
    }
    return this.findById(id);
  }

  /** Lấy đơn hàng cho khách vãng lai bằng số điện thoại hoặc danh sách id */
  static async getGuestOrders({ phone, orderIds }) {
    if (!phone && (!orderIds || orderIds.length === 0)) return [];
    
    let query = 'SELECT * FROM orders WHERE ';
    const params = [];

    if (phone && orderIds && orderIds.length > 0) {
      query += '(receiver_phone = ? OR id IN (' + orderIds.map(() => '?').join(',') + '))';
      params.push(phone, ...orderIds);
    } else if (phone) {
      query += 'receiver_phone = ?';
      params.push(phone);
    } else {
      query += 'id IN (' + orderIds.map(() => '?').join(',') + ')';
      params.push(...orderIds);
    }

    query += ' ORDER BY created_at DESC';
    const [orders] = await db.query(query, params);
    
    for (const order of orders) {
      const [items] = await db.query(`
        SELECT oi.*, p.name AS name, p.image_url
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }
    return orders;
  }
}

module.exports = OrderModel;
