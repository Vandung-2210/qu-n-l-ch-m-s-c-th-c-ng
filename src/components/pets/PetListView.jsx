import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  Scale, 
  FileText, 
  Edit, 
  Trash2, 
  Sparkles, 
  ShieldCheck,
  PawPrint,
  Stethoscope,
  QrCode,
  Info,
  MoreVertical,
  CalendarPlus
} from 'lucide-react';
import { sound } from '../../services/soundService';

// Helper nhận dạng loài và icon hiển thị
const getSpeciesInfo = (species) => {
  const s = String(species || '').toLowerCase();
  if (s.includes('dog') || s.includes('chó')) return { icon: '🐕', label: 'Chó' };
  if (s.includes('cat') || s.includes('mèo')) return { icon: '🐱', label: 'Mèo' };
  if (s.includes('rabbit') || s.includes('thỏ')) return { icon: '🐰', label: 'Thỏ' };
  if (s.includes('hamster') || s.includes('chuột')) return { icon: '🐹', label: 'Hamster' };
  if (s.includes('bird') || s.includes('chim')) return { icon: '🦜', label: 'Chim' };
  return { icon: '🐾', label: species || 'Thú cưng' };
};

export const PetListView = ({
  pets = [],
  onOpenAddPet,
  onOpenEditPet,
  onDeletePet,
  onViewPetDetail,
  onOpenAiScheduleForPet,
  onOpenVetBooking = () => {},
  onOpenPublicQr = () => {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [openMenuPetId, setOpenMenuPetId] = useState(null);

  const filteredPets = pets.filter((pet) => {
    const pName = (pet.name || '').toLowerCase();
    const pBreed = (pet.breed || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchSearch = pName.includes(term) || pBreed.includes(term);
    const matchSpecies = filterSpecies === 'all' || pet.species === filterSpecies;
    return matchSearch && matchSpecies;
  });

  // Tính tuổi an toàn
  const calculateAge = (birthDate, fallbackAge) => {
    if (fallbackAge) return fallbackAge;
    if (!birthDate) return '2 tuổi';
    const birth = new Date(birthDate);
    const now = new Date();
    const diffMonths = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (diffMonths < 1) return 'Dưới 1 tháng';
    if (diffMonths < 12) return `${diffMonths} tháng`;
    const years = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;
    return remainingMonths > 0 ? `${years} tuổi ${remainingMonths} tháng` : `${years} tuổi`;
  };

  const handleViewDetails = (pet) => {
    try { sound?.playPop?.(); } catch {}
    onViewPetDetail(pet);
  };

  const handleBookAppointment = (pet) => {
    try { sound?.playClick?.(); } catch {}
    onOpenVetBooking({
      petId: pet.id,
      petName: pet.name,
      note: `Khám định kỳ cho ${pet.name}`
    });
  };

  return (
    <div className="space-y-6 pb-12 font-sans select-none text-white">
      
      {/* ---------------------------------------------------------------------- */}
      {/* 1. SỬA ĐỘ TƯƠNG PHẢN TIÊU ĐỀ (HEADER): DARK SPATIAL GLASSMORPHISM      */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3.5">
          {/* Icon Khung tròn kính ngọc bích */}
          <div className="bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 p-2.5 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0">
            <PawPrint className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            {/* Tiêu đề lớn text sáng rõ */}
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-wide flex items-center gap-2 flex-wrap">
              <span>HỒ SƠ THÚ CƯNG & CĂN CƯỚC ĐIỆN TỬ</span>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold normal-case">
                {pets.length} Thành viên
              </span>
            </h1>
            {/* Phụ đề màu xám nhạt */}
            <p className="text-xs text-slate-400 mt-1">
              Quản lý căn cước điện tử, vi-chip nhận dạng, số đo sinh học và đặc tính riêng biệt từng bé
            </p>
          </div>
        </div>

        {/* Nút Thêm Thú Cưng Mới ở góc phải */}
        <button
          onClick={() => {
            try { sound?.playClick?.(); } catch {}
            onOpenAddPet();
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-cyan-500/20 border border-cyan-400/30 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Thêm Thú Cưng Mới</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* THANH TÌM KIẾM & BỘ LỌC PHÂN LOÀI DARK GLASS                          */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 backdrop-blur-xl p-3.5 rounded-3xl border border-white/10 shadow-2xl">
        
        {/* Ô Tìm Kiếm */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc giống loài..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white/[0.05] border border-white/10 rounded-2xl text-white placeholder:text-slate-400 focus:bg-white/10 focus:border-cyan-400/50 outline-none transition-all shadow-inner"
          />
        </div>

        {/* Bộ lọc loài */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'dog', label: '🐶 Chó' },
            { id: 'cat', label: '🐱 Mèo' },
            { id: 'rabbit', label: '🐰 Thỏ' },
            { id: 'hamster', label: '🐹 Chuột' },
            { id: 'bird', label: '🦜 Chim' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                try { sound?.playClick?.(); } catch {}
                setFilterSpecies(item.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterSpecies === item.id
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black shadow-md shadow-cyan-500/20'
                  : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* 2. CẤU HÌNH LƯỚI 4 CỘT CÂN ĐỐI (ELIMINATE ORPHAN CARD)                  */}
      {/* ---------------------------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {filteredPets.map((pet) => {
          const speciesInfo = getSpeciesInfo(pet.species);
          const petImage = pet.avatar || pet.image || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600';
          const petGender = pet.gender === 'male' || pet.gender === 'Đực' ? '♂ Đực' : '♀ Cái';
          const petAge = calculateAge(pet.birthDate, pet.age);
          const petChip = pet.microchip || pet.chipId || (pet.name?.toLowerCase().includes('mochi') ? '98200036412' : 'WSAVA-098');
          const petColor = pet.color || (pet.name?.toLowerCase().includes('mochi') ? 'Vàng kim' : (pet.name?.toLowerCase().includes('luna') ? 'Xám xanh' : 'Trắng xám'));
          const petNote = pet.notes || pet.note || 'Tính cách hiền hòa, thân thiện, ăn uống và tiêu hóa tốt.';

          return (
            /* 3. THIẾT KẾ LẠI THẺ THÚ CƯNG THEO PHONG CÁCH KÍNH TỐI (DARK GLASS CARDS) */
            <div 
              key={pet.id}
              className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 hover:border-cyan-400/40 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10 flex flex-col justify-between group"
            >
              
              {/* Ảnh bé + Huy hiệu trạng thái trên ảnh */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                <img 
                  src={petImage} 
                  alt={pet.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30 pointer-events-none" />
                
                {/* Huy hiệu loài & triệt sản */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap z-10">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/90 text-slate-950 backdrop-blur-md shadow">
                    {speciesInfo.icon} {speciesInfo.label}
                  </span>
                  {pet.isNeutered && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/80 text-white backdrop-blur-md">
                      ✓ Đã triệt sản
                    </span>
                  )}
                  {pet.lostMode?.isLost && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white backdrop-blur-md animate-bounce">
                      🚨 Báo Mất
                    </span>
                  )}
                </div>

                {/* Giới tính góc phải */}
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/50 text-slate-300 border border-white/20 backdrop-blur-md z-10">
                  {petGender}
                </span>
              </div>

              {/* Nội dung thông tin bé */}
              <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between gap-1">
                    <h3 className="text-lg font-black text-white tracking-wide truncate">{pet.name}</h3>
                    <span className="text-[11px] text-cyan-400 font-mono shrink-0">Microchip #{petChip}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{pet.breed} • {petColor}</p>

                  {/* Thông số Tuổi & Cân nặng dạng Chip Kính */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-white/[0.04] border border-white/5 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
                      <Calendar className="text-cyan-400 shrink-0" size={13} />
                      <span className="text-xs font-semibold text-slate-200 truncate">{petAge}</span>
                    </div>
                    <div className="bg-white/[0.04] border border-white/5 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
                      <Scale className="text-emerald-400 shrink-0" size={13} />
                      <span className="text-xs font-semibold text-slate-200 truncate">{pet.weight} kg</span>
                    </div>
                  </div>

                  {/* Ghi chú tính cách / Dị ứng */}
                  <div className="mt-3 bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-[11px] text-slate-300 leading-relaxed italic flex items-start gap-1.5">
                    <span className="text-amber-400 not-italic shrink-0">💬</span>
                    <span className="line-clamp-2">{petNote}</span>
                  </div>
                </div>

                {/* Cụm Nút Hành Động Ở Đáy Thẻ */}
                <div className="pt-2 border-t border-white/5 flex items-center gap-2 relative">
                  <button 
                    type="button"
                    onClick={() => handleViewDetails(pet)}
                    className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all text-center cursor-pointer active:scale-95"
                  >
                    Chi tiết hồ sơ
                  </button>

                  <button 
                    type="button"
                    onClick={() => handleBookAppointment(pet)}
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-xs font-bold text-slate-950 transition-all shadow-md shadow-cyan-500/20 text-center flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                  >
                    <CalendarPlus size={13} />
                    <span>Đặt khám</span>
                  </button>

                  {/* Dropdown Menu Tùy chọn khác */}
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        try { sound?.playClick?.(); } catch {}
                        setOpenMenuPetId(openMenuPetId === pet.id ? null : pet.id);
                      }}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        openMenuPetId === pet.id
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-400 hover:text-white'
                      }`}
                      title="Tùy chọn khác"
                    >
                      <MoreVertical size={14} />
                    </button>

                    {/* Dropdown Menu Popup */}
                    {openMenuPetId === pet.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setOpenMenuPetId(null)} 
                        />
                        <div 
                          className="absolute right-0 bottom-full mb-2 w-48 p-1.5 rounded-2xl bg-slate-900/95 border border-white/15 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 text-slate-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPetId(null);
                              try { sound?.playPop?.(); } catch {}
                              onOpenAiScheduleForPet(pet);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer text-left"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            <span>AI Lộ trình chăm sóc</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPetId(null);
                              try { sound?.playClick?.(); } catch {}
                              onOpenPublicQr(pet);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer text-left"
                          >
                            <QrCode className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Mã QR Y bạ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPetId(null);
                              try { sound?.playClick?.(); } catch {}
                              onOpenEditPet(pet);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer text-left"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-400" />
                            <span>Chỉnh sửa thông tin</span>
                          </button>

                          <div className="h-[1px] bg-white/10 my-1" />

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPetId(null);
                              if (window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ bé ${pet.name}?`)) {
                                onDeletePet(pet.id);
                              }
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 transition-all cursor-pointer text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Xóa hồ sơ</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                </div>
              </div>

            </div>
          );
        })}

        {/* ------------------------------------------------------------------ */}
        {/* 4. THẺ THỨ 4: "+ THÊM THÚ CƯNG MỚI" VỪA KHÍT 1 HÀNG 4 THẺ         */}
        {/* ------------------------------------------------------------------ */}
        <div
          onClick={() => {
            try { sound?.playClick?.(); } catch {}
            onOpenAddPet();
          }}
          className="bg-slate-900/40 hover:bg-slate-900/70 backdrop-blur-2xl border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer min-h-[380px] group"
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 group-hover:scale-110 group-hover:bg-cyan-500/20 text-cyan-400 flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
              + Thêm Thú Cưng Mới
            </h3>
            <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
              Khởi tạo hồ sơ căn cước điện tử, vi-chip nhận dạng và sổ y bạ số.
            </p>
          </div>

          <span className="mt-2 px-3 py-1 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-slate-300 group-hover:border-cyan-400/40 group-hover:text-white transition-all">
            Bấm để thêm ngay
          </span>
        </div>

      </div>

    </div>
  );
};

export default PetListView;
