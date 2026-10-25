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
import { formatDateVi, getTodayVnDate } from '../../utils/dateUtils';

/**
 * Tính tuổi thân thiện từ birthDate
 */
const getAgeText = (birthDateStr) => {
  if (!birthDateStr) return 'Chưa cập nhật ngày sinh';
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
    return 'Chưa cập nhật';
  }
};

export const WsavaPassportModal = ({
  isOpen = false,
  onClose = () => {},
  pets = [],
  selectedPetId = null,
  schedules = [],
  currentUser = null
}) => {
  // Xác định bé cưng mặc định
  const initialPetId = useMemo(() => {
    if (selectedPetId && selectedPetId !== 'all') {
      const match = pets.find(p => p.id === selectedPetId);
      if (match) return match.id;
    }
    return pets[0]?.id || null;
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
      if (pets[0]) {
        setActivePetId(pets[0].id);
      }
    }
  }, [isOpen, selectedPetId, pets]);

  // Thông tin bé cưng đang kích hoạt
  const activePet = useMemo(() => {
    const found = pets.find(p => p.id === activePetId) || pets[0] || {};
    
    return {
      ...found,
      name: found.name || 'Thú cưng',
      breed: found.breed || 'Chưa cập nhật',
      species: found.species || 'dog',
      gender: found.gender === 'male' || found.gender === 'Đực' ? 'Đực (Male)' : 'Cái (Female)',
      weight: found.weight != null ? found.weight : null,
      microchip: found.microchip || 'Chưa cập nhật',
      birthDate: found.birthDate || '',
      isNeutered: Boolean(found.isNeutered),
      color: (found.color && String(found.color).trim()) ? String(found.color).trim() : 'Chưa cập nhật',
      avatar: found.avatar || 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80',
      ownerName: currentUser?.name || found.ownerName || 'Chưa cập nhật',
      ownerPhone: currentUser?.phone || found.ownerPhone || 'Chưa cập nhật',
      ownerAddress: currentUser?.address || found.ownerAddress || 'Chưa cập nhật'
    };
  }, [pets, activePetId, currentUser]);

  const activePetKey = activePet.id;

  // Phác đồ vắc-xin từ lịch trình thực tế
  const vaccines = useMemo(() => {
    const vaxData = schedules.filter(s => s.petId === activePetId && s.type === 'vaccine');
    return vaxData.map((v) => ({
      id: v.id,
      title: v.title,
      diseaseDesc: v.notes || 'Phòng bệnh truyền nhiễm thú y',
      batchNumber: v.batchNumber || 'Chưa cập nhật',
      date: v.date,
      nextDueDate: v.nextDueDate || v.date,
      doctor: v.doctor || (v.completed ? 'Người nuôi ghi nhận' : 'Chưa có bác sĩ xác nhận'),
      license: v.doctorLicense || (v.completed ? 'Chưa cập nhật CCHN' : 'Chưa cập nhật'),
      facility: v.location || 'Chưa cập nhật cơ sở',
      status: v.completed ? 'ĐÃ TIÊM (COMPLETED)' : 'DỰ KIẾN (SCHEDULED)',
      completed: Boolean(v.completed)
    }));
  }, [schedules, activePetId]);

  // Phác đồ phòng ngừa nội ngoại ký sinh trùng từ lịch trình thực tế
  const deworms = useMemo(() => {
    const dewormData = schedules.filter(s => s.petId === activePetId && s.type === 'deworm');
    return dewormData.map(d => ({
      id: d.id,
      title: d.title,
      diseaseDesc: d.notes || 'Nội ngoại ký sinh trùng',
      batchNumber: d.batchNumber || 'Chưa cập nhật',
      date: d.date,
      nextDueDate: d.nextDueDate || d.date,
      repeat: d.repeat || 'Định kỳ',
      doctor: d.doctor || (d.completed ? 'Người nuôi ghi nhận' : 'Chưa có bác sĩ xác nhận'),
      facility: d.location || 'Chưa cập nhật cơ sở',
      completed: Boolean(d.completed)
    }));
  }, [schedules, activePetId]);

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

  if (pets.length === 0 || !activePet.id) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800">
           <PawPrint className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
           <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">Chưa có thú cưng</h3>
           <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Bạn cần thêm thông tin thú cưng vào hệ thống trước khi xuất Hộ chiếu tiêm chủng WSAVA.</p>
           <button onClick={onClose} className="px-5 py-2.5 w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all">
             Đóng
           </button>
        </div>
      </div>,
      document.body
    );
  }

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
        {/* THANH ĐIỀU KHIỂN HUD TRÊN CÙNG (ẨN KHI IN)                   */}
        {/* ============================================================ */}
        <div className="sticky top-2 sm:top-4 z-20 w-full max-w-4xl mb-4 p-3 rounded-2xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.08)] dark:shadow-2xl flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-black shadow-md shadow-emerald-500/15 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                  Hộ Chiếu & Sổ Tiêm Quốc Tế WSAVA
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-400/30">
                  Global Standard 2026
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Xuất file PDF chuẩn A4 theo dõi tiêm phòng & y bạ điện tử thú cưng
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
                  className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-semibold px-3 py-2 pr-8 rounded-xl border border-slate-200 dark:border-white/15 focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {pets.map(p => (
                    <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
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
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
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
                    SỔ THEO DÕI TIÊM PHÒNG & Y BẠ ĐIỆN TỬ WSAVA
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    Tài liệu lưu hành nội bộ và quản lý sức khỏe thú cưng (Không thay thế giấy kiểm dịch động vật của cơ quan thẩm quyền)
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
                    {activePet.microchip !== 'Chưa cập nhật' ? `WSAVA-${activePet.microchip}` : `ID-${activePet.id}`}
                  </div>
                </div>
                <div className="text-[10px] text-slate-600 font-medium">
                  Ngày cấp: <strong className="font-mono text-slate-900">{formatDateVi(getTodayVnDate())}</strong>
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
                    <span className="font-semibold text-slate-900">{getAgeText(activePet.birthDate)} ({formatDateVi(activePet.birthDate) || 'Chưa cập nhật'})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold block text-[10px] uppercase">Cân nặng (Weight):</span>
                    <strong className="font-bold text-slate-900">{activePet.weight != null ? `${activePet.weight} kg` : 'Chưa cập nhật'}</strong>
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

              {/* Mã QR Tra cứu */}
              <div className="col-span-3 sm:col-span-3 flex flex-col items-center justify-center p-2 rounded border border-slate-300 bg-white text-center">
                <QrCode className="w-16 h-16 text-slate-800" />
                <div className="mt-1 text-[8px] font-mono font-bold text-slate-700 uppercase leading-tight">
                  QR HỒ SƠ ĐIỆN TỬ
                </div>
                <div className="text-[7px] text-slate-500 leading-tight">
                  Tra cứu lịch tiêm & điều trị
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
                TIÊU CHUẨN WSAVA
              </span>
            </div>

            <table className="w-full text-[10px] border-collapse wsava-print-table">
              <thead>
                <tr className="bg-slate-200 text-slate-950 font-black text-left">
                  <th className="p-2 border border-slate-400 w-[30%]">Tên Vắc-xin & Bệnh Phòng Ngừa</th>
                  <th className="p-2 border border-slate-400 text-center w-[15%]">Số Lô (Lot #)</th>
                  <th className="p-2 border border-slate-400 text-center w-[14%]">Ngày Tiêm</th>
                  <th className="p-2 border border-slate-400 text-center w-[14%]">Hạn Nhắc Lại</th>
                  <th className="p-2 border border-slate-400 w-[17%]">Bác Sĩ / Người Thực Hiện</th>
                  <th className="p-2 border border-slate-400 text-center w-[10%]">Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {vaccines.length > 0 ? vaccines.map((vax) => (
                  <tr key={vax.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-400 align-top">
                      <div className="font-extrabold text-slate-950 text-[11px] leading-tight">{vax.title}</div>
                      <div className="text-[9px] text-slate-600 mt-0.5 leading-snug">{vax.diseaseDesc}</div>
                    </td>
                    <td className="p-2 border border-slate-400 align-top text-center font-mono font-bold text-slate-900">
                      {vax.batchNumber}
                    </td>
                    <td className="p-2 border border-slate-400 align-top text-center font-mono font-medium text-slate-900">
                      {formatDateVi(vax.date)}
                    </td>
                    <td className="p-2 border border-slate-400 align-top text-center font-mono font-bold text-emerald-800">
                      {formatDateVi(vax.nextDueDate)}
                    </td>
                    <td className="p-2 border border-slate-400 align-top text-slate-900">
                      <div className="font-bold">{vax.doctor}</div>
                      <div className="text-[9px] text-slate-600 font-mono">{vax.license}</div>
                    </td>
                    <td className="p-2 border border-slate-400 align-top text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black ${
                        vax.completed
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-600'
                          : 'bg-amber-50 text-amber-800 border border-amber-600'
                      }`}>
                        {vax.completed ? '✓ ĐÃ TIÊM' : '⏳ DỰ KIẾN'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="p-2 border border-slate-400 text-center text-slate-500">Chưa có dữ liệu vắc-xin</td>
                  </tr>
                )}
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
                TẨY GIUN & DIỆT VE RẬN ĐỊNH KỲ
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
                  <th className="p-2 border border-slate-400 w-[15%]">Bác Sĩ / Người Cho Uống</th>
                </tr>
              </thead>
              <tbody>
                {deworms.length > 0 ? deworms.map((dew) => (
                  <tr key={dew.id} className="border-b border-slate-300">
                    <td className="p-2 border border-slate-400 align-top">
                      <div className="font-extrabold text-slate-950 text-[11px] leading-tight">{dew.title}</div>
                      <div className="text-[9px] text-slate-600 mt-0.5 leading-snug">{dew.diseaseDesc}</div>
                    </td>
                    <td className="p-2 border border-slate-400 align-top text-center font-mono font-bold text-slate-900">
                      {dew.batchNumber}
                    </td>
                    <td className="p-2 border border-slate-400 align-top text-center font-mono text-slate-900">
                      {formatDateVi(dew.date)}
                    </td>
                    <td className="p-2 border border-slate-400 align-top text-center font-mono font-bold text-emerald-800">
                      {formatDateVi(dew.nextDueDate)}
                    </td>
                    <td className="p-2 border border-slate-400 align-top text-center font-semibold text-slate-800">
                      {dew.repeat}
                    </td>
                    <td className="p-2 border border-slate-400 align-top text-slate-900 font-medium">
                      {dew.doctor}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="6" className="p-2 border border-slate-400 text-center text-slate-500">Chưa có dữ liệu tẩy giun</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ============================================================ */}
          {/* PHẦN CHỨNG THỰC & CHỮ KÝ                                     */}
          {/* ============================================================ */}
          <div className="border-t-2 border-slate-900 pt-3 wsava-avoid-break">
            <p className="text-[10px] text-slate-700 italic leading-relaxed mb-4">
              "Sổ theo dõi tiêm phòng và chăm sóc định kỳ được ghi nhận cho thú cưng có mã định danh Microchip {activePet.microchip}. Mọi thông tin tiêm chủng và sử dụng thuốc được lưu trữ điện tử minh bạch trên hệ thống PetCare PRO AI."
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
                <div className="h-14 flex items-center pt-2">
                  <span className="font-serif italic text-lg text-slate-800 font-bold tracking-wider">
                    {activePet.ownerName}
                  </span>
                </div>
                <div className="text-[10px] font-bold text-slate-900 border-t border-slate-300 pt-1">
                  Chủ nuôi: {activePet.ownerName} • ĐT: {activePet.ownerPhone}
                </div>
              </div>

              {/* Bên phải: Xác nhận chuyên môn */}
              <div className="text-center">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-900">
                  XÁC NHẬN CHUYÊN MÔN THÚ Y
                </div>
                <div className="text-[9px] text-slate-500">
                  Hệ thống Phòng khám / Bệnh viện Thú y PetCare
                </div>

                <div className="h-14 flex flex-col items-center justify-center my-1 text-slate-500 text-xs italic">
                  {vaccines.some(v => v.completed && v.doctor && !v.doctor.includes('Người nuôi')) ? (
                    <div className="text-emerald-700 font-bold not-italic text-sm">
                      ✓ Đã có xác nhận lâm sàng
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-400 not-italic border border-dashed border-slate-300 rounded px-2 py-1">
                      (Chưa có bác sĩ thú y chứng thực chính thức)
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-300 pt-1">
                  <div className="text-xs font-bold text-slate-800">
                    Bác sĩ phụ trách: {vaccines.find(v => v.completed && v.doctor && !v.doctor.includes('Người nuôi'))?.doctor || 'Chưa cập nhật'}
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 mt-0.5">
                    Mã hồ sơ: {activePet.id} • Cấp ngày: {formatDateVi(getTodayVnDate())}
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
