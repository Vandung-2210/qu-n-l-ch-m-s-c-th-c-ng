import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, LogOut, KeyRound } from 'lucide-react';
import { completeFirstLoginPasswordChange } from '../../services/authService';
import { sound } from '../../services/soundService';

export function FirstLoginPasswordModal({
  currentUser,
  onSuccess,
  onLogout
}) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!newPassword || newPassword.length < 6) {
      sound?.playAlert?.();
      setErrorMessage('Mật khẩu mới phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      sound?.playAlert?.();
      setErrorMessage('Xác nhận mật khẩu không trùng khớp. Vui lòng kiểm tra lại!');
      return;
    }

    setIsLoading(true);
    try {
      await completeFirstLoginPasswordChange(currentUser?.id, newPassword);
      setIsLoading(false);
      setIsSuccess(true);
      sound?.playSuccess?.();

      setTimeout(() => {
        if (onSuccess) {
          onSuccess({ ...currentUser, mustChangePassword: false });
        }
      }, 700);
    } catch (err) {
      setIsLoading(false);
      sound?.playAlert?.();
      setErrorMessage(err.message || 'Không thể cập nhật mật khẩu. Vui lòng thử lại.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#121c17] text-slate-100 border border-emerald-500/30 rounded-3xl w-full max-w-md shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_40px_rgba(16,185,129,0.2)] overflow-hidden animate-in zoom-in-95 duration-200 relative p-6 sm:p-8">
        
        {/* Glow ambient background lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Icon & Header */}
        <div className="text-center relative z-10 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-500/30 mb-3 ring-4 ring-emerald-500/20">
            <KeyRound className="w-7 h-7 text-emerald-100" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[11px] font-bold mb-2">
            <span>⚠️ Yêu cầu đổi mật khẩu ở lần đăng nhập đầu tiên</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Thiết Lập Mật Khẩu Mới
          </h2>
          <p className="text-xs text-emerald-100/70 mt-1.5 max-w-sm mx-auto leading-relaxed">
            Xin chào <strong className="text-emerald-300">{currentUser?.name || 'Người dùng'}</strong>! Tài khoản của bạn đang dùng mật khẩu tạm thời do Quản trị viên cấp. Vui lòng đổi sang mật khẩu bảo mật mới để tiếp tục.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-shake backdrop-blur-md">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Success notification */}
        {isSuccess && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2.5 backdrop-blur-md">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="font-medium">Mật khẩu mới đã được cập nhật thành công! Đang chuyển hướng...</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          
          {/* Mật khẩu mới */}
          <div className="rounded-2xl bg-white/[0.06] border border-emerald-400/25 px-4 py-2.5 backdrop-blur-md focus-within:ring-2 focus-within:ring-emerald-400/40 focus-within:border-emerald-400 transition-all">
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-[11px] font-semibold text-emerald-200/90 tracking-wide">
                Mật khẩu mới (tối thiểu 6 ký tự) *
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-emerald-200/70 hover:text-white transition-colors cursor-pointer p-0.5"
                title={showPassword ? "Ẩn" : "Hiện"}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5 text-emerald-300" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400/70 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                disabled={isLoading || isSuccess}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
                className="w-full bg-transparent text-white text-sm placeholder-emerald-100/35 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Xác nhận mật khẩu mới */}
          <div className="rounded-2xl bg-white/[0.06] border border-emerald-400/25 px-4 py-2.5 backdrop-blur-md focus-within:ring-2 focus-within:ring-emerald-400/40 focus-within:border-emerald-400 transition-all">
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-[11px] font-semibold text-emerald-200/90 tracking-wide">
                Xác nhận mật khẩu mới *
              </label>
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="text-emerald-200/70 hover:text-white transition-colors cursor-pointer p-0.5"
                title={showConfirmPassword ? "Ẩn" : "Hiện"}
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5 text-emerald-300" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400/70 shrink-0" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                disabled={isLoading || isSuccess}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full bg-transparent text-white text-sm placeholder-emerald-100/35 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            id="btn-first-login-change-password-submit"
            disabled={isLoading || isSuccess}
            className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-white font-bold text-xs shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Lưu Mật Khẩu Mới & Tiếp Tục</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>

          {/* Safe exit: Logout */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                sound?.playClick?.();
                if (onLogout) onLogout();
              }}
              className="text-xs text-emerald-200/60 hover:text-rose-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất (Rời khỏi hệ thống)</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

export default FirstLoginPasswordModal;
