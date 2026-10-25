import React, { useState } from 'react';
import { 
  Sparkles, 
  CalendarPlus, 
  Settings, 
  Menu, 
  Bell, 
  Search, 
  Moon, 
  Sun, 
  User, 
  LogOut, 
  ChevronDown, 
  ShieldCheck,
  PawPrint,
  Command,
  HeartHandshake,
  Stethoscope,
  Users,
  FileText,
  Plus
} from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { DayNightSwitch } from '../common/DayNightSwitch';
import { sound } from '../../services/soundService';
import { getTodayVnDate, getVnDateString } from '../../utils/dateUtils.js';
import { useCurrentVnDate } from '../../hooks/useCurrentVnDate';

export const Navbar = ({ 
  pets = [], 
  schedules = [],
  selectedPetId, 
  onSelectPet, 
  onOpenAddSchedule, 
  onOpenVetBooking,
  onOpenSettings,
  onOpenFamilyModal,
  onOpenGlobalSearch,
  onToggleMobileMenu,
  activeTab,
  setActiveTab,
  theme,
  onToggleTheme,
  onToggleComplete,
  currentUser,
  onOpenAuthModal,
  onOpenProfileModal,
  onLogout,
  currentPortal,
  setCurrentPortal,
  onSwitchPortal,
  onExportPdf
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    try { sound?.playClick?.(); } catch {}
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('petcare_active_user');
      localStorage.removeItem('petcare_current_user');
      localStorage.removeItem('petcare_is_authenticated');
      localStorage.removeItem('petcare_current_portal');
      localStorage.removeItem('petcare_token');
      localStorage.removeItem('petcare_auth_token');
      window.location.reload();
    }
  };

  const handleExportPdf = () => {
    try { sound?.playSuccess?.(); } catch {}
    if (onExportPdf) {
      onExportPdf();
    } else {
      window.dispatchEvent(new CustomEvent('petcare_export_wsava_pdf'));
    }
  };

  const todayStr = useCurrentVnDate();
  const urgentCount = schedules.filter(s => s && s.date && (getVnDateString(s.date) <= todayStr) && !s.completed).length;

  const quickTabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'schedule', label: 'Lịch Trình' },
    { id: 'bonding', label: 'Gắn Kết' },
    { id: 'medical', label: 'Y Tế & Sổ Tiêm' },
    { id: 'expenses', label: 'Chi Tiêu' }
  ];

  return (
    <header className="shrink-0 z-40 relative w-full pt-3 px-3 sm:px-6 pb-2">
      {/* Obsidian Spatial Canvas Pill-shaped Floating Navigation Bar */}
      <div className="w-full max-w-7xl mx-auto rounded-full bg-white/85 dark:bg-[#151622]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-2xl px-3 sm:px-5 py-2 flex items-center justify-between gap-3 relative hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-all duration-300">
        
        {/* ============================================================ */}
        {/* 1. LEFT: PILL SWITCHERS                                      */}
        {/* ============================================================ */}
        <div className="flex items-center gap-2">
          {/* Mobile Hamburger Button */}
          <button
            onClick={onToggleMobileMenu}
            className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] md:hidden transition-colors cursor-pointer"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mini Brand Icon for Mobile */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="w-8 h-8 rounded-full bg-indigo-600 text-white flex md:hidden items-center justify-center cursor-pointer shadow-md shadow-indigo-500/30 font-bold"
          >
            <HeartHandshake className="w-4 h-4" />
          </div>

          {/* Desktop Quick Tab Switchers (Pills) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-[#1b1c2a] p-1 rounded-full border border-slate-200/80 dark:border-white/[0.06] shadow-inner">
            {quickTabs.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.playClick();
                    setActiveTab(tab.id);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/30 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ============================================================ */}
        {/* 2. CENTER: CMD+K SYSTEM COMMAND SEARCH BAR                    */}
        {/* ============================================================ */}
        <div className="flex-1 max-w-xs md:max-w-md mx-2">
          <button
            type="button"
            onClick={onOpenGlobalSearch}
            className="w-full flex items-center justify-between bg-white/75 dark:bg-[#1b1c2a] border border-slate-200 dark:border-white/10 rounded-full px-4 py-2 text-xs text-slate-500 dark:text-slate-400 w-80 max-w-full hover:border-indigo-400 dark:hover:border-indigo-500/40 transition-colors cursor-pointer group shadow-inner"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
              <span className="truncate">Search or type command... ⌘K</span>
            </div>

            <div className="flex items-center gap-1">
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#25273c] text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 group-hover:border-indigo-400/40">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </div>
          </button>
        </div>

        {/* ============================================================ */}
        {/* 3. RIGHT: DAY/NIGHT, NOTIFS, EXPORT PDF, VET BOOKING, PROFILE*/}
        {/* ============================================================ */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Animated Day/Night Toggle (Pill Sky Switch) */}
          <DayNightSwitch
            isDark={theme === 'dark'}
            onToggle={onToggleTheme}
          />

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                sound.playPop();
                setIsNotifOpen(!isNotifOpen);
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors relative cursor-pointer"
              title="Thông báo"
            >
              <Bell className="w-4 h-4" />
              {urgentCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
              {urgentCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>

            {isNotifOpen && (
              <NotificationDropdown
                schedules={schedules}
                pets={pets}
                onClose={() => setIsNotifOpen(false)}
                onToggleComplete={onToggleComplete}
              />
            )}
          </div>

          {/* Nút [ 📄 Xuất PDF Sổ ] */}
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
            title="Xuất Hộ chiếu & Sổ tiêm PDF chuẩn WSAVA"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span className="hidden sm:inline">Xuất PDF Sổ</span>
            <span className="sm:hidden text-[11px] font-bold">PDF Sổ</span>
          </button>

          {/* Nút [ ＋ Đặt Lịch Khám ] */}
          <button
            onClick={onOpenVetBooking || onOpenAddSchedule}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 transition-all cursor-pointer group"
            title="Đặt lịch khám thú y 2 chiều hoặc lên lịch"
          >
            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
            <span className="hidden sm:inline">Đặt Lịch Khám</span>
            <span className="sm:hidden">Đặt Lịch</span>
          </button>

          {/* Cụm thông tin tài khoản chủ nuôi & Avatar & Đăng xuất */}
          <div className="flex items-center gap-2 sm:gap-3 relative">
            {/* Thông tin tài khoản */}
            <div className="flex flex-col text-right hidden lg:flex">
              <span className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">
                {currentUser?.name || "Người dùng"}
              </span>
              <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                {currentUser?.role === 'system_admin'
                  ? '🛡️ Quản trị viên'
                  : (currentUser?.role === 'vet_doctor' || currentUser?.role === 'CLINIC_ADMIN')
                  ? '🩺 Bác sĩ thú y'
                  : '🐾 Chủ nuôi'}
              </span>
            </div>

            {/* Avatar */}
            <img 
              src={currentUser?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150"} 
              alt="Avatar" 
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="w-8 h-8 rounded-full border border-indigo-500/40 object-cover shadow-sm cursor-pointer hover:border-indigo-400 transition-all"
              title="Menu tài khoản"
            />

            {/* Nút Đăng xuất */}
            <button 
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all cursor-pointer hidden sm:block"
            >
              <LogOut size={16}/>
            </button>

            {/* Menu Dropdown khi bấm vào Avatar */}
            {isUserMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsUserMenuOpen(false)} 
                />
                <div className="absolute right-0 top-11 w-64 rounded-2xl bg-white/95 dark:bg-[#1c1d2e] border border-slate-200 dark:border-white/10 shadow-[0_16px_36px_rgba(0,0,0,0.2)] dark:shadow-[0_16px_36px_rgba(0,0,0,0.4)] p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                  {/* Tên & Email */}
                  <div className="px-3 py-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {currentUser?.name || "Người dùng"}{' '}
                      <span className="text-xs font-normal text-indigo-600 dark:text-indigo-400">
                        ({currentUser?.role === 'system_admin' ? 'Quản trị viên' : (currentUser?.role === 'vet_doctor' || currentUser?.role === 'CLINIC_ADMIN') ? 'Bác sĩ' : 'Chủ nuôi'})
                      </span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                      {currentUser?.email || "demo@petcare.ai"}
                    </p>
                  </div>

                  {/* Vạch ngăn cách */}
                  <div className="h-px bg-slate-200 dark:bg-white/10 my-1.5" />

                  {/* Hồ sơ cá nhân */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      if (onOpenProfileModal) onOpenProfileModal('profile');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2 cursor-pointer mb-1"
                  >
                    <User className="w-4 h-4 text-indigo-400" />
                    <span>Hồ sơ cá nhân</span>
                  </button>

                  {/* Nút quay lại Cổng Admin (Chỉ hiển thị cho system_admin) */}
                  {currentUser?.role === 'system_admin' && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        try { sound?.playClick?.(); } catch {}
                        if (typeof onSwitchPortal === 'function') {
                          onSwitchPortal('ADMIN');
                        } else if (typeof setCurrentPortal === 'function') {
                          setCurrentPortal('ADMIN');
                        }
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all flex items-center gap-2 cursor-pointer group active:scale-[0.98] mb-1"
                    >
                      <span className="text-base group-hover:rotate-12 transition-transform">🛡️</span>
                      <span className="truncate">Cổng Quản Trị Hệ Thống</span>
                    </button>
                  )}

                  {/* Nút chuyển cổng Bác Sĩ (Chỉ cho bác sĩ đã duyệt hoặc clinic admin) */}
                  {(currentUser?.role === 'CLINIC_ADMIN' || (currentUser?.role === 'vet_doctor' && currentUser?.vetStatus === 'approved')) && (
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        try { sound?.playClick?.(); } catch {}
                        if (typeof onSwitchPortal === 'function') {
                          onSwitchPortal('CLINIC');
                        } else if (typeof setCurrentPortal === 'function') {
                          setCurrentPortal('CLINIC');
                        }
                      }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 transition-all flex items-center gap-2 cursor-pointer group active:scale-[0.98] mb-1"
                    >
                      <span className="text-base group-hover:rotate-12 transition-transform">🩺</span>
                      <span className="truncate">Cổng Bệnh Viện Thú Y</span>
                    </button>
                  )}

                  {/* Vạch ngăn cách */}
                  <div className="h-px bg-white/10 my-1.5" />

                  {/* Nút Đăng xuất */}
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>🚪 Đăng xuất</span>
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};

export default Navbar;
