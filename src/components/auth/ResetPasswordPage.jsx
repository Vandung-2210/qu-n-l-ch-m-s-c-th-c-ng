import React, { useState, useEffect } from 'react';
import { 
  Lock, Eye, EyeOff, CheckCircle, AlertCircle, 
  ArrowRight, ArrowLeft, ShieldCheck, RefreshCw, Sparkles 
} from 'lucide-react';
import { ToothlessMascot } from './ToothlessMascot';
import { ForestBackgroundIllustration } from './ForestBackgroundIllustration';
import { FallingPawsBackground } from './FallingPawsBackground';
import { verifyResetToken, resetPassword } from '../../services/authService';
import { sound } from '../../services/soundService';

export function ResetPasswordPage({
  token: propToken,
  onBackToLogin,
  onRequestNewLink
}) {
  // Trích xuất token từ props hoặc URL params
  const [token, setToken] = useState(() => {
    if (propToken) return propToken;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || '';
    }
    return '';
  });

  // Trạng thái kiểm tra token
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [tokenUser, setTokenUser] = useState(null);

  // Form đặt mật khẩu mới
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Trạng thái submit & hoàn thành
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Tương tác biểu cảm linh vật Răng Sún (Toothless)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Kiểm tra tính hợp lệ của token ngay khi tải trang
  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!token) {
        if (isMounted) {
          setIsVerifying(false);
          setTokenValid(false);
          setTokenError('Không tìm thấy mã xác thực khôi phục trong liên kết. Vui lòng kiểm tra lại liên kết trong email.');
        }
        return;
      }

      setIsVerifying(true);
      setTokenError('');

      try {
        const result = await verifyResetToken(token);
        if (!isMounted) return;

        if (result.valid) {
          setTokenValid(true);
          setTokenUser(result.user || null);
        } else {
          setTokenValid(false);
          setTokenError(result.error || 'Liên kết khôi phục không hợp lệ hoặc đã hết hạn.');
        }
      } catch (err) {
        if (!isMounted) return;
        setTokenValid(false);
        setTokenError(err.message || 'Lỗi hệ thống khi xác thực liên kết.');
      } finally {
        if (isMounted) {
          setIsVerifying(false);
        }
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Xử lý gửi biểu mẫu đặt lại mật khẩu
  const handleResetSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải chứa ít nhất 6 ký tự.');
      sound?.playAlert?.();
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp. Vui lòng kiểm tra lại!');
      sound?.playAlert?.();
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, newPassword);
      setIsSubmitting(false);
      setIsSuccess(true);
      sound?.playSuccess?.();
    } catch (err) {
      setIsSubmitting(false);
      sound?.playAlert?.();
      setErrorMessage(err.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#184232] relative px-4 py-8 select-none overflow-x-hidden selection:bg-emerald-500 selection:text-white font-sans">
      
      {/* Nền phong cảnh thiên nhiên và lá rơi / dấu chân thú cưng */}
      <ForestBackgroundIllustration />
      <FallingPawsBackground />

      {/* Nút quay lại trang Đăng nhập ở góc trên */}
      <div className="w-full max-w-[440px] mb-3 flex items-center justify-start z-20">
        <button
          type="button"
          onClick={() => {
            sound?.playClick?.();
            if (onBackToLogin) onBackToLogin();
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-100 hover:text-white transition-colors group px-3.5 py-1.5 rounded-xl bg-[#102B21]/75 border border-emerald-400/25 hover:border-emerald-300/50 backdrop-blur-md cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Về trang Đăng nhập</span>
        </button>
      </div>

      {/* Linh vật Răng Sún Chibi (Toothless Mascot) tương tác */}
      <div className="w-full max-w-[440px] relative z-20 flex justify-center -mb-8 pointer-events-none">
        <ToothlessMascot
          isPasswordFocused={isPasswordFocused}
          showPassword={showPassword || showConfirmPassword}
          isUsernameFocused={false}
          usernameLength={0}
          isSubmitting={isSubmitting || isVerifying}
        />
      </div>

      {/* Hộp thoại Frosted Glass Card chính */}
      <div className="w-full max-w-[440px] rounded-3xl bg-[#102B21]/90 border border-emerald-400/30 backdrop-blur-xl shadow-2xl p-6 sm:p-7 relative z-10 transition-all duration-300">
        
        {/* ============================================================ */}
        {/* TRƯỜNG HỢP 1: ĐANG XÁC MINH TOKEN BAN ĐẦU                    */}
        {/* ============================================================ */}
        {isVerifying && (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto border border-emerald-400/30 animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Đang xác thực liên kết...</h3>
              <p className="text-xs text-emerald-200/70 mt-1">
                Vui lòng đợi trong giây lát, hệ thống đang kiểm tra tính an toàn của token khôi phục.
              </p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TRƯỜNG HỢP 2: TOKEN KHÔNG HỢP LỆ / HẾT HẠN / ĐÃ DÙNG        */}
        {/* ============================================================ */}
        {!isVerifying && !tokenValid && !isSuccess && (
          <div className="text-center py-5 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-300 flex items-center justify-center mx-auto border border-rose-400/30 ring-4 ring-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
              <AlertCircle className="w-7 h-7 text-rose-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Liên kết không hợp lệ hoặc đã hết hạn</h3>
              <p className="text-xs text-rose-200/90 mt-2 leading-relaxed max-w-xs mx-auto">
                {tokenError || 'Liên kết khôi phục mật khẩu đã hết hạn (quá 15 phút), đã được sử dụng hoặc bị thay thế bởi yêu cầu mới hơn.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                id="btn-request-new-reset-link"
                onClick={() => {
                  sound?.playClick?.();
                  if (onRequestNewLink) {
                    onRequestNewLink();
                  } else if (onBackToLogin) {
                    onBackToLogin();
                  }
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Yêu Cầu Liên Kết Mới</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound?.playClick?.();
                  if (onBackToLogin) onBackToLogin();
                }}
                className="text-xs text-emerald-200/80 hover:text-white transition-colors cursor-pointer py-1"
              >
                Quay lại trang Đăng nhập
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TRƯỜNG HỢP 3: ĐẶT LẠI MẬT KHẨU THÀNH CÔNG                    */}
        {/* ============================================================ */}
        {isSuccess && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto border border-emerald-400/40 ring-4 ring-emerald-500/15 shadow-[0_0_25px_rgba(16,185,129,0.35)]">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Mật khẩu đã được đặt lại thành công!</h3>
              <p className="text-xs text-emerald-100/90 mt-2 leading-relaxed max-w-xs mx-auto">
                Mật khẩu mới của bạn đã có hiệu lực ngay bây giờ. Mật khẩu cũ và các phiên đăng nhập trước đó đã được vô hiệu hóa để bảo đảm an toàn.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-[11px] text-emerald-200/90 text-left">
              🔒 Hệ thống không tự động đăng nhập. Vui lòng bấm nút bên dưới để đăng nhập bằng mật khẩu mới của bạn.
            </div>

            <button
              type="button"
              id="btn-back-to-login-after-reset"
              onClick={() => {
                sound?.playSuccess?.();
                if (onBackToLogin) onBackToLogin();
              }}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-98"
            >
              <span>Quay Lại Đăng Nhập Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ============================================================ */}
        {/* TRƯỜNG HỢP 4: TOKEN HỢP LỆ - FORM ĐẶT MẬT KHẨU MỚI           */}
        {/* ============================================================ */}
        {!isVerifying && tokenValid && !isSuccess && (
          <div>
            {/* Header thông tin form */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-semibold mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Khôi Phục Mật Khẩu An Toàn</span>
              </div>
              <h2 className="text-lg font-bold text-white">Thiết Lập Mật Khẩu Mới</h2>
              <p className="text-xs text-emerald-100/70 mt-1">
                {tokenUser?.email ? (
                  <>Dành cho tài khoản: <strong className="text-emerald-300 font-semibold">{tokenUser.email}</strong></>
                ) : (
                  'Nhập mật khẩu mới an toàn cho tài khoản của bạn.'
                )}
              </p>
            </div>

            {/* Thông báo lỗi khi submit */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              
              {/* Ô nhập mật khẩu mới */}
              <div className="rounded-2xl bg-white/[0.08] border border-emerald-400/25 px-4 py-2.5 backdrop-blur-md focus-within:border-emerald-400 focus-within:bg-white/[0.12] transition-all">
                <label className="block text-[11px] font-medium text-emerald-200/90 mb-1">
                  Mật khẩu mới
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-emerald-300/80 mr-2.5 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="input-new-password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full bg-transparent text-white text-sm placeholder-emerald-100/35 focus:outline-none font-medium pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      sound?.playClick?.();
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-0 text-emerald-200/70 hover:text-white transition-colors cursor-pointer p-1"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Ô xác nhận mật khẩu mới */}
              <div className="rounded-2xl bg-white/[0.08] border border-emerald-400/25 px-4 py-2.5 backdrop-blur-md focus-within:border-emerald-400 focus-within:bg-white/[0.12] transition-all">
                <label className="block text-[11px] font-medium text-emerald-200/90 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-emerald-300/80 mr-2.5 shrink-0" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="input-confirm-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full bg-transparent text-white text-sm placeholder-emerald-100/35 focus:outline-none font-medium pr-8"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      sound?.playClick?.();
                      setShowConfirmPassword(!showConfirmPassword);
                    }}
                    className="absolute right-0 text-emerald-200/70 hover:text-white transition-colors cursor-pointer p-1"
                    title={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Hướng dẫn quy tắc mật khẩu */}
              <div className="text-[11px] text-emerald-200/70 space-y-1 px-1">
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-emerald-400' : 'bg-white/30'}`} />
                  <span>Độ dài tối thiểu 6 ký tự</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${newPassword && confirmPassword && newPassword === confirmPassword ? 'bg-emerald-400' : 'bg-white/30'}`} />
                  <span>Mật khẩu xác nhận trùng khớp</span>
                </div>
              </div>

              {/* Nút bấm Đặt lại mật khẩu */}
              <button
                type="submit"
                id="btn-submit-reset-password"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-60 text-white font-bold text-xs shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Đang cập nhật mật khẩu...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-200" />
                    <span>Đặt Lại Mật Khẩu</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>

              {/* Nút quay lại đăng nhập */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    sound?.playClick?.();
                    if (onBackToLogin) onBackToLogin();
                  }}
                  className="text-xs text-emerald-200/80 hover:text-white transition-colors cursor-pointer"
                >
                  ← Quay lại Đăng nhập
                </button>
              </div>

            </form>
          </div>
        )}

      </div>

      {/* Security Footer Notice */}
      <div className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-emerald-100/80 font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
        <span>Mã hóa PBKDF2 SHA-512 • Bảo mật hệ sinh thái PetCare PRO AI 2026</span>
      </div>

    </div>
  );
}

export default ResetPasswordPage;
