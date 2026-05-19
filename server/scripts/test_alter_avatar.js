const db = require('../src/config/db');
async function run() {
  try {
    await db.query('ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) AFTER phone');
    console.log("Success");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column already exists");
    } else {
      console.error('ERROR:', err);
    }
  }
  process.exit(0);
}
run();
