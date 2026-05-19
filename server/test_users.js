const UserModel = require('./src/models/userModel');
async function run() {
  try {
    const users = await UserModel.findAll();
    console.log(users);
  } catch (err) {
    console.error('ERROR:', err);
  }
  process.exit(0);
}
run();
