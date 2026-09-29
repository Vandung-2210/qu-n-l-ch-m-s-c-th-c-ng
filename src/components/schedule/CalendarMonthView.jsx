import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Plus,
  PawPrint
} from 'lucide-react';
import { ScheduleBadge } from '../common/Badges';

export const CalendarMonthView = ({
  schedules = [],
  pets = [],
  onSelectDate,
  onToggleComplete,
  onOpenAddScheduleWithDate
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Helper ngày đầu và cuối của tháng
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Ngày đầu tiên trong tuần (0: CN, 1: T2,...)
  const startDay = firstDayOfMonth.getDay();
  const totalDays = lastDayOfMonth.getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDayStr, setSelectedDayStr] = useState(todayStr);

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const safeSchedules = Array.isArray(schedules) ? schedules : [];
  const safePets = Array.isArray(pets) ? pets : [];

  // Gom lịch theo ngày YYYY-MM-DD
  const schedulesByDate = safeSchedules.reduce((acc, sch) => {
    if (!sch || !sch.date) return acc;
    const dateKey = String(sch.date).split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(sch);
    return acc;
  }, {});

  // Danh sách sự kiện của ngày đang được chọn xem chi tiết
  const selectedDaySchedules = schedulesByDate[selectedDayStr] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Calendar Grid Container (2 Cols) */}
      <div className="lg:col-span-2 bg-white dark:bg-[#0B0F19]/90 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        
        {/* Calendar Nav */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              {monthNames[month]} {year}
            </h3>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Hôm nay
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              title="Tháng trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
              title="Tháng sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 mb-2 uppercase tracking-wider">
          <div>CN</div>
          <div>T2</div>
          <div>T3</div>
          <div>T4</div>
          <div>T5</div>
          <div>T6</div>
          <div>T7</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {/* Empty cells before start day */}
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-16 sm:h-20 rounded-2xl bg-slate-50/40 opacity-30" />
          ))}

          {/* Month Days */}
          {Array.from({ length: totalDays }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const daySchedules = schedulesByDate[dateStr] || [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDayStr;

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDayStr(dateStr)}
                className={`h-16 sm:h-20 p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-200'
                    : isToday
                    ? 'border-slate-300 bg-slate-50 font-bold'
                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${
                    isToday ? 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]' : 'text-slate-700'
                  }`}>
                    {dayNum}
                  </span>
                  {daySchedules.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">
                      {daySchedules.length}
                    </span>
                  )}
                </div>

                {/* Event Dots / Chips */}
                <div className="space-y-1 overflow-hidden">
                  {daySchedules.slice(0, 2).map((sch) => (
                    <div
                      key={sch.id}
                      className={`text-[9px] truncate px-1 rounded-md font-semibold ${
                        sch.completed
                          ? 'bg-slate-100 text-slate-400 line-through'
                          : sch.type === 'vaccine'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sch.type === 'deworm'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {sch.title}
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <span className="text-[9px] text-slate-400 font-bold block truncate">
                      +{daySchedules.length - 2} việc khác
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Selected Day Details Panel (1 Col) */}
      <div className="bg-white dark:bg-[#0B0F19]/90 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-white/[0.08] shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.08] mb-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Chi tiết ngày</span>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-white">{selectedDayStr}</h4>
            </div>
            <button
              onClick={() => onOpenAddScheduleWithDate(selectedDayStr)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm lịch
            </button>
          </div>

          {selectedDaySchedules.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-xs">Không có sự kiện chăm sóc nào trong ngày này.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDaySchedules.map((sch) => {
                if (!sch) return null;
                const pet = safePets.find(p => p && p.id === sch.petId);

                return (
                  <div
                    key={sch.id || `cal-sch-${Math.random()}`}
                    className={`p-3 rounded-2xl border transition-all ${
                      sch.completed 
                        ? 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] opacity-70' 
                        : 'bg-white dark:bg-[#14182b] border-slate-200 dark:border-white/[0.08] shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onToggleComplete(sch.id)}
                          className="text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                        >
                          {sch.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                          )}
                        </button>
                        <span className={`text-xs font-bold ${sch.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {sch.title || 'Lịch chăm sóc'}
                        </span>
                      </div>
                      <ScheduleBadge type={sch.type} />
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-6 space-y-1">
                      {pet && (
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
                          <PawPrint className="w-3 h-3 text-emerald-600" /> Bé: {pet.name}
                        </div>
                      )}
                      {sch.time && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> Giờ: {sch.time}
                        </div>
                      )}
                      {sch.location && (
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400" /> {sch.location}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/[0.08] text-center">
          <p className="text-[11px] text-slate-400">
            Bấm vào bất kỳ ngày nào trên lịch để xem và thêm lịch hẹn tương ứng.
          </p>
        </div>
      </div>

    </div>
  );
};
