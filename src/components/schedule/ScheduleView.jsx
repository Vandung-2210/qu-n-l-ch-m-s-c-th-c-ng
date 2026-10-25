import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  CalendarDays, 
  Calendar, 
  Calendar as CalendarIcon,
  LayoutList,
  ListTodo, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Clock, 
  MapPin, 
  Trash2, 
  Edit3, 
  Repeat, 
  Filter, 
  PawPrint, 
  AlertTriangle, 
  ChevronRight, 
  Layers, 
  Bell,
  Stethoscope,
  RefreshCw,
  Download,
  Share2,
  Syringe,
  Pill,
  Home,
  Check,
  Flame,
  ClipboardList
} from 'lucide-react';
import { ScheduleBadge } from '../common/Badges';
import { SCHEDULE_TYPES } from '../../constants/mockData';
import { CalendarMonthView } from './CalendarMonthView';
import DailyStreakChecklist from '../daily/DailyStreakChecklist';
import HabitsUnifiedView from './HabitsUnifiedView';
import { sound } from '../../services/soundService';
import { 
  generateIcsCalendar, 
  getAppointments, 
  saveActiveAppointments, 
  deleteAppointment,
  getPetsHealthData,
  updatePetWeight,
  normalizePetHealthKey
} from '../../services/storageService';
import { getTodayVnDate, getVnDateString } from '../../utils/dateUtils.js';

// DANH SÁCH THÚ CƯNG (RỖNG THEO MẶC ĐỊNH, CHỜ DỮ LIỆU THẬT TỪ NGƯỜI DÙNG)
export const PETS_LIST = [];

// BẢNG DANH SÁCH VIỆC CHĂM SÓC MẪU MẶC ĐỊNH TẠI NHÀ THEO YÊU CẦU CHO CẢ 3 BÉ
export const DEFAULT_HOME_ROUTINES = [];

// HELPER NHẬN DIỆN VÀ KHỚP THÚ CƯNG 2 CHIỀU CHUẨN XÁC GIỮA petId, petName VÀ TIÊU ĐỀ
export const isRoutineForPet = (routine, pet) => {
  if (!routine || !pet) return false;
  const pId = String(pet.id || '').toLowerCase().trim();
  const pAltId = String(pet.altId || '').toLowerCase().trim();
  const pName = String(pet.name || '').toLowerCase().trim();

  const rPetId = String(routine.petId || '').toLowerCase().trim();
  const rPetName = String(routine.petName || routine.pet_name || '').toLowerCase().trim();

  // Khớp chính xác theo petId
  if (rPetId && pId && rPetId === pId) return true;

  // Khớp chính xác theo petName
  if (rPetName && pName && (rPetName === pName || rPetName.includes(pName) || pName.includes(rPetName))) return true;

  return false;
};

// Không sử dụng dữ liệu lịch mẫu hardcode ban đầu
export const DEFAULT_SCHEDULES = [];

// HÀM ĐỊNH DẠNG NGÀY THÁNG AN TOÀN CHỐNG CRASH
export const safeFormatDate = (dateStr) => {
  try {
    if (!dateStr) return 'Chưa đặt ngày';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr ? String(dateStr) : 'Chưa đặt ngày';
  }
};

// HELPER GÁN ĐÍCH DANH TÊN BÉ THAY VÌ ĐỂ RỖNG "Bé: Thú cưng"
// Helper định danh tên bé từ safePets hoặc thuộc tính bản ghi
export const resolvePetName = (item, safePets = []) => {
  if (!item) return 'Chưa có tên';
  // 1. Tìm trong safePets theo petId
  const matchedPet = safePets.find(p => p && p.id === item.petId);
  if (matchedPet?.name && matchedPet.name.trim() && matchedPet.name !== 'Thú cưng') {
    return matchedPet.name;
  }
  // 2. Tìm tên trực tiếp
  const directName = item.petName || item.pet_name;
  if (directName && directName.trim() && directName !== 'Thú cưng') {
    return directName;
  }
  return 'Thú cưng';
};

const ScheduleViewInner = ({
  schedules: propSchedules,
  appointments: propAppointments,
  pets: propPets = [],
  habits: propHabits = [],
  familyMembers: propFamilyMembers = [],
  currentMemberId = 'fam-1',
  onToggleHabit = () => {},
  onAddHabit = () => {},
  onDeleteHabit = () => {},
  onToggleComplete = () => {},
  onOpenAddSchedule = () => {},
  onOpenEditSchedule = () => {},
  onDeleteSchedule = () => {},
  onDeleteAppointment: propOnDeleteAppointment,
  onOpenAiSchedule = () => {},
  onOpenOmniAlert,
  onOpenVetBooking,
  initialTab = 'clinical'
}) => {
  // 1. STATE ĐIỀU HƯỚNG CHÍNH (BẮT BUỘC KHAI BÁO ĐẦY ĐỦ):
  // scheduleViewMode nhận 1 trong 2 giá trị: 'clinical' (Lâm sàng) hoặc 'habits' (Việc thường nhật)
  const [scheduleViewMode, setScheduleViewMode] = useState(() => {
    const norm = String(initialTab || '').toLowerCase();
    return norm === 'habits' ? 'habits' : 'clinical';
  });

  // 2. STATE CHO CÁC CHẾ ĐỘ XEM CON (SUB-VIEWS):
  const [clinicalTab, setClinicalTab] = useState('list'); // 'list' | 'month'
  const [habitsTab, setHabitsTab] = useState('home_care'); // 'home_care' | 'checklist'

  // Compatibility aliases
  const activeMainTab = scheduleViewMode === 'habits' ? 'HABITS' : 'CLINICAL';
  const setActiveMainTab = (val) => setScheduleViewMode(String(val || '').toLowerCase() === 'habits' ? 'habits' : 'clinical');
  const clinicalSubTab = clinicalTab === 'month' || clinicalTab === 'calendar' ? 'CALENDAR' : 'LIST';
  const setClinicalSubTab = (val) => setClinicalTab(String(val || '').toLowerCase() === 'calendar' ? 'month' : String(val || '').toLowerCase());
  const habitsSubTab = habitsTab === 'checklist' ? 'CHECKLIST' : 'HOME_CARE';
  const setHabitsSubTab = (val) => setHabitsTab(String(val || '').toLowerCase());
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [filterPetId, setFilterPetId] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'
  const [selectedRoutinePetId, setSelectedRoutinePetId] = useState(() => propPets?.[0]?.id || '');

  useEffect(() => {
    if (!selectedRoutinePetId && propPets && propPets.length > 0) {
      setSelectedRoutinePetId(propPets[0].id);
    }
  }, [propPets, selectedRoutinePetId]);

  // Quản lý dữ liệu sức khỏe và cân nặng đồng bộ 2 chiều (Global / LocalStorage)
  const [petsHealthData, setPetsHealthData] = useState(() => getPetsHealthData());
  const activePetKey = normalizePetHealthKey(selectedRoutinePetId);
  const activePetWeightVal = petsHealthData[activePetKey]?.weight || '';
  const [currentWeightInput, setCurrentWeightInput] = useState(String(activePetWeightVal));

  useEffect(() => {
    setCurrentWeightInput(String(activePetWeightVal));
  }, [activePetWeightVal, selectedRoutinePetId]);

  useEffect(() => {
    const handleWeightChange = () => {
      setPetsHealthData(getPetsHealthData());
    };
    window.addEventListener('petcare_weight_updated', handleWeightChange);
    window.addEventListener('storage', handleWeightChange);
    return () => {
      window.removeEventListener('petcare_weight_updated', handleWeightChange);
      window.removeEventListener('storage', handleWeightChange);
    };
  }, []);

  const handleQuickUpdateWeight = async (e) => {
    e?.preventDefault?.();
    const val = parseFloat(currentWeightInput);
    if (isNaN(val) || val < 0.5 || val > 150) {
      alert('Vui lòng nhập cân nặng hợp lệ từ 0.5 đến 150 kg!');
      return;
    }

    try {
      // 1. Cập nhật state và storage toàn cục (Đồng bộ sang Dashboard & Server)
      const updatedHealth = await updatePetWeight(activePetKey, val);
      try { sound?.playSuccess?.(); } catch {}
      setPetsHealthData(updatedHealth);

      // 2. Cập nhật lại dòng mô tả liều lượng thuốc tẩy giun Drontal Plus
      const dewormDoseText = `Liều lượng ${(val / 10).toFixed(1)} viên theo cân nặng ${val}kg`;
      const updatedRoutines = homeRoutinesList.map(r => {
        if (isRoutineForPet(r, { id: activePetKey, name: activePetKey }) && 
            ((r.title || '').includes('Drontal') || (r.title || '').toLowerCase().includes('tẩy giun'))) {
          let newNotes = r.notes || '';
          if (newNotes.includes('Liều lượng') || newNotes.includes('viên')) {
            newNotes = newNotes.replace(/Liều lượng [^.]+(\.|$)/i, `${dewormDoseText}. Cho uống kèm thức ăn buổi sáng.`);
          } else {
            newNotes = `${dewormDoseText}. ${newNotes}`;
          }
          return { ...r, notes: newNotes };
        }
        return r;
      });
      setHomeRoutinesList(updatedRoutines);
      try {
        localStorage.setItem('petcare_home_routines', JSON.stringify(updatedRoutines));
      } catch {}
    } catch (err) {
      alert(err.message || 'Không thể lưu cân nặng lên máy chủ. Vui lòng thử lại.');
    }
  };

  // Khởi tạo state homeRoutinesList thuần túy từ bộ nhớ đã lưu, không tự tạo mock data
  const [homeRoutinesList, setHomeRoutinesList] = useState(() => {
    try {
      const saved = localStorage.getItem('petcare_home_routines');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error("Lỗi đọc storage routines:", err);
    }
    return [];
  });

  // Dữ liệu an toàn: tôn trọng propSchedules và propPets đã được lọc theo người dùng
  const rawSchedules = Array.isArray(propSchedules) ? propSchedules : [];

  // Dữ liệu lịch trình an toàn tôn trọng chính xác những gì người dùng đã nhập
  const cleanSchedules = useMemo(() => {
    const seen = new Set();
    const result = [];

    (rawSchedules || []).forEach((sch) => {
      if (!sch || typeof sch !== 'object') return;
      const pId = String(sch.petId || '').trim();
      const pTitle = String(sch.title || '').trim().toLowerCase();
      const pDate = String(sch.date || '').split('T')[0];
      const sig = `${sch.id || ''}__${pId}__${pDate}__${pTitle}`;

      // Bỏ qua nếu trùng bản ghi
      if (seen.has(sig)) return;
      seen.add(sig);
      result.push(sch);
    });

    return result;
  }, [rawSchedules]);

  const safeSchedules = cleanSchedules;

  // Quản lý danh sách ca hẹn lâm sàng với khả năng xóa ngay lập tức và đồng bộ 2 chiều
  const [appointmentsList, setAppointmentsList] = useState(() => {
    if (Array.isArray(propAppointments)) return propAppointments;
    return getAppointments();
  });

  useEffect(() => {
    if (Array.isArray(propAppointments)) {
      setAppointmentsList(propAppointments);
    }
  }, [propAppointments]);

  useEffect(() => {
    const handleAppointmentsChange = () => {
      setAppointmentsList(getAppointments());
    };
    window.addEventListener('petcare_appointments_updated', handleAppointmentsChange);
    window.addEventListener('storage', handleAppointmentsChange);
    return () => {
      window.removeEventListener('petcare_appointments_updated', handleAppointmentsChange);
      window.removeEventListener('storage', handleAppointmentsChange);
    };
  }, []);

  const safeAppointments = appointmentsList;
  const safePets = Array.isArray(propPets) ? propPets : [];

  // Dedup danh sách ca hẹn dựa trên ID hoặc đặc trưng cuộc hẹn
  const dedupedAppointments = useMemo(() => {
    const seenIds = new Set();
    const seenSignatures = new Set();

    return (safeAppointments || []).filter(app => {
      if (!app) return false;
      const pName = (app.petName || '').toLowerCase().trim();
      const srv = (app.service || '').toLowerCase().trim();
      const d = String(app.date || '').split('T')[0];
      const t = (app.time || '').trim();

      const idKey = app.id ? String(app.id) : null;
      const sigKey = `${app.petId || pName}__${d}__${t}__${srv}`;

      if (idKey && seenIds.has(idKey)) return false;
      if (seenSignatures.has(sigKey)) return false;

      if (idKey) seenIds.add(idKey);
      seenSignatures.add(sigKey);
      return true;
    });
  }, [safeAppointments]);

  const getPetCount = (pet) => {
    if (!pet) return 0;
    if (scheduleViewMode === 'home_routines' || (scheduleViewMode === 'habits' && habitsTab === 'home_care')) {
      return homeRoutinesList.filter(routine => isRoutineForPet(routine, pet)).length;
    }
    const pName = (pet.name || '').toLowerCase();
    if (scheduleViewMode === 'clinical' || activeMainTab === 'clinical' || activeMainTab === 'CLINICAL') {
      return dedupedAppointments.filter(a => {
        const aName = (a.petName || '').toLowerCase();
        return a.petId === pet.id || (pName && aName.includes(pName));
      }).length;
    }
    return safeSchedules.filter(s => s.petId === pet.id || isRoutineForPet(s, pet)).length;
  };

  const todayStr = getTodayVnDate();

  // Lọc dữ liệu an toàn theo pet, type, status
  const filteredSchedules = (safeSchedules || []).filter((sch) => {
    if (!sch || typeof sch !== 'object') return false;
    const matchPet = filterPetId === 'all' || sch.petId === filterPetId;
    const matchType = filterType === 'all' || sch.type === filterType;

    let matchStatus = true;
    const schDate = sch.date ? getVnDateString(sch.date) : '';

    if (filterStatus === 'today') {
      matchStatus = schDate === todayStr;
    } else if (filterStatus === 'upcoming') {
      matchStatus = Boolean(schDate && schDate > todayStr && !sch.completed);
    } else if (filterStatus === 'overdue') {
      matchStatus = Boolean(schDate && schDate < todayStr && !sch.completed);
    } else if (filterStatus === 'completed') {
      matchStatus = Boolean(sch.completed);
    }

    return matchPet && matchType && matchStatus;
  });

  // Helper chuẩn hóa category trạng thái: 'TODAY' | 'OVERDUE' | 'UPCOMING' | 'COMPLETED'
  const getItemStatusCategory = (item, refToday) => {
    if (!item) return 'UPCOMING';
    const st = String(item.status || '').toUpperCase().trim();
    const isCompleted = Boolean(item.completed) || st === 'COMPLETED' || st === 'HOÀN THÀNH' || st === 'ĐÃ KHÁM' || st === 'DONE';
    if (isCompleted) return 'COMPLETED';

    const isCancelled = st === 'CANCELLED' || st === 'HỦY' || st === 'CANCEL';
    if (isCancelled) return 'CANCELLED';

    const d = item.date ? getVnDateString(item.date) : '';
    if (!d) return 'UPCOMING';

    if (st === 'OVERDUE' || (d < refToday && !item.completed)) {
      return 'OVERDUE';
    }
    if (st === 'TODAY' || d === refToday) {
      return 'TODAY';
    }
    return 'UPCOMING';
  };

  // Helper kiểm tra item có thuộc về pet đang lọc không (dựa trên petId và tên thực tế)
  const isItemForPet = (item, petId) => {
    if (!item || !petId || petId === 'all') return true;
    const selectedPet = safePets.find(p => p.id === petId);
    const selectedPetName = (selectedPet?.name || '').toLowerCase().trim();
    const itemPetName = (item.petName || item.pet_name || '').toLowerCase().trim();
    const itemPetId = String(item.petId || '').toLowerCase().trim();
    const targetPetId = String(petId).toLowerCase().trim();

    if (itemPetId && targetPetId && itemPetId === targetPetId) return true;
    if (selectedPetName && itemPetName) {
      return itemPetName === selectedPetName || itemPetName.includes(selectedPetName) || selectedPetName.includes(itemPetName);
    }
    return false;
  };

  // TỔNG HỢP VÀ DEDUP TOÀN BỘ CÁC CA LÂM SÀNG (APPOINTMENTS + CLINICAL SCHEDULES)
  const allUniqueClinicalItems = useMemo(() => {
    const seenSignatures = new Set();
    const seenIds = new Set();
    const result = [];

    // 1. Nạp và dedup các ca hẹn từ appointments
    (dedupedAppointments || []).forEach((app, idx) => {
      if (!app) return;
      const id = app.id ? String(app.id) : `app-${idx}`;
      const pName = (app.petName || '').toLowerCase().trim();
      const d = app.date ? String(app.date).split('T')[0] : '';
      const t = app.time ? String(app.time).trim().padStart(5, '0') : '09:00';
      const srv = (app.service || app.title || '').toLowerCase().trim();
      const sig = `${app.petId || pName}__${d}__${t}__${srv}`;

      if (seenIds.has(id) || seenSignatures.has(sig)) return;
      seenIds.add(id);
      seenSignatures.add(sig);

      result.push({
        ...app,
        _itemType: 'appointment',
        _sortKey: `${d}T${t}`
      });
    });

    // 2. Nạp và dedup các lịch lâm sàng từ schedules (vet & vaccine)
    (safeSchedules || []).filter(s => s && (s.type === 'vet' || s.type === 'vaccine')).forEach((sch, idx) => {
      if (!sch) return;
      const id = sch.id ? String(sch.id) : `sch-clinic-${idx}`;
      const pName = resolvePetName(sch, safePets).toLowerCase().trim();
      const d = sch.date ? String(sch.date).split('T')[0] : '';
      const t = sch.time ? String(sch.time).trim().padStart(5, '0') : '09:00';
      const title = (sch.title || '').toLowerCase().trim();
      const sig = `${sch.petId || pName}__${d}__${t}__${title}`;

      if (seenIds.has(id) || seenSignatures.has(sig)) return;
      seenIds.add(id);
      seenSignatures.add(sig);

      result.push({
        ...sch,
        _itemType: 'schedule',
        _sortKey: `${d}T${t}`
      });
    });

    return result.sort((a, b) => a._sortKey.localeCompare(b._sortKey));
  }, [dedupedAppointments, safeSchedules, safePets]);

  // 1. CHUẨN HÓA BỘ ĐẾM ĐỘNG CHO CÁC TAB LỌC (COUNTS)
  const counts = useMemo(() => {
    const petItems = allUniqueClinicalItems.filter(item => isItemForPet(item, filterPetId));

    return {
      all: petItems.filter(i => getItemStatusCategory(i, todayStr) !== 'CANCELLED').length,
      today: petItems.filter(i => getItemStatusCategory(i, todayStr) === 'TODAY').length,
      upcoming: petItems.filter(i => getItemStatusCategory(i, todayStr) === 'UPCOMING').length,
      overdue: petItems.filter(i => getItemStatusCategory(i, todayStr) === 'OVERDUE').length,
      completed: petItems.filter(i => getItemStatusCategory(i, todayStr) === 'COMPLETED').length,
    };
  }, [allUniqueClinicalItems, filterPetId, todayStr]);

  // 2. SỬA LOGIC HIỂN THỊ KHI BẤM VÀO TỪNG TAB LỌC: CHỈ RENDER PHẦN TỬ CÓ STATUS TƯƠNG ỨNG
  const sortedClinicalItems = useMemo(() => {
    return allUniqueClinicalItems.filter(item => {
      // Lọc theo thú cưng
      if (!isItemForPet(item, filterPetId)) return false;

      // Lọc theo trạng thái
      const cat = getItemStatusCategory(item, todayStr);
      if (cat === 'CANCELLED') return false;

      if (filterStatus === 'all') return true;
      if (filterStatus === 'today') return cat === 'TODAY';
      if (filterStatus === 'upcoming') return cat === 'UPCOMING';
      if (filterStatus === 'overdue') return cat === 'OVERDUE';
      if (filterStatus === 'completed') return cat === 'COMPLETED';
      return true;
    });
  }, [allUniqueClinicalItems, filterPetId, filterStatus, todayStr]);

  // 2. Tự động đồng bộ các việc chăm sóc tại nhà mới được thêm/chỉnh sửa từ Modal vào homeRoutinesList
  useEffect(() => {
    if (!Array.isArray(propSchedules) || propSchedules.length === 0) return;

    setHomeRoutinesList(prevList => {
      let hasChanges = false;
      const currentMap = new Map(prevList.map(r => [String(r.id), r]));
      const nextList = [...prevList];

      propSchedules.forEach(sch => {
        if (!sch || !sch.id) return;
        // Bỏ qua lịch khám lâm sàng (vet, vaccine)
        if (sch.type === 'vet' || sch.type === 'vaccine') return;

        const schId = String(sch.id);
        const existing = currentMap.get(schId);

        if (!existing) {
          // Việc mới thêm từ Modal -> đưa vào đầu danh sách
          const petName = resolvePetName(sch, safePets);
          const dateStr = sch.date ? String(sch.date).split('T')[0] : '';
          const status = sch.completed ? 'completed' : (dateStr && dateStr < todayStr ? 'overdue' : (dateStr === todayStr ? 'today' : 'upcoming'));
          
          const newRoutine = {
            ...sch,
            petName: sch.petName || petName,
            status: sch.status || status,
            completed: Boolean(sch.completed)
          };
          nextList.unshift(newRoutine);
          currentMap.set(schId, newRoutine);
          hasChanges = true;
        } else {
          // Cập nhật khi chỉnh sửa nội dung hoặc đánh dấu hoàn thành
          if (
            existing.title !== sch.title ||
            existing.date !== sch.date ||
            existing.time !== sch.time ||
            existing.type !== sch.type ||
            existing.repeat !== sch.repeat ||
            existing.notes !== sch.notes ||
            existing.completed !== sch.completed ||
            existing.petId !== sch.petId
          ) {
            const idx = nextList.findIndex(r => String(r.id) === schId);
            if (idx !== -1) {
              nextList[idx] = {
                ...existing,
                ...sch,
                completed: Boolean(sch.completed),
                status: sch.completed ? 'completed' : (existing.status || 'upcoming')
              };
              hasChanges = true;
            }
          }
        }
      });

      if (hasChanges) {
        return nextList;
      }
      return prevList;
    });
  }, [propSchedules, safePets, todayStr]);

  // Helper xóa việc chăm sóc tại nhà an toàn
  const handleDeleteRoutine = (routineId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa việc chăm sóc này?')) {
      try { sound?.playTrash?.(); } catch {}
      const next = homeRoutinesList.filter(r => String(r.id) !== String(routineId));
      setHomeRoutinesList(next);
      try {
        localStorage.setItem('petcare_home_routines', JSON.stringify(next));
      } catch (e) {
        console.error("Lỗi cập nhật storage khi xóa routine:", e);
      }
      if (typeof onDeleteSchedule === 'function') {
        onDeleteSchedule(routineId);
      }
    }
  };

  // Helper xóa từng ca hẹn khám lâm sàng
  const handleDeleteAppointment = (appointmentId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa / hủy ca hẹn này?')) {
      try { sound?.playTrash?.() || sound?.playClick?.(); } catch {}
      deleteAppointment(appointmentId);
      setAppointmentsList(prev => (prev || []).filter(a => a && a.id !== appointmentId));
      if (typeof propOnDeleteAppointment === 'function') {
        try {
          propOnDeleteAppointment(appointmentId);
        } catch (e) {
          console.error("Lỗi gọi propOnDeleteAppointment:", e);
        }
      }
    }
  };


  // Helper mở modal Thêm Việc Mới đồng bộ chuẩn loại việc và bé được chọn
  const handleOpenAddSchedule = (e, defaultType = null, defaultDate = null, defaultPetId = null) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    try {
      sound?.playClick?.();
    } catch {}

    const isHomeCareActive = scheduleViewMode === 'home_routines' || (scheduleViewMode === 'habits' && habitsTab === 'home_care');
    const typeToUse = defaultType || (isHomeCareActive ? 'deworm' : null);
    // Nếu đang ở Home Routines, truyền chính xác mã bé đang được chọn vào Modal
    const activeTargetPet = (safePets || []).find(p => p.id === selectedRoutinePetId || p.altId === selectedRoutinePetId) || safePets[0];
    const petIdToUse = defaultPetId || (isHomeCareActive ? (activeTargetPet?.altId || activeTargetPet?.id || selectedRoutinePetId) : null);

    if (typeof onOpenAddSchedule === 'function') {
      try {
        onOpenAddSchedule(defaultDate || null, typeToUse, null, petIdToUse);
      } catch (err) {
        console.warn('Lỗi gọi onOpenAddSchedule:', err);
      }
    }
  };

  const handleTaskCheck = async (sch) => {
    if (!sch || !sch.id) return;

    try {
      await onToggleComplete(sch.id);

      // Cập nhật trạng thái trong homeRoutinesList (chỉ cập nhật bộ nhớ React, không lưu đè trong callback)
      setHomeRoutinesList(prev => {
        const exists = prev.some(item => String(item.id) === String(sch.id));
        if (!exists) return prev;
        return prev.map(item => {
          if (String(item.id) === String(sch.id)) {
            const nextCompleted = !item.completed;
            return {
              ...item,
              completed: nextCompleted,
              status: nextCompleted ? 'completed' : (item.date && getVnDateString(item.date) < todayStr ? 'overdue' : (getVnDateString(item.date) === todayStr ? 'today' : 'upcoming'))
            };
          }
          return item;
        });
      });

      if (!sch.completed) {
        try {
          sound?.playSuccess?.();
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 }
          });
        } catch {}
      }
    } catch (err) {
      console.warn('Không thể cập nhật lịch trình:', err);
    }
  };

  // Export iCal (.ics)
  const handleExportIcs = () => {
    try {
      sound?.playSuccess?.();
      const ics = generateIcsCalendar(safeSchedules, safePets);
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lich_cham_soc_thu_cung_${todayStr}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Lỗi xuất file iCal:', err);
    }
  };

  // Đảm bảo khi đang ở tab "Chăm Sóc Tại Nhà", số đếm Quá hạn chỉ tính trên danh sách chăm sóc tại nhà (2 thay vì 3)
  const isHomeCareActive = scheduleViewMode === 'home_routines' || (scheduleViewMode === 'habits' && habitsTab === 'home_care');
  const baseListForCounts = isHomeCareActive
    ? (safeSchedules || []).filter(s => s && s.type !== 'vet' && s.type !== 'vaccine')
    : (safeSchedules || []);

  const overdueCount = baseListForCounts.filter(s => s && s.date && getVnDateString(s.date) < todayStr && !s.completed).length;
  const todayCount = baseListForCounts.filter(s => s && s.date && getVnDateString(s.date) === todayStr && !s.completed).length;

  // KHỐI 1: LỊCH HẸN LÂM SÀNG (CLINICAL APPOINTMENTS) - CHỈ HIỂN THỊ KHI Ở TAB TIERED
  const renderClinicalAppointmentsSection = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/10 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30 flex items-center justify-center shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
              <span>1. Lịch Hẹn Lâm Sàng (Clinical Appointments)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/30 normal-case font-bold">
                Đồng bộ 2 chiều Phòng khám
              </span>
            </h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">Khám tại viện, tiêm vắc-xin, phẫu thuật và chỉ định từ Bác sĩ</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            id="btn-export-ics"
            onClick={handleExportIcs}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-300 dark:border-white/10 cursor-pointer active:scale-95"
            title="Xuất lịch ra file iCalendar (.ics)"
          >
            <Download size={14} />
            <span>Xuất lịch (.ics)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound?.playClick?.();
              if (typeof onOpenVetBooking === 'function') {
                onOpenVetBooking({ isAiVision: false });
              } else if (typeof onOpenAddSchedule === 'function') {
                onOpenAddSchedule(null, 'vet', 'Khám lâm sàng thú y');
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/20 cursor-pointer active:scale-95"
          >
            <Plus size={14} />
            <span>+ Đặt hẹn mới</span>
          </button>
        </div>
      </div>

      {sortedClinicalItems.length === 0 ? (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1E293B]/60 border border-dashed border-slate-300 dark:border-white/15 text-center text-slate-500 dark:text-slate-400 text-xs shadow-xs">
          Chưa có lịch khám lâm sàng nào cho thú cưng đang lọc. Bạn có thể bấm "+ Đặt Lịch Khám" để hẹn với Bác sĩ.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedClinicalItems.map((item, idx) => {
            if (item._itemType === 'appointment') {
              const app = item;
              const cat = getItemStatusCategory(app, todayStr);
              const isInProgress = String(app.status || '').toLowerCase() === 'in_progress';
              const petName = resolvePetName(app, safePets);

              return (
                <div 
                  key={app.id || `app-${idx}`}
                  className="p-4 rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-white/10 hover:border-cyan-400/40 transition-all shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-md space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">{app.id}</span>
                      
                      <div className="flex items-center gap-2">
                        {/* TRẠNG THÁI CHUẨN HÓA MÀU SẮC & RENDER RÕ RÀNG */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          cat === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40' :
                          cat === 'OVERDUE' ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40' :
                          cat === 'TODAY' ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/40' :
                          isInProgress ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/40' :
                          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                        }`}>
                          {cat === 'COMPLETED' ? '✓ Hoàn thành' :
                           cat === 'OVERDUE' ? '! Quá hạn' :
                           cat === 'TODAY' ? '● Hôm nay' :
                           isInProgress ? '• Đang khám' :
                           '• Đã đặt hẹn'}
                        </span>

                        {/* Nút Xóa Ca Khám */}
                        <button
                          type="button"
                          title="Xóa / Hủy lịch hẹn này"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAppointment(app.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-all duration-200 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{app.service || 'Khám tổng quát'}</h4>
                      <p className="text-xs text-cyan-700 dark:text-cyan-300 font-semibold mt-0.5">
                        Bệnh nhân: <strong className="text-slate-800 dark:text-white">{petName}</strong>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200/80 dark:border-white/5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>{safeFormatDate(app.date)}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono text-cyan-700 dark:text-cyan-300 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{app.time || '09:00'}</span>
                        </span>
                      </div>
                      {app.facility && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                          <span className="truncate">{app.facility}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {app.adminNote && (
                    <div className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-xl border border-amber-200 dark:border-amber-500/20 italic">
                      BS dặn: "{app.adminNote}"
                    </div>
                  )}
                </div>
              );
            }

            // Render thẻ schedule lâm sàng (Tiêm chủng / Khám răng / Siêu âm...)
            const sch = item;
            const petName = resolvePetName(sch, safePets);
            const schDate = sch.date ? String(sch.date).split('T')[0] : '';
            const isOverdue = Boolean(schDate && schDate < todayStr && !sch.completed);
            const isToday = Boolean(schDate && schDate === todayStr && !sch.completed);
            const isCompleted = Boolean(sch.completed);

            // Phân biệt dịch vụ tiêm chủng hay dịch vụ khám/thủ thuật khác (Cắt móng, mài răng, siêu âm tim...)
            const isVaccine = sch.type === 'vaccine' || 
              (sch.title || '').toLowerCase().includes('tiêm') || 
              (sch.title || '').toLowerCase().includes('vắc-xin');

            return (
              <div 
                key={sch.id}
                className="p-4 rounded-3xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-white/10 hover:border-emerald-400/40 transition-all shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-md space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500">#SCH-CLINIC</span>
                    
                    <div className="flex items-center gap-2">
                      {/* SỬA NGHỊCH LÝ THỜI GIAN: Thẻ quá hạn hiển thị rõ Quá hạn, không hiển thị Sắp đến hẹn */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isCompleted 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40' 
                          : isOverdue
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
                          : isToday
                          ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/40'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40'
                      }`}>
                        {isCompleted && '✓ Đã hoàn thành'}
                        {isOverdue && '! Quá hạn'}
                        {isToday && '● Hôm nay'}
                        {!isCompleted && !isOverdue && !isToday && '● Sắp đến hẹn'}
                      </span>

                      {/* Nút Xóa Lịch Khám / Tiêm */}
                      <button
                        type="button"
                        title="Xóa lịch hẹn này"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof onDeleteSchedule === 'function') {
                            onDeleteSchedule(sch.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-all duration-200 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{sch.title}</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                      Bé: <strong className="text-slate-800 dark:text-white">{petName}</strong>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-black/30 border border-slate-200/80 dark:border-white/5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{safeFormatDate(sch.date)}</span>
                      </span>
                      <span className="font-mono text-cyan-700 dark:text-cyan-300 font-bold">{sch.time || '09:30'}</span>
                    </div>
                    {sch.location && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-600 dark:text-cyan-400 shrink-0" />
                        <span className="truncate">{sch.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-white/10">
                  {/* NÚT HÀNH ĐỘNG: Phân biệt Tiêm vắc-xin vs Đã khám xong */}
                  <button
                    onClick={() => handleTaskCheck(sch)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isVaccine 
                        ? (sch.completed ? 'Đã tiêm xong' : 'Xác nhận tiêm xong')
                        : (sch.completed ? 'Đã khám xong' : 'Đã khám xong')}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderHomeRoutinesSection = (isStandalone = false) => {
    if (!safePets || safePets.length === 0) {
      return (
        <div className="w-full flex-1 flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border border-dashed border-slate-300 dark:border-white/10 my-6">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/20">
            <Home className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider mb-2">
            Chưa có thú cưng trong hồ sơ
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
            Vui lòng thêm thú cưng đầu tiên để thiết lập bảng chăm sóc tại nhà, nhắc nhở định kỳ và nhật ký sức khỏe.
          </p>
          <button
            type="button"
            onClick={() => {
              try { sound?.playClick?.(); } catch {}
              window.dispatchEvent(new CustomEvent('petcare_open_add_pet'));
            }}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Thêm thú cưng mới</span>
          </button>
        </div>
      );
    }

    // 1. Tìm thông tin thú cưng đang chọn (Active Pet)
    const activePet = safePets.find(p => 
      p.id === selectedRoutinePetId || 
      p.altId === selectedRoutinePetId ||
      String(p.name).toLowerCase() === String(selectedRoutinePetId).toLowerCase()
    ) || safePets[0];

    const normKey = normalizePetHealthKey(activePet.id || activePet.name);
    const dynamicWeightVal = petsHealthData[normKey]?.weight || activePet.weight || '';

    const resolvedActivePet = {
      ...activePet,
      name: activePet.name || 'Thú cưng',
      avatar: activePet.avatar || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=80',
      species: activePet.breed || activePet.species || 'Chưa cập nhật',
      age: activePet.age || 'Chưa cập nhật',
      weight: dynamicWeightVal ? `${dynamicWeightVal} kg` : 'Chưa có dữ liệu',
      gender: activePet.gender || 'Chưa cập nhật'
    };

    // 2. Danh sách tất cả việc của bé này (sử dụng helper isRoutineForPet nhận diện 2 chiều chuẩn xác)
    const allActivePetRoutines = homeRoutinesList.filter(routine => isRoutineForPet(routine, resolvedActivePet));

    // Khắc phục logic số học (Derived Stats): Đảm bảo đẳng thức logic total = completed + today + overdue (+ upcoming nếu có)
    const isRoutineCompleted = (r) => Boolean(r.completed || r.status === 'completed');
    const isRoutineOverdue = (r) => !isRoutineCompleted(r) && (r.status === 'overdue' || (r.date && getVnDateString(r.date) < todayStr && r.status !== 'today'));
    const isRoutineToday = (r) => !isRoutineCompleted(r) && !isRoutineOverdue(r) && (r.status === 'today' || (r.date && getVnDateString(r.date) === todayStr));
    const isRoutineUpcoming = (r) => !isRoutineCompleted(r) && !isRoutineOverdue(r) && !isRoutineToday(r);

    const completedCount = allActivePetRoutines.filter(isRoutineCompleted).length;
    const overdueCount = allActivePetRoutines.filter(isRoutineOverdue).length;
    const todayCount = allActivePetRoutines.filter(isRoutineToday).length;
    const upcomingCount = allActivePetRoutines.filter(isRoutineUpcoming).length;
    const totalCount = allActivePetRoutines.length;

    // 3. Danh sách việc hiển thị cho bé này (có lọc theo filterStatus: all, today, overdue, completed, upcoming)
    const activePetRoutines = allActivePetRoutines.filter(routine => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'completed') return isRoutineCompleted(routine);
      if (filterStatus === 'today') return isRoutineToday(routine);
      if (filterStatus === 'overdue') return isRoutineOverdue(routine);
      if (filterStatus === 'upcoming') return isRoutineUpcoming(routine);
      return true;
    });

    const progressPct = allActivePetRoutines.length > 0 
      ? Math.round((completedCount / allActivePetRoutines.length) * 100) 
      : 0;
    const currentPet = resolvedActivePet;
    const progressPercent = progressPct;

    return (
      <div className="w-full max-w-[1600px] mx-auto h-full flex-1 min-h-0 flex flex-col overflow-hidden">
        {/* Header trên cùng */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shrink-0">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
                <span>{isStandalone ? 'Bảng Chăm Sóc Tại Nhà' : '2. Lịch Chăm Sóc Tại Nhà (Home Routines)'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 normal-case font-bold">
                  Bé: {resolvedActivePet.name}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Không gian quản lý thói quen, vệ sinh, dinh dưỡng và nhỏ gáy định kỳ tại nhà
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">

            <button
              type="button"
              onClick={(e) => handleOpenAddSchedule(e, 'deworm', null, resolvedActivePet.altId || resolvedActivePet.id)}
              className="text-xs text-teal-300 hover:text-white font-bold flex items-center gap-1.5 cursor-pointer bg-teal-500/15 hover:bg-teal-500/25 px-3.5 py-2 rounded-xl border border-teal-500/30 transition-all shadow-xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Thêm việc mới</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* LƯỚI 2 CỘT TẬN DỤNG TOÀN BỘ MÀN HÌNH (12 COLS: 4 COLS - 8 COLS) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1 min-h-0 overflow-hidden pt-3">
          
          {/* ========================================================== */}
          {/* CỘT TRÁI (QUẢN LÝ THÚ CƯNG & TIẾN ĐỘ - 4 COLS): lg:col-span-4 */}
          {/* ========================================================== */}
          <div className="lg:col-span-4 h-full flex flex-col gap-3 overflow-hidden">

            {/* KHỐI 1: THANH MINI-TAB CHỌN NHANH 3 BÉ */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-2.5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-lg">
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 py-0.5 flex justify-between items-center mb-1">
                <span>Chọn Thú Cưng</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-mono">{safePets.length} bé</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {safePets.map((pet) => {
                  const isSelected = selectedRoutinePetId === pet.id || 
                                     selectedRoutinePetId === pet.altId || 
                                     String(selectedRoutinePetId).toLowerCase() === pet.name.toLowerCase();
                  const petTasks = homeRoutinesList.filter(r => isRoutineForPet(r, pet));
                  const petOverdue = petTasks.filter(r => isRoutineOverdue(r)).length;

                  return (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => {
                        try { sound?.playClick?.(); } catch {}
                        setSelectedRoutinePetId(pet.id);
                      }}
                      className={`relative flex flex-col items-center py-2 px-1 rounded-xl transition-all duration-200 border cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-50 dark:bg-cyan-500/20 border-cyan-300 dark:border-cyan-400 text-cyan-900 dark:text-white shadow-xs'
                          : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <div className="relative mb-1">
                        {pet.avatar ? (
                          <img
                            src={pet.avatar}
                            alt={pet.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-white/20"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-8 h-8 rounded-full border border-slate-200 dark:border-white/20 bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-400 ${pet.avatar ? 'hidden' : 'flex'}`}>
                          <PawPrint className="w-4 h-4" />
                        </div>
                        {petOverdue > 0 && (
                          <span className="absolute -top-1 -right-1.5 px-1 min-w-[14px] h-[14px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 animate-pulse">
                            {petOverdue}
                          </span>
                        )}
                      </div>

                      <span className={`text-xs font-bold truncate max-w-full ${isSelected ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {pet.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{petTasks.length} việc</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KHỐI 2: THẺ HỒ SƠ & BẢNG TIẾN ĐỘ (LẤP ĐẦY TOÀN BỘ CHIỀU CAO - KHÔNG CÒN KHOẢNG TRỐNG) */}
            <div className="flex-1 bg-white dark:bg-slate-900/60 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-4 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-2xl flex flex-col justify-between overflow-hidden">
              
              {/* 1. Header bé */}
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  {currentPet.avatar ? (
                    <img
                      src={currentPet.avatar}
                      alt={currentPet.name}
                      className="w-13 h-13 rounded-2xl object-cover border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/20"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-13 h-13 rounded-2xl border-2 border-slate-200 dark:border-white/20 bg-slate-100 dark:bg-slate-800 items-center justify-center text-slate-400 ${currentPet.avatar ? 'hidden' : 'flex'}`}>
                    <PawPrint className="w-6 h-6" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-md uppercase">
                    {currentPet.gender || 'Đực'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">{currentPet.name}</h3>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/20 truncate">
                      {currentPet.species}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {currentPet.age || '2.5 Tuổi'} • <span className="text-emerald-600 dark:text-emerald-400 font-bold">{dynamicWeightVal} kg</span>
                  </p>
                </div>
              </div>

              {/* Tích hợp tính năng Cân nặng trực tiếp vào Thẻ Hồ Sơ cao cấp */}
              {!isEditingWeight ? (
                <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⚖️</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      {dynamicWeightVal} kg
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                      +0.2 kg tuần này
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sound?.playClick?.();
                      setIsEditingWeight(true);
                    }}
                    title="Chỉnh sửa cân nặng"
                    className="p-1.5 rounded-xl text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    handleQuickUpdateWeight(e);
                    setIsEditingWeight(false);
                  }}
                  className="mt-3 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <span>⚖️</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="150"
                      autoFocus
                      value={currentWeightInput}
                      onChange={(e) => setCurrentWeightInput(e.target.value)}
                      className="w-18 px-2 py-1 text-xs font-bold text-center bg-slate-50 dark:bg-slate-900 border border-cyan-400 rounded-lg text-cyan-700 dark:text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                    <span className="text-xs text-slate-400">kg</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="submit"
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:opacity-90 rounded-lg shadow transition-all cursor-pointer active:scale-95"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentWeightInput(String(dynamicWeightVal));
                        setIsEditingWeight(false);
                      }}
                      className="px-2 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white rounded-lg transition-all cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </form>
              )}

              {/* 2. Thanh Tiến Độ Chăm Sóc */}
              <div className="bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-2xl border border-slate-200/80 dark:border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Tiến độ chăm sóc</span>
                  <span className="text-cyan-700 dark:text-cyan-300 font-bold font-mono">
                    {completedCount}/{totalCount} ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* 3. Lưới 4 Chỉ Số (Hiển thị trọn vẹn, không cắt chân) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Tổng việc</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 font-mono">{totalCount}</div>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">Đã xong</div>
                  <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mt-0.5 font-mono">{completedCount}</div>
                </div>
                <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-cyan-700 dark:text-cyan-300 uppercase font-semibold">Hôm nay</div>
                  <div className="text-sm font-bold text-cyan-700 dark:text-cyan-400 mt-0.5 font-mono">{todayCount}</div>
                </div>
                <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-rose-700 dark:text-rose-300 uppercase font-semibold">Quá hạn</div>
                  <div className="text-sm font-bold text-rose-700 dark:text-rose-400 mt-0.5 font-mono">{overdueCount}</div>
                </div>
              </div>

              {/* 4. Khối lời khuyên nhanh từ Dr. Paw (Lấp đầy không gian tinh tế) */}
              <div className="bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/80 dark:border-cyan-500/20 rounded-2xl p-2.5 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                <span className="text-sm">💡</span>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                  {overdueCount > 0 
                    ? `Bé ${currentPet.name} có ${overdueCount} việc quá hạn, hãy hoàn tất sớm để đảm bảo sức khỏe!` 
                    : `Thể trạng của ${currentPet.name} rất ổn định. Nhớ duy trì lịch uống nước và vận động nhé.`}
                </p>
              </div>

              {/* 5. Nút Thêm Việc Cho Bé */}
              <button
                type="button"
                onClick={(e) => handleOpenAddSchedule(e, 'deworm', null, currentPet.altId || currentPet.id)}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>+ Thêm việc cho {currentPet.name}</span>
              </button>
            </div>

          </div>

          {/* ========================================================== */}
          {/* CỘT PHẢI (DANH SÁCH CÔNG VIỆC CHĂM SÓC - 8 COLS): lg:col-span-8 */}
          {/* ========================================================== */}
          <div className="lg:col-span-8 flex-1 flex flex-col min-h-0 h-full bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-3xl p-5 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-none overflow-hidden">
            
            {/* Khối Header bên trên (Tiêu đề + Bộ lọc Tất cả / Hôm nay / Sắp tới / Quá hạn / Đã xong) - CỐ ĐỊNH Ở ĐỈNH */}
            <div className="flex-shrink-0 mb-4 pb-3 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Lịch Chăm Sóc Tại Nhà:</span>
                    <span className="text-cyan-600 dark:text-cyan-300">{resolvedActivePet.name}</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/30 font-bold">
                    {activePetRoutines.length} mục hiển thị
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Quản lý thuốc, tẩy giun, nhỏ gáy, spa và thực đơn bổ sung tại gia
                </p>
              </div>

              {/* Cụm nút lọc trạng thái dạng chip */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
                {[
                  { id: 'all', label: 'Tất cả', count: allActivePetRoutines.length },
                  { id: 'today', label: 'Hôm nay', count: todayCount },
                  { id: 'upcoming', label: 'Sắp tới', count: upcomingCount },
                  { id: 'overdue', label: 'Quá hạn', count: overdueCount, isAlert: overdueCount > 0 },
                  { id: 'completed', label: 'Đã xong', count: completedCount }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      try { sound?.playClick?.(); } catch {}
                      setFilterStatus(tab.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                      filterStatus === tab.id
                        ? tab.isAlert
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 font-black'
                          : 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                        : tab.isAlert
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30 dark:hover:bg-rose-500/25'
                        : 'bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200/80 text-slate-700 dark:bg-white/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      filterStatus === tab.id ? 'bg-black/20 text-current' : 'bg-slate-200/60 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Khối danh sách các thẻ công việc (Task Cards) - CUỘN ĐỘC LẬP NỘI BỘ VỚI ĐỆM ĐÁY PB-32 */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-32 space-y-3.5 custom-scrollbar">

              {activePetRoutines.length === 0 ? (
                /* EMPTY STATE */
                <div className="p-10 sm:p-12 rounded-3xl bg-slate-50 dark:bg-[#1E293B]/70 border border-dashed border-slate-300 dark:border-white/15 text-center space-y-4 shadow-xs dark:shadow-xl my-auto">
                  <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {filterStatus === 'all'
                        ? `Bé ${resolvedActivePet.name} chưa có lịch chăm sóc nào`
                        : `Không có việc nào của bé ${resolvedActivePet.name} trong mục "${filterStatus === 'today' ? 'Hôm nay' : filterStatus === 'overdue' ? 'Quá hạn' : filterStatus === 'completed' ? 'Đã xong' : 'Sắp tới'}"`}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Hãy thiết lập lịch định kỳ như nhỏ gáy Broadline, tẩy giun, tắm spa hoặc uống men tiêu hóa cho bé {resolvedActivePet.name}.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => handleOpenAddSchedule(e, 'deworm', null, resolvedActivePet.altId || resolvedActivePet.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-400 hover:opacity-95 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Lên lịch chăm sóc cho {resolvedActivePet.name}</span>
                    </button>

                  </div>
                </div>
              ) : (
                activePetRoutines.map(sch => {
                  const schDate = sch.date ? getVnDateString(sch.date) : '';
                  const isOverdue = sch.status === 'overdue' || Boolean(schDate && schDate < todayStr && !sch.completed);
                  const isToday = sch.status === 'today' || schDate === todayStr;
                  const isUpcoming = sch.status === 'upcoming' || Boolean(schDate && schDate > todayStr && !sch.completed);
                  const isDone = sch.completed || sch.status === 'completed';

                  return (
                    <div
                      key={sch.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                        isDone
                          ? 'bg-slate-50/70 dark:bg-[#1E293B]/40 border-slate-200/60 dark:border-white/5 opacity-65'
                          : isOverdue
                          ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-500/40 shadow-xs'
                          : isToday
                          ? 'bg-cyan-50/70 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-500/40 shadow-xs'
                          : 'bg-white dark:bg-[#1E293B] border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 shadow-[0_2px_10px_rgba(15,23,42,0.04)] dark:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleTaskCheck(sch)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-all shrink-0 active:scale-90 cursor-pointer"
                            title={isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-950" />
                            ) : (
                              <Circle className="w-5 h-5 hover:stroke-emerald-500" />
                            )}
                          </button>

                          <div className="min-w-0 space-y-1">
                            <h5 className={`text-sm sm:text-base font-bold leading-snug ${
                              isDone ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                            }`}>
                              {sch.title}
                            </h5>
                            
                            {/* Meta info: Type Badge, Date, Time, Repeat, Location */}
                            <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-600 dark:text-slate-300">
                              <ScheduleBadge type={sch.type} />
                              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                                <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                                <span>{safeFormatDate(sch.date)}</span>
                                {sch.time && <span className="font-mono text-cyan-700 dark:text-cyan-300">• {sch.time}</span>}
                              </span>
                              {sch.repeat && sch.repeat !== 'none' && (
                                <span className="flex items-center gap-1 text-teal-700 dark:text-teal-300 font-semibold bg-teal-50 dark:bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-500/20">
                                  <Repeat className="w-3 h-3" />
                                  <span>
                                    {sch.repeat === 'daily' ? 'Hàng ngày' : 
                                     sch.repeat === 'weekly' ? 'Hàng tuần' : 
                                     sch.repeat === 'monthly' ? 'Hàng tháng' : 
                                     sch.repeat === 'quarterly' ? 'Hàng quý (3 tháng)' : 
                                     sch.repeat === 'yearly' ? 'Hàng năm' : sch.repeat}
                                  </span>
                                </span>
                              )}
                              {sch.location && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                  <span>{sch.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side: Status Badge + Action Buttons */}
                        <div className="shrink-0 flex items-center gap-2">
                          {isDone && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                              Đã xong
                            </span>
                          )}
                          {isOverdue && !isDone && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30 animate-pulse">
                              Quá hạn
                            </span>
                          )}
                          {isToday && !isDone && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30">
                              Hôm nay
                            </span>
                          )}
                          {isUpcoming && !isDone && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30">
                              Sắp tới
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => { sound?.playClick?.(); onOpenEditSchedule(sch); }}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 dark:hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer border border-slate-200 dark:border-white/5"
                            title="Sửa lịch"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoutine(sch.id)}
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer border border-rose-200 dark:border-rose-500/20"
                            title="Xóa việc"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Notes if any */}
                      {sch.notes && (
                        <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-black/40 p-3 rounded-xl border border-slate-200/80 dark:border-white/5 leading-relaxed flex items-start gap-2">
                          <span className="text-amber-500 dark:text-amber-400 text-sm">💡</span>
                          <span className="flex-1">
                            {((sch.title || '').includes('Drontal') || (sch.title || '').toLowerCase().includes('tẩy giun'))
                              ? `Liều lượng ${(dynamicWeightVal / 10).toFixed(1)} viên theo cân nặng ${dynamicWeightVal}kg. Cho uống kèm thức ăn buổi sáng.`
                              : sch.notes}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`font-sans select-none h-full flex flex-col overflow-hidden space-y-4 pb-2`}>
      
      {/* ============================================================ */}
      {/* 1. HAI TAB ĐIỀU HƯỚNG CHÍNH: CLINICAL vs HABITS */}
      {/* ============================================================ */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/70 dark:bg-slate-900/80 backdrop-blur-3xl border border-slate-200/80 dark:border-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.06)] w-fit shrink-0">
        <button
          type="button"
          onClick={() => {
            sound?.playClick?.();
            setScheduleViewMode('clinical');
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            scheduleViewMode === 'clinical'
              ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
          }`}
        >
          <Stethoscope className="w-4 h-4 stroke-[2.5]" />
          <span>Lịch Khám Lâm Sàng (Clinical)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound?.playClick?.();
            setScheduleViewMode('habits');
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            scheduleViewMode === 'habits'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/5'
          }`}
        >
          <Flame className="w-4 h-4 stroke-[2.5] fill-current" />
          <span>Thói Quen & Chăm Sóc (Habits)</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 2. SUB-NAVIGATION (CHỈ DÀNH CHO TAB LÂM SÀNG CLINICAL) */}
      {/* ============================================================ */}
      {scheduleViewMode === 'clinical' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="inline-flex items-center p-1.5 rounded-2xl bg-white/60 dark:bg-white/[0.08] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-sm gap-1.5">
            {/* Menu con CLINICAL 1: Danh Sách Ca Khám */}
            <button
              type="button"
              onClick={() => { sound?.playClick?.(); setClinicalTab('list'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                clinicalTab === 'list'
                  ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 shadow-md shadow-black/5 border border-slate-200/80 dark:border-cyan-400/30'
                  : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ClipboardList size={15} className="stroke-[2.5]" />
              <span>📋 Danh Sách Ca Khám</span>
            </button>

            {/* Menu con CLINICAL 2: Lịch Tháng Trực Quan */}
            <button
              type="button"
              onClick={() => { sound?.playClick?.(); setClinicalTab('month'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                clinicalTab === 'month' || clinicalTab === 'calendar'
                  ? 'bg-white dark:bg-cyan-500/20 text-cyan-800 dark:text-cyan-300 shadow-md shadow-black/5 border border-slate-200/80 dark:border-cyan-400/30'
                  : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon size={15} className="stroke-[2.5]" />
              <span>📅 Lịch Tháng Trực Quan</span>
            </button>
          </div>

          {/* Dynamic Status Filter Tabs (Chỉ hiển thị khi ở CLINICAL > Danh Sách Ca Khám) */}
          {clinicalTab === 'list' && (
            <div className="flex items-center gap-1.5 overflow-x-auto bg-white dark:bg-[#1E293B] p-1.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-xs">
              {[
                { id: 'all', label: `Tất cả (${counts.all})` },
                { id: 'today', label: `Hôm nay (${counts.today})` },
                { id: 'upcoming', label: `Sắp tới (${counts.upcoming})` },
                { id: 'overdue', label: `Quá hạn (${counts.overdue})`, isAlert: counts.overdue > 0 },
                { id: 'completed', label: `Đã xong (${counts.completed})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => { sound?.playClick?.(); setFilterStatus(tab.id); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    filterStatus === tab.id
                      ? tab.isAlert 
                        ? 'bg-rose-600 text-white shadow-md' 
                        : 'bg-cyan-600 text-white shadow-md'
                      : tab.isAlert
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. KHÔNG GIAN NỘI DUNG CHÍNH (MAIN VIEW CONTENT) */}
      {/* ============================================================ */}
      {scheduleViewMode === 'clinical' && (
        <>
          {clinicalTab === 'list' && (
            <div className="flex-1 min-h-0 flex flex-col space-y-4 overflow-hidden">
              {/* Header & Quick Actions */}
              <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/65 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/80 shadow-[0_12px_32px_rgba(6,182,212,0.08)]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-600 flex items-center justify-center shadow-md shadow-cyan-500/15 shrink-0">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                        Lịch Khám Lâm Sàng (Clinical)
                      </h1>
                      {counts.overdue > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                          {counts.overdue} ca quá hạn
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
                      Khám tại viện, tiêm chủng vắc-xin, phẫu thuật và chỉ định điều trị từ Bác sĩ thú y
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
                  <button
                    onClick={handleExportIcs}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white/80 hover:bg-white border border-slate-200 transition-all active:scale-95 cursor-pointer shadow-xs"
                    title="Tải file .ics để đồng bộ vào Google Calendar, Apple iCal hoặc Outlook"
                  >
                    <Download className="w-4 h-4 text-cyan-600" />
                    <span>Đồng bộ Calendar (iCal)</span>
                  </button>

                  {onOpenOmniAlert && (
                    <button
                      onClick={() => { sound?.playClick?.(); onOpenOmniAlert(); }}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 shadow-xs transition-all active:scale-95 cursor-pointer"
                      title="Báo Zalo, Telegram và SMS đa kênh"
                    >
                      <Bell className="w-4 h-4 text-indigo-600" />
                      <span>Báo Đa Kênh</span>
                    </button>
                  )}

                  <button
                    onClick={() => { sound?.playPop?.(); onOpenAiSchedule(); }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
                    <span>AI Tạo Lộ Trình</span>
                  </button>

                  {onOpenVetBooking && (
                    <button
                      onClick={() => { sound?.playClick?.(); onOpenVetBooking({ isAiVision: false }); }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-sky-500 hover:opacity-95 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer font-black"
                      title="Đặt lịch khám 2 chiều với Bác sĩ Thú y"
                    >
                      <Stethoscope className="w-4 h-4 stroke-[2.5]" />
                      <span>+ Đặt Lịch Khám</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleOpenAddSchedule(e, 'vet')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-95 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Thêm Ca Khám</span>
                  </button>
                </div>
              </div>

              {/* Bộ lọc nhanh theo thú cưng */}
              <div className="flex-shrink-0 flex items-center gap-2 overflow-x-auto bg-white/65 backdrop-blur-2xl p-2.5 rounded-2xl border border-white/80 shadow-[0_8px_24px_rgba(6,182,212,0.06)] no-scrollbar">
                <span className="text-xs font-bold text-slate-500 pl-2 shrink-0 flex items-center gap-1.5">
                  <PawPrint className="w-4 h-4 text-cyan-600" />
                  <span>Lọc theo Bé:</span>
                </span>

                <button
                  onClick={() => { sound?.playClick?.(); setFilterPetId('all'); }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    filterPetId === 'all'
                      ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-sm'
                      : 'bg-white/70 text-slate-600 hover:bg-white hover:text-slate-800 border border-slate-200/60'
                  }`}
                >
                  🐾 Tất cả thú cưng ({allUniqueClinicalItems.length})
                </button>

                {safePets.map(p => {
                  const count = getPetCount(p);
                  const isSelected = filterPetId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => { sound?.playClick?.(); setFilterPetId(p.id); }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                        isSelected
                          ? 'bg-cyan-50 text-cyan-700 border-cyan-300 shadow-sm'
                          : 'bg-white/70 text-slate-600 hover:bg-white hover:text-slate-800 border-slate-200/60'
                      }`}
                    >
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-4 h-4 rounded-full object-cover"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=50'; }}
                      />
                      <span>{p.name}</span>
                      <span className="text-[10px] font-mono opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Danh sách ca khám lâm sàng */}
              <div className="space-y-6 flex-1 min-h-0 overflow-y-auto pr-2 pb-16 custom-scrollbar">
                {renderClinicalAppointmentsSection()}
              </div>
            </div>
          )}

          {(clinicalTab === 'month' || clinicalTab === 'calendar' || clinicalSubTab === 'CALENDAR') && (
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
              <CalendarMonthView
                schedules={filteredSchedules}
                pets={safePets}
                onToggleComplete={handleTaskCheck}
                onOpenAddScheduleWithDate={(date) => handleOpenAddSchedule(null, null, date)}
              />
            </div>
          )}
        </>
      )}

      {scheduleViewMode === 'habits' && (
        <div className="w-full h-full overflow-hidden flex-1 min-h-0">
          <HabitsUnifiedView
            pets={safePets}
            homeRoutinesList={homeRoutinesList}
            setHomeRoutinesList={setHomeRoutinesList}
            selectedRoutinePetId={selectedRoutinePetId}
            setSelectedRoutinePetId={setSelectedRoutinePetId}
            petsHealthData={petsHealthData}
            setPetsHealthData={setPetsHealthData}
            onOpenAddSchedule={handleOpenAddSchedule}
            onOpenEditSchedule={onOpenEditSchedule}
            onDeleteSchedule={handleDeleteRoutine}
            onToggleComplete={handleTaskCheck}
            familyMembers={propFamilyMembers}
            currentMemberId={currentMemberId}
            todayStr={todayStr}
          />
        </div>
      )}

    </div>
  );
};

// ERROR BOUNDARY
class ScheduleErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ScheduleView ErrorBoundary caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4 max-w-2xl mx-auto backdrop-blur-xl">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">Đã kích hoạt chế độ an toàn Lịch trình</h3>
          <p className="text-xs text-rose-300 max-w-md mx-auto">
            {this.state.error?.message || 'Có xung đột dữ liệu định dạng ngày hoặc danh sách lịch hẹn.'}
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Khôi phục & Tải lại giao diện</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ScheduleView = (props) => (
  <ScheduleErrorBoundary>
    <ScheduleViewInner {...props} />
  </ScheduleErrorBoundary>
);

export default ScheduleView;
