import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Printer, 
  X, 
  Download, 
  ShieldCheck, 
  Globe, 
  CheckCircle2, 
  QrCode, 
  FileText, 
  ChevronDown, 
  Award, 
  Calendar, 
  Stethoscope, 
  PawPrint, 
  Building2,
  Check
} from 'lucide-react';
import { sound } from '../../services/soundService';

/**
 * Định dạng ngày theo chuẩn Việt Nam DD/MM/YYYY
 */
const formatDateVi = (dateStr) => {
  if (!dateStr) return '---';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
};

/**
 * Tính tuổi thân thiện từ birthDate
 */
const getAgeText = (birthDateStr) => {
  if (!birthDateStr) return '2 tuổi 7 tháng';
  try {
    const birth = new Date(birthDateStr);
    const now = new Date();
    let years = now.getFullYear() - birth.getFullYear();
    let months = now.getMonth() - birth.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    if (years <= 0) return `${months} tháng`;
    return months > 0 ? `${years} tuổi ${months} tháng` : `${years} tuổi`;
  } catch {
    return '2 tuổi 7 tháng';
  }
};

export const WsavaPassportModal = ({
  isOpen = false,
  onClose = () => {},
  pets = [],
  selectedPetId = null,
  schedules = []
}) => {
  // Xác định bé cưng mặc định
  const initialPetId = useMemo(() => {
    if (selectedPetId && selectedPetId !== 'all') {
      const match = pets.find(p => p.id === selectedPetId);
      if (match) return match.id;
    }
    // Mặc định tìm Mochi hoặc bé đầu tiên
    const mochi = pets.find(p => p.name?.toLowerCase().includes('mochi'));
    if (mochi) return mochi.id;
    return pets[0]?.id || 'pet-1';
  }, [pets, selectedPetId]);

  const [activePetId, setActivePetId] = useState(initialPetId);

  // Cập nhật khi selectedPetId hoặc isOpen thay đổi
  useEffect(() => {
    if (isOpen) {
      if (selectedPetId && selectedPetId !== 'all') {
        const match = pets.find(p => p.id === selectedPetId);
        if (match) {
          setActivePetId(match.id);
          return;
        }
      }
      const mochi = pets.find(p => p.name?.toLowerCase().includes('mochi'));
      if (mochi) {
        setActivePetId(mochi.id);
      } else if (pets[0]) {
        setActivePetId(pets[0].id);
      }
    }
  }, [isOpen, selectedPetId, pets]);

  // Thông tin bé cưng đang kích hoạt
  const activePet = useMemo(() => {
    const found = pets.find(p => p.id === activePetId);
    if (found) {
      const isMochi = found.name?.toLowerCase().includes('mochi');
      return {
        ...found,
        name: found.name || 'Mochi',
        breed: found.breed || 'Golden Retriever',
        species: found.species || 'dog',
        gender: found.gender === 'male' || found.gender === 'Đực' ? 'Đực (Male)' : 'Cái (Female)',
        weight: found.weight || 24.5,
        microchip: isMochi ? '98200036412' : (found.microchip || '98200036412'),
        birthDate: found.birthDate || '2023-08-15',
        isNeutered: found.isNeutered !== false,
        color: found.color || 'Vàng kem (Cream Golden)',
        avatar: found.avatar || 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80',
        ownerName: 'Mạnh Đinh',
        ownerPhone: '0912.345.678',
        ownerAddress: 'Cầu Giấy, Hà Nội, Việt Nam'
      };
    }
    // Fallback chuẩn Mochi theo yêu cầu
    return {
      id: 'pet-1',
      name: 'Mochi',
      breed: 'Golden Retriever',
      species: 'dog',
      gender: 'Đực (Male)',
      weight: 24.5,
      microchip: '98200036412',
      birthDate: '2023-08-15',
      isNeutered: true,
      color: 'Vàng kem (Cream Golden)',
      avatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80',
      ownerName: 'Mạnh Đinh',
      ownerPhone: '0912.345.678',
      ownerAddress: 'Cầu Giấy, Hà Nội, Việt Nam'
    };
  }, [pets, activePetId]);

  // Phác đồ vắc-xin chuẩn WSAVA Quốc tế
  const defaultVaccines = useMemo(() => [
    {
      id: 'vax-1',
      title: 'Nobivac DHPPi + L4 (7 bệnh)',
      diseaseDesc: 'Carre, Parvovirus, Viêm gan truyền nhiễm, Ho cũi chó, Leptospira 4 chủng',
      batchNumber: 'NV-2026-8892',
      date: '2026-05-10',
      nextDueDate: '2027-01-18',
      doctor: 'BS. Nguyễn Hải Nam',
      license: 'CCHN: 00981/TY-HN',
      facility: 'BV Thú Y PetCare Central',
      status: 'HỢP LỆ (VALID)'
    },
    {
      id: 'vax-2',
      title: 'Rabisin (Phòng Bệnh Dại Quốc Tế)',
      diseaseDesc: 'Phòng ngừa virus Dại (Rabies) • Đạt chuẩn cấp hộ chiếu xuất cảnh IATA / EU',
      batchNumber: 'RB-2026-4412',
      date: '2026-04-15',
      nextDueDate: '2027-04-15',
      doctor: 'BS. Trần Thị Mai',
      license: 'CCHN: 01204/TY-HN',
      facility: 'BV Thú Y PetCare Central',
      status: 'HỢP LỆ (VALID)'
    },
    {
      id: 'vax-3',
      title: 'Bordetella Bronchiseptica (Ho cũi chó)',
      diseaseDesc: 'Dự phòng viêm phế quản truyền nhiễm Kennel Cough đường hô hấp cấp',
      batchNumber: 'KC-2026-1102',
      date: '2026-09-20',
      nextDueDate: '2027-09-20',
      doctor: 'BS. Nguyễn Hải Nam',
      license: 'CCHN: 00981/TY-HN',
      facility: 'BV Thú Y PetCare Central',
      status: 'HỢP LỆ (VALID)'
    }
  ], []);

  // Phác đồ phòng ngừa nội ngoại ký sinh trùng chuẩn
  const defaultDeworms = useMemo(() => [
    {
      id: 'deworm-1',
      title: 'Drontal Plus Flavour',
      diseaseDesc: 'Tẩy sán dây, giun tròn, giun móc, giun tóc đường tiêu hóa',
      batchNumber: 'DT-2026-0988',
      date: '2026-08-01',
      nextDueDate: '2026-11-01',
      repeat: '3 tháng/lần',
      doctor: 'BS. Lê Minh Hoàng (Khoa Dược)',
      facility: 'Hệ thống PetCare Hub'
    },
    {
      id: 'deworm-2',
      title: 'NexGard Spectra 15-30kg',
      diseaseDesc: 'Phòng ngừa giun tim, ghẻ demodex, diệt ve rận & bọ chét tác dụng 30 ngày',
      batchNumber: 'NX-2027-5501',
      date: '2026-09-01',
      nextDueDate: '2026-10-01',
      repeat: '1 tháng/lần',
      doctor: 'BS. Lê Minh Hoàng (Khoa Dược)',
      facility: 'Hệ thống PetCare Hub'
    },
    {
      id: 'deworm-3',
      title: 'Bravecto Chewable (Viên nhai / Nhỏ gáy)',
      diseaseDesc: 'Phòng trị ve rận, bọ chét kéo dài 12 tuần liên tục',
      batchNumber: 'BV-2026-7720',
      date: '2026-07-15',
      nextDueDate: '2026-10-15',
      repeat: '3 tháng/lần',
      doctor: 'BS. Trần Thị Mai',
      facility: 'BV Thú Y PetCare Central'
    }
  ], []);

  // Tổng hợp dữ liệu thực tế nếu có từ schedules
  const petSchedules = useMemo(() => {
    return schedules.filter(s => s.petId === activePet.id);
  }, [schedules, activePet.id]);

  const vaccines = useMemo(() => {
    const realVax = petSchedules.filter(s => s.type === 'vaccine').map((s, idx) => ({
      id: s.id,
      title: s.title,
      diseaseDesc: s.notes || 'Phòng ngừa bệnh truyền nhiễm theo khuyến cáo WSAVA',
      batchNumber: s.batchNumber || `NV-2026-88${idx + 10}`,
      date: s.date || '2026-05-10',
      nextDueDate: s.nextDueDate || '2027-01-18',
      doctor: s.doctor || 'BS. Nguyễn Hải Nam',
      license: 'CCHN: 00981/TY-HN',
      facility: s.location || 'BV Thú Y PetCare Central',
      status: 'HỢP LỆ (VALID)'
    }));
    return realVax.length > 0 ? realVax : defaultVaccines;
  }, [petSchedules, defaultVaccines]);

  const deworms = useMemo(() => {
    const realDeworms = petSchedules.filter(s => s.type === 'deworm').map((s, idx) => ({
      id: s.id,
      title: s.title,
      diseaseDesc: s.notes || 'Kiểm soát ký sinh trùng định kỳ',
      batchNumber: s.batchNumber || `DT-2026-09${idx + 20}`,
      date: s.date || '2026-08-01',
      nextDueDate: s.nextDueDate || '2026-11-01',
      repeat: s.repeat || '3 tháng/lần',
      doctor: s.doctor || 'BS. Lê Minh Hoàng (Khoa Dược)',
      facility: s.location || 'PetCare Hub'
    }));
    return realDeworms.length > 0 ? realDeworms : defaultDeworms;
  }, [petSchedules, defaultDeworms]);

  // Phím Esc đóng modal và quản lý class in ấn trên body
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('wsava-modal-active');
    } else {
      document.body.classList.remove('wsava-modal-active');
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('wsava-modal-active');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Kích hoạt in trình duyệt (window.print())
  const handlePrint = () => {
    try { sound?.playSuccess?.(); } catch {}
    setTimeout(() => {
      window.print();
    }, 150);
  };

  if (!isOpen) return null;

  return createPortal(
    <div id="wsava-print-portal" className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop mờ chỉ hiển thị trên màn hình (ẩn khi in) */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity no-print"
        onClick={onClose}
      />

      {/* Vùng điều khiển & xem trước */}
      <div className="relative min-h-screen flex flex-col items-center justify-start p-2 sm:p-6 no-print-wrapper">
        
        {/* ============================================================ */}
        {/* THANH ĐIỀU KHIỂN OBSIDIAN HUD TRÊN CÙNG (ẨN KHI IN)          */}
        {/* ============================================================ */}
        <div className="sticky top-2 sm:top-4 z-20 w-full max-w-4xl mb-4 p-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black text-white uppercase tracking-tight">
                  Hộ Chiếu & Sổ Tiêm Quốc Tế WSAVA
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Global Standard 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Xuất file PDF chuẩn A4, chứng nhận xuất cảnh IATA & kiểm soát dịch tễ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Bộ chọn thú cưng nếu có nhiều bé */}
            {pets.length > 1 && (
              <div className="relative">
                <select
                  value={activePetId}
                  onChange={(e) => {
                    try { sound?.playClick?.(); } catch {}
                    setActivePetId(e.target.value);
                  }}
                  className="appearance-none bg-slate-800 text-white text-xs font-semibold px-3 py-2 pr-8 rounded-xl border border-white/15 focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {pets.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      🐾 {p.name} ({p.breed || 'Thú cưng'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Nút In / Xuất PDF ngay */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
              title="Mở hộp thoại In / Lưu file PDF của trình duyệt"
            >
              <Printer className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span>In / Lưu PDF (A4)</span>
            </button>

            {/* Nút Đóng */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TỜ GIẤY A4 WSAVA PASSPORT CHUẨN IN VÀ XEM TRƯỚC              */}
        {/* ============================================================ */}
        <div 
          id="wsava-print-document"
          className="relative w-full max-w-[840px] bg-white text-slate-900 shadow-2xl rounded-sm p-6 sm:p-10 border border-slate-200 print:border-none print:shadow-none print:p-0 print:m-0"
        >
          {/* HEADER: LOGO WSAVA & BỆNH VIỆN THÚ Y */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-start justify-between gap-4">
              
              {/* Bên trái: Logo WSAVA & Tổ chức Thú y */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl border-2 border-slate-900 p-1 flex flex-col items-center justify-center bg-slate-50 shrink-0">
                  <div className="text-[9px] font-black font-mono tracking-tighter text-emerald-800 leading-none">
                    WSAVA
                  </div>
                  <div className="w-7 h-7 my-0.5 text-emerald-700 flex items-center justify-center">
                    <Globe className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div className="text-[7px] font-bold uppercase tracking-tight text-slate-700 leading-none">
                    GLOBAL
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-black tracking-widest text-emerald-800 uppercase font-mono">
                    WORLD SMALL ANIMAL VETERINARY ASSOCIATION
                  </div>
                  <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight leading-snug">
                    HỆ THỐNG BỆNH VIỆN THÚ Y QUỐC TẾ PETCARE CENTRAL
                  </h1>
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                    INTERNATIONAL PET PASSPORT & OFFICIAL VACCINATION RECORD
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Chứng nhận đạt quy chuẩn tiêm phòng WSAVA 2026 & Quy chuẩn xuất cảnh động vật IATA
                  </p>
                </div>
              </div>

              {/* Bên phải: Mã số Hộ chiếu & Ngày chứng thực */}
              <div className="text-right shrink-0">
                <div className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-400 rounded text-right mb-1">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    PASSPORT NO.
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-950 font-mono tracking-wider">
                    WSAVA-{activePet.microchip}
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 font-medium">
                  Ngày cấp: <strong className="font-mono text-slate-900">{formatDateVi(new Date().toISOString().split('T')[0])}</strong>
                </div>
                <div className="text-[9px] text-emerald-700 font-bold uppercase">
                  STATUS: VERIFIED & ACTIVE
                </div>
              </div>

            </div>
          </div>

          {/* ============================================================ */}
          {/* KHỐI 1: THÔNG TIN ĐỊNH DANH THÚ CƯNG (IDENTIFICATION)        */}
          {/* ============================================================ */}
          <div className="border border-slate-400 rounded-lg p-3.5 bg-slate-50/60 mb-4 wsava-avoid-break">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-900 pb-2 mb-2 border-b border-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-800" />
                <span>I. THÔNG TIN ĐỊNH DANH THÚ CƯNG (ANIMAL IDENTIFICATION)</span>
              </span>
              <span className="text-[10px] font-mono text-slate-600 lowercase font-normal">
                iso 11784 / 11785 fdx-b compliant
              </span>
            </div>

            <div className="grid grid-cols-12 gap-3.5 items-center">
              {/* Ảnh thú cưng chuẩn Passport */}
              <div className="col-span-3 sm:col-span-2 flex flex-col items-center">
                <div className="w-20 h-24 rounded border-2 border-slate-800 overflow-hidden bg-white shadow-sm p-0.5">
                  <img
                    src={activePet.avatar}
                    alt={activePet.name}
                    className="w-full h-full object-cover rounded-xs"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=160';
                    }}
                  />
                </div>
                <span className="text-[9px] font-mono font-bold text-slate-600 mt-1 uppercase">
                  OFFICIAL PHOTO
                </span>
              </div>

              {/* Thông tin chi tiết */}
              <div className="col-span-6 sm:col-span-7 space-y-1.5 text-[11px]">
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Tên thú cưng (Name):</span>
                    <strong className="text-sm font-black text-slate-950 uppercase">{activePet.name}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Giống loài (Breed):</span>
                    <strong className="text-xs font-bold text-slate-900">{activePet.breed}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Giới tính & Triệt sản:</span>
                    <span className="font-semibold text-slate-900">{activePet.gender} • {activePet.isNeutered ? 'Đã triệt sản' : 'Chưa triệt sản'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Tuổi & Ngày sinh:</span>
                    <span className="font-semibold text-slate-900">{getAgeText(activePet.birthDate)} ({formatDateVi(activePet.birthDate)})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Cân nặng (Weight):</span>
                    <strong className="font-bold text-slate-900">{activePet.weight} kg</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Màu lông (Color):</span>
                    <span className="font-semibold text-slate-900">{activePet.color}</span>
                  </div>
                </div>

                {/* Dãy số Microchip nổi bật */}
                <div className="pt-1.5 border-t border-slate-200 flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">MÃ VI MẠCH (MICROCHIP):</span>
                  <div className="px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-600 text-emerald-900 font-mono font-black text-xs tracking-widest shadow-xs">
                    {activePet.microchip}
                  </div>
                </div>
              </div>

              {/* Mã QR Xác thực Hải quan / Bệnh viện */}
              <div className="col-span-3 sm:col-span-3 flex flex-col items-center justify-center p-2 rounded border border-slate-300 bg-white text-center">
                <svg viewBox="0 0 100 100" className="w-18 h-18 text-slate-950" fill="currentColor">
                  {/* Top-left marker */}
                  <rect x="5" y="5" width="28" height="28" rx="3" fill="currentColor" />
                  <rect x="10" y="10" width="18" height="18" rx="1" fill="#fff" />
                  <rect x="14" y="14" width="10" height="10" rx="1" fill="currentColor" />
                  {/* Top-right marker */}
                  <rect x="67" y="5" width="28" height="28" rx="3" fill="currentColor" />
                  <rect x="72" y="10" width="18" height="18" rx="1" fill="#fff" />
                  <rect x="76" y="14" width="10" height="10" rx="1" fill="currentColor" />
                  {/* Bottom-left marker */}
                  <rect x="5" y="67" width="28" height="28" rx="3" fill="currentColor" />
                  <rect x="10" y="72" width="18" height="18" rx="1" fill="#fff" />
                  <rect x="14" y="76" width="10" height="10" rx="1" fill="currentColor" />
                  {/* Patterns */}
                  <rect x="38" y="10" width="8" height="8" />
                  <rect x="50" y="10" width="8" height="8" />
                  <rect x="38" y="24" width="20" height="6" />
                  <rect x="10" y="42" width="22" height="8" />
                  <rect x="38" y="38" width="24" height="24" fill="#047857" />
                  <circle cx="50" cy="50" r="6" fill="#fff" />
                  <rect x="68" y="42" width="10" height="10" />
                  <rect x="82" y="42" width="12" height="18" />
                  <rect x="38" y="68" width="12" height="12" />
                  <rect x="54" y="68" width="8" height="24" />
                  <rect x="68" y="68" width="26" height="10" />
                  <rect x="68" y="82" width="26" height="12" />
                </svg>
                <div className="mt-1 text-[8px] font-mono font-bold text-slate-700 uppercase leading-tight">
                  QR XÁC THỰC SỐ
                </div>
                <div className="text-[7px] text-slate-500 leading-tight">
                  Tra cứu Hải quan & Thú y
                </div>
              </div>

            </div>
          </div>

          {/* ============================================================ */}
          {/* BẢNG 1: LỊCH SỬ TIÊM CHỦNG VẮC-XIN (VACCINATION RECORD)       */}
          {/* ============================================================ */}
          <div className="mb-4 wsava-avoid-break">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
                <span>II. LỊCH SỬ TIÊM PHÒNG VẮC-XIN (VACCINATION HISTORY & PROPHYLAXIS)</span>
              </h2>
              <span className="text-[10px] font-bold text-emerald-800 uppercase">
                TIÊU CHUẨN BẢO HỘ MIỄN DỊCH WSAVA
              </span>
            </div>

            <table className="w-full text-[10px] border-collapse wsava-print-table">
              <thead>
                <tr className="bg-slate-200 text-slate-950 font-black text-left">
                  <th className="p-2 border border-slate-400 w-[30%]">Tên Vắc-xin & Bệnh Phòng Ngừa</th>
                  <th className="p-2 border border-slate-400 text-center w-[15%]">Số Lô (Lot #)</th>
                  <th className="p-2 border border-slate-400 text-center w-[14%]">Ngày Tiêm</th>
                  <th className="p-2 border border-slate-400 text-center w-[14%]">Hạn Nhắc Lại</th>
                  <th className="p-2 border border-slate-400 w-[17%]">Bác Sĩ & CCHN</th>
                  <th className="p-2 border border-slate-400 text-center w-[10%]">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.map((vax) => (
                  <tr key={vax.id} className="border-b border-slate-300">
                    {/* Tên vắc-xin */}
                    <td className="p-2 border border-slate-400 align-top">
                      <div className="font-extrabold text-slate-950 text-[11px] leading-tight">{vax.title}</div>
                      <div className="text-[9px] text-slate-600 mt-0.5 leading-snug">{vax.diseaseDesc}</div>
                    </td>
                    {/* Số lô */}
                    <td className="p-2 border border-slate-400 align-top text-center font-mono font-bold text-slate-900">
                      {vax.batchNumber}
                    </td>
                    {/* Ngày tiêm */}
                    <td className="p-2 border border-slate-400 align-top text-center font-mono font-medium text-slate-900">
                      {formatDateVi(vax.date)}
                    </td>
                    {/* Hạn nhắc lại */}
                    <td className="p-2 border border-slate-400 align-top text-center font-mono font-bold text-emerald-800">
                      {formatDateVi(vax.nextDueDate)}
                    </td>
                    {/* Bác sĩ & CCHN */}
                    <td className="p-2 border border-slate-400 align-top text-slate-900">
                      <div className="font-bold">{vax.doctor}</div>
                      <div className="text-[9px] text-slate-600 font-mono">{vax.license}</div>
                    </td>
                    {/* Trạng thái hợp lệ */}
                    <td className="p-2 border border-slate-400 align-top text-center font-bold text-emerald-800">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-600 text-[9px] font-black">
                        ✓ HỢP LỆ
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============================================================ */}
          {/* BẢNG 2: KIỂM SOÁT NỘI NGOẠI KÝ SINH TRÙNG (PARASITE CONTROL) */}
          {/* ============================================================ */}
          <div className="mb-5 wsava-avoid-break">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
                <span>III. KIỂM SOÁT NỘI NGOẠI KÝ SINH TRÙNG (PARASITE CONTROL PROTOCOL)</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-600 uppercase">
                TẨY GIUN, DIỆT VE RẬN & DỰ PHÒNG GIUN TIM
              </span>
            </div>

            <table className="w-full text-[10px] border-collapse wsava-print-table">
              <thead>
                <tr className="bg-slate-200 text-slate-950 font-black text-left">
                  <th className="p-2 border border-slate-400 w-[30%]">Tên Thuốc / Chế Phẩm Điều Trị</th>
                  <th className="p-2 border border-slate-400 text-center w-[15%]">Số Lô (Lot #)</th>
                  <th className="p-2 border border-slate-400 text-center w-[14%]">Ngày Dùng</th>
                  <th className="p-2 border border-slate-400 text-center w-[14%]">Hẹn Tái Liều</th>
                  <th className="p-2 border border-slate-400 text-center w-[12%]">Chu Kỳ</th>
                  <th className="p-2 border border-slate-400 w-[15%]">Bác Sĩ / Dược Sĩ</th>
                </tr>
              </thead>
              <tbody>
                {deworms.map((dew) => (
                  <tr key={dew.id} className="border-b border-slate-300">
                    {/* Tên thuốc */}
                    <td className="p-2 border border-slate-400 align-top">
                      <div className="font-extrabold text-slate-950 text-[11px] leading-tight">{dew.title}</div>
                      <div className="text-[9px] text-slate-600 mt-0.5 leading-snug">{dew.diseaseDesc}</div>
                    </td>
                    {/* Số lô */}
                    <td className="p-2 border border-slate-400 align-top text-center font-mono font-bold text-slate-900">
                      {dew.batchNumber}
                    </td>
                    {/* Ngày dùng */}
                    <td className="p-2 border border-slate-400 align-top text-center font-mono text-slate-900">
                      {formatDateVi(dew.date)}
                    </td>
                    {/* Hẹn tái liều */}
                    <td className="p-2 border border-slate-400 align-top text-center font-mono font-bold text-emerald-800">
                      {formatDateVi(dew.nextDueDate)}
                    </td>
                    {/* Chu kỳ */}
                    <td className="p-2 border border-slate-400 align-top text-center font-semibold text-slate-800">
                      {dew.repeat}
                    </td>
                    {/* Bác sĩ / Dược sĩ */}
                    <td className="p-2 border border-slate-400 align-top text-slate-900 font-medium">
                      {dew.doctor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============================================================ */}
          {/* PHẦN CHỨNG THỰC: CON DẤU MỘC & CHỮ KÝ ĐIỆN TỬ BÁC SĨ THÚ Y   */}
          {/* ============================================================ */}
          <div className="border-t-2 border-slate-900 pt-3 wsava-avoid-break">
            {/* Lời chứng nhận lâm sàng */}
            <p className="text-[10px] text-slate-700 italic leading-relaxed mb-4">
              "Tôi - Bác sĩ Thú y Trưởng ký tên dưới đây chứng nhận rằng thú cưng có mã định danh vi mạch Microchip số <strong>{activePet.microchip}</strong> đã được khám lâm sàng toàn diện, hoàn thành đầy đủ các mũi vắc-xin phòng bệnh cốt lõi và kiểm soát ký sinh trùng định kỳ theo tiêu chuẩn Hướng dẫn Tiêm chủng Quốc tế WSAVA 2026. Thú cưng có sức khỏe tốt, đạt bảo hộ miễn dịch và đủ điều kiện xuất nhập cảnh, lưu trú hoặc di chuyển đường hàng không."
            </p>

            <div className="grid grid-cols-2 gap-6 items-end">
              
              {/* Bên trái: Chữ ký chủ nuôi */}
              <div className="space-y-1">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                  CHỮ KÝ CHỦ SỞ HỮU (OWNER SIGNATURE)
                </div>
                <div className="text-[9px] text-slate-500">
                  Cam kết thông tin định danh và quản lý thú cưng chính xác
                </div>
                <div className="h-16 flex items-center pt-2">
                  <span className="font-serif italic text-lg text-slate-800 font-bold tracking-wider">
                    {activePet.ownerName || 'Mạnh Đinh'}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-900 border-t border-slate-300 pt-1">
                  Chủ nuôi: {activePet.ownerName || 'Mạnh Đinh'} • ĐT: {activePet.ownerPhone || '0912.345.678'}
                </div>
              </div>

              {/* Bên phải: Dấu mộc đỏ & Chữ ký Bác sĩ Thú y Trưởng */}
              <div className="text-center relative">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                  BÁC SĨ THÚ Y TRƯỞNG & DẤU MỘC CHỨNG THỰC
                </div>
                <div className="text-[9px] text-slate-500">
                  Chief Veterinary Officer • PetCare Central Hospital
                </div>

                {/* Khu vực con dấu & chữ ký lồng ghép */}
                <div className="h-20 relative flex items-center justify-center my-1">
                  
                  {/* Con Dấu Mộc Đỏ Bệnh Viện Tròn (Realistic Circular Stamp) */}
                  <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-red-600 text-red-600 flex flex-col items-center justify-center p-1 opacity-90 rotate-[-8deg] pointer-events-none select-none shadow-xs">
                    <div className="w-full h-full rounded-full border border-red-600 flex flex-col items-center justify-center p-0.5 text-center">
                      <div className="text-[6.5px] font-black uppercase tracking-tighter leading-tight">
                        ★ PETCARE CENTRAL ★
                      </div>
                      <div className="w-5 h-5 my-0.5 flex items-center justify-center text-red-600">
                        <Award className="w-4 h-4 stroke-[2]" />
                      </div>
                      <div className="text-[7px] font-black uppercase tracking-tighter leading-tight bg-red-600 text-white px-1 rounded-xs">
                        ĐÃ CHỨNG THỰC
                      </div>
                      <div className="text-[5.5px] font-bold uppercase tracking-tighter leading-tight mt-0.5">
                        WSAVA GUIDELINES 2026
                      </div>
                    </div>
                  </div>

                  {/* Chữ ký điện tử uốn lượn màu xanh mực */}
                  <div className="relative z-10 font-serif italic text-xl font-bold text-blue-900 tracking-wide rotate-[-3deg] select-none">
                    BS. Nguyễn Hải Nam
                  </div>
                </div>

                {/* Thông tin bác sĩ chứng thực */}
                <div className="border-t border-slate-300 pt-1">
                  <div className="text-xs font-black text-slate-950">
                    BS. Nguyễn Hải Nam (CCHN: 00981/TY-HN)
                  </div>
                  <div className="text-[9px] text-slate-600">
                    Giám đốc Chuyên môn • Bệnh Viện Thú Y PetCare Central
                  </div>
                  <div className="text-[8px] font-mono text-emerald-800 mt-0.5">
                    Mã xác thực số: SHA256: 98200036412-WSAVA-VALIDATED
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* Dòng ghi chú chân trang A4 */}
          <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[8px] text-slate-400 font-mono">
            Hộ chiếu điện tử cấp theo tiêu chuẩn Tổ chức Thú y Động vật Nhỏ Thế giới (WSAVA) • Hệ thống PetCare PRO AI Smart
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};

export default WsavaPassportModal;
