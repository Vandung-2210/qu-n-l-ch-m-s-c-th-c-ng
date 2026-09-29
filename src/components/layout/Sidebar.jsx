import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  PawPrint, 
  CalendarDays, 
  Stethoscope, 
  Building2,
  Scan, 
  User, 
  MoreHorizontal, 
  X, 
  Sparkles, 
  HeartHandshake, 
  PhoneCall, 
  Users, 
  DollarSign, 
  Flame, 
  Utensils 
} from 'lucide-react';
import { sound } from '../../services/soundService';

export const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isMobileOpen, 
  setIsMobileOpen,
  overdueCount = 0,
  todayCount = 0,
  pendingAppointmentsCount = 0,
  currentUser = null,
  onOpenProfileModal = () => {}
}) => {
  // Core icons required by Obsidian Spatial Canvas specification:
  // Dashboard, Lịch trình, Hồ sơ Thú cưng, Sổ Tiêm Vắc-xin, Chi tiêu, AI Vision Chẩn đoán, Avatar chủ nuôi ở đáy
  const primaryNavItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: todayCount > 0 ? todayCount : null
    },
    {
      id: 'schedule',
      label: 'Lịch trình',
      icon: CalendarDays,
      badge: overdueCount > 0 ? overdueCount : null
    },
    {
      id: 'pets',
      label: 'Hồ sơ Thú cưng',
      icon: PawPrint
    },
    {
      id: 'medical',
      label: 'Sổ Tiêm Vắc-xin',
      icon: Stethoscope,
      badge: pendingAppointmentsCount > 0 ? pendingAppointmentsCount : null
    },
    {
      id: 'expenses',
      label: 'Chi tiêu',
      icon: DollarSign
    },
    {
      id: 'ai-vision',
      label: 'AI Vision Chẩn đoán',
      icon: Scan
    },
    ...(currentUser?.role === 'CLINIC_ADMIN' ? [{
      id: 'clinic-os',
      label: 'Bệnh viện Thú y (Clinic OS)',
      icon: Building2,
      badge: 'PRO'
    }] : [])
  ];

  // Secondary items accessible on mobile
  const secondaryNavItems = [
    { id: 'ai-nutrition', label: 'Dinh dưỡng AI', icon: Utensils },
    { id: 'services', label: 'Cấp cứu & Dịch vụ 24/7', icon: PhoneCall, highlight: true }
  ];

  const handleNavClick = (id) => {
    sound.playClick();
    setActiveTab(id);
  };

  return (
    <>
      {/* ============================================================ */}
      {/* A. CURVED GLOW SIDEBAR (OBSIDIAN SPATIAL CANVAS DOCK)        */}
      {/* ============================================================ */}
      <aside 
        className="fixed left-5 top-1/2 -translate-y-1/2 z-50 hidden md:flex w-[72px] py-4 rounded-[28px] bg-white/85 dark:bg-[#151622]/95 backdrop-blur-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_0_35px_rgba(99,102,241,0.18)] flex-col items-center gap-2.5 select-none transition-all duration-300 hover:border-indigo-400 dark:hover:border-indigo-500/40"
        aria-label="Obsidian Spatial Curved Glow Dock"
      >
        {/* Subtle Ambient Violet Edge Glow */}
        <div className="absolute inset-0 rounded-[28px] bg-gradient-to-b from-indigo-500/5 dark:from-indigo-500/10 via-transparent to-violet-500/5 dark:to-violet-500/10 pointer-events-none" />

        {/* 1. Core Navigation Icons */}
        <div className="flex flex-col items-center gap-2 relative z-10">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="relative group flex items-center justify-center">
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 relative cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/40 font-bold scale-105'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/[0.06] hover:scale-105'
                  }`}
                  aria-label={item.label}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white stroke-[2.2]' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                  }`} />

                  {/* Luminescent indicator dot on active */}
                  {isActive && (
                    <span className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-3.5 bg-indigo-400 rounded-full shadow-[0_0_10px_rgba(129,140,248,0.9)]" />
                  )}

                  {/* Badge Notification */}
                  {item.badge && !isActive && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 ring-2 ring-white dark:ring-[#151622] animate-pulse" />
                  )}
                </button>

                {/* Tooltip phong cách Obsidian Glassmorphism */}
                <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-[#1c1d2e] border border-slate-800 dark:border-white/10 text-white text-xs font-semibold shadow-2xl backdrop-blur-md pointer-events-none opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 flex items-center gap-1.5">
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. Subtle Divider */}
        <div className="w-8 h-[1px] bg-slate-200 dark:bg-white/10 my-1" />

        {/* 3. Avatar người dùng ở đáy dock */}
        <div className="relative group flex items-center justify-center relative z-10">
          <button
            onClick={() => {
              sound.playClick();
              onOpenProfileModal('profile');
            }}
            className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-slate-300/80 dark:border-white/20 hover:border-indigo-400 transition-all duration-200 cursor-pointer relative shadow-sm group-hover:scale-105 active:scale-95 flex items-center justify-center bg-slate-100 dark:bg-[#202234]"
            title="Tài khoản chủ nuôi"
            aria-label="Tài khoản chủ nuôi"
          >
            {currentUser?.avatar ? (
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name || 'User'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-slate-300" />
            )}

            {/* Online Indicator Dot */}
            <span className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#151622]" />
          </button>

          {/* Tooltip Avatar */}
          <div className="absolute left-full ml-3.5 px-3 py-1.5 rounded-xl bg-[#1c1d2e] border border-white/10 text-white text-xs font-semibold shadow-2xl backdrop-blur-md pointer-events-none opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap z-50 flex items-center gap-1.5">
            <span>{currentUser?.name || 'Mạnh Đinh 🐾'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
        </div>

      </aside>

      {/* ============================================================ */}
      {/* MOBILE DRAWER / BOTTOM DOCK (Responsive fallback < md)       */}
      {/* ============================================================ */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden flex items-end sm:items-center justify-center p-4"
          onClick={() => setIsMobileOpen(false)}
        >
          <div 
            className="w-full max-w-sm rounded-3xl bg-slate-950/95 border border-white/20 p-5 shadow-2xl backdrop-blur-3xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <span className="font-extrabold text-white text-sm">PetCare PRO • VisionOS</span>
              </div>
              <button
                onClick={() => setIsMobileOpen(false)}
                className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[...primaryNavItems, ...secondaryNavItems].map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      handleNavClick(item.id);
                      setIsMobileOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                        : 'text-white/70 hover:bg-white/5 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
