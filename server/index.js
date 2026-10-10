import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { 
  getUsers, 
  findUserByEmail, 
  findUserById, 
  findUser,
  createUser, 
  updateUser, 
  deleteUser,
  getDeletedUsers,
  getTokens,
  saveTokens,
  createResetToken, 
  verifyResetToken, 
  consumeResetTokenAndSetPassword,
  verifyPassword,
  hashPassword
} from './db.js';
import { sendPasswordResetEmail } from './mailer.js';
import { checkForgotPasswordRateLimit, recordForgotPasswordAttempt } from './rateLimiter.js';
import apiRouter from './api.js';
import jwt from 'jsonwebtoken';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';

app.use(cors());
app.use(express.json());

app.use('/api/data', apiRouter);

// Helper lấy IP client
const getClientIp = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
         req.socket?.remoteAddress || 
         '127.0.0.1';
};

// ----------------------------------------------------------------------------
// 1. HEALTH CHECK
// ----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'PetCare PRO AI Auth & Recovery Service'
  });
});

// ----------------------------------------------------------------------------
// 2. YÊU CẦU KHÔI PHỤC MẬT KHẨU (FORGOT PASSWORD)
// - Kiểm tra định dạng email
// - Giới hạn tần suất (Rate limit) theo IP và Email
// - Tạo token ngẫu nhiên an toàn, lưu bản băm SHA-256 (hết hạn 15 phút)
// - Gửi email thực tế với liên kết đặt lại
// - Thông báo chung trung tính: Không tiết lộ sự tồn tại của email
// - Không báo thành công nếu dịch vụ gửi email bị lỗi
// ----------------------------------------------------------------------------
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const clientIp = getClientIp(req);

    // 1. Kiểm tra định dạng email
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp địa chỉ email.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Địa chỉ email không đúng định dạng (ví dụ: name@example.com).'
      });
    }

    // 2. Kiểm tra giới hạn tần suất
    const rateCheck = checkForgotPasswordRateLimit(clientIp, cleanEmail);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: rateCheck.message,
        retryAfter: rateCheck.retryAfter
      });
    }

    // 3. Tìm tài khoản trong kho người dùng thống nhất
    const user = findUserByEmail(cleanEmail);

    // Ghi nhận lượt yêu cầu để tính toán cooldown
    recordForgotPasswordAttempt(clientIp, cleanEmail);

    // Nếu email tồn tại và không bị khóa -> Tạo token và gửi email thật
    if (user && !user.isLocked) {
      const { rawToken } = createResetToken(user.id, user.email);
      const resetUrl = `${config.APP_URL}/reset-password?token=${rawToken}`;

      // Gửi email thực tế qua mailer
      await sendPasswordResetEmail(user.email, resetUrl, user.name);
    } else if (user && user.isLocked) {
      // Tài khoản bị khóa: không gửi email khôi phục vì tài khoản bị cấm truy cập
      console.warn(`[Forgot Password] Bỏ qua gửi email cho tài khoản đang bị khóa: ${cleanEmail}`);
    } else {
      // Email chưa từng đăng ký: Không tiết lộ ra bên ngoài
      console.log(`[Forgot Password] Yêu cầu cho email chưa đăng ký: ${cleanEmail}`);
    }

    // Luôn trả về thông báo chung trung tính để bảo mật danh tính người dùng
    return res.json({
      success: true,
      message: 'Nếu email này đã được đăng ký trong hệ sinh thái PetCare, bạn sẽ nhận được liên kết đặt lại mật khẩu trong hộp thư đến (vui lòng kiểm tra cả thư mục Spam/Rác).'
    });

  } catch (error) {
    console.error('Lỗi trong luồng forgot-password:', error);
    // Bắt buộc báo lỗi khi dịch vụ email thất bại - Không báo thành công giả
    return res.status(500).json({
      success: false,
      error: error.message || 'Đã xảy ra lỗi khi gửi thư khôi phục mật khẩu. Vui lòng thử lại sau.'
    });
  }
});

// ----------------------------------------------------------------------------
// 3. XÁC MINH TOKEN KHÔI PHỤC (VERIFY RESET TOKEN)
// ----------------------------------------------------------------------------
app.get('/api/auth/verify-reset-token', (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({
        valid: false,
        reason: 'missing_token',
        error: 'Thiếu mã token khôi phục.'
      });
    }

    const verification = verifyResetToken(String(token));
    if (!verification.valid) {
      return res.status(400).json({
        valid: false,
        reason: verification.reason,
        error: verification.message
      });
    }

    return res.json({
      valid: true,
      user: {
        email: verification.user.email,
        name: verification.user.name
      }
    });
  } catch (error) {
    return res.status(500).json({
      valid: false,
      error: error.message || 'Lỗi hệ thống khi xác minh liên kết khôi phục.'
    });
  }
});

// ----------------------------------------------------------------------------
// 4. ĐẶT LẠI MẬT KHẨU MỚI (RESET PASSWORD)
// - Kiểm tra mật khẩu khớp và độ dài >= 6
// - Kiểm tra token hợp lệ và chưa dùng
// - Băm mật khẩu mới tại backend (PBKDF2)
// - Cập nhật nguyên tử, đánh dấu token đã dùng
// - Cập nhật passwordChangedAt để vô hiệu hóa các phiên cũ
// - Không tự động mở khóa tài khoản, không đổi vai trò
// ----------------------------------------------------------------------------
app.post('/api/auth/reset-password', (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Mã token khôi phục không hợp lệ.'
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu mới phải chứa ít nhất 6 ký tự.'
      });
    }

    // Tiêu thụ token và cập nhật mật khẩu mới
    const updatedUser = consumeResetTokenAndSetPassword(token, newPassword);

    return res.json({
      success: true,
      message: 'Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
      userId: updatedUser.id
    });
  } catch (error) {
    console.error('Lỗi khi reset-password:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Không thể đặt lại mật khẩu.'
    });
  }
});

// ----------------------------------------------------------------------------
// 5. ĐĂNG NHẬP (LOGIN)
// - Xác thực mật khẩu băm tại backend
// - Chặn tài khoản bị khóa
// - Trả về người dùng an toàn (ẩn password)
// ----------------------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp đầy đủ email và mật khẩu.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = findUserByEmail(cleanEmail);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Tài khoản email này chưa được đăng ký trong hệ thống.'
      });
    }

    if (user.isLocked) {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản này đã bị khóa bởi Quản trị viên hệ thống. Vui lòng liên hệ hỗ trợ để biết thêm chi tiết.'
      });
    }

    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({
        success: false,
        error: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!'
      });
    }

    const safeUser = { ...user };
    delete safeUser.password;

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      success: true,
      user: safeUser,
      token,
      authTime: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Lỗi máy chủ khi đăng nhập.'
    });
  }
});

// ----------------------------------------------------------------------------
// 6. ĐĂNG KÝ (REGISTER) - ĐÃ BỊ VÔ HIỆU HÓA HOÀN TOÀN
// Hệ thống chuyển sang cơ chế tài khoản do Quản trị viên cấp
// ----------------------------------------------------------------------------
app.post('/api/auth/register', (req, res) => {
  return res.status(403).json({
    success: false,
    error: 'Chức năng tự đăng ký đã bị tắt. Tài khoản do Quản trị viên cấp. Vui lòng liên hệ quản trị viên để được hỗ trợ.'
  });
});

// ----------------------------------------------------------------------------
// 6.1. QUẢN TRỊ VIÊN TẠO TÀI KHOẢN MỚI (ADMIN CREATE USER)
// - Xác thực quyền system_admin của caller
// - Kiểm tra tính hợp lệ và duy nhất của email
// - Mật khẩu tạm thời được băm bằng PBKDF2 SHA-512
// - Đặt mustChangePassword: true
// - Bác sĩ do admin tạo được cấp quyền ngay lập tức (approved)
// ----------------------------------------------------------------------------
app.post('/api/auth/admin/create-user', (req, res) => {
  try {
    const { callerId, name, email, phone, role, password, isLocked } = req.body;

    // 1. Kiểm tra quyền của caller
    const caller = findUserById(callerId);
    if (!caller || caller.role !== 'system_admin' || caller.isLocked) {
      return res.status(403).json({
        success: false,
        error: 'Truy cập bị từ chối: Chỉ Quản trị viên hệ thống mới có quyền tạo tài khoản.'
      });
    }

    // 2. Kiểm tra dữ liệu bắt buộc
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập Họ và tên.' });
    }

    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Vui lòng nhập Email đăng nhập.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Địa chỉ email không đúng định dạng.' });
    }

    if (findUserByEmail(cleanEmail)) {
      return res.status(400).json({ success: false, error: 'Địa chỉ email này đã tồn tại trong hệ thống.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu tạm thời phải từ 6 ký tự trở lên.' });
    }

    if (role !== 'pet_owner' && role !== 'vet_doctor') {
      return res.status(400).json({ success: false, error: 'Vai trò không hợp lệ. Chỉ được chọn Chủ nuôi hoặc Bác sĩ thú y.' });
    }

    // 3. Tạo tài khoản trong cơ sở dữ liệu chung
    const newUser = createUser({
      name: name.trim(),
      email: cleanEmail,
      password,
      phone: phone ? phone.trim() : '',
      role,
      isLocked: Boolean(isLocked),
      vetStatus: role === 'vet_doctor' ? 'approved' : null,
      mustChangePassword: true
    });

    const safeUser = { ...newUser };
    delete safeUser.password;

    return res.json({
      success: true,
      message: 'Tạo tài khoản thành công.',
      user: safeUser
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 6.2. QUẢN TRỊ VIÊN ĐẶT LẠI MẬT KHẨU TẠM THỜI (ADMIN RESET PASSWORD)
// - Xác thực quyền system_admin của caller
// - Cập nhật mật khẩu tạm thời mới (băm PBKDF2)
// - Bật mustChangePassword: true
// - Cập nhật passwordChangedAt để vô hiệu hóa tất cả các phiên đăng nhập cũ
// ----------------------------------------------------------------------------
app.post('/api/auth/admin/reset-password', (req, res) => {
  try {
    const { callerId, targetUserId, targetEmail, newTemporaryPassword } = req.body;

    const caller = findUserById(callerId);
    if (!caller || caller.role !== 'system_admin' || caller.isLocked) {
      return res.status(403).json({
        success: false,
        error: 'Truy cập bị từ chối: Chỉ Quản trị viên hệ thống mới có quyền đặt lại mật khẩu.'
      });
    }

    // Tìm kiếm bằng ID hoặc Email fallback
    const target = findUser(targetUserId, targetEmail);
    if (!target) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản người dùng hoặc tài khoản đã bị xóa.' });
    }

    if (!newTemporaryPassword || newTemporaryPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu tạm thời phải từ 6 ký tự trở lên.' });
    }

    const nowStr = new Date().toISOString();
    const updated = updateUser(target.id, {
      password: hashPassword(newTemporaryPassword),
      mustChangePassword: true,
      passwordChangedAt: nowStr
    });

    // Vô hiệu hóa tất cả các reset token cũ chưa dùng của tài khoản này
    const tokens = getTokens();
    let tokensChanged = false;
    tokens.forEach(t => {
      if ((String(t.userId).trim() === String(target.id).trim() || (t.userEmail || '').toLowerCase() === target.email.toLowerCase()) && !t.used) {
        t.used = true;
        t.invalidatedReason = 'admin_reset_password';
        tokensChanged = true;
      }
    });
    if (tokensChanged) saveTokens(tokens);

    const safeUser = { ...updated };
    delete safeUser.password;

    return res.json({
      success: true,
      message: `Đã đặt lại mật khẩu tạm thời cho tài khoản ${target.name}.`,
      user: safeUser
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 6.2.1. QUẢN TRỊ VIÊN XÓA TÀI KHOẢN (ADMIN DELETE USER)
// - Chỉ quản trị viên hệ thống (system_admin) có quyền thực hiện
// - Chặn tự xóa chính tài khoản admin đang đăng nhập
// - Chặn xóa quản trị viên hệ thống hoạt động cuối cùng
// - Yêu cầu xác nhận đúng email của tài khoản
// - Thu hồi phiên và token khôi phục
// ----------------------------------------------------------------------------
app.post('/api/auth/admin/delete-user', (req, res) => {
  try {
    const { callerId, targetUserId, targetEmail, confirmEmail } = req.body;

    // 1. Kiểm tra quyền caller
    const caller = findUserById(callerId);
    if (!caller || caller.role !== 'system_admin' || caller.isLocked) {
      return res.status(403).json({
        success: false,
        error: 'Truy cập bị từ chối: Chỉ Quản trị viên hệ thống mới có quyền xóa tài khoản.'
      });
    }

    // 2. Tìm tài khoản cần xóa
    const target = findUser(targetUserId, targetEmail);
    if (!target) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy tài khoản người dùng hoặc tài khoản đã bị xóa.'
      });
    }

    // 3. Chặn tự xóa tài khoản admin đang đăng nhập
    if (String(caller.id).trim() === String(target.id).trim() || 
        caller.email.trim().toLowerCase() === target.email.trim().toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Không thể tự xóa tài khoản quản trị viên đang đăng nhập.'
      });
    }

    // 4. Chặn xóa admin hoạt động cuối cùng
    const allUsers = getUsers();
    if (target.role === 'system_admin') {
      const activeAdmins = allUsers.filter(u => u.role === 'system_admin' && !u.isLocked);
      if (activeAdmins.length <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Không thể xóa quản trị viên hệ thống hoạt động cuối cùng.'
        });
      }
    }

    // 5. Kiểm tra email xác nhận
    if (!confirmEmail || confirmEmail.trim().toLowerCase() !== target.email.trim().toLowerCase()) {
      return res.status(400).json({
        success: false,
        error: 'Email xác nhận không trùng khớp với email của tài khoản cần xóa.'
      });
    }

    // 6. Thực hiện xóa an toàn
    const deleted = deleteUser(target.id, target.email);

    return res.json({
      success: true,
      message: `Đã xóa tài khoản ${deleted.name} (${deleted.email}) thành công.`,
      deletedUser: {
        id: deleted.id,
        email: deleted.email,
        name: deleted.name
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 6.3. ĐỔI MẬT KHẨU BẮT BUỘC Ở LẦN ĐĂNG NHẬP ĐẦU TIÊN (FIRST LOGIN CHANGE PASSWORD)
// - Người dùng cập nhật mật khẩu mới thay thế mật khẩu tạm thời
// - Đặt mustChangePassword: false
// - Vô hiệu hóa mật khẩu tạm thời cũ
// ----------------------------------------------------------------------------
app.post('/api/auth/first-login-change-password', (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    const user = findUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản người dùng.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu mới phải từ 6 ký tự trở lên.' });
    }

    const nowStr = new Date().toISOString();
    const updated = updateUser(userId, {
      password: hashPassword(newPassword),
      mustChangePassword: false,
      passwordChangedAt: nowStr
    });

    const safeUser = { ...updated };
    delete safeUser.password;

    return res.json({
      success: true,
      message: 'Mật khẩu đã được cập nhật thành công.',
      user: safeUser
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 7. ĐỔI MẬT KHẨU TỪ PROFILE (CHANGE PASSWORD)
// - Bắt buộc kiểm tra đúng mật khẩu hiện tại
// - Băm mật khẩu mới
// - Cập nhật passwordChangedAt
// ----------------------------------------------------------------------------
app.post('/api/auth/change-password', (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    const user = findUserById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy tài khoản.' });
    }

    if (!verifyPassword(currentPassword, user.password)) {
      return res.status(400).json({ success: false, error: 'Mật khẩu hiện tại không chính xác.' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Mật khẩu mới phải từ 6 ký tự trở lên.' });
    }

    const updated = updateUser(userId, {
      password: hashPassword(newPassword),
      passwordChangedAt: new Date().toISOString()
    });

    return res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ----------------------------------------------------------------------------
// 8. ĐỒNG BỘ / DANH SÁCH TÀI KHOẢN CHO QUẢN TRỊ VIÊN (ADMIN ENDPOINTS)
// ----------------------------------------------------------------------------
app.get('/api/auth/users', (req, res) => {
  try {
    const users = getUsers();
    const safeUsers = users.map(u => {
      const copy = { ...u };
      delete copy.password;
      return copy;
    });
    return res.json(safeUsers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/deleted-users', (req, res) => {
  try {
    const list = getDeletedUsers();
    return res.json(list);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/users/:id/toggle-lock', (req, res) => {
  try {
    const { id } = req.params;
    const user = findUserById(id);
    if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });

    const updated = updateUser(id, { isLocked: !user.isLocked });
    const copy = { ...updated };
    delete copy.password;
    return res.json(copy);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/users/:id/approve-vet', (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;
    const updated = updateUser(id, { 
      vetStatus: isApproved ? 'approved' : 'rejected' 
    });
    const copy = { ...updated };
    delete copy.password;
    return res.json(copy);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/users/:id/change-role', (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const updated = updateUser(id, { role });
    const copy = { ...updated };
    delete copy.password;
    return res.json(copy);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Khởi chạy server
app.listen(config.PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 PetCare PRO AI Auth Backend đang chạy tại http://localhost:${config.PORT}`);
  console.log(`🌐 Website Frontend: ${config.APP_URL}`);
  console.log(`📧 Trạng thái SMTP: ${config.SMTP_HOST ? `Đã cấu hình (${config.SMTP_HOST}:${config.SMTP_PORT})` : 'CHƯA CẤU HÌNH (Cần thiết lập trong .env)'}`);
  console.log(`🛠️  Chế độ Dev Console Email: ${config.DEV_MODE_ALLOW_CONSOLE_EMAIL ? 'BẬT' : 'TẮT'}`);
  console.log(`=============================================================\n`);
});
