import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Sparkles, 
  TrendingUp, 
  PieChart, 
  Calendar, 
  Receipt,
  Utensils,
  Stethoscope,
  Sparkle,
  Gamepad2,
  Syringe,
  Trash
} from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../../constants/mockData';
import { analyzePetExpense } from '../../services/aiService';

export const ExpenseView = ({
  expenses = [],
  pets = [],
  onAddExpense,
  onDeleteExpense
}) => {
  const [selectedPetId, setSelectedPetId] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    petId: pets[0]?.id || '',
    category: 'food',
    title: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const filteredExpenses = expenses.filter(e => {
    return selectedPetId === 'all' || e.petId === selectedPetId;
  });

  const selectedPet = pets.find(p => p.id === selectedPetId) || null;
  const analysis = analyzePetExpense(filteredExpenses, selectedPet);

  const formatVND = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newExpense.title.trim() || !newExpense.amount) return;

    const petObj = pets.find(p => p.id === newExpense.petId);
    const assignedPetName = (newExpense.petId === 'all' || !newExpense.petId)
      ? 'Tất cả'
      : (petObj?.name || (
          newExpense.petId === 'pet-1' ? 'Mochi' :
          newExpense.petId === 'pet-2' ? 'Luna' :
          newExpense.petId === 'pet-3' ? 'Bánh Bao' : 'Tất cả'
        ));

    onAddExpense({
      ...newExpense,
      petName: assignedPetName
    });

    setNewExpense({
      petId: pets[0]?.id || '',
      category: 'food',
      title: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Quản Lý Chi Tiêu & Ngân Sách Nuôi Thú Cưng
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Theo dõi chi phí thức ăn, thuốc thú y, spa và nhận phân tích tài chính thông minh từ AI.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Pet Filter */}
          <select
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-xl outline-hidden shadow-xs"
          >
            <option value="all">Tất cả thú cưng</option>
            {pets.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>
            ))}
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Ghi Khoản Chi
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Tổng Chi Tiêu Đã Ghi</span>
          <div className="text-2xl sm:text-3xl font-black mt-2">
            {formatVND(analysis.totalSpent)}
          </div>
          <p className="text-[11px] text-emerald-100 mt-2">
            {filteredExpenses.length} khoản chi phí ghi nhận
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tỉ Lệ Thức Ăn & Dinh Dưỡng</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {analysis.foodPercent}%
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-2">
            {formatVND(analysis.byCategory.food || 0)} thức ăn & hạt
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Thú Y & Tiêm Chủng</span>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {analysis.medicalPercent}%
          </div>
          <p className="text-[11px] text-sky-600 font-semibold mt-2">
            {formatVND((analysis.byCategory.medical || 0) + (analysis.byCategory.vaccine || 0))} chi phí y tế
          </p>
        </div>

      </div>

      {/* AI Financial Advice & Monthly Forecast Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Advice Box */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-950 text-white shadow-xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 flex items-center justify-center text-indigo-300 border border-indigo-400/20 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-indigo-300">
                AI Đánh Giá Tài Chính & Tối Ưu Chi Phí Nuôi Pet
              </h3>
            </div>
            <p className="text-xs text-indigo-100/90 leading-relaxed mb-3">
              {analysis.advice}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {analysis.tips.map((tip, idx) => (
                <span key={idx} className="text-[11px] bg-white/10 px-2.5 py-1 rounded-lg text-indigo-200 border border-white/10">
                  💡 {tip}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Forecast Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Dự Báo Chi Phí Tháng Tới (AI Forecast)
                </h3>
                <p className="text-[11px] text-slate-400">Dựa vào độ tuổi, cân nặng và lịch tiêm phòng</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
              ~ 1.850.000 đ
            </span>
          </div>

          <div className="space-y-2 text-xs pt-1">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>🍗 Thức ăn khô & dinh dưỡng (khoảng 12kg/tháng):</span>
              <strong className="font-semibold text-slate-900 dark:text-white">950.000 đ</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>💉 Lịch nhỏ gáy trị ve & vắc-xin đến hạn:</span>
              <strong className="font-semibold text-slate-900 dark:text-white">500.000 đ</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>✂️ Cát vệ sinh / Spa & Phụ kiện dự phòng:</span>
              <strong className="font-semibold text-slate-900 dark:text-white">400.000 đ</strong>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Đang nằm trong ngưỡng an toàn ngân sách gia đình</span>
            <span className="text-slate-400">Trần: 2.500.000 đ/tháng</span>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Lịch Sử Chi Phí Gần Nhất</h3>
          <span className="text-xs font-bold text-slate-400">
            {filteredExpenses.length} bản ghi
          </span>
        </div>

        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Khoản Chi</th>
                <th className="py-3 px-4">Thú Cưng</th>
                <th className="py-3 px-4">Danh Mục</th>
                <th className="py-3 px-4">Số Tiền (VND)</th>
                <th className="py-3 px-4">Ngày</th>
                <th className="py-3 px-4 text-right">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Chưa có khoản chi nào được ghi nhận. Bấm "Ghi Khoản Chi" để bắt đầu!
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const pet = pets.find(p => p.id === exp.petId);
                  const catConfig = EXPENSE_CATEGORIES[exp.category] || EXPENSE_CATEGORIES.other;

                  // 3. SỬA HIỂN THỊ CỘT "THÚ CƯNG":
                  // Render trực tiếp trường exp.petName (Hiển thị rõ: Mochi, Luna, hoặc Bánh Bao). Nếu khoản chi chung cả nhà thì mới để "Tất cả".
                  const displayPetName = exp.petName || pet?.name || (
                    exp.petId === 'pet-1' ? 'Mochi' :
                    exp.petId === 'pet-2' ? 'Luna' :
                    exp.petId === 'pet-3' ? 'Bánh Bao' : 'Tất cả'
                  );

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {exp.title}
                        {exp.notes && <div className="text-[11px] text-slate-400 font-normal">{exp.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                          displayPetName.includes('Mochi') ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20' :
                          displayPetName.includes('Luna') ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20' :
                          displayPetName.includes('Bánh Bao') ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20' :
                          'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {displayPetName.includes('Mochi') && '🐕 '}
                          {displayPetName.includes('Luna') && '🐱 '}
                          {displayPetName.includes('Bánh Bao') && '🐰 '}
                          {displayPetName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${catConfig.color}`}>
                          {catConfig.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatVND(exp.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        {exp.date}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Xóa khoản chi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Ghi Khoản Chi Tiêu Mới
            </h3>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Thú cưng:</label>
                <select
                  value={newExpense.petId}
                  onChange={(e) => setNewExpense({ ...newExpense, petId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-hidden"
                >
                  <option value="all">Tất cả / Chung cho cả nhà</option>
                  {pets.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Danh mục chi tiêu:</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-hidden"
                >
                  {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nội dung chi tiêu *:</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Mua bao thức ăn Orijen, Tiêm phòng vắc-xin dại..."
                  value={newExpense.title}
                  onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Số tiền (VNĐ) *:</label>
                  <input
                    type="number"
                    required
                    placeholder="Ví dụ: 350000"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ngày chi:</label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ghi chú thêm:</label>
                <input
                  type="text"
                  placeholder="Nơi mua, chương trình khuyến mãi..."
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu Khoản Chi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export const ExpenseTrackerView = ExpenseView;
export default ExpenseView;
