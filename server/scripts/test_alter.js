const db = require('./src/config/db');
async function run() {
  try {
    await db.query('ALTER TABLE users ADD COLUMN phone VARCHAR(20) AFTER full_name');
    console.log("Success");
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
}
run();
