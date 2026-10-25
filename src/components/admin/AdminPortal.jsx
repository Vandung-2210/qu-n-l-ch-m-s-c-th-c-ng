import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  HardDrive, 
  ShieldCheck, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  ExternalLink,
  ChevronRight,
  Shield,
  Activity
} from 'lucide-react';
import { AdminOverviewView } from './AdminOverviewView';
import { AdminAccountsView } from './AdminAccountsView';
import { AdminBackupView } from './AdminBackupView';
import { DayNightSwitch } from '../common/DayNightSwitch';
import { useTheme } from '../../context/ThemeContext';
import { sound } from '../../services/soundService';
import { AdminAuditLogsView } from './AdminAuditLogsView';
import { AdminAiDocsView } from './AdminAiDocsView';
import { VetAppointmentsAdminView } from '../booking/VetAppointmentsAdminView';
import { Calendar, Bot, FileText } from 'lucide-react';

export const AdminPortal = ({
  currentUser,
  users = [],
  usersLoading = false,
  usersError = null,
  onRetryLoadUsers = null,
  pets = [],
  schedules = [],
  appointments = [],
  onUpdateAppointment,
  onDeleteAppointment,
  onOpenCreateBooking,
  onLogout,
  onSwitchPortal,
  onUsersUpdated,
  onDataChanged
}) => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'accounts' | 'appointments' | 'docs' | 'audit' | 'backup'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, isDark, toggleTheme } = useTheme();

  const navItems = [
    {
      id: 'overview',
      label: 'Tổng quan hệ thống',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'accounts',
      label: 'Quản lý tài khoản',
      icon: Users,
      badge: null
    },
    {
      id: 'appointments',
      label: 'Lịch khám & Phân công',
      icon: Calendar,
      badge: (appointments || []).filter(a => a.status === 'Chờ duyệt' || a.status === 'pending').length || null
    },
    {
      id: 'docs',
      label: 'Tri thức AI & FAQ',
      icon: FileText,
      badge: null
    },
    {
      id: 'audit',
      label: 'Nhật ký kiểm toán',
      icon: Activity,
      badge: null
    },
    {
      id: 'backup',
      label: 'Sao lưu & Khôi phục',
      icon: HardDrive,
      badge: null
    }
  ];

  const handleNavClick = (tabId) => {
    sound?.playClick?.();
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`min-h-screen w-full flex flex-col bg-slate-50 dark:bg-[#0d0e17] text-slate-900 dark:text-slate-100 transition-colors`}>
      
      {/* ============================================================ */}
      {/* 1. TOP ADMIN HEADER BAR                                      */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-40 w-full px-4 sm:px-6 py-3 bg-white/85 dark:bg-[#151622]/90 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.08] shadow-sm flex items-center justify-between gap-4">
        
        {/* Left: Mobile Menu Button & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-2xl md:hidden text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/[0.06] transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                  PET_Ai Admin
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-400/30">
                  SYSTEM CORE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Hệ thống phân quyền & kiểm soát dữ liệu</p>
            </div>
          </div>
        </div>

        {/* Right: Switch Portal, Day/Night, Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Day/Night switch */}
          <DayNightSwitch
            isDark={isDark}
            onToggle={toggleTheme}
          />

          {/* Nút Xem thử Cổng Người Dùng */}
          <button
            onClick={() => {
              sound?.playClick?.();
              if (onSwitchPortal) onSwitchPortal('OWNER');
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.12] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            title="Chuyển sang xem thử giao diện Chủ Nuôi"
          >
            <span>Cổng Người Dùng</span>
            <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
          </button>

          {/* Admin Profile Info */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-white/10">
            <img 
              src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"} 
              alt="Admin Avatar"
              className="w-8 h-8 rounded-full object-cover border border-indigo-400/50 shadow-xs" 
            />
            <div className="text-left hidden lg:block leading-tight">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                {currentUser?.name || "Admin"}
              </p>
              <p className="text-[10px] text-indigo-500 font-semibold font-mono">
                {currentUser?.email || "admin@petcare.ai"}
              </p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Đăng xuất khỏi hệ thống"
            className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>

      </header>

      {/* ============================================================ */}
      {/* 2. BODY LAYOUT: DEDICATED SIDEBAR + MAIN WORKSPACE           */}
      {/* ============================================================ */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Desktop Admin Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 p-5 flex-col justify-between border-r border-slate-200/80 dark:border-white/[0.08] bg-white/60 dark:bg-[#12131f]/70 backdrop-blur-xl">
          <div className="space-y-1.5">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Menu Điều Hành
            </p>
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Card in Sidebar */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-white/[0.03] border border-indigo-100 dark:border-white/[0.06] text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
              <Shield className="w-3.5 h-3.5" />
              <span>Chế độ Quản Trị</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Bạn đang đăng nhập với vai trò Quản trị viên cấp cao nhất. Mọi thao tác có hiệu lực ngay lập tức.
            </p>
          </div>
        </aside>

        {/* Mobile Sidebar Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-72 bg-white dark:bg-[#151622] h-full p-5 flex flex-col justify-between border-r border-slate-200 dark:border-white/10 animate-in slide-in-from-left duration-200">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                  <span className="font-bold text-sm">Menu Quản Trị</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-lg">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <div className="space-y-1">
                  {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (onSwitchPortal) onSwitchPortal('OWNER');
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-center"
              >
                Cổng Người Dùng (Xem thử)
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <AdminOverviewView
                users={users}
                usersLoading={usersLoading}
                usersError={usersError}
                onRetry={onRetryLoadUsers}
                pets={pets}
                schedules={schedules}
                onNavigateTab={(tab) => {
                  sound?.playClick?.();
                  setActiveTab(tab);
                }}
              />
            )}

            {activeTab === 'accounts' && (
              <AdminAccountsView
                users={users}
                usersLoading={usersLoading}
                usersError={usersError}
                onRetry={onRetryLoadUsers}
                currentAdmin={currentUser}
                onUsersUpdated={onUsersUpdated}
              />
            )}

            {activeTab === 'appointments' && (
              <VetAppointmentsAdminView
                appointments={appointments}
                users={users}
                pets={pets}
                onUpdateAppointment={onUpdateAppointment}
                onDeleteAppointment={onDeleteAppointment}
                onOpenCreateBooking={onOpenCreateBooking}
              />
            )}

            {activeTab === 'docs' && (
              <AdminAiDocsView />
            )}

            {activeTab === 'audit' && (
              <AdminAuditLogsView currentAdmin={currentUser} />
            )}

            {activeTab === 'backup' && (
              <AdminBackupView
                currentAdmin={currentUser}
                onDataChanged={onDataChanged}
              />
            )}
          </div>
        </main>

      </div>

    </div>
  );
};
