import React, { useState, useEffect } from 'react';
import { X, PawPrint, Camera, Check, Sparkles } from 'lucide-react';
import { SPECIES_LIST } from '../../constants/mockData';

const SAMPLE_AVATARS = [
  { label: 'Golden Dog', url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80' },
  { label: 'Corgi', url: 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?auto=format&fit=crop&w=600&q=80' },
  { label: 'Poodle', url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80' },
  { label: 'British Shorthair Cat', url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80' },
  { label: 'Orange Cat', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80' },
  { label: 'Rabbit', url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=600&q=80' },
  { label: 'Hamster', url: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?auto=format&fit=crop&w=600&q=80' },
];

export const PetFormModal = ({ isOpen, onClose, onSave, petToEdit = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    gender: 'male',
    birthDate: '',
    weight: '',
    color: '',
    microchip: '',
    isNeutered: false,
    avatar: SAMPLE_AVATARS[0].url,
    notes: ''
  });

  const [autoGenerateSchedule, setAutoGenerateSchedule] = useState(true);

  useEffect(() => {
    if (petToEdit) {
      setFormData({
        ...petToEdit,
        weight: petToEdit.weight ? String(petToEdit.weight) : ''
      });
      setAutoGenerateSchedule(false);
    } else {
      setFormData({
        name: '',
        species: 'dog',
        breed: '',
        gender: 'male',
        birthDate: '',
        weight: '',
        color: '',
        microchip: '',
        isNeutered: false,
        avatar: SAMPLE_AVATARS[0].url,
        notes: ''
      });
      setAutoGenerateSchedule(true);
    }
  }, [petToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên thú cưng!');
      return;
    }

    onSave({
      ...formData,
      weight: formData.weight ? parseFloat(formData.weight) : 0
    }, autoGenerateSchedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <PawPrint className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {petToEdit ? 'Chỉnh Sửa Thông Tin Thú Cưng' : 'Thêm Thú Cưng Mới'}
              </h2>
              <p className="text-xs text-slate-500">Nhập đầy đủ thông tin để AI đưa ra phác đồ chính xác</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Species Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Loài thú cưng *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {SPECIES_LIST.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setFormData({ ...formData, species: item.id })}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    formData.species === item.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name & Breed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tên thú cưng *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Mochi, Bông..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white focus:outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Giống loài (Breed)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Golden Retriever, Mèo Anh lông ngắn..."
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white focus:outline-none text-sm transition-all"
              />
            </div>
          </div>

          {/* Gender & Birth Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Giới tính
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'male' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    formData.gender === 'male'
                      ? 'bg-blue-50 border-blue-400 text-blue-800'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  ♂ Đực
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: 'female' })}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    formData.gender === 'female'
                      ? 'bg-rose-50 border-rose-400 text-rose-800'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  ♀ Cái
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Ngày sinh / Ước tính
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white focus:outline-none text-xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cân nặng (kg)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="Ví dụ: 4.5"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white focus:outline-none text-xs transition-all"
              />
            </div>
          </div>

          {/* Color & Microchip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Màu lông
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Vàng kim, Tam thể, Xám xanh..."
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white focus:outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mã số Microchip (nếu có)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: VN-9820003412"
                value={formData.microchip}
                onChange={(e) => setFormData({ ...formData, microchip: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white focus:outline-none text-sm transition-all"
              />
            </div>
          </div>

          {/* Neutered Checkbox */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <input
              type="checkbox"
              id="isNeutered"
              checked={formData.isNeutered}
              onChange={(e) => setFormData({ ...formData, isNeutered: e.target.checked })}
              className="w-4 h-4 rounded-sm text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <label htmlFor="isNeutered" className="text-xs font-medium text-slate-700 cursor-pointer">
              Đã triệt sản / thiến (Giúp AI tính toán chính xác khẩu phần dinh dưỡng & hành vi)
            </label>
          </div>

          {/* Avatar URL & Sample Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Hình ảnh đại diện (URL)
            </label>
            <input
              type="url"
              placeholder="Dán link ảnh tại đây..."
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white focus:outline-none text-xs mb-2 transition-all"
            />

            {/* Quick Sample Avatars */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-[11px] text-slate-400 whitespace-nowrap">Chọn ảnh mẫu:</span>
              {SAMPLE_AVATARS.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setFormData({ ...formData, avatar: sample.url })}
                  className={`w-9 h-9 rounded-xl overflow-hidden shrink-0 border-2 transition-transform hover:scale-105 ${
                    formData.avatar === sample.url ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-transparent'
                  }`}
                >
                  <img src={sample.url} alt={sample.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Bệnh sử, dị ứng & ghi chú tính cách
            </label>
            <textarea
              rows={3}
              placeholder="Ví dụ: Thích bơi, sợ sấm sét, dị ứng thịt bò, đã mổ sỏi thận năm 2024..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-white focus:outline-none text-sm transition-all"
            />
          </div>

          {/* Auto Generate Schedule Checkbox */}
          {!petToEdit && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 border border-emerald-500/30 flex items-start gap-3">
              <input
                type="checkbox"
                id="autoGenSchedule"
                checked={autoGenerateSchedule}
                onChange={(e) => setAutoGenerateSchedule(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 mt-0.5"
              />
              <label htmlFor="autoGenSchedule" className="text-xs font-bold text-emerald-950 dark:text-emerald-300 cursor-pointer">
                ✨ AI Tự động sinh phác đồ tiêm vắc-xin, tẩy giun & nhỏ gáy trọn đời (Chuẩn WSAVA)
                <span className="block font-normal text-[11px] text-emerald-800 dark:text-emerald-400 mt-0.5">
                  Hệ thống tự động tính toán các mốc tiêm nhắc lại và đưa thẳng vào Lịch chăm sóc ngay khi tạo xong.
                </span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{petToEdit ? 'Lưu Thay Đổi' : 'Tạo Hồ Sơ Thú Cưng'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
