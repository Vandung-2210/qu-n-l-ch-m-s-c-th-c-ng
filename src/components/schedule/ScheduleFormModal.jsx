import React, { useState, useEffect } from 'react';
import { X, CalendarPlus, Check, Clock, MapPin } from 'lucide-react';
import { SCHEDULE_TYPES } from '../../constants/mockData';
import { getTodayVnDate, getVnDateString } from '../../utils/dateUtils.js';

export const ScheduleFormModal = ({
  isOpen,
  onClose,
  onSave,
  pets = [],
  scheduleToEdit = null,
  initialDate = null,
  initialType = null,
  initialTitle = null,
  initialPetId = null
}) => {
  // Helper chuẩn hóa mã thú cưng theo danh sách thực tế
  const resolveTargetPetId = (targetId, petsList = []) => {
    if (!targetId || !Array.isArray(petsList) || petsList.length === 0) {
      return petsList?.[0]?.id || '';
    }
    const directMatch = petsList.find(p => p.id === targetId);
    if (directMatch) return directMatch.id;

    const targetStr = String(targetId).toLowerCase().trim();
    const match = petsList.find(p => {
      const pId = String(p.id).toLowerCase().trim();
      const pName = String(p.name || '').toLowerCase().trim();
      return pId === targetStr || pName === targetStr;
    });

    return match ? match.id : (petsList[0]?.id || '');
  };

  const [formData, setFormData] = useState({
    petId: resolveTargetPetId(initialPetId, pets),
    title: initialTitle || '',
    type: initialType || 'vaccine',
    date: initialDate ? getVnDateString(initialDate) : getTodayVnDate(),
    time: '09:00',
    location: '',
    repeat: 'none',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (scheduleToEdit) {
      setFormData({
        ...scheduleToEdit,
        petId: resolveTargetPetId(scheduleToEdit.petId, pets)
      });
    } else {
      setFormData({
        petId: resolveTargetPetId(initialPetId, pets),
        title: initialTitle || '',
        type: initialType || 'vaccine',
        date: initialDate ? getVnDateString(initialDate) : getTodayVnDate(),
        time: '09:00',
        location: '',
        repeat: 'none',
        notes: ''
      });
    }
  }, [scheduleToEdit, initialDate, initialType, initialTitle, initialPetId, pets, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề lịch hẹn!');
      return;
    }
    if (!formData.petId) {
      alert('Vui lòng chọn thú cưng!');
      return;
    }
    if (!formData.date) {
      alert('Vui lòng chọn ngày thực hiện!');
      return;
    }
    if (!formData.time) {
      alert('Vui lòng chọn giờ thực hiện!');
      return;
    }

    const matchedPet = pets.find(p => p.id === formData.petId);
    const resolvedPetName = matchedPet?.name || 'Thú cưng';

    setIsSubmitting(true);
    try {
      // Đính kèm cả petName và petId để đồng bộ dữ liệu chuẩn xác
      await onSave({
        ...formData,
        petName: resolvedPetName,
        petId: formData.petId,
        id: formData.id || `sch-${Date.now()}`
      });
      onClose();
    } catch (err) {
      alert(err.message || 'Lỗi lưu lịch trình. Dữ liệu đã được giữ nguyên.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-[#181926] text-slate-900 dark:text-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-white/10 my-8 transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/10 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {scheduleToEdit ? 'Chỉnh Sửa Lịch Hẹn' : 'Thêm Lịch Chăm Sóc Mới'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Thiết lập mốc thời gian và lời nhắc nhở cho bé</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Select Pet */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Áp dụng cho Thú cưng *
            </label>
            <select
              required
              value={formData.petId}
              onChange={(e) => setFormData({ ...formData, petId: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 text-sm font-semibold text-slate-900 dark:text-white outline-hidden cursor-pointer"
            >
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id} className="text-slate-900 dark:text-white dark:bg-slate-800">
                  {pet.name} ({pet.breed} - {pet.species})
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Loại sự kiện *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(SCHEDULE_TYPES).map(([typeKey, config]) => (
                <button
                  type="button"
                  key={typeKey}
                  onClick={() => setFormData({ ...formData, type: typeKey })}
                  className={`p-2 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                    formData.type === typeKey
                      ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs font-bold'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tiêu đề lịch hẹn *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: Tiêm phòng vắc-xin 7 bệnh mũi 2, Tẩy giun định kỳ..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden text-sm transition-all font-medium"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Ngày thực hiện *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] outline-hidden focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Giờ hẹn
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] outline-hidden focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Location & Repeat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Địa điểm
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Tại nhà, Bệnh viện thú y..."
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-hidden focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Lặp lại chu kỳ
              </label>
              <select
                value={formData.repeat}
                onChange={(e) => setFormData({ ...formData, repeat: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white outline-hidden focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
              >
                <option value="none" className="text-slate-900 dark:text-white dark:bg-slate-800">Không lặp lại (1 lần)</option>
                <option value="weekly" className="text-slate-900 dark:text-white dark:bg-slate-800">Hàng tuần</option>
                <option value="monthly" className="text-slate-900 dark:text-white dark:bg-slate-800">Hàng tháng</option>
                <option value="quarterly" className="text-slate-900 dark:text-white dark:bg-slate-800">Mỗi 3 tháng (Tẩy giun)</option>
                <option value="yearly" className="text-slate-900 dark:text-white dark:bg-slate-800">Hàng năm (Vắc-xin dại/7 bệnh)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Ghi chú & Dặn dò
            </label>
            <textarea
              rows={2}
              placeholder="Ví dụ: Nhịn ăn sáng, mang theo sổ tiêm chủng, cân lại trước khi uống thuốc..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-hidden transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu...' : (scheduleToEdit ? 'Lưu Thay Đổi' : 'Tạo Lịch Chăm Sóc')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
