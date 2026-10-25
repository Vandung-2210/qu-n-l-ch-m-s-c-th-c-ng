import React, { useState } from 'react';
import { 
  Flame, CheckCircle2, Circle, Plus, Trash2, Clock, 
  Award, ShieldCheck, UserCheck, Sparkles, AlertCircle 
} from 'lucide-react';
import { sound } from '../../services/soundService';

export default function DailyStreakChecklist({ 
  habits, 
  pets, 
  familyMembers, 
  currentMemberId, 
  onToggleHabit, 
  onAddHabit, 
  onDeleteHabit 
}) {
  const [selectedPetId, setSelectedPetId] = useState('all');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('all'); // 'all', 'morning', 'noon', 'evening'
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('morning');
  const [newPetId, setNewPetId] = useState(pets[0]?.id || 'p1');
  const [newScheduledTime, setNewScheduledTime] = useState('08:00');

  const filteredHabits = habits.filter(h => {
    if (selectedPetId !== 'all' && h.petId !== selectedPetId) return false;
    if (selectedTimeSlot !== 'all' && h.timeSlot !== selectedTimeSlot) return false;
    return true;
  });

  const totalCount = filteredHabits.length;
  const completedCount = filteredHabits.filter(h => h.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // ==========================================================
  // LOGIC TÍNH TOÁN STATE STREAK (TÍNH TỪ LỊCH SỬ THỰC TẾ)
  // ==========================================================
  // Chuỗi streak thực tế lấy từ dữ liệu các thói quen:
  const currentActiveStreak = habits.length > 0 
    ? Math.max(...habits.map(h => Number(h.streak) || 0))
    : 0;

  // Kiểm tra xem hôm nay đã hoàn thành 100% chưa:
  const isAllCompletedToday = totalCount > 0 && completedCount === totalCount;

  const handleToggle = async (id) => {
    const habit = habits.find(h => h.id === id);
    if (!habit?.completed) {
      sound.playSuccess();
    } else {
      sound.playClick();
    }
    onToggleHabit(id, currentMemberId);
  };

  const handleCreateHabit = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddHabit({
      petId: newPetId,
      title: newTitle.trim(),
      timeSlot: newTimeSlot,
      scheduledTime: newScheduledTime,
      icon: newTimeSlot === 'morning' ? 'Sun' : newTimeSlot === 'noon' ? 'Utensils' : 'Moon'
    });
    setNewTitle('');
    setShowAddForm(false);
    sound.playSuccess();
  };

  const getMemberName = (memberId) => {
    const mem = familyMembers.find(m => m.id === memberId);
    return mem ? mem.name : 'Người thân';
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-white/[0.08] rounded-3xl p-6 shadow-xl text-slate-800 dark:text-slate-100 transition-all duration-300">
      {/* Header with Streak Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <Flame className="w-5 h-5 animate-pulse" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Daily Checklist & Habit Tracker
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Theo dõi chuỗi ngày chăm sóc thú cưng liên tục cùng gia đình
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak Flame Pill */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-amber-50 dark:bg-gradient-to-r dark:from-amber-500/15 dark:to-orange-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 shadow-sm">
            <Flame className="w-5 h-5 fill-amber-500 text-amber-500 animate-bounce" />
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400/80">
                {isAllCompletedToday ? 'Chuỗi hôm nay' : 'Chuỗi đang giữ'}
              </div>
              <div className="text-sm font-black flex items-center gap-1">
                <span>{currentActiveStreak} ngày liên tục 🔥</span>
                {isAllCompletedToday && (
                  <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                    +1 🎉
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm việc</span>
          </button>
        </div>
      </div>

      {/* Progress Bar with big, clear % text to the right of the gradient bar */}
      <div className="py-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            Tiến độ hôm nay
          </span>
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40 font-mono font-bold text-xs shadow-xs">
            {completedCount}/{totalCount} hoàn thành
          </span>
        </div>

        {/* Thanh tiến độ dải gradient + text phần trăm (%) to và rõ ràng hơn ở bên phải thanh */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3.5 bg-slate-100 dark:bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/10 shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-500 shadow-[0_0_14px_rgba(16,185,129,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="shrink-0 flex items-center justify-end min-w-[4rem]">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight drop-shadow-[0_0_12px_rgba(52,211,153,0.3)]">
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 pb-4">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-xs">
          {[
            { id: 'all', label: 'Tất cả buổi' },
            { id: 'morning', label: '🌅 Sáng' },
            { id: 'noon', label: '☀️ Trưa' },
            { id: 'evening', label: '🌙 Tối' }
          ].map(slot => (
            <button
              key={slot.id}
              onClick={() => setSelectedTimeSlot(slot.id)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedTimeSlot === slot.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {slot.label}
            </button>
          ))}
        </div>

        {/* Pet Filter */}
        <select
          value={selectedPetId}
          onChange={(e) => setSelectedPetId(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        >
          <option value="all">🐾 Tất cả bé</option>
          {pets.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {/* Add New Habit Form */}
      {showAddForm && (
        <form onSubmit={handleCreateHabit} className="mb-4 p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Thêm thói quen / việc cần làm hàng ngày</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            <div className="sm:col-span-2">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="VD: Nhỏ mắt thuốc dưỡng, Đi dạo 30p..."
                className="w-full text-xs px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <select
                value={newTimeSlot}
                onChange={(e) => setNewTimeSlot(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                <option value="morning" className="text-slate-900 dark:text-white dark:bg-slate-900">🌅 Buổi sáng</option>
                <option value="noon" className="text-slate-900 dark:text-white dark:bg-slate-900">☀️ Buổi trưa</option>
                <option value="evening" className="text-slate-900 dark:text-white dark:bg-slate-900">🌙 Buổi tối</option>
              </select>
            </div>
            <div>
              <select
                value={newPetId}
                onChange={(e) => setNewPetId(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                {pets.map(p => (
                  <option key={p.id} value={p.id} className="text-slate-900 dark:text-white dark:bg-slate-900">{p.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Giờ nhắc:</span>
              <input
                type="time"
                value={newScheduledTime}
                onChange={(e) => setNewScheduledTime(e.target.value)}
                className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm"
              >
                Lưu việc
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Habit Items List */}
      <div className="space-y-2.5">
        {filteredHabits.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800">
            <Award className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Không có thói quen nào trong danh mục này</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Bấm "Thêm việc" để lập danh sách chăm sóc định kỳ cho bé</p>
          </div>
        ) : (
          filteredHabits.map(habit => {
            const pet = pets.find(p => p.id === habit.petId);
            return (
              <div
                key={habit.id}
                className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                  habit.completed
                    ? 'bg-slate-50/80 dark:bg-emerald-950/20 border-slate-200/80 dark:border-emerald-500/20'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-white/10 hover:border-cyan-400/50 dark:hover:border-cyan-400/40 hover:shadow-sm'
                }`}
              >
                {/* Left: Checkbox & Info */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <button
                    onClick={() => handleToggle(habit.id)}
                    className="flex-shrink-0 transition-transform active:scale-90 cursor-pointer"
                    title={habit.completed ? 'Đánh dấu chưa làm' : 'Đánh dấu đã hoàn thành'}
                  >
                    {habit.completed ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/80 transition-all shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300 dark:text-slate-500 hover:text-emerald-500 transition-colors shrink-0" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm tracking-tight transition-all truncate ${
                        habit.completed 
                          ? 'line-through text-slate-400 dark:text-slate-400 font-medium' 
                          : 'text-slate-900 dark:text-white font-bold'
                      }`}>
                        {habit.title}
                      </span>

                      {pet && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30">
                          {pet.name}
                        </span>
                      )}

                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-0.5">
                        <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                        {habit.scheduledTime}
                      </span>
                    </div>

                    {/* Completion audit / Streak info */}
                    <div className="flex items-center gap-3 mt-1 text-[11px]">
                      {habit.completed ? (
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Đã làm bởi: <strong className="font-bold text-slate-800 dark:text-slate-200">{getMemberName(habit.completedBy)}</strong> ({habit.completedAt || 'Vừa xong'})
                        </span>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Chưa hoàn thành hôm nay</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Streak count & Delete button */}
                <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold ${
                    habit.streak > 0
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                  }`}>
                    <Flame className={`w-3.5 h-3.5 ${habit.streak > 0 ? 'fill-amber-500 text-amber-500 animate-pulse' : ''}`} />
                    <span>{habit.streak || 0}d</span>
                  </div>

                  <button
                    onClick={() => onDeleteHabit(habit.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                    title="Xóa việc này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Co-parenting Notice */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
          <span>Đồng bộ thời gian thực giữa các thành viên gia đình (tránh cho ăn 2 lần)</span>
        </div>
        <span>Tự động làm mới chuỗi lúc 00:00</span>
      </div>
    </div>
  );
}
