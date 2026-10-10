// Authentication & RBAC Service for PetCare PRO AI
import { sound } from './soundService.js';
import { handleUserDeletedDataRetention } from './storageService.js';

export const AUTH_STORAGE_KEYS = {
  USERS: 'petcare_auth_users_v1',
  SESSION: 'petcare_auth_session_v1',
  REMEMBER: 'petcare_auth_remember_v1',
  DELETED_USERS: 'petcare_deleted_users_v1'
};

// Chuẩn hóa hệ thống vai trò toàn hệ sinh thái
export const ROLES = {
  SYSTEM_ADMIN: 'system_admin',
  VET_DOCTOR: 'vet_doctor',
  PET_OWNER: 'pet_owner'
};

// Trạng thái phê duyệt chứng chỉ bác sĩ thú y
export const VET_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// 1. Quản trị viên hệ thống ban đầu (Dedicated System Admin Seed)
export const INITIAL_SYSTEM_ADMIN = {
  id: 'user_admin_01',
  name: 'Quản trị viên Hệ thống',
  email: 'admin@petcare.ai',
  password: 'Admin@123456',
  phone: '0901.000.888',
  address: 'Trụ sở chính PetCare AI, Hà Nội',
  role: ROLES.SYSTEM_ADMIN,
  isLocked: false,
  vetStatus: null,
  mustChangePassword: false,
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  createdAt: '2026-01-01T08:00:00.000Z'
};

// 2. Bác sĩ thú y mẫu (Approved Vet Doctor Seed)
export const INITIAL_VET_DOCTOR = {
  id: 'user_vet_pro',
  name: 'BS. Hoàng Hải Nam (Pro Vet)',
  email: 'tester@petcare.ai',
  password: 'Doctor@123',
  phone: '0988.789.999',
  address: 'Tòa Landmark 81, P. 22, Q. Bình Thạnh, TP. Hồ Chí Minh',
  role: ROLES.VET_DOCTOR,
  isLocked: false,
  vetStatus: VET_STATUS.APPROVED,
  mustChangePassword: false,
  avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
  createdAt: '2026-02-01T08:00:00.000Z'
};

// 3. Chủ nuôi mẫu (Pet Owner Demo Seed)
export const INITIAL_PET_OWNER = {
  id: 'user_owner_demo',
  name: 'Đinh Xuân Mạnh',
  email: 'demo@petcare.ai',
  password: 'Owner@123',
  phone: '0912.345.678',
  address: 'Cầu Giấy, Hà Nội',
  role: ROLES.PET_OWNER,
  isLocked: false,
  vetStatus: null,
  mustChangePassword: false,
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
  createdAt: '2026-03-01T08:00:00.000Z'
};

const getStored = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item);
  } catch {
    return fallback;
  }
};

const setStored = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
};

// Chuẩn hóa một bản ghi user từ dữ liệu cũ sang định dạng bảo mật RBAC v2
const normalizeUserRecord = (user) => {
  if (!user) return null;
  let role = user.role;
  if (role === 'CLINIC_ADMIN' || role === 'vet') role = ROLES.VET_DOCTOR;
  if (role === 'OWNER') role = ROLES.PET_OWNER;
  if (role !== ROLES.SYSTEM_ADMIN && role !== ROLES.VET_DOCTOR && role !== ROLES.PET_OWNER) {
    role = ROLES.PET_OWNER;
  }

  let vetStatus = user.vetStatus;
  if (role === ROLES.VET_DOCTOR && !vetStatus) {
    vetStatus = VET_STATUS.APPROVED;
  } else if (role !== ROLES.VET_DOCTOR) {
    vetStatus = null;
  }

  // Đảm bảo ID ổn định kiểu chuỗi, không sinh ID ngẫu nhiên mới mỗi lần chuẩn hóa
  const cleanId = user.id ? String(user.id).trim() : `user_${Date.now()}`;

  return {
    id: cleanId,
    name: (user.name || 'Người dùng PetCare').trim(),
    email: (user.email || '').trim().toLowerCase(),
    password: user.password || 'User@123456',
    phone: user.phone || '',
    address: user.address || 'Việt Nam',
    role,
    isLocked: Boolean(user.isLocked),
    vetStatus,
    mustChangePassword: Boolean(user.mustChangePassword),
    avatar: user.avatar || (
      role === ROLES.SYSTEM_ADMIN
        ? INITIAL_SYSTEM_ADMIN.avatar
        : role === ROLES.VET_DOCTOR
        ? INITIAL_VET_DOCTOR.avatar
        : INITIAL_PET_OWNER.avatar
    ),
    createdAt: user.createdAt || new Date().toISOString(),
    passwordChangedAt: user.passwordChangedAt || null
  };
};

// Lấy danh sách users từ localStorage (dùng nội bộ, không import legacy)
// Backend là nguồn sự thật; hàm này chỉ đọc snapshot cuối cùng đã đồng bộ.
export const getUsers = () => {
  const deletedList = getStored(AUTH_STORAGE_KEYS.DELETED_USERS, []);

  // Kiểm tra tài khoản đã bị xóa theo ID
  const isUserDeleted = (id) => {
    if (!id) return false;
    const cleanId = String(id).trim();
    return deletedList.some(d => cleanId && String(d.id).trim() === cleanId);
  };

  // Kiểm tra tài khoản mẫu đã bị xóa để ngăn tự tái sinh
  const isSeedDeleted = (seedId) => {
    if (!seedId) return false;
    const cleanId = String(seedId).trim();
    return deletedList.some(d => cleanId && String(d.id).trim() === cleanId);
  };

  let users = getStored(AUTH_STORAGE_KEYS.USERS, null);

  // Lần đầu tiên (chưa có dữ liệu nào trong storage): khởi tạo với tài khoản seed
  if (users === null) {
    const defaultSeeds = [INITIAL_SYSTEM_ADMIN, INITIAL_VET_DOCTOR, INITIAL_PET_OWNER];
    const allowedSeeds = defaultSeeds.filter(s => !isSeedDeleted(s.id));
    setStored(AUTH_STORAGE_KEYS.USERS, allowedSeeds);
    return allowedSeeds;
  }

  if (!Array.isArray(users)) {
    return [INITIAL_SYSTEM_ADMIN];
  }

  // Lọc bỏ tài khoản đã bị xóa theo ID
  const activeUsers = users.filter(u => !isUserDeleted(u.id));

  // Chuẩn hóa và đảm bảo admin luôn tồn tại
  let normalized = activeUsers.map(normalizeUserRecord).filter(Boolean);
  let updated = false;

  // Chỉ đảm bảo SYSTEM_ADMIN seed luôn tồn tại nếu chưa bị xóa
  if (!isSeedDeleted(INITIAL_SYSTEM_ADMIN.id)) {
    const hasAdmin = normalized.some(u => u.email.toLowerCase() === INITIAL_SYSTEM_ADMIN.email.toLowerCase());
    if (!hasAdmin) {
      normalized.unshift(INITIAL_SYSTEM_ADMIN);
      updated = true;
    } else {
      // Đảm bảo admin không bị mất role
      const adminIdx = normalized.findIndex(u => u.email.toLowerCase() === INITIAL_SYSTEM_ADMIN.email.toLowerCase());
      if (adminIdx !== -1 && normalized[adminIdx].role !== ROLES.SYSTEM_ADMIN) {
        normalized[adminIdx].role = ROLES.SYSTEM_ADMIN;
        updated = true;
      }
    }
  }

  if (updated || normalized.length !== users.length) {
    setStored(AUTH_STORAGE_KEYS.USERS, normalized);
  }

  return normalized;
};

// Lấy thông tin phiên đăng nhập hiện tại
export const getCurrentUser = () => {
  try {
    const isAuth = localStorage.getItem('petcare_is_authenticated') === 'true';
    if (!isAuth) return null;
    const session = getStored(AUTH_STORAGE_KEYS.SESSION, null) || 
                    getStored('petcare_active_user', null) || 
                    getStored('petcare_current_user', null);
    if (!session) return null;

    // Xác thực lại trạng thái thực tế trong kho người dùng (kiểm tra khóa tài khoản thời gian thực)
    const users = getUsers();
    const liveUser = users.find(u => u.id === session.id || u.email.toLowerCase() === (session.email || '').toLowerCase());
    if (!liveUser) {
      logout();
      return null;
    }

    if (liveUser.isLocked) {
      logout();
      return null;
    }

    // Vô hiệu hóa phiên đăng nhập cũ nếu mật khẩu đã bị đổi sau thời điểm xác thực của phiên
    if (liveUser.passwordChangedAt && session.authTime) {
      const changedTime = new Date(liveUser.passwordChangedAt).getTime();
      const sessionTime = new Date(session.authTime).getTime();
      if (sessionTime < changedTime) {
        console.warn('[PetCare Auth] Phiên đăng nhập đã bị hủy do mật khẩu tài khoản đã thay đổi.');
        logout();
        return null;
      }
    }

    // Luôn phản ánh đúng role và vetStatus mới nhất của tài khoản
    const sanitizedSession = { ...liveUser, authTime: session.authTime || new Date().toISOString() };
    delete sanitizedSession.password;
    return sanitizedSession;
  } catch {
    return null;
  }
};

// Đăng nhập bằng Email & Password (Xác thực Backend qua API, kiểm tra tài khoản bị khóa và mật khẩu băm)
export const login = async (email, password, rememberMe = true) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Vui lòng nhập địa chỉ Email.');
  }
  if (!password) {
    throw new Error('Vui lòng nhập Mật khẩu.');
  }

  let sessionUser = null;

  // Xác thực duy nhất qua Backend API - backend là nguồn sự thật
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password })
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok && data.success && data.user) {
      sessionUser = { ...data.user, authTime: data.authTime || new Date().toISOString() };
      
      if (data.token) {
        localStorage.setItem('petcare_auth_token', data.token);
      }

      // Đồng bộ thông tin người dùng mới nhất từ server vào local snapshot
      const localUsers = getUsers();
      const idx = localUsers.findIndex(u => u.email.toLowerCase() === cleanEmail);
      if (idx !== -1) {
        localUsers[idx] = { ...localUsers[idx], ...data.user };
      } else {
        localUsers.push(data.user);
      }
      setStored(AUTH_STORAGE_KEYS.USERS, localUsers);
    } else if (!response.ok) {
      // Backend phản hồi lỗi nghiệp vụ rõ ràng - ném ngay, không fallback
      throw new Error(data.error || 'Đăng nhập không thành công.');
    } else {
      throw new Error('Máy chủ không trả dữ liệu hợp lệ. Vui lòng thử lại.');
    }
  } catch (err) {
    // Phân biệt lỗi mạng (backend offline) và lỗi nghiệp vụ
    const isNetworkError = (
      err.message.includes('Failed to fetch') ||
      err.message.includes('NetworkError') ||
      err.message.includes('Load failed') ||
      err.message.includes('fetch') ||
      err.name === 'TypeError'
    );
    if (isNetworkError) {
      throw new Error('Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra kết nối mạng và thử lại.');
    }
    // Lỗi nghiệp vụ (sai mật khẩu, tài khoản không tồn tại, bị khóa, đã xóa)
    throw err;
  }

  // Lưu phiên làm việc
  setStored(AUTH_STORAGE_KEYS.SESSION, sessionUser);
  setStored(AUTH_STORAGE_KEYS.REMEMBER, Boolean(rememberMe));
  try {
    localStorage.setItem('petcare_active_user', JSON.stringify(sessionUser));
    localStorage.setItem('petcare_current_user', JSON.stringify(sessionUser));
    localStorage.setItem('petcare_is_authenticated', 'true');
    if (rememberMe) {
      localStorage.setItem('petcare_remembered_email', cleanEmail);
    } else {
      localStorage.removeItem('petcare_remembered_email');
    }
  } catch {}

  sound?.playSuccess?.();
  return sessionUser;
};

// Đăng ký tài khoản mới - Đã vô hiệu hóa theo cơ chế tài khoản do Quản trị viên cấp
export const register = async () => {
  throw new Error('Chức năng tự đăng ký đã bị tắt. Tài khoản được quản trị viên cấp. Vui lòng liên hệ quản trị viên để được hỗ trợ.');
};

// Đăng xuất
export const logout = () => {
  localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
  localStorage.removeItem('petcare_active_user');
  localStorage.removeItem('petcare_current_user');
  localStorage.removeItem('petcare_is_authenticated');
  localStorage.removeItem('petcare_current_portal');
  localStorage.removeItem('petcare_auth_token');
  sound?.playClick?.();
  return null;
};

// Cập nhật thông tin cá nhân (Profile)
export const updateProfile = (profileData) => {
  const current = getCurrentUser();
  if (!current) throw new Error('Chưa đăng nhập');

  const users = getUsers();
  const index = users.findIndex(u => u.id === current.id);
  if (index === -1) throw new Error('Không tìm thấy tài khoản người dùng.');

  const existing = users[index];

  const updatedUser = {
    ...existing,
    name: typeof profileData.name === 'string' && profileData.name.trim() ? profileData.name.trim() : existing.name,
    phone: typeof profileData.phone === 'string' ? profileData.phone.trim() : existing.phone,
    address: typeof profileData.address === 'string' ? profileData.address.trim() : existing.address,
    avatar: typeof profileData.avatar === 'string' && profileData.avatar.trim() ? profileData.avatar.trim() : existing.avatar
  };

  users[index] = updatedUser;
  setStored(AUTH_STORAGE_KEYS.USERS, users);

  const sessionUser = { ...updatedUser, authTime: current.authTime || new Date().toISOString() };
  delete sessionUser.password;
  setStored(AUTH_STORAGE_KEYS.SESSION, sessionUser);
  try {
    localStorage.setItem('petcare_active_user', JSON.stringify(sessionUser));
    localStorage.setItem('petcare_current_user', JSON.stringify(sessionUser));
  } catch {}

  sound?.playSuccess?.();
  return sessionUser;
};

// Đổi mật khẩu (Xác minh chính xác mật khẩu hiện tại)
export const changePassword = async (currentPassword, newPassword) => {
  const current = getCurrentUser();
  if (!current) throw new Error('Chưa đăng nhập');

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải chứa ít nhất 6 ký tự.');
  }

  let serverSuccess = false;
  try {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: current.id, currentPassword, newPassword })
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.success) {
      serverSuccess = true;
    } else if (response.status === 400 || response.status === 401 || response.status === 404) {
      throw new Error(data.error || 'Không thể đổi mật khẩu.');
    }
  } catch (err) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('Load failed')) {
      throw err;
    }
  }

  const users = getUsers();
  const user = users.find(u => u.id === current.id);
  if (!user) throw new Error('Không tìm thấy tài khoản người dùng.');

  if (!serverSuccess && user.password !== currentPassword) {
    throw new Error('Mật khẩu hiện tại không chính xác.');
  }

  const nowStr = new Date().toISOString();
  user.password = newPassword;
  user.passwordChangedAt = nowStr;
  setStored(AUTH_STORAGE_KEYS.USERS, users);

  // Cập nhật authTime cho phiên hiện tại để không bị vô hiệu hóa chính mình
  const session = getStored(AUTH_STORAGE_KEYS.SESSION, null);
  if (session) {
    session.authTime = nowStr;
    setStored(AUTH_STORAGE_KEYS.SESSION, session);
    try {
      localStorage.setItem('petcare_active_user', JSON.stringify(session));
      localStorage.setItem('petcare_current_user', JSON.stringify(session));
    } catch {}
  }

  sound?.playSuccess?.();
  return true;
};

// ============================================================================
// CÁC HÀM KHÔI PHỤC MẬT KHẨU THỰC TẾ (REAL PASSWORD RECOVERY WORKFLOW)
// ============================================================================

/**
 * Gửi yêu cầu khôi phục mật khẩu đến email
 * - Kiểm tra định dạng email
 * - Gửi yêu cầu đến Backend tạo token an toàn và gửi email thực tế
 * - Trả về thông báo chung trung tính
 * - Ném lỗi nếu gửi thư thất bại (không báo thành công giả)
 */
export const forgotPassword = async (email) => {
  const cleanEmail = (email || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    throw new Error('Địa chỉ email không đúng định dạng (ví dụ: name@example.com).');
  }

  const response = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Đã xảy ra lỗi khi gửi thư khôi phục mật khẩu. Vui lòng thử lại.');
  }

  return data;
};

/**
 * Xác minh tính hợp lệ của token khôi phục
 * - Kiểm tra token có tồn tại, chưa hết hạn (< 15 phút), chưa bị sử dụng
 */
export const verifyResetToken = async (token) => {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return {
      valid: false,
      reason: 'missing_token',
      error: 'Thiếu mã token khôi phục trong liên kết.'
    };
  }

  try {
    const response = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token.trim())}`);
    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.valid) {
      return {
        valid: false,
        reason: data.reason || 'invalid',
        error: data.error || 'Liên kết khôi phục không hợp lệ hoặc đã hết hiệu lực.'
      };
    }

    return {
      valid: true,
      user: data.user
    };
  } catch (err) {
    return {
      valid: false,
      reason: 'network_error',
      error: 'Không thể kết nối đến máy chủ xác thực. Vui lòng kiểm tra lại kết nối mạng.'
    };
  }
};

/**
 * Đặt lại mật khẩu mới bằng token
 * - Kiểm tra mật khẩu mới >= 6 ký tự
 * - Băm mật khẩu tại backend
 * - Đánh dấu token đã sử dụng (chỉ dùng 1 lần)
 * - Vô hiệu hóa các phiên đăng nhập cũ
 * - Không tự ý mở khóa tài khoản hay đổi quyền
 */
export const resetPassword = async (token, newPassword) => {
  if (!token || typeof token !== 'string' || !token.trim()) {
    throw new Error('Mã token khôi phục không hợp lệ.');
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải chứa ít nhất 6 ký tự.');
  }

  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: token.trim(), newPassword })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
  }

  // Đồng bộ mật khẩu mới vào kho người dùng client nếu người dùng có trong local
  try {
    const users = getUsers();
    const target = users.find(u => u.id === data.userId);
    if (target) {
      target.password = newPassword;
      target.passwordChangedAt = new Date().toISOString();
      setStored(AUTH_STORAGE_KEYS.USERS, users);
    }
  } catch (e) {
    console.warn('Sync local user on reset password:', e);
  }

  sound?.playSuccess?.();
  return data;
};

// ============================================================================
// CÁC HÀM DÀNH RIÊNG CHO QUẢN TRỊ VIÊN HỆ THỐNG (SYSTEM ADMIN OPERATIONS)
// ============================================================================

// Kiểm tra quyền Admin của caller
export const verifySystemAdmin = (callerId) => {
  const users = getUsers();
  const caller = users.find(u => u.id === callerId);
  if (!caller || caller.role !== ROLES.SYSTEM_ADMIN || caller.isLocked) {
    throw new Error('Truy cập bị từ chối: Yêu cầu quyền Quản trị viên hệ thống (system_admin).');
  }
  return caller;
};

// Admin sửa thông tin tài khoản (Chỉ sửa trường cho phép)
export const adminUpdateUser = (callerId, targetUserId, fields) => {
  verifySystemAdmin(callerId);
  const users = getUsers();
  const index = users.findIndex(u => u.id === targetUserId);
  if (index === -1) throw new Error('Không tìm thấy tài khoản cần chỉnh sửa.');

  const existing = users[index];
  const updatedUser = {
    ...existing,
    name: typeof fields.name === 'string' && fields.name.trim() ? fields.name.trim() : existing.name,
    phone: typeof fields.phone === 'string' ? fields.phone.trim() : existing.phone,
    address: typeof fields.address === 'string' ? fields.address.trim() : existing.address,
    avatar: typeof fields.avatar === 'string' && fields.avatar.trim() ? fields.avatar.trim() : existing.avatar
  };

  users[index] = updatedUser;
  setStored(AUTH_STORAGE_KEYS.USERS, users);
  sound?.playSuccess?.();
  return updatedUser;
};

// Admin Khóa / Mở khóa tài khoản
export const adminToggleLockUser = (callerId, targetUserId) => {
  verifySystemAdmin(callerId);
  const users = getUsers();
  const index = users.findIndex(u => u.id === targetUserId);
  if (index === -1) throw new Error('Không tìm thấy tài khoản.');

  const target = users[index];

  // Quy tắc an toàn 1: Không cho admin tự khóa tài khoản đang sử dụng
  if (target.id === callerId) {
    throw new Error('Không thể tự khóa tài khoản quản trị viên đang đăng nhập!');
  }

  // Quy tắc an toàn 2: Không cho khóa quản trị viên hệ thống hoạt động cuối cùng
  if (target.role === ROLES.SYSTEM_ADMIN && !target.isLocked) {
    const activeAdmins = users.filter(u => u.role === ROLES.SYSTEM_ADMIN && !u.isLocked);
    if (activeAdmins.length <= 1) {
      throw new Error('Không thể khóa Quản trị viên hệ thống hoạt động cuối cùng của hệ thống!');
    }
  }

  target.isLocked = !target.isLocked;
  users[index] = target;
  setStored(AUTH_STORAGE_KEYS.USERS, users);

  sound?.playSuccess?.();
  return target;
};

// Admin Duyệt hoặc Từ chối bác sĩ thú y
export const adminApproveVetDoctor = (callerId, targetUserId, isApproved) => {
  verifySystemAdmin(callerId);
  const users = getUsers();
  const index = users.findIndex(u => u.id === targetUserId);
  if (index === -1) throw new Error('Không tìm thấy tài khoản.');

  const target = users[index];
  if (target.role !== ROLES.VET_DOCTOR) {
    throw new Error('Tài khoản này không đăng ký vai trò Bác sĩ thú y.');
  }

  target.vetStatus = isApproved ? VET_STATUS.APPROVED : VET_STATUS.REJECTED;
  users[index] = target;
  setStored(AUTH_STORAGE_KEYS.USERS, users);

  sound?.playSuccess?.();
  return target;
};

// Admin Đổi vai trò tài khoản (Có kiểm tra bảo vệ Admin cuối cùng)
export const adminChangeUserRole = (callerId, targetUserId, newRole) => {
  verifySystemAdmin(callerId);
  if (!Object.values(ROLES).includes(newRole)) {
    throw new Error('Vai trò không hợp lệ trong hệ thống.');
  }

  const users = getUsers();
  const index = users.findIndex(u => u.id === targetUserId);
  if (index === -1) throw new Error('Không tìm thấy tài khoản.');

  const target = users[index];

  // Quy tắc an toàn: Không cho hạ quyền quản trị viên hệ thống hoạt động cuối cùng
  if (target.role === ROLES.SYSTEM_ADMIN && newRole !== ROLES.SYSTEM_ADMIN) {
    const activeAdmins = users.filter(u => u.role === ROLES.SYSTEM_ADMIN && !u.isLocked);
    if (activeAdmins.length <= 1) {
      throw new Error('Không thể hạ quyền Quản trị viên hệ thống hoạt động cuối cùng!');
    }
  }

  target.role = newRole;
  if (newRole === ROLES.VET_DOCTOR) {
    target.vetStatus = target.vetStatus || VET_STATUS.APPROVED;
  } else {
    target.vetStatus = null;
  }

  users[index] = target;
  setStored(AUTH_STORAGE_KEYS.USERS, users);

  sound?.playSuccess?.();
  return target;
};

/**
 * Quản trị viên tạo tài khoản mới (Admin Create User)
 * - Yêu cầu quyền system_admin của caller
 * - Kiểm tra họ tên, email hợp lệ & không trùng lặp
 * - Bác sĩ thú y được cấp quyền ngay (vetStatus: 'approved')
 * - Mật khẩu tạm thời có cờ mustChangePassword: true
 * - Lưu đồng thời vào cơ sở dữ liệu backend và kho local
 */
export const adminCreateUser = async (callerId, userData) => {
  verifySystemAdmin(callerId);

  const { name, email, phone, role, password, isLocked } = userData;
  const cleanEmail = (email || '').trim().toLowerCase();

  // Kiểm tra định dạng cơ bản (không kiểm tra trùng - để backend xác nhận)
  if (!name || !name.trim()) throw new Error('Vui lòng nhập Họ và tên.');
  if (!cleanEmail) throw new Error('Vui lòng nhập Email đăng nhập.');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new Error('Địa chỉ email không đúng định dạng (ví dụ: name@example.com).');
  }

  if (!password || password.length < 6) {
    throw new Error('Mật khẩu tạm thời phải từ 6 ký tự trở lên.');
  }

  if (role !== ROLES.PET_OWNER && role !== ROLES.VET_DOCTOR) {
    throw new Error('Vai trò không hợp lệ. Chỉ được chọn Chủ nuôi hoặc Bác sĩ thú y.');
  }

  // Gọi Backend - đây là nguồn duy nhất kiểm tra trùng email và tạo tài khoản
  let response;
  try {
    response = await fetch('/api/auth/admin/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callerId,
        name: name.trim(),
        email: cleanEmail,
        phone: phone ? phone.trim() : '',
        role,
        password,
        isLocked: Boolean(isLocked)
      })
    });
  } catch (err) {
    // Lỗi mạng thực sự - backend không thể kết nối
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và đảm bảo backend đang chạy.');
  }

  const data = await response.json().catch(() => ({}));

  // Backend phải phản hồi thành công với user hợp lệ
  if (!response.ok || !data.success || !data.user) {
    throw new Error(data.error || 'Không thể tạo tài khoản. Vui lòng thử lại.');
  }

  const serverUser = data.user;
  // Lưu bản ghi vào local snapshot (kèm password để xác thực offline nếu cần)
  const newUser = { ...serverUser, password };

  // Giải phóng email trong danh sách đã xóa ở localStorage (nếu có)
  const deletedList = getStored(AUTH_STORAGE_KEYS.DELETED_USERS, []);
  if (Array.isArray(deletedList) && deletedList.length > 0) {
    let modified = false;
    const updatedDeletedList = deletedList.map(item => {
      if ((item.email || '').trim().toLowerCase() === cleanEmail) {
        modified = true;
        return { ...item, email: '' }; // Giữ ID để seed không tái sinh, xóa email
      }
      return item;
    });
    if (modified) setStored(AUTH_STORAGE_KEYS.DELETED_USERS, updatedDeletedList);
  }

  // Dọn dẹp legacy registered users nếu trùng email
  const legacyRegistered = getStored('petcare_registered_users', []);
  if (Array.isArray(legacyRegistered) && legacyRegistered.length > 0) {
    const filteredLegacy = legacyRegistered.filter(leg =>
      (leg?.email || '').trim().toLowerCase() !== cleanEmail
    );
    setStored('petcare_registered_users', filteredLegacy);
  }

  // Cập nhật local snapshot (loại bỏ bản ghi cũ trùng email/id nếu có)
  const currentUsers = getUsers();
  const filteredUsers = currentUsers.filter(u =>
    String(u.id).trim() !== String(newUser.id).trim() &&
    (u.email || '').trim().toLowerCase() !== cleanEmail
  );
  setStored(AUTH_STORAGE_KEYS.USERS, [...filteredUsers, newUser]);

  sound?.playSuccess?.();
  return newUser;
};

/**
 * Quản trị viên đặt lại mật khẩu tạm thời cho người dùng (Admin Reset Password)
 * - Hỗ trợ tra cứu bằng ID và Email dự phòng
 * - Tạo mật khẩu tạm thời mới, băm bảo mật tại backend
 * - Gán cờ mustChangePassword = true bắt buộc đổi mật khẩu ở lần đăng nhập tiếp theo
 * - Vô hiệu hóa các phiên đăng nhập cũ qua passwordChangedAt
 */
export const adminResetUserPassword = async (callerId, targetUserId, newTemporaryPassword, targetEmail = null) => {
  verifySystemAdmin(callerId);

  if (!newTemporaryPassword || newTemporaryPassword.length < 6) {
    throw new Error('Mật khẩu tạm thời phải từ 6 ký tự trở lên.');
  }

  const cleanTargetId = targetUserId ? String(targetUserId).trim() : '';
  const cleanTargetEmail = targetEmail ? String(targetEmail).trim().toLowerCase() : '';

  // 1. Thử cập nhật trên Backend Server
  let serverSuccess = false;
  let serverUser = null;
  try {
    const response = await fetch('/api/auth/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callerId,
        targetUserId: cleanTargetId,
        targetEmail: cleanTargetEmail,
        newTemporaryPassword
      })
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.success && data.user) {
      serverSuccess = true;
      serverUser = data.user;
    } else if (response.status === 404) {
      throw new Error('Không tìm thấy tài khoản người dùng hoặc tài khoản đã bị xóa.');
    } else if (data.error) {
      throw new Error(data.error);
    }
  } catch (err) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('Load failed')) {
      throw err;
    }
  }

  // 2. Tìm và cập nhật trong danh sách người dùng local
  const users = getUsers();
  const index = users.findIndex(u => 
    (cleanTargetId && String(u.id).trim() === cleanTargetId) ||
    (cleanTargetEmail && (u.email || '').trim().toLowerCase() === cleanTargetEmail)
  );

  if (index === -1 && !serverSuccess) {
    throw new Error('Không tìm thấy tài khoản người dùng hoặc tài khoản đã bị xóa.');
  }

  const nowStr = new Date().toISOString();
  if (index !== -1) {
    users[index].password = newTemporaryPassword;
    users[index].mustChangePassword = true;
    users[index].passwordChangedAt = nowStr;
    if (serverUser && serverUser.id) {
      users[index].id = serverUser.id;
    }
    setStored(AUTH_STORAGE_KEYS.USERS, users);
  }

  // Nếu tài khoản được reset trùng với phiên hiện hành trên trình duyệt này
  const currentSession = getStored(AUTH_STORAGE_KEYS.SESSION, null);
  if (currentSession && (
    (cleanTargetId && String(currentSession.id).trim() === cleanTargetId) ||
    (cleanTargetEmail && (currentSession.email || '').trim().toLowerCase() === cleanTargetEmail)
  )) {
    const updatedSession = {
      ...currentSession,
      mustChangePassword: true,
      passwordChangedAt: nowStr
    };
    setStored(AUTH_STORAGE_KEYS.SESSION, updatedSession);
    try {
      localStorage.setItem('petcare_active_user', JSON.stringify(updatedSession));
      localStorage.setItem('petcare_current_user', JSON.stringify(updatedSession));
    } catch {}
  }

  sound?.playSuccess?.();
  return index !== -1 ? users[index] : serverUser;
};

/**
 * Quản trị viên xóa tài khoản người dùng (Admin Delete User)
 * - Chỉ Quản trị viên hệ thống có quyền
 * - Không cho tự xóa tài khoản admin đang đăng nhập
 * - Không cho xóa quản trị viên hệ thống hoạt động cuối cùng
 * - Yêu cầu xác nhận đúng email tài khoản
 * - Bảo lưu hồ sơ thú cưng và dữ liệu chăm sóc (đánh dấu chủ sở hữu đã xóa)
 * - Ngăn chặn tái sinh tài khoản mẫu đã xóa
 */
export const adminDeleteUser = async (callerId, targetUserId, confirmEmail, targetEmail = null) => {
  verifySystemAdmin(callerId);

  const cleanTargetId = targetUserId ? String(targetUserId).trim() : '';
  const cleanTargetEmail = targetEmail ? String(targetEmail).trim().toLowerCase() : '';
  const cleanConfirm = confirmEmail ? String(confirmEmail).trim().toLowerCase() : '';

  const users = getUsers();
  const index = users.findIndex(u => 
    (cleanTargetId && String(u.id).trim() === cleanTargetId) ||
    (cleanTargetEmail && (u.email || '').trim().toLowerCase() === cleanTargetEmail)
  );

  if (index === -1) {
    throw new Error('Không tìm thấy tài khoản người dùng hoặc tài khoản đã bị xóa.');
  }

  const targetUser = users[index];

  // 1. Chặn tự xóa chính tài khoản đang đăng nhập
  const currentSession = getStored(AUTH_STORAGE_KEYS.SESSION, null);
  if (String(callerId).trim() === String(targetUser.id).trim() || 
      (currentSession?.email && currentSession.email.trim().toLowerCase() === targetUser.email.toLowerCase())) {
    throw new Error('Không thể tự xóa tài khoản quản trị viên đang đăng nhập.');
  }

  // 2. Chặn xóa admin hoạt động cuối cùng
  if (targetUser.role === ROLES.SYSTEM_ADMIN) {
    const activeAdmins = users.filter(u => u.role === ROLES.SYSTEM_ADMIN && !u.isLocked);
    if (activeAdmins.length <= 1) {
      throw new Error('Không thể xóa quản trị viên hệ thống hoạt động cuối cùng.');
    }
  }

  // 3. Kiểm tra email xác nhận
  if (!cleanConfirm || cleanConfirm !== targetUser.email.toLowerCase()) {
    throw new Error('Email xác nhận không trùng khớp với email của tài khoản cần xóa.');
  }

  // 4. Gọi Backend Server xóa an toàn - bắt buộc phải thành công
  let deleteResponse;
  try {
    deleteResponse = await fetch('/api/auth/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callerId,
        targetUserId: targetUser.id,
        targetEmail: targetUser.email,
        confirmEmail: cleanConfirm
      })
    });
  } catch (err) {
    // Lỗi mạng - backend không thể kết nối, giữ nguyên danh sách
    throw new Error('Không thể kết nối đến máy chủ. Tài khoản chưa bị xóa. Vui lòng kiểm tra kết nối mạng.');
  }

  const deleteData = await deleteResponse.json().catch(() => ({}));

  // Chỉ cập nhật local khi backend xác nhận thành công
  if (!deleteResponse.ok || !deleteData.success) {
    throw new Error(deleteData.error || 'Máy chủ không xác nhận xóa tài khoản. Vui lòng thử lại.');
  }

  // 5. Backend đã xóa thành công - cập nhật local snapshot
  const updatedUsers = users.filter(u =>
    String(u.id).trim() !== String(targetUser.id).trim() &&
    (u.email || '').trim().toLowerCase() !== targetUser.email.toLowerCase()
  );
  setStored(AUTH_STORAGE_KEYS.USERS, updatedUsers);

  // Ghi nhận vào danh sách đã xóa (chỉ giữ ID để ngăn seed tái sinh; email được giải phóng)
  const deletedList = getStored(AUTH_STORAGE_KEYS.DELETED_USERS, []);
  const alreadyIn = deletedList.some(d =>
    String(d.id).trim() === String(targetUser.id).trim()
  );
  if (!alreadyIn) {
    deletedList.push({
      id: targetUser.id,
      email: '', // Email KHÔNG bị khóa vĩnh viễn - chỉ lưu ID để ngăn seed tái sinh
      deletedAt: new Date().toISOString()
    });
    setStored(AUTH_STORAGE_KEYS.DELETED_USERS, deletedList);
  } else {
    // Đảm bảo email được giải phóng nếu bản ghi đã tồn tại
    const updatedDeleted = deletedList.map(d =>
      String(d.id).trim() === String(targetUser.id).trim()
        ? { ...d, email: '' }
        : d
    );
    setStored(AUTH_STORAGE_KEYS.DELETED_USERS, updatedDeleted);
  }

  // Dọn dẹp legacy registered users nếu có
  const legacyRegistered = getStored('petcare_registered_users', []);
  if (Array.isArray(legacyRegistered) && legacyRegistered.length > 0) {
    const filteredLegacy = legacyRegistered.filter(leg =>
      String(leg.id).trim() !== String(targetUser.id).trim() &&
      (leg.email || '').trim().toLowerCase() !== targetUser.email.toLowerCase()
    );
    setStored('petcare_registered_users', filteredLegacy);
  }

  // Xóa email đã ghi nhớ nếu khớp
  if (localStorage.getItem('petcare_remembered_email')?.toLowerCase() === targetUser.email.toLowerCase()) {
    localStorage.removeItem('petcare_remembered_email');
  }

  // 6. Xử lý bảo lưu an toàn dữ liệu chăm sóc (đánh dấu chủ sở hữu đã xóa, thu hồi quyền chia sẻ)
  handleUserDeletedDataRetention(targetUser.id, targetUser.role);

  sound?.playSuccess?.();
  return { success: true, deletedUser: targetUser };
};


/**
 * Người dùng hoàn tất đổi mật khẩu bắt buộc ở lần đăng nhập đầu tiên
 * - Cập nhật mật khẩu mới
 * - Tắt cờ mustChangePassword: false
 * - Cập nhật phiên đăng nhập hiện tại
 */
export const completeFirstLoginPasswordChange = async (userId, newPassword) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải từ 6 ký tự trở lên.');
  }

  const nowStr = new Date().toISOString();

  try {
    const response = await fetch('/api/auth/first-login-change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, newPassword })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok && data.error) {
      throw new Error(data.error);
    }
  } catch (err) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('Load failed')) {
      throw err;
    }
  }

  // Cập nhật trong danh sách local
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index].password = newPassword;
    users[index].mustChangePassword = false;
    users[index].passwordChangedAt = nowStr;
    setStored(AUTH_STORAGE_KEYS.USERS, users);
  }

  // Cập nhật phiên hiện tại
  const currentSession = getStored(AUTH_STORAGE_KEYS.SESSION, null);
  if (currentSession && (currentSession.id === userId || currentSession.email)) {
    const updatedSession = {
      ...currentSession,
      mustChangePassword: false,
      authTime: nowStr
    };
    setStored(AUTH_STORAGE_KEYS.SESSION, updatedSession);
    try {
      localStorage.setItem('petcare_active_user', JSON.stringify(updatedSession));
      localStorage.setItem('petcare_current_user', JSON.stringify(updatedSession));
    } catch {}
  }

  sound?.playSuccess?.();
  return { success: true };
};

/**
 * Đồng bộ danh sách người dùng với Backend Server
 * Backend là nguồn sự thật duy nhất cho danh sách Admin và kiểm tra email trùng.
 * Hàm này CẬP NHẬT local snapshot từ backend, không merge với legacy data.
 */
export const syncUsersWithBackend = async () => {
  // Lấy danh sách người dùng từ backend
  const response = await fetch('/api/auth/users');
  if (!response.ok) {
    throw new Error('Không thể tải danh sách tài khoản từ máy chủ.');
  }

  const serverUsers = await response.json().catch(() => null);
  if (!Array.isArray(serverUsers)) {
    throw new Error('Máy chủ trả dữ liệu không hợp lệ.');
  }

  // Đồng bộ danh sách đã xóa từ server để đảm bảo nhất quán
  try {
    const delResponse = await fetch('/api/auth/deleted-users');
    if (delResponse.ok) {
      const serverDeleted = await delResponse.json();
      if (Array.isArray(serverDeleted)) {
        const currentDeleted = getStored(AUTH_STORAGE_KEYS.DELETED_USERS, []);
        const currentIds = new Set(currentDeleted.map(d => String(d.id).trim()));
        let modified = false;
        serverDeleted.forEach(sd => {
          if (sd?.id && !currentIds.has(String(sd.id).trim())) {
            // Khi nhập từ server: đảm bảo email được giải phóng (không khóa vĩnh viễn)
            currentDeleted.push({ ...sd, email: '' });
            currentIds.add(String(sd.id).trim());
            modified = true;
          }
        });
        if (modified) setStored(AUTH_STORAGE_KEYS.DELETED_USERS, currentDeleted);
      }
    }
  } catch { /* Bỏ qua lỗi khi lấy deleted list */ }

  const deletedList = getStored(AUTH_STORAGE_KEYS.DELETED_USERS, []);
  const isDeletedById = (id) => {
    if (!id) return false;
    return deletedList.some(d => String(d.id).trim() === String(id).trim());
  };

  // Lọc bỏ tài khoản đã bị xóa khỏi server response
  const activeServerUsers = serverUsers.filter(u => !isDeletedById(u.id));

  // Giải phóng email trong deletedList nếu email đó đang hoạt động trên server
  const activeEmails = new Set(activeServerUsers.map(u => (u.email || '').toLowerCase().trim()));
  const currentDeleted = getStored(AUTH_STORAGE_KEYS.DELETED_USERS, []);
  let emailModified = false;
  const cleanedDeleted = currentDeleted.map(item => {
    if (item.email && activeEmails.has((item.email || '').toLowerCase().trim())) {
      emailModified = true;
      return { ...item, email: '' };
    }
    return item;
  });
  if (emailModified) setStored(AUTH_STORAGE_KEYS.DELETED_USERS, cleanedDeleted);

  // Dọn dẹp petcare_registered_users legacy - xóa các email đã có trên server
  try {
    const legacy = getStored('petcare_registered_users', []);
    if (Array.isArray(legacy) && legacy.length > 0) {
      const serverIds = new Set(activeServerUsers.map(u => String(u.id).trim()));
      const serverEmailSet = new Set(activeServerUsers.map(u => (u.email || '').toLowerCase().trim()));
      const cleanedLegacy = legacy.filter(l =>
        l?.id && !serverIds.has(String(l.id).trim()) &&
        l?.email && !serverEmailSet.has((l.email || '').toLowerCase().trim()) &&
        !isDeletedById(l.id)
      );
      if (cleanedLegacy.length !== legacy.length) {
        setStored('petcare_registered_users', cleanedLegacy);
      }
    }
  } catch { /* Bỏ qua lỗi legacy */ }

  // Lưu snapshot backend vào localStorage - đây là nguồn duy nhất cho danh sách Admin
  // Giữ lại trường password từ local nếu cần (cho offline auth)
  const localSnapshot = getStored(AUTH_STORAGE_KEYS.USERS, []) || [];
  const localMap = new Map(localSnapshot.map(u => [String(u.id).trim(), u]));

  const mergedUsers = activeServerUsers.map(su => {
    const local = localMap.get(String(su.id).trim());
    return {
      ...(local || {}),
      ...su,
      // Giữ password local nếu backend không trả về (backend ẩn password)
      password: (local?.password && !su.password) ? local.password : (su.password || local?.password || 'User@123456')
    };
  });

  setStored(AUTH_STORAGE_KEYS.USERS, mergedUsers);
  return mergedUsers;
};


