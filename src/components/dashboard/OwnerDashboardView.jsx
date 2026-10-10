import React, { useState, useMemo, useEffect } from 'react';
import { WeeklyCalendar, formatDateKey } from './WeeklyCalendar';
import { getAppointments, getPetsHealthData, updatePetWeight, normalizePetHealthKey } from '../../services/storageService';
import { 
  Bell, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  CalendarCheck,
  Plus, 
  Sparkles, 
  Stethoscope, 
  PhoneCall, 
  Activity, 
  Heart, 
  Award, 
  Check, 
  MapPin, 
  User, 
  Bot, 
  FileText, 
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Flame,
  ChevronDown,
  Scale,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';
import { sound } from '../../services/soundService';
import { EmergencyModal } from '../emergency/EmergencyModal';

/**
 * OwnerDashboardView
 * Obsidian Spatial Canvas - Chủ Nuôi Dashboard
 * Color Theme:
 * - Canvas Background: Cosmic deep dark (#0B0C10)
 * - Card Texture: Frosted glass bg-[#151621]/90 backdrop-blur-2xl border border-white/[0.07] rounded-3xl p-5 shadow-2xl
 * - Primary Accent: Royal Indigo / Electronic Violet (indigo-500, #6366F1, violet-500)
 * - Secondary Accent: Neon Cyan / Emerald (cyan-400, emerald-400)
 */
export const OwnerDashboardView = ({
  pets = [],
  schedules = [],
  appointments: propAppointments = [],
  onToggleComplete = () => {},
  onOpenAddSchedule = () => {},
  onOpenAddPet = () => {},
  onOpenAiSchedule = () => {},
  onSelectPet = () => {},
  onNavigateTab = () => {},
  onAskAiPrompt = () => {},
  onOpenVetBooking = () => {},
  currentUser = null
}) => {
  const [selectedPetFilter, setSelectedPetFilter] = useState('all');
  const [selectedBiometricPet, setSelectedBiometricPet] = useState('mochi');
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => new Date());

  // Đồng bộ danh sách lịch hẹn lâm sàng
  const allAppointments = useMemo(() => {
    if (Array.isArray(propAppointments) && propAppointments.length > 0) {
      return propAppointments;
    }
    return getAppointments();
  }, [propAppointments]);

  // Lọc ca hẹn lâm sàng sắp tới trong tương lai (upcomingAppointment)
  const upcomingAppointment = useMemo(() => {
    const now = new Date();
    return (allAppointments || [])
      .filter(apt => {
        if (!apt || !apt.date) return false;
        const timeStr = apt.time ? (apt.time.length === 5 ? apt.time : apt.time.padStart(5, '0')) : '09:00';
        const aptDateTime = new Date(`${apt.date}T${timeStr}:00`);
        const st = String(apt.status || '').toUpperCase().trim();
        const isCancelled = st === 'CANCELLED' || st === 'HỦY' || st === 'CANCEL';
        const isCompleted = st === 'COMPLETED' || st === 'HOÀN THÀNH' || st === 'ĐÃ KHÁM' || Boolean(apt.completed);

        return !isNaN(aptDateTime.getTime()) && aptDateTime >= now && !isCancelled && !isCompleted;
      })
      .sort((a, b) => {
        const timeA = a.time ? (a.time.length === 5 ? a.time : a.time.padStart(5, '0')) : '09:00';
        const timeB = b.time ? (b.time.length === 5 ? b.time : b.time.padStart(5, '0')) : '09:00';
        return new Date(`${a.date}T${timeA}:00`) - new Date(`${b.date}T${timeB}:00`);
      })[0] || null;
  }, [allAppointments]);

  // Lịch sử cân nặng
  const [weightHistories, setWeightHistories] = useState(() => {
    try {
      const saved = localStorage.getItem('petcare_weight_tracker_histories');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  // State quản lý Hộp thoại (Modal) nhập cân nặng mới
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [weightModalWeek, setWeightModalWeek] = useState(39);
  const [weightModalValue, setWeightModalValue] = useState('');
  const [weightModalNote, setWeightModalNote] = useState('');
  const [weightModalError, setWeightModalError] = useState(null);

  const saveWeightHistories = (newHistories) => {
    setWeightHistories(newHistories);
    try {
      localStorage.setItem('petcare_weight_tracker_histories', JSON.stringify(newHistories));
    } catch {}
  };

  // Lắng nghe sự kiện đồng bộ cân nặng 2 chiều thời gian thực (từ Lịch Trình Habits hoặc cửa sổ khác)
  useEffect(() => {
    const handleWeightSync = () => {
      try {
        const saved = localStorage.getItem('petcare_weight_tracker_histories');
        if (saved) {
          setWeightHistories(JSON.parse(saved));
        } else {
          const hData = getPetsHealthData();
          const trackerFormat = {};
          Object.keys(hData).forEach(k => {
            trackerFormat[k] = (hData[k].weightHistory || []).map((item, idx) => ({
              week: parseInt(String(item.week).replace(/\D/g, ''), 10) || (36 + idx),
              label: item.week,
              weight: item.weight,
              date: item.date || '01/10',
              note: item.note || ''
            }));
          });
          setWeightHistories(trackerFormat);
        }
      } catch {}
    };

    // Chạy đồng bộ ngay khi mount để dữ liệu luôn tươi mới
    handleWeightSync();

    window.addEventListener('petcare_weight_updated', handleWeightSync);
    window.addEventListener('storage', handleWeightSync);
    return () => {
      window.removeEventListener('petcare_weight_updated', handleWeightSync);
      window.removeEventListener('storage', handleWeightSync);
    };
  }, []);

  // Danh sách 4 tuần gần nhất của bé đang chọn
  const currentPetWeightHistory = useMemo(() => {
    const list = weightHistories[selectedBiometricPet] || [];
    return [...list].sort((a, b) => a.week - b.week).slice(-4);
  }, [weightHistories, selectedBiometricPet]);

  const latestWeightItem = currentPetWeightHistory[currentPetWeightHistory.length - 1] || { weight: '', week: 39, label: 'Tuần 39' };
  const currentWeightVal = latestWeightItem.weight;

  // Dữ liệu sinh trắc học thời gian thực
  const biometricPets = useMemo(() => {
    const data = {};
    if (!pets || pets.length === 0) return data;
    pets.forEach(pet => {
      const history = weightHistories[pet.id] || [];
      const currentWeight = history.length > 0 ? history[history.length - 1].weight : null;
      const prevWeight = history.length > 1 ? history[history.length - 2].weight : currentWeight;
      const weightDiff = currentWeight && prevWeight ? Number((currentWeight - prevWeight).toFixed(2)) : null;
      
      let diffDesc = 'Chưa đủ dữ liệu để so sánh';
      if (weightDiff !== null) {
        if (weightDiff > 0) diffDesc = `+${weightDiff} kg so với lần trước`;
        else if (weightDiff < 0) diffDesc = `${weightDiff} kg so với lần trước`;
        else diffDesc = 'Không đổi so với lần trước';
      }

      data[pet.id] = {
        id: pet.id,
        name: pet.name,
        emoji: pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾',
        weight: currentWeight ? `${currentWeight} kg` : 'Chưa có dữ liệu',
        weightDiff: diffDesc,
        bcs: 'Chưa đánh giá',
        bodyStatus: 'Chưa có dữ liệu đánh giá (Dữ liệu tham khảo)',
        bodyScore: null,
        wsavaScore: null,
        wsavaStatus: 'Chưa có hồ sơ',
        wsavaNote: 'Cần cập nhật sổ tiêm phòng'
      };
    });
    return data;
  }, [weightHistories, pets]);

  const currentBiometricPet = biometricPets[selectedBiometricPet] || (pets.length > 0 ? biometricPets[pets[0].id] : null);

  // Handlers mở và lưu cân nặng
  const handleOpenWeightModal = () => {
    sound.playClick();
    setWeightModalWeek(latestWeightItem.week || 39);
    setWeightModalValue(String(currentWeightVal));
    setWeightModalNote('');
    setWeightModalError(null);
    setIsWeightModalOpen(true);
  };

  const handleSaveWeight = (e) => {
    e?.preventDefault?.();
    const val = parseFloat(weightModalValue);
    if (isNaN(val) || val <= 0 || val > 150) {
      setWeightModalError('Vui lòng nhập cân nặng hợp lệ (> 0 và ≤ 150 kg)');
      return;
    }

    const currentList = weightHistories[selectedBiometricPet] || [];
    const weekNum = parseInt(weightModalWeek, 10);
    const existingIndex = currentList.findIndex(item => item.week === weekNum);

    let updatedList;
    const noteText = weightModalNote.trim() || 'Cập nhật định kỳ';
    const labelText = weekNum === 39 ? 'Tuần 39 (Nay)' : `Tuần ${weekNum}`;

    if (existingIndex !== -1) {
      updatedList = currentList.map((item, idx) => 
        idx === existingIndex 
          ? { ...item, weight: val, note: noteText, label: labelText } 
          : item
      );
    } else {
      updatedList = [...currentList, {
        week: weekNum,
        label: labelText,
        weight: val,
        note: noteText
      }].sort((a, b) => a.week - b.week);
    }

    const nextHistories = {
      ...weightHistories,
      [selectedBiometricPet]: updatedList
    };

    saveWeightHistories(nextHistories);
    updatePetWeight(selectedBiometricPet, val, noteText);
    sound.playSuccess();
    showToast(`✓ Đã cập nhật cân nặng ${val} kg cho bé ${currentBiometricPet?.name || 'thú cưng'} thành công!`);
    setIsWeightModalOpen(false);
  };

  // Quản lý danh sách việc chăm sóc hôm nay
  const [dailyTasks, setDailyTasks] = useState([]);

  useEffect(() => {
    if (schedules && schedules.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todaySchedules = schedules.filter(s => s.date === today);
      setDailyTasks(todaySchedules.map((s, index) => ({
        id: s.id,
        title: s.title,
        pet: s.petName || 'Thú cưng',
        dueTime: s.time || 'Cả ngày',
        isCompleted: s.completed,
        color: index % 2 === 0 ? 'cyan' : 'indigo'
      })));
    } else {
      setDailyTasks([]);
    }
  }, [schedules]);

  const completedTasksCount = useMemo(() => {
    return dailyTasks.filter(t => t.isCompleted).length;
  }, [dailyTasks]);

  const handleToggleTask = (taskId) => {
    sound.playClick();
    setDailyTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.isCompleted;
        return {
          ...t,
          isCompleted: nextCompleted,
          progress: nextCompleted ? 100 : 0
        };
      }
      return t;
    }));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmAppointment = () => {
    sound.playSuccess();
    setAppointmentConfirmed(true);
    if (upcomingAppointment) {
      const parts = String(upcomingAppointment.date).split('T')[0].split('-');
      const dStr = parts[2] || '01';
      const mStr = parts[1] || '10';
      showToast(`✓ Đã xác nhận ca khám cho bé ${upcomingAppointment.petName || 'thú cưng'} ngày ${dStr}/${mStr} lúc ${upcomingAppointment.time || '09:30'} thành công!`);
    } else {
      const dStr = String(selectedCalendarDate.getDate()).padStart(2, '0');
      const mStr = String(selectedCalendarDate.getMonth() + 1).padStart(2, '0');
      showToast(`✓ Đã ghi nhận lịch hẹn ngày ${dStr}/${mStr} thành công!`);
    }
  };

  // Helper lấy style chuẩn Obsidian cho thẻ lộ trình lâm sàng
  const getTimelineStyles = (typeColor, type = '') => {
    const color = typeColor || (
      type.includes('KHẨN CẤP') || type.includes('WSAVA') ? 'rose' :
      type.includes('SẮP TỚI') || type.includes('KHÁM') ? 'cyan' :
      type.includes('NHẮC NHỞ') || type.includes('DINH DƯỠNG') || type.includes('ĐỊNH KỲ') ? 'indigo' :
      type.includes('SPA') || type.includes('VE RẬN') ? 'emerald' : 'indigo'
    );

    switch (color) {
      case 'rose':
        return {
          typeColor: 'rose',
          badgeClass: 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30',
          dotClass: 'bg-rose-500 ring-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.7)]',
          cardBorder: 'border-rose-500/30 dark:border-rose-500/20 hover:border-rose-400/50',
          cardBg: 'bg-rose-500/[0.03] dark:bg-rose-950/[0.12]'
        };
      case 'cyan':
        return {
          typeColor: 'cyan',
          badgeClass: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
          dotClass: 'bg-cyan-400 ring-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.7)]',
          cardBorder: 'border-cyan-500/30 dark:border-cyan-500/20 hover:border-cyan-400/50',
          cardBg: 'bg-cyan-500/[0.03] dark:bg-cyan-950/[0.12]'
        };
      case 'emerald':
        return {
          typeColor: 'emerald',
          badgeClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          dotClass: 'bg-emerald-400 ring-emerald-400/30 shadow-[0_0_10px_rgba(16,185,129,0.7)]',
          cardBorder: 'border-emerald-500/30 dark:border-emerald-500/20 hover:border-emerald-400/50',
          cardBg: 'bg-emerald-500/[0.03] dark:bg-emerald-950/[0.12]'
        };
      case 'indigo':
      default:
        return {
          typeColor: 'indigo',
          badgeClass: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
          dotClass: 'bg-indigo-400 ring-indigo-400/30 shadow-[0_0_10px_rgba(99,102,241,0.7)]',
          cardBorder: 'border-indigo-500/30 dark:border-indigo-500/20 hover:border-indigo-400/50',
          cardBg: 'bg-indigo-500/[0.03] dark:bg-indigo-950/[0.12]'
        };
    }
  };

  const getDoctorAvatar = (doctorName = '', petId = '') => {
    const d = String(doctorName || '').toLowerCase();
    if (d.includes('an')) return 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120';
    if (d.includes('mai')) return 'https://images.unsplash.com/photo-1594824813580-c0ff0f321422?auto=format&fit=crop&w=120';
    if (d.includes('sammi')) return 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120';
    if (d.includes('long')) return 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=120';
    if (d.includes('chủ')) return 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=120';
    return 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120';
  };

  const initialAppointments = [];

  const selectedDateKey = useMemo(() => {
    return formatDateKey(selectedCalendarDate);
  }, [selectedCalendarDate]);

  // Tiêu đề ngày được chọn trên lộ trình lâm sàng
  const selectedDayTitle = useMemo(() => {
    const todayKey = formatDateKey(new Date());
    const d = String(selectedCalendarDate.getDate()).padStart(2, '0');
    const m = String(selectedCalendarDate.getMonth() + 1).padStart(2, '0');
    if (selectedDateKey === todayKey) {
      return `Hôm nay (${d}/${m})`;
    }
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayName = days[selectedCalendarDate.getDay()];
    return `${dayName} (${d}/${m})`;
  }, [selectedCalendarDate, selectedDateKey]);

  // Tổng hợp lộ trình lâm sàng và lịch trình THEO ĐÚNG NGÀY ĐANG CHỌN (selectedDateKey)
  const activeDayTimelineItems = useMemo(() => {
    // 1. Lọc từ initialAppointments đúng theo ngày đang chọn
    const matchingInitial = initialAppointments
      .filter(apt => apt && apt.date === selectedDateKey)
      .map(apt => {
        const styles = getTimelineStyles(apt.typeColor, apt.type);
        return {
          ...apt,
          petKey: apt.petKey || apt.petId,
          priorityBadge: apt.priorityBadge || apt.type || 'Lâm Sàng',
          doctorAvatar: apt.doctorAvatar || getDoctorAvatar(apt.doctor, apt.petId),
          badgeClass: apt.badgeClass || styles.badgeClass,
          dotClass: apt.dotClass || styles.dotClass,
          cardBorder: apt.cardBorder || styles.cardBorder,
          cardBg: apt.cardBg || styles.cardBg
        };
      });

    // 2. Lọc các tác vụ từ props schedules đúng theo ngày đang chọn
    const fromSchedules = (schedules || [])
      .filter(s => s && s.date === selectedDateKey)
      .map(s => {
        const pet = (pets || []).find(p => p.id === s.petId);
        const petKey = pet?.species === 'cat' ? 'luna' : pet?.species === 'rabbit' ? 'banhbao' : 'mochi';
        const petName = pet?.name || s.petName || 'Thú cưng';
        
        const isVaccine = s.type === 'vaccine';
        const isVet = s.type === 'vet';
        const isDeworm = s.type === 'deworm';
        const isGrooming = s.type === 'grooming';
        const typeColor = isVaccine ? 'rose' : isVet ? 'cyan' : isDeworm ? 'emerald' : 'indigo';
        const styles = getTimelineStyles(typeColor);
        
        return {
          id: s.id,
          date: s.date,
          petId: petKey,
          petKey,
          petName,
          time: s.time || '10:00',
          period: (parseInt((s.time || '10').split(':')[0], 10) < 12) ? 'Sáng' : 'Chiều',
          typeColor,
          statusType: isVaccine ? 'urgent' : isVet ? 'upcoming' : 'reminder',
          priorityBadge: isVaccine ? 'Khẩn cấp • WSAVA' : isVet ? 'Lâm Sàng • Khám' : isDeworm ? 'Dự Phòng • Tẩy Giun' : isGrooming ? 'Chăm Sóc • Spa' : 'Định Kỳ',
          badgeClass: styles.badgeClass,
          dotClass: styles.dotClass,
          cardBorder: styles.cardBorder,
          cardBg: styles.cardBg,
          title: s.title,
          doctor: s.type === 'grooming' ? 'Chuyên viên Spa Paddy' : s.type === 'deworm' ? 'Chủ nuôi thực hiện' : 'BS. Nguyễn Văn An',
          doctorAvatar: pet?.avatar || getDoctorAvatar(s.type === 'grooming' ? 'Long' : 'An', petKey),
          room: s.location?.includes('nhà') ? 'Tại nhà' : 'Phòng 102',
          clinic: s.location || 'Bệnh viện PetHealth CS Cầu Giấy',
          desc: s.notes || 'Thực hiện chăm sóc và theo dõi thể trạng theo quy chuẩn thú y.'
        };
      });

    // Kết hợp và dedup các ca trùng tiêu đề/thời gian
    const combined = [...matchingInitial];
    fromSchedules.forEach(item => {
      if (!combined.some(c => c.id === item.id || (c.title === item.title && c.time === item.time))) {
        combined.push(item);
      }
    });

    return combined.sort((a, b) => (a.time || '09:00').localeCompare(b.time || '09:00'));
  }, [selectedDateKey, schedules, pets]);

  const filteredTimeline = useMemo(() => {
    if (selectedPetFilter === 'all') return activeDayTimelineItems;
    return activeDayTimelineItems.filter(item => {
      const pKey = (item.petKey || item.petId || '').toLowerCase();
      const pName = (item.petName || '').toLowerCase();
      if (selectedPetFilter === 'mochi' || selectedPetFilter === 'luna' || selectedPetFilter === 'banhbao') {
        return pKey === selectedPetFilter; // Keep logic if filters still use old ids
      }
      return pKey === selectedPetFilter;
    });
  }, [activeDayTimelineItems, selectedPetFilter]);

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden px-2 sm:px-4 py-2 select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-8 z-50 bg-[#1c1d2e] border border-indigo-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. KHU VỰC CHÀO MỪNG & THẺ THAO TÁC NHANH (GREETING & CHIPS) */}
      {/* ============================================================ */}
      <div className="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
        {/* Dòng chào hỏi */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Hi, {currentUser?.name || 'Mạnh Đinh'}!</span>
            <span className="text-xl">🐾</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {pets.length > 0 ? `Bạn đang chăm sóc ${pets.length} bé thú cưng.` : 'Bạn chưa thêm thú cưng nào.'}
          </p>
        </div>

        {/* Hàng 4 thẻ ngang nhỏ cạnh lời chào (Quick Action Chips) */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
          {/* 1. Nút tròn dấu cộng tím mở nhanh tác vụ mới */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenAddSchedule();
            }}
            title="Thêm tác vụ mới nhanh"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* 2. [ 📋 Lịch trình hôm nay ] */}
          <button
            onClick={() => {
              sound.playClick();
              onNavigateTab('schedule');
            }}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-[#151621]/90 hover:bg-slate-100 dark:hover:bg-[#1c1d2e] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-md shrink-0 cursor-pointer group"
          >
            <span className="text-sm">📋</span>
            <div className="text-left leading-tight">
              <p className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">Lịch trình hôm nay</p>
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">
                {dailyTasks.length - completedTasksCount > 0 
                  ? `${dailyTasks.length - completedTasksCount} việc cần hoàn thành` 
                  : 'Đã hoàn tất tất cả'}
              </p>
            </div>
          </button>

          {/* 3. [ 💉 Hộ chiếu WSAVA ] */}
          <button
            onClick={() => {
              sound.playClick();
              onNavigateTab('medical');
            }}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-[#151621]/90 hover:bg-slate-100 dark:hover:bg-[#1c1d2e] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-md shrink-0 cursor-pointer group"
          >
            <span className="text-sm">💉</span>
            <div className="text-left leading-tight">
              <p className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">Hộ chiếu WSAVA</p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-300 font-medium">Hạn vắc-xin 2026-2027</p>
            </div>
          </button>

          {/* 4. [ 🤖 Hỏi Bác Sĩ Dr. Paw ] */}
          <button
            onClick={() => {
              sound.playPop();
              onAskAiPrompt('Xin chào Bác sĩ Dr. Paw! Hôm nay thể trạng các bé Mochi, Luna và Bánh Bao thế nào?');
            }}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 hover:from-indigo-800 hover:to-purple-900 border border-indigo-500/40 text-white transition-all shadow-lg shadow-indigo-950/40 shrink-0 cursor-pointer group"
          >
            <span className="text-sm">🤖</span>
            <div className="text-left leading-tight">
              <p className="text-[11px] font-bold text-indigo-200 group-hover:text-white transition-colors">Hỏi Bác Sĩ Dr. Paw</p>
              <p className="text-[10px] text-emerald-400 font-medium">Trợ lý AI 24/7 trực tuyến</p>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. BỐ CỤC LƯỚI 3 CỘT (OBSIDIAN SPATIAL CANVAS GRID)           */}
      {/* ============================================================ */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3.5 sm:gap-4 overflow-hidden">
        
        {/* ============================================================ */}
        {/* ■ CỘT 1 (Trái - 4 Cols): THÔNG BÁO Y TẾ & VIỆC CHĂM SÓC     */}
        {/* ============================================================ */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3.5 min-h-0 h-full">
          
          {/* Card Trên: Thông Báo Y Tế & Dịch Tễ */}
          <div className="flex-1 min-h-0 bg-white/85 dark:bg-[#151621]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.07] rounded-3xl p-4 sm:p-5 shadow-lg dark:shadow-2xl flex flex-col justify-between overflow-hidden relative group hover:border-indigo-400/50 dark:hover:border-white/[0.12] transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/25">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Thông Báo Y Tế & Dịch Tễ
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30">
                2 Mới
              </span>
            </div>

            {/* Content Container */}
            <div className="flex-1 min-h-0 flex flex-col justify-around py-2 gap-2 overflow-y-auto custom-scrollbar">
              {/* 1. Cảnh báo ổ dịch Parvovirus */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 tracking-wider">
                      Cảnh Báo Ổ Dịch Khu Vực
                    </span>
                    <span className="text-[9px] text-amber-600/80 dark:text-amber-300/70">Bán kính 2.5km</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-900 dark:text-white leading-snug mt-0.5">
                    Phát hiện ổ dịch Parvovirus lây nhiễm tại khu vực Cầu Giấy.
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Khuyến cáo: Hạn chế cho bé tiếp xúc bãi cỏ công cộng và kiểm tra hạn tiêm vắc-xin 7 bệnh.
                  </p>
                </div>
              </div>

              {/* 2. Tin nhắn dặn dò từ Bác sĩ trực */}
              <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 flex items-start gap-2.5">
                <img 
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120" 
                  alt="BS Nguyễn Văn An" 
                  className="w-7 h-7 rounded-xl object-cover border border-indigo-400/40 shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                      BS. Nguyễn Văn An (PetHealth)
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">10m trước</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-200 mt-0.5 leading-snug">
                    "Theo dõi phản ứng sau tiêm của bé Mochi. Nếu thân nhiệt &gt;39.5°C hãy kích hoạt cấp cứu ngay."
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom mini link */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-[11px] shrink-0 text-slate-500 dark:text-slate-400">
              <span className="text-[10px]">Cập nhật từ Hệ thống Dịch tễ WSAVA</span>
              <button 
                onClick={() => onNavigateTab('medical')}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Chi tiết</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card Dưới: Việc Chăm Sóc Hôm Nay */}
          <div className="flex-1 min-h-0 bg-white/85 dark:bg-[#151621]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.07] rounded-3xl p-4 sm:p-5 shadow-lg dark:shadow-2xl flex flex-col justify-between overflow-hidden relative group hover:border-indigo-400/50 dark:hover:border-white/[0.12] transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/25">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Việc Chăm Sóc Hôm Nay
                </h2>
              </div>
              <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-400/30">
                {completedTasksCount} / {dailyTasks.length} hoàn thành
              </span>
            </div>

            {/* Tasks List */}
            <div className="flex-1 min-h-0 flex flex-col justify-around py-1 gap-2 overflow-y-auto custom-scrollbar">
              {dailyTasks.map(task => {
                const isTaskDone = Boolean(task.isCompleted);
                const dueDisplay = task.dueTime ? `Hạn ${task.dueTime}` : (task.deadline || 'Hôm nay');
                const petLabel = task.pet || task.petName || 'Mochi';
                const progressVal = task.progress !== undefined ? task.progress : (isTaskDone ? 100 : 0);

                return (
                  <div 
                    key={task.id} 
                    onClick={() => handleToggleTask(task.id)}
                    className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.06] transition-all cursor-pointer select-none group/task"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                          isTaskDone 
                            ? 'bg-cyan-500 dark:bg-cyan-400 border-cyan-500 dark:border-cyan-400 text-white dark:text-[#0B0C10]' 
                            : 'border-slate-300 dark:border-white/30 text-transparent group-hover/task:border-cyan-400'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className={`text-xs font-bold transition-all ${isTaskDone ? 'text-slate-400 dark:text-slate-500 line-through opacity-70' : 'text-slate-800 dark:text-white'}`}>
                          {task.title}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">({petLabel})</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">{dueDisplay}</span>
                      </div>
                    </div>

                    {/* Thanh tiến độ Cyan / Indigo */}
                    <div className="mt-2 w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          task.color === 'cyan' 
                            ? 'bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]' 
                            : task.color === 'indigo'
                            ? 'bg-indigo-600 dark:bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]'
                            : 'bg-slate-400 dark:bg-slate-600'
                        }`}
                        style={{ width: `${progressVal}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom action */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-[11px] shrink-0 text-slate-500 dark:text-slate-400">
              <span className="text-[10px]">Tự động đồng bộ với Smart Feeder</span>
              <button 
                onClick={() => onNavigateTab('schedule')}
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* ■ CỘT 2 (Giữa - 4 Cols): LỘ TRÌNH LÂM SÀNG & SOS CẤP CỨU 24/7 */}
        {/* ============================================================ */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3.5 min-h-0 h-full">
          
          {/* Card Trên: Lộ Trình Lâm Sàng & Điều Trị Hôm Nay */}
          <div className="flex-1 min-h-0 bg-white/85 dark:bg-[#151621]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.07] rounded-3xl p-4 sm:p-5 shadow-lg dark:shadow-2xl flex flex-col overflow-hidden relative group hover:border-indigo-400/50 dark:hover:border-white/[0.12] transition-colors">
            {/* Header with Title & Filter Tabs */}
            <div className="shrink-0 space-y-2 pb-2.5 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Stethoscope className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Lộ Trình Lâm Sàng & Lịch Trình • {selectedDayTitle}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {filteredTimeline.length} ca
                  </span>
                </div>
              </div>

              {/* Bộ lọc tab nhỏ: [ Tất cả ] [ Mochi ] [ Luna ] [ Bánh Bao ] */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#1b1c2a] border border-slate-200/80 dark:border-white/[0.06]">
                {[
                  { id: 'all', label: 'Tất cả' },
                  ...pets.map(p => ({ id: p.id, label: p.name }))
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedPetFilter(tab.id);
                    }}
                    className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      selectedPetFilter === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Danh sách Lộ trình dạng Timeline phát sáng & Thẻ Lâm sàng nối nhau */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 py-2 flex flex-col justify-start">
              {filteredTimeline.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-white/[0.04] border border-indigo-200/60 dark:border-white/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-sm mb-3">
                    <CalendarCheck className="w-6 h-6 stroke-[1.6]" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                    {selectedPetFilter !== 'all' 
                      ? `Không có ca khám nào của bé ${selectedPetFilter === 'mochi' ? 'Mochi' : selectedPetFilter === 'luna' ? 'Luna' : 'Bánh Bao'}` 
                      : 'Không có ca khám hoặc lịch trình nào'}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[240px]">
                    Ngày {selectedDayTitle} hiện không có lịch trình lâm sàng nào.
                  </p>
                  <div className="mt-3.5 flex items-center gap-2">
                    {selectedPetFilter !== 'all' ? (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          setSelectedPetFilter('all');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 transition-all cursor-pointer"
                      >
                        Xem tất cả các bé
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          onOpenAddSchedule();
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/30 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Thêm lịch hẹn</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTimeline.map((item, index) => (
                    <div key={item.id} className="relative pl-6 sm:pl-7 group">
                      {/* Đường kẻ dọc timeline phát sáng nối giữa các ca khám */}
                      {index !== filteredTimeline.length - 1 && (
                        <div className="absolute left-[9px] sm:left-[11px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 via-cyan-400/40 to-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.3)] pointer-events-none" />
                      )}

                      {/* Mốc giờ & Điểm chấm tròn Timeline phát sáng */}
                      <div className={`absolute left-1 sm:left-1.5 top-2.5 w-3.5 h-3.5 rounded-full ${item.dotClass} ring-4 transition-transform group-hover:scale-125 z-10`} />

                      {/* Thẻ lâm sàng chi tiết */}
                      <div className={`p-3 rounded-2xl ${item.cardBg} bg-white/60 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] border ${item.cardBorder} transition-all duration-300 shadow-xs hover:shadow-md space-y-2`}>
                        {/* Header của thẻ: Mốc giờ bên trái, Badge Ưu tiên & Tên thú cưng */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${item.badgeClass}`}>
                              {item.priorityBadge}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                              {item.petName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-700 dark:text-cyan-400 bg-slate-100 dark:bg-[#1b1c2a] px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.time}</span>
                          </div>
                        </div>

                        {/* Tiêu đề & Mô tả ca khám */}
                        <div>
                          <h3 className="text-xs font-black text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed line-clamp-2">
                            {item.desc}
                          </p>
                        </div>

                        {/* Bác sĩ phụ trách, Phòng khám & Cơ sở */}
                        <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img 
                              src={item.doctorAvatar} 
                              alt={item.doctor}
                              className="w-6 h-6 rounded-full object-cover border border-indigo-400/40 shrink-0" 
                            />
                            <div className="leading-tight truncate">
                              <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">{item.doctor}</p>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{item.clinic}</p>
                            </div>
                          </div>

                          <span className="text-[9px] px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-400/30 shrink-0">
                            {item.room}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Nút [ + Thêm lịch hẹn mới ] đặt ngay sát dưới danh sách thẻ, không bị đẩy trôi xuống đáy */}
              <div className="mt-2.5 shrink-0">
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenAddSchedule();
                  }}
                  className="w-full py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/35 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white border border-indigo-200 dark:border-indigo-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm lịch hẹn mới</span>
                </button>
              </div>
            </div>
          </div>

          {/* Nâng cấp Banner Cấp Cứu SOS ở đáy Cột 2 (Emergency SOS Card) */}
          <div className="mt-4 p-4 rounded-3xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900/60 border border-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.15)] flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
                <AlertTriangle size={20}/>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black tracking-wide text-rose-200 uppercase">Cấp Cứu Thú Y 24/7</h4>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">Xe sẵn sàng</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Bác sĩ trực cấp cứu trực tuyến • Hotline điều phối khẩn</p>
              </div>
            </div>
            <button 
              onClick={() => {
                sound.playAlert();
                setIsEmergencyModalOpen(true);
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-500/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <PhoneCall size={14}/>
              <span>Gọi SOS</span>
            </button>
          </div>

        </div>

        {/* ============================================================ */}
        {/* ■ CỘT 3 (Phải - 4 Cols): LỊCH TUẦN, CHỈ SỐ SINH HỌC & LỊCH HẸN */}
        {/* ============================================================ */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3.5 min-h-0 h-full">
          
          {/* Card 1: Lịch Tuần Trực Quan (Dynamic Weekly Calendar) */}
          <WeeklyCalendar
            selectedDate={selectedCalendarDate}
            onSelectDate={(date) => {
              setSelectedCalendarDate(date);
            }}
            schedules={[...initialAppointments, ...(schedules || [])]}
          />

          {/* Card 2: Chỉ Số Sinh Học & Sức Khỏe (Obsidian Spatial Biometric HUD) */}
          <div className="flex-1 min-h-0 bg-white/85 dark:bg-[#151621]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.07] rounded-3xl p-3.5 sm:p-4 shadow-lg dark:shadow-2xl flex flex-col justify-between overflow-y-auto custom-scrollbar relative group hover:border-indigo-400/50 dark:hover:border-white/[0.12] transition-colors gap-2.5">
            {/* 1. Header Widget: Bổ sung chọn bé */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-white/[0.06] shrink-0 gap-2">
              <div className="flex items-center gap-2">
                <Activity className="text-cyan-400 animate-pulse shrink-0" size={18} />
                <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Chỉ Số Sinh Học & Sức Khỏe
                </h2>
              </div>

              {/* Bộ chọn chuyển đổi nhanh giữa các bé có cân nặng thực tế */}
              <div className="relative shrink-0">
                <select
                  value={selectedBiometricPet}
                  onChange={(e) => {
                    sound.playClick();
                    setSelectedBiometricPet(e.target.value);
                  }}
                  className="appearance-none pl-2.5 pr-6 py-1 rounded-xl bg-slate-100 dark:bg-[#1b1c2a] hover:bg-slate-200 dark:hover:bg-[#232436] text-[11px] font-bold text-slate-800 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/30 shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400"
                >
                  {pets.map(pet => {
                    const history = weightHistories[pet.id] || [];
                    const currentWeight = history.length > 0 ? history[history.length - 1].weight : null;
                    return (
                      <option key={pet.id} value={pet.id} className="bg-[#151621] text-white">
                        {pet.species === 'cat' ? '🐱' : pet.species === 'dog' ? '🐶' : '🐾'} {pet.name} {currentWeight ? `• ${currentWeight} kg` : ''}
                      </option>
                    );
                  })}
                  {pets.length === 0 && (
                    <option value="" className="bg-[#151621] text-white">Chưa có thú cưng</option>
                  )}
                </select>
                <ChevronDown className="w-3 h-3 text-cyan-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. Hàng 1: Nâng cấp 2 Vòng tròn tiến độ Thể Trạng & Miễn Dịch (Glow Donut HUDs) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 shrink-0">
              {/* Vòng 1 (Thể Trạng) */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-cyan-500/25 hover:border-cyan-400/50 transition-all flex flex-col items-center text-center shadow-xs">
                {currentBiometricPet?.bodyScore !== null && currentBiometricPet?.bodyScore !== undefined ? (
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <defs>
                        <linearGradient id="cyanEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#22D3EE" />
                          <stop offset="100%" stopColor="#10B981" />
                        </linearGradient>
                      </defs>
                      <path
                        className="text-slate-200 dark:text-white/[0.07]"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        stroke="url(#cyanEmeraldGrad)"
                        strokeDasharray={`${currentBiometricPet.bodyScore}, 100`}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.75))' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono leading-none">
                        {currentBiometricPet.bodyScore}%
                      </span>
                      <span className="text-[8px] sm:text-[9px] text-cyan-600 dark:text-cyan-300 font-bold uppercase tracking-wider mt-0.5">
                        Thể Trạng
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-18 h-18 sm:w-20 sm:h-20 flex flex-col items-center justify-center bg-slate-100 dark:bg-white/[0.05] rounded-full border border-dashed border-slate-300 dark:border-white/20">
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 text-center px-2">Chưa có dữ liệu</span>
                  </div>
                )}

                <div className="mt-2 space-y-0.5">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {currentBiometricPet?.bodyStatus || 'Chưa có thông tin'}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                    {currentBiometricPet?.weightDiff || 'Cần thêm dữ liệu'}
                  </p>
                </div>
              </div>

              {/* Vòng 2 (Kháng Thể) */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-indigo-500/25 hover:border-indigo-400/50 transition-all flex flex-col items-center text-center shadow-xs">
                {currentBiometricPet?.wsavaScore !== null && currentBiometricPet?.wsavaScore !== undefined ? (
                  <div className="relative w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <defs>
                        <linearGradient id="indigoPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#6366F1" />
                          <stop offset="100%" stopColor="#A855F7" />
                        </linearGradient>
                      </defs>
                      <path
                        className="text-slate-200 dark:text-white/[0.07]"
                        strokeWidth="3.2"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        stroke="url(#indigoPurpleGrad)"
                        strokeDasharray={`${currentBiometricPet.wsavaScore}, 100`}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.75))' }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg sm:text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono leading-none">
                        {currentBiometricPet.wsavaScore}%
                      </span>
                      <span className="text-[8px] sm:text-[9px] text-indigo-600 dark:text-purple-300 font-bold uppercase tracking-wider mt-0.5">
                        Kháng Thể
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-18 h-18 sm:w-20 sm:h-20 flex flex-col items-center justify-center bg-slate-100 dark:bg-white/[0.05] rounded-full border border-dashed border-slate-300 dark:border-white/20">
                    <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 text-center px-2">Chưa có dữ liệu</span>
                  </div>
                )}

                <div className="mt-2 space-y-0.5">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {currentBiometricPet?.wsavaStatus || 'Chưa có hồ sơ'}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                    {currentBiometricPet?.wsavaNote || 'Cần cập nhật sổ tiêm phòng'}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. MODULE THEO DÕI CÂN NẶNG THEO TUẦN (WEIGHT TRACKER 4 WEEKS) */}
            <div className="bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 rounded-2xl p-3 space-y-2.5 shrink-0">
              {/* Header nhỏ: Tiêu đề + Nút Cập nhật tuần này */}
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 shrink-0" />
                  <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">
                    LỊCH SỬ CÂN NẶNG 4 TUẦN GẦN NHẤT
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenWeightModal}
                  disabled={!currentBiometricPet}
                  className={`px-2.5 py-1 rounded-xl font-bold text-[10px] border transition-all inline-flex items-center gap-1 shadow-xs ${currentBiometricPet ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30 cursor-pointer active:scale-95' : 'bg-slate-100 dark:bg-white/[0.05] text-slate-400 border-transparent cursor-not-allowed'}`}
                  title={currentBiometricPet ? "Cập nhật cân nặng tuần này" : "Vui lòng thêm thú cưng"}
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Cập nhật tuần này</span>
                </button>
              </div>

              {/* Giao diện hiển thị 4 tuần gần đây (Mini Progress / Card Grid & Mini Bar Chart) */}
              {(() => {
                if (!currentBiometricPet || currentPetWeightHistory.length === 0) {
                  return (
                    <div className="py-6 text-center">
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic">Chưa có dữ liệu cân nặng</p>
                    </div>
                  );
                }

                const weights = currentPetWeightHistory.map(w => w.weight);
                const maxW = Math.max(...weights, 1);
                const minW = Math.min(...weights, 0);
                const diffRange = maxW - minW;

                return (
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                    {currentPetWeightHistory.map((item, index) => {
                      const isLatest = index === currentPetWeightHistory.length - 1;
                      const prevItem = index > 0 ? currentPetWeightHistory[index - 1] : null;
                      const diff = prevItem ? Number((item.weight - prevItem.weight).toFixed(2)) : null;

                      // Tỷ lệ phần trăm chiều cao thanh bar trực quan
                      let barHeightPct = 50;
                      if (diffRange > 0) {
                        barHeightPct = Math.round(35 + (((item.weight - minW) / diffRange) * 55));
                      } else {
                        barHeightPct = 65;
                      }

                      return (
                        <div
                          key={`weight-wk-${item.week}`}
                          className={`relative p-2 rounded-xl flex flex-col items-center justify-between text-center transition-all ${
                            isLatest
                              ? 'bg-gradient-to-b from-cyan-500/15 to-emerald-500/10 border border-cyan-500/40 shadow-xs'
                              : 'bg-white/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5'
                          }`}
                        >
                          {/* Nhãn Tuần */}
                          <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 truncate w-full flex items-center justify-center gap-0.5">
                            <span>T.{item.week}</span>
                            {isLatest && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            )}
                          </div>

                          {/* Mini Bar Chart trực quan */}
                          <div className="w-full h-9 flex items-end justify-center my-1.5 px-1">
                            <div className="w-full max-w-[18px] bg-slate-200/80 dark:bg-slate-800/80 rounded-t-md h-full flex items-end overflow-hidden p-0.5">
                              <div
                                className={`w-full rounded-t-sm transition-all duration-500 ${
                                  isLatest
                                    ? 'bg-gradient-to-t from-emerald-500 to-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]'
                                    : 'bg-gradient-to-t from-indigo-500/80 to-indigo-400/80'
                                }`}
                                style={{ height: `${barHeightPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Số Cân Nặng (kg) */}
                          <div className="font-mono text-[11px] sm:text-xs font-black text-slate-900 dark:text-white leading-tight">
                            {item.weight} <span className="text-[9px] font-normal text-slate-500 dark:text-slate-400">kg</span>
                          </div>

                          {/* Chỉ số chênh lệch */}
                          <div className="mt-1">
                            {diff === null ? (
                              <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">
                                Mốc đầu
                              </span>
                            ) : diff > 0 ? (
                              <span className="inline-flex items-center text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded leading-none">
                                +{diff} kg
                              </span>
                            ) : diff < 0 ? (
                              <span className="inline-flex items-center text-[9px] font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded leading-none">
                                {diff} kg
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[9px] font-medium text-slate-500 dark:text-slate-400 bg-slate-500/10 px-1 py-0.5 rounded leading-none">
                                0.0 kg
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Tóm tắt tình trạng xu hướng */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-white/5 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 truncate">
                  <Activity className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>{currentBiometricPet?.name || 'Thú cưng'}: <strong>{currentBiometricPet?.weightDiff || 'Chưa có'}</strong></span>
                </span>
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold shrink-0 ml-1">
                  Mục tiêu: Dữ liệu tham khảo
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Lịch Hẹn Bác Sĩ Sắp Tới (Upcoming Appointment) */}
          <div className="shrink-0 bg-white/85 dark:bg-[#151621]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.07] rounded-3xl p-3.5 sm:p-4 shadow-lg dark:shadow-2xl relative group hover:border-indigo-400/50 dark:hover:border-white/[0.12] transition-colors space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Lịch Hẹn Bác Sĩ Sắp Tới
                </span>
              </div>
              {upcomingAppointment ? (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/30">
                  Sắp tới
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 font-medium">
                  Trống
                </span>
              )}
            </div>

            {upcomingAppointment ? (
              <>
                {/* Appointment Details */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {upcomingAppointment.facility || 'Bệnh viện Thú y PetHealth'}
                    </span>
                    <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold shrink-0 ml-2">
                      {(() => {
                        const parts = String(upcomingAppointment.date).split('T')[0].split('-');
                        const d = parts[2] || '01';
                        const m = parts[1] || '10';
                        return `${d}/${m} • ${upcomingAppointment.time || '09:00'}`;
                      })()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Bác sĩ: <strong className="text-slate-900 dark:text-white">{upcomingAppointment.assignedVet || 'BS. Nguyễn Văn An'}</strong> ({upcomingAppointment.service || 'Khám tổng quát'} • Bé: <strong className="text-indigo-600 dark:text-indigo-300">{upcomingAppointment.petName}</strong>)
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3 h-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">{upcomingAppointment.facility || '128 Cầu Giấy, Phường Quan Hoa, Hà Nội'}</span>
                  </div>
                </div>

                {/* 2 Nút hành động ở góc dưới: [ Đổi Lịch ] và [ ✓ Nhận Lịch ] */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      onOpenVetBooking(upcomingAppointment);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
                  >
                    Đổi Lịch
                  </button>

                  <button
                    onClick={handleConfirmAppointment}
                    disabled={appointmentConfirmed}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      appointmentConfirmed
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/40 active:scale-95'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{appointmentConfirmed ? 'Đã Nhận' : 'Nhận Lịch'}</span>
                  </button>
                </div>
              </>
            ) : (
              /* Thông báo trạng thái rỗng thân thiện */
              <div className="py-3 px-2 text-center space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Hiện không có lịch hẹn lâm sàng sắp tới
                </p>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    onOpenVetBooking();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold text-xs border border-indigo-200 dark:border-indigo-500/30 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Đặt lịch mới</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Modal Popup Nhập cân nặng mới */}
      {isWeightModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setIsWeightModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-[#151621] border border-slate-200 dark:border-cyan-500/30 rounded-3xl p-6 shadow-2xl space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Cập Nhật Cân Nặng Theo Tuần
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Bé {currentBiometricPet?.name || 'Thú cưng'} ({currentBiometricPet?.emoji || '🐾'}) • {currentBiometricPet?.bodyStatus || 'Chưa có thông tin'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWeightModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveWeight} className="space-y-4">
              {/* Chọn tuần */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mốc tuần ghi nhận
                </label>
                <select
                  value={weightModalWeek}
                  onChange={(e) => setWeightModalWeek(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value={39}>Tuần 39 (Hiện tại: 28/09 - 04/10/2026)</option>
                  <option value={40}>Tuần 40 (05/10 - 11/10/2026)</option>
                  <option value={38}>Tuần 38 (21/09 - 27/09/2026)</option>
                  <option value={37}>Tuần 37 (14/09 - 20/09/2026)</option>
                  <option value={36}>Tuần 36 (07/09 - 13/09/2026)</option>
                </select>
              </div>

              {/* Ô nhập số: Cân nặng (kg) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nhập cân nặng (kg) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="150"
                    placeholder="Ví dụ: 24.5"
                    value={weightModalValue}
                    onChange={(e) => {
                      setWeightModalValue(e.target.value);
                      if (weightModalError) setWeightModalError(null);
                    }}
                    autoFocus
                    required
                    className="w-full px-3 py-2.5 pr-12 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white text-sm font-bold font-mono focus:outline-none focus:border-cyan-400"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    kg
                  </span>
                </div>
                {weightModalError && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">
                    {weightModalError}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  Cân nặng trước đó: <strong className="text-slate-600 dark:text-slate-300">{currentWeightVal} kg</strong>
                </p>
              </div>

              {/* Ghi chú tùy chọn */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ghi chú tùy chọn
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Ăn hạt mới, Sau khi tẩy giun, Vừa triệt sản..."
                  value={weightModalNote}
                  onChange={(e) => setWeightModalNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-300 dark:border-white/15 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Nút hành động */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setIsWeightModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Lưu dữ liệu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Modal 24/7 */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        currentPet={currentBiometricPet || pets?.[0] || null}
      />
    </div>
  );
};

export default OwnerDashboardView;
