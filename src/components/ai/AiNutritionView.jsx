import React, { useState } from 'react';
import { 
  Utensils, 
  Flame, 
  Droplet, 
  ShieldAlert, 
  Sparkles, 
  Scale, 
  Check, 
  Info,
  PawPrint,
  Clock
} from 'lucide-react';
import { calculatePetNutrition } from '../../services/aiService';

export const AiNutritionView = ({ pets = [] }) => {
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || '');
  const selectedPet = pets.find(p => p.id === selectedPetId) || pets[0];

  const nutrition = selectedPet ? calculatePetNutrition(selectedPet) : null;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Utensils className="w-7 h-7 text-emerald-600" />
            Tính Khẩu Phần Dinh Dưỡng AI
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Tính toán lượng calo khoa học (RER/MER), số gram thức ăn và nước uống cần thiết mỗi ngày.
          </p>
        </div>

        {/* Pet Selector */}
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
          <PawPrint className="w-4 h-4 text-emerald-600 ml-2" />
          <span className="text-xs font-bold text-slate-600">Chọn bé:</span>
          <select
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 outline-hidden cursor-pointer"
          >
            {pets.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.breed} • {p.weight}kg)</option>
            ))}
          </select>
        </div>
      </div>

      {nutrition && selectedPet ? (
        <div className="space-y-6">
          
          {/* Main 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Daily Calories */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-100">Năng lượng khuyến nghị</span>
                <Flame className="w-5 h-5 text-amber-200" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black">{nutrition.dailyCalories}</span>
                <span className="text-xs font-semibold text-amber-100">kcal / ngày</span>
              </div>
              <p className="text-[11px] text-amber-100 mt-2">
                Nhu cầu trao đổi chất cơ bản (RER): <strong>{nutrition.rer} kcal</strong>
              </p>
            </div>

            {/* Dry Food */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Lượng thức ăn hạt</span>
                <Utensils className="w-5 h-5 text-emerald-200" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black">{nutrition.dryFoodGrams}</span>
                <span className="text-xs font-semibold text-emerald-100">gram / ngày</span>
              </div>
              <p className="text-[11px] text-emerald-100 mt-2">
                Chia đều cho <strong>{nutrition.mealsPerDay}</strong>
              </p>
            </div>

            {/* Daily Water */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-sky-600 to-blue-700 text-white shadow-lg shadow-sky-600/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-100">Lượng nước tối thiểu</span>
                <Droplet className="w-5 h-5 text-sky-200" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black">{nutrition.waterMl}</span>
                <span className="text-xs font-semibold text-sky-100">ml / ngày</span>
              </div>
              <p className="text-[11px] text-sky-100 mt-2">
                Giúp phòng sỏi bàng quang & bảo vệ thận
              </p>
            </div>

            {/* Feeding Frequency */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tần suất ăn</span>
                <Clock className="w-5 h-5 text-slate-400" />
              </div>
              <div className="text-xl font-black text-slate-900 mt-1">
                {nutrition.mealsPerDay}
              </div>
              <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Đúng giờ cố định
              </p>
            </div>

          </div>

          {/* Guidelines & Toxic Food Warn */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Protein & Nutrition Guide */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Lưu Ý Dinh Dưỡng Cho {selectedPet.name} ({selectedPet.breed})
                </h3>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs space-y-1.5">
                <div className="font-bold text-emerald-900">Tiêu chuẩn Protein:</div>
                <div className="text-emerald-800">{nutrition.proteinRecommendation}</div>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <p>• <strong>Bổ sung Omega 3 & 6:</strong> Giúp lông bóng mượt, giảm rụng lông và hạn chế viêm da dị ứng.</p>
                <p>• <strong>Kiểm soát cân nặng:</strong> Thường xuyên cân 2-4 tuần/lần để điều chỉnh tăng/giảm 10% lượng thức ăn nếu bé có dấu hiệu béo phì hoặc sút cân.</p>
                <p>• <strong>Chuyển đổi thức ăn:</strong> Khi đổi loại hạt mới, hãy trộn theo tỉ lệ 25% - 50% - 75% trong 7 ngày để tránh rối loạn tiêu hóa.</p>
              </div>
            </div>

            {/* TOXIC FOODS WARNING */}
            <div className="bg-white rounded-3xl p-6 border border-rose-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-rose-700">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-base font-bold">Thực Phẩm Tuyệt Đối Cấm Cho Thú Cưng Ăn</h3>
              </div>

              <p className="text-xs text-slate-500">
                Những thực phẩm dưới đây chứa độc tố có thể gây suy thận cấp, vỡ hồng cầu hoặc tử vong nhanh chóng:
              </p>

              <div className="grid grid-cols-2 gap-2">
                {nutrition.toxicFoods.map((food, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-900 flex items-center gap-2">
                    <span className="text-sm">⛔</span>
                    <span>{food}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : null}

    </div>
  );
};
