import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Heart, Sparkles, CheckCircle2, Play, Pause, RotateCcw, 
  Flame, Clock, Lightbulb, Brain, Award, Check
} from 'lucide-react';
import { sound } from '../../services/soundService';

export const INITIAL_DATA = {
  mochi: {
    id: 'mochi',
    name: 'Mochi',
    species: 'Golden Retriever (Chó)',
    shortSpecies: 'Chó Golden',
    iconEmoji: '🐶',
    archetype: 'Bé Bám Người & Tràn Năng Lượng',
    score: 91,
    level: 'Bạn Tri Kỷ',
    tags: ['Thích vuốt ngực', 'Thích ném bóng', 'Ham khen ngợi', 'Sợ sấm'],
    vetAdvice: 'Không ép Mochi nhìn mắt khi bé đang căng thẳng hoặc nhìn chằm chằm kẻ thù; chỉ thực hiện khi bé đang thư thái bên bạn.',
    science: 'Nghiên cứu từ ĐH Azabu (Nhật Bản) chứng minh khi chó và chủ nhìn âu yếm vào mắt nhau, lượng Oxytocin tăng 130% - 300%. Đây là cơ chế tiến hóa độc nhất vô nhị giữa loài chó và con người.',
    quests: [
      { id: 1, title: 'Tập giao tiếp bằng mắt (Eye Contact) 3 phút', duration: 180, category: 'Kích Hoạt Oxytocin', reward: 2, desc: 'Nhìn âu yếm vào mắt Mochi khi bé ngồi yên và thì thầm khen ngợi để kích hoạt hormone Oxytocin gắn kết.', done: false },
      { id: 2, title: 'Tìm đồ ăn bằng khứu giác trên thảm hít (Snuffle Mat)', duration: 600, category: 'Kích Thích Trí Não', reward: 3, desc: 'Giấu thức ăn vào nếp gấp thảm để bé dùng mũi tìm kiếm, giúp tiêu hao năng lượng và giảm lo âu.', done: true },
      { id: 3, title: 'Massage vuốt dọc sống lưng & gốc tai', duration: 300, category: 'Thư Giãn Cơ Thể', reward: 2, desc: 'Dùng lòng bàn tay vuốt chậm rãi từ trán qua tai xuống lưng theo chiều lông mọc để hạ nhịp tim.', done: false },
      { id: 4, title: 'Rèn luyện phản xạ "Chờ lệnh (Wait)" trước bữa ăn', duration: 300, category: 'Kỷ Luật Tích Cực', reward: 3, desc: 'Đặt bát thức ăn xuống và yêu cầu Mochi ngồi chờ 10 giây trước khi ra lệnh "Ăn đi".', done: false }
    ],
    gestures: [
      { id: 'g1', sign: 'Đuôi vẫy vòng tròn hình cánh quạt', meaning: 'Hạnh phúc cực độ, cảm thấy an toàn tuyệt đối', recorded: true },
      { id: 'g2', sign: 'Liếm mép liên tục khi bị ôm', meaning: 'Đang căng thẳng nhẹ, cần bạn thả lỏng vòng tay', recorded: false },
      { id: 'g3', sign: 'Cúi thấp hai chân trước, mông chổng lên', meaning: 'Tư thế mời chơi đùa (Play Bow)', recorded: false }
    ]
  },
  luna: {
    id: 'luna',
    name: 'Luna',
    species: 'Mèo Anh Lông Ngắn (BSH)',
    shortSpecies: 'Mèo BSH',
    iconEmoji: '🐱',
    archetype: 'Độc Lập & Nhạy Cảm Không Gian',
    score: 74,
    level: 'Thân Thiết Tin Cậy',
    tags: ['Thích yên tĩnh', 'Chỉ thích gãi cằm', 'Ghét bế xốc', 'Thích rình mồi'],
    vetAdvice: 'Tuyệt đối không nhìn trừng trừng vào mắt mèo! Hãy chớp mắt thật chậm (Cat Kiss) rồi quay nhẹ mặt đi để báo hiệu sự thân thiện.',
    science: 'Chớp mắt chậm rãi giúp hạ nhịp tim ở mèo và kích thích sự tin tưởng, thúc đẩy mèo chủ động tiếp cận người nuôi.',
    quests: [
      { id: 1, title: 'Thực hành "Chớp mắt chậm" (Slow Blink - Cat Kiss)', duration: 120, category: 'Tôn Trọng Ranh Giới', reward: 2, desc: 'Nhìn nhẹ vào mắt bé rồi từ từ nhắm mắt lại 2 giây rồi mở ra, đợi bé chớp mắt đáp lại.', done: true },
      { id: 2, title: 'Mô phỏng chu trình săn mồi với cần câu mèo', duration: 600, category: 'Bản Năng Tự Nhiên', reward: 4, desc: 'Vờn mồi giật chậm theo nhịp, để bé tóm trúng mồi ở cuối hiệp và thưởng ngay súp thưởng.', done: false },
      { id: 3, title: 'Chải lông & gãi nhẹ tuyến mùi cằm/má', duration: 300, category: 'Thư Giãn Cơ Thể', reward: 2, desc: 'Chỉ vuốt ve vùng má và dưới cằm nơi tiết pheromone an toàn, tránh vuốt vùng bụng.', done: false }
    ],
    gestures: [
      { id: 'g1', sign: 'Đầu chóp đuôi giật rung nhẹ lên cao', meaning: 'Rất hào hứng và chào đón bạn về nhà', recorded: false },
      { id: 'g2', sign: 'Đập mạnh cả đuôi xuống sàn liên hồi', meaning: 'Bực bội hoặc quá tải kích thích, hãy dừng vuốt ve ngay', recorded: false },
      { id: 'g3', sign: 'Cọ má và tuyến mùi quanh cằm vào tay', meaning: 'Đánh dấu bạn là "người nhà" an toàn', recorded: true }
    ]
  },
  banhbao: {
    id: 'banhbao',
    name: 'Bánh Bao',
    species: 'Thỏ Minilop',
    shortSpecies: 'Thỏ Minilop',
    iconEmoji: '🐰',
    archetype: 'Nhút Nhát & Thận Trọng Tự Nhiên',
    score: 62,
    level: 'Đang Gây Dựng Niềm Tin',
    tags: ['Sợ bế bổng', 'Thích ăn cỏ cầm tay', 'Cần sàn chống trượt'],
    vetAdvice: 'Thỏ là loài con mồi. Muốn thân thiết, hãy hạ mình xuống cùng tầm mắt của bé trên sàn nhà, không với tay bắt từ trên cao xuống.',
    science: 'Hành vi thỏ nằm thư giãn duỗi thẳng hai chân sau (Flop) là minh chứng nồng độ hormone căng thẳng Cortisol đã hạ xuống mức tối thiểu.',
    quests: [
      { id: 1, title: 'Nằm cùng tầm mắt trên sàn (Floor Time) 10 phút', duration: 600, category: 'Gây Dựng Niềm Tin', reward: 3, desc: 'Nằm yên tĩnh trên thảm ngang tầm mắt, để bé tự tiến lại gần ngửi tay và khám phá.', done: false },
      { id: 2, title: 'Cho ăn cọng thảo mộc tươi trực tiếp trên tay', duration: 300, category: 'Tương Tác Chủ Động', reward: 3, desc: 'Cầm cọng rau thơm mở lòng bàn tay đặt sát đất, kiên nhẫn để bé chủ động tới ăn.', done: false },
      { id: 3, title: 'Đồ chơi lõi giấy cuộn cỏ khô Timothy', duration: 300, category: 'Giải Tỏa Bản Năng', reward: 2, desc: 'Nhét cỏ khô vào lõi giấy để bé lăn lộn, kéo cỏ và gặm nhấm xả stress.', done: true }
    ],
    gestures: [
      { id: 'g1', sign: 'Chạy vòng tròn quanh chân bạn', meaning: 'Thể hiện niềm vui mừng và sự gắn bó thân thiết', recorded: true },
      { id: 'g2', sign: 'Đập mạnh hai chân sau xuống đất (Thumping)', meaning: 'Báo động nguy hiểm hoặc đang cực kỳ hoảng sợ', recorded: false },
      { id: 'g3', sign: 'Nghiêng người ngã lăn ra sàn (Flop)', meaning: 'Cực kỳ tin tưởng và cảm thấy hoàn toàn bình yên', recorded: false }
    ]
  }
};

// Backwards compatibility mappings for HabitsUnifiedView and PetBondingWidget
Object.keys(INITIAL_DATA).forEach(key => {
  INITIAL_DATA[key].todayTask = INITIAL_DATA[key].quests[0];
  INITIAL_DATA[key].todayBondingTask = INITIAL_DATA[key].quests[0];
  INITIAL_DATA[key].doctorPawTip = INITIAL_DATA[key].vetAdvice;
  INITIAL_DATA[key].scienceBehindBonding = INITIAL_DATA[key].science;
  INITIAL_DATA[key].bondingScore = INITIAL_DATA[key].score;
  INITIAL_DATA[key].levelTitle = INITIAL_DATA[key].level;
});

export const PET_DATA = INITIAL_DATA;
export const PET_PSYCHOLOGY_DATABASE = INITIAL_DATA;
export const PET_BONDING_DATA = INITIAL_DATA;
export const PET_QUESTS_DATA = {
  mochi: INITIAL_DATA.mochi.quests,
  luna: INITIAL_DATA.luna.quests,
  banhbao: INITIAL_DATA.banhbao.quests
};

const STORAGE_KEY = 'petcare_bonding_state_v4';

export const PetBondingView = ({ pets = [] }) => {
  const [selectedPetId, setSelectedPetId] = useState('mochi');
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.mochi && parsed.luna && parsed.banhbao) {
          return parsed;
        }
      }
    } catch {}
    return INITIAL_DATA;
  });

  const [selectedMood, setSelectedMood] = useState('happy');

  // Quản lý bộ bấm giờ cho nhiệm vụ đang tập
  const [activeTimerId, setActiveTimerId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Lưu trạng thái vào localStorage khi có thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [data]);

  const currentPet = data[selectedPetId] || data.mochi;
  const quests = currentPet.quests;
  const completedCount = quests.filter(q => q.done).length;
  const progressPercent = Math.round((completedCount / quests.length) * 100);
  const recordedGesturesCount = currentPet.gestures.filter(g => g.recorded).length;

  const handleCompleteQuest = (id, forceDone = null) => {
    setData(prev => {
      const pet = prev[selectedPetId];
      const updatedQuests = pet.quests.map(q => {
        if (q.id === id) {
          const nextDone = forceDone !== null ? forceDone : !q.done;
          return { ...q, done: nextDone };
        }
        return q;
      });
      const targetQuest = updatedQuests.find(q => q.id === id);
      const isNowDone = targetQuest ? targetQuest.done : false;

      if (isNowDone) {
        try {
          sound?.playSuccess?.();
          confetti({
            particleCount: 60,
            spread: 55,
            origin: { y: 0.6 }
          });
        } catch {}
      } else {
        try { sound?.playClick?.(); } catch {}
      }

      return {
        ...prev,
        [selectedPetId]: {
          ...pet,
          score: isNowDone ? Math.min(100, pet.score + (targetQuest?.reward || 2)) : Math.max(0, pet.score - (targetQuest?.reward || 2)),
          quests: updatedQuests,
          todayTask: updatedQuests[0],
          todayBondingTask: updatedQuests[0]
        }
      };
    });

    if (activeTimerId === id) {
      setIsRunning(false);
    }
  };

  // Xử lý đếm ngược thời gian thực
  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      handleCompleteQuest(activeTimerId, true);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, activeTimerId]);

  const handleStartTimer = (quest) => {
    if (activeTimerId === quest.id) {
      if (isRunning) {
        setIsRunning(false);
      } else {
        setIsRunning(true);
      }
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

  const handleToggleGesture = (gestureId) => {
    setData(prev => {
      const pet = prev[selectedPetId];
      let willBeRecorded = false;
      const updatedGestures = pet.gestures.map(g => {
        if (g.id === gestureId) {
          willBeRecorded = !g.recorded;
          return { ...g, recorded: !g.recorded };
        }
        return g;
      });

      if (willBeRecorded) {
        try {
          sound?.playPop?.();
          confetti({
            particleCount: 35,
            spread: 45,
            origin: { y: 0.7 }
          });
        } catch {}
      } else {
        try { sound?.playClick?.(); } catch {}
      }

      return {
        ...prev,
        [selectedPetId]: {
          ...pet,
          gestures: updatedGestures
        }
      };
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-full max-w-7xl mx-auto p-3 sm:p-4 md:p-6 space-y-4 overflow-y-auto custom-scrollbar">
      
      {/* 1. KHÔI PHỤC BANNER HEADER 3 Ô CHỈ SỐ */}
      <div className="bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-500/20 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md shadow-xl shadow-pink-950/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-pink-500/20 shrink-0">
            💖
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-white">Tâm Lý & Gắn Kết Thú Cưng</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Dr. Paw Science
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Đang chăm sóc: <strong className="text-slate-200">{currentPet.name} ({currentPet.species})</strong> • Kích hoạt Oxytocin và nuôi dưỡng niềm tin mỗi ngày.
            </p>
          </div>
        </div>

        {/* 3 Khối thống kê cốt lõi */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="flex-1 sm:flex-none bg-slate-900/80 border border-white/10 px-3.5 sm:px-4 py-2 rounded-2xl text-center shadow-inner">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Điểm Gắn Kết</span>
            <span className="text-base sm:text-lg font-black text-pink-400">{currentPet.score}%</span>
          </div>
          <div className="flex-1 sm:flex-none bg-slate-900/80 border border-white/10 px-3.5 sm:px-4 py-2 rounded-2xl text-center shadow-inner">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Danh Hiệu</span>
            <span className="text-xs sm:text-sm font-bold text-amber-300 whitespace-nowrap">{currentPet.level}</span>
          </div>
          <div className="flex-1 sm:flex-none bg-slate-900/80 border border-white/10 px-3.5 sm:px-4 py-2 rounded-2xl text-center shadow-inner">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Nhiệm Vụ Ngày</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-400 whitespace-nowrap">{completedCount}/{quests.length} Đã xong</span>
          </div>
        </div>
      </div>

      {/* 2. BỘ CHỌN THÚ CƯNG GỌN GÀNG */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {Object.values(data).map(p => {
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
              className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                isActive 
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 border-pink-500/50 shadow-lg shadow-pink-500/10 ring-1 ring-pink-500/30' 
                  : 'bg-slate-900/60 border-white/5 hover:border-white/15 opacity-70 hover:opacity-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{p.id === 'mochi' ? '🐶' : p.id === 'luna' ? '🐱' : '🐰'}</span>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-white block">{p.name}</span>
                  <span className="text-[10px] text-slate-400 line-clamp-1">{p.archetype}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs sm:text-sm font-black text-pink-400">{p.score}%</span>
                <span className="text-[9px] text-slate-400 block">{p.level}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. BỐ CỤC 2 CỘT CHÍNH */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* CỘT TRÁI (4 cols): Profile, Thước đo Oxytocin, Tâm trạng & Lời khuyên */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-white/5 rounded-3xl p-4 sm:p-5 space-y-4 backdrop-blur-md">
          {/* Header Profile */}
          <div className="flex items-center gap-3 pb-3 border-b border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0">
              {currentPet.id === 'mochi' ? '🐶' : currentPet.id === 'luna' ? '🐱' : '🐰'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white">{currentPet.name}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20">
                  {currentPet.species}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{currentPet.archetype}</p>
            </div>
          </div>

          {/* Thước đo Oxytocin */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse"/> Chỉ số gắn kết Oxytocin
              </span>
              <span className="font-black text-rose-400">{currentPet.score}/100</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-pink-500 to-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${currentPet.score}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>{currentPet.level}</span>
              <span className="text-amber-400 font-bold">Còn {Math.max(0, 100 - currentPet.score)}% tới Tri Kỷ Tuyệt Đối 🏆</span>
            </div>
          </div>

          {/* Check-in tâm trạng hôm nay */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Tâm trạng hôm nay của bé:
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
                  onClick={() => {
                    try { sound?.playPop?.(); } catch {}
                    setSelectedMood(m.id);
                  }}
                  className={`py-2 rounded-xl border text-[10px] font-bold flex flex-col items-center transition-all cursor-pointer ${
                    selectedMood === m.id
                      ? 'bg-pink-500/20 border-pink-500/50 text-pink-300 shadow-md shadow-pink-500/10'
                      : 'bg-white/[0.02] border-white/5 text-slate-400 hover:border-white/20'
                  }`}
                >
                  <span className="text-sm mb-0.5">{m.icon}</span>
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lời khuyên Bác sĩ Paw */}
          <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1 mb-1">
              <Lightbulb className="w-3.5 h-3.5"/> Lời Khuyên Bác Sĩ Paw
            </span>
            <p className="text-[11px] text-slate-300 italic leading-relaxed">"{currentPet.vetAdvice}"</p>
          </div>

          {/* Tags đặc tính */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Đặc tính hành vi:</span>
            <div className="flex flex-wrap gap-1.5">
              {currentPet.tags.map((t, i) => (
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
                  Nhiệm Vụ Gắn Kết Hôm Nay
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hoàn thành chuỗi hoạt động để giải phóng hormone Oxytocin cùng {currentPet.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-300 text-xs font-bold shrink-0 self-start sm:self-auto">
                <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>
                <span>Chuỗi gắn kết: 14 ngày</span>
              </div>
            </div>

            {/* Tiến độ ngày */}
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-400">Tiến độ hôm nay: {completedCount}/{quests.length} việc</span>
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="font-bold text-pink-400">{progressPercent}%</span>
            </div>

            {/* Danh sách bài tập có đồng hồ đếm ngược tương tác */}
            <div className="space-y-3">
              {quests.map(q => {
                const isThisTimerActive = activeTimerId === q.id;
                return (
                  <div 
                    key={q.id}
                    className={`rounded-2xl border p-4 transition-all ${
                      q.done 
                        ? 'bg-emerald-950/20 border-emerald-500/30' 
                        : isThisTimerActive 
                          ? 'bg-pink-950/25 border-pink-500/50 ring-1 ring-pink-500/30 shadow-md shadow-pink-950/20' 
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      {/* Tiêu đề & Thông tin */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleCompleteQuest(q.id)}
                          className={`w-6 h-6 mt-0.5 rounded-lg flex items-center justify-center border transition-all shrink-0 cursor-pointer ${
                            q.done ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold' : 'border-slate-600 hover:border-pink-400'
                          }`}
                          title={q.done ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
                        >
                          {q.done && <Check className="w-4 h-4 stroke-[3]"/>}
                        </button>
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs md:text-sm font-bold ${q.done ? 'line-through text-slate-400' : 'text-white'}`}>
                            {q.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pink-500/10 text-pink-300 border border-pink-500/20">
                              #{q.category}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3"/> {Math.floor(q.duration / 60)} phút
                            </span>
                            <span className="text-[10px] font-bold text-amber-400">+{q.reward}% Oxytocin</span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-2 leading-relaxed bg-black/25 p-2.5 rounded-xl border border-white/5">
                            💡 <strong className="text-white">Hướng dẫn:</strong> {q.desc}
                          </p>
                        </div>
                      </div>

                      {/* Cụm Đồng hồ đếm ngược tương tác thời gian thực */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
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
                            disabled={q.done}
                            onClick={() => handleStartTimer(q)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                              q.done 
                                ? 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5' 
                                : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 shadow-md shadow-pink-500/20 active:scale-95'
                            }`}
                          >
                            <Play className="w-3 h-3 fill-white"/>
                            <span>Bắt đầu bài tập</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCompleteQuest(q.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            q.done 
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25' 
                              : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/30 hover:bg-white/10 active:scale-95'
                          }`}
                        >
                          {q.done ? '✓ Đã xong' : 'Xong'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* KHỐI 2: KHÔI PHỤC TỪ ĐIỂN CƠ THỂ TƯƠNG TÁC (CÓ NÚT GHI NHẬN HÀNH VI) */}
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-4 sm:p-5 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-base">📖</span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Từ Điển Ngôn Ngữ Cơ Thể • {currentPet.name}
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Quan sát thấy hôm nay: <strong className="text-pink-400">{recordedGesturesCount}/{currentPet.gestures.length}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {currentPet.gestures.map(g => (
                <div 
                  key={g.id}
                  className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                    g.recorded 
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
                    onClick={() => handleToggleGesture(g.id)}
                    className={`w-full py-1.5 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                      g.recorded 
                        ? 'bg-pink-500 text-white border-pink-400 shadow-md shadow-pink-500/20' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    {g.recorded ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]"/>
                        <span>Đã ghi nhận hôm nay</span>
                      </>
                    ) : (
                      'Nhấn để ghi nhận'
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* KHỐI 3: KHOA HỌC HÀNH VI & OXYTOCIN */}
          <div className="bg-slate-900/60 border border-white/5 rounded-3xl p-4 backdrop-blur-md flex items-start gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
              <Brain className="w-4 h-4"/>
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Vòng lặp Hormone Hạnh Phúc (Oxytocin Loop)
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                {currentPet.science}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default PetBondingView;
