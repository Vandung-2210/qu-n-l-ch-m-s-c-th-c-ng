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
  CalendarPlus,
  RotateCcw,
  X,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { sound } from '../../services/soundService';

// Chuẩn hóa chuỗi tìm kiếm không phân biệt dấu tiếng Việt
const removeDiacritics = (str) => {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

// Helper nhận dạng loài và icon hiển thị, hỗ trợ ánh xạ nhãn tiếng Việt & mã dữ liệu
export const getSpeciesInfo = (species) => {
  const s = String(species || '').toLowerCase().trim();
  if (s === 'dog' || s === 'chó' || s.includes('dog') || s.includes('chó')) {
    return { id: 'dog', icon: '🐕', label: 'Chó', aliases: ['chó', 'cho', 'dog', 'cún', 'cun'] };
  }
  if (s === 'cat' || s === 'mèo' || s === 'meo' || s.includes('cat') || s.includes('mèo') || s.includes('meo')) {
    return { id: 'cat', icon: '🐱', label: 'Mèo', aliases: ['mèo', 'meo', 'cat', 'miêu', 'mieu'] };
  }
  if (s === 'rabbit' || s === 'thỏ' || s === 'tho' || s.includes('rabbit') || s.includes('thỏ') || s.includes('tho')) {
    return { id: 'rabbit', icon: '🐰', label: 'Thỏ', aliases: ['thỏ', 'tho', 'rabbit'] };
  }
  if (s === 'hamster' || s === 'chuột' || s === 'chuot' || s.includes('hamster') || s.includes('chuột') || s.includes('chuot')) {
    return { id: 'hamster', icon: '🐹', label: 'Hamster', aliases: ['hamster', 'chuột', 'chuot', 'mouse'] };
  }
  if (s === 'bird' || s === 'chim' || s.includes('bird') || s.includes('chim')) {
    return { id: 'bird', icon: '🦜', label: 'Chim', aliases: ['chim', 'bird'] };
  }
  if (s === 'other' || s === 'khác' || s === 'khac') {
    return { id: 'other', icon: '🐾', label: 'Khác', aliases: ['khác', 'khac', 'other'] };
  }
  return { id: s || 'other', icon: '🐾', label: species || 'Thú cưng', aliases: [s] };
};

export const PetListView = ({
  pets = [],
  petsLoading = false,
  petsError = null,
  onRetryLoadPets = null,
  onOpenAddPet,
  onOpenEditPet,
  onDeletePet,
  onViewPetDetail,
  onOpenAiScheduleForPet,
  onOpenVetBooking = () => {}
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecies, setFilterSpecies] = useState('all');
  const [openMenuPetId, setOpenMenuPetId] = useState(null);

  const handleClearSearchAndFilter = () => {
    try { sound?.playClick?.(); } catch {}
    setSearchTerm('');
    setFilterSpecies('all');
  };

  // Chuẩn hóa từ khóa tìm kiếm: bỏ khoảng trắng thừa đầu, cuối và giữa các từ
  const normalizedSearch = searchTerm.trim().replace(/\s+/g, ' ');
  const searchTokens = normalizedSearch ? normalizedSearch.toLowerCase().split(' ').filter(Boolean) : [];

  const filteredPets = pets.filter((pet) => {
    const speciesInfo = getSpeciesInfo(pet.species);

    // 1. Kiểm tra từ khóa tìm kiếm (tất cả các từ phải khớp trong các trường tên, giống hoặc loài của cùng hồ sơ)
    let matchSearch = true;
    if (searchTokens.length > 0) {
      const pName = String(pet.name || '').toLowerCase();
      const pNameNorm = removeDiacritics(pName);
      const pBreed = String(pet.breed || '').toLowerCase();
      const pBreedNorm = removeDiacritics(pBreed);
      const pSpeciesRaw = String(pet.species || '').toLowerCase();
      const pSpeciesRawNorm = removeDiacritics(pSpeciesRaw);
      const pSpeciesLabel = String(speciesInfo.label || '').toLowerCase();
      const pSpeciesLabelNorm = removeDiacritics(pSpeciesLabel);
      const aliases = Array.isArray(speciesInfo.aliases) ? speciesInfo.aliases : [];

      matchSearch = searchTokens.every((token) => {
        const tokenNorm = removeDiacritics(token);

        const nameMatch = pName.includes(token) || pNameNorm.includes(tokenNorm);
        const breedMatch = pBreed.includes(token) || pBreedNorm.includes(tokenNorm);
        const speciesRawMatch = pSpeciesRaw.includes(token) || pSpeciesRawNorm.includes(tokenNorm);
        const speciesLabelMatch = pSpeciesLabel.includes(token) || pSpeciesLabelNorm.includes(tokenNorm);
        const aliasMatch = aliases.some((a) => {
          const aLower = String(a).toLowerCase();
          const aNorm = removeDiacritics(aLower);
          return aLower.includes(token) || aNorm.includes(tokenNorm);
        });

        return nameMatch || breedMatch || speciesRawMatch || speciesLabelMatch || aliasMatch;
      });
    }

    // 2. Kiểm tra bộ lọc loài đang chọn
    const matchSpecies = filterSpecies === 'all' || 
                         pet.species === filterSpecies || 
                         speciesInfo.id === filterSpecies;

    // 3. Phải thỏa mãn đồng thời cả hai điều kiện
    return matchSearch && matchSpecies;
  });

  // Tính tuổi an toàn
  const calculateAge = (birthDate, fallbackAge) => {
    if (fallbackAge) return fallbackAge;
    if (!birthDate) return 'Chưa cập nhật';
    const birth = new Date(birthDate);
    if (isNaN(birth.getTime())) return 'Chưa cập nhật';
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
    <div className="space-y-6 pb-12 font-sans select-none text-slate-900 dark:text-white">
      
      {/* ---------------------------------------------------------------------- */}
      {/* 1. SỬA ĐỘ TƯƠNG PHẢN TIÊU ĐỀ (HEADER): MEDICAL MINIMALIST PORCELAIN    */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-[#12192A] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-2xl">
        <div className="flex items-center gap-3.5">
          {/* Icon Khung tròn kính ngọc bích */}
          <div className="bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 p-2.5 rounded-2xl flex items-center justify-center shadow-md shadow-cyan-500/15 shrink-0">
            <PawPrint className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            {/* Tiêu đề lớn text sáng rõ */}
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2 flex-wrap">
              <span>HỒ SƠ THÚ CƯNG & CĂN CƯỚC ĐIỆN TỬ</span>
              {petsLoading ? (
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-400/30 font-bold normal-case flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Đang tải hồ sơ...
                </span>
              ) : petsError ? (
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-400/30 font-bold normal-case flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-rose-500" />
                  Lỗi tải dữ liệu
                </span>
              ) : (
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/30 font-bold normal-case">
                  {pets.length} Thành viên
                </span>
              )}
            </h1>
            {/* Phụ đề */}
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
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
      {/* THANH TÌM KIẾM & BỘ LỌC PHÂN LOÀI PORCELAIN                            */}
      {/* ---------------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-[#12192A] backdrop-blur-xl p-3.5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-2xl">
        
        {/* Ô Tìm Kiếm */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc giống loài..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-800 dark:text-white placeholder:text-slate-400 focus:bg-white dark:focus:bg-white/10 focus:border-cyan-500 outline-none transition-all shadow-xs"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                try { sound?.playClick?.(); } catch {}
                setSearchTerm('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/10 cursor-pointer"
              title="Xóa từ khóa"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
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
                  : 'bg-slate-100/70 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-white/[0.08] hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/5'
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
      {/* TRƯỜNG HỢP 0: ĐANG TẢI DỮ LIỆU TỪ MÁY CHỦ */}
      {petsLoading && (
        <div className="space-y-6">
          <div className="p-5 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-900 dark:text-indigo-200 flex items-center gap-3.5 animate-pulse">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Đang tải danh sách hồ sơ thú cưng từ máy chủ...</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Vui lòng chờ trong giây lát trong khi hệ thống đồng bộ dữ liệu.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((idx) => (
              <div key={idx} className="bg-white/80 dark:bg-[#12192A]/80 rounded-3xl p-5 border border-slate-200/80 dark:border-white/10 shadow-lg animate-pulse min-h-[380px] flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-full h-44 rounded-2xl bg-slate-200 dark:bg-white/10" />
                  <div className="h-4 w-3/4 rounded-lg bg-slate-200 dark:bg-white/10" />
                  <div className="h-3 w-1/2 rounded-lg bg-slate-200 dark:bg-white/10" />
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex gap-2">
                  <div className="h-8 flex-1 rounded-xl bg-slate-200 dark:bg-white/10" />
                  <div className="h-8 w-16 rounded-xl bg-slate-200 dark:bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TRƯỜNG HỢP 1: LỖI KẾT NỐI HOẶC ĐỒNG BỘ DỮ LIỆU (KHÔNG HIỂN THỊ DANH SÁCH RỖNG) */}
      {!petsLoading && petsError && (
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-rose-500/5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold text-2xl shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Không thể tải danh sách thú cưng từ máy chủ
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">
                {petsError || 'Đã có lỗi xảy ra trong quá trình kết nối hoặc đồng bộ dữ liệu.'}
              </p>
            </div>
          </div>
          {onRetryLoadPets && (
            <button
              type="button"
              onClick={() => {
                try { sound?.playClick?.(); } catch {}
                onRetryLoadPets();
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Thử lại</span>
            </button>
          )}
        </div>
      )}

      {/* TH1: Tài khoản chưa có thú cưng nào (CHỈ KHI ĐÃ TẢI XONG VÀ KHÔNG CÓ LỖI) */}
      {!petsLoading && !petsError && pets.length === 0 && (
        <div className="p-6 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-900 dark:text-cyan-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-2xl shrink-0">
              🐾
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Chào mừng bạn đến với PetCare PRO AI!</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Bạn chưa có thú cưng nào trong hệ thống. Hãy thêm bé đầu tiên để kích hoạt sổ y bạ, căn cước điện tử và lịch chăm sóc.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenAddPet()}
            className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-xs rounded-2xl shadow hover:opacity-90 transition-all cursor-pointer whitespace-nowrap"
          >
            + Thêm Thú Cưng Đầu Tiên
          </button>
        </div>
      )}

      {/* TH2: Có thú cưng nhưng tìm kiếm/bộ lọc không khớp bản ghi nào */}
      {!petsLoading && !petsError && pets.length > 0 && filteredPets.length === 0 && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-[#12192A] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 text-center shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-2xl flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-3xl shadow-inner">
            🔍
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Không tìm thấy thú cưng phù hợp
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Không có hồ sơ nào khớp với từ khóa tìm kiếm hoặc bộ lọc loài hiện tại. Vui lòng thử từ khóa khác hoặc xóa bộ lọc để hiển thị toàn bộ danh sách.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleClearSearchAndFilter}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs rounded-2xl shadow-md shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Xóa tìm kiếm và bộ lọc</span>
            </button>
          </div>
        </div>
      )}

      {/* Lưới danh sách thú cưng (chỉ hiển thị khi có kết quả hoặc khi tài khoản mới) */}
      {!petsLoading && !petsError && (filteredPets.length > 0 || pets.length === 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {filteredPets.map((pet) => {
          const speciesInfo = getSpeciesInfo(pet.species);
          const hasAvatar = Boolean(pet.avatar && String(pet.avatar).trim());
          const petGender = pet.gender === 'male' || pet.gender === 'Đực' ? '♂ Đực' : '♀ Cái';
          const petAge = calculateAge(pet.birthDate, pet.age);
          const petColor = (pet.color && String(pet.color).trim()) ? String(pet.color).trim() : 'Chưa cập nhật';
          let resolvedWeight = pet.weight;
          if (Array.isArray(pet.weightHistory) && pet.weightHistory.length > 0) {
            const sortedH = [...pet.weightHistory]
              .filter(h => h && h.weight != null && !isNaN(h.weight) && Number(h.weight) > 0)
              .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
            if (sortedH.length > 0) {
              resolvedWeight = sortedH[sortedH.length - 1].weight;
            }
          }
          const petWeight = (resolvedWeight != null && resolvedWeight !== '') ? `${resolvedWeight} kg` : 'Chưa cập nhật';
          const petNote = (pet.notes && String(pet.notes).trim()) || (pet.note && String(pet.note).trim()) || 'Chưa có ghi chú đặc biệt';

          return (
            /* 3. THIẾT KẾ THẺ THÚ CƯNG THEO PHONG CÁCH MEDICAL PORCELAIN */
            <div 
              key={pet.id}
              className="bg-white dark:bg-[#12192A] backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 hover:border-cyan-500/40 dark:hover:border-cyan-400/40 rounded-3xl overflow-hidden shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/10 flex flex-col justify-between group"
            >
              
              {/* Ảnh bé + Huy hiệu trạng thái trên ảnh */}
              <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
                {hasAvatar ? (
                  <img 
                    src={pet.avatar} 
                    alt={pet.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    onError={(e) => {
                      e.target.style.display = 'none';
                      if (e.target.nextElementSibling) {
                        e.target.nextElementSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className={`w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 ${hasAvatar ? 'hidden' : 'flex'}`}
                >
                  <PawPrint className="w-10 h-10 stroke-[1.5] text-slate-300 dark:text-slate-600" />
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-400">Chưa có ảnh</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 pointer-events-none" />
                
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
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide truncate">{pet.name}</h3>
                    <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono shrink-0">
                      {pet.microchip ? `Chip #${pet.microchip}` : 'Chưa gắn microchip'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{pet.breed || 'Chưa cập nhật'} • {petColor}</p>

                  {/* Thông số Tuổi & Cân nặng dạng Chip Kính */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/5 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
                      <Calendar className="text-cyan-600 dark:text-cyan-400 shrink-0" size={13} />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{petAge}</span>
                    </div>
                    <div className="bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/5 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
                      <Scale className="text-emerald-600 dark:text-emerald-400 shrink-0" size={13} />
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{petWeight}</span>
                    </div>
                  </div>

                  {/* Ghi chú tính cách / Dị ứng */}
                  <div className="mt-3 bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-xl p-2.5 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed italic flex items-start gap-1.5">
                    <span className="text-amber-500 not-italic shrink-0">💬</span>
                    <span className="line-clamp-2">{petNote}</span>
                  </div>
                </div>

                {/* Cụm Nút Hành Động Ở Đáy Thẻ */}
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center gap-2 relative">
                  <button 
                    type="button"
                    onClick={() => handleViewDetails(pet)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 text-xs font-semibold dark:text-slate-300 dark:hover:text-white transition-all text-center cursor-pointer active:scale-95"
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
                          ? 'bg-cyan-50 text-cyan-700 border-cyan-400 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-400/40'
                          : 'bg-slate-100 hover:bg-slate-200 border-slate-200/80 text-slate-500 dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-slate-400 dark:hover:text-white'
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
                          className="absolute right-0 bottom-full mb-2 w-48 p-1.5 rounded-2xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-white/15 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1 text-slate-700 dark:text-slate-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPetId(null);
                              try { sound?.playPop?.(); } catch {}
                              onOpenAiScheduleForPet(pet);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer text-left"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                            <span>AI Lộ trình chăm sóc</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPetId(null);
                              try { sound?.playClick?.(); } catch {}
                              window.dispatchEvent(new CustomEvent('petcare_export_wsava_pdf', { detail: { petId: pet.id } }));
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer text-left"
                          >
                            <QrCode className="w-3.5 h-3.5 text-cyan-500" />
                            <span>Mã QR Y bạ</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPetId(null);
                              try { sound?.playClick?.(); } catch {}
                              onOpenEditPet(pet);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 transition-all cursor-pointer text-left"
                          >
                            <Edit className="w-3.5 h-3.5 text-blue-500" />
                            <span>Chỉnh sửa thông tin</span>
                          </button>

                          <div className="h-[1px] bg-slate-100 dark:bg-white/10 my-1" />

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPetId(null);
                              onDeletePet(pet.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:text-rose-200 dark:hover:bg-rose-500/20 transition-all cursor-pointer text-left"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
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
        {/* 4. THẺ THỨ 4: "+ THÊM THÚ CƯNG MỚI" (KÍNH MỜ THANH LỊCH)          */}
        {/* ------------------------------------------------------------------ */}
        <div
          onClick={() => {
            try { sound?.playClick?.(); } catch {}
            onOpenAddPet();
          }}
          className="bg-slate-50/50 hover:bg-slate-100/60 dark:bg-slate-900/40 dark:hover:bg-slate-900/70 backdrop-blur-2xl border-2 border-dashed border-slate-300 dark:border-white/15 hover:border-cyan-500/60 dark:hover:border-cyan-400/50 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-2xl hover:shadow-cyan-500/10 cursor-pointer min-h-[380px] text-slate-700 dark:text-slate-200 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 group-hover:scale-110 group-hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
              + Thêm Thú Cưng Mới
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] leading-relaxed">
              Khởi tạo hồ sơ căn cước điện tử, vi-chip nhận dạng và sổ y bạ số.
            </p>
          </div>

          <span className="mt-2 px-3 py-1 rounded-full text-[11px] font-bold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 group-hover:border-cyan-500/40 group-hover:text-slate-900 dark:group-hover:text-white transition-all">
            Bấm để thêm ngay
          </span>
        </div>

        </div>
      )}

    </div>
  );
};

export default PetListView;
