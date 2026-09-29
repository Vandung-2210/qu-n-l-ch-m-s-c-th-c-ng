import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Calendar, 
  Scale, 
  QrCode, 
  Printer, 
  Plus, 
  Heart, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Award,
  PawPrint,
  TrendingUp,
  AlertTriangle,
  Image as ImageIcon
} from 'lucide-react';
import { SpeciesBadge, ScheduleBadge } from '../common/Badges';
import GrowthCurveComparisonView from './GrowthCurveComparisonView';

export const PetDetailModal = ({
  isOpen,
  onClose,
  pet,
  schedules = [],
  onUpdatePetWeight,
  onOpenAiScheduleForPet,
  onOpenPublicQr,
  onOpenLostMode,
  onOpenPoster
}) => {
  const [activeTab, setActiveTab] = useState('passport'); // passport | weight | growth | history
  const [newWeight, setNewWeight] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(new Date().toISOString().split('T')[0]);

  if (!isOpen || !pet) return null;

  // Lọc lịch trình của riêng pet này
  const petSchedules = schedules.filter(s => s.petId === pet.id);
  const completedSchedules = petSchedules.filter(s => s.completed);
  const upcomingSchedules = petSchedules.filter(s => !s.completed);

  const handleAddWeight = (e) => {
    e.preventDefault();
    if (!newWeight || isNaN(newWeight)) return;

    const updatedHistory = [
      ...(pet.weightHistory || []),
      { date: newWeightDate, weight: parseFloat(newWeight) }
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    onUpdatePetWeight(pet.id, parseFloat(newWeight), updatedHistory);
    setNewWeight('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <img
              src={pet.avatar}
              alt={pet.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=100'; }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900">{pet.name}</h2>
                <SpeciesBadge species={pet.species} />
              </div>
              <p className="text-xs text-slate-500">{pet.breed} • {pet.gender === 'male' ? '♂ Đực' : '♀ Cái'}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('passport')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'passport'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Căn Cước ID</span>
            </button>

            <button
              onClick={() => setActiveTab('growth')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'growth'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
              <span>Đường Cong Tăng Trưởng</span>
            </button>

            <button
              onClick={() => setActiveTab('weight')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'weight'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Cân Nặng ({pet.weightHistory?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Lịch Chăm Sóc ({petSchedules.length})</span>
            </button>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-1.5">
            {onOpenPublicQr && (
              <button
                onClick={() => onOpenPublicQr(pet)}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1 transition-all"
                title="Mã QR Vòng Cổ"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">QR Vòng Cổ</span>
              </button>
            )}

            {onOpenLostMode && (
              <button
                onClick={() => onOpenLostMode(pet)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                  pet.lostMode?.isLost
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                }`}
                title="Chế Độ Báo Mất"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{pet.lostMode?.isLost ? 'Đang Báo Mất!' : 'Báo Mất'}</span>
              </button>
            )}

            {onOpenPoster && (
              <button
                onClick={() => onOpenPoster(pet)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold flex items-center gap-1 transition-all"
                title="Tạo Poster Tìm Thú Lạc"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Poster Lạc</span>
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: PET PASSPORT ID CARD */}
        {activeTab === 'passport' && (
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 text-white p-6 sm:p-7 shadow-xl border border-emerald-500/30">
              
              {/* Card Watermark */}
              <div className="absolute right-4 bottom-4 opacity-10 pointer-events-none">
                <PawPrint className="w-44 h-44" />
              </div>

              {/* Passport Header */}
              <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <PawPrint className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-black tracking-widest uppercase text-emerald-300">
                    CĂN CƯỚC THÚ CƯNG ĐIỆN TỬ
                  </span>
                </div>
                <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  ID: {pet.id.toUpperCase()}
                </span>
              </div>

              {/* Passport Body */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                {/* Pet Photo Frame */}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-36 rounded-2xl overflow-hidden border-2 border-emerald-400/50 shadow-md bg-slate-800">
                    <img
                      src={pet.avatar}
                      alt={pet.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300'; }}
                    />
                  </div>
                  <span className="text-[11px] font-bold mt-2 text-emerald-300 uppercase tracking-wider">
                    {pet.gender === 'male' ? 'Giới tính: Đực' : 'Giới tính: Cái'}
                  </span>
                </div>

                {/* Details Table */}
                <div className="sm:col-span-2 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-emerald-800/40 pb-1">
                    <span className="text-emerald-300/80">Họ & Tên:</span>
                    <span className="font-extrabold text-sm text-white">{pet.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-800/40 pb-1">
                    <span className="text-emerald-300/80">Giống loài:</span>
                    <span className="font-semibold text-white">{pet.breed || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-800/40 pb-1">
                    <span className="text-emerald-300/80">Ngày sinh:</span>
                    <span className="font-semibold text-white">{pet.birthDate || 'Chưa rõ'}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-800/40 pb-1">
                    <span className="text-emerald-300/80">Cân nặng hiện tại:</span>
                    <span className="font-bold text-amber-300">{pet.weight} kg</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-800/40 pb-1">
                    <span className="text-emerald-300/80">Màu sắc lông:</span>
                    <span className="font-semibold text-white">{pet.color || 'Tự nhiên'}</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-800/40 pb-1">
                    <span className="text-emerald-300/80">Mã Microchip:</span>
                    <span className="font-mono text-emerald-200">{pet.microchip || 'Chưa cấy chip'}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-emerald-300/80">Triệt sản:</span>
                    <span className="font-semibold text-white">
                      {pet.isNeutered ? '✅ Đã triệt sản' : '❌ Chưa triệt sản'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Passport Footer */}
              <div className="mt-5 pt-3 border-t border-emerald-500/30 flex items-center justify-between text-[11px] text-emerald-300/80">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  <span>Xác thực bởi PetCare AI System</span>
                </div>
                <span className="italic">Bảo hộ y tế số</span>
              </div>
            </div>

            {/* Print & Action buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
              >
                <Printer className="w-4 h-4" /> In Thẻ Căn Cước
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenAiScheduleForPet(pet);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                <Sparkles className="w-4 h-4" /> AI Tạo Lịch Chăm Sóc Cho {pet.name}
              </button>
            </div>
          </div>
        )}

        {/* TAB 1.5: GROWTH CURVE COMPARISON */}
        {activeTab === 'growth' && (
          <div className="space-y-4">
            <GrowthCurveComparisonView pet={pet} />
          </div>
        )}

        {/* TAB 2: WEIGHT TRACKER */}
        {activeTab === 'weight' && (
          <div className="space-y-5">
            {/* Add weight form */}
            <form onSubmit={handleAddWeight} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-end gap-3">
              <div className="w-full sm:flex-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Ngày ghi nhận
                </label>
                <input
                  type="date"
                  required
                  value={newWeightDate}
                  onChange={(e) => setNewWeightDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="w-full sm:flex-1">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Cân nặng mới (kg)
                </label>
                <input
                  type="number"
                  step="0.05"
                  required
                  placeholder="Ví dụ: 24.8"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-hidden focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1"
              >
                <Plus className="w-4 h-4" /> Lưu cân nặng
              </button>
            </form>

            {/* Weight Records Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-4">Ngày ghi nhận</th>
                    <th className="py-2.5 px-4">Cân nặng</th>
                    <th className="py-2.5 px-4">Biến động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pet.weightHistory && pet.weightHistory.length > 0 ? (
                    [...pet.weightHistory].reverse().map((rec, idx, arr) => {
                      const prevRec = arr[idx + 1];
                      let diff = null;
                      if (prevRec) {
                        diff = (rec.weight - prevRec.weight).toFixed(2);
                      }

                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-medium text-slate-700">{rec.date}</td>
                          <td className="py-3 px-4 font-black text-slate-900">{rec.weight} kg</td>
                          <td className="py-3 px-4">
                            {diff !== null ? (
                              <span className={`font-semibold ${Number(diff) >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {Number(diff) > 0 ? `+${diff} kg` : `${diff} kg`}
                              </span>
                            ) : (
                              <span className="text-slate-400">Mốc đầu tiên</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400">
                        Chưa có lịch sử cân nặng nào
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CARE & MEDICAL HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Sắp tới & Cần làm ({upcomingSchedules.length})
              </h4>
              {upcomingSchedules.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Không có lịch sắp tới nào cho bé.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingSchedules.map(sch => (
                    <div key={sch.id} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{sch.title}</div>
                        <div className="text-slate-500 flex items-center gap-2 mt-0.5">
                          <Clock className="w-3 h-3" /> {sch.date} {sch.time}
                        </div>
                      </div>
                      <ScheduleBadge type={sch.type} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Đã hoàn thành ({completedSchedules.length})
              </h4>
              {completedSchedules.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Chưa có lịch sử hoàn thành.</p>
              ) : (
                <div className="space-y-2">
                  {completedSchedules.map(sch => (
                    <div key={sch.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs opacity-85">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-700 line-through">{sch.title}</div>
                          <div className="text-slate-400 text-[11px]">Ngày làm: {sch.completedAt ? sch.completedAt.split('T')[0] : sch.date}</div>
                        </div>
                      </div>
                      <ScheduleBadge type={sch.type} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
