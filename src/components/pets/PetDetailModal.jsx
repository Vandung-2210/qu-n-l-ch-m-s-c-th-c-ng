import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Calendar, 
  Scale, 
  QrCode, 
  Printer, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Award, 
  PawPrint, 
  TrendingUp, 
  AlertTriangle, 
  Image as ImageIcon 
} from 'lucide-react';
import { SpeciesBadge, ScheduleBadge } from '../common/Badges';
import GrowthCurveComparisonView from './GrowthCurveComparisonView';
import { getTodayVnDate, isValidCalendarDate, formatDateVi } from '../../utils/dateUtils.js';
import { sound } from '../../services/soundService';

export const PetDetailModal = ({
  isOpen,
  onClose,
  pet,
  schedules = [],
  onUpdatePetWeight,
  onOpenAiScheduleForPet,
  onOpenLostMode,
  onOpenPoster
}) => {
  const [activeTab, setActiveTab] = useState('passport'); // passport | weight | growth | history
  const [newWeight, setNewWeight] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(getTodayVnDate());
  const [weightError, setWeightError] = useState(null);
  const contentRef = useRef(null);

  // Khởi tạo lại form cân nặng khi mở modal hoặc đổi thú cưng
  useEffect(() => {
    if (isOpen) {
      setNewWeight('');
      setNewWeightDate(getTodayVnDate());
      setWeightError(null);
    }
  }, [isOpen, pet?.id]);

  // Khóa cuộn trang nền khi modal mở, khôi phục khi đóng
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Khi chuyển tab, đặt lại vị trí cuộn của nội dung về đầu
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Lắng nghe sự kiện trước và sau khi in để điều khiển chế độ in thẻ căn cước
  useEffect(() => {
    const handleBeforePrint = () => {
      if (isOpen && activeTab === 'passport') {
        document.body.classList.add('pet-id-printing');
      }
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('pet-id-printing');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      document.body.classList.remove('pet-id-printing');
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, [isOpen, activeTab]);

  // Lịch sử cân nặng sắp xếp tăng dần theo ngày ghi nhận thực tế YYYY-MM-DD
  // Gọi useMemo vô điều kiện trước early return để tuân thủ React Rules of Hooks
  const sortedHistory = useMemo(() => {
    if (!Array.isArray(pet?.weightHistory)) return [];
    return [...pet.weightHistory]
      .filter(item => item && item.weight != null && !isNaN(item.weight) && Number(item.weight) > 0)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [pet?.weightHistory]);

  if (!isOpen || !pet) return null;

  // Ghi chú của bé (lấy đúng từ trường notes của thú cưng đang chọn)
  const petNote = (pet.notes && String(pet.notes).trim()) || (pet.note && String(pet.note).trim()) || 'Chưa có ghi chú đặc biệt';

  // Lọc lịch trình của riêng pet này
  const petSchedules = schedules.filter(s => s.petId === pet.id);
  const completedSchedules = petSchedules.filter(s => s.completed);
  const upcomingSchedules = petSchedules.filter(s => !s.completed);

  const latestRecordByDate = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1] : null;
  const currentWeightDisplay = latestRecordByDate 
    ? `${latestRecordByDate.weight} kg` 
    : (pet?.weight != null && pet?.weight !== '' ? `${pet.weight} kg` : 'Chưa cập nhật');

  const handleAddWeight = async (e) => {
    e.preventDefault();
    setWeightError(null);

    const todayVn = getTodayVnDate();
    const dateVal = (newWeightDate || '').trim();

    if (!dateVal) {
      setWeightError('Ngày ghi nhận không được để trống.');
      return;
    }

    if (!isValidCalendarDate(dateVal)) {
      setWeightError('Ngày ghi nhận không hợp lệ hoặc không tồn tại trên lịch thực tế (định dạng YYYY-MM-DD).');
      return;
    }

    if (dateVal > todayVn) {
      setWeightError(`Ngày ghi nhận (${formatDateVi(dateVal)}) không được thuộc tương lai (vượt quá hôm nay ${formatDateVi(todayVn)} theo giờ Việt Nam).`);
      return;
    }

    const cleanWeight = String(newWeight || '').trim().replace(',', '.');
    const numWeight = parseFloat(cleanWeight);
    if (!cleanWeight || isNaN(numWeight) || numWeight <= 0 || !/^\d+(\.\d+)?$/.test(cleanWeight)) {
      setWeightError('Cân nặng phải là một số dương lớn hơn 0 kg (ví dụ: 5.2 hoặc 5,2).');
      return;
    }

    const existingHistory = Array.isArray(pet.weightHistory) ? pet.weightHistory : [];
    const updatedHistory = [
      ...existingHistory,
      { date: dateVal, weight: numWeight }
    ].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    // Cân nặng hiện tại phải lấy từ bản ghi có ngày ghi nhận mới nhất, không đơn thuần từ lần nhập cuối
    const latestRecord = updatedHistory[updatedHistory.length - 1];
    const latestWeight = latestRecord ? latestRecord.weight : numWeight;

    try {
      if (onUpdatePetWeight) {
        await onUpdatePetWeight(pet.id, latestWeight, updatedHistory);
      }
      setNewWeight('');
      setNewWeightDate(todayVn);
      setWeightError(null);
    } catch (err) {
      // Giữ nguyên form để người dùng sửa, không thêm lịch sử hay đổi cân nặng
      setWeightError(err?.message || 'Lỗi cập nhật cân nặng.');
    }
  };

  const handlePrint = () => {
    try { sound?.playSuccess?.(); } catch {}
    document.body.classList.add('pet-id-printing');

    const handleCleanAfter = () => {
      document.body.classList.remove('pet-id-printing');
      window.removeEventListener('afterprint', handleCleanAfter);
    };
    window.addEventListener('afterprint', handleCleanAfter);

    setTimeout(() => {
      window.print();
      // Dọn dẹp an toàn sau khi đóng hộp thoại in
      setTimeout(() => {
        document.body.classList.remove('pet-id-printing');
      }, 400);
    }, 120);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-hidden no-print">
      <div className="bg-white dark:bg-[#181926] rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden max-h-[calc(100dvh-32px)] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* KHỐI THÔNG TIN VÀ ĐIỀU HƯỚNG CỐ ĐỊNH (SHRINK-0) */}
        <div className="shrink-0 px-6 pt-6 sm:px-8 sm:pt-7 pb-3.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#181926]">
          {/* Modal Top Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-3.5">
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
              {pet.avatar ? (
                <img
                  src={pet.avatar}
                  alt={pet.name}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs shrink-0"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-12 h-12 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 items-center justify-center shrink-0 text-slate-400 ${pet.avatar ? 'hidden' : 'flex'}`}>
                <PawPrint className="w-6 h-6 stroke-[1.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white truncate">{pet.name}</h2>
                  <SpeciesBadge species={pet.species} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{pet.breed || 'Chưa rõ giống'} • {pet.gender === 'male' ? '♂ Đực' : '♀ Cái'}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Đóng modal"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveTab('passport')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'passport'
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Căn Cước ID</span>
              </button>

              <button
                onClick={() => setActiveTab('growth')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'growth'
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                <span>Đường Cong Tăng Trưởng</span>
              </button>

              <button
                onClick={() => setActiveTab('weight')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'weight'
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Cân Nặng ({pet.weightHistory?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'history'
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Lịch Chăm Sóc ({petSchedules.length})</span>
              </button>
            </div>

            {/* Quick Action Badges */}
            <div className="flex items-center gap-1.5">

              {onOpenLostMode && (
                <button
                  onClick={() => onOpenLostMode(pet)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                    pet.lostMode?.isLost
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                  }`}
                  title="Chế Độ Báo Mất"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{pet.lostMode?.isLost ? 'Đang Báo Mất!' : 'Báo Mất'}</span>
                </button>
              )}

              {onOpenPoster && (
                <button
                  onClick={() => onOpenPoster(pet)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1 transition-all"
                  title="Tạo Poster Tìm Thú Lạc"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Poster Lạc</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* VÙNG NỘI DUNG TAB ĐƯỢC CUỘN DỌC (FLEX-1 MIN-H-0 OVERFLOW-Y-AUTO) */}
        <div 
          ref={contentRef}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 sm:py-6"
        >

        {/* TAB 1: PET PASSPORT ID CARD */}
        {activeTab === 'passport' && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 text-white p-6 sm:p-7 shadow-xl border border-emerald-500/30">
              
              {/* Card Watermark */}
              <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
                <PawPrint className="w-44 h-44" />
              </div>

              {/* Passport Header */}
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <PawPrint className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-black tracking-widest uppercase text-emerald-300">
                    CĂN CƯỚC THÚ CƯNG ĐIỆN TỬ
                  </span>
                </div>
                <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  ID: {pet.id.toUpperCase()}
                </span>
              </div>

              {/* Passport Body */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                {/* Pet Photo Frame */}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-36 rounded-2xl overflow-hidden border-2 border-emerald-400/50 shadow-md bg-slate-800 flex items-center justify-center">
                    {pet.avatar ? (
                      <img
                        src={pet.avatar}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex flex-col items-center justify-center gap-1.5 text-emerald-300/60 p-2 text-center ${pet.avatar ? 'hidden' : 'flex'}`}>
                      <PawPrint className="w-9 h-9 stroke-[1.5]" />
                      <span className="text-[11px] font-medium">Chưa có ảnh</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold mt-2 text-emerald-300 uppercase tracking-wider">
                    {pet.gender === 'male' || pet.gender === 'Đực' ? 'Giới tính: Đực' : 'Giới tính: Cái'}
                  </span>
                </div>

                {/* Details Table */}
                <div className="sm:col-span-2 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-emerald-800/40 pb-1">
                    <span className="text-emerald-300/80">Họ & Tên:</span>
                    <span className="font-extrabold text-sm text-white">{pet.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-800/40 pb-1">
                    <span className="text-emerald-300/80">Giống loài:</span>
                    <span className="font-semibold text-white">{pet.breed || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-800/40 pb-1">
                    <span className="text-emerald-300/80">Ngày sinh:</span>
                    <span className="font-semibold text-white">{pet.birthDate || 'Chưa rõ'}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-800/40 pb-1">
                    <span className="text-emerald-300/80">Cân nặng hiện tại:</span>
                    <span className="font-bold text-amber-300">{currentWeightDisplay}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-800/40 pb-1">
                    <span className="text-emerald-300/80">Màu sắc lông:</span>
                    <span className="font-semibold text-white">
                      {(pet.color && String(pet.color).trim()) ? String(pet.color).trim() : 'Chưa cập nhật'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-800/40 pb-1">
                    <span className="text-emerald-300/80">Mã Microchip:</span>
                    <span className="font-mono text-emerald-200">{pet.microchip || 'Chưa ghi nhận'}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-800/40 pb-1">
                    <span className="text-emerald-300/80">Triệt sản:</span>
                    <span className="font-semibold text-white">
                      {pet.isNeutered ? '✅ Đã triệt sản' : '❌ Chưa triệt sản'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-emerald-300/80">Ghi chú:</span>
                    <span className="font-semibold text-emerald-200 italic truncate max-w-[220px]" title={petNote}>
                      {petNote}
                    </span>
                  </div>
                </div>
              </div>

              {/* Passport Footer */}
              <div className="mt-5 pt-3 border-t border-emerald-500/30 flex items-center justify-between text-[11px] text-emerald-300/80">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  <span>Xác thực bởi PetCare AI System</span>
                </div>
                <span className="italic">Bảo hộ y tế số</span>
              </div>
            </div>

            {/* Print & Action buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" /> In Thẻ Căn Cước
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenAiScheduleForPet(pet);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Sparkles className="w-4 h-4" /> AI Tạo Lịch Chăm Sóc Cho {pet.name}
              </button>
            </div>
          </div>
        )}

        {/* TAB 1.5: GROWTH CURVE COMPARISON */}
        {activeTab === 'growth' && (
          <div className="space-y-4">
            <GrowthCurveComparisonView pet={pet} />
          </div>
        )}

        {/* TAB 2: WEIGHT TRACKER */}
        {activeTab === 'weight' && (
          <div className="space-y-5">
            {/* Add weight form */}
            <form onSubmit={handleAddWeight} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-end gap-3 shadow-xs">
              <div className="w-full sm:flex-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Ngày ghi nhận
                </label>
                <input
                  type="date"
                  required
                  max={getTodayVnDate()}
                  value={newWeightDate}
                  onChange={(e) => {
                    setNewWeightDate(e.target.value);
                    if (weightError) setWeightError(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer shadow-xs"
                />
              </div>

              <div className="w-full sm:flex-1">
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Cân nặng mới (kg)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  placeholder="Ví dụ: 5.2 hoặc 5,2"
                  value={newWeight}
                  onChange={(e) => {
                    setNewWeight(e.target.value);
                    if (weightError) setWeightError(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 [color-scheme:light] dark:[color-scheme:dark] outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1 transition-all"
              >
                <Plus className="w-4 h-4" /> Lưu cân nặng
              </button>
            </form>

            {/* Error Banner nếu có lỗi validation */}
            {weightError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{weightError}</span>
              </div>
            )}

            {/* Weight Records Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Ngày ghi nhận</th>
                    <th className="py-2.5 px-4">Cân nặng</th>
                    <th className="py-2.5 px-4">Biến động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {sortedHistory.length > 0 ? (
                    [...sortedHistory]
                      .reverse()
                      .map((rec, idx, arr) => {
                        const prevRec = arr[idx + 1];
                        let diff = null;
                        if (prevRec) {
                          diff = (rec.weight - prevRec.weight).toFixed(2);
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">{rec.date}</td>
                            <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{rec.weight} kg</td>
                            <td className="py-3 px-4">
                              {diff !== null ? (
                                <span className={`font-semibold ${Number(diff) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                  {Number(diff) > 0 ? `+${diff} kg` : `${diff} kg`}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500">Mốc đầu tiên</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-500 dark:text-slate-400 font-medium">
                        Chưa có lịch sử cân nặng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CARE & MEDICAL HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Sắp tới & Cần làm ({upcomingSchedules.length})
              </h4>
              {upcomingSchedules.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Không có lịch sắp tới nào cho bé.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingSchedules.map(sch => (
                    <div key={sch.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{sch.title}</div>
                        <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3" /> {sch.date} {sch.time}
                        </div>
                      </div>
                      <ScheduleBadge type={sch.type} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Đã hoàn thành ({completedSchedules.length})
              </h4>
              {completedSchedules.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Chưa có lịch sử hoàn thành.</p>
              ) : (
                <div className="space-y-2">
                  {completedSchedules.map(sch => (
                    <div key={sch.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs opacity-85">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-700 dark:text-slate-300 line-through">{sch.title}</div>
                          <div className="text-slate-400 dark:text-slate-500 text-[11px]">Ngày làm: {sch.completedAt ? sch.completedAt.split('T')[0] : sch.date}</div>
                        </div>
                      </div>
                      <ScheduleBadge type={sch.type} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        </div>
      </div>
    </div>

      {/* CỔNG IN THẺ CĂN CƯỚC THÚ CƯNG CHUYÊN DỤNG (CHỈ XUẤT HIỆN TRÊN BẢN IN) */}
      {createPortal(
        <div id="pet-id-print-portal" aria-hidden="true">
          <div className="pet-id-print-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-emerald-600 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <PawPrint className="w-5 h-5 text-emerald-700 shrink-0" />
                <div>
                  <span className="text-xs font-black tracking-widest uppercase text-emerald-800 block">
                    CĂN CƯỚC THÚ CƯNG ĐIỆN TỬ
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    PETCARE PRO AI • DIGITAL PET ID PASSPORT
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-600 text-emerald-800 bg-emerald-50">
                ID: {String(pet.id || '').toUpperCase()}
              </span>
            </div>

            {/* Body */}
            <div className="grid grid-cols-3 gap-5 items-center">
              {/* Pet Photo Frame */}
              <div className="flex flex-col items-center">
                <div className="w-28 h-32 rounded-xl overflow-hidden border-2 border-emerald-600 shadow-xs bg-slate-100 flex items-center justify-center">
                  {pet.avatar ? (
                    <img
                      src={pet.avatar}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-400 text-center p-2">
                      <PawPrint className="w-8 h-8 stroke-[1.5] text-slate-400" />
                      <span className="text-[10px] font-bold text-slate-500">Chưa có ảnh</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-bold mt-1.5 text-emerald-800 uppercase tracking-wider">
                  {pet.gender === 'male' || pet.gender === 'Đực' ? 'Giới tính: Đực' : 'Giới tính: Cái'}
                </span>
              </div>

              {/* Details Table */}
              <div className="col-span-2 space-y-1.5 text-xs">
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600 font-semibold">Họ & Tên:</span>
                  <span className="font-extrabold text-sm text-slate-900">{pet.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600 font-semibold">Giống loài:</span>
                  <span className="font-semibold text-slate-900">
                    {(pet.breed && String(pet.breed).trim()) ? String(pet.breed).trim() : 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600 font-semibold">Ngày sinh:</span>
                  <span className="font-semibold text-slate-900">
                    {(pet.birthDate && String(pet.birthDate).trim()) ? String(pet.birthDate).trim() : 'Chưa rõ'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600 font-semibold">Cân nặng hiện tại:</span>
                  <span className="font-bold text-emerald-700">
                    {currentWeightDisplay}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600 font-semibold">Màu sắc lông:</span>
                  <span className="font-semibold text-slate-900">
                    {(pet.color && String(pet.color).trim()) ? String(pet.color).trim() : 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600 font-semibold">Mã Microchip:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {(pet.microchip && String(pet.microchip).trim()) ? String(pet.microchip).trim() : 'Chưa ghi nhận'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-0.5">
                  <span className="text-slate-600 font-semibold">Triệt sản:</span>
                  <span className="font-semibold text-slate-900">
                    {pet.isNeutered ? '✓ Đã triệt sản' : '✕ Chưa triệt sản'}
                  </span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="text-slate-600 font-semibold">Ghi chú:</span>
                  <span className="font-medium text-slate-800 italic truncate max-w-[200px]" title={petNote}>
                    {petNote}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-3 pt-2 border-t border-emerald-600 flex items-center justify-between text-[10px] text-emerald-800">
              <div className="flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-700" />
                <span className="font-semibold">Xác thực bởi PetCare AI System</span>
              </div>
              <span className="italic font-medium">Bảo hộ y tế số</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
