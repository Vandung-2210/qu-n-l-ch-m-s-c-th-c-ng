import React, { useState } from 'react';
import { 
  TrendingUp, Scale, AlertCircle, CheckCircle, Sparkles, 
  Info, Activity, ShieldCheck, ArrowUpRight 
} from 'lucide-react';
import { BREED_GROWTH_STANDARDS } from '../../constants/mockData';

export default function GrowthCurveComparisonView({ pet }) {
  const [selectedStandardBreed, setSelectedStandardBreed] = useState(pet?.breed || 'Golden Retriever');

  if (!pet) return null;

  // Lấy dữ liệu chuẩn giống loài từ BREED_GROWTH_STANDARDS
  const rawStandard = BREED_GROWTH_STANDARDS[selectedStandardBreed] || BREED_GROWTH_STANDARDS['Golden Retriever'] || {};
  const curve = (rawStandard.monthlyStandards || []).map(s => ({
    month: s.month,
    min: s.min,
    max: s.max,
    avg: s.ideal
  }));
  const standard = {
    ...rawStandard,
    breedName: selectedStandardBreed,
    curve,
    idealAdultWeight: rawStandard.adultWeightRange 
      ? `${rawStandard.adultWeightRange[0]} - ${rawStandard.adultWeightRange[1]} kg` 
      : '25 - 34 kg'
  };

  // Giả lập lịch sử cân nặng thực tế của bé theo các tháng tuổi
  const actualHistory = [
    { month: 2, weight: pet.species === 'dog' ? 5.2 : 1.1 },
    { month: 4, weight: pet.species === 'dog' ? 12.5 : 2.0 },
    { month: 6, weight: pet.species === 'dog' ? 19.8 : 3.2 },
    { month: 8, weight: pet.species === 'dog' ? 24.5 : 4.0 },
    { month: 12, weight: parseFloat(pet.weight) || 28.5 }
  ];

  const currentWeight = parseFloat(pet.weight) || 28.5;
  const standard12m = standard.curve.find(c => c.month === 12)?.avg || 28.5;
  const weightDiff = (currentWeight - standard12m).toFixed(1);
  const diffPercent = Math.round(((currentWeight - standard12m) / standard12m) * 100);

  // Health assessment
  let healthStatus = 'ideal'; // 'ideal', 'overweight', 'underweight'
  if (diffPercent > 12) healthStatus = 'overweight';
  else if (diffPercent < -12) healthStatus = 'underweight';

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Đường Cong Tăng Trưởng & Chuẩn Giống Loài</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase">
                AI Growth Curve
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              So sánh cân nặng thực tế của {pet.name} với dữ liệu tiêu chuẩn quốc tế
            </p>
          </div>
        </div>

        {/* Standard Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Đối chiếu chuẩn:</span>
          <select
            value={selectedStandardBreed}
            onChange={(e) => setSelectedStandardBreed(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            {Object.keys(BREED_GROWTH_STANDARDS).map(breed => (
              <option key={breed} value={breed}>{breed}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assessment Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cân nặng hiện tại</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {currentWeight} <span className="text-sm font-bold text-slate-500">kg</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">Đo gần nhất lúc 1 tuổi</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Chuẩn trưởng thành (12 tháng)</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
            {standard.idealAdultWeight}
          </div>
          <div className="text-xs text-slate-400 mt-1">Theo {standard.breedName}</div>
        </div>

        <div className={`p-4 rounded-2xl border ${
          healthStatus === 'ideal'
            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300'
            : healthStatus === 'overweight'
            ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300'
            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="text-[11px] font-semibold uppercase tracking-wider">Đánh giá thể trạng</div>
          <div className="text-lg font-black mt-1 flex items-center gap-1.5">
            {healthStatus === 'ideal' && <><CheckCircle className="w-5 h-5 text-emerald-500" /> Thể trạng Lý tưởng</>}
            {healthStatus === 'overweight' && <><AlertCircle className="w-5 h-5 text-amber-500" /> Có nguy cơ thừa cân (+{diffPercent}%)</>}
            {healthStatus === 'underweight' && <><AlertCircle className="w-5 h-5 text-rose-500" /> Cần bổ sung đạm/dinh dưỡng</>}
          </div>
          <div className="text-xs mt-1 opacity-80">Chênh lệch: {weightDiff > 0 ? `+${weightDiff}` : weightDiff} kg so với chuẩn</div>
        </div>
      </div>

      {/* SVG Growth Chart Visualizer */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white">Biểu đồ đối sánh theo tháng tuổi (kg)</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
              <span className="w-3 h-1 bg-indigo-400 rounded-full inline-block"></span> Bé {pet.name} (Thực tế)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
              <span className="w-3 h-1 bg-slate-500 rounded-full border border-dashed inline-block"></span> Dải chuẩn {selectedStandardBreed}
            </span>
          </div>
        </div>

        {/* Growth Curves Bar Chart Comparison */}
        <div className="grid grid-cols-6 gap-2 pt-4 pb-2 items-end h-48 border-b border-slate-800 px-2">
          {standard.curve.map(point => {
            const actualPoint = actualHistory.find(a => a.month === point.month);
            const lastPoint = standard.curve.length > 0 ? standard.curve[standard.curve.length - 1] : null;
            const maxVal = ((lastPoint?.max || 35)) * 1.15;
            
            const stdHeight = Math.round((point.avg / maxVal) * 100);
            const actHeight = actualPoint ? Math.round((actualPoint.weight / maxVal) * 100) : 0;

            return (
              <div key={point.month} className="flex flex-col items-center h-full justify-end group">
                <div className="flex items-end gap-1.5 w-full justify-center h-full">
                  {/* Standard bar */}
                  <div 
                    style={{ height: `${stdHeight}%` }}
                    className="w-3.5 sm:w-5 bg-slate-700/80 rounded-t-lg transition-all group-hover:bg-slate-600 relative"
                    title={`Chuẩn: ${point.min}-${point.max} kg`}
                  >
                    <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] bg-slate-800 px-1 py-0.5 rounded text-slate-300 whitespace-nowrap">
                      {point.avg}kg
                    </span>
                  </div>

                  {/* Actual Pet bar */}
                  {actualPoint && (
                    <div 
                      style={{ height: `${actHeight}%` }}
                      className="w-3.5 sm:w-5 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all shadow-lg shadow-indigo-500/30 relative"
                      title={`Thực tế ${pet.name}: ${actualPoint.weight} kg`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] bg-indigo-600 px-1 py-0.5 rounded text-white font-bold whitespace-nowrap">
                        {actualPoint.weight}kg
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-[10px] font-bold text-slate-400 mt-2">
                  T{point.month}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>T2: 2 tháng • T4: 4 tháng • T6: 6 tháng • T8: 8 tháng • T12: 1 tuổi • T18: Trưởng thành</span>
          <span className="text-indigo-400 font-semibold">Tự động dự báo béo phì / sụt cân</span>
        </div>
      </div>

    </div>
  );
}
