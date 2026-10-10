// Quản lý giới hạn tần suất yêu cầu (Rate Limiter) theo IP và Email
const ipRequests = new Map();
const emailRequests = new Map();

// Dọn dẹp bộ nhớ định kỳ sau 30 phút
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (now - data.resetTime > 15 * 60 * 1000) ipRequests.delete(ip);
  }
  for (const [email, data] of emailRequests.entries()) {
    if (now - data.resetTime > 15 * 60 * 1000) emailRequests.delete(email);
  }
}, 30 * 60 * 1000);

/**
 * Kiểm tra giới hạn tần suất cho yêu cầu khôi phục mật khẩu
 * - IP: Tối đa 5 yêu cầu / 15 phút
 * - Email: Cooldown 60 giây giữa các lần bấm gửi, tối đa 3 yêu cầu / 15 phút
 */
export function checkForgotPasswordRateLimit(ip, email) {
  const now = Date.now();
  const cleanEmail = (email || '').toLowerCase().trim();
  const cleanIp = ip || 'unknown_ip';

  // 1. Kiểm tra Email Cooldown (60 giây)
  const emailData = emailRequests.get(cleanEmail);
  if (emailData) {
    const elapsedSeconds = Math.floor((now - emailData.lastRequest) / 1000);
    if (elapsedSeconds < 60) {
      const waitTime = 60 - elapsedSeconds;
      return {
        allowed: false,
        retryAfter: waitTime,
        message: `Bạn đã yêu cầu gửi liên kết quá nhanh. Vui lòng chờ ${waitTime} giây nữa trước khi gửi lại.`
      };
    }

    if (now - emailData.windowStart < 15 * 60 * 1000) {
      if (emailData.count >= 3) {
        const remainingMinutes = Math.ceil((emailData.windowStart + 15 * 60 * 1000 - now) / 60000);
        return {
          allowed: false,
          retryAfter: remainingMinutes * 60,
          message: `Tài khoản này đã yêu cầu quá nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.`
        };
      }
    } else {
      // Reset window
      emailData.count = 0;
      emailData.windowStart = now;
    }
  }

  // 2. Kiểm tra IP (Tối đa 5 yêu cầu / 15 phút)
  const ipData = ipRequests.get(cleanIp);
  if (ipData) {
    if (now - ipData.windowStart < 15 * 60 * 1000) {
      if (ipData.count >= 5) {
        const remainingMinutes = Math.ceil((ipData.windowStart + 15 * 60 * 1000 - now) / 60000);
        return {
          allowed: false,
          retryAfter: remainingMinutes * 60,
          message: `Địa chỉ mạng (IP) của bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${remainingMinutes} phút.`
        };
      }
    } else {
      ipData.count = 0;
      ipData.windowStart = now;
    }
  }

  return { allowed: true };
}

/**
 * Ghi nhận một yêu cầu thành công để tính toán tần suất
 */
export function recordForgotPasswordAttempt(ip, email) {
  const now = Date.now();
  const cleanEmail = (email || '').toLowerCase().trim();
  const cleanIp = ip || 'unknown_ip';

  // Cập nhật Email
  const emailData = emailRequests.get(cleanEmail) || { count: 0, windowStart: now, lastRequest: 0 };
  emailData.count += 1;
  emailData.lastRequest = now;
  emailRequests.set(cleanEmail, emailData);

// Cập nhật IP
  const ipData = ipRequests.get(cleanIp) || { count: 0, windowStart: now };
  ipData.count += 1;
  ipRequests.set(cleanIp, ipData);
}

export function resetRateLimits() {
  ipRequests.clear();
  emailRequests.clear();
}

