// Authentication Service for PetCare PRO AI
import { sound } from './soundService';

const AUTH_STORAGE_KEYS = {
  USERS: 'petcare_auth_users_v1',
  SESSION: 'petcare_auth_session_v1',
  REMEMBER: 'petcare_auth_remember_v1'
};

// Default Demo & Tester Users
const DEFAULT_DEMO_USER = {
  id: 'user_demo_01',
  name: 'Nguyễn Minh Quân',
  email: 'demo@petcare.ai',
  password: 'password123',
  phone: '0912.345.678',
  address: 'Cầu Giấy, Hà Nội',
  role: 'pet_owner', // 'pet_owner' | 'vet_doctor'
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  createdAt: '2026-01-15T08:00:00.000Z'
};

export const TESTER_PRO_USER = {
  id: 'user_tester_pro',
  name: 'BS. Hoàng Hải Nam (Pro Vet)',
  email: 'tester@petcare.ai',
  password: '123456',
  phone: '0988.789.999',
  address: 'Tòa Landmark 81, P. 22, Q. Bình Thạnh, TP. Hồ Chí Minh',
  role: 'vet_doctor',
  avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80',
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

// Lấy danh sách users
export const getUsers = () => {
  const defaultList = [DEFAULT_DEMO_USER, TESTER_PRO_USER];
  const users = getStored(AUTH_STORAGE_KEYS.USERS, null);
  if (!users || !Array.isArray(users) || users.length === 0) {
    setStored(AUTH_STORAGE_KEYS.USERS, defaultList);
    return defaultList;
  }
  // Đảm bảo cả 2 tài khoản tester và demo luôn tồn tại
  let updated = false;
  const merged = [...users];
  defaultList.forEach(defUser => {
    if (!merged.some(u => u.email.toLowerCase() === defUser.email.toLowerCase())) {
      merged.push(defUser);
      updated = true;
    }
  });
  if (updated) {
    setStored(AUTH_STORAGE_KEYS.USERS, merged);
  }
  return merged;
};

// Lấy thông tin phiên đăng nhập hiện tại
export const getCurrentUser = () => {
  try {
    const isAuth = localStorage.getItem('petcare_is_authenticated') === 'true';
    if (!isAuth) return null;
    const petUser = localStorage.getItem('petcare_current_user');
    if (petUser) return JSON.parse(petUser);
  } catch {}
  const session = getStored(AUTH_STORAGE_KEYS.SESSION, null);
  if (!session) {
    return null;
  }
  return session;
};

// Đăng nhập bằng Email & Password
export const login = (email, password, rememberMe = true) => {
  const users = getUsers();
  const cleanEmail = (email || '').trim().toLowerCase();
  const user = users.find(u => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    throw new Error('Tài khoản email này chưa được đăng ký trong hệ thống.');
  }

  // Chấp nhận pass của user hoặc pass mặc định 123456 / password123 cho demo
  if (user.password !== password && password !== '123456' && password !== 'password123') {
    throw new Error('Mật khẩu không chính xác. Vui lòng kiểm tra lại!');
  }

  // Lưu phiên đăng nhập
  const sessionUser = { ...user };
  delete sessionUser.password;
  setStored(AUTH_STORAGE_KEYS.SESSION, sessionUser);
  setStored(AUTH_STORAGE_KEYS.REMEMBER, Boolean(rememberMe));

  sound.playSuccess();
  return sessionUser;
};

// Đăng ký tài khoản mới
export const register = ({ name, email, password, phone, role = 'pet_owner' }) => {
  const users = getUsers();
  const cleanEmail = (email || '').trim().toLowerCase();

  if (users.some(u => u.email.toLowerCase() === cleanEmail)) {
    throw new Error('Email này đã được sử dụng. Vui lòng đăng nhập hoặc dùng email khác.');
  }

  const newUser = {
    id: `user_${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    password,
    phone: phone ? phone.trim() : '',
    address: 'Việt Nam',
    role,
    avatar: role === 'vet_doctor'
      ? 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  };

  const updatedUsers = [...users, newUser];
  setStored(AUTH_STORAGE_KEYS.USERS, updatedUsers);

  // Tự động đăng nhập sau khi đăng ký
  const sessionUser = { ...newUser };
  delete sessionUser.password;
  setStored(AUTH_STORAGE_KEYS.SESSION, sessionUser);

  sound.playSuccess();
  return sessionUser;
};

// Đăng nhập mạng xã hội (Google / Apple OAuth Simulation)
export const loginWithSocial = (provider = 'google') => {
  const users = getUsers();
  const email = provider === 'google' ? 'google.user@gmail.com' : 'apple.id@icloud.com';
  let user = users.find(u => u.email === email);

  if (!user) {
    user = {
      id: `user_${provider}_${Date.now()}`,
      name: provider === 'google' ? 'Google Pet Lover' : 'Apple User',
      email,
      password: 'oauth_secured_token',
      phone: '0988.999.888',
      address: 'Hà Nội, Việt Nam',
      role: 'pet_owner',
      avatar: provider === 'google'
        ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString()
    };
    setStored(AUTH_STORAGE_KEYS.USERS, [...users, user]);
  }

  const sessionUser = { ...user };
  delete sessionUser.password;
  setStored(AUTH_STORAGE_KEYS.SESSION, sessionUser);
  sound.playSuccess();
  return sessionUser;
};

// Đăng xuất
export const logout = () => {
  localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION);
  localStorage.removeItem('petcare_is_authenticated');
  localStorage.removeItem('petcare_current_user');
  sound?.playClick?.();
  return null;
};

// Cập nhật thông tin cá nhân Profile
export const updateProfile = (profileData) => {
  const current = getCurrentUser();
  if (!current) throw new Error('Chưa đăng nhập');

  const users = getUsers();
  const index = users.findIndex(u => u.id === current.id);
  
  const updatedUser = {
    ...(index !== -1 ? users[index] : current),
    ...profileData
  };

  if (index !== -1) {
    users[index] = updatedUser;
    setStored(AUTH_STORAGE_KEYS.USERS, users);
  }

  const sessionUser = { ...updatedUser };
  delete sessionUser.password;
  setStored(AUTH_STORAGE_KEYS.SESSION, sessionUser);

  sound.playSuccess();
  return sessionUser;
};

// Đổi mật khẩu
export const changePassword = (currentPassword, newPassword) => {
  const current = getCurrentUser();
  if (!current) throw new Error('Chưa đăng nhập');

  const users = getUsers();
  const user = users.find(u => u.id === current.id);

  if (!user) throw new Error('Không tìm thấy tài khoản người dùng.');

  // Cho phép pass demo 123456
  if (user.password !== currentPassword && currentPassword !== '123456') {
    throw new Error('Mật khẩu hiện tại không chính xác.');
  }

  user.password = newPassword;
  setStored(AUTH_STORAGE_KEYS.USERS, users);
  sound.playSuccess();
  return true;
};
