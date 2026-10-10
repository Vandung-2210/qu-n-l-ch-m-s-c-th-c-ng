import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { PetListView } from './components/pets/PetListView';
import { PetFormModal } from './components/pets/PetFormModal';
import { PetDetailModal } from './components/pets/PetDetailModal';
import { ScheduleView } from './components/schedule/ScheduleView';
import { ScheduleFormModal } from './components/schedule/ScheduleFormModal';
import { AiScheduleModal } from './components/schedule/AiScheduleModal';
import { AiChatView } from './components/ai/AiChatView';
import { AiNutritionView } from './components/ai/AiNutritionView';
import { AiVisionScannerView } from './components/ai/AiVisionScannerView';
import { ExpenseView } from './components/expenses/ExpenseView';
import { DailyActivityView } from './components/daily/DailyActivityView';
import DailyStreakChecklist from './components/daily/DailyStreakChecklist';
import PetBondingView from './components/bonding/PetBondingView';
import FamilyManagementView from './components/family/FamilyManagementView';
import PetSitterModeModal from './components/family/PetSitterModeModal';
import PublicPetQrModal from './components/pets/PublicPetQrModal';
import LostModeManagerModal from './components/pets/LostModeManagerModal';
import MissingPetPosterModal from './components/pets/MissingPetPosterModal';
import OmniChannelAlertModal from './components/schedule/OmniChannelAlertModal';
import AiMedicalOcrModal from './components/ai/AiMedicalOcrModal';
import { PrescriptionsView } from './components/medical/PrescriptionsView';
import { MedicalRecordsView } from './components/medical/MedicalRecordsView';
import { WsavaPassportModal } from './components/medical/WsavaPassportModal';
import { PetServicesView } from './components/services/PetServicesView';
import { VetBookingModal } from './components/booking/VetBookingModal';
import { VetAppointmentsAdminView } from './components/booking/VetAppointmentsAdminView';
import { ClinicWorkspaceView, ClinicOsView } from './components/clinic/ClinicWorkspaceView';
import { AdminPortal } from './components/admin/AdminPortal';
import { SettingsModal } from './components/settings/SettingsModal';
import { FamilyGroupSettingsModal } from './components/family/FamilyGroupSettingsModal';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { LoginPage } from './components/auth/LoginPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { FirstLoginPasswordModal } from './components/auth/FirstLoginPasswordModal';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { AuraBackground } from './components/common/AuraBackground';
import { useTheme } from './context/ThemeContext';
import { ROLES, getCurrentUser, getUsers, syncUsersWithBackend, logout as authLogout } from './services/authService';
import { sound } from './services/soundService';
import { Sparkles, Bot, Stethoscope, ShieldAlert, HeartPulse, Calendar, ArrowRight, PhoneCall, Sun, Moon } from 'lucide-react';

import { 
  getPets, 
  getSchedules, 
  addPet, 
  updatePet, 
  deletePet, 
  addSchedule, 
  updateSchedule, 
  deleteSchedule, 
  toggleScheduleComplete,
  addBatchSchedules,
  getExpenses,
  addExpense,
  deleteExpense,
  getDailyLogs,
  addDailyLog,
  getPrescriptions,
  addPrescription,
  deletePrescription,
  getFamilyMembers,
  addFamilyMember,
  deleteFamilyMember,
  getDailyHabits,
  toggleDailyHabit,
  addDailyHabit,
  deleteDailyHabit,
  updatePetLostMode,
  applyOcrAutoPipeline,
  getTheme,
  setTheme,
  getAppointments,
  addAppointment,
  updateAppointment,
  deleteAppointment
} from './services/storageService';

export default function App() {
  // 1. Authentication State with RBAC (Role-Based Access Control)
  // Xác minh phiên làm việc ngay khi khởi tạo; nếu phiên không hợp lệ hoặc tài khoản bị xóa, tự động thu hồi
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return getCurrentUser();
    } catch { 
      return null; 
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return Boolean(getCurrentUser());
    } catch {
      return false;
    }
  });

  // 2. Data States
  const [pets, setPets] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [dailyHabits, setDailyHabits] = useState([]);
  const { theme, isDark, toggleTheme, setTheme: setContextTheme } = useTheme();
  const [appointments, setAppointments] = useState(() => getAppointments());
  const [isVetBookingModalOpen, setIsVetBookingModalOpen] = useState(false);
  const [vetBookingInitialData, setVetBookingInitialData] = useState({});

  // Danh sách tài khoản hệ thống tập trung (đồng bộ với Backend & Local)
  const [systemUsers, setSystemUsers] = useState(() => getUsers());

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState('profile');

  // Route state supporting standalone /login page and /reset-password with strict Auth Guard
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      if (path === '/reset-password' || params.has('token')) {
        return 'reset-password';
      }
    }
    const verifiedUser = getCurrentUser();
    if (!verifiedUser) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      return 'login';
    }
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/login' || window.location.hash === '#/login') {
        return 'login';
      }
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [loginInitialMode, setLoginInitialMode] = useState('login');

  // 1. QUẢN LÝ TRẠNG THÁI PHÂN HỆ TOÀN CỤC (GLOBAL PORTAL ROUTER):
  const [currentPortal, setCurrentPortal] = useState(() => {
    try {
      const liveUser = getCurrentUser();
      if (liveUser) {
        if (liveUser.role === ROLES.SYSTEM_ADMIN || liveUser.role === 'system_admin') {
          return localStorage.getItem('petcare_current_portal') || 'ADMIN';
        }
        if (liveUser.role === 'CLINIC_ADMIN' || (liveUser.role === ROLES.VET_DOCTOR && liveUser.vetStatus === 'approved')) {
          return localStorage.getItem('petcare_current_portal') || 'CLINIC';
        }
      }
      return 'OWNER';
    } catch {
      return 'OWNER';
    }
  });

  const [selectedPetId, setSelectedPetId] = useState('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  // Modals state
  const [isAddPetModalOpen, setIsAddPetModalOpen] = useState(false);
  const [petToEdit, setPetToEdit] = useState(null);
  const [viewingPetDetail, setViewingPetDetail] = useState(null);

  const [isAddScheduleModalOpen, setIsAddScheduleModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState(null);
  const [scheduleInitialDate, setScheduleInitialDate] = useState(null);
  const [scheduleInitialType, setScheduleInitialType] = useState(null);
  const [scheduleInitialTitle, setScheduleInitialTitle] = useState(null);
  const [scheduleInitialPetId, setScheduleInitialPetId] = useState(null);

  const [isAiScheduleModalOpen, setIsAiScheduleModalOpen] = useState(false);
  const [aiSchedulePetId, setAiSchedulePetId] = useState(null);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isFamilyGroupModalOpen, setIsFamilyGroupModalOpen] = useState(false);
  const [isWsavaPdfModalOpen, setIsWsavaPdfModalOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // 5 New Pillars Modals state
  const [isOmniAlertModalOpen, setIsOmniAlertModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isPetSitterModalOpen, setIsPetSitterModalOpen] = useState(false);
  const [publicQrPet, setPublicQrPet] = useState(null);
  const [lostModePet, setLostModePet] = useState(null);
  const [posterPet, setPosterPet] = useState(null);

  // 3. Core Handlers & Data Loaders
  const handleLogout = () => {
    try { sound?.playClick?.(); } catch {}
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentPortal('OWNER');
    localStorage.removeItem('petcare_active_user');
    localStorage.removeItem('petcare_current_user');
    localStorage.removeItem('petcare_is_authenticated');
    localStorage.removeItem('petcare_current_portal');
    try { authLogout(); } catch {}
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '/login');
    }
    setActiveTab('login');
  };

  const loadData = (userId = currentUser?.id, userRole = currentUser?.role) => {
    try {
      setPets(getPets(userId, userRole));
      setSchedules(getSchedules(userId, userRole));
      setExpenses(getExpenses(userId));
      setDailyLogs(getDailyLogs(userId));
      setPrescriptions(getPrescriptions(userId));
      setFamilyMembers(getFamilyMembers(userId));
      setDailyHabits(getDailyHabits(userId));
      setAppointments(getAppointments(userId, userRole));
      const currentTheme = getTheme();
      if (setContextTheme) {
        setContextTheme(currentTheme);
      }
      setTheme(currentTheme);
    } catch (err) {
      console.warn('Error loading data:', err);
    }
  };

  const reloadSystemUsers = async () => {
    try {
      const updated = await syncUsersWithBackend();
      setSystemUsers(updated);
      const { syncAllDataToCache, runMigrationIfNeeded } = await import('./services/apiService.js');
      await runMigrationIfNeeded();
      await syncAllDataToCache();
    } catch (err) {
      // Nếu backend offline, dùng snapshot local để không crash UI
      console.warn('[PetCare] Không thể đồng bộ từ backend, dùng dữ liệu local:', err.message);
      setSystemUsers(getUsers());
    }
    loadData(currentUser?.id, currentUser?.role);
  };

  const handleSwitchPortal = (portal) => {
    try { sound?.playClick?.(); } catch {}
    // Kiểm tra phân quyền khi chuyển cổng:
    if (portal === 'ADMIN' && currentUser?.role !== ROLES.SYSTEM_ADMIN && currentUser?.role !== 'system_admin') {
      console.warn('Unauthorized attempt to switch to ADMIN portal');
      return;
    }
    if (portal === 'CLINIC') {
      const isApprovedVet = (
        currentUser?.role === ROLES.SYSTEM_ADMIN ||
        currentUser?.role === 'system_admin' ||
        currentUser?.role === 'CLINIC_ADMIN' ||
        (currentUser?.role === ROLES.VET_DOCTOR && currentUser?.vetStatus === 'approved')
      );
      if (!isApprovedVet) {
        alert('Tài khoản của bạn chưa được cấp quyền Bác sĩ!');
        return;
      }
    }
    setCurrentPortal(portal);
    try {
      localStorage.setItem('petcare_current_portal', portal);
    } catch (e) {
      // storage safe
    }
  };

  // 4. Effects
  // Lắng nghe sự kiện toàn cục dọn dẹp dữ liệu để cập nhật thống kê ngay lập tức
  useEffect(() => {
    const handleDataCleaned = () => {
      loadData(currentUser?.id, currentUser?.role);
      reloadSystemUsers();
    };
    window.addEventListener('petcare_data_cleaned', handleDataCleaned);
    window.addEventListener('petcare_data_synced', handleDataCleaned);
    return () => {
      window.removeEventListener('petcare_data_cleaned', handleDataCleaned);
      window.removeEventListener('petcare_data_synced', handleDataCleaned);
    };
  }, [currentUser?.id, currentUser?.role]);

  useEffect(() => {
    reloadSystemUsers();
  }, [currentUser?.id]);

  // Lắng nghe sự kiện xuất Hộ Chiếu WSAVA toàn cục từ Header hoặc bất kỳ đâu
  useEffect(() => {
    const handleGlobalExportWsava = (event) => {
      try { sound?.playSuccess?.(); } catch {}
      if (event?.detail?.petId) {
        setSelectedPetId(event.detail.petId);
      }
      setIsWsavaPdfModalOpen(true);
    };
    window.addEventListener('petcare_export_wsava_pdf', handleGlobalExportWsava);
    return () => {
      window.removeEventListener('petcare_export_wsava_pdf', handleGlobalExportWsava);
    };
  }, []);

  // Chuyển hướng nếu có yêu cầu mở tab ai-assistant cũ sang mở cửa sổ chat nổi
  useEffect(() => {
    if (activeTab === 'ai-assistant') {
      setActiveTab('dashboard');
      setIsAiDrawerOpen(true);
    }
    if (activeTab === 'clinic-os' || activeTab === 'vet-portal' || activeTab === 'soap') {
      setActiveTab('dashboard');
      handleSwitchPortal('CLINIC');
    }
    if (activeTab === 'admin-portal-switch') {
      setActiveTab('dashboard');
      if (currentUser?.role === 'system_admin' || currentUser?.role === ROLES.SYSTEM_ADMIN) {
        handleSwitchPortal('ADMIN');
      }
    }
  }, [activeTab, currentUser]);

  // Đồng bộ lịch khám hai chiều theo thời gian thực
  useEffect(() => {
    const handleAppointmentsUpdated = () => {
      setAppointments(getAppointments(currentUser?.id, currentUser?.role));
    };
    window.addEventListener('petcare_appointments_updated', handleAppointmentsUpdated);
    window.addEventListener('storage', handleAppointmentsUpdated);
    return () => {
      window.removeEventListener('petcare_appointments_updated', handleAppointmentsUpdated);
      window.removeEventListener('storage', handleAppointmentsUpdated);
    };
  }, [currentUser?.id, currentUser?.role]);

  // Auth Guard Effect: automatically redirect to /login if unauthenticated
  // Kiểm tra tài khoản bị khóa trong phiên: tự động đăng xuất nếu bị khóa
  // Nếu phiên không còn hợp lệ, xóa riêng phiên đó và chuyển về đăng nhập
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      setActiveTab('login');
    } else {
      // Xác minh phiên làm việc từ authService
      const verifiedUser = getCurrentUser();
      if (!verifiedUser) {
        handleLogout();
        return;
      }
      if (verifiedUser.isLocked) {
        alert('Tài khoản của bạn đã bị khóa bởi Quản trị viên!');
        handleLogout();
        return;
      }

      loadData(currentUser?.id, currentUser?.role);
      if (activeTab === 'login') {
        if (typeof window !== 'undefined' && window.location.pathname === '/login') {
          window.history.replaceState(null, '', '/');
        }
        setActiveTab('dashboard');
      }
    }
  }, [isAuthenticated, currentUser?.id]);

  // Bảo vệ phân hệ: chặn người dùng thường truy cập trái phép cổng ADMIN
  useEffect(() => {
    if (currentPortal === 'ADMIN' && currentUser?.role !== ROLES.SYSTEM_ADMIN && currentUser?.role !== 'system_admin') {
      setCurrentPortal('OWNER');
    }
  }, [currentPortal, currentUser?.role]);

  useEffect(() => {
    loadData();

    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        sound.playPop();
        setIsGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  // Sync with browser URL popstate (Back/Forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      if (path === '/reset-password' || params.has('token')) {
        setActiveTab('reset-password');
      } else if (!isAuthenticated || !currentUser || path === '/login' || window.location.hash === '#/login') {
        setActiveTab('login');
      } else if (activeTab === 'login' || activeTab === 'reset-password') {
        setActiveTab('dashboard');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab, isAuthenticated, currentUser]);

  const handleToggleTheme = () => {
    sound.playClick();
    toggleTheme();
  };

  // Standalone Login Navigation
  const navigateToLogin = () => {
    sound.playClick();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.history.pushState(null, '', '/login');
    }
    setActiveTab('login');
  };

  const navigateToDashboard = () => {
    sound.playClick();
    if (typeof window !== 'undefined' && window.location.pathname === '/login') {
      window.history.pushState(null, '', '/');
    }
    setActiveTab('dashboard');
  };

  // Auth helpers & Route protection
  const ensureAuth = (actionCallback) => {
    if (!isAuthenticated || !currentUser) {
      sound.playPop();
      navigateToLogin();
      return false;
    }
    if (actionCallback) actionCallback();
    return true;
  };

  // Pets Handlers
  const handleSavePet = (petData, autoSchedule = false) => {
    try {
      if (petToEdit) {
        await updatePet({ ...petToEdit, ...petData }, currentUser?.id, currentUser?.role);
      } else {
        await addPet(petData, autoSchedule, currentUser?.id);
      }
      loadData(currentUser?.id, currentUser?.role);
      setPetToEdit(null);
      sound.playSuccess();
    } catch (err) {
      alert(err.message || 'Lỗi lưu thú cưng');
    }
  };

  const handleDeletePet = (petId) => {
    const pet = pets.find(p => p.id === petId);
    const petName = pet ? pet.name : 'thú cưng';
    if (window.confirm(`CẢNH BÁO XÓA THÚ CƯNG:\nBạn có chắc chắn muốn xóa bé "${petName}"?\n\nToàn bộ dữ liệu liên quan gồm Lịch chăm sóc, Chi tiêu, Nhật ký, Đơn thuốc, Thói quen và Thông tin thất lạc của bé sẽ bị dọn sạch vĩnh viễn và không thể khôi phục.`)) {
      try {
        await deletePet(petId, currentUser?.id, currentUser?.role);
        loadData(currentUser?.id, currentUser?.role);
        if (selectedPetId === petId) {
          setSelectedPetId('all');
        }
        if (viewingPetDetail?.id === petId) {
          setViewingPetDetail(null);
        }
        sound.playTrash();
      } catch (err) {
        alert(err.message || 'Lỗi xóa thú cưng');
      }
    }
  };

  const handleUpdatePetWeight = (petId, newWeight, newHistory) => {
    const pet = pets.find(p => p.id === petId);
    if (pet) {
      try {
        const updated = await updatePet({
          ...pet,
          weight: newWeight,
          weightHistory: newHistory
        }, currentUser?.id, currentUser?.role);
        loadData(currentUser?.id, currentUser?.role);
        setViewingPetDetail(updated);
        sound.playSuccess();
      } catch (err) {
        alert(err.message || 'Lỗi cập nhật cân nặng');
      }
    }
  };

  // Schedules Handlers
  const handleSaveSchedule = (scheduleData) => {
    try {
      if (scheduleToEdit) {
        await updateSchedule({ ...scheduleToEdit, ...scheduleData }, currentUser?.id, currentUser?.role);
      } else {
        await addSchedule(scheduleData, currentUser?.id);
      }
      loadData(currentUser?.id, currentUser?.role);
      setScheduleToEdit(null);
      setScheduleInitialDate(null);
      setScheduleInitialType(null);
      setScheduleInitialTitle(null);
      sound.playSuccess();
    } catch (err) {
      alert(err.message || 'Lỗi lưu lịch trình');
    }
  };

  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch hẹn này?')) {
      try {
        await deleteSchedule(scheduleId, currentUser?.id, currentUser?.role);
        loadData(currentUser?.id, currentUser?.role);
        sound.playTrash();
      } catch (err) {
        alert(err.message || 'Lỗi xóa lịch trình');
      }
    }
  };

  const handleToggleComplete = (scheduleId) => {
    try {
      await toggleScheduleComplete(scheduleId, currentUser?.id, currentUser?.role);
      loadData(currentUser?.id, currentUser?.role);
      sound.playSuccess();
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật lịch');
    }
  };

  const handleApplyBatchAiSchedule = (newSchedules) => {
    try {
      addBatchSchedules(newSchedules, currentUser?.id);
      loadData(currentUser?.id, currentUser?.role);
      sound.playSuccess();
    } catch (err) {
      alert(err.message || 'Lỗi tạo lịch AI');
    }
  };

  // Expenses Handlers
  const handleAddExpense = async (exp) => {
    try {
      await addExpense(exp, currentUser?.id);
      loadData(currentUser?.id, currentUser?.role);
      sound.playSuccess();
    } catch (err) {
      alert(err.message || 'Lỗi thêm chi tiêu');
    }
  };

  const handleDeleteExpense = (id) => {
    if (window.confirm('Xóa khoản chi tiêu này?')) {
      try {
        await deleteExpense(id, currentUser?.id);
        loadData(currentUser?.id, currentUser?.role);
        sound.playTrash();
      } catch (err) {
        alert(err.message || 'Lỗi xóa chi tiêu');
      }
    }
  };

  // Daily Logs Handler
  const handleAddDailyLog = async (log) => {
    try {
      await addDailyLog(log, currentUser?.id);
      loadData(currentUser?.id, currentUser?.role);
      sound.playSuccess();
    } catch (err) {
      alert(err.message || 'Lỗi thêm nhật ký');
    }
  };

  // Prescriptions Handlers
  const handleAddPrescription = async (pres) => {
    try {
      await addPrescription(pres, currentUser?.id);
      loadData(currentUser?.id, currentUser?.role);
      sound.playSuccess();
    } catch (err) {
      alert(err.message || 'Lỗi thêm đơn thuốc');
    }
  };

  const handleDeletePrescription = (id) => {
    if (window.confirm('Xóa đơn thuốc này?')) {
      try {
        await deletePrescription(id, currentUser?.id);
        loadData(currentUser?.id, currentUser?.role);
        sound.playTrash();
      } catch (err) {
        alert(err.message || 'Lỗi xóa đơn thuốc');
      }
    }
  };

  // Daily Habits Handlers
  const handleToggleHabit = (id, memberId) => {
    try {
      toggleDailyHabit(id, memberId, currentUser?.id);
      loadData(currentUser?.id, currentUser?.role);
    } catch (err) {
      alert(err.message || 'Lỗi cập nhật thói quen');
    }
  };

  const handleAddHabit = (habitData) => {
    try {
      addDailyHabit(habitData, currentUser?.id);
      loadData(currentUser?.id, currentUser?.role);
    } catch (err) {
      alert(err.message || 'Lỗi thêm thói quen');
    }
  };

  const handleDeleteHabit = (id) => {
    try {
      deleteDailyHabit(id, currentUser?.id);
      loadData(currentUser?.id, currentUser?.role);
    } catch (err) {
      alert(err.message || 'Lỗi xóa thói quen');
    }
  };

  // Family Members Handlers
  const handleAddFamilyMember = async (memberData) => {
    try {
      await addFamilyMember(memberData, currentUser?.id);
      loadData(currentUser?.id, currentUser?.role);
    } catch (err) {
      alert(err.message || 'Lỗi thêm thành viên');
    }
  };

  const handleDeleteFamilyMember = (id) => {
    if (window.confirm('Xóa thành viên gia đình này?')) {
      sound.playTrash();
      try {
        await deleteFamilyMember(id, currentUser?.id);
        loadData(currentUser?.id, currentUser?.role);
      } catch (err) {
        alert(err.message || 'Lỗi xóa thành viên');
      }
    }
  };

  // Lost Mode Handlers
  const handleSaveLostMode = (petId, lostData) => {
    try {
      await updatePetLostMode(petId, lostData);
      loadData(currentUser?.id, currentUser?.role);
    } catch (err) {
      alert(err.message || 'Lỗi lưu thông tin thất lạc');
    }
  };

  // Medical OCR Pipeline Handler (Auto push 3-in-1: Schedule + Prescription + Expense)
  const handleOcrComplete = (ocrResult, petId) => {
    try {
      applyOcrAutoPipeline(ocrResult, petId, currentUser?.id);
      loadData(currentUser?.id, currentUser?.role);
    } catch (err) {
      alert(err.message || 'Lỗi xử lý OCR');
    }
  };

  // Omni-Channel Schedule Action (Done / Snooze)
  const handleOmniActionConfirm = (scheduleId, action) => {
    if (action === 'done') {
      try {
        await toggleScheduleComplete(scheduleId, currentUser?.id, currentUser?.role);
      } catch (err) {
        alert(err.message || 'Lỗi cập nhật lịch');
      }
    } else if (action === 'snooze') {
      try {
        const sched = schedules.find(s => s.id === scheduleId);
        if (sched) {
          let newTime = '09:00';
          if (sched.time) {
            const [h, m] = sched.time.split(':').map(Number);
            const nextH = ((isNaN(h) ? 8 : h) + 1) % 24;
            const nextM = isNaN(m) ? 0 : m;
            newTime = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
          }
          await updateSchedule({ ...sched, time: newTime }, currentUser?.id, currentUser?.role);
        }
      } catch (err) {
        alert(err.message || 'Lỗi hoãn lịch');
      }
    }
    loadData(currentUser?.id, currentUser?.role);
  };

  // 2-Way Vet Appointments Handlers
  const handleOpenVetBooking = (initialData = {}) => {
    sound.playPop();
    setVetBookingInitialData(initialData || {});
    setIsVetBookingModalOpen(true);
  };

  const handleSaveAppointment = (bookingData) => {
    const current = getAppointments(currentUser?.id, currentUser?.role);
    const exists = current.find(a => a.id === bookingData?.id);
    const created = exists ? bookingData : addAppointment({ ...bookingData, ownerId: currentUser?.id });
    setAppointments(getAppointments(currentUser?.id, currentUser?.role));
    return created;
  };

  const handleUpdateAppointment = (id, updates) => {
    updateAppointment(id, updates);
    setAppointments(getAppointments(currentUser?.id, currentUser?.role));
  };

  const handleDeleteAppointment = (id) => {
    try { sound?.playTrash?.() || sound?.playClick?.(); } catch {}
    deleteAppointment(id);
    setAppointments(getAppointments(currentUser?.id, currentUser?.role));
  };

  const pendingAppointmentsCount = (appointments || []).filter(a => a.status === 'Chờ duyệt').length;

  // Filtered schedules for current pet filter
  const displayedSchedules = selectedPetId === 'all'
    ? schedules
    : schedules.filter(s => s.petId === selectedPetId);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = schedules.filter(s => s.date < todayStr && !s.completed).length;
  const todayCount = schedules.filter(s => s.date === todayStr && !s.completed).length;

  // ROUTE KHÔI PHỤC MẬT KHẨU (RESET PASSWORD):
  if (activeTab === 'reset-password') {
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const currentToken = urlParams ? urlParams.get('token') : '';

    return (
      <GlobalErrorBoundary>
        <AuraBackground>
          <ResetPasswordPage
            token={currentToken}
            onBackToLogin={() => {
              if (typeof window !== 'undefined') {
                window.history.pushState(null, '', '/login');
              }
              setLoginInitialMode('login');
              setActiveTab('login');
            }}
            onRequestNewLink={() => {
              if (typeof window !== 'undefined') {
                window.history.pushState(null, '', '/login');
              }
              setLoginInitialMode('forgot');
              setActiveTab('login');
            }}
          />
        </AuraBackground>
      </GlobalErrorBoundary>
    );
  }

  // PROTECTED ROUTE / AUTH GUARD:
  // Nếu chưa đăng nhập (!isAuthenticated || !currentUser) hoặc đang ở route /login:
  // Chặn Dashboard, ẩn hoàn toàn Sidebar và Header, chỉ hiển thị duy nhất form đăng nhập căn giữa toàn màn hình.
  if (!isAuthenticated || !currentUser || activeTab === 'login') {
    return (
      <GlobalErrorBoundary>
        <AuraBackground>
          <LoginPage
            initialMode={loginInitialMode}
            onLoginSuccess={(user) => {
              setIsAuthenticated(true);
              setCurrentUser(user);
              try {
                localStorage.setItem('petcare_active_user', JSON.stringify(user));
                localStorage.setItem('petcare_current_user', JSON.stringify(user));
                localStorage.setItem('petcare_is_authenticated', 'true');
              } catch {}

              let targetPortal = 'OWNER';
              if (user?.role === ROLES.SYSTEM_ADMIN || user?.role === 'system_admin') {
                targetPortal = 'ADMIN';
              } else if ((user?.role === 'CLINIC_ADMIN' || user?.role === ROLES.VET_DOCTOR) && user?.vetStatus === 'approved') {
                targetPortal = 'CLINIC';
              }
              setCurrentPortal(targetPortal);
              try {
                localStorage.setItem('petcare_current_portal', targetPortal);
              } catch {}

              loadData(user?.id, user?.role);
              navigateToDashboard();
            }}
            onBackToHome={navigateToDashboard}
            showBackHome={false}
          />
        </AuraBackground>
      </GlobalErrorBoundary>
    );
  }

  // ============================================================================
  // GUARD TOÀN CỤC: BẮT BUỘC ĐỔI MẬT KHẨU TẠM THỜI Ở LẦN ĐĂNG NHẬP ĐẦU TIÊN
  // Tài khoản do Admin cấp phải đổi mật khẩu trước khi dùng bất kỳ chức năng nào
  // ============================================================================
  if (isAuthenticated && currentUser?.mustChangePassword) {
    return (
      <GlobalErrorBoundary>
        <AuraBackground>
          <div className="h-screen w-full flex items-center justify-center bg-transparent antialiased font-sans">
            <FirstLoginPasswordModal
              currentUser={currentUser}
              onSuccess={(updatedUser) => {
                setCurrentUser(updatedUser);
                reloadSystemUsers();
              }}
              onLogout={handleLogout}
            />
          </div>
        </AuraBackground>
      </GlobalErrorBoundary>
    );
  }

  // ============================================================================
  // WORKSPACE 0: CỔNG QUẢN TRỊ VIÊN HỆ THỐNG (SYSTEM ADMIN PORTAL)
  // Chỉ dành riêng cho Quản trị viên hệ thống (system_admin)
  // ============================================================================
  if (currentPortal === 'ADMIN' && (currentUser?.role === ROLES.SYSTEM_ADMIN || currentUser?.role === 'system_admin')) {
    return (
      <GlobalErrorBoundary>
        <AuraBackground>
          <div className="h-screen w-full flex flex-col overflow-hidden bg-transparent antialiased font-sans">
            <AdminPortal
              currentUser={currentUser}
              users={systemUsers}
              pets={pets}
              schedules={schedules}
              onLogout={handleLogout}
              onSwitchPortal={(portal) => handleSwitchPortal(portal)}
              onUsersUpdated={reloadSystemUsers}
              onDataChanged={() => {
                reloadSystemUsers();
                setPets(getPets());
                setSchedules(getSchedules());
              }}
            />
          </div>
        </AuraBackground>
      </GlobalErrorBoundary>
    );
  }

  // ============================================================================
  // WORKSPACE 1: CỔNG BÁC SĨ THÚ Y (CLINIC WORKSPACE / CLINIC OS - B2B)
  // Dành riêng cho Bác Sĩ / Quản trị viên phòng khám (CLINIC_ADMIN)
  // ============================================================================
  if (currentPortal === 'CLINIC') {
    const isApprovedVet = (
      currentUser?.role === ROLES.SYSTEM_ADMIN ||
      currentUser?.role === 'system_admin' ||
      currentUser?.role === 'CLINIC_ADMIN' ||
      (currentUser?.role === ROLES.VET_DOCTOR && currentUser?.vetStatus === 'approved')
    );
    if (!isApprovedVet) {
      return (
        <GlobalErrorBoundary>
          <AuraBackground>
            <div className="h-screen w-full flex items-center justify-center p-4">
              <div className="max-w-md w-full p-6 rounded-3xl bg-white/90 dark:bg-[#151622]/95 border border-amber-500/30 text-center shadow-2xl backdrop-blur-2xl">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 text-3xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
                  ⏳
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Quyền Bác sĩ chưa được kích hoạt
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                  {currentUser?.vetStatus === 'pending'
                    ? 'Đơn đăng ký hành nghề Bác sĩ của bạn đang chờ Quản trị viên hệ thống xét duyệt.'
                    : currentUser?.vetStatus === 'rejected'
                    ? 'Đơn đăng ký quyền Bác sĩ của bạn đã bị từ chối.'
                    : 'Bạn không có quyền truy cập vào Cổng Bác sĩ / Bệnh viện thú y.'}
                </p>
                <button
                  onClick={() => handleSwitchPortal('OWNER')}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 transition-all cursor-pointer"
                >
                  🐾 Quay lại Cổng Chủ Nuôi
                </button>
              </div>
            </div>
          </AuraBackground>
        </GlobalErrorBoundary>
      );
    }

    return (
      <GlobalErrorBoundary>
        <AuraBackground>
          <div className="h-screen w-full flex flex-col overflow-y-auto bg-transparent text-slate-800 antialiased font-sans">
            {/* Dedicated Hospital / Clinic Workspace Layout */}
            <main className="flex-1 w-full max-w-[1700px] mx-auto p-3 sm:p-6 lg:p-8">
              <ClinicWorkspaceView
                pets={pets}
                appointments={appointments}
                onUpdateAppointment={handleUpdateAppointment}
                onNavigateTab={(tab) => {
                  try { sound?.playClick?.(); } catch {}
                  if (tab === 'dashboard' || tab === 'pets' || tab === 'schedule' || tab === 'medical') {
                    setCurrentPortal('OWNER');
                    setActiveTab(tab);
                  }
                }}
                onBack={() => setCurrentPortal('OWNER')}
                onBackToOwnerPortal={() => setCurrentPortal('OWNER')}
                onSwitchPortal={(portal) => handleSwitchPortal(portal)}
                onLogout={handleLogout}
                currentUser={currentUser}
              />
            </main>

            {/* User Profile Modal */}
            <UserProfileModal
              isOpen={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
              currentUser={currentUser}
              initialTab={profileModalTab}
              onUserUpdated={(updatedUser) => {
                setCurrentUser(updatedUser);
              }}
            />
          </div>
        </AuraBackground>
      </GlobalErrorBoundary>
    );
  }

  return (
    <GlobalErrorBoundary>
      <AuraBackground>
        <div className={`h-screen w-full flex flex-col overflow-hidden antialiased transition-colors bg-transparent ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
      
      {/* Top Navbar */}
      <Navbar
        pets={pets}
        schedules={schedules}
        selectedPetId={selectedPetId}
        onSelectPet={(id) => {
          sound.playClick();
          setSelectedPetId(id);
        }}
        onOpenAddSchedule={() => {
          ensureAuth(() => {
            sound.playClick();
            setScheduleToEdit(null);
            setScheduleInitialDate(null);
            setScheduleInitialType(null);
            setScheduleInitialTitle(null);
            setIsAddScheduleModalOpen(true);
          });
        }}
        onOpenVetBooking={() => handleOpenVetBooking()}
        onOpenSettings={() => {
          sound.playClick();
          setIsSettingsModalOpen(true);
        }}
        onOpenFamilyModal={() => {
          sound.playClick();
          setIsFamilyGroupModalOpen(true);
        }}
        onOpenGlobalSearch={() => {
          sound.playPop();
          setIsGlobalSearchOpen(true);
        }}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          sound.playClick();
          if (!currentUser && (tab === 'pets' || tab === 'schedule' || tab === 'family')) {
            navigateToLogin();
            return;
          }
          if (window.location.pathname === '/login') {
            window.history.pushState(null, '', '/');
          }
          setActiveTab(tab);
        }}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onToggleComplete={handleToggleComplete}
        currentUser={currentUser}
        onOpenAuthModal={navigateToLogin}
        onOpenProfileModal={(tab = 'profile') => {
          sound.playClick();
          setProfileModalTab(tab);
          setIsProfileModalOpen(true);
        }}
        onLogout={handleLogout}
        currentPortal={currentPortal}
        setCurrentPortal={setCurrentPortal}
        onSwitchPortal={(portal) => {
          handleSwitchPortal(portal);
        }}
        onExportPdf={() => {
          try { sound?.playSuccess?.(); } catch {}
          setIsWsavaPdfModalOpen(true);
        }}
      />

      {/* Main Workspace Layout with Fixed Floating Sidebar and Independent Scrollable Content */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        
        {/* Fixed Floating Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            sound.playClick();
            if (tab === 'clinic-os' || tab === 'vet-portal') {
              setCurrentPortal('CLINIC');
              return;
            }
            if (!currentUser && (tab === 'pets' || tab === 'schedule' || tab === 'family')) {
              navigateToLogin();
              return;
            }
            if (window.location.pathname === '/login') {
              window.history.pushState(null, '', '/');
            }
            setActiveTab(tab);
          }}
          isMobileOpen={isMobileMenuOpen}
          setIsMobileOpen={setIsMobileMenuOpen}
          overdueCount={overdueCount}
          todayCount={todayCount}
          pendingAppointmentsCount={pendingAppointmentsCount}
          currentUser={currentUser}
          onOpenProfileModal={(tab = 'profile') => {
            sound.playClick();
            setProfileModalTab(tab);
            setIsProfileModalOpen(true);
          }}
        />

        {/* Independent Scrollable Right Main Content: Header-aware, non-overlapping spatial flex layout */}
        <main className={`flex-1 h-full min-w-0 transition-colors ${
          activeTab === 'dashboard'
            ? 'w-full md:pl-24 pr-2 sm:pr-4 py-1 sm:py-2 overflow-hidden flex flex-col'
            : activeTab === 'schedule'
            ? 'w-full pl-24 pr-6 py-3 overflow-hidden flex flex-col'
            : activeTab === 'bonding'
            ? 'w-full md:pl-24 pr-2 sm:pr-4 py-1 sm:py-2 overflow-hidden flex flex-col'
            : 'bg-transparent p-4 sm:p-6 lg:p-8 md:pl-28 overflow-y-auto custom-scrollbar'
        }`}>
          <div className={`${
            activeTab === 'dashboard' || activeTab === 'bonding'
              ? 'w-full h-full max-w-7xl mx-auto flex flex-col overflow-hidden'
              : activeTab === 'schedule'
              ? 'w-full max-w-[1680px] mx-auto flex-1 min-h-0 flex flex-col'
              : 'max-w-7xl mx-auto space-y-6 pb-12'
          }`}>
          
          {activeTab === 'dashboard' && (
            <DashboardView
              pets={pets}
              schedules={displayedSchedules}
              appointments={appointments}
              currentUser={currentUser}
              onToggleComplete={handleToggleComplete}
              onOpenAddSchedule={() => {
                ensureAuth(() => {
                  sound.playClick();
                  setScheduleToEdit(null);
                  setScheduleInitialDate(null);
                  setScheduleInitialType(null);
                  setScheduleInitialTitle(null);
                  setIsAddScheduleModalOpen(true);
                });
              }}
              onOpenAddPet={() => {
                ensureAuth(() => {
                  sound.playClick();
                  setPetToEdit(null);
                  setIsAddPetModalOpen(true);
                });
              }}
              onOpenAiSchedule={() => {
                sound.playPop();
                setAiSchedulePetId(null);
                setIsAiScheduleModalOpen(true);
              }}
              onSelectPet={(petId) => {
                sound.playClick();
                const p = pets.find(item => item.id === petId);
                if (p) setViewingPetDetail(p);
              }}
              onNavigateTab={(tab) => {
                sound.playClick();
                setActiveTab(tab);
              }}
              onAskAiPrompt={(prompt) => {
                sound.playPop();
                setAiInitialPrompt(prompt);
                setIsAiDrawerOpen(true);
              }}
              onOpenVetBooking={handleOpenVetBooking}
            />
          )}

          {activeTab === 'pets' && (
            <PetListView
              pets={pets}
              onOpenAddPet={() => {
                ensureAuth(() => {
                  sound.playClick();
                  setPetToEdit(null);
                  setIsAddPetModalOpen(true);
                });
              }}
              onOpenEditPet={(pet) => {
                sound.playClick();
                setPetToEdit(pet);
                setIsAddPetModalOpen(true);
              }}
              onDeletePet={handleDeletePet}
              onViewPetDetail={(pet) => {
                sound.playPop();
                setViewingPetDetail(pet);
              }}
              onOpenAiScheduleForPet={(pet) => {
                sound.playPop();
                setAiSchedulePetId(pet.id);
                setIsAiScheduleModalOpen(true);
              }}
              onOpenVetBooking={handleOpenVetBooking}
              onOpenPublicQr={(pet) => setPublicQrPet(pet)}
            />
          )}

          {activeTab === 'schedule' && (
            <ScheduleView
              schedules={displayedSchedules}
              appointments={appointments}
              pets={pets}
              habits={dailyHabits}
              familyMembers={familyMembers}
              onToggleHabit={handleToggleHabit}
              onAddHabit={handleAddHabit}
              onDeleteHabit={handleDeleteHabit}
              onToggleComplete={handleToggleComplete}
              onOpenAddSchedule={(date, type, title, petId) => {
                ensureAuth(() => {
                  sound.playClick();
                  setScheduleToEdit(null);
                  setScheduleInitialDate(date);
                  setScheduleInitialType(type || null);
                  setScheduleInitialTitle(title || null);
                  setScheduleInitialPetId(petId || null);
                  setIsAddScheduleModalOpen(true);
                });
              }}
              onOpenEditSchedule={(sch) => {
                sound.playClick();
                setScheduleToEdit(sch);
                setIsAddScheduleModalOpen(true);
              }}
              onDeleteSchedule={handleDeleteSchedule}
              onDeleteAppointment={handleDeleteAppointment}
              onOpenAiSchedule={() => {
                sound.playPop();
                setAiSchedulePetId(null);
                setIsAiScheduleModalOpen(true);
              }}
              onOpenOmniAlert={() => {
                sound.playClick();
                setIsOmniAlertModalOpen(true);
              }}
              onOpenVetBooking={handleOpenVetBooking}
            />
          )}

          {activeTab === 'bonding' && (
            <PetBondingView pets={pets} />
          )}

          {activeTab === 'daily' && (
            <div className="space-y-6">
              <DailyStreakChecklist
                habits={dailyHabits}
                pets={pets}
                familyMembers={familyMembers}
                currentMemberId="fam-1"
                onToggleHabit={handleToggleHabit}
                onAddHabit={handleAddHabit}
                onDeleteHabit={handleDeleteHabit}
              />
              <DailyActivityView
                dailyLogs={dailyLogs}
                pets={pets}
                onAddDailyLog={handleAddDailyLog}
              />
            </div>
          )}

          {activeTab === 'family' && (
            <FamilyManagementView
              familyMembers={familyMembers}
              habits={dailyHabits}
              pets={pets}
              appointments={appointments}
              onAddMember={handleAddFamilyMember}
              onDeleteMember={handleDeleteFamilyMember}
              onOpenPetSitterModal={() => setIsPetSitterModalOpen(true)}
            />
          )}

          {activeTab === 'ocr' && (
            <div className="space-y-6">
              <AiMedicalOcrModal
                isModal={false}
                pets={pets}
                onOcrComplete={handleOcrComplete}
              />
            </div>
          )}

          {activeTab === 'ai-vision' && (
            <AiVisionScannerView
              pets={pets}
              onOpenAddSchedule={(type) => {
                sound.playPop();
                setScheduleToEdit(null);
                setScheduleInitialType(type || 'vet');
                setScheduleInitialTitle('Khám thú y kiểm tra da liễu & mắt');
                setIsAddScheduleModalOpen(true);
              }}
              onOpenVetBooking={handleOpenVetBooking}
            />
          )}

          {activeTab === 'ai-nutrition' && (
            <AiNutritionView pets={pets} />
          )}

          {activeTab === 'expenses' && (
            <ExpenseView
              expenses={expenses}
              pets={pets}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'prescriptions' && (
            <PrescriptionsView
              prescriptions={prescriptions}
              pets={pets}
              onAddPrescription={handleAddPrescription}
              onDeletePrescription={handleDeletePrescription}
            />
          )}

          {activeTab === 'medical' && (
            <MedicalRecordsView pets={pets} schedules={schedules} />
          )}

          {activeTab === 'services' && (
            <PetServicesView />
          )}

          </div>
        </main>
      </div>

      {/* ALL MODALS */}
      <PetFormModal
        isOpen={isAddPetModalOpen}
        onClose={() => {
          setIsAddPetModalOpen(false);
          setPetToEdit(null);
        }}
        onSave={handleSavePet}
        petToEdit={petToEdit}
      />

      <PetDetailModal
        isOpen={Boolean(viewingPetDetail)}
        onClose={() => setViewingPetDetail(null)}
        pet={viewingPetDetail}
        schedules={schedules}
        onUpdatePetWeight={handleUpdatePetWeight}
        onOpenAiScheduleForPet={(pet) => {
          setAiSchedulePetId(pet.id);
          setIsAiScheduleModalOpen(true);
        }}
        onOpenPublicQr={(pet) => {
          setPublicQrPet(pet);
        }}
        onOpenLostMode={(pet) => {
          setLostModePet(pet);
        }}
        onOpenPoster={(pet) => {
          setPosterPet(pet);
        }}
      />

      <ScheduleFormModal
        isOpen={isAddScheduleModalOpen}
        onClose={() => {
          setIsAddScheduleModalOpen(false);
          setScheduleToEdit(null);
          setScheduleInitialDate(null);
          setScheduleInitialType(null);
          setScheduleInitialTitle(null);
          setScheduleInitialPetId(null);
        }}
        onSave={handleSaveSchedule}
        pets={pets}
        scheduleToEdit={scheduleToEdit}
        initialDate={scheduleInitialDate}
        initialType={scheduleInitialType}
        initialTitle={scheduleInitialTitle}
        initialPetId={scheduleInitialPetId}
      />

      <AiScheduleModal
        isOpen={isAiScheduleModalOpen}
        onClose={() => {
          setIsAiScheduleModalOpen(false);
          setAiSchedulePetId(null);
        }}
        pets={pets}
        initialPetId={aiSchedulePetId}
        onApplyCarePlan={handleApplyBatchAiSchedule}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentUser={currentUser}
        onDataChanged={() => loadData(currentUser?.id, currentUser?.role)}
      />

      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        pets={pets}
        schedules={schedules}
        expenses={expenses}
        prescriptions={prescriptions}
        onNavigateTab={(tab) => {
          sound.playClick();
          setActiveTab(tab);
        }}
        onSelectPet={(id) => {
          sound.playClick();
          setSelectedPetId(id);
        }}
      />

      {/* 5 NEW PILLARS MODALS */}
      <OmniChannelAlertModal
        isOpen={isOmniAlertModalOpen}
        onClose={() => setIsOmniAlertModalOpen(false)}
        schedules={displayedSchedules}
        onActionConfirm={handleOmniActionConfirm}
      />

      <AiMedicalOcrModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        pets={pets}
        onOcrComplete={handleOcrComplete}
      />

      <PetSitterModeModal
        isOpen={isPetSitterModalOpen}
        onClose={() => setIsPetSitterModalOpen(false)}
        pets={pets}
        prescriptions={prescriptions}
      />

      <PublicPetQrModal
        isOpen={Boolean(publicQrPet)}
        onClose={() => setPublicQrPet(null)}
        pet={publicQrPet}
      />

      <LostModeManagerModal
        isOpen={Boolean(lostModePet)}
        onClose={() => setLostModePet(null)}
        pet={lostModePet}
        onSaveLostMode={handleSaveLostMode}
        onOpenPosterModal={(pet) => {
          setLostModePet(null);
          setPosterPet(pet);
        }}
      />

      <MissingPetPosterModal
        isOpen={Boolean(posterPet)}
        onClose={() => setPosterPet(null)}
        pet={posterPet}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        initialTab={profileModalTab}
        onUserUpdated={(updatedUser) => {
          setCurrentUser(updatedUser);
        }}
      />

      {/* CỬA SỔ CHAT NỔI THÔNG MINH DR. PAW AI (CYBERPUNK FLOATING WIDGET DRAWER) */}
      <AiChatView
        pets={pets}
        activePetContextId={selectedPetId !== 'all' ? selectedPetId : null}
        onOpenSettings={() => {
          sound.playClick();
          setIsSettingsModalOpen(true);
        }}
        initialPrompt={aiInitialPrompt}
        isOpen={isAiDrawerOpen}
        onToggleOpen={setIsAiDrawerOpen}
        onOpenAddSchedule={(type, title) => {
          sound.playPop();
          setScheduleToEdit(null);
          setIsAddScheduleModalOpen(true);
        }}
      />

      {/* 2-Way Vet Appointments Booking Modal */}
      <VetBookingModal
        isOpen={isVetBookingModalOpen}
        onClose={() => {
          setIsVetBookingModalOpen(false);
          setVetBookingInitialData({});
        }}
        pets={pets}
        initialPetId={vetBookingInitialData.petId}
        initialService={vetBookingInitialData.service}
        initialNote={vetBookingInitialData.note}
        initialFacility={vetBookingInitialData.facility}
        onBookingSuccess={handleSaveAppointment}
      />

      {/* Modal Cài đặt nhóm Gia đình cùng chăm sóc */}
      <FamilyGroupSettingsModal
        isOpen={isFamilyGroupModalOpen}
        onClose={() => setIsFamilyGroupModalOpen(false)}
        familyMembers={familyMembers}
        onAddMember={handleAddFamilyMember}
        onDeleteMember={handleDeleteFamilyMember}
      />

      {/* Sổ Hộ Chiếu Tiêm Chủng Quốc Tế WSAVA Toàn Cục (Data-driven PDF Generator) */}
      <WsavaPassportModal
        isOpen={isWsavaPdfModalOpen}
        onClose={() => setIsWsavaPdfModalOpen(false)}
        pets={pets}
        selectedPetId={selectedPetId}
        schedules={schedules}
      />

    </div>
    </AuraBackground>
    </GlobalErrorBoundary>
  );
}
