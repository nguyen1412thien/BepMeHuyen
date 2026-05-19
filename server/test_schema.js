const db = require('./src/config/db');
async function run() {
  try {
    const [rows] = await db.query('DESCRIBE users');
    console.log(rows);
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
}
run();
