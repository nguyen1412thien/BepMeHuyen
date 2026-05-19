const pool = require('./database');

/**
 * Self-invoking test utility to verify MySQL connection and display schema status.
 */
async function testConnection() {
  console.log('🔄 Attempting connection to the MySQL database...');
  
  try {
    // 1. Get a connection from the pool
    const startTime = Date.now();
    const conn = await pool.getConnection();
    const duration = Date.now() - startTime;
    
    console.log(`\n✅ CONNECTION SUCCESSFUL! (Response time: ${duration}ms)`);
    console.log('----------------------------------------------------');
    
    // 2. Query DB current time
    const [timeResult] = await conn.query('SELECT NOW() as currentTime');
    console.log(`⏰ MySQL Server Date & Time: ${timeResult[0].currentTime}`);
    
    // 3. Query existing tables
    const [tables] = await conn.query('SHOW TABLES');
    console.log(`📋 Total tables found: ${tables.length}`);
    
    if (tables.length === 0) {
      console.log('   ⚠️ WARNING: No tables found. Make sure the database was initialized with init.sql.');
    } else {
      console.log('   Existing tables:');
      tables.forEach(t => {
        const tableName = Object.values(t)[0];
        console.log(`     🔹 ${tableName}`);
      });
    }
    
    console.log('----------------------------------------------------');
    console.log('💡 Connection pool is active and ready to handle incoming queries.\n');
    
    // Release connection back to the pool
    conn.release();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ DATABASE CONNECTION TEST FAILED!');
    console.error('----------------------------------------------------');
    console.error(`🔴 Error Message : ${error.message}`);
    console.error(`🔴 Error Code    : ${error.code || 'N/A'}`);
    console.error(`🔴 Target Host    : ${process.env.DB_HOST || 'db'}`);
    console.error('----------------------------------------------------');
    console.error('👉 Tip: Please make sure your Docker containers are running (docker-compose up)');
    console.error('   or your local MySQL server is started and configuration in .env is correct.\n');
    process.exit(1);
  }
}

testConnection();
