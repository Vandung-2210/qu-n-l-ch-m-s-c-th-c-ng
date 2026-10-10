import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  PawPrint, 
  HelpCircle, 
  Check,
  Info,
  Calendar,
  UserX,
  FileQuestion,
  ShieldAlert
} from 'lucide-react';
import { auditOrphanedPets, cleanupDeletedOwnersPets } from '../../services/storageService';
import { sound } from '../../services/soundService';

export const OrphanedPetsCleanupModal = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [audit, setAudit] = useState(() => auditOrphanedPets());
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeTab, setActiveTab] = useState('deleted_owner'); // 'deleted_owner' | 'unclear' | 'active'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Cập nhật kết quả rà soát mỗi khi modal mở
  useEffect(() => {
    if (isOpen) {
      const res = auditOrphanedPets();
      setAudit(res);
      // Mặc định chọn tất cả hồ sơ thuộc tài khoản đã xóa
      setSelectedIds(res.confirmedDeletedOwnerPets.map(p => p.id));
      setFeedback(null);
      setIsSubmitting(false);
      // Nếu không có hồ sơ tài khoản đã xóa nhưng có hồ sơ thiếu ownerId, mở tab unclear
      if (res.confirmedDeletedOwnerPets.length === 0 && res.unclearOwnerPets.length > 0) {
        setActiveTab('unclear');
      } else {
        setActiveTab('deleted_owner');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { totalPets, confirmedDeletedOwnerPets, unclearOwnerPets, activeOwnerPets } = audit;

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === confirmedDeletedOwnerPets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(confirmedDeletedOwnerPets.map(p => p.id));
    }
  };

  const handleExecuteCleanup = async () => {
    if (selectedIds.length === 0) return;
    setIsSubmitting(true);
    setFeedback(null);

    try {
      sound?.playClick?.();
      const result = cleanupDeletedOwnersPets(selectedIds);
      
      // Cập nhật lại kiểm tra sau khi dọn
      const updatedAudit = auditOrphanedPets();
      setAudit(updatedAudit);
      setSelectedIds([]);
      setIsSubmitting(false);
      sound?.playSuccess?.();

      setFeedback({
        type: 'success',
        message: result.message || `Đã dọn sạch thành công ${result.count} hồ sơ thú cưng và các dữ liệu liên quan.`
      });

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      setIsSubmitting(false);
      sound?.playAlert?.();
      setFeedback({
        type: 'error',
        message: err.message || 'Đã xảy ra lỗi khi dọn dẹp dữ liệu.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#151622] rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-white/10 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Dọn Dữ Liệu Của Tài Khoản Đã Xóa</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Rà soát {totalPets} hồ sơ thú cưng, phân loại minh bạch và dọn dẹp an toàn theo chủ sở hữu
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thống kê 3 nhóm kiểm định */}
        <div className="grid grid-cols-3 gap-2.5 mb-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('deleted_owner')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'deleted_owner'
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-rose-500" />
                <span>Tài khoản đã xóa</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-rose-500/20 text-rose-600 dark:text-rose-300">
                {confirmedDeletedOwnerPets.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Xác định chắc chắn cần dọn
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('unclear')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'unclear'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/20'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <FileQuestion className="w-3.5 h-3.5 text-amber-500" />
                <span>Thiếu ownerId</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-300">
                {unclearOwnerPets.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Báo riêng, không đoán rồi xóa
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              activeTab === 'active'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Đang hoạt động</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-300">
                {activeOwnerPets.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Chủ nuôi còn tồn tại (Bảo vệ)
            </p>
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`p-3 rounded-2xl mb-3 text-xs flex items-center gap-2 shrink-0 ${
            feedback.type === 'success' 
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
            <span className="font-semibold">{feedback.message}</span>
          </div>
        )}

        {/* Nội dung danh sách theo Tab */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-3 min-h-[160px]">

          {/* TAB 1: HỒ SƠ THUỘC TÀI KHOẢN ĐÃ XÓA */}
          {activeTab === 'deleted_owner' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Xác nhận dọn dẹp các hồ sơ thuộc tài khoản đã xóa:</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Khi xác nhận, hệ thống sẽ xóa sạch hồ sơ thú cưng được chọn cùng mọi lịch chăm sóc, nhật ký, chi tiêu, đơn thuốc, thói quen và dữ liệu thất lạc liên quan.
                </p>
              </div>

              {confirmedDeletedOwnerPets.length > 0 ? (
                <>
                  <div className="flex items-center justify-between px-1 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === confirmedDeletedOwnerPets.length && confirmedDeletedOwnerPets.length > 0}
                        onChange={handleToggleSelectAll}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 rounded-md cursor-pointer"
                      />
                      <span>Chọn tất cả ({selectedIds.length}/{confirmedDeletedOwnerPets.length} hồ sơ)</span>
                    </label>
                  </div>

                  <div className="space-y-2">
                    {confirmedDeletedOwnerPets.map((pet) => {
                      const isSelected = selectedIds.includes(pet.id);
                      return (
                        <div 
                          key={pet.id}
                          onClick={() => handleToggleSelect(pet.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected 
                              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-400/50' 
                              : 'bg-slate-50/50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/[0.06] hover:bg-slate-100/50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input 
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent onClick
                              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                            />
                            <img 
                              src={pet.avatar || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=120"} 
                              alt="" 
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                  {pet.name}
                                </h4>
                                {pet.isSample && (
                                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    Dữ liệu mẫu (Mock)
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">
                                {pet.breed || pet.species || 'Chưa rõ loài'} • ID: <span className="font-mono">{pet.id}</span>
                              </p>
                              <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                                {pet.auditReason} (ownerId: <span className="font-mono">{pet.ownerId || 'N/A'}</span>)
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">Không có hồ sơ nào của tài khoản đã xóa</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Toàn bộ dữ liệu hồ sơ thú cưng hiện tại đều thuộc tài khoản hợp lệ.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HỒ SƠ THIẾU / KHÔNG RÕ OWNERID */}
          {activeTab === 'unclear' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-700 dark:text-amber-300 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Báo cáo kiểm định hồ sơ thiếu hoặc không rõ ownerId:</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Nguyên tắc bảo vệ an toàn: Hệ thống <strong>tuyệt đối không tự đoán chủ sở hữu</strong> và <strong>không tự động xóa</strong> các hồ sơ này. Quản trị viên cần xem xét nguồn gốc để gán chủ sở hữu hợp lệ hoặc xử lý thủ công.
                </p>
              </div>

              {unclearOwnerPets.length > 0 ? (
                <div className="space-y-2">
                  {unclearOwnerPets.map((pet) => (
                    <div 
                      key={pet.id}
                      className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-amber-400/30 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={pet.avatar || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=120"} 
                          alt="" 
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {pet.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {pet.breed || pet.species || 'Chưa rõ loài'} • ID: <span className="font-mono">{pet.id}</span>
                          </p>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                            {pet.auditReason}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                        Chờ rà soát
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">Không có hồ sơ nào bị thiếu ownerId</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Mọi hồ sơ đều có mã chủ sở hữu rõ ràng và minh bạch.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: HỒ SƠ TÀI KHOẢN ĐANG HOẠT ĐỘNG (ĐƯỢC BẢO VỆ) */}
          {activeTab === 'active' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-700 dark:text-emerald-300 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Hồ sơ thuộc chủ nuôi đang hoạt động (Được bảo vệ an toàn):</span>
                </p>
                <p className="text-[11px] leading-relaxed">
                  Các hồ sơ này thuộc về tài khoản người dùng đang tồn tại trong hệ thống. Thao tác dọn dẹp sẽ <strong>tuyệt đối không chạm đến</strong> các hồ sơ này.
                </p>
              </div>

              {activeOwnerPets.length > 0 ? (
                <div className="space-y-2">
                  {activeOwnerPets.map((pet) => (
                    <div 
                      key={pet.id}
                      className="p-3 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-emerald-500/20 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={pet.avatar || "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=120"} 
                          alt="" 
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {pet.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">
                            {pet.breed || pet.species || 'Chưa rõ loài'} • ID: <span className="font-mono">{pet.id}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            Chủ sở hữu ID: <span className="font-mono text-emerald-600 dark:text-emerald-400">{pet.ownerId}</span>
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Bảo vệ</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Info className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-80" />
                  <p className="font-bold text-slate-700 dark:text-slate-300">Hiện chưa có hồ sơ nào thuộc chủ nuôi đang hoạt động</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Khi admin tạo tài khoản chủ nuôi mới và thêm thú cưng, hồ sơ sẽ hiển thị ở đây.</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 mt-3">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {confirmedDeletedOwnerPets.length > 0 ? (
              <span>Đã chọn <strong className="text-rose-600 dark:text-rose-400">{selectedIds.length}</strong> / {confirmedDeletedOwnerPets.length} hồ sơ của tài khoản đã xóa</span>
            ) : (
              <span>Không còn hồ sơ tồn đọng nào cần dọn dẹp</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
            >
              Đóng
            </button>

            {confirmedDeletedOwnerPets.length > 0 && (
              <button
                type="button"
                disabled={isSubmitting || selectedIds.length === 0}
                onClick={handleExecuteCleanup}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md shadow-rose-500/25 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang dọn dẹp...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Dọn dẹp ({selectedIds.length} hồ sơ)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrphanedPetsCleanupModal;
