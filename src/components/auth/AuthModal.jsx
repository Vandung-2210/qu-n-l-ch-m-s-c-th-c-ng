import React, { useState } from 'react';
import { 
  X, Mail, Lock, User, Phone, CheckCircle, 
  AlertCircle, Sparkles, ArrowRight, ShieldCheck, 
  Eye, EyeOff, Stethoscope, HeartHandshake 
} from 'lucide-react';
import { login, register, loginWithSocial } from '../../services/authService';
import { sound } from '../../services/soundService';

export function AuthModal({ isOpen, onClose, onAuthSuccess, onSuccess, initialMode = 'login' }) {
  const handleSuccess = onAuthSuccess || onSuccess;
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showDevAccounts, setShowDevAccounts] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('pet_owner'); // 'pet_owner' | 'vet_doctor'

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      try {
        const user = login(email, password, rememberMe);
        localStorage.setItem('petcare_current_user', JSON.stringify(user));
        localStorage.setItem('petcare_is_authenticated', 'true');
        setIsLoading(false);
        if (handleSuccess) handleSuccess(user);
        onClose();
      } catch (err) {
        setIsLoading(false);
        sound.playAlert();
        setErrorMessage(err.message || 'Đăng nhập không thành công');
      }
    }, 300);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (regPassword.length < 6) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      try {
        const user = register({
          name: regName,
          email: regEmail,
          password: regPassword,
          phone: regPhone,
          role: regRole
        });
        localStorage.setItem('petcare_current_user', JSON.stringify(user));
        localStorage.setItem('petcare_is_authenticated', 'true');
        setIsLoading(false);
        if (handleSuccess) handleSuccess(user);
        onClose();
      } catch (err) {
        setIsLoading(false);
        sound.playAlert();
        setErrorMessage(err.message || 'Đăng ký không thành công');
      }
    }, 350);
  };

  const handleSocialLogin = (provider) => {
    sound.playClick();
    setIsLoading(true);
    setTimeout(() => {
      const user = loginWithSocial(provider);
      localStorage.setItem('petcare_current_user', JSON.stringify(user));
      localStorage.setItem('petcare_is_authenticated', 'true');
      setIsLoading(false);
      if (handleSuccess) handleSuccess(user);
      onClose();
    }, 300);
  };

  const handleQuickDemoLogin = () => {
    setEmail('demo@petcare.ai');
    setPassword('123456');
    setIsLoading(true);
    setTimeout(() => {
      const user = {
        name: 'Đinh Xuân Mạnh',
        email: 'demo@petcare.ai',
        role: 'OWNER',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'
      };
      localStorage.setItem('petcare_current_user', JSON.stringify(user));
      localStorage.setItem('petcare_is_authenticated', 'true');
      setIsLoading(false);
      if (handleSuccess) handleSuccess(user);
      onClose();
    }, 200);
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    setForgotSent(true);
    sound.playSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0B132B] text-slate-100 border border-slate-800/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
        
        {/* Glow ambient background lights */}
        <div className="absolute top-0 left-1/4 -translate-y-1/2 w-64 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-64 h-32 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-800/60 relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-white">PetCare</span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  PRO AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Hệ sinh thái thông minh cho thú cưng</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Login / Register) */}
        {mode !== 'forgot' && (
          <div className="p-2 mx-6 mt-5 bg-slate-900/90 rounded-2xl border border-slate-800 grid grid-cols-2 gap-1 relative z-10 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMessage(''); }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMessage(''); }}
              className={`py-2 rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đăng Ký Tài Khoản
            </button>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 relative z-10 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* FORM BODY */}
        <div className="p-6 relative z-10 space-y-4">
          
          {/* --- TAB 1: LOGIN --- */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email tài khoản:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com hoặc số điện thoại"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mật khẩu:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setMode('forgot'); setForgotSent(false); setErrorMessage(''); }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  Quên mật khẩu?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                <span>{isLoading ? 'Đang xác thực...' : 'Đăng Nhập Ngay'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Chế độ Demo (Dành cho kiểm thử) */}
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => setShowDevAccounts(!showDevAccounts)}
                  className="text-xs text-emerald-800/40 hover:text-emerald-800/80 transition-colors cursor-pointer"
                >
                  ⚙️ Chế độ Demo (Dành cho kiểm thử)
                </button>
                {showDevAccounts && (
                  <div className="mt-2 p-2 rounded-xl bg-slate-900 border border-emerald-500/20 text-center animate-in fade-in">
                    <button
                      type="button"
                      onClick={handleQuickDemoLogin}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
                    >
                      🐶 Đăng nhập nhanh tài khoản Demo
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}

          {/* --- TAB 2: REGISTER --- */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Họ và tên của bạn:
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Địa chỉ Email:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full pl-10 pr-4 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Số điện thoại:
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="09..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bạn là:
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="pet_owner">🐾 Chủ nuôi</option>
                    <option value="vet_doctor">🩺 Bác sĩ thú y</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tạo Mật khẩu (tối thiểu 6 ký tự):
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60"
              >
                <span>{isLoading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản Mới'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* --- TAB 3: FORGOT PASSWORD --- */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Nhập email đã đăng ký. Hệ thống sẽ gửi mã xác thực khôi phục mật khẩu trong 30 giây.
              </div>

              {forgotSent ? (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="font-bold">Đã gửi hướng dẫn khôi phục!</p>
                  <p className="text-[11px] text-slate-400">Vui lòng kiểm tra hộp thư đến của <strong>{forgotEmail}</strong>.</p>
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="mt-2 text-emerald-400 font-bold underline"
                  >
                    Quay lại Đăng nhập
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-3">
                  <div>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Email cần khôi phục..."
                      className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('login')}
                      className="flex-1 py-2 rounded-xl bg-slate-900 text-slate-400 text-xs font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md"
                    >
                      Gửi mã khôi phục
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Social Logins Divider */}
          {mode !== 'forgot' && (
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[11px] text-slate-500 font-medium">Hoặc đăng nhập nhanh bằng</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Social Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-all hover:border-slate-700"
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
                  onClick={() => handleSocialLogin('apple')}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-all hover:border-slate-700"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.65-.8 1.1-1.92.98-3.04-1 .04-2.17.67-2.85 1.47-.6.69-1.12 1.81-.98 2.91 1.12.09 2.22-.56 2.85-1.34z" />
                  </svg>
                  <span>Apple ID</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Security Notice */}
        <div className="p-3.5 bg-slate-950/80 border-t border-slate-800/60 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bảo mật 2 lớp SSL 256-bit • Dữ liệu mã hóa cục bộ</span>
        </div>

      </div>
    </div>
  );
}

export default AuthModal;
