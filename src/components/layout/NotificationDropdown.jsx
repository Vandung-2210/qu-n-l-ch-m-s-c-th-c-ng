import React from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  CalendarCheck2, 
  X,
  PawPrint
} from 'lucide-react';
import { ScheduleBadge } from '../common/Badges';

export const NotificationDropdown = ({
  isOpen,
  onClose,
  schedules = [],
  pets = [],
  onToggleComplete,
  onNavigateTab
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const overdueItems = schedules.filter(s => s.date < todayStr && !s.completed);
  const todayItems = schedules.filter(s => s.date === todayStr && !s.completed);

  return (
    <div className="absolute right-0 top-14 z-50 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 animate-in fade-in zoom-in-95 duration-150">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Thông Báo Lịch Nhắc Nhở
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 text-xs">
        {overdueItems.length === 0 && todayItems.length === 0 ? (
          <div className="py-8 text-center text-slate-400">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">Không có việc nào gấp!</p>
            <p className="text-[11px]">Tất cả lịch tiêm và chăm sóc hôm nay đã hoàn tất.</p>
          </div>
        ) : (
          <>
            {/* Overdue */}
            {overdueItems.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-rose-600 uppercase flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Cần làm ngay (Quá hạn {overdueItems.length})
                </div>
                {overdueItems.map(item => {
                  const pet = pets.find(p => p.id === item.petId);

                  return (
                    <div 
                      key={item.id}
                      className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-rose-950 dark:text-rose-200">{item.title}</div>
                        <div className="text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1 mt-0.5">
                          <span>Bé: {pet ? pet.name : 'Pet'}</span> • <span>Hạn: {item.date}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onToggleComplete(item.id)}
                        className="px-2 py-1 rounded-lg bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 shrink-0"
                      >
                        Xong
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Today */}
            {todayItems.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <div className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
                  <CalendarCheck2 className="w-3 h-3" /> Hôm nay ({todayItems.length})
                </div>
                {todayItems.map(item => {
                  const pet = pets.find(p => p.id === item.petId);

                  return (
                    <div 
                      key={item.id}
                      className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-emerald-950 dark:text-emerald-200">{item.title}</div>
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mt-0.5">
                          <span>Bé: {pet ? pet.name : 'Pet'}</span> • <span>Giờ: {item.time || 'Cả ngày'}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => onToggleComplete(item.id)}
                        className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 shrink-0"
                      >
                        Xong
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-700 mt-2 text-center">
        <button
          onClick={() => {
            onClose();
            onNavigateTab('schedule');
          }}
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Xem Toàn Bộ Lịch Chăm Sóc ➜
        </button>
      </div>

    </div>
  );
};
