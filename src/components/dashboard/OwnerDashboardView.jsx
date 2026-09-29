import React, { useState } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Plus, 
  Sparkles, 
  Stethoscope, 
  PhoneCall, 
  Activity, 
  Heart, 
  Award, 
  Check, 
  MapPin, 
  User, 
  Bot, 
  FileText, 
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Flame,
  ChevronDown
} from 'lucide-react';
import { sound } from '../../services/soundService';
import { EmergencyModal } from '../emergency/EmergencyModal';

/**
 * OwnerDashboardView
 * Obsidian Spatial Canvas - Chủ Nuôi Dashboard
 * Color Theme:
 * - Canvas Background: Cosmic deep dark (#0B0C10)
 * - Card Texture: Frosted glass bg-[#151621]/90 backdrop-blur-2xl border border-white/[0.07] rounded-3xl p-5 shadow-2xl
 * - Primary Accent: Royal Indigo / Electronic Violet (indigo-500, #6366F1, violet-500)
 * - Secondary Accent: Neon Cyan / Emerald (cyan-400, emerald-400)
 */
export const OwnerDashboardView = ({
  pets = [],
  schedules = [],
  onToggleComplete = () => {},
  onOpenAddSchedule = () => {},
  onOpenAddPet = () => {},
  onOpenAiSchedule = () => {},
  onSelectPet = () => {},
  onNavigateTab = () => {},
  onAskAiPrompt = () => {},
  onOpenVetBooking = () => {},
  currentUser = null
}) => {
  const [selectedPetFilter, setSelectedPetFilter] = useState('all');
  const [selectedBiometricPet, setSelectedBiometricPet] = useState('mochi');
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [appointmentConfirmed, setAppointmentConfirmed] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Dữ liệu sinh trắc học thời gian thực của 3 bé
  const biometricPets = {
    mochi: {
      id: 'mochi',
      name: 'Mochi',
      emoji: '🐶',
      weight: '24.5 kg',
      weightDiff: '+0.2 kg so với tuần trước • Tối ưu thể lực',
      bcs: 'BCS 5/9',
      bodyStatus: 'Cân nặng chuẩn (BCS 5/9)',
      bodyScore: 94,
      wsavaScore: 85,
      wsavaStatus: 'Bảo hộ vắc-xin WSAVA',
      wsavaNote: 'Đã tiêm 3/3 mũi lõi • Hạn 18/01/2027',
      activityDistance: '6.4 km',
      activityCalories: '420 kcal',
      activityProgress: 85,
      heartRate: '88 bpm',
      temp: '38.6°C',
      respiratory: '22 l/p',
      collarStatus: 'Live Sync: Smart Collar v2'
    },
    luna: {
      id: 'luna',
      name: 'Luna',
      emoji: '🐱',
      weight: '4.2 kg',
      weightDiff: '+0.05 kg so với tuần trước • Cân đối',
      bcs: 'BCS 5/9',
      bodyStatus: 'Cân nặng chuẩn (BCS 5/9)',
      bodyScore: 96,
      wsavaScore: 90,
      wsavaStatus: 'Bảo hộ vắc-xin WSAVA',
      wsavaNote: 'Đã tiêm 4/4 mũi lõi • Hạn 12/03/2027',
      activityDistance: '2.1 km',
      activityCalories: '160 kcal',
      activityProgress: 92,
      heartRate: '124 bpm',
      temp: '38.8°C',
      respiratory: '26 l/p',
      collarStatus: 'Live Sync: Smart Collar v2'
    },
    banhbao: {
      id: 'banhbao',
      name: 'Bánh Bao',
      emoji: '🐩',
      weight: '1.6 kg',
      weightDiff: '-0.1 kg sau triệt sản • Ổn định',
      bcs: 'BCS 4/9',
      bodyStatus: 'Cân nặng chuẩn (BCS 4/9)',
      bodyScore: 88,
      wsavaScore: 82,
      wsavaStatus: 'Bảo hộ vắc-xin WSAVA',
      wsavaNote: 'Đã tiêm 3/3 mũi lõi • Hạn 05/11/2026',
      activityDistance: '3.2 km',
      activityCalories: '210 kcal',
      activityProgress: 78,
      heartRate: '95 bpm',
      temp: '38.4°C',
      respiratory: '24 l/p',
      collarStatus: 'Live Sync: Smart Collar v2'
    }
  };

  const currentBiometricPet = biometricPets[selectedBiometricPet] || biometricPets.mochi;

  // Default tasks state for Today Tasks
  const [tasks, setTasks] = useState([
    {
      id: 'task-1',
      title: 'Nhỏ gáy Bravecto',
      petName: 'Mochi',
      deadline: 'Hạn 19:00',
      progress: 100,
      completed: true,
      color: 'cyan'
    },
    {
      id: 'task-2',
      title: 'Uống men vi sinh',
      petName: 'Bánh Bao',
      deadline: 'Hạn 08:30',
      progress: 50,
      completed: false,
      color: 'indigo'
    },
    {
      id: 'task-3',
      title: 'Tắm sục khoáng Ozone',
      petName: 'Mochi',
      deadline: 'Hạn 14:00',
      progress: 0,
      completed: false,
      color: 'slate'
    }
  ]);

  const handleToggleTask = (taskId) => {
    sound.playClick();
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          progress: nextCompleted ? 100 : 0
        };
      }
      return t;
    }));
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleConfirmAppointment = () => {
    sound.playSuccess();
    setAppointmentConfirmed(true);
    showToast('✓ Đã xác nhận ca khám ngày 29/09 lúc 09:30 tại PetHealth thành công!');
  };

  // Lộ trình lâm sàng & điều trị hôm nay (Timeline Y Khoa)
  const clinicalTimelineData = [
    {
      id: 'timeline-1',
      petKey: 'mochi',
      petName: 'Mochi',
      time: '09:30',
      period: 'Sáng',
      statusType: 'urgent',
      priorityBadge: 'Khẩn cấp • WSAVA',
      badgeClass: 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border-rose-500/30',
      dotClass: 'bg-rose-500 ring-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.7)]',
      cardBorder: 'border-rose-500/30 dark:border-rose-500/20 hover:border-rose-400/50',
      cardBg: 'bg-rose-500/[0.03] dark:bg-rose-950/[0.12]',
      title: 'Tiêm nhắc vắc-xin 7 bệnh & Khám tổng quát Mochi',
      doctor: 'ThS. BS. Nguyễn Văn An',
      doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120',
      room: 'Phòng 102',
      clinic: 'Bệnh viện PetHealth CS Cầu Giấy',
      desc: 'Kiểm tra nồng độ kháng thể Parvo, men gan thận và tiêm phòng nhắc lại định kỳ theo phác đồ WSAVA.'
    },
    {
      id: 'timeline-2',
      petKey: 'luna',
      petName: 'Luna',
      time: '14:30',
      period: 'Chiều',
      statusType: 'upcoming',
      priorityBadge: 'Sắp tới • Khám lại',
      badgeClass: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
      dotClass: 'bg-cyan-400 ring-cyan-400/30 shadow-[0_0_10px_rgba(34,211,238,0.7)]',
      cardBorder: 'border-cyan-500/30 dark:border-cyan-500/20 hover:border-cyan-400/50',
      cardBg: 'bg-cyan-500/[0.03] dark:bg-cyan-950/[0.12]',
      title: 'Tái khám theo dõi vết xước biểu bì - Luna',
      doctor: 'BS. Trần Mai',
      doctorAvatar: 'https://images.unsplash.com/photo-1594824813580-c0ff0f321422?auto=format&fit=crop&w=120',
      room: 'Phòng khám Da Liễu',
      clinic: 'PetHealth CS Cầu Giấy',
      desc: 'Đánh giá tốc độ phục hồi lớp biểu mô sừng, soi đèn Wood kiểm tra vi nấm và sát khuẩn nang lông.'
    },
    {
      id: 'timeline-3',
      petKey: 'banhbao',
      petName: 'Bánh Bao',
      time: '17:00',
      period: 'Chiều',
      statusType: 'reminder',
      priorityBadge: 'Nhắc nhở • Dinh dưỡng',
      badgeClass: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      dotClass: 'bg-indigo-400 ring-indigo-400/30 shadow-[0_0_10px_rgba(99,102,241,0.7)]',
      cardBorder: 'border-indigo-500/30 dark:border-indigo-500/20 hover:border-indigo-400/50',
      cardBg: 'bg-indigo-500/[0.03] dark:bg-indigo-950/[0.12]',
      title: 'Tư vấn dinh dưỡng phục hồi sau triệt sản - Bánh Bao',
      doctor: 'Chuyên gia Thú y Sammi',
      doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120',
      room: 'Phòng Tư Vấn 3',
      clinic: 'PetHealth CS Cầu Giấy',
      desc: 'Cân đối hàm lượng đạm thô và tinh bột, bổ sung acid béo Omega 3-6 kiểm soát cân nặng hậu phẫu.'
    }
  ];

  const filteredTimeline = selectedPetFilter === 'all'
    ? clinicalTimelineData
    : clinicalTimelineData.filter(item => item.petKey === selectedPetFilter);

  // Calendar week days
  const weekDays = [
    { day: 'T2', date: '28', active: false },
    { day: 'T3', date: '29', active: true },
    { day: 'T4', date: '30', active: false },
    { day: 'T5', date: '01', active: false },
    { day: 'T6', date: '02', active: false },
    { day: 'T7', date: '03', active: false },
    { day: 'CN', date: '04', active: false },
  ];

  return (
    <div className="w-full h-full flex flex-col justify-between overflow-hidden px-2 sm:px-4 py-2 select-none">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-8 z-50 bg-[#1c1d2e] border border-indigo-500/50 text-white px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. KHU VỰC CHÀO MỪNG & THẺ THAO TÁC NHANH (GREETING & CHIPS) */}
      {/* ============================================================ */}
      <div className="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
        {/* Dòng chào hỏi */}
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Hi, {currentUser?.name || 'Mạnh Đinh'}!</span>
            <span className="text-xl">🐾</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Hôm nay các bé Mochi, Luna và Bánh Bao đều có chỉ số sinh học ổn định.
          </p>
        </div>

        {/* Hàng 4 thẻ ngang nhỏ cạnh lời chào (Quick Action Chips) */}
        <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
          {/* 1. Nút tròn dấu cộng tím mở nhanh tác vụ mới */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenAddSchedule();
            }}
            title="Thêm tác vụ mới nhanh"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* 2. [ 📋 Lịch trình hôm nay ] */}
          <button
            onClick={() => {
              sound.playClick();
              onNavigateTab('schedule');
            }}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-[#151621]/90 hover:bg-slate-100 dark:hover:bg-[#1c1d2e] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-md shrink-0 cursor-pointer group"
          >
            <span className="text-sm">📋</span>
            <div className="text-left leading-tight">
              <p className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">Lịch trình hôm nay</p>
              <p className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">2 việc cần hoàn thành</p>
            </div>
          </button>

          {/* 3. [ 💉 Hộ chiếu WSAVA ] */}
          <button
            onClick={() => {
              sound.playClick();
              onNavigateTab('medical');
            }}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-[#151621]/90 hover:bg-slate-100 dark:hover:bg-[#1c1d2e] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-md shrink-0 cursor-pointer group"
          >
            <span className="text-sm">💉</span>
            <div className="text-left leading-tight">
              <p className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">Hộ chiếu WSAVA</p>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-300 font-medium">Hạn vắc-xin 2026-2027</p>
            </div>
          </button>

          {/* 4. [ 🤖 Hỏi Bác Sĩ Dr. Paw ] */}
          <button
            onClick={() => {
              sound.playPop();
              onAskAiPrompt('Xin chào Bác sĩ Dr. Paw! Hôm nay thể trạng các bé Mochi, Luna và Bánh Bao thế nào?');
            }}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 hover:from-indigo-800 hover:to-purple-900 border border-indigo-500/40 text-white transition-all shadow-lg shadow-indigo-950/40 shrink-0 cursor-pointer group"
          >
            <span className="text-sm">🤖</span>
            <div className="text-left leading-tight">
              <p className="text-[11px] font-bold text-indigo-200 group-hover:text-white transition-colors">Hỏi Bác Sĩ Dr. Paw</p>
              <p className="text-[10px] text-emerald-400 font-medium">Trợ lý AI 24/7 trực tuyến</p>
            </div>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. BỐ CỤC LƯỚI 3 CỘT (OBSIDIAN SPATIAL CANVAS GRID)           */}
      {/* ============================================================ */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3.5 sm:gap-4 overflow-hidden">
        
        {/* ============================================================ */}
        {/* ■ CỘT 1 (Trái - 4 Cols): THÔNG BÁO Y TẾ & VIỆC CHĂM SÓC     */}
        {/* ============================================================ */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3.5 min-h-0 h-full">
          
          {/* Card Trên: Thông Báo Y Tế & Dịch Tễ */}
          <div className="flex-1 min-h-0 bg-white/85 dark:bg-[#151621]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.07] rounded-3xl p-4 sm:p-5 shadow-lg dark:shadow-2xl flex flex-col justify-between overflow-hidden relative group hover:border-indigo-400/50 dark:hover:border-white/[0.12] transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/25">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Thông Báo Y Tế & Dịch Tễ
                </h2>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-400/30">
                2 Mới
              </span>
            </div>

            {/* Content Container */}
            <div className="flex-1 min-h-0 flex flex-col justify-around py-2 gap-2 overflow-y-auto custom-scrollbar">
              {/* 1. Cảnh báo ổ dịch Parvovirus */}
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 tracking-wider">
                      Cảnh Báo Ổ Dịch Khu Vực
                    </span>
                    <span className="text-[9px] text-amber-600/80 dark:text-amber-300/70">Bán kính 2.5km</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-900 dark:text-white leading-snug mt-0.5">
                    Phát hiện ổ dịch Parvovirus lây nhiễm tại khu vực Cầu Giấy.
                  </p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    Khuyến cáo: Hạn chế cho bé tiếp xúc bãi cỏ công cộng và kiểm tra hạn tiêm vắc-xin 7 bệnh.
                  </p>
                </div>
              </div>

              {/* 2. Tin nhắn dặn dò từ Bác sĩ trực */}
              <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/25 flex items-start gap-2.5">
                <img 
                  src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120" 
                  alt="BS Nguyễn Văn An" 
                  className="w-7 h-7 rounded-xl object-cover border border-indigo-400/40 shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">
                      BS. Nguyễn Văn An (PetHealth)
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">10m trước</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-200 mt-0.5 leading-snug">
                    "Theo dõi phản ứng sau tiêm của bé Mochi. Nếu thân nhiệt &gt;39.5°C hãy kích hoạt cấp cứu ngay."
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom mini link */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-[11px] shrink-0 text-slate-500 dark:text-slate-400">
              <span className="text-[10px]">Cập nhật từ Hệ thống Dịch tễ WSAVA</span>
              <button 
                onClick={() => onNavigateTab('medical')}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Chi tiết</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Card Dưới: Việc Chăm Sóc Hôm Nay */}
          <div className="flex-1 min-h-0 bg-white/85 dark:bg-[#151621]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.07] rounded-3xl p-4 sm:p-5 shadow-lg dark:shadow-2xl flex flex-col justify-between overflow-hidden relative group hover:border-indigo-400/50 dark:hover:border-white/[0.12] transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06] shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-500/25">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Việc Chăm Sóc Hôm Nay
                </h2>
              </div>
              <span className="text-[10px] font-mono text-cyan-700 dark:text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded-full border border-cyan-400/30">
                1 / 3 hoàn thành
              </span>
            </div>

            {/* Tasks List */}
            <div className="flex-1 min-h-0 flex flex-col justify-around py-1 gap-2 overflow-y-auto custom-scrollbar">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => handleToggleTask(task.id)}
                  className="p-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.06] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                        task.completed 
                          ? 'bg-cyan-500 dark:bg-cyan-400 border-cyan-500 dark:border-cyan-400 text-white dark:text-[#0B0C10]' 
                          : 'border-slate-300 dark:border-white/30 text-transparent'
                      }`}>
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span className={`text-xs font-bold ${task.completed ? 'text-slate-400 dark:text-white line-through opacity-70' : 'text-slate-800 dark:text-white'}`}>
                        {task.title}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">({task.petName})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">{task.deadline}</span>
                    </div>
                  </div>

                  {/* Thanh tiến độ Cyan / Indigo */}
                  <div className="mt-2 w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        task.color === 'cyan' 
                          ? 'bg-cyan-500 dark:bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]' 
                          : task.color === 'indigo'
                          ? 'bg-indigo-600 dark:bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]'
                          : 'bg-slate-400 dark:bg-slate-600'
                      }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom action */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-[11px] shrink-0 text-slate-500 dark:text-slate-400">
              <span className="text-[10px]">Tự động đồng bộ với Smart Feeder</span>
              <button 
                onClick={() => onNavigateTab('schedule')}
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Xem tất cả</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* ■ CỘT 2 (Giữa - 4 Cols): LỘ TRÌNH LÂM SÀNG & SOS CẤP CỨU 24/7 */}
        {/* ============================================================ */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3.5 min-h-0 h-full">
          
          {/* Card Trên: Lộ Trình Lâm Sàng & Điều Trị Hôm Nay */}
          <div className="flex-1 min-h-0 bg-white/85 dark:bg-[#151621]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.07] rounded-3xl p-4 sm:p-5 shadow-lg dark:shadow-2xl flex flex-col overflow-hidden relative group hover:border-indigo-400/50 dark:hover:border-white/[0.12] transition-colors">
            {/* Header with Title & Filter Tabs */}
            <div className="shrink-0 space-y-2 pb-2.5 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Stethoscope className="w-3.5 h-3.5" />
                  </div>
                  <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Lộ Trình Lâm Sàng & Điều Trị Hôm Nay
                  </h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {filteredTimeline.length} ca
                  </span>
                </div>
              </div>

              {/* Bộ lọc tab nhỏ: [ Tất cả ] [ Mochi ] [ Luna ] [ Bánh Bao ] */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#1b1c2a] border border-slate-200/80 dark:border-white/[0.06]">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'mochi', label: 'Mochi' },
                  { id: 'luna', label: 'Luna' },
                  { id: 'banhbao', label: 'Bánh Bao' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedPetFilter(tab.id);
                    }}
                    className={`py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      selectedPetFilter === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Danh sách Lộ trình dạng Timeline phát sáng & Thẻ Lâm sàng nối nhau */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 py-2 flex flex-col justify-start">
              {filteredTimeline.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  <p>Không có lịch khám nào của bé trong hôm nay.</p>
                  <button
                    onClick={() => setSelectedPetFilter('all')}
                    className="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
                  >
                    Xem tất cả các bé
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTimeline.map((item, index) => (
                    <div key={item.id} className="relative pl-6 sm:pl-7 group">
                      {/* Đường kẻ dọc timeline phát sáng nối giữa các ca khám */}
                      {index !== filteredTimeline.length - 1 && (
                        <div className="absolute left-[9px] sm:left-[11px] top-6 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/50 via-cyan-400/40 to-indigo-500/20 shadow-[0_0_8px_rgba(99,102,241,0.3)] pointer-events-none" />
                      )}

                      {/* Mốc giờ & Điểm chấm tròn Timeline phát sáng */}
                      <div className={`absolute left-1 sm:left-1.5 top-2.5 w-3.5 h-3.5 rounded-full ${item.dotClass} ring-4 transition-transform group-hover:scale-125 z-10`} />

                      {/* Thẻ lâm sàng chi tiết */}
                      <div className={`p-3 rounded-2xl ${item.cardBg} bg-white/60 dark:bg-white/[0.03] hover:bg-slate-100/80 dark:hover:bg-white/[0.06] border ${item.cardBorder} transition-all duration-300 shadow-xs hover:shadow-md space-y-2`}>
                        {/* Header của thẻ: Mốc giờ bên trái, Badge Ưu tiên & Tên thú cưng */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${item.badgeClass}`}>
                              {item.priorityBadge}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                              {item.petName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-700 dark:text-cyan-400 bg-slate-100 dark:bg-[#1b1c2a] px-2 py-0.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08]">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{item.time}</span>
                          </div>
                        </div>

                        {/* Tiêu đề & Mô tả ca khám */}
                        <div>
                          <h3 className="text-xs font-black text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                            {item.title}
                          </h3>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed line-clamp-2">
                            {item.desc}
                          </p>
                        </div>

                        {/* Bác sĩ phụ trách, Phòng khám & Cơ sở */}
                        <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img 
                              src={item.doctorAvatar} 
                              alt={item.doctor}
                              className="w-6 h-6 rounded-full object-cover border border-indigo-400/40 shrink-0" 
                            />
                            <div className="leading-tight truncate">
                              <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">{item.doctor}</p>
                              <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{item.clinic}</p>
                            </div>
                          </div>

                          <span className="text-[9px] px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-400/30 shrink-0">
                            {item.room}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Nút [ + Thêm lịch hẹn mới ] đặt ngay sát dưới danh sách thẻ, không bị đẩy trôi xuống đáy */}
              <div className="mt-2.5 shrink-0">
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenAddSchedule();
                  }}
                  className="w-full py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-600/20 hover:bg-indigo-100 dark:hover:bg-indigo-600/35 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white border border-indigo-200 dark:border-indigo-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm lịch hẹn mới</span>
                </button>
              </div>
            </div>
          </div>

          {/* Nâng cấp Banner Cấp Cứu SOS ở đáy Cột 2 (Emergency SOS Card) */}
          <div className="mt-4 p-4 rounded-3xl bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900/60 border border-rose-500/30 shadow-[0_0_25px_rgba(244,63,94,0.15)] flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 animate-pulse">
                <AlertTriangle size={20}/>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black tracking-wide text-rose-200 uppercase">Cấp Cứu Thú Y 24/7</h4>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">Xe sẵn sàng</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Bác sĩ trực cấp cứu trực tuyến • Hotline điều phối khẩn</p>
              </div>
            </div>
            <button 
              onClick={() => {
                sound.playAlert();
                setIsEmergencyModalOpen(true);
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-xs shadow-lg shadow-rose-500/30 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <PhoneCall size={14}/>
              <span>Gọi SOS</span>
            </button>
          </div>

        </div>

        {/* ============================================================ */}
        {/* ■ CỘT 3 (Phải - 4 Cols): LỊCH TUẦN, CHỈ SỐ SINH HỌC & LỊCH HẸN */}
        {/* ============================================================ */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3.5 min-h-0 h-full">
          
          {/* Card 1: Lịch Tuần Trực Quan (Mini Calendar Bar) */}
          <div className="shrink-0 bg-white/85 dark:bg-[#151621]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.07] rounded-3xl p-3.5 sm:p-4 shadow-lg dark:shadow-2xl relative group hover:border-indigo-400/50 dark:hover:border-white/[0.12] transition-colors">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.06] mb-2.5">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Lịch Tuần Trực Quan
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Tháng 09, 2026</span>
            </div>

            {/* Hàng 7 ngày trong tuần, Thứ 3 ngày 29 khoanh tròn sáng tím */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDays.map(item => (
                <div 
                  key={item.day}
                  className={`flex flex-col items-center py-1.5 px-1 rounded-xl transition-all ${
                    item.active 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50 ring-2 ring-indigo-400 font-bold scale-105' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="text-[9px] uppercase tracking-wider">{item.day}</span>
                  <span className="text-xs mt-0.5">{item.date}</span>
                  {item.active && (
                    <span className="w-1 h-1 rounded-full bg-white mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Chỉ Số Sinh Học & Sức Khỏe (Obsidian Spatial Biometric HUD) */}
          <div className="flex-1 min-h-0 bg-white/85 dark:bg-[#151621]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.07] rounded-3xl p-3.5 sm:p-4 shadow-lg dark:shadow-2xl flex flex-col justify-between overflow-y-auto custom-scrollbar relative group hover:border-indigo-400/50 dark:hover:border-white/[0.12] transition-colors gap-2.5">
            {/* 1. Header Widget: Bổ sung chọn bé & Trạng thái thời gian thực */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-white/[0.06] shrink-0 gap-2">
              <div className="flex items-center gap-2">
                <Activity className="text-cyan-400 animate-pulse shrink-0" size={18} />
                <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Chỉ Số Sinh Học & Sức Khỏe
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
                {/* Bộ chọn chuyển đổi nhanh giữa 3 bé có cân nặng thực tế */}
                <div className="relative">
                  <select
                    value={selectedBiometricPet}
                    onChange={(e) => {
                      sound.playClick();
                      setSelectedBiometricPet(e.target.value);
                    }}
                    className="appearance-none pl-2.5 pr-6 py-1 rounded-xl bg-slate-100 dark:bg-[#1b1c2a] hover:bg-slate-200 dark:hover:bg-[#232436] text-[11px] font-bold text-slate-800 dark:text-cyan-300 border border-slate-300 dark:border-cyan-500/30 shadow-xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  >
                    <option value="mochi" className="bg-[#151621] text-white">🐶 Mochi • 24.5 kg</option>
                    <option value="luna" className="bg-[#151621] text-white">🐱 Luna • 4.2 kg</option>
                    <option value="banhbao" className="bg-[#151621] text-white">🐩 Bánh Bao • 1.6 kg</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-cyan-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Chấm xanh radar báo kết nối vòng cổ thông minh */}
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span className="text-[10px] text-emerald-400 font-mono tracking-tight whitespace-nowrap">
                    Live Sync: Smart Collar v2
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Hàng 1: Nâng cấp 2 Vòng tròn tiến độ Thể Trạng & Miễn Dịch (Glow Donut HUDs) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 shrink-0">
              {/* Vòng 1 (Thể Trạng & Cân Nặng Chuẩn - 94%) */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-cyan-500/25 hover:border-cyan-400/50 transition-all flex flex-col items-center text-center shadow-xs">
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <defs>
                      <linearGradient id="cyanEmeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22D3EE" />
                        <stop offset="100%" stopColor="#10B981" />
                      </linearGradient>
                    </defs>
                    <path
                      className="text-slate-200 dark:text-white/[0.07]"
                      strokeWidth="3.2"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="url(#cyanEmeraldGrad)"
                      strokeDasharray={`${currentBiometricPet.bodyScore}, 100`}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.75))' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono leading-none">
                      {currentBiometricPet.bodyScore}%
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-cyan-600 dark:text-cyan-300 font-bold uppercase tracking-wider mt-0.5">
                      Thể Trạng
                    </span>
                  </div>
                </div>

                <div className="mt-2 space-y-0.5">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {currentBiometricPet.bodyStatus}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                    {currentBiometricPet.weightDiff}
                  </p>
                </div>
              </div>

              {/* Vòng 2 (Kháng Thể & Miễn Dịch WSAVA - 85%) */}
              <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-indigo-500/25 hover:border-indigo-400/50 transition-all flex flex-col items-center text-center shadow-xs">
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <defs>
                      <linearGradient id="indigoPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#6366F1" />
                        <stop offset="100%" stopColor="#A855F7" />
                      </linearGradient>
                    </defs>
                    <path
                      className="text-slate-200 dark:text-white/[0.07]"
                      strokeWidth="3.2"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="url(#indigoPurpleGrad)"
                      strokeDasharray={`${currentBiometricPet.wsavaScore}, 100`}
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      style={{ filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.75))' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg sm:text-xl font-black text-indigo-700 dark:text-indigo-300 font-mono leading-none">
                      {currentBiometricPet.wsavaScore}%
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-indigo-600 dark:text-purple-300 font-bold uppercase tracking-wider mt-0.5">
                      Kháng Thể
                    </span>
                  </div>
                </div>

                <div className="mt-2 space-y-0.5">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {currentBiometricPet.wsavaStatus}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                    {currentBiometricPet.wsavaNote}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. Hàng 2: Thước đo vận động & năng lượng hôm nay (Lấp đầy khoảng trống chết) */}
            <div className="bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 rounded-2xl p-3 space-y-2 shrink-0">
              <div className="flex justify-between items-center text-xs flex-wrap gap-1">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                  <Flame className="text-amber-500 dark:text-amber-400 shrink-0" size={14} />
                  Vận động & Tiêu hao calo hôm nay
                </span>
                <span className="text-cyan-600 dark:text-cyan-300 font-bold font-mono">
                  {currentBiometricPet.activityDistance} • {currentBiometricPet.activityCalories} ({currentBiometricPet.activityProgress}% mục tiêu)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-cyan-400 rounded-full transition-all duration-500" 
                  style={{ width: `${currentBiometricPet.activityProgress}%` }} 
                />
              </div>
            </div>

            {/* Cảm biến sinh trắc thời gian thực */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] grid grid-cols-3 gap-1 text-center shrink-0">
              <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.05]">
                <p className="text-[9px] text-slate-500 dark:text-slate-400">Nhịp tim</p>
                <p className="text-[11px] font-bold text-slate-900 dark:text-white font-mono">{currentBiometricPet.heartRate}</p>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.05]">
                <p className="text-[9px] text-slate-500 dark:text-slate-400">Thân nhiệt</p>
                <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">{currentBiometricPet.temp}</p>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.05]">
                <p className="text-[9px] text-slate-500 dark:text-slate-400">Hô hấp</p>
                <p className="text-[11px] font-bold text-cyan-600 dark:text-cyan-300 font-mono">{currentBiometricPet.respiratory}</p>
              </div>
            </div>
          </div>

          {/* Card 3: Lịch Hẹn Bác Sĩ Sắp Tới (Upcoming Appointment) */}
          <div className="shrink-0 bg-white/85 dark:bg-[#151621]/90 backdrop-blur-2xl border border-slate-200/80 dark:border-white/[0.07] rounded-3xl p-3.5 sm:p-4 shadow-lg dark:shadow-2xl relative group hover:border-indigo-400/50 dark:hover:border-white/[0.12] transition-colors space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/80 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                  Lịch Hẹn Bác Sĩ Sắp Tới
                </span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/30">
                Đã đặt
              </span>
            </div>

            {/* Appointment Details */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Bệnh viện Thú y PetHealth</span>
                <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-bold">29/09 • 09:30</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Bác sĩ: <strong className="text-slate-900 dark:text-white">BS. Nguyễn Văn An</strong> (Khám tổng quát & Vắc-xin)
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                <MapPin className="w-3 h-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                <span className="truncate">128 Cầu Giấy, Phường Quan Hoa, Hà Nội</span>
              </div>
            </div>

            {/* 2 Nút hành động ở góc dưới: [ Đổi Lịch ] và [ ✓ Nhận Lịch ] */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenVetBooking();
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-200 dark:border-white/10 transition-all cursor-pointer"
              >
                Đổi Lịch
              </button>

              <button
                onClick={handleConfirmAppointment}
                disabled={appointmentConfirmed}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  appointmentConfirmed
                    ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/40 active:scale-95'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>{appointmentConfirmed ? 'Đã Nhận' : 'Nhận Lịch'}</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Emergency Modal 24/7 */}
      <EmergencyModal
        isOpen={isEmergencyModalOpen}
        onClose={() => setIsEmergencyModalOpen(false)}
        currentPet={pets?.[0] || { name: 'Mochi', breed: 'Golden Retriever', weight: 24.5 }}
      />
    </div>
  );
};

export default OwnerDashboardView;
