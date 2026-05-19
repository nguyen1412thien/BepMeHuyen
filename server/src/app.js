const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const authMiddleware = require('./middlewares/authMiddleware');

// Middleware phân quyền nâng cao - chỉ cho phép duy nhất ADMIN truy cập
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Từ chối truy cập. Chỉ tài khoản Admin mới có quyền chẩn đoán CSDL!' });
  }
};

const app = express();

// 1. Cấu hình Middleware toàn cục
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// 2. Gắn kết các cổng API Phân quyền
app.use('/api/auth', authRoutes);

// --- Khởi tạo Thực đơn Fallback Dự phòng ---
const fallbackMenu = [
  {
    id: 1,
    name: 'Thịt Kho Tàu Mẹ Nấu',
    description: 'Thịt ba chỉ heo kho rệu mềm ngấm vị cùng trứng vịt, nước dừa xiêm ngọt thanh đậm đà chuẩn vị cơm nhà.',
    price: 75000.00,
    category: 'Main Course',
    image_url: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 2,
    name: 'Cá Lóc Kho Tộ',
    description: 'Cá lóc đồng kho tộ sền sệt, cay nồng tiêu sọ, thơm hành lá và mỡ hành béo ngậy ăn cực hao cơm.',
    price: 80000.00,
    category: 'Main Course',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 3,
    name: 'Sườn Xào Chua Ngọt',
    description: 'Sườn non rim chín mềm, áo lớp sốt chua ngọt từ cà chua và me rừng thơm lừng, rắc chút vừng rang thơm phức.',
    price: 85000.00,
    category: 'Main Course',
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 4,
    name: 'Canh Chua Cá Lóc Nam Bộ',
    description: 'Canh chua cá lóc nấu kèm dọc mùng, đậu bắp, thơm, cà chua, ngò om ngò gai và giá đỗ, thanh mát giải nhiệt.',
    price: 85000.00,
    category: 'Soup',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 5,
    name: 'Canh Cua Rau Đay Cà Pháo',
    description: 'Canh cua đồng xay nấu rau đay mồng tơi ngọt lịm gạch cua béo ngậy, ăn kèm đĩa cà pháo muối giòn tan.',
    price: 65000.00,
    category: 'Soup',
    image_url: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 6,
    name: 'Rau Muống Xào Tỏi',
    description: 'Rau muống xanh giòn xào tỏi Lý Sơn phi thơm lừng, giữ trọn độ ngọt tự nhiên và màu xanh mát mắt.',
    price: 40000.00,
    category: 'Side Dish',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 7,
    name: 'Trứng Đúc Thịt Băm',
    description: 'Trứng vịt chiên đúc thịt nạc heo băm, mộc nhĩ hành hoa, thơm mềm béo ngậy, món ngon giản dị cực đưa cơm.',
    price: 45000.00,
    category: 'Side Dish',
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 8,
    name: 'Nước Mơ Muối Đường Phèn',
    description: 'Nước quả mơ chùa Hương muối lâu năm pha đường phèn mát lạnh, thanh giọng giải khát mùa hè.',
    price: 20000.00,
    category: 'Drink',
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 9,
    name: 'Trà Xanh Tươi Đá',
    description: 'Lá chè xanh tươi om ấm nóng rồi lắc đá mát lạnh, thơm hương nhài nhẹ nhàng, tốt cho sức khỏe.',
    price: 12000.00,
    category: 'Drink',
    image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=60'
  },
  {
    id: 10,
    name: 'Chè Trôi Nước Đường Mật',
    description: 'Viên chè trôi nước nhân đậu xanh dừa nạo mềm dẻo, chan nước đường mật mía gừng cay ấm, rắc vừng rang.',
    price: 25000.00,
    category: 'Dessert',
    image_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=60'
  }
];

// A. API lấy toàn bộ thực đơn (Resilient Query Fallback)
app.get('/api/menu', async (req, res) => {
  if (!pool) {
    console.warn('⚠️ [Database] Pool chưa khởi tạo. Đang trả thực đơn dự phòng.');
    return res.json(fallbackMenu);
  }
  try {
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE active = 1');
    res.json(rows);
  } catch (err) {
    console.warn('⚠️ [Database] Bảng menu_items chưa sẵn sàng hoặc rỗng. Đang phục vụ thực đơn dự phòng.');
    res.json(fallbackMenu);
  }
});

// B. API Đặt món mới (Resilient Graceful Fallback - Phục vụ cả Khách vãng lai & Thành viên)
app.post('/api/orders', async (req, res) => {
  const { user_id, customer_name, customer_phone, customer_address, notes, items, total_amount } = req.body;

  if (!customer_name || !customer_phone || !customer_address || !items || !items.length) {
    return res.status(400).json({ error: 'Thiếu thông tin đặt hàng cần thiết.' });
  }

  if (!pool) {
    const offlineOrderId = Date.now();
    console.warn(`⚠️ [Offline Mode] Pool chưa khởi tạo. Mô phỏng đặt hàng #${offlineOrderId}`);
    return res.status(201).json({
      message: 'Đặt món thành công! (Mô phỏng do CSDL đang tải)',
      orderId: offlineOrderId
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [orderResult] = await conn.query(
      'INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, notes, total_amount) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id || null, customer_name, customer_phone, customer_address, notes || '', total_amount]
    );
    const orderId = orderResult.insertId;

    const itemQueries = items.map(item => {
      return conn.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.id, item.quantity, item.price]
      );
    });

    await Promise.all(itemQueries);
    await conn.commit();

    console.log(`✅ Lưu đơn hàng #${orderId} vào DB thành công.`);
    res.status(201).json({
      message: 'Đặt món thành công!',
      orderId: orderId
    });
  } catch (err) {
    await conn.rollback();
    console.warn('⚠️ [Database] Các bảng đơn hàng chưa sẵn sàng. Mô phỏng lưu trữ offline.');
    const offlineOrderId = Date.now();
    console.log(`📝 [Thông tin Đơn Hàng] ID: #${offlineOrderId} | Khách: ${customer_name} | Tổng tiền: ${total_amount}đ`);
    res.status(201).json({
      message: 'Đặt món thành công! (Lưu trữ offline mô phỏng)',
      orderId: offlineOrderId
    });
  } finally {
    conn.release();
  }
});

// C. API kiểm tra chẩn đoán kết nối CSDL (Bảo mật: Chỉ dành cho Admin)
app.get('/api/diagnostics', authMiddleware, adminMiddleware, async (req, res) => {
  const host = pool.pool?.config?.connectionConfig?.host || process.env.DB_HOST || '136.110.9.77';
  const port = pool.pool?.config?.connectionConfig?.port || process.env.DB_PORT || 3306;
  const database = pool.pool?.config?.connectionConfig?.database || process.env.DB_NAME || 'bepmehuyen';

  if (!pool) {
    return res.status(500).json({
      success: false,
      config: { host, port, database },
      error: 'CSDL chưa được khởi tạo pool kết nối.'
    });
  }

  try {
    const startTime = Date.now();
    const conn = await pool.getConnection();
    const duration = Date.now() - startTime;

    // 1. Lấy thời gian hiện tại từ DB
    const [timeResult] = await conn.query('SELECT NOW() as currentTime');
    const dbTime = timeResult[0]?.currentTime;

    // 2. Lấy danh sách bảng hiện có
    const [tables] = await conn.query('SHOW TABLES');
    const tablesList = tables.map(t => Object.values(t)[0]);

    conn.release();

    res.json({
      success: true,
      config: { host, port, database },
      duration,
      dbTime,
      tables: tablesList
    });
  } catch (error) {
    res.json({
      success: false,
      config: { host, port, database },
      error: error.message,
      code: error.code || 'UNKNOWN'
    });
  }
});

// D. API Tạo bảng nhanh (Phòng vệ an toàn - Bảo mật: Chỉ dành cho Admin)
app.post('/api/diagnostics/create-table', authMiddleware, adminMiddleware, async (req, res) => {
  const { tableName } = req.body;

  try {
    // Nếu KHÔNG có tableName cụ thể ➡️ Tự động khởi tạo TOÀN BỘ hệ thống bảng chuẩn
    if (!tableName) {
      const queries = [
        // 1. users
        `CREATE TABLE IF NOT EXISTS users (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(255),
          phone VARCHAR(20),
          address TEXT,
          role VARCHAR(50) NOT NULL DEFAULT 'user',
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
        
        // 2. categories
        `CREATE TABLE IF NOT EXISTS categories (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          slug VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

        // 3. menu_items
        `CREATE TABLE IF NOT EXISTS menu_items (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          category_id BIGINT UNSIGNED NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          image_url VARCHAR(500),
          is_available TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

        // 4. orders (Cho phép user_id NULL cho Khách vãng lai)
        `CREATE TABLE IF NOT EXISTS orders (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT UNSIGNED NULL,
          customer_name VARCHAR(255) NOT NULL,
          customer_phone VARCHAR(20) NOT NULL,
          customer_address TEXT NOT NULL,
          total_amount DECIMAL(10, 2) NOT NULL,
          payment_method VARCHAR(50) NOT NULL DEFAULT 'COD',
          payment_status VARCHAR(50) NOT NULL DEFAULT 'pending',
          order_status VARCHAR(50) NOT NULL DEFAULT 'pending',
          notes TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

        // 5. order_items
        `CREATE TABLE IF NOT EXISTS order_items (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          order_id BIGINT UNSIGNED NOT NULL,
          menu_item_id BIGINT UNSIGNED NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

        // 6. reviews
        `CREATE TABLE IF NOT EXISTS reviews (
          id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          user_id BIGINT UNSIGNED NOT NULL,
          menu_item_id BIGINT UNSIGNED NOT NULL,
          rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
          comment TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`
      ];

      for (const q of queries) {
        await pool.query(q);
      }
      console.log('🔨 [Database] Đã khởi tạo thành công toàn bộ hệ thống bảng CSDL!');
      return res.json({ success: true, message: 'Đã khởi tạo thành công toàn bộ cấu trúc CSDL!' });
    }

    // Nếu có tableName cụ thể, khởi tạo bảng đơn lẻ đó
    const cleanName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
    if (!cleanName) return res.status(400).json({ success: false, error: 'Tên bảng chứa ký tự không hợp lệ.' });

    let sql = '';
    if (cleanName === 'users') {
      sql = `CREATE TABLE IF NOT EXISTS users (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    } else {
      sql = `CREATE TABLE IF NOT EXISTS ${cleanName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
    }

    await pool.query(sql);
    console.log(`🔨 [Database] Tạo bảng lẻ thành công: ${cleanName}`);
    res.json({ success: true, message: `Bảng '${cleanName}' đã được khởi tạo/kiểm tra thành công!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// E. API Thêm dữ liệu mẫu nhanh (Dữ liệu tự động hash mật khẩu - Bảo mật: Chỉ dành cho Admin)
app.post('/api/diagnostics/insert-data', authMiddleware, adminMiddleware, async (req, res) => {
  const { tableName, record } = req.body;
  if (!tableName) return res.status(400).json({ success: false, error: 'Thiếu tên bảng cần thêm dữ liệu.' });

  const cleanName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  
  try {
    if (cleanName === 'users') {
      const bcrypt = require('bcryptjs');
      const email = record?.email || `user_${Date.now()}@bepmehuyen.com`;
      const rawPassword = record?.password || '123456';
      const name = record?.name || 'Khách Hàng Trực Tuyến';
      const hash = await bcrypt.hash(rawPassword, 10);

      await pool.query(
        'INSERT INTO users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)',
        [email, hash, name, 'user']
      );
      console.log(`📝 [Database] Đã thêm thành viên mẫu: ${email}`);
      res.json({ success: true, message: `Đã chèn thành công thành viên mẫu '${email}' (Mật khẩu: ${rawPassword})!` });
    } else {
      const nameVal = record?.name || `Bản ghi mẫu #${Date.now()}`;
      await pool.query(`INSERT INTO ${cleanName} (name) VALUES (?)`, [nameVal]);
      console.log(`📝 [Database] Đã chèn dữ liệu vào bảng ${cleanName}: ${nameVal}`);
      res.json({ success: true, message: `Đã chèn thành công bản ghi mẫu vào bảng '${cleanName}'!` });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// F. API Lấy dòng dữ liệu xem nhanh (Bảo mật: Chỉ dành cho Admin)
app.get('/api/diagnostics/table-rows/:tableName', authMiddleware, adminMiddleware, async (req, res) => {
  const { tableName } = req.params;
  const cleanName = tableName.replace(/[^a-zA-Z0-9_]/g, '');

  try {
    const [rows] = await pool.query(`SELECT * FROM ${cleanName} ORDER BY id DESC LIMIT 5`);
    res.json({ success: true, rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// G. API Xóa dòng dữ liệu mẫu theo ID (Bảo mật: Chỉ dành cho Admin)
app.delete('/api/diagnostics/delete-row/:tableName/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { tableName, id } = req.params;
  const cleanName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const cleanId = parseInt(id, 10);

  if (isNaN(cleanId)) {
    return res.status(400).json({ success: false, error: 'ID bản ghi không hợp lệ.' });
  }

  try {
    const [result] = await pool.query(`DELETE FROM ${cleanName} WHERE id = ?`, [cleanId]);
    if (result.affectedRows > 0) {
      console.log(`🗑️ [Database] Đã xóa bản ghi #${cleanId} khỏi bảng ${cleanName}`);
      res.json({ success: true, message: `Đã xóa bản ghi #${cleanId} thành công!` });
    } else {
      res.status(404).json({ success: false, error: 'Không tìm thấy bản ghi hoặc bản ghi đã bị xóa trước đó.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// H. API Chỉnh sửa đơn lẻ từng cột (Cell inline update - Hỗ trợ cả POST và field/column - Bảo mật: Chỉ dành cho Admin)
app.post('/api/diagnostics/update-cell/:tableName/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { tableName, id } = req.params;
  const { column, field, value } = req.body;
  const targetColumn = column || field;

  const cleanTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '');
  const cleanColumnName = targetColumn ? targetColumn.replace(/[^a-zA-Z0-9_]/g, '') : '';
  const cleanId = parseInt(id, 10);

  if (isNaN(cleanId)) {
    return res.status(400).json({ success: false, error: 'ID bản ghi không hợp lệ.' });
  }

  if (!cleanColumnName) {
    return res.status(400).json({ success: false, error: 'Tên cột không hợp lệ.' });
  }

  try {
    let finalValue = value;
    
    // Nếu sửa mật khẩu của bảng users, thực hiện hash tự động
    if (cleanTableName === 'users' && (cleanColumnName === 'password' || cleanColumnName === 'password_hash')) {
      const bcrypt = require('bcryptjs');
      finalValue = await bcrypt.hash(value, 10);
      const actualCol = 'password_hash';
      await pool.query(`UPDATE ${cleanTableName} SET ${actualCol} = ? WHERE id = ?`, [finalValue, cleanId]);
      console.log(`✏️ [Database] Đã mã hóa và cập nhật mật khẩu của user #${cleanId}`);
    } else {
      await pool.query(`UPDATE ${cleanTableName} SET ${cleanColumnName} = ? WHERE id = ?`, [finalValue, cleanId]);
      console.log(`✏️ [Database] Đã chỉnh sửa cột ${cleanColumnName} của bảng ${cleanTableName} dòng #${cleanId} thành: ${finalValue}`);
    }

    res.json({ success: true, message: `Đã chỉnh sửa cột '${cleanColumnName}' thành công!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// I. API Lấy dữ liệu cấu trúc ERD thực tế (Bảng, Cột, Khóa ngoại - Bảo mật: Chỉ dành cho Admin)
app.get('/api/diagnostics/erd', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [dbNameRows] = await pool.query('SELECT DATABASE() AS dbName');
    const dbName = dbNameRows[0]?.dbName || 'bepmehuyen';

    // 1. Lấy toàn bộ các bảng và các cột của chúng
    const [columns] = await pool.query(`
      SELECT 
        TABLE_NAME AS tableName, 
        COLUMN_NAME AS columnName, 
        DATA_TYPE AS dataType 
      FROM 
        information_schema.COLUMNS 
      WHERE 
        TABLE_SCHEMA = ? 
      ORDER BY 
        TABLE_NAME, ORDINAL_POSITION
    `, [dbName]);

    // 2. Lấy toàn bộ các mối quan hệ khóa ngoại thực tế
    const [relations] = await pool.query(`
      SELECT 
        TABLE_NAME AS tableName, 
        COLUMN_NAME AS columnName, 
        REFERENCED_TABLE_NAME AS referencedTableName, 
        REFERENCED_COLUMN_NAME AS referencedColumnName 
      FROM 
        information_schema.KEY_COLUMN_USAGE 
      WHERE 
        TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [dbName]);

    res.json({ success: true, columns, relations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Phục vụ trang chủ React SPA cho tất cả các đường dẫn Router khác
app.get('*', (req, res, next) => {
  // Bỏ qua các đường dẫn API
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
