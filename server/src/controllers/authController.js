const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

// Tải khóa bí mật JWT hoặc dùng giá trị mặc định cho phát triển
const JWT_SECRET = process.env.JWT_SECRET || 'bepmehuyen_super_secret_token_key_14122005';

class AuthController {
  /**
   * Đăng ký tài khoản người dùng mới
   */
  static async register(req, res) {
    try {
      const { email, password, full_name } = req.body;

      // 1. Xác thực dữ liệu đầu vào cơ bản
      if (!email || !password || !full_name) {
        return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ email, mật khẩu và họ tên.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'Mật khẩu phải có độ dài tối thiểu 6 ký tự.' });
      }

      // 2. Kiểm tra tài khoản đã tồn tại chưa
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email này đã được sử dụng bởi một tài khoản khác.' });
      }

      // 3. Mã hóa mật khẩu bảo mật
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);

      // 4. Lưu tài khoản mới vào database
      const newUser = await UserModel.create({
        email,
        password_hash,
        full_name,
        role: 'user' // Mặc định là khách hàng
      });

      console.log(`👤 Đăng ký người dùng mới thành công: ${email}`);

      res.status(201).json({
        message: 'Đăng ký tài khoản thành công!',
        user: newUser
      });
    } catch (error) {
      console.error('Lỗi khi đăng ký:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra trên server trong quá trình đăng ký.', details: error.message });
    }
  }

  /**
   * Đăng nhập người dùng & cấp Token JWT
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ email và mật khẩu.' });
      }

      // 1. Kiểm tra tài khoản tồn tại
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
      }

      if (!user.is_active) {
        return res.status(403).json({ error: 'Tài khoản của bạn hiện đang bị tạm khóa.' });
      }

      // 2. So sánh đối chiếu mật khẩu đã mã hóa
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác.' });
      }

      // 3. Tạo chữ ký số Token bảo mật JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' } // Token có thời hạn sử dụng trong 7 ngày
      );

      console.log(`🔑 Người dùng đăng nhập thành công: ${email}`);

      res.json({
        message: 'Đăng nhập thành công!',
        token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error);
      res.status(500).json({ error: 'Có lỗi xảy ra trên server trong quá trình đăng nhập.', details: error.message });
    }
  }

  /**
   * Lấy thông tin cá nhân của tài khoản đang đăng nhập (Protected Profile)
   */
  static async getProfile(req, res) {
    try {
      // req.user được điền từ middleware xác thực token (authMiddleware)
      const user = await UserModel.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Không tìm thấy thông tin tài khoản người dùng.' });
      }
      res.json(user);
    } catch (error) {
      console.error('Lỗi khi lấy thông tin cá nhân:', error);
      res.status(500).json({ error: 'Không thể tải dữ liệu hồ sơ cá nhân.', details: error.message });
    }
  }
}

module.exports = AuthController;
