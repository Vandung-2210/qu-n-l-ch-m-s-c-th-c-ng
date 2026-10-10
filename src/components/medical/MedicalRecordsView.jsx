import React, { useState, useMemo } from 'react';
import { 
  FileHeart, 
  Syringe, 
  Pill, 
  Stethoscope, 
  Printer, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  AlertTriangle,
  Download,
  QrCode,
  Building2,
  Calendar,
  Sparkles,
  FileCheck2,
  Share2,
  PawPrint,
  Bell,
  FileText,
  Check,
  Globe,
  Award,
  Zap
} from 'lucide-react';
import { SpeciesBadge } from '../common/Badges';
import { sound } from '../../services/soundService';

// Mô tả chi tiết y khoa & phòng bệnh WSAVA cho từng vắc-xin
const VACCINE_DESCRIPTIONS = {
  'Nobivac DHPPi + L4 (7 Bệnh)': {
    diseaseDesc: 'Phòng 7 bệnh truyền nhiễm chó: Care, Parvovirus, Viêm gan, Ho cũi, Leptospira 4 chủng',
    facility: 'Bệnh Viện Thú Y PetCare Central (CN Cầu Giấy)'
  },
  'Rabisin (Vắc-xin Dại Quốc Tế)': {
    diseaseDesc: 'Phòng ngừa virus Dại (Rabies) • Cấp chứng thư xuất cảnh IATA / EU Pet Passport',
    facility: 'Bệnh Viện Thú Y PetCare Central (CN Cầu Giấy)'
  },
  'Bordetella Bronchiseptica (Ho cũi chó)': {
    diseaseDesc: 'Dự phòng viêm phế quản truyền nhiễm (Kennel Cough) đường hô hấp cấp tính',
    facility: 'Bệnh Viện Thú Y PetCare Central'
  },
  'Purevax RCPCh (Vắc-xin 4 Bệnh Mèo)': {
    diseaseDesc: 'Phòng 4 bệnh cốt lõi mèo: Giảm bạch cầu (FPV), Viêm mũi khí quản (FHV-1), Calicivirus (FCV) và Chlamydia',
    facility: 'Bệnh Viện Thú Y PetCare Central (CN Cầu Giấy)'
  },
  'Rabisin (Phòng Dại Cho Mèo)': {
    diseaseDesc: 'Vắc-xin phòng bệnh Dại (Rabies) đạt chuẩn Hướng dẫn WSAVA & Xuất cảnh quốc tế',
    facility: 'Bệnh Viện Thú Y PetCare Central (CN Cầu Giấy)'
  },
  'Filavac VHD K C+V (Bại huyết Thỏ RHDV1 & RHDV2)': {
    diseaseDesc: 'Phòng xuất huyết truyền nhiễm bại huyết Thỏ chủng cổ điển RHDV-1 & biến chủng mới RHDV-2',
    facility: 'Bệnh Viện Thú Y PetCare Central (CN Cầu Giấy)'
  }
};

// Format helper chuẩn DD/MM/YYYY
const formatDateVi = (dateStr) => {
  if (!dateStr) return '';
  try {
    if (String(dateStr).includes('/')) {
      return String(dateStr);
    }
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  } catch {}
  return String(dateStr);
};

// Tính số ngày còn lại đến hạn
const getRemainingDaysInfo = (dueDateStr, remainingDaysVal) => {
  if (remainingDaysVal !== undefined && remainingDaysVal !== null) {
    const days = Number(remainingDaysVal);
    if (days < 0) {
      return { text: `Quá hạn ${Math.abs(days)} ngày`, isOverdue: true, isSoon: false, days };
    } else if (days === 0) {
      return { text: 'Đến hạn hôm nay', isOverdue: false, isSoon: true, days: 0 };
    } else {
      return { text: `Còn ${days} ngày`, isOverdue: false, isSoon: days <= 45, days };
    }
  }
  if (!dueDateStr) return { text: '', isOverdue: false, isSoon: false, days: 0 };
  try {
    let due;
    if (String(dueDateStr).includes('/')) {
      const parts = String(dueDateStr).split('/');
      due = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else {
      due = new Date(dueDateStr);
    }
    const now = new Date();
    due.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Quá hạn ${Math.abs(diffDays)} ngày`, isOverdue: true, isSoon: false, days: diffDays };
    } else if (diffDays === 0) {
      return { text: 'Đến hạn hôm nay', isOverdue: false, isSoon: true, days: 0 };
    } else {
      return { text: `Còn ${diffDays} ngày`, isOverdue: false, isSoon: diffDays <= 45, days: diffDays };
    }
  } catch {
    return { text: '', isOverdue: false, isSoon: false, days: 0 };
  }
};

export const MedicalRecordsView = ({
  pets = [],
  schedules = []
}) => {
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || 'pet-1');
  const selectedPet = pets.find(p => p.id === selectedPetId) || pets[0] || null;

  const [isExporting, setIsExporting] = useState(false);
  const [vaccineFilter, setVaccineFilter] = useState('all'); // 'all' | 'valid' | 'due'
  const [toastMessage, setToastMessage] = useState(null);

  // Trigger floating notification toast
  const showToast = (msg) => {
    try { sound?.playSuccess?.(); } catch {}
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Filter schedules for the selected pet (nếu có lịch riêng thực tế)
  const petSchedules = selectedPet ? schedules.filter(s => s.petId === selectedPet.id) : [];

  // Vắc-xin chuẩn y khoa theo từng cá thể
  const rawVaccines = useMemo(() => {
    // Nếu có lịch vắc-xin thực tế từ hệ thống schedules
    const realPetVaccines = petSchedules.filter(s => s.type === 'vaccine');
    if (realPetVaccines.length > 0) {
      return realPetVaccines.map((s, idx) => ({
        id: s.id,
        name: s.title,
        title: s.title,
        lot: s.batchNumber || '',
        batchNumber: s.batchNumber || '',
        date: s.date || '',
        nextDue: s.nextDueDate || '',
        nextDueDate: s.nextDueDate || '',
        remainingDays: s.nextDueDate ? getRemainingDaysInfo(s.nextDueDate).days : null,
        vet: s.doctor || '',
        doctor: s.doctor || '',
        diseaseDesc: s.notes || '',
        facility: s.location || '',
        completed: Boolean(s.completed)
      }));
    }
    return [];
  }, [petSchedules]);

  // Danh mục tẩy giun chuẩn y khoa theo từng loài
  const displayedDeworms = useMemo(() => {
    const realPetDeworms = petSchedules.filter(s => s.type === 'deworm');
    if (realPetDeworms.length > 0) {
      return realPetDeworms.map((s, idx) => ({
        id: s.id,
        title: s.title,
        diseaseDesc: s.notes || '',
        batchNumber: s.batchNumber || '',
        date: s.date || '',
        nextDueDate: s.nextDueDate || '',
        doctor: s.doctor || '',
        facility: s.location || '',
        completed: Boolean(s.completed),
        repeat: s.repeat || '',
        notes: s.notes || ''
      }));
    }
    return [];
  }, [petSchedules]);

  // Lọc bảng vắc-xin theo filter [Tất cả] [Còn hạn] [Cần tiêm nhắc]
  const displayedVaccines = useMemo(() => {
    if (vaccineFilter === 'valid') {
      return rawVaccines.filter(v => {
        const remaining = v.remainingDays !== undefined ? v.remainingDays : getRemainingDaysInfo(v.nextDue).days;
        return v.completed && remaining >= 0;
      });
    }
    if (vaccineFilter === 'due') {
      return rawVaccines.filter(v => {
        const remaining = v.remainingDays !== undefined ? v.remainingDays : getRemainingDaysInfo(v.nextDue).days;
        return !v.completed || remaining < 0 || remaining <= 45;
      });
    }
    return rawVaccines;
  }, [rawVaccines, vaccineFilter]);

  // Chỉ số KPI chuẩn Hộ chiếu WSAVA lấy từ stats của cá thể
  const completedVaccinesCount = rawVaccines.filter(v => v.completed).length;
  const nearestDueDate = rawVaccines.length > 0 && rawVaccines[0]?.nextDue ? rawVaccines[0].nextDue : 'Chưa có';
  const dewormsCount = displayedDeworms.length;

  // Microchip chuẩn cá thể duy nhất
  const petMicrochip = selectedPet.microchip || 'Chưa cập nhật';

  const petGenderLabel = selectedPet.gender === 'male' || selectedPet.gender === 'Đực' ? 'Đực' : 'Cái';
  const petWeightLabel = selectedPet.weight ? `${selectedPet.weight} kg` : 'Chưa có dữ liệu';
  const petBreedLabel = selectedPet.breed || 'Chưa cập nhật';
  const petNeuteredLabel = selectedPet.isNeutered ? 'Đã triệt sản' : 'Chưa triệt sản';

  // In / Xuất PDF chuẩn Hộ Chiếu WSAVA
  const handleExportPdf = () => {
    try { sound?.playSuccess?.(); } catch {}
    window.dispatchEvent(new CustomEvent('petcare_export_wsava_pdf', { detail: { petId: selectedPet.id } }));
  };

  // Hành động Nhắc Lịch Uống
  const handleReminderAction = (item) => {
    showToast(`🔔 Đã đặt lịch nhắc uống ${item.title} vào ngày ${formatDateVi(item.nextDueDate)}!`);
  };

  return (
    <div className="space-y-6 pb-20 select-none text-slate-900 dark:text-white relative">
      
      {/* Toast thông báo tương tác nhanh */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 px-5 py-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-emerald-400/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs shadow-2xl backdrop-blur-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ---------------------------------------------------------------------- */}
      {/* 1. THANH TIÊU ĐỀ TRÊN CÙNG: MEDICAL MINIMALIST PORCELAIN */}
      {/* ---------------------------------------------------------------------- */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#12192A] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shadow-md shadow-emerald-500/15 shrink-0">
            <FileHeart className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5 flex-wrap">
              <span>Sổ Y Bạ & Tiêm Chủng Điện Tử</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/30 flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>WSAVA PASSPORT</span>
              </span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-xs mt-0.5">
              Hộ chiếu sức khỏe thú cưng chuẩn WSAVA Quốc Tế • Chứng thực số lô, hạn miễn dịch & phòng ngừa ký sinh trùng
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap self-end sm:self-auto">
          {/* Bộ chọn thú cưng */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 px-3.5 py-2 rounded-2xl shadow-xs text-xs">
            <PawPrint className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <select
              value={selectedPetId}
              onChange={(e) => {
                try { sound?.playClick?.(); } catch {}
                setSelectedPetId(e.target.value);
              }}
              className="bg-transparent border-0 text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer pr-1"
            >
              {pets.map(p => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-medium">
                  {p.name} ({p.breed} - {p.weight}kg)
                </option>
              ))}
            </select>
          </div>

          {/* DUY NHẤT 1 NÚT XUẤT PDF THEO YÊU CẦU */}
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/25 border border-emerald-400/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            title="Xuất Hộ Chiếu WSAVA (PDF)"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>{isExporting ? 'Đang xuất Hộ chiếu...' : '📄 Xuất Hộ Chiếu WSAVA (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. THẺ HỘ CHIẾU WSAVA (PET PASSPORT HEADER CARD) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#12192A] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-2xl relative overflow-hidden">
        {/* Glow hiệu ứng nền */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-cyan-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
          
          {/* CỘT TRÁI (5 Cột): Avatar viền vàng kim, Tên, Thông số, Microchip & Huy hiệu WSAVA */}
          <div className="lg:col-span-5 flex items-center gap-4">
            {/* Avatar Mochi có khung viền vàng kim bảo chứng */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl p-0.5 bg-gradient-to-br from-amber-300 via-amber-500 to-amber-600 shadow-[0_0_20px_rgba(251,191,36,0.25)]">
                <img
                  src={selectedPet.avatar || 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80'}
                  alt={selectedPet.name}
                  className="w-full h-full rounded-[14px] object-cover"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=120'; }}
                />
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-black bg-amber-400 text-slate-950 shadow-md">
                PASS-ID
              </span>
            </div>

            {/* Thông tin Mochi */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{selectedPet.name}</h2>
                {/* Huy hiệu chuẩn hóa WSAVA 2026 */}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40 flex items-center gap-1 shadow-xs">
                  <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Tiêu chuẩn WSAVA 2026</span>
                </span>
              </div>

              {/* Nhãn chi tiết */}
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {petBreedLabel} • {petGenderLabel} • {petWeightLabel} • {petNeuteredLabel}
              </p>

              {/* Chip nhận diện Microchip */}
              <div className="flex items-center gap-2 text-xs font-mono text-amber-700 dark:text-amber-300/90 pt-0.5">
                <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Microchip: <strong className="text-amber-800 dark:text-amber-200 tracking-wider">{petMicrochip}</strong></span>
              </div>
            </div>
          </div>

          {/* GIỮA (3 Cột): Mã QR Code xác thực nhanh */}
          <div className="lg:col-span-3 flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40 transition-all text-center">
            <div className="relative p-2 bg-white rounded-xl shadow-md border border-slate-200/60 group">
              {/* Mã QR Vector tương tác */}
              <svg viewBox="0 0 100 100" className="w-18 h-18 text-slate-950" fill="currentColor">
                {/* Corner Finder 1 */}
                <rect x="5" y="5" width="28" height="28" rx="4" fill="currentColor" />
                <rect x="10" y="10" width="18" height="18" rx="2" fill="#fff" />
                <rect x="14" y="14" width="10" height="10" rx="1" fill="currentColor" />
                {/* Corner Finder 2 */}
                <rect x="67" y="5" width="28" height="28" rx="4" fill="currentColor" />
                <rect x="72" y="10" width="18" height="18" rx="2" fill="#fff" />
                <rect x="76" y="14" width="10" height="10" rx="1" fill="currentColor" />
                {/* Corner Finder 3 */}
                <rect x="5" y="67" width="28" height="28" rx="4" fill="currentColor" />
                <rect x="10" y="72" width="18" height="18" rx="2" fill="#fff" />
                <rect x="14" y="76" width="10" height="10" rx="1" fill="currentColor" />
                {/* Center & Data patterns */}
                <rect x="38" y="10" width="8" height="8" rx="1" />
                <rect x="50" y="10" width="8" height="8" rx="1" />
                <rect x="38" y="24" width="20" height="6" rx="1" />
                <rect x="10" y="42" width="22" height="8" rx="1" />
                <rect x="38" y="38" width="24" height="24" rx="3" fill="#059669" />
                <circle cx="50" cy="50" r="7" fill="#fff" />
                <rect x="68" y="42" width="10" height="10" rx="1" />
                <rect x="82" y="42" width="12" height="18" rx="1" />
                <rect x="38" y="68" width="12" height="12" rx="1" />
                <rect x="54" y="68" width="8" height="24" rx="1" />
                <rect x="68" y="68" width="26" height="10" rx="1" />
                <rect x="68" y="82" width="26" height="12" rx="1" />
              </svg>
            </div>
            <div className="mt-1.5 space-y-0.5">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block tracking-wider uppercase">
                MÃ QR XÁC THỰC
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                Hải quan & Bệnh viện quét đọc
              </span>
            </div>
          </div>

          {/* CỘT PHẢI (4 Cột): 3 THẺ CHỈ SỐ KÍNH MỜ TINH TẾ */}
          <div className="lg:col-span-4 grid grid-cols-3 gap-2.5">
            {/* Thẻ 1: 3 - MŨI HOÀN THÀNH */}
            <div className="p-3 bg-emerald-50/80 dark:bg-emerald-500/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/30 text-center hover:border-emerald-400/50 transition-all flex flex-col justify-center">
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono tracking-tight">
                {completedVaccinesCount}
              </div>
              <div className="text-[10px] font-bold uppercase text-emerald-800/80 dark:text-emerald-300/80 mt-1 leading-tight">
                Mũi hoàn thành
              </div>
            </div>

            {/* Thẻ 2: 18/01/2027 - HẠN MŨI NHẮC GẦN NHẤT */}
            <div className="p-3 bg-amber-50/80 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/30 text-center hover:border-amber-400/50 transition-all flex flex-col justify-center">
              <div className="text-xs sm:text-[13px] font-black text-amber-700 dark:text-amber-300 font-mono tracking-tight leading-snug">
                {nearestDueDate}
              </div>
              <div className="text-[10px] font-bold uppercase text-amber-800/80 dark:text-amber-300/80 mt-1 leading-tight">
                Hạn mũi nhắc gần nhất
              </div>
            </div>

            {/* Thẻ 3: 2 LẦN - TẨY GIUN ĐỊNH KỲ */}
            <div className="p-3 bg-sky-50/80 dark:bg-sky-500/10 rounded-2xl border border-sky-200 dark:border-sky-500/30 text-center hover:border-sky-400/50 transition-all flex flex-col justify-center">
              <div className="text-2xl font-black text-sky-700 dark:text-sky-300 font-mono tracking-tight">
                {dewormsCount} LẦN
              </div>
              <div className="text-[10px] font-bold uppercase text-sky-800/80 dark:text-sky-300/80 mt-1 leading-tight">
                Tẩy giun định kỳ
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 3. BẢNG VẮC-XIN THEO DẠNG "TEM NIÊM PHONG" (VACCINE STAMPS) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#12192A] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-2xl space-y-4">
        
        {/* Header: Sổ Tiêm Chủng Vắc-xin & Phòng Bệnh kèm bộ lọc */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <Syringe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <span>Sổ Tiêm Chủng Vắc-xin & Phòng Bệnh</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/30 font-bold normal-case">
                  Vaccine Stamps
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Niêm phong số lô, bảo hộ miễn dịch quốc tế và bác sĩ chứng thực</p>
            </div>
          </div>

          {/* Bộ lọc: [ Tất cả ] [ Còn hạn ] [ Cần tiêm nhắc ] */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setVaccineFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                vaccineFilter === 'all'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setVaccineFilter('valid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                vaccineFilter === 'valid'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Còn hạn
            </button>
            <button
              type="button"
              onClick={() => setVaccineFilter('due')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                vaccineFilter === 'due'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cần tiêm nhắc
            </button>
          </div>
        </div>

        {/* Danh sách tem niêm phong vắc-xin (Table chuẩn hóa Light Mode) */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.02]">
          <table className="w-full text-xs text-left border-collapse min-w-[760px]">
            <thead className="bg-slate-100/80 text-slate-700 text-xs font-semibold uppercase border-b border-slate-200 dark:bg-white/[0.05] dark:text-slate-300 dark:border-white/10">
              <tr>
                <th className="py-3.5 px-4 w-[30%]">Tên Vắc-xin & Phòng Bệnh</th>
                <th className="py-3.5 px-4 w-[16%]">Số Lô (Lot/Batch)</th>
                <th className="py-3.5 px-4 w-[20%]">Ngày Tiêm → Hẹn Nhắc</th>
                <th className="py-3.5 px-4 w-[20%]">Bác Sĩ Thực Hiện & Bệnh Viện</th>
                <th className="py-3.5 px-4 text-center w-[14%]">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {displayedVaccines.length > 0 ? displayedVaccines.map((item) => {
                const dueInfo = getRemainingDaysInfo(item.nextDueDate || item.nextDue, item.remainingDays);
                return (
                  <tr 
                    key={item.id} 
                    className="border-b border-slate-100 hover:bg-slate-50/60 text-slate-800 dark:border-white/5 dark:hover:bg-white/[0.04] dark:text-slate-200 transition-all group"
                  >
                    {/* Cột 1: Tên Vắc-xin nổi bật kèm mô tả bệnh phòng ngừa */}
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white text-sm tracking-tight flex items-center gap-1.5">
                          <span>{item.title || item.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                          {item.diseaseDesc}
                        </p>
                      </div>
                    </td>

                    {/* Cột 2: Số Lô (Lot/Batch) trong badge chuẩn */}
                    <td className="py-4 px-4 align-top">
                      <span className="bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded text-xs dark:bg-white/[0.06] dark:border dark:border-white/15 dark:text-slate-200 inline-flex items-center gap-1">
                        <span className="text-slate-400 dark:text-slate-500">#</span>
                        <span>{(item.batchNumber || item.lot || '').replace('#', '')}</span>
                      </span>
                    </td>

                    {/* Cột 3: Ngày tiêm & Ngày hẹn nhắc */}
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1">
                        <div className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                          <span>{formatDateVi(item.date)}</span>
                          <span className="text-slate-400 dark:text-slate-500">→</span>
                          <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{formatDateVi(item.nextDueDate || item.nextDue)}</strong>
                        </div>
                        <div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            dueInfo.isOverdue 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30'
                              : dueInfo.isSoon
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-400/30'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-400/25'
                          }`}>
                            {dueInfo.text || `Còn ${item.remainingDays || 112} ngày`}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Cột 4: Bác sĩ thực hiện & Bệnh viện */}
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{item.doctor}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                          {item.facility}
                        </p>
                      </div>
                    </td>

                    {/* Cột 5: Badge "✓ HỢP LỆ" chuẩn hóa */}
                    <td className="py-4 px-4 align-top text-center">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-2.5 py-1 rounded-full text-xs dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/40 inline-flex items-center gap-1.5 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>✓ HỢP LỆ</span>
                      </span>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Chưa có dữ liệu vắc-xin
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 4. BẢNG TẨY GIUN & KÝ SINH TRÙNG (PARASITE CONTROL) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#12192A] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-300 flex items-center justify-center border border-amber-500/30">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Sổ Theo Dõi Tẩy Giun & Ngoại Ký Sinh Trùng Định Kỳ
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Kiểm soát giun tim, ve rận, bọ chét và giun đường tiêu hóa theo phác đồ thú y</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 self-start sm:self-auto">
            Tổng cộng: <strong className="text-amber-600 dark:text-amber-300">{displayedDeworms.length}</strong> lần điều trị
          </span>
        </div>

        {/* Bảng Ký sinh trùng */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-white/[0.02]">
          <table className="w-full text-xs text-left border-collapse min-w-[760px]">
            <thead className="bg-slate-100/80 text-slate-700 text-xs font-semibold uppercase border-b border-slate-200 dark:bg-white/[0.05] dark:text-slate-300 dark:border-white/10">
              <tr>
                <th className="py-3.5 px-4 w-[28%]">Tên Thuốc / Chế Phẩm</th>
                <th className="py-3.5 px-4 w-[16%]">Số Lô (Lot #)</th>
                <th className="py-3.5 px-4 w-[15%]">Ngày Uống</th>
                <th className="py-3.5 px-4 w-[15%]">Hẹn Lần Kế Tiếp</th>
                <th className="py-3.5 px-4 w-[14%]">Chu Kỳ</th>
                <th className="py-3.5 px-4 text-center w-[12%]">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {displayedDeworms.length > 0 ? displayedDeworms.map((item) => (
                <tr 
                  key={item.id} 
                  className="border-b border-slate-100 hover:bg-slate-50/60 text-slate-800 dark:border-white/5 dark:hover:bg-white/[0.04] dark:text-slate-200 transition-all group"
                >
                  {/* Tên thuốc & công dụng */}
                  <td className="py-4 px-4 align-top">
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">
                        {item.title}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-normal">
                        {item.diseaseDesc}
                      </p>
                    </div>
                  </td>

                  {/* Số lô */}
                  <td className="py-4 px-4 align-top">
                    <span className="bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded text-xs dark:bg-white/[0.06] dark:border dark:border-white/15 dark:text-slate-200 inline-flex items-center gap-1">
                      <span>{item.batchNumber}</span>
                    </span>
                  </td>

                  {/* Ngày uống DD/MM/YYYY */}
                  <td className="py-4 px-4 align-top font-mono text-xs text-slate-700 dark:text-slate-200 font-semibold">
                    {formatDateVi(item.date)}
                  </td>

                  {/* Hẹn lần kế tiếp DD/MM/YYYY */}
                  <td className="py-4 px-4 align-top font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300">
                    {formatDateVi(item.nextDueDate)}
                  </td>

                  {/* Chu kỳ */}
                  <td className="py-4 px-4 align-top">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                      {item.repeat}
                    </span>
                  </td>

                  {/* NÚT HÀNH ĐỘNG NHANH */}
                  <td className="py-4 px-4 align-top text-center">
                    <button
                      type="button"
                      onClick={() => handleReminderAction(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 dark:text-amber-300 dark:border-amber-500/30 font-bold text-[11px] transition-all duration-200 cursor-pointer active:scale-95 shadow-xs"
                      title="Nhắc Lịch Uống"
                    >
                      <Bell className="w-3 h-3 text-amber-600 dark:text-amber-300" />
                      <span>Nhắc Lịch Uống</span>
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Chưa có dữ liệu tẩy giun/ký sinh trùng
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Khối in ấn được xử lý qua WsavaPassportModal toàn cục độc lập tab */}
    </div>
  );
};

export default MedicalRecordsView;
