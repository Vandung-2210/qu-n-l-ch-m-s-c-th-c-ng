import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Stethoscope, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Phone, 
  FileText, 
  Sparkles,
  ShieldAlert,
  Flame,
  ChevronDown
} from 'lucide-react';
import { sound } from '../../services/soundService';
import { addActiveAppointment, getActiveAppointments } from '../../services/storageService';
import { apiFetch } from '../../services/apiService';
import { getCurrentUser } from '../../services/authService';
import { getTodayVnDate, addDaysLocal } from '../../utils/dateUtils.js';
import { useCurrentVnDate } from '../../hooks/useCurrentVnDate';

export const VET_SERVICES = [
  {
    id: 'general',
    name: 'Khám tổng quát định kỳ',
    desc: 'Đo nhịp tim, nhiệt độ, kiểm tra mắt, tai và thể trạng tổng thể',
    icon: '🩺',
    badge: 'Định kỳ'
  },
  {
    id: 'dermatology',
    name: 'Da liễu & Vết nấm/ve rận',
    desc: 'Soi kính hiển vi tìm vi nấm, bọ chét, xét nghiệm tế bào học da',
    icon: '🩹',
    badge: 'Chuyên khoa'
  },
  {
    id: 'vaccine',
    name: 'Tiêm vắc-xin & Tẩy giun',
    desc: 'Vắc-xin 5/7 bệnh chó, 4 bệnh mèo, phòng dại và xổ giun định kỳ',
    icon: '💉',
    badge: 'Phòng ngừa'
  },
  {
    id: 'emergency',
    name: 'Cấp cứu tiêu hóa/nôn mửa',
    desc: 'Tiêu chảy ra máu, nuốt dị vật, co giật, bỏ ăn kéo dài',
    icon: '🚨',
    badge: 'Ưu tiên cấp cứu',
    isEmergency: true
  },
  {
    id: 'dental_spa',
    name: 'Khám răng & Spa móng',
    desc: 'Cạo vôi răng siêu âm, vệ sinh tuyến hôi, cắt tỉa móng và tai',
    icon: '✂️',
    badge: 'Vệ sinh'
  }
];

export const VET_FACILITIES = [
  {
    id: 'pethealth',
    name: 'Bệnh viện Thú y PetHealth 262 Quang Trung',
    address: '262 Quang Trung, Hà Đông, Hà Nội',
    hotline: '1900 6868 (Cấp cứu 24/7)',
    rating: '4.9 ★ (Hơn 12.000 ca điều trị)'
  },
  {
    id: 'sammi',
    name: 'Phòng khám Sammi Animal Clinic',
    address: 'Số 18 ngõ 282 Lạc Long Quân, Tây Hồ, Hà Nội',
    hotline: '024 2246 8899',
    rating: '4.8 ★ (Chuyên da liễu & thỏ kiểng)'
  },
  {
    id: '2vet',
    name: 'Bệnh viện Thú y 2Vet Hospital',
    address: '335 Kim Ngưu, Hai Bà Trưng, Hà Nội',
    hotline: '098 335 8126 (Cấp cứu 24/7)',
    rating: '4.9 ★ (Ngoại khoa & Hồi sức cấp cứu)'
  }
];

export const TIME_SLOTS = ['08:30', '09:30', '14:00', '16:30', '19:00'];

// Helper validation số điện thoại Việt Nam (10 chữ số di động bắt đầu bằng 0 hoặc +84)
export const validateVietnamesePhone = (phoneStr) => {
  if (!phoneStr || typeof phoneStr !== 'string' || !phoneStr.trim()) {
    return {
      isValid: false,
      error: 'Vui lòng nhập số điện thoại liên hệ xác nhận.'
    };
  }

  const trimmed = phoneStr.trim();

  // 1. Kiểm tra ký tự không hợp lệ: từ chối chuỗi chữ cái và ký tự đặc biệt
  if (/[^0-9+\s.-]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Số điện thoại không hợp lệ: không được chứa chữ cái hoặc ký tự đặc biệt.'
    };
  }

  // 2. Ký tự '+' chỉ được phép ở đầu chuỗi (+84)
  if (trimmed.includes('+') && !trimmed.startsWith('+')) {
    return {
      isValid: false,
      error: 'Ký tự "+" chỉ được phép ở đầu số điện thoại quốc tế (+84).'
    };
  }

  // 3. Chuẩn hóa: loại bỏ khoảng trắng, dấu chấm, dấu gạch nối
  const sanitized = trimmed.replace(/[\s.-]/g, '');

  // 4. Kiểm tra đầu số Việt Nam
  if (!sanitized.startsWith('0') && !sanitized.startsWith('+84') && !sanitized.startsWith('84')) {
    return {
      isValid: false,
      error: 'Số điện thoại phải bắt đầu bằng 0 hoặc +84 (Ví dụ: 0912 345 678).'
    };
  }

  let normalized = sanitized;
  if (normalized.startsWith('+84')) {
    normalized = '0' + normalized.slice(3);
  } else if (normalized.startsWith('84') && sanitized.length > 9) {
    normalized = '0' + normalized.slice(2);
  }

  // 5. Kiểm tra ký tự số sau chuẩn hóa
  if (!/^\d+$/.test(normalized)) {
    return {
      isValid: false,
      error: 'Số điện thoại chỉ được chứa các chữ số.'
    };
  }

  // 6. Kiểm tra độ dài
  if (normalized.length < 10) {
    return {
      isValid: false,
      error: `Số điện thoại quá ngắn (${normalized.length}/10 số). Vui lòng nhập đủ 10 chữ số.`
    };
  }

  if (normalized.length > 11) {
    return {
      isValid: false,
      error: `Số điện thoại quá dài (${normalized.length} số). Số điện thoại Việt Nam gồm 10 chữ số.`
    };
  }

  // 7. Kiểm tra theo đầu số nhà mạng VN (03, 05, 07, 08, 09 hoặc bàn 02)
  const vnMobileRegex = /^(0)(3|5|7|8|9)[0-9]{8}$/;
  const vnLandlineRegex = /^(02)[0-9]{9}$/;

  if (!vnMobileRegex.test(normalized) && !vnLandlineRegex.test(normalized)) {
    if (normalized.length === 10 && !/^(0)(3|5|7|8|9)/.test(normalized)) {
      return {
        isValid: false,
        error: 'Đầu số không hợp lệ. Số di động Việt Nam bắt đầu bằng 03, 05, 07, 08, 09.'
      };
    }
    return {
      isValid: false,
      error: 'Số điện thoại không đúng định dạng Việt Nam (10 số, bắt đầu bằng 0 hoặc +84).'
    };
  }

  return {
    isValid: true,
    error: '',
    sanitized: trimmed,
    normalized
  };
};

export const VetBookingModal = ({
  isOpen,
  onClose,
  pets = [],
  petsLoading = false,
  petsError = null,
  onRetryLoadPets = null,
  initialPetId = null,
  initialService = null,
  initialNote = null,
  initialFacility = null,
  initialIsAiVision = false,
  initialAiVisionPetId = null,
  onBookingSuccess
}) => {
  const todayVn = useCurrentVnDate();
  const [selectedPetId, setSelectedPetId] = useState('');
  const [selectedService, setSelectedService] = useState('Khám tổng quát định kỳ');
  const [selectedFacility, setSelectedFacility] = useState(VET_FACILITIES[0].name);
  const [selectedDate, setSelectedDate] = useState(() => {
    return addDaysLocal(getTodayVnDate(), 1);
  });
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [symptomsNote, setSymptomsNote] = useState('');
  const [isAiVisionSource, setIsAiVisionSource] = useState(false);
  const [aiVisionBoundPetId, setAiVisionBoundPetId] = useState(null);
  const user = getCurrentUser();
  const [ownerName, setOwnerName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [phoneError, setPhoneError] = useState('');
  const [slotStatuses, setSlotStatuses] = useState({});
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Lấy trạng thái khả dụng của từng khung giờ trong ngày từ Backend API
  const refreshSlotAvailability = useCallback(async (dateToCheck, petIdToCheck, facilityToCheck) => {
    if (!dateToCheck) return;
    setIsCheckingSlots(true);
    try {
      const qDate = dateToCheck;
      const qPet = petIdToCheck || '';
      const qFac = encodeURIComponent(facilityToCheck || '');
      const res = await apiFetch(`/appointments/slot-availability?date=${qDate}&petId=${qPet}&facility=${qFac}`);
      
      if (res && res.success && Array.isArray(res.slots)) {
        const statusMap = {};
        res.slots.forEach(s => {
          statusMap[s.time] = s;
        });
        setSlotStatuses(statusMap);

        console.log(`[BOOKING UI] Đã cập nhật trạng thái khung giờ (${dateToCheck}):`, statusMap);

        // Nếu khung giờ đang chọn bị disabled, tự động chọn khung giờ khả dụng đầu tiên
        setSelectedTime(prevTime => {
          const current = statusMap[prevTime];
          if (current && !current.available) {
            const firstAvailable = TIME_SLOTS.find(slot => statusMap[slot]?.available);
            return firstAvailable || '';
          }
          return prevTime;
        });
        return;
      }
    } catch (err) {
      console.warn('[BOOKING UI] Không thể lấy trạng thái từ máy chủ, kiểm tra qua cache cục bộ:', err);
    } finally {
      setIsCheckingSlots(false);
    }

    // Fallback: Kiểm tra qua local cache getActiveAppointments()
    try {
      const localApps = getActiveAppointments() || [];
      const statusMap = {};
      TIME_SLOTS.forEach(slot => {
        const conflict = localApps.find(app => {
          if (app.status === 'cancelled') return false;
          const aDate = (app.date || '').split('T')[0];
          const aTime = app.time || app.timeSlot;
          return aDate === dateToCheck && aTime === slot && String(app.petId) === String(petIdToCheck);
        });
        if (conflict) {
          statusMap[slot] = {
            time: slot,
            available: false,
            disabled: true,
            reason: 'Trùng lịch bé',
            reasonCode: 'PET_CONFLICT',
            isPetBooked: true
          };
        } else {
          statusMap[slot] = {
            time: slot,
            available: true,
            disabled: false
          };
        }
      });
      setSlotStatuses(statusMap);
      setSelectedTime(prevTime => {
        const current = statusMap[prevTime];
        if (current && !current.available) {
          const firstAvailable = TIME_SLOTS.find(slot => statusMap[slot]?.available);
          return firstAvailable || '';
        }
        return prevTime;
      });
    } catch (_) {}
  }, []);

  // Khởi tạo dữ liệu form khi modal mở
  useEffect(() => {
    if (isOpen) {
      const activeUser = getCurrentUser();
      if (activeUser?.name && !ownerName) setOwnerName(activeUser.name);
      if (activeUser?.phone && !phone) setPhone(activeUser.phone);
      setPhoneError('');
      setSubmitError('');

      // Tìm pet hợp lệ tương ứng với initialPetId
      const validInitialPet = pets.find(p => p.id === initialPetId);
      if (validInitialPet) {
        setSelectedPetId(validInitialPet.id);
      } else if (selectedPetId && pets.some(p => p.id === selectedPetId)) {
        // Giữ lại pet đang chọn nếu vẫn hợp lệ trong danh sách
      } else if (pets.length > 0) {
        setSelectedPetId(pets[0].id);
      } else {
        setSelectedPetId('');
      }

      if (initialService) {
        const found = VET_SERVICES.find(s => 
          s.name === initialService || 
          s.id === initialService || 
          initialService.toLowerCase().includes(s.name.toLowerCase()) || 
          s.name.toLowerCase().includes(initialService.toLowerCase()) ||
          (initialService.toLowerCase().includes('da liễu') && s.id === 'dermatology')
        );
        setSelectedService(found ? found.name : initialService);
      } else {
        setSelectedService('Khám tổng quát định kỳ');
      }

      // Xử lý nguồn AI thị giác tường minh:
      // CHỈ KHI initialIsAiVision === true THÌ MỚI GẮN NHÃN NGUỒN TỪ AI VISION
      if (initialIsAiVision === true && initialNote) {
        setSymptomsNote(initialNote);
        setIsAiVisionSource(true);
        setAiVisionBoundPetId(validInitialPet ? validInitialPet.id : (initialAiVisionPetId || initialPetId || null));
      } else if (initialNote) {
        // Nguồn thông thường (vd: khám định kỳ từ thẻ thú cưng hoặc đổi lịch)
        setSymptomsNote(initialNote);
        setIsAiVisionSource(false);
        setAiVisionBoundPetId(null);
      } else {
        setSymptomsNote('');
        setIsAiVisionSource(false);
        setAiVisionBoundPetId(null);
      }

      if (initialFacility) {
        setSelectedFacility(initialFacility);
      }

      setShowSuccessToast(false);
    }
  }, [isOpen, initialPetId, initialService, initialNote, initialFacility, initialIsAiVision, initialAiVisionPetId, pets]);

  // Đồng bộ trạng thái khung giờ khi ngày, thú cưng hoặc cơ sở thay đổi
  useEffect(() => {
    if (isOpen && selectedDate) {
      refreshSlotAvailability(selectedDate, selectedPetId, selectedFacility);
    }
  }, [isOpen, selectedDate, selectedPetId, selectedFacility, refreshSlotAvailability]);

  if (!isOpen) return null;

  // Xác định thú cưng được chọn hợp lệ thuộc quyền sở hữu của chủ nuôi
  const validPet = pets.find(p => p.id === selectedPetId);
  const isValidPetSelected = Boolean(validPet && validPet.id);
  const isEmergencySelected = selectedService.includes('Cấp cứu');

  // Xử lý chuyển đổi thú cưng: không mang nhầm ghi chú / AI Vision sang bé mới
  const handleSelectPet = (newPetId) => {
    sound.playClick();
    if (selectedPetId === newPetId) return;
    const oldPet = pets.find(p => p.id === selectedPetId);
    const newPet = pets.find(p => p.id === newPetId);
    setSelectedPetId(newPetId);
    setSubmitError('');

    // Nếu ghi chú trước đó là từ AI Vision của bé trước:
    // Xóa sạch để tránh mang nhầm ảnh hoặc kết quả chẩn đoán sang bé mới!
    if (isAiVisionSource || (aiVisionBoundPetId && aiVisionBoundPetId !== newPetId)) {
      setSymptomsNote('');
      setIsAiVisionSource(false);
      setAiVisionBoundPetId(null);
    } else if (oldPet && symptomsNote === `Khám định kỳ cho ${oldPet.name}`) {
      // Cập nhật tên theo bé mới nếu là ghi chú mẫu mở từ thẻ thú cưng
      setSymptomsNote(newPet ? `Khám định kỳ cho ${newPet.name}` : '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (petsLoading) {
      setSubmitError('Đang tải danh sách thú cưng của bạn. Vui lòng đợi trong giây lát...');
      return;
    }

    if (pets.length === 0) {
      setSubmitError('Chưa có hồ sơ thú cưng hợp lệ. Vui lòng thêm thú cưng vào hệ thống trước khi đặt lịch.');
      return;
    }

    if (!isValidPetSelected || !validPet) {
      setSubmitError('Vui lòng chọn một thú cưng hợp lệ từ danh sách của bạn.');
      return;
    }

    if (!ownerName.trim()) {
      setSubmitError('Vui lòng nhập họ tên chủ nuôi.');
      return;
    }

    const phoneValidation = validateVietnamesePhone(phone);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error);
      setSubmitError(phoneValidation.error);
      return;
    }
    setPhoneError('');

    if (!selectedDate) {
      setSubmitError('Vui lòng chọn ngày hẹn khám.');
      return;
    }

    if (!selectedTime) {
      setSubmitError('Vui lòng chọn khung giờ tiếp nhận.');
      return;
    }

    // Kiểm tra chặn nếu người dùng submit khung giờ bị disabled
    const currentSlotStatus = slotStatuses[selectedTime];
    if (currentSlotStatus && !currentSlotStatus.available) {
      setSubmitError(`Khung giờ ${selectedTime} không khả dụng (${currentSlotStatus.reason || 'đã có lịch'}). Vui lòng chọn khung giờ khác.`);
      return;
    }

    if (isSubmitting) return;

    try { sound.playPop(); } catch (_) {}
    setIsSubmitting(true);

    console.log('[BOOKING FORM SUBMIT] Payload:', {
      petId: validPet.id,
      petName: validPet.name,
      date: selectedDate,
      time: selectedTime,
      facility: selectedFacility,
      service: selectedService,
      owner: ownerName.trim(),
      phone: phone.trim()
    });

    const isDoctor = user?.role === 'vet_doctor' || user?.role === 'CLINIC_ADMIN';
    const newAppointment = {
      id: 'BK-' + Date.now(),
      ownerId: validPet.ownerId || user?.id || null,
      petId: validPet.id,
      petName: validPet.name || 'Thú cưng',
      petType: `${validPet.species === 'cat' ? 'Mèo' : validPet.species === 'rabbit' ? 'Thỏ' : 'Chó'} ${validPet.breed || ''}`.trim(),
      ownerName: ownerName.trim() || user?.name || 'Chủ nuôi',
      phone: phone.trim() || user?.phone || '',
      service: selectedService,
      facility: selectedFacility,
      date: selectedDate,
      time: selectedTime,
      note: symptomsNote.trim() || 'Đặt lịch kiểm tra sức khỏe qua PetCare PRO AI',
      status: 'pending',
      assignedVet: isDoctor ? (user?.name || 'BS. Hoàng Hải Nam (Pro Vet)') : 'Đang xếp lịch',
      assignedVetId: isDoctor ? user?.id : null,
      vetId: isDoctor ? user?.id : null,
      adminNote: '',
      isEmergency: isEmergencySelected,
      createdAt: new Date().toISOString()
    };

    try {
      const saved = await addActiveAppointment(newAppointment);

      // Await callback nếu callback bất đồng bộ
      if (typeof onBookingSuccess === 'function') {
        await onBookingSuccess(saved || newAppointment);
      }

      // Chỉ hiển thị thành công và phát âm thanh khi toàn bộ lưu trữ và callback hoàn tất
      setShowSuccessToast(true);
      try { sound.playSuccess(); } catch (_) {}

      setTimeout(() => {
        setShowSuccessToast(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Lỗi đặt lịch khám:', err);
      setShowSuccessToast(false);
      setSubmitError(err.message || 'Lỗi khi đặt lịch khám. Khung giờ này có thể đã có lịch hẹn hoặc dịch vụ bận.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0f1322] border border-purple-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden my-6">
        
        {/* Neon Glow Accents */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-emerald-400 to-indigo-500" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg ${
              isEmergencySelected
                ? 'bg-gradient-to-tr from-rose-600 to-red-500 shadow-rose-600/30 animate-pulse'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-purple-600/30'
            }`}>
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Đặt Lịch Khám Thú Y 2 Chiều
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  24/7 Instant Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kết nối trực tiếp lịch khám với đội ngũ Bác sĩ Thú y & Phòng khám liên kết.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 relative z-10 text-xs">
          
          {/* 1. Chọn bé khám */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <span>🐾 Chọn bé thú cưng cần khám <span className="text-rose-500 font-bold">*</span>:</span>
              </label>
              {!petsLoading && pets.length > 0 && (
                <span className="text-[11px] text-slate-400 font-medium">
                  {pets.length} bé trong hồ sơ
                </span>
              )}
            </div>

            {/* Trạng thái 1: Đang tải danh sách thú cưng */}
            {petsLoading && (
              <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center gap-2.5">
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="text-xs font-semibold">Đang tải danh sách thú cưng của bạn...</span>
              </div>
            )}

            {/* Trạng thái 2: Lỗi tải danh sách thú cưng */}
            {!petsLoading && petsError && pets.length === 0 && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{petsError}</span>
                </div>
                {typeof onRetryLoadPets === 'function' && (
                  <button
                    type="button"
                    onClick={() => onRetryLoadPets()}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    Thử lại
                  </button>
                )}
              </div>
            )}

            {/* Trạng thái 3: Không có thú cưng nào */}
            {!petsLoading && !petsError && pets.length === 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Bạn chưa có hồ sơ thú cưng nào. Vui lòng thêm thú cưng vào hệ thống trước khi đặt lịch khám.</span>
              </div>
            )}

            {/* Trạng thái 4: Danh sách thú cưng hợp lệ */}
            {!petsLoading && pets.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {pets.map((pet) => {
                  const isSelected = selectedPetId === pet.id;
                  return (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => handleSelectPet(pet.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-500/10 ring-1 ring-purple-500/50'
                          : 'bg-slate-900/60 border-white/[0.08] text-slate-300 hover:bg-slate-800/80 hover:border-white/20'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                        {pet.avatar || pet.photoUrl ? (
                          <img src={pet.avatar || pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-bold text-purple-400">
                            {pet.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="truncate">
                        <strong className="block text-xs font-bold truncate">{pet.name}</strong>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {pet.species === 'cat' ? 'Mèo' : pet.species === 'rabbit' ? 'Thỏ' : 'Chó'} {pet.breed || ''}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Chọn dịch vụ khám */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🩺 Dịch vụ / Lý do khám:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VET_SERVICES.map((srv) => {
                const isSelected = selectedService === srv.name;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => { sound.playClick(); setSelectedService(srv.name); }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? srv.isEmergency
                          ? 'bg-rose-500/20 border-rose-500 text-white shadow-md shadow-rose-500/20'
                          : 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900/60 border-white/[0.08] text-slate-300 hover:bg-slate-800/80 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{srv.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <strong className="text-xs font-bold truncate">{srv.name}</strong>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          srv.isEmergency ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {srv.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-1">
                        {srv.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Chọn Cơ sở Thú y */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cơ sở / Bệnh viện Thú y tiếp nhận:</span>
            </label>
            <div className="space-y-1.5">
              {VET_FACILITIES.map((fac) => {
                const isSelected = selectedFacility === fac.name;
                return (
                  <label
                    key={fac.id}
                    onClick={() => { sound.playClick(); setSelectedFacility(fac.name); }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900/60 border-white/[0.08] text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <input
                      type="radio"
                      name="facility"
                      checked={isSelected}
                      onChange={() => setSelectedFacility(fac.name)}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold">{fac.name}</strong>
                        <span className="text-[10px] text-amber-400 font-bold">{fac.rating}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{fac.address}</p>
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold block mt-0.5">
                        📞 Hotline: {fac.hotline}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 4. Ngày & Khung Giờ Khám */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ngày hẹn khám <span className="text-rose-500 font-bold">*</span>:</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                min={todayVn}
                onChange={(e) => { setSelectedDate(e.target.value); setSubmitError(''); }}
                required
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Khung giờ tiếp nhận <span className="text-rose-500 font-bold">*</span>:</span>
                </span>
                {isCheckingSlots && (
                  <span className="text-[10px] text-teal-400/80 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block animate-ping" />
                    Đang đồng bộ...
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedTime === slot;
                  const status = slotStatuses[slot];
                  const isDisabled = Boolean(status && status.disabled);
                  const reasonLabel = status?.reason || (status?.isPetBooked ? 'Trùng lịch bé' : 'Đã kín');

                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        sound.playClick();
                        setSelectedTime(slot);
                        setSubmitError('');
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center ${
                        isDisabled
                          ? 'opacity-40 cursor-not-allowed bg-slate-900/40 border border-dashed border-rose-500/40 text-slate-500 line-through select-none'
                          : isSelected
                          ? 'bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/20 scale-105 cursor-pointer ring-2 ring-teal-400'
                          : 'bg-slate-900 border border-white/10 text-slate-300 hover:bg-slate-800 cursor-pointer'
                      }`}
                      title={isDisabled ? `Khung giờ ${slot} không khả dụng: ${reasonLabel}` : `Chọn khung giờ ${slot}`}
                    >
                      <span>{slot}</span>
                      {isDisabled && (
                        <span className="text-[8px] font-normal no-underline text-rose-400 leading-none mt-0.5 tracking-tight">
                          {reasonLabel}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Triệu chứng & Ghi chú của chủ */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Mô tả triệu chứng / Ghi chú lâm sàng:</span>
              </span>
              {isAiVisionSource && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 animate-in fade-in">
                  <Sparkles className="w-3 h-3 text-emerald-400" /> Đã nạp từ AI Thị Giác
                </span>
              )}
            </label>
            <textarea
              rows={3}
              value={symptomsNote}
              onChange={(e) => {
                setSymptomsNote(e.target.value);
                // Người dùng nhập tay hoặc chỉnh sửa -> xóa nhãn nguồn AI
                setIsAiVisionSource(false);
              }}
              placeholder="Ví dụ: Bé nôn ra bọt trắng 2 lần, rụng lông hình tròn ở cổ, bỏ ăn từ sáng..."
              className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors leading-relaxed"
            />
          </div>

          {/* 6. Thông tin liên hệ chủ nuôi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-purple-400" />
                <span>Họ tên chủ nuôi <span className="text-rose-500 font-bold">*</span>:</span>
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => { setOwnerName(e.target.value); setSubmitError(''); }}
                required
                placeholder="Ví dụ: Đinh Xuân Mạnh"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>Số điện thoại xác nhận <span className="text-rose-500 font-bold">*</span>:</span>
                </span>
                {phoneError && (
                  <span className="text-[10px] text-rose-400 font-semibold animate-in fade-in">
                    Sai định dạng
                  </span>
                )}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError('');
                  setSubmitError('');
                }}
                onBlur={() => {
                  if (phone.trim()) {
                    const check = validateVietnamesePhone(phone);
                    if (!check.isValid) {
                      setPhoneError(check.error);
                    } else {
                      setPhoneError('');
                    }
                  }
                }}
                placeholder="0912 345 678 hoặc +84 912 345 678"
                required
                className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono transition-colors ${
                  phoneError
                    ? 'border-rose-500 focus:border-rose-400 ring-1 ring-rose-500/30'
                    : 'border-white/10 focus:border-purple-400'
                }`}
              />
              {phoneError ? (
                <p className="text-[11px] text-rose-400 font-semibold mt-1 flex items-center gap-1 animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>{phoneError}</span>
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  Định dạng: 10 chữ số (bắt đầu bằng 0 hoặc +84). Ví dụ: <span className="text-slate-300 font-mono">0912 345 678</span> hoặc <span className="text-slate-300 font-mono">+84 912 345 678</span>
                </p>
              )}
            </div>
          </div>

          {/* Thông báo lỗi khi không thể đặt lịch */}
          {submitError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs">
                <strong className="block font-bold text-rose-200">Không thể đặt lịch:</strong>
                <span>{submitError}</span>
              </div>
            </div>
          )}

          {/* Toast thông báo thành công */}
          {showSuccessToast && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="block text-xs font-bold text-emerald-200">
                  Đặt lịch thành công!
                </strong>
                <span className="text-[11px] text-emerald-300">
                  Phòng khám sẽ liên hệ và cập nhật trạng thái lịch khám cho bạn ngay.
                </span>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !isValidPetSelected || petsLoading || Boolean(slotStatuses[selectedTime] && !slotStatuses[selectedTime].available)}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                (!isValidPetSelected || petsLoading || Boolean(slotStatuses[selectedTime] && !slotStatuses[selectedTime].available))
                  ? 'opacity-50 cursor-not-allowed bg-slate-700'
                  : isEmergencySelected
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang gửi đặt lịch...' : 'Xác Nhận Đặt Lịch Khám'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default VetBookingModal;
