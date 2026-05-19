/**
 * Middleware phân quyền Admin
 * Chỉ cho phép role 'admin' tiếp tục
 */
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Từ chối truy cập. Chỉ Quản trị viên (Admin) mới có quyền thực hiện thao tác này.'
    });
  }
};

module.exports = adminMiddleware;
