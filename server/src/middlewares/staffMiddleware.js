/**
 * Middleware phân quyền Staff/Admin
 * Chỉ cho phép role 'staff' hoặc 'admin' tiếp tục
 */
const staffMiddleware = (req, res, next) => {
  if (req.user && (req.user.role === 'staff' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Từ chối truy cập. Chỉ nhân viên (Staff) hoặc Quản trị viên (Admin) mới có quyền thực hiện thao tác này.'
    });
  }
};

module.exports = staffMiddleware;
