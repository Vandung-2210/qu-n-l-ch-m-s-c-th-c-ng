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
import { getTodayVnDate } from '../../utils/dateUtils';

export const ExpenseView = ({
  expenses = [],
  pets = [],
  onAddExpense,
  onDeleteExpense
}) => {
  const [selectedPetId, setSelectedPetId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ngân sách người dùng tự thiết lập
  const [monthlyBudget, setMonthlyBudget] = useState(() => {
    try {
      const saved = localStorage.getItem('petcare_custom_monthly_budget');
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const getTodayDate = () => getTodayVnDate();

  const [newExpense, setNewExpense] = useState({
    petId: pets[0]?.id || '',
    category: 'food',
    title: '',
    amount: '',
    date: getTodayDate(),
    notes: ''
  });

  // Trích xuất danh sách các tháng có dữ liệu chi tiêu
  const availableMonths = React.useMemo(() => {
    const set = new Set();
    const currentMonth = getTodayDate().slice(0, 7);
    set.add(currentMonth);
    expenses.forEach(e => {
      if (e.date && e.date.length >= 7) set.add(e.date.slice(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [expenses]);

  // Bộ lọc kết hợp: Thú cưng, Danh mục, Tháng
  const filteredExpenses = expenses.filter(e => {
    const matchPet = selectedPetId === 'all' || e.petId === selectedPetId;
    const matchCategory = selectedCategory === 'all' || e.category === selectedCategory;
    const matchMonth = selectedMonth === 'all' || (e.date && e.date.startsWith(selectedMonth));
    return matchPet && matchCategory && matchMonth;
  });

  const selectedPet = pets.find(p => p.id === selectedPetId) || null;
  const analysis = analyzePetExpense(filteredExpenses, selectedPet);

  const formatVND = (num) => {
    if (num === null || num === undefined) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  const handleSaveBudget = (e) => {
    e.preventDefault();
    const parsed = parseFloat(budgetInput);
    if (isNaN(parsed) || parsed < 0) {
      alert('Vui lòng nhập số tiền ngân sách hợp lệ!');
      return;
    }
    setMonthlyBudget(parsed);
    try {
      localStorage.setItem('petcare_custom_monthly_budget', String(parsed));
    } catch {}
    setIsEditingBudget(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!newExpense.title.trim()) {
      alert('Vui lòng nhập tên khoản chi tiêu!');
      return;
    }

    const numAmount = parseFloat(newExpense.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Số tiền chi tiêu phải là một số hợp lệ lớn hơn 0!');
      return;
    }

    const petObj = pets.find(p => p.id === newExpense.petId);
    const assignedPetName = petObj ? petObj.name : 'Chi tiêu chung';

    setIsSubmitting(true);
    try {
      await onAddExpense({
        ...newExpense,
        amount: numAmount,
        date: newExpense.date || getTodayDate(),
        petName: assignedPetName
      });

      setNewExpense({
        petId: pets[0]?.id || '',
        category: 'food',
        title: '',
        amount: '',
        date: getTodayDate(),
        notes: ''
      });
      setIsAddModalOpen(false);
    } catch (err) {
      alert(err.message || 'Lỗi thêm chi tiêu. Dữ liệu đã được giữ nguyên để bạn chỉnh sửa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            Quản Lý Chi Tiêu & Ngân Sách Nuôi Thú Cưng
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Theo dõi chi phí thực tế cho thức ăn, khám chữa bệnh, spa và đối soát ngân sách.
          </p>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {/* Lọc Thú Cưng */}
          <select
            value={selectedPetId}
            onChange={(e) => setSelectedPetId(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-xl outline-hidden shadow-xs"
          >
            <option value="all">Tất cả thú cưng</option>
            {pets.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.breed || 'Chưa cập nhật giống'})</option>
            ))}
          </select>

          {/* Lọc Tháng */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-xl outline-hidden shadow-xs"
          >
            <option value="all">Tất cả các tháng</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>Tháng {m.split('-')[1]}/{m.split('-')[0]}</option>
            ))}
          </select>

          {/* Lọc Danh Mục */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-xl outline-hidden shadow-xs"
          >
            <option value="all">Tất cả danh mục</option>
            {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Ghi Khoản Chi
          </button>
        </div>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">Tổng Chi Tiêu Thực Tế</span>
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

      {/* AI Financial Advice & Monthly Budget/Forecast Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Advice Box */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-950 text-white shadow-xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 flex items-center justify-center text-indigo-300 border border-indigo-400/20 shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-indigo-300">
                AI Đánh Giá Tài Chính & Tối Ưu Chi Phí
              </h3>
            </div>
            {filteredExpenses.length === 0 ? (
              <p className="text-xs text-indigo-100/90 leading-relaxed mb-3">
                Chưa có đủ dữ liệu chi tiêu trong kỳ đã chọn để đưa ra nhận xét cá nhân hóa. Vui lòng ghi lại các khoản chi thực tế của thú cưng.
              </p>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Monthly Budget Card */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Ngân Sách & Quản Trị Chi Phí
                </h3>
                <p className="text-[11px] text-slate-400">Thiết lập bởi người nuôi để kiểm soát chi tiêu</p>
              </div>
            </div>
            
            {monthlyBudget ? (
              <div className="text-right">
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 block">
                  {formatVND(monthlyBudget)}
                </span>
                <button
                  onClick={() => {
                    setBudgetInput(String(monthlyBudget));
                    setIsEditingBudget(true);
                  }}
                  className="text-[10px] text-slate-400 hover:text-indigo-600 underline cursor-pointer"
                >
                  Chỉnh sửa
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setBudgetInput('');
                  setIsEditingBudget(true);
                }}
                className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
              >
                + Đặt ngân sách
              </button>
            )}
          </div>

          {/* Modal / Form sửa ngân sách inline */}
          {isEditingBudget ? (
            <form onSubmit={handleSaveBudget} className="flex items-center gap-2 pt-2">
              <input
                type="number"
                placeholder="Ví dụ: 1500000"
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 cursor-pointer"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => setIsEditingBudget(false)}
                className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Hủy
              </button>
            </form>
          ) : (
            <div className="space-y-2 text-xs pt-1">
              {filteredExpenses.length === 0 ? (
                <div className="py-2 text-slate-400 text-center">
                  Chưa đủ dữ liệu chi tiêu thực tế để đưa ra dự báo hoặc so sánh ngân sách.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>Tổng chi tiêu trong kỳ lọc:</span>
                    <strong className="font-semibold text-slate-900 dark:text-white">{formatVND(analysis.totalSpent)}</strong>
                  </div>
                  {monthlyBudget && (
                    <>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            analysis.totalSpent > monthlyBudget ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.round((analysis.totalSpent / monthlyBudget) * 100))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className={analysis.totalSpent > monthlyBudget ? 'text-rose-600 font-bold' : 'text-emerald-600 font-semibold'}>
                          {analysis.totalSpent > monthlyBudget 
                            ? `Đã vượt ngân sách ${formatVND(analysis.totalSpent - monthlyBudget)}`
                            : `Còn lại ${formatVND(monthlyBudget - analysis.totalSpent)} trong ngân sách`}
                        </span>
                        <span className="text-slate-400">
                          {Math.round((analysis.totalSpent / monthlyBudget) * 100)}% đã dùng
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
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
                    Chưa có khoản chi nào phù hợp với bộ lọc. Bấm "Ghi Khoản Chi" để bắt đầu!
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const pet = pets.find(p => p.id === exp.petId);
                  const catConfig = EXPENSE_CATEGORIES[exp.category] || EXPENSE_CATEGORIES.other;
                  const displayPetName = exp.petName || pet?.name || 'Chi tiêu chung';

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {exp.title}
                        {exp.notes && <div className="text-[11px] text-slate-400 font-normal">{exp.notes}</div>}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
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
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#181926] text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-white/10 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Ghi Khoản Chi Tiêu Mới
            </h3>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Thú cưng:</label>
                <select
                  value={newExpense.petId}
                  onChange={(e) => setNewExpense({ ...newExpense, petId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden cursor-pointer"
                >
                  <option value="all" className="text-slate-900 dark:text-white dark:bg-slate-800">Tất cả / Chung cho cả nhà</option>
                  {pets.map(p => (
                    <option key={p.id} value={p.id} className="text-slate-900 dark:text-white dark:bg-slate-800">{p.name} ({p.breed})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Danh mục chi tiêu:</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-hidden cursor-pointer"
                >
                  {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                    <option key={k} value={k} className="text-slate-900 dark:text-white dark:bg-slate-800">{v.label}</option>
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-hidden focus:border-emerald-500 transition-all font-medium"
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
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-hidden focus:border-emerald-500 transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ngày chi:</label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark] outline-hidden focus:border-emerald-500 transition-all cursor-pointer font-medium"
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-hidden focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Khoản Chi'}
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
