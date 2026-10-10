import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { sound } from '../../services/soundService';

/**
 * Helper: Lấy ngày Thứ 2 đầu tuần cho bất kỳ ngày nào
 */
export const getMonday = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0: Chủ Nhật, 1: Thứ Hai, ..., 6: Thứ Bảy
  const diff = day === 0 ? -6 : 1 - day; // Chuyển Thứ 2 thành ngày đầu tuần
  date.setDate(date.getDate() + diff);
  return date;
};

/**
 * Helper: Định dạng ngày theo chuẩn YYYY-MM-DD theo giờ địa phương (tránh lệch timezone)
 */
export const formatDateKey = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Helper: Tạo Tiêu đề tháng thông minh:
 * - Trong cùng 1 tháng: "Tháng MM, YYYY" (vd: Tháng 10, 2026)
 * - Trải dài qua 2 tháng: "Tháng MM - MM, YYYY" (vd: Tháng 09 - 10, 2026)
 * - Trải dài qua 2 năm: "Tháng MM, YYYY - Tháng MM, YYYY" (vd: Tháng 12, 2026 - Tháng 01, 2027)
 */
export const getSmartMonthTitle = (monday, sunday) => {
  const startMonth = monday.getMonth() + 1;
  const endMonth = sunday.getMonth() + 1;
  const startYear = monday.getFullYear();
  const endYear = sunday.getFullYear();

  const mStartStr = String(startMonth).padStart(2, '0');
  const mEndStr = String(endMonth).padStart(2, '0');

  if (startYear === endYear) {
    if (startMonth === endMonth) {
      return `Tháng ${mStartStr}, ${startYear}`;
    }
    return `Tháng ${mStartStr} - ${mEndStr}, ${startYear}`;
  }

  return `Tháng ${mStartStr}, ${startYear} - Tháng ${mEndStr}, ${endYear}`;
};

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const FULL_DAY_LABELS = [
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
  'Chủ Nhật'
];

/**
 * Component WeeklyCalendar (Lịch tuần trực quan)
 * Tự động tính toán tuần động, xử lý chuyển giao tháng, giao diện Light/Dark Mode tinh tế.
 */
export const WeeklyCalendar = ({
  selectedDate = new Date(),
  onSelectDate = () => {},
  schedules = [],
  className = ''
}) => {
  // Quản lý tuần hiện tại người dùng đang xem (offset số tuần so với tuần hiện tại)
  const [weekOffset, setWeekOffset] = useState(0);

  // Ngày hôm nay (Thời gian thực)
  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => formatDateKey(today), [today]);

  // Thứ 2 của tuần được hiển thị
  const currentMonday = useMemo(() => {
    const ref = new Date();
    ref.setDate(ref.getDate() + weekOffset * 7);
    return getMonday(ref);
  }, [weekOffset]);

  // Chủ nhật của tuần được hiển thị
  const currentSunday = useMemo(() => {
    const sun = new Date(currentMonday);
    sun.setDate(currentMonday.getDate() + 6);
    return sun;
  }, [currentMonday]);

  // Tiêu đề tháng thông minh
  const smartMonthTitle = useMemo(() => {
    return getSmartMonthTitle(currentMonday, currentSunday);
  }, [currentMonday, currentSunday]);

  // Danh sách 7 ngày trong tuần
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + index);
      const dateKey = formatDateKey(d);
      
      // Ngày thuộc tháng khác tháng bắt đầu tuần (thường là tháng kế tiếp)
      const isNextMonth = d.getMonth() !== currentMonday.getMonth();

      return {
        date: d,
        dateKey,
        dayLabel: DAY_LABELS[index],
        fullDayLabel: FULL_DAY_LABELS[index],
        dateNumber: String(d.getDate()).padStart(2, '0'),
        monthNumber: d.getMonth() + 1,
        isNextMonth,
        isToday: dateKey === todayKey
      };
    });
  }, [currentMonday, todayKey]);

  // Tập hợp các ngày có lịch hẹn / tác vụ
  const scheduleDatesCount = useMemo(() => {
    const countMap = {};
    if (Array.isArray(schedules)) {
      schedules.forEach(s => {
        if (s?.date) {
          countMap[s.date] = (countMap[s.date] || 0) + 1;
        }
      });
    }
    return countMap;
  }, [schedules]);

  const selectedKey = useMemo(() => {
    return selectedDate ? formatDateKey(selectedDate) : todayKey;
  }, [selectedDate, todayKey]);

  const handlePrevWeek = () => {
    try { sound?.playClick?.(); } catch {}
    setWeekOffset(prev => prev - 1);
  };

  const handleNextWeek = () => {
    try { sound?.playClick?.(); } catch {}
    setWeekOffset(prev => prev + 1);
  };

  const handleResetToday = () => {
    try { sound?.playClick?.(); } catch {}
    setWeekOffset(0);
    onSelectDate(new Date());
  };

  const isCurrentWeek = weekOffset === 0;

  // Lấy thông tin ngày đang chọn để hiển thị chi tiết
  const currentSelectedDayInfo = useMemo(() => {
    const targetKey = selectedKey;
    const found = weekDays.find(w => w.dateKey === targetKey);
    if (found) return found;

    const d = new Date(selectedDate);
    const dayIndex = d.getDay();
    const viIndex = dayIndex === 0 ? 6 : dayIndex - 1;
    return {
      date: d,
      dateKey: targetKey,
      dayLabel: DAY_LABELS[viIndex] || 'T2',
      fullDayLabel: FULL_DAY_LABELS[viIndex] || 'Hôm nay',
      dateNumber: String(d.getDate()).padStart(2, '0'),
      monthNumber: d.getMonth() + 1,
      isToday: targetKey === todayKey
    };
  }, [selectedKey, weekDays, selectedDate, todayKey]);

  return (
    <div className={`shrink-0 bg-white/85 dark:bg-[#151621]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.07] rounded-3xl p-3.5 sm:p-4 shadow-lg dark:shadow-2xl relative group hover:border-indigo-400/50 dark:hover:border-white/[0.12] transition-colors ${className}`}>
      
      {/* 1. Header: Icon, Tiêu đề Lịch Tuần & Tiêu đề Tháng Thông Minh kèm Điều Hướng */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06] mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Lịch Tuần Trực Quan
          </span>
        </div>

        {/* Cụm điều hướng tuần & Tiêu đề tháng thông minh */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={handlePrevWeek}
            title="Tuần trước"
            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Tiêu đề tháng thông minh */}
          <span 
            title={smartMonthTitle}
            className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-white/10 whitespace-nowrap shadow-xs"
          >
            {smartMonthTitle}
          </span>

          <button
            type="button"
            onClick={handleNextWeek}
            title="Tuần sau"
            className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/[0.05] hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Nút quay lại tuần hiện tại nếu đang ở tuần khác */}
          {!isCurrentWeek && (
            <button
              type="button"
              onClick={handleResetToday}
              title="Quay lại tuần này"
              className="ml-0.5 px-1.5 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-bold border border-indigo-500/20 flex items-center gap-1 transition-all cursor-pointer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span className="hidden sm:inline">Nay</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Hàng 7 ngày trong tuần */}
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
        {weekDays.map(item => {
          const isSelected = item.dateKey === selectedKey;
          const scheduleCount = scheduleDatesCount[item.dateKey] || 0;

          return (
            <button
              key={item.dateKey}
              type="button"
              onClick={() => {
                try { sound?.playClick?.(); } catch {}
                onSelectDate(item.date);
              }}
              title={`${item.fullDayLabel}, ngày ${item.dateNumber}/${String(item.monthNumber).padStart(2, '0')}${item.isToday ? ' (Hôm nay)' : ''}${scheduleCount > 0 ? ` • ${scheduleCount} lịch trình` : ''}`}
              className={`relative flex flex-col items-center justify-between py-1.5 sm:py-2 px-1 rounded-2xl transition-all duration-200 cursor-pointer select-none group/day min-h-[58px] ${
                isSelected
                  ? 'bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/35 ring-2 ring-indigo-400/80 font-bold scale-[1.03] z-10'
                  : item.isToday
                  ? 'bg-indigo-50/90 dark:bg-indigo-950/40 text-slate-800 dark:text-white ring-1.5 ring-indigo-400/70 border border-indigo-200/90 dark:border-indigo-500/40 hover:bg-indigo-100/90 dark:hover:bg-indigo-900/50 hover:scale-[1.04]'
                  : item.isNextMonth
                  ? 'bg-slate-50/50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200/50 dark:border-white/[0.04] hover:scale-[1.04]'
                  : 'bg-white/70 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.05] hover:scale-[1.04]'
              }`}
            >
              {/* Nhãn thứ (T2, T3, CN...) */}
              <span className={`text-[9px] uppercase tracking-wider font-extrabold ${
                isSelected
                  ? 'text-indigo-100'
                  : item.isToday
                  ? 'text-indigo-600 dark:text-indigo-300'
                  : 'text-slate-500 dark:text-slate-400'
              }`}>
                {item.dayLabel}
              </span>

              {/* Con số ngày + Chỉ số tháng phụ tinh tế nếu thuộc tháng kế tiếp */}
              <div className="flex flex-col items-center justify-center my-0.5">
                <span className={`text-xs font-black tracking-tight leading-tight ${
                  isSelected ? 'text-white' : ''
                }`}>
                  {item.dateNumber}
                </span>

                {/* Chỉ số tháng phụ (Secondary Month Indicator) */}
                {item.isNextMonth && (
                  <span className={`text-[7.5px] font-bold px-1 py-0.2 rounded-full uppercase leading-tight mt-0.5 tracking-tighter ${
                    isSelected
                      ? 'bg-white/25 text-white border border-white/30'
                      : 'bg-indigo-100/90 dark:bg-indigo-950/70 text-indigo-700 dark:text-cyan-300 border border-indigo-200/80 dark:border-indigo-500/30'
                  }`}>
                    Th.{item.monthNumber}
                  </span>
                )}
              </div>

              {/* Chấm tròn trạng thái */}
              <div className="flex items-center justify-center gap-0.5 h-2">
                {isSelected ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)] animate-pulse" />
                ) : item.isToday ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
                ) : scheduleCount > 0 ? (
                  <span className="w-1 h-1 rounded-full bg-cyan-500 dark:bg-cyan-400 group-hover/day:scale-125 transition-transform" />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-transparent" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Dòng thông tin phụ: Đang chọn ngày nào & Trạng thái lịch trình */}
      <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span className="truncate">
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">
              {currentSelectedDayInfo.fullDayLabel}, {currentSelectedDayInfo.dateNumber}/{String(currentSelectedDayInfo.monthNumber).padStart(2, '0')}
            </strong>
            {currentSelectedDayInfo.isToday && (
              <span className="ml-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-md">
                Hôm nay
              </span>
            )}
          </span>
        </div>

        <span className="text-[9px] font-mono text-indigo-600 dark:text-indigo-400 font-medium shrink-0">
          {scheduleDatesCount[selectedKey] 
            ? `${scheduleDatesCount[selectedKey]} lịch hẹn` 
            : 'Lịch trình khả dụng'}
        </span>
      </div>

    </div>
  );
};

export default WeeklyCalendar;
