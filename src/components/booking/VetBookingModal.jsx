import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Stethoscope, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Phone, 
  FileText, 
  Sparkles,
  ShieldAlert,
  Flame,
  ChevronDown
} from 'lucide-react';
import { sound } from '../../services/soundService';
import { addActiveAppointment } from '../../services/storageService';

export const VET_SERVICES = [
  {
    id: 'general',
    name: 'Khám tổng quát định kỳ',
    desc: 'Đo nhịp tim, nhiệt độ, kiểm tra mắt, tai và thể trạng tổng thể',
    icon: '🩺',
    badge: 'Định kỳ'
  },
  {
    id: 'dermatology',
    name: 'Da liễu & Vết nấm/ve rận',
    desc: 'Soi kính hiển vi tìm vi nấm, bọ chét, xét nghiệm tế bào học da',
    icon: '🩹',
    badge: 'Chuyên khoa'
  },
  {
    id: 'vaccine',
    name: 'Tiêm vắc-xin & Tẩy giun',
    desc: 'Vắc-xin 5/7 bệnh chó, 4 bệnh mèo, phòng dại và xổ giun định kỳ',
    icon: '💉',
    badge: 'Phòng ngừa'
  },
  {
    id: 'emergency',
    name: 'Cấp cứu tiêu hóa/nôn mửa',
    desc: 'Tiêu chảy ra máu, nuốt dị vật, co giật, bỏ ăn kéo dài',
    icon: '🚨',
    badge: 'Ưu tiên cấp cứu',
    isEmergency: true
  },
  {
    id: 'dental_spa',
    name: 'Khám răng & Spa móng',
    desc: 'Cạo vôi răng siêu âm, vệ sinh tuyến hôi, cắt tỉa móng và tai',
    icon: '✂️',
    badge: 'Vệ sinh'
  }
];

export const VET_FACILITIES = [
  {
    id: 'pethealth',
    name: 'Bệnh viện Thú y PetHealth 262 Quang Trung',
    address: '262 Quang Trung, Hà Đông, Hà Nội',
    hotline: '1900 6868 (Cấp cứu 24/7)',
    rating: '4.9 ★ (Hơn 12.000 ca điều trị)'
  },
  {
    id: 'sammi',
    name: 'Phòng khám Sammi Animal Clinic',
    address: 'Số 18 ngõ 282 Lạc Long Quân, Tây Hồ, Hà Nội',
    hotline: '024 2246 8899',
    rating: '4.8 ★ (Chuyên da liễu & thỏ kiểng)'
  },
  {
    id: '2vet',
    name: 'Bệnh viện Thú y 2Vet Hospital',
    address: '335 Kim Ngưu, Hai Bà Trưng, Hà Nội',
    hotline: '098 335 8126 (Cấp cứu 24/7)',
    rating: '4.9 ★ (Ngoại khoa & Hồi sức cấp cứu)'
  }
];

export const TIME_SLOTS = ['08:30', '09:30', '14:00', '16:30', '19:00'];

export const VetBookingModal = ({
  isOpen,
  onClose,
  pets = [],
  initialPetId = null,
  initialService = null,
  initialNote = null,
  initialFacility = null,
  onBookingSuccess
}) => {
  const [selectedPetId, setSelectedPetId] = useState('');
  const [selectedService, setSelectedService] = useState('Khám tổng quát định kỳ');
  const [selectedFacility, setSelectedFacility] = useState(VET_FACILITIES[0].name);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('14:00');
  const [symptomsNote, setSymptomsNote] = useState('');
  const [ownerName, setOwnerName] = useState('Đinh Xuân Mạnh');
  const [phone, setPhone] = useState('0987654321');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Khởi tạo dữ liệu form khi modal mở
  useEffect(() => {
    if (isOpen) {
      if (initialPetId) {
        setSelectedPetId(initialPetId);
      } else if (pets.length > 0) {
        setSelectedPetId(pets[0].id);
      }

      if (initialService) {
        const found = VET_SERVICES.find(s => 
          s.name === initialService || 
          s.id === initialService || 
          initialService.toLowerCase().includes(s.name.toLowerCase()) || 
          s.name.toLowerCase().includes(initialService.toLowerCase()) ||
          (initialService.toLowerCase().includes('da liễu') && s.id === 'dermatology')
        );
        setSelectedService(found ? found.name : initialService);
      } else {
        setSelectedService('Khám tổng quát định kỳ');
      }

      if (initialNote) {
        setSymptomsNote(initialNote);
      } else {
        setSymptomsNote('');
      }

      if (initialFacility) {
        setSelectedFacility(initialFacility);
      }

      setShowSuccessToast(false);
    }
  }, [isOpen, initialPetId, initialService, initialNote, initialFacility, pets]);

  if (!isOpen) return null;

  const selectedPet = pets.find(p => p.id === selectedPetId) || pets[0];
  const isEmergencySelected = selectedService.includes('Cấp cứu');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPetId && pets.length === 0) {
      alert('Vui lòng thêm thú cưng vào hệ thống trước khi đặt lịch.');
      return;
    }

    try { sound.playPop(); } catch (_) {}
    setIsSubmitting(true);

    const newAppointment = {
      id: 'BK-' + Date.now(),
      petId: selectedPet?.id || 'pet-unknown',
      petName: selectedPet?.name || 'Mochi',
      petType: selectedPet ? `${selectedPet.species === 'cat' ? 'Mèo' : selectedPet.species === 'rabbit' ? 'Thỏ' : 'Chó'} ${selectedPet.breed || ''}`.trim() : 'Thú cưng',
      ownerName: ownerName.trim() || 'Chủ nuôi',
      phone: phone.trim() || '0987654321',
      service: selectedService,
      facility: selectedFacility,
      date: selectedDate,
      time: selectedTime,
      note: symptomsNote.trim() || 'Đặt lịch kiểm tra sức khỏe qua PetCare PRO AI',
      status: 'pending', // Trạng thái 'pending' (Chờ tiếp nhận) chuẩn hóa theo yêu cầu
      assignedVet: 'Đang xếp lịch',
      adminNote: '',
      isEmergency: isEmergencySelected,
      createdAt: new Date().toISOString()
    };

    // Lưu vào bộ lưu trữ dùng chung localStorage.getItem('petcare_shared_appointments')
    const saved = addActiveAppointment(newAppointment);

    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccessToast(true);
      try { sound.playSuccess(); } catch (_) {}

      if (typeof onBookingSuccess === 'function') {
        onBookingSuccess(saved || newAppointment);
      }

      setTimeout(() => {
        setShowSuccessToast(false);
        onClose();
      }, 1500);
    }, 450);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#0f1322] border border-purple-500/30 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden my-6">
        
        {/* Neon Glow Accents */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-emerald-400 to-indigo-500" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg ${
              isEmergencySelected
                ? 'bg-gradient-to-tr from-rose-600 to-red-500 shadow-rose-600/30 animate-pulse'
                : 'bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-purple-600/30'
            }`}>
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Đặt Lịch Khám Thú Y 2 Chiều
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  24/7 Instant Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kết nối trực tiếp lịch khám với đội ngũ Bác sĩ Thú y & Phòng khám liên kết.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 relative z-10 text-xs">
          
          {/* 1. Chọn bé khám */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🐾 Chọn bé thú cưng cần khám:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {pets.map((pet) => {
                const isSelected = selectedPetId === pet.id;
                return (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => { sound.playClick(); setSelectedPetId(pet.id); }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-500/10'
                        : 'bg-slate-900/60 border-white/[0.08] text-slate-300 hover:bg-slate-800/80 hover:border-white/20'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                      {pet.photoUrl ? (
                        <img src={pet.photoUrl} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-purple-400">
                          {pet.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="truncate">
                      <strong className="block text-xs font-bold truncate">{pet.name}</strong>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {pet.species === 'cat' ? 'Mèo' : pet.species === 'rabbit' ? 'Thỏ' : 'Chó'} {pet.breed || ''}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Chọn dịch vụ khám */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span>🩺 Dịch vụ / Lý do khám:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VET_SERVICES.map((srv) => {
                const isSelected = selectedService === srv.name;
                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => { sound.playClick(); setSelectedService(srv.name); }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                      isSelected
                        ? srv.isEmergency
                          ? 'bg-rose-500/20 border-rose-500 text-white shadow-md shadow-rose-500/20'
                          : 'bg-emerald-500/20 border-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-slate-900/60 border-white/[0.08] text-slate-300 hover:bg-slate-800/80 hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{srv.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <strong className="text-xs font-bold truncate">{srv.name}</strong>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                          srv.isEmergency ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {srv.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-1">
                        {srv.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Chọn Cơ sở Thú y */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cơ sở / Bệnh viện Thú y tiếp nhận:</span>
            </label>
            <div className="space-y-1.5">
              {VET_FACILITIES.map((fac) => {
                const isSelected = selectedFacility === fac.name;
                return (
                  <label
                    key={fac.id}
                    onClick={() => { sound.playClick(); setSelectedFacility(fac.name); }}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-900/60 border-white/[0.08] text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <input
                      type="radio"
                      name="facility"
                      checked={isSelected}
                      onChange={() => setSelectedFacility(fac.name)}
                      className="mt-1 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold">{fac.name}</strong>
                        <span className="text-[10px] text-amber-400 font-bold">{fac.rating}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{fac.address}</p>
                      <span className="text-[10px] text-emerald-400 font-mono font-semibold block mt-0.5">
                        📞 Hotline: {fac.hotline}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 4. Ngày & Khung Giờ Khám */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ngày hẹn khám:</span>
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Khung giờ tiếp nhận:</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedTime === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => { sound.playClick(); setSelectedTime(slot); }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? 'bg-teal-500 text-slate-950 font-black shadow-md shadow-teal-500/20 scale-105'
                          : 'bg-slate-900 border border-white/10 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 5. Triệu chứng & Ghi chú của chủ */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Mô tả triệu chứng / Ghi chú lâm sàng:</span>
              </span>
              {initialNote && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Đã nạp từ AI Thị Giác
                </span>
              )}
            </label>
            <textarea
              rows={3}
              value={symptomsNote}
              onChange={(e) => setSymptomsNote(e.target.value)}
              placeholder="Ví dụ: Bé nôn ra bọt trắng 2 lần, rụng lông hình tròn ở cổ, bỏ ăn từ sáng..."
              className="w-full bg-slate-900 border border-white/10 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors leading-relaxed"
            />
          </div>

          {/* 6. Thông tin liên hệ chủ nuôi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-purple-400" />
                <span>Họ tên chủ nuôi:</span>
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>Số điện thoại xác nhận:</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-mono"
              />
            </div>
          </div>

          {/* Toast thông báo thành công */}
          {showSuccessToast && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-3 animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <strong className="block text-xs font-bold text-emerald-200">
                  Đặt lịch thành công!
                </strong>
                <span className="text-[11px] text-emerald-300">
                  Phòng khám sẽ liên hệ và cập nhật trạng thái lịch khám cho bạn ngay.
                </span>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                isEmergencySelected
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-600/30'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang gửi đặt lịch...' : 'Xác Nhận Đặt Lịch Khám'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default VetBookingModal;
