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
import { SettingsModal } from './components/settings/SettingsModal';
import { FamilyGroupSettingsModal } from './components/family/FamilyGroupSettingsModal';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { LoginPage } from './components/auth/LoginPage';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { GlobalErrorBoundary } from './components/common/GlobalErrorBoundary';
import { AuraBackground } from './components/common/AuraBackground';
import { useTheme } from './context/ThemeContext';
import { getCurrentUser, logout as authLogout } from './services/authService';
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

  // Authentication State with RBAC (Role-Based Access Control)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('petcare_active_user') || localStorage.getItem('petcare_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch { 
      return null; 
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const saved = localStorage.getItem('petcare_active_user') || localStorage.getItem('petcare_current_user');
      return Boolean(saved && localStorage.getItem('petcare_is_authenticated') === 'true');
    } catch {
      return false;
    }
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileModalTab, setProfileModalTab] = useState('profile');

  // Route state supporting standalone /login page with strict Auth Guard
  const getInitialTab = () => {
    const isAuth = localStorage.getItem('petcare_is_authenticated') === 'true';
    const activeUser = localStorage.getItem('petcare_active_user') || localStorage.getItem('petcare_current_user');
    if (!isAuth || !activeUser) {
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

  // 1. QUẢN LÝ TRẠNG THÁI PHÂN HỆ TOÀN CỤC (GLOBAL PORTAL ROUTER):
  const [currentPortal, setCurrentPortal] = useState(() => {
    try {
      const savedUser = localStorage.getItem('petcare_active_user') || localStorage.getItem('petcare_current_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.role === 'CLINIC_ADMIN' || parsed.role === 'vet_doctor') {
          return 'CLINIC';
        }
      }
      return localStorage.getItem('petcare_current_portal') || 'OWNER';
    } catch {
      return 'OWNER';
    }
  });

  const handleSwitchPortal = (portal) => {
    try { sound?.playClick?.(); } catch {}
    setCurrentPortal(portal);
    try {
      localStorage.setItem('petcare_current_portal', portal);
    } catch (e) {
      // storage safe
    }
  };

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

  // Lắng nghe sự kiện xuất Hộ Chiếu WSAVA toàn cục từ Header hoặc bất kỳ đâu
  useEffect(() => {
    const handleGlobalExportWsava = () => {
      try { sound?.playSuccess?.(); } catch {}
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
  }, [activeTab]);

  // Đồng bộ lịch khám hai chiều theo thời gian thực
  useEffect(() => {
    const handleAppointmentsUpdated = () => {
      setAppointments(getAppointments());
    };
    window.addEventListener('petcare_appointments_updated', handleAppointmentsUpdated);
    window.addEventListener('storage', handleAppointmentsUpdated);
    return () => {
      window.removeEventListener('petcare_appointments_updated', handleAppointmentsUpdated);
      window.removeEventListener('storage', handleAppointmentsUpdated);
    };
  }, []);

  // 5 New Pillars Modals state
  const [isOmniAlertModalOpen, setIsOmniAlertModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [isPetSitterModalOpen, setIsPetSitterModalOpen] = useState(false);
  const [publicQrPet, setPublicQrPet] = useState(null);
  const [lostModePet, setLostModePet] = useState(null);
  const [posterPet, setPosterPet] = useState(null);

  // Load all data scoped by userId
  const loadData = (userId = currentUser?.id) => {
    try {
      setPets(getPets(userId));
      setSchedules(getSchedules(userId));
      setExpenses(getExpenses());
      setDailyLogs(getDailyLogs());
      setPrescriptions(getPrescriptions());
      setFamilyMembers(getFamilyMembers());
      setDailyHabits(getDailyHabits());
      setAppointments(getAppointments());
      const currentTheme = getTheme();
      if (setContextTheme) {
        setContextTheme(currentTheme);
      }
      setTheme(currentTheme);
    } catch (err) {
      console.warn('Error loading data:', err);
    }
  };

  // Auth Guard Effect: automatically redirect to /login if unauthenticated
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login');
      }
      setActiveTab('login');
    } else {
      loadData(currentUser?.id);
      if (activeTab === 'login') {
        if (typeof window !== 'undefined' && window.location.pathname === '/login') {
          window.history.replaceState(null, '', '/');
        }
        setActiveTab('dashboard');
      }
    }
  }, [isAuthenticated, currentUser]);

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
      if (!isAuthenticated || !currentUser || path === '/login' || window.location.hash === '#/login') {
        setActiveTab('login');
      } else if (activeTab === 'login') {
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

  // Pets Handlers
  const handleSavePet = (petData) => {
    sound.playSuccess();
    if (petToEdit) {
      updatePet({ ...petToEdit, ...petData });
    } else {
      addPet(petData, true, currentUser?.id);
    }
    loadData(currentUser?.id);
    setPetToEdit(null);
  };

  const handleDeletePet = (petId) => {
    const pet = pets.find(p => p.id === petId);
    if (window.confirm(`Bạn có chắc chắn muốn xóa bé ${pet ? pet.name : 'này'} và toàn bộ dữ liệu liên quan?`)) {
      sound.playTrash();
      deletePet(petId);
      loadData();
      if (viewingPetDetail?.id === petId) {
        setViewingPetDetail(null);
      }
    }
  };

  const handleUpdatePetWeight = (petId, newWeight, newHistory) => {
    sound.playSuccess();
    const pet = pets.find(p => p.id === petId);
    if (pet) {
      const updated = updatePet({
        ...pet,
        weight: newWeight,
        weightHistory: newHistory
      });
      loadData();
      setViewingPetDetail(updated);
    }
  };

  // Schedules Handlers
  const handleSaveSchedule = (scheduleData) => {
    sound.playSuccess();
    if (scheduleToEdit) {
      updateSchedule({ ...scheduleToEdit, ...scheduleData });
    } else {
      addSchedule(scheduleData);
    }
    loadData();
    setScheduleToEdit(null);
    setScheduleInitialDate(null);
    setScheduleInitialType(null);
    setScheduleInitialTitle(null);
  };

  const handleDeleteSchedule = (scheduleId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch hẹn này?')) {
      sound.playTrash();
      deleteSchedule(scheduleId);
      loadData();
    }
  };

  const handleToggleComplete = (scheduleId) => {
    sound.playSuccess();
    toggleScheduleComplete(scheduleId);
    loadData();
  };

  const handleApplyBatchAiSchedule = (newSchedules) => {
    sound.playSuccess();
    addBatchSchedules(newSchedules);
    loadData();
  };

  // Expenses Handlers
  const handleAddExpense = (exp) => {
    sound.playSuccess();
    addExpense(exp);
    loadData();
  };

  const handleDeleteExpense = (id) => {
    if (window.confirm('Xóa khoản chi tiêu này?')) {
      sound.playTrash();
      deleteExpense(id);
      loadData();
    }
  };

  // Daily Logs Handler
  const handleAddDailyLog = (log) => {
    sound.playSuccess();
    addDailyLog(log);
    loadData();
  };

  // Prescriptions Handlers
  const handleAddPrescription = (pres) => {
    sound.playSuccess();
    addPrescription(pres);
    loadData();
  };

  const handleDeletePrescription = (id) => {
    if (window.confirm('Xóa đơn thuốc này?')) {
      sound.playTrash();
      deletePrescription(id);
      loadData();
    }
  };

  // Daily Habits Handlers
  const handleToggleHabit = (id, memberId) => {
    toggleDailyHabit(id, memberId);
    loadData();
  };

  const handleAddHabit = (habitData) => {
    addDailyHabit(habitData);
    loadData();
  };

  const handleDeleteHabit = (id) => {
    deleteDailyHabit(id);
    loadData();
  };

  // Family Members Handlers
  const handleAddFamilyMember = (memberData) => {
    addFamilyMember(memberData);
    loadData();
  };

  const handleDeleteFamilyMember = (id) => {
    if (window.confirm('Xóa thành viên gia đình này?')) {
      sound.playTrash();
      deleteFamilyMember(id);
      loadData();
    }
  };

  // Lost Mode Handlers
  const handleSaveLostMode = (petId, lostData) => {
    updatePetLostMode(petId, lostData);
    loadData();
  };

  // Medical OCR Pipeline Handler (Auto push 3-in-1: Schedule + Prescription + Expense)
  const handleOcrComplete = (ocrResult, petId) => {
    applyOcrAutoPipeline(ocrResult, petId);
    loadData();
  };

  // Omni-Channel Schedule Action (Done / Snooze)
  const handleOmniActionConfirm = (scheduleId, action) => {
    if (action === 'done') {
      toggleScheduleComplete(scheduleId);
    }
    loadData();
  };

  // 2-Way Vet Appointments Handlers
  const handleOpenVetBooking = (initialData = {}) => {
    sound.playPop();
    setVetBookingInitialData(initialData || {});
    setIsVetBookingModalOpen(true);
  };

  const handleSaveAppointment = (bookingData) => {
    const current = getAppointments();
    const exists = current.find(a => a.id === bookingData?.id);
    const created = exists ? bookingData : addAppointment(bookingData);
    setAppointments(getAppointments());
    return created;
  };

  const handleUpdateAppointment = (id, updates) => {
    updateAppointment(id, updates);
    setAppointments(getAppointments());
  };

  const handleDeleteAppointment = (id) => {
    try { sound?.playTrash?.() || sound?.playClick?.(); } catch {}
    deleteAppointment(id);
    setAppointments(getAppointments());
  };

  const pendingAppointmentsCount = (appointments || []).filter(a => a.status === 'Chờ duyệt').length;

  // Filtered schedules for current pet filter
  const displayedSchedules = selectedPetId === 'all'
    ? schedules
    : schedules.filter(s => s.petId === selectedPetId);

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = schedules.filter(s => s.date < todayStr && !s.completed).length;
  const todayCount = schedules.filter(s => s.date === todayStr && !s.completed).length;

  // PROTECTED ROUTE / AUTH GUARD:
  // Nếu chưa đăng nhập (!isAuthenticated || !currentUser) hoặc đang ở route /login:
  // Chặn Dashboard, ẩn hoàn toàn Sidebar và Header, chỉ hiển thị duy nhất form đăng nhập căn giữa toàn màn hình.
  if (!isAuthenticated || !currentUser || activeTab === 'login') {
    return (
      <GlobalErrorBoundary>
        <AuraBackground>
          <LoginPage
            onLoginSuccess={(user) => {
              setIsAuthenticated(true);
              setCurrentUser(user);
              try {
                localStorage.setItem('petcare_active_user', JSON.stringify(user));
                localStorage.setItem('petcare_current_user', JSON.stringify(user));
                localStorage.setItem('petcare_is_authenticated', 'true');
              } catch {}

              const isClinic = user?.role === 'CLINIC_ADMIN' || user?.role === 'vet_doctor';
              const targetPortal = isClinic ? 'CLINIC' : 'OWNER';
              setCurrentPortal(targetPortal);
              try {
                localStorage.setItem('petcare_current_portal', targetPortal);
              } catch {}

              loadData(user?.id);
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
  // WORKSPACE 1: CỔNG BÁC SĨ THÚ Y (CLINIC WORKSPACE / CLINIC OS - B2B)
  // Dành riêng cho Bác Sĩ / Quản trị viên phòng khám (CLINIC_ADMIN)
  // ============================================================================
  if (currentPortal === 'CLINIC') {
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
            : 'bg-transparent p-4 sm:p-6 lg:p-8 md:pl-28 overflow-y-auto custom-scrollbar'
        }`}>
          <div className={`${activeTab === 'dashboard' ? 'w-full h-full max-w-[1680px] mx-auto flex flex-col overflow-hidden' : activeTab === 'schedule' ? 'w-full max-w-[1680px] mx-auto flex-1 min-h-0 flex flex-col' : 'max-w-7xl mx-auto space-y-6 pb-12'}`}>
          
          {activeTab === 'dashboard' && (
            <DashboardView
              pets={pets}
              schedules={displayedSchedules}
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
        onDataChanged={loadData}
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
