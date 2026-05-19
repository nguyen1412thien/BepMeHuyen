const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'bepmehuyen_super_secret_token_key_14122005';

/**
 * Middleware xác thực chữ ký JWT để bảo vệ các tuyến API riêng tư
 */
const authMiddleware = (req, res, next) => {
  // Lấy chuỗi Authorization từ Header
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Từ chối truy cập. Không tìm thấy token xác thực.' });
  }

  // Token thường gửi dạng: "Bearer <Token_Key>"
  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7, authHeader.length).trim() 
    : authHeader;

  if (!token) {
    return res.status(401).json({ error: 'Định dạng token không hợp lệ. Vui lòng cung cấp dạng Bearer Token.' });
  }

  try {
    // Xác minh tính hợp lệ và giải mã chữ ký JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Gắn thông tin người dùng giải mã được vào request object để controller sử dụng
    req.user = decoded;
    next();
  } catch (error) {
    console.warn(`⚠️ Xác thực JWT thất bại hoặc token đã hết hạn: ${error.message}`);
    return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn sử dụng. Vui lòng đăng nhập lại.' });
  }
};

module.exports = authMiddleware;
