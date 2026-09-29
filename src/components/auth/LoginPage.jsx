import React, { useState } from 'react';
import { 
  Eye, EyeOff, Sparkles, ArrowLeft, AlertCircle, 
  CheckCircle, User, Mail, Phone, Lock, ArrowRight, ShieldCheck, Stethoscope, ChevronDown
} from 'lucide-react';
import { ToothlessMascot } from './ToothlessMascot';
import { ForestBackgroundIllustration } from './ForestBackgroundIllustration';
import { FallingPawsBackground } from './FallingPawsBackground';
import { sound } from '../../services/soundService';

export function LoginPage({ 
  onLoginSuccess, 
  onBackToHome, 
  showBackHome = false, 
  initialMode = 'login' 
}) {
  // 1. Chế độ Đăng nhập / Đăng ký
  const [isRegisterMode, setIsRegisterMode] = useState(initialMode === 'register');
  const [mode, setMode] = useState(initialMode); // 'login' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showDevAccounts, setShowDevAccounts] = useState(false);

  // Login form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register form inputs & Role selector
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState('OWNER'); // 'OWNER' | 'CLINIC_ADMIN'

  // Forgot password form input
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Focus tracking for Toothless chibi mascot interaction
  const [isUsernameFocused, setIsUsernameFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // 1. HÀM ĐĂNG NHẬP TEST 1-CLICK DÀNH RIÊNG CHO 2 VAI TRÒ (RBAC DEMO)
  // ============================================================================
  const handleQuickTestLogin = (targetRole = 'OWNER') => {
    setErrorMessage('');
    setSuccessMessage('');

    let userToLogin;
    if (targetRole === 'CLINIC_ADMIN') {
      userToLogin = {
        id: 'user_vet_nam',
        name: 'BS. Hoàng Hải Nam (Pro Vet)',
        email: 'tester@petcare.ai',
        phone: '0988789999',
        role: 'CLINIC_ADMIN',
        avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80'
      };
    } else {
      userToLogin = {
        id: 'user_owner_manh',
        name: 'Đinh Xuân Mạnh',
        email: 'demo@petcare.ai',
        phone: '0912345678',
        role: 'OWNER',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'
      };
    }

    try {
      localStorage.setItem('petcare_active_user', JSON.stringify(userToLogin));
      localStorage.setItem('petcare_current_user', JSON.stringify(userToLogin));
      localStorage.setItem('petcare_is_authenticated', 'true');
      localStorage.setItem('petcare_current_portal', targetRole === 'CLINIC_ADMIN' ? 'CLINIC' : 'OWNER');
      sound?.playSuccess?.();
    } catch (err) {
      console.error('Error saving session:', err);
    }

    if (onLoginSuccess) {
      onLoginSuccess(userToLogin);
    }
  };

  // ============================================================================
  // 2. XỬ LÝ SỰ KIỆN ĐĂNG NHẬP FORM THƯỜNG (SIGN IN)
  // ============================================================================
  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const emailInput = (email || '').trim();

    // Tìm trong danh sách registered_users nếu người dùng đã đăng ký trước đó
    let userToLogin = null;
    try {
      const registeredUsers = JSON.parse(localStorage.getItem('petcare_registered_users') || '[]');
      if (emailInput) {
        const found = registeredUsers.find(
          u => (u.email || '').toLowerCase() === emailInput.toLowerCase()
        );
        if (found) {
          userToLogin = {
            ...found,
            role: found.role || 'OWNER',
            avatar: found.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'
          };
        }
      }
    } catch (err) {
      console.error('Error reading registered users:', err);
    }

    // Nếu không tìm thấy, nhận diện theo email hoặc dùng mặc định
    if (!userToLogin) {
      const isVet = emailInput.toLowerCase().includes('vet') || 
                    emailInput.toLowerCase().includes('tester') || 
                    emailInput.toLowerCase().includes('admin');
      if (isVet) {
        userToLogin = {
          id: 'user_vet_nam',
          name: 'BS. Hoàng Hải Nam (Pro Vet)',
          email: emailInput || 'tester@petcare.ai',
          phone: '0988789999',
          role: 'CLINIC_ADMIN',
          avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80'
        };
      } else {
        userToLogin = {
          id: 'user_owner_manh',
          name: 'Đinh Xuân Mạnh',
          email: emailInput || 'demo@petcare.ai',
          phone: '0912345678',
          role: 'OWNER',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'
        };
      }
    }

    // Lưu phiên đăng nhập vào localStorage
    try {
      localStorage.setItem('petcare_active_user', JSON.stringify(userToLogin));
      localStorage.setItem('petcare_current_user', JSON.stringify(userToLogin));
      localStorage.setItem('petcare_is_authenticated', 'true');
      localStorage.setItem('petcare_current_portal', userToLogin.role === 'CLINIC_ADMIN' ? 'CLINIC' : 'OWNER');
      sound?.playSuccess?.();
    } catch (err) {
      console.error('Error saving login session:', err);
    }

    // Chuyển hướng vào workspace phù hợp
    if (onLoginSuccess) {
      onLoginSuccess(userToLogin);
    }
  };

  // ============================================================================
  // 3. XỬ LÝ TẠO TÀI KHOẢN VỚI BỘ CHỌN VAI TRÒ (ROLE SELECTOR)
  // ============================================================================
  const handleRegister = (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regName.trim()) {
      setErrorMessage('Vui lòng nhập Họ và tên.');
      sound?.playAlert?.();
      return;
    }

    if (!regEmail.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ Email.');
      sound?.playAlert?.();
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 6 ký tự.');
      sound?.playAlert?.();
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Xác nhận mật khẩu không trùng khớp. Vui lòng kiểm tra lại!');
      sound?.playAlert?.();
      return;
    }

    setIsLoading(true);

    const newUser = {
      id: `user_${Date.now()}`,
      name: regName.trim(),
      email: regEmail.trim(),
      phone: regPhone.trim() || '0987654321',
      role: regRole, // 'OWNER' | 'CLINIC_ADMIN'
      avatar: regRole === 'CLINIC_ADMIN' 
        ? 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150',
      createdAt: new Date().toISOString()
    };

    try {
      // Lưu thông tin tài khoản mới vào mảng petcare_registered_users trong localStorage
      const existing = JSON.parse(localStorage.getItem('petcare_registered_users') || '[]');
      const updated = [
        ...existing.filter(u => (u.email || '').toLowerCase() !== newUser.email.toLowerCase()),
        newUser
      ];
      localStorage.setItem('petcare_registered_users', JSON.stringify(updated));

      // Tự động lưu phiên đăng nhập
      localStorage.setItem('petcare_active_user', JSON.stringify(newUser));
      localStorage.setItem('petcare_current_user', JSON.stringify(newUser));
      localStorage.setItem('petcare_is_authenticated', 'true');
      localStorage.setItem('petcare_current_portal', regRole === 'CLINIC_ADMIN' ? 'CLINIC' : 'OWNER');

      setSuccessMessage(`Đăng ký thành công với vai trò ${regRole === 'CLINIC_ADMIN' ? 'Bác Sĩ Admin' : 'Chủ Nuôi'}! Đang chuyển vào hệ thống...`);
      sound?.playSuccess?.();

      setTimeout(() => {
        setIsLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess(newUser);
        }
      }, 350);
    } catch (err) {
      console.error('Error during registration:', err);
      setIsLoading(false);
      setErrorMessage('Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại.');
    }
  };

  // Handle Social Login (Google / Apple OAuth Mock)
  const handleSocialLogin = (provider) => {
    sound?.playClick?.();
    const userToLogin = {
      id: `user_${provider.toLowerCase()}_${Date.now()}`,
      name: provider === 'Google' ? 'Đinh Xuân Mạnh (Google)' : 'Đinh Xuân Mạnh (Apple ID)',
      email: provider === 'Google' ? 'manh.google@petcare.ai' : 'manh.apple@petcare.ai',
      role: 'OWNER',
      phone: '0912345678',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'
    };
    try {
      localStorage.setItem('petcare_active_user', JSON.stringify(userToLogin));
      localStorage.setItem('petcare_current_user', JSON.stringify(userToLogin));
      localStorage.setItem('petcare_is_authenticated', 'true');
      localStorage.setItem('petcare_current_portal', 'OWNER');
      sound?.playSuccess?.();
    } catch (err) {
      console.error('Error saving social session:', err);
    }
    if (onLoginSuccess) {
      onLoginSuccess(userToLogin);
    }
  };

  // Handle Forgot Password Submit
  const handleForgotSubmit = (e) => {
    if (e) e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMessage('Vui lòng nhập địa chỉ email của bạn.');
      sound?.playAlert?.();
      return;
    }
    setForgotSent(true);
    sound?.playSuccess?.();
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#184232] relative px-4 py-8 select-none overflow-x-hidden selection:bg-emerald-500 selection:text-white font-sans">
      
      {/* ============================================================ */}
      {/* NATURE FOREST PARK BACKGROUND & FALLING PET PAWS / LEAVES    */}
      {/* ============================================================ */}
      <ForestBackgroundIllustration />
      <FallingPawsBackground />

      {/* Top Bar: Back button */}
      {showBackHome && onBackToHome && (
        <div className="w-full max-w-[440px] mb-3 flex items-center justify-start z-20">
          <button
            type="button"
            onClick={() => {
              sound?.playClick?.();
              if (onBackToHome) onBackToHome();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-100 hover:text-white transition-colors group px-3.5 py-1.5 rounded-xl bg-[#102B21]/75 border border-emerald-400/25 hover:border-emerald-300/50 backdrop-blur-md cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Trang chủ</span>
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* INTERACTIVE TOOTHLESS (RĂNG SÚN) CHIBI MASCOT                */}
      {/* ============================================================ */}
      <div className="w-full max-w-[440px] relative z-20 flex justify-center -mb-8 pointer-events-none">
        <ToothlessMascot
          isPasswordFocused={isPasswordFocused}
          showPassword={showPassword || showConfirmPassword}
          isUsernameFocused={isUsernameFocused}
          usernameLength={isRegisterMode ? regEmail.length : email.length}
          isSubmitting={isLoading}
        />
      </div>

      {/* ============================================================ */}
      {/* FOREST FROSTED GLASS CARD CONTAINER                          */}
      {/* ============================================================ */}
      <div className="w-full max-w-[440px] bg-[#122A23]/75 border border-emerald-400/25 hover:border-emerald-400/40 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(3,20,14,0.7),0_0_35px_rgba(16,185,129,0.15)] backdrop-blur-2xl p-6 sm:p-8 pt-8 z-10 flex flex-col relative transition-all duration-300">
        
        {/* Subtle Frosted Rim Highlight */}
        <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent pointer-events-none" />

        {/* Card Header */}
        <div className="text-left mb-5 pt-1">
          {mode === 'forgot' ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Khôi Phục Mật Khẩu
              </h1>
              <p className="text-xs text-emerald-100/75 mt-1 font-normal tracking-wide">
                Nhập email để nhận liên kết đặt lại mật khẩu
              </p>
            </>
          ) : isRegisterMode ? (
            <>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Tạo Tài Khoản
              </h1>
              <p className="text-xs text-emerald-100/75 mt-1 font-normal tracking-wide">
                Đăng ký tài khoản và phân quyền Workspace phù hợp
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black tracking-tight text-white">
                Welcome back
              </h1>
              <p className="text-xs text-emerald-100/75 mt-1 font-normal tracking-wide">
                Đăng nhập để vào hệ sinh thái PetCare PRO AI
              </p>
            </>
          )}
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-shake backdrop-blur-md">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Success Notification */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2.5 backdrop-blur-md">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* SUB-MODE: FORGOT PASSWORD                                    */}
        {/* ============================================================ */}
        {mode === 'forgot' ? (
          <div className="space-y-4">
            {forgotSent ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Đã Gửi Liên Kết!</h3>
                <p className="text-xs text-emerald-100/80 max-w-xs mx-auto">
                  Hướng dẫn khôi phục đã được gửi tới <strong className="text-emerald-300">{forgotEmail}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSent(false);
                    setMode('login');
                  }}
                  className="mt-3 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-emerald-400/30"
                >
                  Quay lại Đăng nhập
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <p className="text-xs text-emerald-100/80">
                  Nhập địa chỉ email của bạn để nhận liên kết đặt lại mật khẩu.
                </p>
                <div className="rounded-2xl bg-white/[0.08] border border-emerald-400/20 px-4 py-2.5 backdrop-blur-md">
                  <label className="block text-[11px] font-medium text-emerald-200/80 mb-0.5">
                    Email tài khoản
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-transparent text-white text-sm placeholder-emerald-100/35 focus:outline-none font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
                >
                  Gửi Liên Kết Khôi Phục
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }}
                    className="text-xs text-emerald-200/80 hover:text-white font-medium cursor-pointer"
                  >
                    ← Quay lại Đăng nhập
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : isRegisterMode ? (
          /* ============================================================ */
          /* CHẾ ĐỘ 2: ĐĂNG KÝ TÀI KHOẢN VỚI ROLE SELECTOR                */
          /* ============================================================ */
          <form onSubmit={handleRegister} className="space-y-3">
            
            {/* 1. Bổ sung chọn vai trò (Role Selector) */}
            <div>
              <label className="block text-[11px] font-medium text-emerald-200/90 mb-1.5">
                Vai trò của bạn trong hệ sinh thái:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="chip-role-owner"
                  onClick={() => {
                    sound?.playClick?.();
                    setRegRole('OWNER');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    regRole === 'OWNER'
                      ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-white/[0.05] border-emerald-400/20 text-emerald-100/70 hover:border-emerald-400/35'
                  }`}
                >
                  <span>🐶</span>
                  <span className="truncate">Chủ nuôi thú cưng</span>
                </button>

                <button
                  type="button"
                  id="chip-role-clinic"
                  onClick={() => {
                    sound?.playClick?.();
                    setRegRole('CLINIC_ADMIN');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    regRole === 'CLINIC_ADMIN'
                      ? 'bg-teal-500/30 border-teal-300 text-teal-200 shadow-[0_0_12px_rgba(20,184,166,0.35)]'
                      : 'bg-white/[0.05] border-emerald-400/20 text-emerald-100/70 hover:border-emerald-400/35'
                  }`}
                >
                  <span>🩺</span>
                  <span className="truncate">Bác sĩ / Clinic Admin</span>
                </button>
              </div>
            </div>

            {/* Họ và tên */}
            <div className="rounded-2xl bg-white/[0.08] border border-emerald-400/20 px-4 py-2 backdrop-blur-md">
              <label className="block text-[11px] font-medium text-emerald-200/80 mb-0.5">
                Họ và tên *
              </label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-400/70 shrink-0" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder={regRole === 'CLINIC_ADMIN' ? 'Ví dụ: BS. Hoàng Hải Nam' : 'Ví dụ: Đinh Xuân Mạnh'}
                  className="w-full bg-transparent text-white text-sm placeholder-emerald-100/35 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Email */}
            <div 
              className={`rounded-2xl bg-white/[0.08] border px-4 py-2 backdrop-blur-md transition-all ${
                isUsernameFocused ? 'ring-2 ring-emerald-400/30 border-emerald-400/60 bg-white/[0.12]' : 'border-emerald-400/20'
              }`}
            >
              <label className="block text-[11px] font-medium text-emerald-200/80 mb-0.5">
                Email đăng nhập *
              </label>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400/70 shrink-0" />
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  onFocus={() => setIsUsernameFocused(true)}
                  onBlur={() => setIsUsernameFocused(false)}
                  placeholder="name@petcare.ai"
                  className="w-full bg-transparent text-white text-sm placeholder-emerald-100/35 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Sửa lỗi: Ô "Số điện thoại" type="tel" và placeholder="Ví dụ: 0987654321" */}
            <div className="rounded-2xl bg-white/[0.08] border border-emerald-400/20 px-4 py-2 backdrop-blur-md">
              <label className="block text-[11px] font-medium text-emerald-200/80 mb-0.5">
                Số điện thoại
              </label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400/70 shrink-0" />
                <input
                  id="reg-phone-input"
                  name="tel"
                  type="tel"
                  autoComplete="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="Ví dụ: 0987654321"
                  className="w-full bg-transparent text-white text-sm placeholder-emerald-100/35 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Mật khẩu */}
            <div 
              className={`rounded-2xl bg-white/[0.08] border px-4 py-2 backdrop-blur-md transition-all relative ${
                isPasswordFocused ? 'ring-2 ring-emerald-400/30 border-emerald-400/60 bg-white/[0.12]' : 'border-emerald-400/20'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-[11px] font-medium text-emerald-200/80">
                  Mật khẩu (tối thiểu 6 ký tự) *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-emerald-200/70 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5 text-emerald-300" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400/70 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-white text-sm placeholder-emerald-100/35 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Xác nhận mật khẩu */}
            <div className="rounded-2xl bg-white/[0.08] border border-emerald-400/20 px-4 py-2 backdrop-blur-md relative">
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-[11px] font-medium text-emerald-200/80">
                  Xác nhận mật khẩu *
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-emerald-200/70 hover:text-white cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5 text-emerald-300" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400/70 shrink-0" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-white text-sm placeholder-emerald-100/35 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* Nút Đăng Ký Tài Khoản */}
            <button
              type="submit"
              id="btn-register-submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer mt-3"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                  <span>Đăng Ký Tài Khoản {regRole === 'CLINIC_ADMIN' ? 'Bác Sĩ' : 'Chủ Nuôi'}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            {/* Dòng chuyển ngược lại Đăng nhập */}
            <div className="text-center pt-3">
              <p className="text-xs text-emerald-100/80">
                Đã có tài khoản?{' '}
                <button
                  type="button"
                  id="btn-switch-to-login"
                  onClick={() => {
                    sound?.playClick?.();
                    setIsRegisterMode(false);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-bold text-emerald-300 hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Đăng nhập ngay
                </button>
              </p>
            </div>

          </form>
        ) : (
          /* ============================================================ */
          /* CHẾ ĐỘ 1: ĐĂNG NHẬP (LOGIN FORM)                             */
          /* ============================================================ */
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Username / Email Input */}
            <div 
              className={`rounded-2xl bg-white/[0.08] border px-4 py-2.5 backdrop-blur-md transition-all duration-300 ${
                isUsernameFocused 
                  ? 'ring-2 ring-emerald-400/30 border-emerald-400/60 bg-white/[0.12] shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                  : 'border-emerald-400/20 hover:border-emerald-400/35'
              }`}
            >
              <label className="block text-[11px] font-medium text-emerald-200/80 tracking-wide mb-0.5">
                Email hoặc Tên đăng nhập
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsUsernameFocused(true)}
                onBlur={() => setIsUsernameFocused(false)}
                placeholder="name@example.com hoặc số điện thoại"
                className="w-full bg-transparent text-white text-sm placeholder-emerald-100/35 focus:outline-none font-medium"
                autoComplete="username"
              />
            </div>

            {/* Password Input */}
            <div 
              className={`rounded-2xl bg-white/[0.08] border px-4 py-2.5 backdrop-blur-md transition-all duration-300 relative ${
                isPasswordFocused 
                  ? 'ring-2 ring-emerald-400/30 border-emerald-400/60 bg-white/[0.12] shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                  : 'border-emerald-400/20 hover:border-emerald-400/35'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <label className="block text-[11px] font-medium text-emerald-200/80 tracking-wide">
                  Mật khẩu
                </label>
                <button
                  type="button"
                  onClick={() => {
                    sound?.playClick?.();
                    setShowPassword(!showPassword);
                  }}
                  className="text-emerald-200/70 hover:text-white transition-colors cursor-pointer p-0.5"
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-emerald-300 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                className="w-full bg-transparent text-white text-sm placeholder-emerald-100/35 focus:outline-none font-medium"
                autoComplete="current-password"
              />
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs pt-0.5 pb-1">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded-md bg-white/10 border border-emerald-400/30 text-emerald-500 focus:ring-0 focus:ring-offset-0 transition-colors cursor-pointer"
                />
                <span className="text-emerald-100/80 group-hover:text-white transition-colors">
                  Ghi nhớ đăng nhập
                </span>
              </label>

              <button
                type="button"
                onClick={() => {
                  sound?.playClick?.();
                  setMode('forgot');
                  setErrorMessage('');
                }}
                className="text-emerald-200/80 hover:text-white transition-colors cursor-pointer hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Nút Đăng Nhập Chính (Sign In) */}
            <button
              type="submit"
              id="btn-sign-in-submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-[0_4px_20px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 active:scale-98 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Đăng Nhập Vào Hệ Thống (Sign In)</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            {/* Social Divider */}
            <div className="text-center pt-1">
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-emerald-400/20" />
                </div>
                <div className="relative flex justify-center text-[11px] text-emerald-100/65">
                  <span className="bg-[#102B21]/90 px-2.5 rounded-full backdrop-blur-md border border-emerald-400/20">
                    hoặc tiếp tục với
                  </span>
                </div>
              </div>
            </div>

            {/* Social Logins: Google & Apple */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('Google')}
                className="py-2.5 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-emerald-400/20 hover:border-emerald-400/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] text-white text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('Apple')}
                className="py-2.5 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-emerald-400/20 hover:border-emerald-400/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] text-white text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
              >
                <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.88c.64-.78 1.08-1.86.96-2.95-1 .04-2.16.66-2.8 1.4-.56.65-.99 1.74-.86 2.8 1.11.09 2.06-.47 2.7-1.25z" />
                </svg>
                <span>Apple</span>
              </button>
            </div>

            {/* Bottom Create Account Switcher */}
            <div className="text-center pt-3">
              <p className="text-xs text-emerald-100/80">
                Chưa có tài khoản?{' '}
                <button
                  type="button"
                  id="btn-switch-to-register"
                  onClick={() => {
                    sound?.playClick?.();
                    setIsRegisterMode(true);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-bold text-emerald-300 hover:text-white hover:underline transition-colors cursor-pointer"
                >
                  Tạo tài khoản mới (Create account)
                </button>
              </p>
            </div>

          </form>
        )}

      </div>

      {/* Security Footer Notice */}
      <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-emerald-100/80 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
        <span>Bảo mật chuẩn y khoa • Hệ sinh thái PetCare PRO AI 2026</span>
      </div>

      {/* Chế độ Demo (Dành cho kiểm thử) */}
      <div className="text-center mt-6 relative z-20">
        <button 
          type="button" 
          onClick={() => {
            sound?.playClick?.();
            setShowDevAccounts(!showDevAccounts);
          }} 
          className="text-xs text-emerald-800/40 hover:text-emerald-800/80 dark:text-emerald-200/40 dark:hover:text-emerald-200/80 transition-colors cursor-pointer inline-flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-white/5"
        >
          <span>⚙️ Chế độ Demo (Dành cho kiểm thử)</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showDevAccounts ? 'rotate-180' : ''}`} />
        </button>

        {showDevAccounts && (
          <div className="mt-2.5 p-3 rounded-2xl bg-[#0f251d]/95 border border-emerald-400/30 backdrop-blur-xl shadow-2xl max-w-xs mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200 space-y-2">
            <p className="text-[10px] text-emerald-200/70 font-semibold uppercase tracking-wider">
              Chọn tài khoản demo nhanh:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-test-owner"
                onClick={() => handleQuickTestLogin('OWNER')}
                className="py-2 px-2.5 rounded-xl bg-white/[0.08] hover:bg-emerald-500/20 text-white text-xs font-bold border border-emerald-400/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>🐶</span>
                <span className="truncate">Chủ Nuôi</span>
              </button>
              <button
                type="button"
                id="btn-test-clinic-admin"
                onClick={() => handleQuickTestLogin('CLINIC_ADMIN')}
                className="py-2 px-2.5 rounded-xl bg-white/[0.08] hover:bg-teal-500/20 text-white text-xs font-bold border border-teal-400/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>🩺</span>
                <span className="truncate">Bác Sĩ Admin</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default LoginPage;
