const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Frontend Files
app.use(express.static(path.join(__dirname, 'public')));

// Database connection verification on startup with retry logic
async function initializeDB(retries = 8, delay = 4000) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Verifying database connection pool... (Attempt ${i + 1}/${retries})`);
      
      // Test the imported connection pool
      const conn = await pool.getConnection();
      console.log('✅ Successfully connected to MySQL database via config pool.');
      conn.release();
      return;
    } catch (err) {
      console.error(`❌ Database connection failed: ${err.message}`);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('⚠️ Database initialization failed completely. APIs requiring database will return 500.');
}

// REST API Endpoints

// 1. Get all menu items
app.get('/api/menu', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database is not initialized.' });
  }
  try {
    const [rows] = await pool.query('SELECT * FROM menu_items WHERE active = 1');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching menu items:', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// 2. Create a new order
app.post('/api/orders', async (req, res) => {
  if (!pool) {
    return res.status(500).json({ error: 'Database is not initialized.' });
  }

  const { customer_name, customer_phone, customer_address, notes, items, total_amount } = req.body;

  if (!customer_name || !customer_phone || !customer_address || !items || !items.length) {
    return res.status(400).json({ error: 'Missing required order details (name, phone, address, and items).' });
  }

  const conn = await pool.getConnection();
  try {
    // Start transactional query
    await conn.beginTransaction();

    // 1. Insert into orders table
    const [orderResult] = await conn.query(
      'INSERT INTO orders (customer_name, customer_phone, customer_address, notes, total_amount) VALUES (?, ?, ?, ?, ?)',
      [customer_name, customer_phone, customer_address, notes || '', total_amount]
    );
    const orderId = orderResult.insertId;

    // 2. Insert order items
    const itemQueries = items.map(item => {
      return conn.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.id, item.quantity, item.price]
      );
    });
    
    await Promise.all(itemQueries);

    // Commit everything
    await conn.commit();
    
    console.log(`✅ Order #${orderId} successfully saved to DB.`);
    res.status(201).json({
      message: 'Order placed successfully!',
      orderId: orderId
    });
  } catch (err) {
    await conn.rollback();
    console.error('Error processing order, rolling back:', err);
    res.status(500).json({ error: 'Failed to process order', details: err.message });
  } finally {
    conn.release();
  }
});

// Catch-all route to serve the SPA frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the Express Server
app.listen(PORT, async () => {
  console.log(`🚀 BepMeHuyen backend listening on port ${PORT}`);
  await initializeDB();
});
