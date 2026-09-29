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
import { sound } from '../../services/soundService';
import { generateIcsCalendar, getAppointments, saveActiveAppointments, deleteAppointment } from '../../services/storageService';

// DANH SÁCH THÚ CƯNG CHUẨN ĐỂ PHÂN BẢNG CHĂM SÓC RIÊNG BIỆT CHO TỪNG BÉ
export const PETS_LIST = [
  { 
    id: 'mochi', 
    altId: 'pet-1',
    name: 'Mochi', 
    species: 'Chó Golden Retriever', 
    avatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300',
    age: '2.5 Tuổi',
    weight: '24.5 kg',
    gender: 'Đực',
    accentColor: 'amber',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    borderClass: 'border-amber-500/30 hover:border-amber-400/50',
    headerGradient: 'from-amber-500/15 via-amber-500/5 to-transparent',
    iconEmoji: '🐕'
  },
  { 
    id: 'luna', 
    altId: 'pet-2',
    name: 'Luna', 
    species: 'Mèo Anh Lông Ngắn (BSH)', 
    avatar: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=300',
    age: '1.5 Tuổi',
    weight: '4.2 kg',
    gender: 'Cái',
    accentColor: 'sky',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    borderClass: 'border-sky-500/30 hover:border-sky-400/50',
    headerGradient: 'from-sky-500/15 via-sky-500/5 to-transparent',
    iconEmoji: '🐱'
  },
  { 
    id: 'banh-bao', 
    altId: 'pet-3',
    name: 'Bánh Bao', 
    species: 'Thỏ Minilop', 
    avatar: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=300',
    age: '8 Tháng',
    weight: '1.8 kg',
    gender: 'Đực',
    accentColor: 'emerald',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    borderClass: 'border-emerald-500/30 hover:border-emerald-400/50',
    headerGradient: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    iconEmoji: '🐰'
  }
];

// BẢNG DANH SÁCH VIỆC CHĂM SÓC MẪU MẶC ĐỊNH TẠI NHÀ THEO YÊU CẦU CHO CẢ 3 BÉ
export const DEFAULT_HOME_ROUTINES = [
  // --- Mochi (petId: 'mochi') ---
  {
    id: 'routine-mochi-1',
    petId: 'mochi',
    petName: 'Mochi',
    title: 'Tắm spa, cắt móng & sấy lông chuyên sâu',
    date: '2026-10-22',
    time: '14:00',
    type: 'grooming',
    repeat: 'monthly',
    status: 'upcoming',
    completed: false,
    location: 'Tại nhà / Paddy Pet Spa',
    notes: 'Vệ sinh kỹ đệm chân, tỉa lông kẽ ngón và sấy khô hoàn toàn.'
  },
  {
    id: 'routine-mochi-2',
    petId: 'mochi',
    petName: 'Mochi',
    title: 'Nhỏ gáy phòng ve rận & ghẻ tai (Bravecto)',
    date: '2026-09-27',
    time: '19:00',
    type: 'deworm',
    repeat: 'monthly',
    status: 'overdue',
    completed: false,
    location: 'Tại nhà',
    notes: 'Vạch sát chân lông gáy để nhỏ thuốc. Không tắm trước và sau nhỏ 48 giờ.'
  },
  {
    id: 'routine-mochi-3',
    petId: 'mochi',
    petName: 'Mochi',
    title: 'Uống viên tẩy giun định kỳ Drontal Plus',
    date: '2026-09-30',
    time: '08:00',
    type: 'deworm',
    repeat: 'quarterly',
    status: 'upcoming',
    completed: false,
    location: 'Tại nhà',
    notes: 'Liều lượng 2.5 viên theo cân nặng 24.5kg. Cho uống kèm thức ăn buổi sáng.'
  },
  {
    id: 'routine-mochi-4',
    petId: 'mochi',
    petName: 'Mochi',
    title: 'Vệ sinh tai & nhỏ dung dịch sát khuẩn Epi-Otic',
    date: '2026-09-28',
    time: '20:00',
    type: 'grooming',
    repeat: 'weekly',
    status: 'today',
    completed: false,
    location: 'Tại nhà',
    notes: 'Nhỏ dung dịch vào ống tai ngoài, xoa nhẹ gốc tai 30s rồi lau sạch bằng bông gòn.'
  },
  {
    id: 'routine-mochi-5',
    petId: 'mochi',
    petName: 'Mochi',
    title: 'Bổ sung Glucosamine dưỡng khớp hông',
    date: '2026-09-28',
    time: '07:30',
    type: 'medicine',
    repeat: 'daily',
    status: 'today',
    completed: false,
    location: 'Tại nhà',
    notes: 'Uống 1 viên vào bữa sáng để bảo vệ khớp hông và cột sống.'
  },

  // --- Luna (petId: 'luna') ---
  {
    id: 'routine-luna-1',
    petId: 'luna',
    petName: 'Luna',
    title: 'Nhỏ gáy trị ve rận & giun sán Broadline',
    date: '2026-10-20',
    time: '19:00',
    type: 'deworm',
    repeat: 'monthly',
    status: 'upcoming',
    completed: false,
    location: 'Tại nhà',
    notes: 'Nhỏ tại điểm gáy mèo không với liếm được.'
  },
  {
    id: 'routine-luna-2',
    petId: 'luna',
    petName: 'Luna',
    title: 'Nhỏ gáy trị rận Revolution Plus',
    date: '2026-09-24',
    time: '20:00',
    type: 'deworm',
    repeat: 'monthly',
    status: 'overdue',
    completed: false,
    location: 'Tại nhà',
    notes: 'Phòng trị rận tai và giun chỉ tim.'
  },
  {
    id: 'routine-luna-3',
    petId: 'luna',
    petName: 'Luna',
    title: 'Trồng & cho ăn cỏ mèo tiêu búi lông',
    date: '2026-09-29',
    time: '09:00',
    type: 'medicine',
    repeat: 'weekly',
    status: 'upcoming',
    completed: false,
    location: 'Tại nhà',
    notes: 'Bổ sung chất xơ tự nhiên hỗ trợ đào thải búi lông ruột.'
  },

  // --- Bánh Bao (petId: 'banh-bao') ---
  {
    id: 'routine-banhbao-1',
    petId: 'banh-bao',
    petName: 'Bánh Bao',
    title: 'Bổ sung men vi sinh tiêu hóa & cỏ Alfalfa',
    date: '2026-09-28',
    time: '08:30',
    type: 'medicine',
    repeat: 'daily',
    status: 'today',
    completed: false,
    location: 'Tại nhà',
    notes: 'Trộn men vi sinh vào khẩu phần cỏ để đường ruột thỏ khỏe mạnh.'
  }
];

// HELPER NHẬN DIỆN VÀ KHỚP THÚ CƯNG 2 CHIỀU CHUẨN XÁC GIỮA petId, petName VÀ TIÊU ĐỀ
export const isRoutineForPet = (routine, pet) => {
  if (!routine || !pet) return false;
  const pId = String(pet.id || '').toLowerCase().trim();
  const pAltId = String(pet.altId || '').toLowerCase().trim();
  const pName = String(pet.name || '').toLowerCase().trim();

  const rPetId = String(routine.petId || '').toLowerCase().trim();
  const rPetName = String(routine.petName || routine.pet_name || '').toLowerCase().trim();
  const rTitle = String(routine.title || '').toLowerCase().trim();

  // 1. Khớp chính xác ID hoặc Alt ID (petId / altId)
  if (rPetId) {
    if (rPetId === pId || (pAltId && rPetId === pAltId)) return true;
    if ((pId === 'mochi' || pAltId === 'pet-1' || pName.includes('mochi')) && (rPetId === 'mochi' || rPetId === 'pet-1')) return true;
    if ((pId === 'luna' || pAltId === 'pet-2' || pName.includes('luna')) && (rPetId === 'luna' || rPetId === 'pet-2')) return true;
    if ((pId === 'banh-bao' || pAltId === 'pet-3' || pName.includes('bánh bao') || pName.includes('banh bao')) && 
        (rPetId === 'banh-bao' || rPetId === 'banhbao' || rPetId === 'pet-3')) return true;
  }

  // 2. Khớp theo petName
  if (pName && rPetName) {
    if (rPetName.includes(pName) || pName.includes(rPetName)) return true;
  }

  // 3. Khớp theo title
  if (pName && rTitle) {
    if (rTitle.includes(pName)) return true;
  }

  // 4. Khớp theo ngữ cảnh / từ khóa đặc thù từng bé
  if (pName.includes('mochi') || pId === 'mochi' || pAltId === 'pet-1') {
    if (rTitle.includes('golden') || rTitle.includes('drontal') || rTitle.includes('bravecto') || rTitle.includes('glucosamine') || rTitle.includes('epi-otic')) return true;
  }
  if (pName.includes('luna') || pId === 'luna' || pAltId === 'pet-2') {
    if (rTitle.includes('broadline') || rTitle.includes('revolution') || rTitle.includes('cỏ mèo') || rTitle.includes('bsh') || rTitle.includes('mèo')) return true;
  }
  if (pName.includes('bánh bao') || pName.includes('banh bao') || pId === 'banh-bao' || pAltId === 'pet-3') {
    if (rTitle.includes('alfalfa') || rTitle.includes('thỏ') || rTitle.includes('minilop')) return true;
  }

  return false;
};

// BỘ DỮ LIỆU MẪU DỰ PHÒNG CHUẨN THÚ Y TRONG THÁNG 09/2026
export const DEFAULT_SCHEDULES = [
  {
    id: 'sch-def-1',
    petId: 'pet-1',
    title: 'Tiêm phòng dại Rabisin & Vắc-xin 7 bệnh nhắc lại - Mochi (Golden)',
    type: 'vaccine',
    date: '2026-09-26',
    time: '09:30',
    location: 'Bệnh viện thú y PetHealth 262 Quang Trung',
    completed: false,
    notes: 'Mang theo sổ tiêm chủng của Mochi. Nhịn ăn sáng 2 tiếng trước khi tiêm.',
    repeat: 'yearly'
  },
  {
    id: 'sch-def-2',
    petId: 'pet-2',
    title: 'Nhỏ gáy trị ve rận & giun sán Broadline - Luna (Mèo BSH)',
    type: 'deworm',
    date: '2026-09-27',
    time: '19:00',
    location: 'Tại nhà',
    completed: false,
    notes: 'Không tắm cho mèo trước và sau khi nhỏ thuốc 48 tiếng.',
    repeat: 'monthly'
  },
  {
    id: 'sch-def-3',
    petId: 'pet-3',
    title: 'Khám kiểm tra mài răng cửa & cắt tỉa móng - Bánh Bao (Thỏ Minilop)',
    type: 'vet',
    date: '2026-09-28',
    time: '10:00',
    location: 'Phòng khám thú y Sammi Animal Clinic',
    completed: false,
    notes: 'Kiểm tra khớp cắn và răng cửa xem có mọc lệch gây đau miệng không.',
    repeat: 'quarterly'
  },
  {
    id: 'sch-def-4',
    petId: 'pet-1',
    title: 'Spa tắm sục ozone & cạo lông đệm chân - Mochi',
    type: 'grooming',
    date: '2026-09-29',
    time: '14:00',
    location: 'Paddy Pet Care & Grooming Spa',
    completed: false,
    notes: 'Vệ sinh tai và tuyến hôi hậu môn kỹ lưỡng.',
    repeat: 'monthly'
  },
  {
    id: 'sch-def-5',
    petId: 'pet-2',
    title: 'Siêu âm tim màu & Xét nghiệm sinh hóa máu định kỳ - Luna',
    type: 'vet',
    date: '2026-09-30',
    time: '08:30',
    location: 'Bệnh viện Thú y 2Vet Hospital',
    completed: false,
    notes: 'Nhịn ăn 6 tiếng trước giờ lấy mẫu máu kiểm tra chức năng thận.',
    repeat: 'yearly'
  },
  {
    id: 'sch-def-6',
    petId: 'pet-1',
    title: 'Uống viên tẩy giun định kỳ Drontal Plus (2.5 viên) - Mochi',
    type: 'deworm',
    date: '2026-09-30',
    time: '07:30',
    location: 'Tại nhà',
    completed: false,
    notes: 'Cho uống kèm thức ăn buổi sáng sau khi tập thể dục.',
    repeat: 'quarterly'
  },
  {
    id: 'sch-def-7',
    petId: 'pet-2',
    title: 'Bổ sung men vi sinh tiêu hóa & gel dinh dưỡng Megaderm - Luna',
    type: 'medicine',
    date: '2026-09-27',
    time: '08:30',
    location: 'Tại nhà',
    completed: false,
    notes: 'Trộn 1/2 gói gel dinh dưỡng vào thức ăn ướt buổi sáng.',
    repeat: 'monthly'
  },
  {
    id: 'sch-def-8',
    petId: 'pet-1',
    title: 'Nhỏ gáy phòng ve rận & ghẻ tai (Bravecto) - Mochi',
    type: 'deworm',
    date: '2026-09-28',
    time: '19:30',
    location: 'Tại nhà',
    completed: false,
    notes: 'Sử dụng Bravecto hoặc Nexgard / Frontline. Không tắm cho bé trong vòng 48h.',
    repeat: 'monthly'
  }
];

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
export const resolvePetName = (item, safePets = []) => {
  if (!item) return 'Mochi';
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
  // 3. Phân tích ngữ cảnh từ tiêu đề hoặc ghi chú
  const content = `${item.title || ''} ${item.service || ''} ${item.notes || ''} ${item.note || ''} ${item.petType || ''}`.toLowerCase();
  if (content.includes('mochi') || content.includes('golden')) return 'Mochi';
  if (content.includes('luna') || content.includes('bsh') || content.includes('mèo')) return 'Luna';
  if (content.includes('bánh bao') || content.includes('banh bao') || content.includes('thỏ') || content.includes('minilop')) return 'Bánh Bao';

  // 4. Theo petId
  if (item.petId === 'pet-1') return 'Mochi';
  if (item.petId === 'pet-2') return 'Luna';
  if (item.petId === 'pet-3') return 'Bánh Bao';

  // 5. Fallback luân phiên đích danh
  const hash = String(item.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const fallbacks = ['Mochi', 'Luna', 'Bánh Bao'];
  return fallbacks[hash % fallbacks.length];
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
  const [activeMainTab, setActiveMainTab] = useState(initialTab); // 'clinical' | 'habits'
  const [scheduleViewMode, setScheduleViewMode] = useState('tiered'); // 'tiered' (Phân tầng) | 'home_routines' (Chăm sóc tại nhà) | 'calendar' (Lịch tháng)
  const [filterPetId, setFilterPetId] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'
  const [selectedRoutinePetId, setSelectedRoutinePetId] = useState('mochi');

  // Khởi tạo state homeRoutinesList theo yêu cầu với cơ chế Data Seeding & Fallback
  const [homeRoutinesList, setHomeRoutinesList] = useState(() => {
    try {
      const saved = localStorage.getItem('petcare_home_routines');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.error("Lỗi đọc storage routines:", err);
    }
    localStorage.setItem('petcare_home_routines', JSON.stringify(DEFAULT_HOME_ROUTINES));
    return DEFAULT_HOME_ROUTINES;
  });

  // Dữ liệu an toàn với fallback vào localStorage và DEFAULT_SCHEDULES
  const rawSchedules = (Array.isArray(propSchedules) && propSchedules.length > 0)
    ? propSchedules
    : (() => {
        try {
          const saved = localStorage.getItem('petcare_schedules_v1') || localStorage.getItem('petcare_schedules');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          }
        } catch (e) {
          console.warn('Lỗi đọc petcare_schedules từ localStorage:', e);
        }
        return DEFAULT_SCHEDULES;
      })();

  // Chuẩn hóa và sửa triệt để các mock data có năm 2099, 2098 thành ngày hẹn thực tế trong tháng 09/2026
  const cleanSchedules = (rawSchedules || []).map((sch, idx) => {
    if (!sch || typeof sch !== 'object') return sch;
    const dateStr = sch.date ? String(sch.date).split('T')[0] : '';
    const yr = dateStr ? new Date(dateStr).getFullYear() : 0;
    
    // Phát hiện và sửa toàn bộ mock data có năm 2099, 2098 hoặc năm sai lệch ngoài khoảng thực tế 2024-2027
    if (dateStr.includes('2099') || dateStr.includes('2098') || yr >= 2028 || yr < 2024) {
      // Phân bổ vào các ngày hẹn thực tế từ 24/09/2026 đến 30/09/2026
      const realisticDay = 24 + (idx % 7);
      const formattedDay = realisticDay < 10 ? `0${realisticDay}` : `${realisticDay}`;
      return {
        ...sch,
        date: `2026-09-${formattedDay}`
      };
    }
    // Ca tẩy giun Drontal Plus đồng bộ chuẩn sang ngày 30/09/2026 theo yêu cầu
    if ((sch.title || '').includes('Drontal Plus') && (dateStr === '2026-09-28' || !dateStr)) {
      return {
        ...sch,
        date: '2026-09-30'
      };
    }
    // Dọn dẹp dữ liệu mock của Home Routines: sửa tên việc có chữ gõ test "cho kkk" thành tên chuẩn
    if (sch.title && (sch.title.includes('cho kkk') || sch.title.toLowerCase().includes('ghẻ tai cho kkk') || sch.title.includes('kkk'))) {
      return {
        ...sch,
        title: 'Nhỏ gáy phòng ve rận & ghẻ tai (Bravecto) - Mochi',
        petId: sch.petId || 'pet-1'
      };
    }
    return sch;
  }).filter(sch => Boolean(sch && sch.date));

  const safeSchedules = cleanSchedules.length > 0 ? cleanSchedules : DEFAULT_SCHEDULES;

  // Đồng bộ lại vào localStorage nếu phát hiện dữ liệu cũ năm 2099/2098 hoặc có tên gõ test kkk
  useEffect(() => {
    try {
      const hasInvalidYearsOrTest = (rawSchedules || []).some(s => {
        const d = s?.date ? String(s.date) : '';
        const title = s?.title || '';
        return d.includes('2099') || d.includes('2098') || title.includes('kkk');
      });
      if (hasInvalidYearsOrTest && cleanSchedules.length > 0) {
        localStorage.setItem('petcare_schedules_v1', JSON.stringify(cleanSchedules));
        localStorage.setItem('petcare_schedules', JSON.stringify(cleanSchedules));
      }
    } catch {}
  }, [rawSchedules]);

  // Quản lý danh sách ca hẹn lâm sàng với khả năng xóa ngay lập tức và đồng bộ 2 chiều
  const [appointmentsList, setAppointmentsList] = useState(() => {
    if (Array.isArray(propAppointments) && propAppointments.length > 0) return propAppointments;
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
  const safePets = (Array.isArray(propPets) && propPets.length > 0)
    ? propPets
    : [
        { id: 'pet-1', name: 'Mochi', avatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80' },
        { id: 'pet-2', name: 'Luna', avatar: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80' },
        { id: 'pet-3', name: 'Bánh Bao', avatar: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=600&q=80' }
      ];

  // 1. KHẮC PHỤC LỖI TRÙNG LẶP LỊCH HẸN TRONG ScheduleView.jsx:
  // - Làm sạch danh sách ca khám: Xóa các bản ghi trùng lặp nội dung "Cấp cứu & Xử lý sốc / Dị ứng cấp" của Mochi vào rạng sáng ngày 27/09.
  // - Thêm bộ lọc dedup tự động dựa trên mã id hoặc tổ hợp thời gian hẹn/dịch vụ để tránh việc dữ liệu test từ Admin làm tràn ngập màn hình Chủ nuôi.
  const dedupedAppointments = useMemo(() => {
    const seenIds = new Set();
    const seenSignatures = new Set();
    let hasSeenMochiEmergency = false;

    return (safeAppointments || []).filter(app => {
      if (!app) return false;
      const pName = (app.petName || '').toLowerCase().trim();
      const srv = (app.service || '').toLowerCase().trim();
      const d = String(app.date || '').split('T')[0];
      const t = (app.time || '').trim();

      // Kiểm tra ca cấp cứu trùng lặp của Mochi rạng sáng 27/09
      const isMochiEmergencyTest = pName.includes('mochi') && 
        (srv.includes('cấp cứu') || srv.includes('dị ứng') || srv.includes('sốc')) && 
        (d === '2026-09-27' || d.includes('27/09'));

      if (isMochiEmergencyTest) {
        if (hasSeenMochiEmergency) {
          return false; // Loại bỏ bản ghi trùng lặp thứ 2 trở đi
        }
        hasSeenMochiEmergency = true;
      }

      // Dedup tự động dựa trên id hoặc tổ hợp thời gian hẹn, dịch vụ, thú cưng
      const idKey = app.id ? String(app.id) : null;
      const sigKey = `${pName}__${d}__${t}__${srv}`;

      if (idKey && seenIds.has(idKey)) return false;
      if (seenSignatures.has(sigKey)) return false;

      if (idKey) seenIds.add(idKey);
      seenSignatures.add(sigKey);
      return true;
    });
  }, [safeAppointments]);

  // 2. SỬA HÀM TÍNH SỐ LƯỢNG CA THEO TỪNG BÉ (FILTER COUNTER):
  // Logic đếm số lượng ca khám chính xác theo yêu cầu:
  const mochiCount = dedupedAppointments.filter(a => a.petName?.toLowerCase().includes('mochi')).length;
  const lunaCount = dedupedAppointments.filter(a => a.petName?.toLowerCase().includes('luna')).length;
  const banhBaoCount = dedupedAppointments.filter(a => a.petName?.toLowerCase().includes('bánh bao')).length;

  const getPetCount = (pet) => {
    if (!pet) return 0;
    if (scheduleViewMode === 'home_routines') {
      return homeRoutinesList.filter(routine => isRoutineForPet(routine, pet)).length;
    }
    const pName = (pet.name || '').toLowerCase();
    if (activeMainTab === 'clinical') {
      if (pName.includes('mochi')) return mochiCount;
      if (pName.includes('luna')) return lunaCount;
      if (pName.includes('bánh bao') || pName.includes('banh bao')) return banhBaoCount;
      return dedupedAppointments.filter(a => {
        const aName = (a.petName || '').toLowerCase();
        return a.petId === pet.id || (pName && aName.includes(pName));
      }).length;
    }
    return safeSchedules.filter(s => s.petId === pet.id || (pet.altId && s.petId === pet.altId) || isRoutineForPet(s, pet)).length;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Lọc dữ liệu an toàn theo pet, type, status
  const filteredSchedules = (safeSchedules || []).filter((sch) => {
    if (!sch || typeof sch !== 'object') return false;
    const matchPet = filterPetId === 'all' || sch.petId === filterPetId;
    const matchType = filterType === 'all' || sch.type === filterType;

    let matchStatus = true;
    const schDate = sch.date ? String(sch.date).split('T')[0] : '';

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

  // TÁCH 2 PHÂN VÙNG DỮ LIỆU:
  // 1. Lịch hẹn Lâm sàng (Clinical Appointments)
  const clinicalAppointments = dedupedAppointments.filter(app => {
    if (filterPetId === 'all') return true;
    const selectedPet = safePets.find(p => p.id === filterPetId);
    const selectedPetName = selectedPet?.name?.toLowerCase() || '';
    const appPetName = (app.petName || '').toLowerCase();

    if (selectedPetName.includes('mochi')) return appPetName.includes('mochi');
    if (selectedPetName.includes('luna')) return appPetName.includes('luna');
    if (selectedPetName.includes('bánh bao') || selectedPetName.includes('banh bao')) {
      return appPetName.includes('bánh bao') || appPetName.includes('banh bao');
    }
    return app.petId === filterPetId || (selectedPetName && appPetName.includes(selectedPetName));
  });

  const clinicalSchedules = filteredSchedules.filter(s => s.type === 'vet' || s.type === 'vaccine');

  // Sắp xếp (sort) toàn bộ danh sách lịch hẹn lâm sàng theo thứ tự thời gian tăng dần từ gần nhất đến xa nhất
  const sortedClinicalItems = useMemo(() => {
    const appList = (clinicalAppointments || []).map(app => {
      const d = app.date ? String(app.date).split('T')[0] : '2026-09-28';
      const t = app.time ? String(app.time).trim().padStart(5, '0') : '09:00';
      return {
        ...app,
        _itemType: 'appointment',
        _sortKey: `${d}T${t}`
      };
    });

    const schList = (clinicalSchedules || []).map(sch => {
      const d = sch.date ? String(sch.date).split('T')[0] : '2026-09-28';
      const t = sch.time ? String(sch.time).trim().padStart(5, '0') : '09:00';
      return {
        ...sch,
        _itemType: 'schedule',
        _sortKey: `${d}T${t}`
      };
    });

    return [...appList, ...schList].sort((a, b) => a._sortKey.localeCompare(b._sortKey));
  }, [clinicalAppointments, clinicalSchedules]);

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
        try {
          localStorage.setItem('petcare_home_routines', JSON.stringify(nextList));
        } catch (e) {
          console.error("Lỗi lưu storage home routines:", e);
        }
        return nextList;
      }
      return prevList;
    });
  }, [propSchedules, safePets, todayStr]);

  // Helper xóa việc chăm sóc tại nhà an toàn
  const handleDeleteRoutine = (routineId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa việc chăm sóc này?')) {
      try { sound?.playTrash?.(); } catch {}
      setHomeRoutinesList(prev => {
        const next = prev.filter(r => String(r.id) !== String(routineId));
        try {
          localStorage.setItem('petcare_home_routines', JSON.stringify(next));
        } catch (e) {
          console.error("Lỗi cập nhật storage khi xóa routine:", e);
        }
        return next;
      });
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

  // Helper khôi phục danh sách việc mẫu mặc định cho cả 3 bé
  const handleResetHomeRoutines = () => {
    try {
      sound?.playSuccess?.();
      localStorage.setItem('petcare_home_routines', JSON.stringify(DEFAULT_HOME_ROUTINES));
      setHomeRoutinesList(DEFAULT_HOME_ROUTINES);
    } catch (e) {
      console.error("Lỗi khôi phục routines:", e);
    }
  };

  // Helper mở modal Thêm Việc Mới đồng bộ chuẩn loại việc và bé được chọn
  const handleOpenAddSchedule = (e, defaultType = null, defaultDate = null, defaultPetId = null) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    try {
      sound?.playClick?.();
    } catch {}

    const typeToUse = defaultType || (scheduleViewMode === 'home_routines' ? 'deworm' : null);
    // Nếu đang ở Home Routines, truyền chính xác mã bé đang được chọn vào Modal
    const activeTargetPet = PETS_LIST.find(p => p.id === selectedRoutinePetId || p.altId === selectedRoutinePetId);
    const petIdToUse = defaultPetId || (scheduleViewMode === 'home_routines' ? (activeTargetPet?.altId || selectedRoutinePetId) : null);

    if (typeof onOpenAddSchedule === 'function') {
      try {
        onOpenAddSchedule(defaultDate || null, typeToUse, null, petIdToUse);
      } catch (err) {
        console.warn('Lỗi gọi onOpenAddSchedule:', err);
      }
    }
  };

  const handleTaskCheck = (sch) => {
    if (!sch || !sch.id) return;
    try {
      sound?.playSuccess?.();
    } catch {}

    // Cập nhật trạng thái trong homeRoutinesList nếu việc thuộc danh sách này
    setHomeRoutinesList(prev => {
      const exists = prev.some(item => String(item.id) === String(sch.id));
      if (!exists) return prev;
      const next = prev.map(item => {
        if (String(item.id) === String(sch.id)) {
          const nextCompleted = !item.completed;
          return {
            ...item,
            completed: nextCompleted,
            status: nextCompleted ? 'completed' : (item.date && String(item.date).split('T')[0] < todayStr ? 'overdue' : 'upcoming')
          };
        }
        return item;
      });
      try {
        localStorage.setItem('petcare_home_routines', JSON.stringify(next));
      } catch {}
      return next;
    });

    onToggleComplete(sch.id);
    if (!sch.completed) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch {}
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
  const baseListForCounts = scheduleViewMode === 'home_routines'
    ? (safeSchedules || []).filter(s => s && s.type !== 'vet' && s.type !== 'vaccine')
    : (safeSchedules || []);

  const overdueCount = baseListForCounts.filter(s => s && s.date && String(s.date).split('T')[0] < todayStr && !s.completed).length;
  const todayCount = baseListForCounts.filter(s => s && s.date && String(s.date).split('T')[0] === todayStr && !s.completed).length;

  // KHỐI 1: LỊCH HẸN LÂM SÀNG (CLINICAL APPOINTMENTS) - CHỈ HIỂN THỊ KHI Ở TAB TIERED
  const renderClinicalAppointmentsSection = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-white/10 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-500/30 shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 flex-wrap">
              <span>1. Lịch Hẹn Lâm Sàng (Clinical Appointments)</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 normal-case font-bold">
                Đồng bộ 2 chiều Phòng khám
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Khám tại viện, tiêm vắc-xin, phẫu thuật và chỉ định từ Bác sĩ</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              sound?.playClick?.();
              if (typeof onOpenVetBooking === 'function') {
                onOpenVetBooking();
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
        <div className="p-6 rounded-2xl bg-[#1E293B]/60 border border-dashed border-white/15 text-center text-slate-400 text-xs">
          Chưa có lịch khám lâm sàng nào cho thú cưng đang lọc. Bạn có thể bấm "+ Đặt Lịch Khám" để hẹn với Bác sĩ.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedClinicalItems.map((item, idx) => {
            if (item._itemType === 'appointment') {
              const app = item;
              // Chuẩn hóa và khắc phục hoàn toàn lỗi badge rỗng:
              const st = String(app.status || '').toLowerCase().trim();
              const isCompleted = st === 'completed' || st === 'hoàn thành' || st === 'đã khám' || st === 'done';
              const isInProgress = st === 'in_progress' || st === 'đang khám' || st === 'tiếp nhận' || st === 'đã duyệt' || st === 'confirmed';
              const petName = resolvePetName(app, safePets);

              return (
                <div 
                  key={app.id || `app-${idx}`}
                  className="p-4 rounded-3xl bg-[#1E293B] border border-white/10 hover:border-cyan-400/40 transition-all shadow-md space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{app.id}</span>
                      
                      <div className="flex items-center gap-2">
                        {/* TRẠNG THÁI CHUẨN HÓA MÀU SẮC & RENDER RÕ RÀNG */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isCompleted ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          isInProgress ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' :
                          'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}>
                          {isCompleted ? '✓ Hoàn thành' :
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white truncate">{app.service || 'Khám tổng quát'}</h4>
                      <p className="text-xs text-cyan-300 font-semibold mt-0.5">
                        Bệnh nhân: <strong className="text-white">{petName}</strong>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1 text-xs text-slate-300">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{safeFormatDate(app.date)}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono text-cyan-300 font-bold">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{app.time || '09:00'}</span>
                        </span>
                      </div>
                      {app.facility && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 pt-0.5 truncate">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">{app.facility}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {app.adminNote && (
                    <div className="text-[11px] text-amber-200 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 italic">
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
                className="p-4 rounded-3xl bg-[#1E293B] border border-white/10 hover:border-emerald-400/40 transition-all shadow-md space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-slate-400">#SCH-CLINIC</span>
                    
                    <div className="flex items-center gap-2">
                      {/* SỬA NGHỊCH LÝ THỜI GIAN: Thẻ quá hạn hiển thị rõ Quá hạn, không hiển thị Sắp đến hẹn */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        isCompleted 
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                          : isOverdue
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : isToday
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
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
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white truncate">{sch.title}</h4>
                    <p className="text-xs text-slate-300 font-medium mt-0.5">
                      Bé: <strong className="text-white">{petName}</strong>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-black/30 border border-white/5 space-y-1 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{safeFormatDate(sch.date)}</span>
                      </span>
                      <span className="font-mono text-cyan-300 font-bold">{sch.time || '09:30'}</span>
                    </div>
                    {sch.location && (
                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                        <span className="truncate">{sch.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/10">
                  {/* NÚT HÀNH ĐỘNG: Phân biệt Tiêm vắc-xin vs Đã khám xong */}
                  <button
                    onClick={() => handleTaskCheck(sch)}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
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
    // 1. Tìm thông tin thú cưng đang chọn (Active Pet)
    const activePet = PETS_LIST.find(p => 
      p.id === selectedRoutinePetId || 
      p.altId === selectedRoutinePetId ||
      p.name.toLowerCase() === String(selectedRoutinePetId).toLowerCase()
    ) || PETS_LIST[0];

    // Đồng bộ thông tin từ safePets nếu có
    const matchSafe = safePets.find(sp => sp && (sp.id === activePet.id || sp.id === activePet.altId || sp.name?.toLowerCase() === activePet.name?.toLowerCase()));
    const resolvedActivePet = {
      ...activePet,
      name: matchSafe?.name || activePet.name,
      avatar: matchSafe?.avatar || activePet.avatar,
      species: matchSafe?.breed || matchSafe?.species || activePet.species,
      age: matchSafe?.age || activePet.age || '2.5 Tuổi',
      weight: matchSafe?.weight || activePet.weight || '24.5 kg',
      gender: matchSafe?.gender || activePet.gender || 'Đực'
    };

    // 2. Danh sách tất cả việc của bé này (sử dụng helper isRoutineForPet nhận diện 2 chiều chuẩn xác)
    const allActivePetRoutines = homeRoutinesList.filter(routine => isRoutineForPet(routine, resolvedActivePet));

    const completedCount = allActivePetRoutines.filter(r => r.completed || r.status === 'completed').length;
    const overdueCount = allActivePetRoutines.filter(r => (r.status === 'overdue' || (r.date && String(r.date).split('T')[0] < todayStr)) && !r.completed).length;
    const todayCount = allActivePetRoutines.filter(r => (r.status === 'today' || (r.date && String(r.date).split('T')[0] === todayStr)) && !r.completed).length;
    const upcomingCount = allActivePetRoutines.filter(r => (r.status === 'upcoming' || (r.date && String(r.date).split('T')[0] > todayStr)) && !r.completed && r.status !== 'overdue').length;

    // 3. Danh sách việc hiển thị cho bé này (có lọc theo filterStatus: all, today, overdue, completed, upcoming)
    const activePetRoutines = allActivePetRoutines.filter(routine => {
      const isDone = routine.completed || routine.status === 'completed';
      const isOver = !isDone && (routine.status === 'overdue' || (routine.date && String(routine.date).split('T')[0] < todayStr));
      const isTod = !isDone && !isOver && (routine.status === 'today' || (routine.date && String(routine.date).split('T')[0] === todayStr));
      const isUpc = !isDone && !isOver && !isTod && (routine.status === 'upcoming' || (routine.date && String(routine.date).split('T')[0] > todayStr));

      if (filterStatus === 'all') return true;
      if (filterStatus === 'completed') return isDone;
      if (filterStatus === 'today') return isTod;
      if (filterStatus === 'overdue') return isOver;
      if (filterStatus === 'upcoming') return isUpc;
      return routine.status === filterStatus;
    });

    const progressPct = allActivePetRoutines.length > 0 
      ? Math.round((completedCount / allActivePetRoutines.length) * 100) 
      : 0;
    const currentPet = resolvedActivePet;
    const totalCount = allActivePetRoutines.length;
    const progressPercent = progressPct;

    return (
      <div className="w-full max-w-[1600px] mx-auto h-[calc(100vh-190px)] flex flex-col overflow-hidden">
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
              onClick={handleResetHomeRoutines}
              title="Khôi phục lại danh sách việc mẫu chuẩn thú y cho cả 3 bé"
              className="text-xs text-slate-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Khôi phục dữ liệu gốc</span>
            </button>
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
          {/* ========================================================== */}
          {/* CỘT TRÁI (QUẢN LÝ THÚ CƯNG & TIẾN ĐỘ - 4 COLS): lg:col-span-4 */}
          {/* ========================================================== */}
          <div className="lg:col-span-4 h-full flex flex-col gap-3 overflow-hidden">

            {/* KHỐI 1: THANH MINI-TAB CHỌN NHANH 3 BÉ */}
            <div className="flex-shrink-0 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-lg">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-0.5 flex justify-between items-center mb-1">
                <span>Chọn Thú Cưng</span>
                <span className="text-cyan-400 font-mono">3 bé</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {PETS_LIST.map((pet) => {
                  const isSelected = selectedRoutinePetId === pet.id || 
                                     selectedRoutinePetId === pet.altId || 
                                     String(selectedRoutinePetId).toLowerCase() === pet.name.toLowerCase();
                  const petTasks = homeRoutinesList.filter(r => isRoutineForPet(r, pet));
                  const petOverdue = petTasks.filter(r => (r.status === 'overdue' || (r.date && String(r.date).split('T')[0] < todayStr)) && !r.completed).length;

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
                          ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                          : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      <div className="relative mb-1">
                        <img
                          src={pet.avatar}
                          alt={pet.name}
                          className="w-8 h-8 rounded-full object-cover border border-white/20"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=80'; }}
                        />
                        {petOverdue > 0 && (
                          <span className="absolute -top-1 -right-1.5 px-1 min-w-[14px] h-[14px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                            {petOverdue}
                          </span>
                        )}
                      </div>

                      <span className={`text-xs font-bold truncate max-w-full ${isSelected ? 'text-cyan-300' : 'text-slate-300'}`}>
                        {pet.name}
                      </span>
                      <span className="text-[10px] text-slate-400 opacity-80">{petTasks.length} việc</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* KHỐI 2: THẺ HỒ SƠ & BẢNG TIẾN ĐỘ (LẤP ĐẦY TOÀN BỘ CHIỀU CAO - KHÔNG CÒN KHOẢNG TRỐNG) */}
            <div className="flex-1 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-2xl flex flex-col justify-between overflow-hidden">
              
              {/* 1. Header bé */}
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img
                    src={currentPet.avatar}
                    alt={currentPet.name}
                    className="w-13 h-13 rounded-2xl object-cover border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/20"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=160'; }}
                  />
                  <span className="absolute -bottom-1 -right-1 text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded-md uppercase">
                    {currentPet.gender || 'Đực'}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white truncate">{currentPet.name}</h3>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 truncate">
                      {currentPet.species}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentPet.age || '2.5 Tuổi'} • <span className="text-emerald-400 font-bold">{currentPet.weight ? (String(currentPet.weight).toLowerCase().includes('kg') ? currentPet.weight : `${currentPet.weight} kg`) : '24.5 kg'}</span>
                  </p>
                </div>
              </div>

              {/* 2. Thanh Tiến Độ Chăm Sóc */}
              <div className="bg-white/[0.03] p-2.5 rounded-2xl border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Tiến độ chăm sóc</span>
                  <span className="text-cyan-300 font-bold font-mono">
                    {completedCount}/{totalCount} ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* 3. Lưới 4 Chỉ Số (Hiển thị trọn vẹn, không cắt chân) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Tổng việc</div>
                  <div className="text-sm font-bold text-white mt-0.5 font-mono">{totalCount}</div>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-emerald-300 uppercase font-semibold">Đã xong</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5 font-mono">{completedCount}</div>
                </div>
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-cyan-300 uppercase font-semibold">Hôm nay</div>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5 font-mono">{todayCount}</div>
                </div>
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2 text-center">
                  <div className="text-[10px] text-rose-300 uppercase font-semibold">Quá hạn</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5 font-mono">{overdueCount}</div>
                </div>
              </div>

              {/* 4. Khối lời khuyên nhanh từ Dr. Paw (Lấp đầy không gian tinh tế) */}
              <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-2xl p-2.5 text-xs text-slate-300 flex items-start gap-2">
                <span className="text-sm">💡</span>
                <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-300">
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
          <div className="lg:col-span-8 h-full flex flex-col bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 overflow-hidden">
            
            {/* Khối Header bên trên (Tiêu đề + Bộ lọc Tất cả / Hôm nay / Sắp tới / Quá hạn / Đã xong) - CỐ ĐỊNH Ở ĐỈNH */}
            <div className="flex-shrink-0 mb-4 pb-3 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>Lịch Chăm Sóc Tại Nhà:</span>
                    <span className="text-cyan-300">{resolvedActivePet.name}</span>
                  </h3>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold">
                    {activePetRoutines.length} mục hiển thị
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
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
                          : 'bg-cyan-500 text-slate-900 shadow-md shadow-cyan-500/30 font-black'
                        : tab.isAlert
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25'
                        : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      filterStatus === tab.id ? 'bg-black/20 text-current' : 'bg-white/10 text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Khối danh sách các thẻ công việc (Task Cards) - CUỘN ĐỘC LẬP NỘI BỘ */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3.5 custom-scrollbar">
              {activePetRoutines.length === 0 ? (
                /* EMPTY STATE */
                <div className="p-10 sm:p-12 rounded-3xl bg-[#1E293B]/70 border border-dashed border-white/15 text-center space-y-4 shadow-xl my-auto">
                  <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 max-w-md mx-auto">
                    <h4 className="text-base sm:text-lg font-bold text-white">
                      {filterStatus === 'all'
                        ? `Bé ${resolvedActivePet.name} chưa có lịch chăm sóc nào`
                        : `Không có việc nào của bé ${resolvedActivePet.name} trong mục "${filterStatus === 'today' ? 'Hôm nay' : filterStatus === 'overdue' ? 'Quá hạn' : filterStatus === 'completed' ? 'Đã xong' : 'Sắp tới'}"`}
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Hãy thiết lập lịch định kỳ như nhỏ gáy Broadline, tẩy giun, tắm spa hoặc uống men tiêu hóa cho bé {resolvedActivePet.name}.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={(e) => handleOpenAddSchedule(e, 'deworm', null, resolvedActivePet.altId || resolvedActivePet.id)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:opacity-95 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Lên lịch chăm sóc cho {resolvedActivePet.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetHomeRoutines}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-300 bg-white/10 hover:bg-white/15 border border-white/10 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Khôi phục việc mẫu chuẩn</span>
                    </button>
                  </div>
                </div>
              ) : (
                activePetRoutines.map(sch => {
                  const schDate = sch.date ? String(sch.date).split('T')[0] : '';
                  const isOverdue = sch.status === 'overdue' || Boolean(schDate && schDate < todayStr && !sch.completed);
                  const isToday = sch.status === 'today' || schDate === todayStr;
                  const isUpcoming = sch.status === 'upcoming' || Boolean(schDate && schDate > todayStr && !sch.completed);
                  const isDone = sch.completed || sch.status === 'completed';

                  return (
                    <div
                      key={sch.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                        isDone
                          ? 'bg-[#1E293B]/40 border-white/5 opacity-65'
                          : isOverdue
                          ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                          : isToday
                          ? 'bg-cyan-950/20 border-cyan-500/40 shadow-sm'
                          : 'bg-[#1E293B] border-white/10 hover:border-white/20 shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleTaskCheck(sch)}
                            className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-all shrink-0 active:scale-90 cursor-pointer"
                            title={isDone ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-950" />
                            ) : (
                              <Circle className="w-5 h-5 hover:stroke-emerald-400" />
                            )}
                          </button>

                          <div className="min-w-0 space-y-1">
                            <h5 className={`text-sm sm:text-base font-bold leading-snug ${
                              isDone ? 'line-through text-slate-400' : 'text-white'
                            }`}>
                              {sch.title}
                            </h5>
                            
                            {/* Meta info: Type Badge, Date, Time, Repeat, Location */}
                            <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-300">
                              <ScheduleBadge type={sch.type} />
                              <span className="flex items-center gap-1 text-slate-400">
                                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                <span>{safeFormatDate(sch.date)}</span>
                                {sch.time && <span className="font-mono text-cyan-300">• {sch.time}</span>}
                              </span>
                              {sch.repeat && sch.repeat !== 'none' && (
                                <span className="flex items-center gap-1 text-teal-300 font-semibold bg-teal-500/10 px-2 py-0.5 rounded-md border border-teal-500/20">
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
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  <span>{sch.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side: Status Badge + Action Buttons */}
                        <div className="shrink-0 flex items-center gap-2">
                          {isDone && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Đã xong
                            </span>
                          )}
                          {isOverdue && !isDone && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse">
                              Quá hạn
                            </span>
                          )}
                          {isToday && !isDone && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              Hôm nay
                            </span>
                          )}
                          {isUpcoming && !isDone && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              Sắp tới
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => { sound?.playClick?.(); onOpenEditSchedule(sch); }}
                            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer border border-white/5"
                            title="Sửa lịch"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRoutine(sch.id)}
                            className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer border border-rose-500/20"
                            title="Xóa việc"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Notes if any */}
                      {sch.notes && (
                        <div className="text-xs text-slate-300 bg-black/40 p-3 rounded-xl border border-white/5 leading-relaxed flex items-start gap-2">
                          <span className="text-amber-400 text-sm">💡</span>
                          <span className="flex-1">{sch.notes}</span>
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
    <div className={`font-sans select-none h-full flex flex-col overflow-hidden ${scheduleViewMode === 'home_routines' ? 'space-y-3 pb-0' : 'space-y-4 pb-2'}`}>
      
      {/* ============================================================ */}
      {/* 2 MAIN TABS: LỊCH KHÁM LÂM SÀNG (CLINICAL) vs VIỆC THƯỜNG NHẬT */}
      {/* ============================================================ */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/70 backdrop-blur-3xl border border-white/80 shadow-[0_8px_24px_rgba(0,0,0,0.06)] w-fit">
        <button
          type="button"
          onClick={() => {
            sound?.playClick?.();
            setActiveMainTab('clinical');
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeMainTab === 'clinical'
              ? 'bg-gradient-to-r from-cyan-500 to-sky-500 text-white shadow-md shadow-cyan-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Stethoscope className="w-4 h-4 stroke-[2.5]" />
          <span>Lịch khám lâm sàng (Clinical)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound?.playClick?.();
            setActiveMainTab('habits');
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
            activeMainTab === 'habits'
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          <Flame className="w-4 h-4 stroke-[2.5] fill-current" />
          <span>Việc thường nhật (Habits)</span>
        </button>
      </div>

      {/* Render Daily Checklist view when Habits tab is active */}
      {activeMainTab === 'habits' ? (
        <DailyStreakChecklist
          habits={propHabits}
          pets={safePets}
          familyMembers={propFamilyMembers}
          currentMemberId={currentMemberId}
          onToggleHabit={onToggleHabit}
          onAddHabit={onAddHabit}
          onDeleteHabit={onDeleteHabit}
        />
      ) : (
        <>
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/65 backdrop-blur-2xl p-5 sm:p-6 rounded-3xl border border-white/80 shadow-[0_12px_32px_rgba(6,182,212,0.08)]">
        
        {/* Left: Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-600 flex items-center justify-center shadow-md shadow-cyan-500/15 shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Lịch Chăm Sóc & Nhắc Nhở
              </h1>
              {overdueCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                  {overdueCount} việc quá hạn
                </span>
              )}
            </div>
            <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
              Phân tách rõ ràng giữa Lịch khám lâm sàng tại viện và Lịch chăm sóc định kỳ tại nhà.
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
          
          {/* NÚT ĐỒNG BỘ VÀO GOOGLE / APPLE CALENDAR */}
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
              onClick={() => { sound?.playClick?.(); onOpenVetBooking(); }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-sky-500 hover:opacity-95 shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer font-black"
              title="Đặt lịch khám 2 chiều với Bác sĩ Thú y"
            >
              <Stethoscope className="w-4 h-4 stroke-[2.5]" />
              <span>+ Đặt Lịch Khám</span>
            </button>
          )}

          <button
            type="button"
            onClick={(e) => handleOpenAddSchedule(e, scheduleViewMode === 'home_routines' ? 'deworm' : null)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:opacity-95 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Thêm Việc Mới</span>
          </button>
        </div>
      </div>

      {/* 2. BỘ LỌC NHANH THEO THÚ CƯNG (FILTER BY PET PILL - ẨN KHI Ở TAB CHĂM SÓC TẠI NHÀ ĐỂ TRÁNH TRÙNG LẶP) */}
      {scheduleViewMode !== 'home_routines' && (
        <div className="flex items-center gap-2 overflow-x-auto bg-white/65 backdrop-blur-2xl p-2.5 rounded-2xl border border-white/80 shadow-[0_8px_24px_rgba(6,182,212,0.06)] no-scrollbar">
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
            🐾 Tất cả thú cưng ({activeMainTab === 'clinical' ? dedupedAppointments.length : safeSchedules.length})
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
      )}

      {/* 3. View Switcher & Status Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center p-1.5 rounded-full bg-white/40 dark:bg-white/[0.08] backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-sm gap-1">
          {/* Tab 1: Danh sách tổng hợp */}
          <button
            onClick={() => { sound?.playClick?.(); setScheduleViewMode('tiered'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              scheduleViewMode === 'tiered'
                ? 'bg-white dark:bg-cyan-500/20 text-slate-800 dark:text-cyan-300 shadow-md shadow-black/5 dark:border dark:border-cyan-400/30'
                : 'text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <LayoutList size={15} />
            <span>Danh Sách Phân Tầng</span>
          </button>

          {/* Tab 2: Chăm sóc tại nhà (Tính năng ảnh 1 đưa lên menu) */}
          <button
            onClick={() => { sound?.playClick?.(); setScheduleViewMode('home_routines'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              scheduleViewMode === 'home_routines'
                ? 'bg-white dark:bg-cyan-500/20 text-slate-800 dark:text-cyan-300 shadow-md shadow-black/5 dark:border dark:border-cyan-400/30'
                : 'text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <Home size={15} />
            <span>Chăm Sóc Tại Nhà</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-100 dark:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 font-bold">
              {homeRoutinesList.length}
            </span>
          </button>

          {/* Tab 3: Lịch tháng */}
          <button
            onClick={() => { sound?.playClick?.(); setScheduleViewMode('calendar'); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              scheduleViewMode === 'calendar'
                ? 'bg-white dark:bg-cyan-500/20 text-slate-800 dark:text-cyan-300 shadow-md shadow-black/5 dark:border dark:border-cyan-400/30'
                : 'text-slate-500 dark:text-white/60 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            <CalendarIcon size={15} />
            <span>Lịch Tháng Trực Quan</span>
          </button>
        </div>

        {/* Status Filter Tabs (Chỉ hiển thị cho tiered hoặc calendar, ẩn khi ở home_routines vì cột phải đã có) */}
        {scheduleViewMode !== 'home_routines' && (
          <div className="flex items-center gap-1.5 overflow-x-auto bg-[#1E293B] p-1.5 rounded-2xl border border-white/10 shadow-xs">
            {[
              { id: 'all', label: `Tất cả` },
              { id: 'today', label: `Hôm nay ${todayCount > 0 ? `(${todayCount})` : ''}` },
              { id: 'upcoming', label: 'Sắp tới' },
              { id: 'overdue', label: `Quá hạn (${overdueCount})`, isAlert: overdueCount > 0 },
              { id: 'completed', label: 'Đã xong' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { sound?.playClick?.(); setFilterStatus(tab.id); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterStatus === tab.id
                    ? tab.isAlert 
                      ? 'bg-rose-600 text-white shadow-md' 
                      : 'bg-emerald-600 text-white shadow-md'
                    : tab.isAlert
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. MAIN CONTENT VIEW: TÁCH HOÀN TOÀN THEO TAB ĐIỀU HƯỚNG */}

      {/* Tab Danh Sách Phân Tầng: CHỈ hiển thị Lịch lâm sàng */}
      {scheduleViewMode === 'tiered' && (
        <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {renderClinicalAppointmentsSection()}
        </div>
      )}

      {/* Tab Chăm Sóc Tại Nhà: CHỈ hiển thị Home Routines */}
      {scheduleViewMode === 'home_routines' && (
        <div className="w-full h-full overflow-hidden flex-1 min-h-0">
          {renderHomeRoutinesSection(true)}
        </div>
      )}

      {/* Tab Lịch Tháng */}
      {scheduleViewMode === 'calendar' && (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
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
