import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Heart, Sparkles, Play, Pause, RotateCcw, 
  Lightbulb, Brain, Check, Plus, AlertCircle, Clock
} from 'lucide-react';
import { sound } from '../../services/soundService';
import { apiGetAll, apiCreate, apiUpdate } from '../../services/apiService';
import { getTodayVnDate } from '../../utils/dateUtils';

export const REFERENCE_DATA = {
  dog: {
    archetype: 'Thích tương tác & Năng động',
    vetAdvice: 'Không ép bé nhìn mắt khi bé đang căng thẳng; chỉ thực hiện khi bé đang thư thái bên bạn.',
    science: 'Nghiên cứu chứng minh khi chó và chủ giao tiếp bằng mắt tích cực, lượng hormone gắn kết sẽ tăng đáng kể.',
    quests: [
      { id: 'q1', title: 'Tập giao tiếp bằng mắt (Eye Contact)', duration: 180, category: 'Gắn Kết', desc: 'Nhìn âu yếm vào mắt bé khi bé ngồi yên và khen ngợi.', reward: 2 },
      { id: 'q2', title: 'Tìm đồ ăn bằng khứu giác', duration: 600, category: 'Trí Não', desc: 'Giấu thức ăn để bé dùng mũi tìm kiếm, giúp tiêu hao năng lượng.', reward: 2 },
      { id: 'q3', title: 'Massage vuốt dọc sống lưng', duration: 300, category: 'Thư Giãn', desc: 'Vuốt chậm rãi từ trán qua tai xuống lưng theo chiều lông mọc.', reward: 2 }
    ],
    gestures: [
      { id: 'g1', sign: 'Đuôi vẫy vòng tròn hình cánh quạt', meaning: 'Hạnh phúc cực độ, an toàn tuyệt đối' },
      { id: 'g2', sign: 'Liếm mép liên tục khi bị ôm', meaning: 'Đang căng thẳng nhẹ, cần bạn thả lỏng' },
      { id: 'g3', sign: 'Cúi thấp hai chân trước', meaning: 'Tư thế mời chơi đùa (Play Bow)' }
    ],
    tags: ['Thích vuốt ngực', 'Ham khen ngợi', 'Năng động']
  },
  cat: {
    archetype: 'Độc Lập & Nhạy Cảm',
    vetAdvice: 'Tuyệt đối không nhìn trừng trừng vào mắt mèo! Hãy chớp mắt thật chậm rồi quay nhẹ mặt đi.',
    science: 'Chớp mắt chậm rãi giúp hạ nhịp tim ở mèo và kích thích sự tin tưởng.',
    quests: [
      { id: 'q1', title: 'Thực hành "Chớp mắt chậm"', duration: 120, category: 'Ranh Giới', desc: 'Nhìn nhẹ vào mắt bé rồi từ từ nhắm mắt lại 2 giây rồi mở ra.', reward: 2 },
      { id: 'q2', title: 'Mô phỏng chu trình săn mồi', duration: 600, category: 'Bản Năng', desc: 'Vờn mồi giật chậm theo nhịp với cần câu mèo.', reward: 2 },
      { id: 'q3', title: 'Chải lông & gãi nhẹ cằm', duration: 300, category: 'Thư Giãn', desc: 'Chỉ vuốt ve vùng má và dưới cằm, tránh vùng bụng.', reward: 2 }
    ],
    gestures: [
      { id: 'g1', sign: 'Đầu chóp đuôi giật rung nhẹ', meaning: 'Rất hào hứng và chào đón bạn' },
      { id: 'g2', sign: 'Đập mạnh cả đuôi xuống sàn', meaning: 'Bực bội hoặc quá tải kích thích' },
      { id: 'g3', sign: 'Cọ má quanh cằm vào tay', meaning: 'Đánh dấu bạn là "người nhà"' }
    ],
    tags: ['Thích yên tĩnh', 'Ghét bế xốc', 'Thích rình mồi']
  },
  other: {
    archetype: 'Thú Cưng Đáng Yêu',
    vetAdvice: 'Quan sát hành vi của bé mỗi ngày để hiểu rõ sở thích và giới hạn của bé.',
    science: 'Dành thời gian tương tác nhẹ nhàng giúp giảm căng thẳng cho cả người và vật nuôi.',
    quests: [
      { id: 'q1', title: 'Tương tác nhẹ nhàng', duration: 300, category: 'Gắn Kết', desc: 'Ở bên cạnh và nói chuyện nhẹ nhàng với bé.', reward: 2 },
      { id: 'q2', title: 'Cho ăn bằng tay', duration: 300, category: 'Niềm Tin', desc: 'Sử dụng thức ăn bé thích để tạo liên kết tích cực.', reward: 2 },
      { id: 'q3', title: 'Quan sát hành vi', duration: 600, category: 'Thấu Hiểu', desc: 'Dành thời gian quan sát bé hoạt động tự do.', reward: 2 }
    ],
    gestures: [
      { id: 'g1', sign: 'Tiến lại gần tự nguyện', meaning: 'Cảm thấy tò mò và an toàn' },
      { id: 'g2', sign: 'Lùi lại hoặc trốn', meaning: 'Đang sợ hãi hoặc cần không gian riêng' }
    ],
    tags: ['Cần thời gian', 'Thích quan sát']
  }
};

export const getPetReferenceData = (species = '') => {
  const s = String(species).toLowerCase();
  if (s.includes('chó') || s.includes('dog')) return REFERENCE_DATA.dog;
  if (s.includes('mèo') || s.includes('cat')) return REFERENCE_DATA.cat;
  return REFERENCE_DATA.other;
};

// Dummy exports to prevent breaking other components
export const PET_DATA = {};
export const PET_PSYCHOLOGY_DATABASE = {};
export const PET_BONDING_DATA = {};
export const PET_QUESTS_DATA = {};

const STORAGE_KEY = 'petcare_bonding_real_data_v1';

export const PetBondingView = ({ pets = [], currentUser }) => {
  const [selectedPetId, setSelectedPetId] = useState(pets.length > 0 ? pets[0].id : null);
  
  // Quản lý dữ liệu gắn kết lưu trữ từ server
  const [bondingData, setBondingData] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Quản lý bộ bấm giờ
  const [activeTimerId, setActiveTimerId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Get current date in Vietnam time (YYYY-MM-DD)
  const getTodayStr = () => getTodayVnDate();

  // Tải dữ liệu nhật ký gắn kết thực tế từ Backend Server
  useEffect(() => {
    let isMounted = true;
    const loadLogs = async () => {
      setIsLoading(true);
      try {
        const logs = await apiGetAll('daily_logs');
        if (isMounted && Array.isArray(logs)) {
          const map = {};
          logs.forEach(item => {
            const oId = item.ownerId || currentUser?.id;
            const pId = item.petId;
            const dStr = item.date;
            if (!oId || !pId || !dStr) return;
            if (!map[oId]) map[oId] = {};
            if (!map[oId][pId]) map[oId][pId] = {};
            map[oId][pId][dStr] = {
              id: item.id,
              mood: item.mood || '',
              questsDone: Array.isArray(item.questsDone) ? item.questsDone : [],
              gesturesRecorded: Array.isArray(item.gesturesRecorded) ? item.gesturesRecorded : []
            };
          });
          setBondingData(map);
        }
      } catch (err) {
        console.warn('Lỗi tải nhật ký gắn kết từ máy chủ:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadLogs();
    return () => { isMounted = false; };
  }, [currentUser?.id]);

  // Handle switching pets
  useEffect(() => {
    if (pets.length > 0 && (!selectedPetId || !pets.find(p => p.id === selectedPetId))) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  // Reset timer khi đổi thú cưng
  useEffect(() => {
    setIsRunning(false);
    setActiveTimerId(null);
    setTimeLeft(0);
  }, [selectedPetId]);

  // Reset timer khi qua ngày mới
  const currentDateRef = useRef(getTodayStr());
  useEffect(() => {
    const timer = setInterval(() => {
      const today = getTodayStr();
      if (today !== currentDateRef.current) {
        currentDateRef.current = today;
        setIsRunning(false);
        setActiveTimerId(null);
        setTimeLeft(0);
      }
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Xử lý đếm ngược
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      // Không tự hoàn thành, người dùng phải tự bấm
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  if (!pets || pets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl bg-white dark:bg-[#12192A] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-lg h-full min-h-[400px]">
        <Heart className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Bạn chưa có thú cưng</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
          Vui lòng thêm thú cưng để bắt đầu theo dõi tâm lý và gắn kết.
        </p>
        <button 
          onClick={() => {
            try { sound?.playClick?.(); } catch {}
            window.dispatchEvent(new CustomEvent('petcare_open_add_pet'));
          }}
          className="mt-6 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thêm Thú Cưng
        </button>
      </div>
    );
  }

  const currentPet = pets.find(p => p.id === selectedPetId) || pets[0];
  const refData = getPetReferenceData(currentPet?.species);
  const todayStr = getTodayStr();
  const userId = currentUser?.id || 'guest';

  const getTodayData = () => {
    return bondingData[userId]?.[currentPet.id]?.[todayStr] || {
      mood: '',
      questsDone: [],
      gesturesRecorded: []
    };
  };

  const todayData = getTodayData();
  const completedCount = todayData.questsDone.length;
  const progressPercent = refData.quests.length > 0 ? Math.round((completedCount / refData.quests.length) * 100) : 0;
  const recordedGesturesCount = todayData.gesturesRecorded.length;

  const updateTodayData = async (updates) => {
    if (isSaving || !currentPet) return;
    setIsSaving(true);
    setErrorMsg('');
    
    // Lưu dữ liệu thực tế lên Backend Server
    try {
      const existing = todayData;
      const merged = { ...existing, ...updates };
      const logId = existing.id || `log_${userId}_${currentPet.id}_${todayStr}`;
      const payload = {
        id: logId,
        petId: currentPet.id,
        ownerId: userId,
        date: todayStr,
        mood: merged.mood,
        questsDone: merged.questsDone,
        gesturesRecorded: merged.gesturesRecorded,
        updatedAt: new Date().toISOString()
      };

      if (existing.id) {
        await apiUpdate('daily_logs', existing.id, payload);
      } else {
        await apiCreate('daily_logs', payload);
      }

      setBondingData(prev => {
        const userScope = prev[userId] || {};
        const petScope = userScope[currentPet.id] || {};
        const dayScope = petScope[todayStr] || { mood: '', questsDone: [], gesturesRecorded: [] };
        
        return {
          ...prev,
          [userId]: {
            ...userScope,
            [currentPet.id]: {
              ...petScope,
              [todayStr]: { ...dayScope, ...updates, id: logId }
            }
          }
        };
      });
    } catch (err) {
      console.error('Lỗi khi lưu dữ liệu gắn kết lên máy chủ:', err);
      setErrorMsg('Không thể lưu dữ liệu lên máy chủ. Vui lòng kiểm tra kết nối.');
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleQuest = async (id) => {
    if (isSaving) return;
    const isDone = todayData.questsDone.includes(id);
    const newQuests = isDone 
      ? todayData.questsDone.filter(q => q !== id)
      : [...todayData.questsDone, id];
    
    await updateTodayData({ questsDone: newQuests });
    
    if (!isDone) {
      try {
        sound?.playSuccess?.();
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      } catch {}
    } else {
      try { sound?.playClick?.(); } catch {}
    }

    if (activeTimerId === id) {
      setIsRunning(false);
    }
  };

  const handleStartTimer = (quest) => {
    if (activeTimerId === quest.id) {
      setIsRunning(!isRunning);
      try { sound?.playClick?.(); } catch {}
    } else {
      setActiveTimerId(quest.id);
      setTimeLeft(quest.duration);
      setIsRunning(true);
      try { sound?.playClick?.(); } catch {}
    }
  };

  const handleResetTimer = (quest) => {
    setTimeLeft(quest.duration);
    setIsRunning(false);
    try { sound?.playClick?.(); } catch {}
  };

  const handleToggleGesture = async (id) => {
    if (isSaving) return;
    const isRecorded = todayData.gesturesRecorded.includes(id);
    const newGestures = isRecorded
      ? todayData.gesturesRecorded.filter(g => g !== id)
      : [...todayData.gesturesRecorded, id];
      
    await updateTodayData({ gesturesRecorded: newGestures });
    
    if (!isRecorded) {
      try {
        sound?.playPop?.();
        confetti({ particleCount: 35, spread: 45, origin: { y: 0.7 } });
      } catch {}
    } else {
      try { sound?.playClick?.(); } catch {}
    }
  };

  const handleMoodSelect = async (moodId) => {
    if (isSaving) return;
    await updateTodayData({ mood: moodId });
    try { sound?.playPop?.(); } catch {}
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar">
      
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-2xl flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. HEADER */}
      <div className="bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-500/20 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md shadow-xl shadow-pink-950/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-pink-500/20 shrink-0">
            💖
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-white">Tâm Lý & Gắn Kết Thú Cưng</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Đang xem: <strong className="text-slate-200">{currentPet.name}</strong> • Tiến độ hôm nay.
            </p>
          </div>
        </div>

        {/* Khối thống kê thực tế */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="flex-1 sm:flex-none bg-slate-900/80 border border-white/10 px-3.5 sm:px-4 py-2 rounded-2xl text-center shadow-inner">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Tiến Độ Hoạt Động</span>
            <span className="text-base sm:text-lg font-black text-pink-400">
              {refData.quests.length > 0 ? `${progressPercent}%` : 'Chưa có'}
            </span>
          </div>
          <div className="flex-1 sm:flex-none bg-slate-900/80 border border-white/10 px-3.5 sm:px-4 py-2 rounded-2xl text-center shadow-inner">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Nhiệm Vụ Ngày</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-400 whitespace-nowrap">
              {refData.quests.length > 0 ? `${completedCount}/${refData.quests.length} Đã xong` : 'Chưa có hoạt động hôm nay'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. BỘ CHỌN THÚ CƯNG */}
      <div className="flex flex-col md:flex-row gap-3 overflow-x-auto custom-scrollbar pb-1">
        {pets.map(p => {
          const isActive = selectedPetId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => { 
                try { sound?.playClick?.(); } catch {}
                setSelectedPetId(p.id); 
                setActiveTimerId(null); 
                setIsRunning(false); 
              }}
              className={`min-w-[200px] p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/50 shadow-lg shadow-pink-500/10 ring-1 ring-pink-500/30' 
                  : 'bg-slate-900/60 border-white/5 hover:border-white/15 opacity-70 hover:opacity-100'
              }`}
            >
              {p.avatar ? (
                <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                  {p.species?.toLowerCase().includes('mèo') ? '🐱' : p.species?.toLowerCase().includes('chó') ? '🐶' : '🐾'}
                </div>
              )}
              <div className="flex-1">
                <span className="text-xs sm:text-sm font-bold text-white block truncate">{p.name}</span>
                <span className="text-[10px] text-slate-400 line-clamp-1">{p.species || 'Chưa cập nhật'}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. BỐ CỤC 2 CỘT CHÍNH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* CỘT TRÁI (4 cols): Profile, Tâm trạng & Lời khuyên */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-white/5 rounded-3xl p-4 sm:p-5 space-y-4 backdrop-blur-md">
          {/* Header Profile */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/5">
            {currentPet.avatar ? (
              <img src={currentPet.avatar} alt={currentPet.name} className="w-12 h-12 rounded-2xl object-cover shrink-0 border border-white/10" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                {currentPet.species?.toLowerCase().includes('mèo') ? '🐱' : currentPet.species?.toLowerCase().includes('chó') ? '🐶' : '🐾'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white">{currentPet.name}</h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{refData.archetype}</p>
            </div>
          </div>

          {/* Check-in tâm trạng hôm nay */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Ghi nhận tâm trạng hôm nay:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'happy', icon: '✨', label: 'Vui vẻ' },
                { id: 'curious', icon: '🧐', label: 'Tò mò' },
                { id: 'relaxed', icon: '🌿', label: 'Thư thái' },
                { id: 'alert', icon: '👀', label: 'Cảnh giác' }
              ].map(m => (
                <button
                  key={m.id}
                  disabled={isSaving}
                  onClick={() => handleMoodSelect(m.id)}
                  className={`py-2 rounded-xl border text-[10px] font-bold flex flex-col items-center transition-all cursor-pointer ${
                    todayData.mood === m.id
                      ? 'bg-pink-500/20 border-pink-500/50 text-pink-300 shadow-md shadow-pink-500/10'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/20'
                  } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-sm mb-0.5">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
            {!todayData.mood && (
              <p className="text-[10px] text-slate-500 mt-2 text-center italic">Chưa cập nhật tâm trạng hôm nay.</p>
            )}
          </div>

          {/* Gợi ý chăm sóc tham khảo */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Lightbulb className="w-3.5 h-3.5"/> Gợi Ý Chăm Sóc Tham Khảo
            </span>
            <p className="text-[11px] text-slate-300 italic leading-relaxed">"{refData.vetAdvice}"</p>
          </div>

          {/* Tags đặc tính tham khảo */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Đặc tính tham khảo của loài:</span>
            <div className="flex flex-wrap gap-1.5">
              {refData.tags.map((t, i) => (
                <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/5">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (8 cols): Danh sách nhiệm vụ + Đồng hồ đếm ngược + Từ điển cơ thể tương tác */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* KHỐI 1: DANH SÁCH NHIỆM VỤ GẮN KẾT */}
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-4 sm:p-5 backdrop-blur-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/5 gap-2">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400"/>
                  Tiến Độ Hoạt Động Hôm Nay
                </h2>
              </div>
            </div>

            {/* Tiến độ ngày */}
            {refData.quests.length > 0 ? (
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-400">Đã xong: {completedCount}/{refData.quests.length} việc</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="font-bold text-pink-400">{progressPercent}%</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Chưa có hoạt động tham khảo cho loài này.</p>
            )}

            {/* Danh sách bài tập có đồng hồ đếm ngược tương tác */}
            <div className="space-y-3">
              {refData.quests.map(q => {
                const isDone = todayData.questsDone.includes(q.id);
                const isThisTimerActive = activeTimerId === q.id;
                return (
                  <div 
                    key={q.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      isDone 
                        ? 'bg-emerald-950/20 border-emerald-500/30' 
                        : isThisTimerActive 
                          ? 'bg-pink-950/25 border-pink-500/50 ring-1 ring-pink-500/30 shadow-md shadow-pink-950/20' 
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Tiêu đề & Thông vị */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs md:text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                            {q.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">
                              #{q.category}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3"/> {Math.floor(q.duration / 60)} phút
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-2 leading-relaxed bg-black/25 p-2.5 rounded-xl border border-white/5">
                            💡 <strong className="text-white">Tham khảo:</strong> {q.desc}
                          </p>
                        </div>
                      </div>

                      {/* Nút hành động */}
                      <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                        {isThisTimerActive ? (
                          <div className="flex items-center gap-2 bg-slate-900 border border-pink-500/40 px-3 py-1.5 rounded-2xl shadow-inner">
                            <span className="font-mono text-sm font-black text-pink-400">
                              {formatTime(timeLeft)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStartTimer(q)}
                              className="p-1.5 rounded-lg bg-pink-500 text-white hover:bg-pink-400 transition-colors cursor-pointer"
                              title={isRunning ? 'Tạm dừng' : 'Tiếp tục'}
                            >
                              {isRunning ? <Pause className="w-3.5 h-3.5"/> : <Play className="w-3.5 h-3.5 fill-white"/>}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetTimer(q)}
                              className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              title="Đặt lại thời gian"
                            >
                              <RotateCcw className="w-3.5 h-3.5"/>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={isDone || isSaving}
                            onClick={() => handleStartTimer(q)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              isDone 
                                ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5' 
                                : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 shadow-md shadow-pink-500/20 active:scale-95'
                            } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <Play className="w-3 h-3 fill-white"/>
                            <span>Bắt đầu</span>
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleToggleQuest(q.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isDone 
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25' 
                              : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/30 hover:bg-white/10 active:scale-95'
                          } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isDone ? '✓ Đã hoàn thành' : 'Hoàn thành'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KHỐI 2: TỪ ĐIỂN CƠ THỂ TƯƠNG TÁC */}
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-4 sm:p-5 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">📖</span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Ghi Nhận Hành Vi Hôm Nay
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Đã ghi nhận: <strong className="text-pink-400">{recordedGesturesCount}/{refData.gestures.length}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {refData.gestures.map(g => {
                const isRecorded = todayData.gesturesRecorded.includes(g.id);
                return (
                  <div 
                    key={g.id}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                      isRecorded 
                        ? 'bg-pink-950/20 border-pink-500/40 ring-1 ring-pink-500/20' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div>
                      <h5 className="text-xs font-bold text-white mb-1">{g.sign}</h5>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{g.meaning}</p>
                    </div>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleToggleGesture(g.id)}
                      className={`w-full py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                        isRecorded 
                          ? 'bg-pink-500 text-white border-pink-400 shadow-md shadow-pink-500/20' 
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/10'
                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isRecorded ? (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]"/>
                          <span>Đã ghi nhận hôm nay</span>
                        </>
                      ) : (
                        'Nhấn để ghi nhận'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KHỐI 3: KHOA HỌC HÀNH VI */}
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-4 backdrop-blur-md flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
              <Brain className="w-4 h-4"/>
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Thông tin khoa học tham khảo
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                {refData.science}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default PetBondingView;
