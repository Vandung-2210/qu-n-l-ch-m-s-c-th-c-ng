import React, { useState } from 'react';
import { 
  Users, UserPlus, Shield, ShieldCheck, Stethoscope, 
  Trash2, QrCode, Clock, CheckCircle2, History, AlertTriangle, Key 
} from 'lucide-react';
import { sound } from '../../services/soundService';

export default function FamilyManagementView({ 
  familyMembers = [], 
  habits = [], 
  pets = [], 
  appointments = [],
  onAddMember, 
  onDeleteMember, 
  onOpenPetSitterModal 
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Mẹ');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddMember({
      name: name.trim(),
      role,
      phone: phone.trim() || 'Chưa cập nhật',
      relationship
    });
    setName('');
    setPhone('');
    setShowAddModal(false);
    sound.playSuccess();
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <ShieldCheck className="w-3 h-3" /> Chủ sở hữu (Admin)
          </span>
        );
      case 'vet':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <Stethoscope className="w-3 h-3" /> Bác sĩ phụ trách
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <Shield className="w-3 h-3" /> Thành viên gia đình
          </span>
        );
    }
  };

  // Recent Completed Habits as Audit Log
  const auditLogs = habits.filter(h => h.completed).slice(0, 8);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200 mb-3 border border-white/10">
            <Users className="w-3.5 h-3.5" />
            <span>Co-parenting & Family Sync</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Gia đình cùng chăm sóc thú cưng
          </h1>
          <p className="text-sm text-indigo-200 mt-2 leading-relaxed">
            Phân quyền cho Bố, Mẹ, Con và Bác sĩ thú y. Theo dõi lịch sử ai đã cho bé ăn, uống thuốc để không bao giờ bị cho ăn thừa hoặc quên cữ.
          </p>
          
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-indigo-900 hover:bg-indigo-50 font-bold text-xs shadow-lg transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm thành viên</span>
            </button>

            <button
              onClick={onOpenPetSitterModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-700/80 hover:bg-indigo-600 text-white font-semibold text-xs border border-indigo-400/30 transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4 text-indigo-300" />
              <span>Chế độ Bàn giao (Pet Sitter)</span>
            </button>
          </div>
        </div>

        {/* Decorative background paw */}
        <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
          <Users className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Main Grid: Family Members & Real-time Care Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Family Members List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Danh sách người chăm sóc ({familyMembers.length})</span>
            </h2>
            <span className="text-xs text-slate-500">Mã gia đình: <strong>FAM-9921-PET</strong></span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {familyMembers.map(member => (
              <div 
                key={member.id}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-sm shadow-inner">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {member.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {member.relationship} • {member.phone}
                        </div>
                      </div>
                    </div>

                    {member.role !== 'admin' && (
                      <button
                        onClick={() => onDeleteMember(member.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                        title="Xóa thành viên"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    {getRoleBadge(member.role)}
                    <span className="text-[11px] text-slate-400">
                      {member.role === 'admin' ? 'Toàn quyền sửa/xóa' : 'Đánh dấu lịch & xem'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Anti-Overfeeding Audit Log */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Audit Log Chăm sóc hôm nay
              </h3>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Chống cho ăn thừa
            </span>
          </div>

          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                Chưa có việc nào được hoàn thành hôm nay. Hãy tích vào Daily Checklist!
              </div>
            ) : (
              auditLogs.map(log => {
                const member = familyMembers.find(m => m.id === log.completedBy);
                const pet = pets.find(p => p.id === log.petId);
                return (
                  <div 
                    key={log.id} 
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.title}
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.completedAt || 'Vừa xong'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Bé: <strong className="text-indigo-600 dark:text-indigo-400">{pet?.name || 'Milo'}</strong></span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        Bởi: {member?.name || 'Người nhà'} ({member?.relationship || 'Thành viên'})
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <span>Mỗi khi ai hoàn thành cữ ăn hoặc uống thuốc, các thành viên khác sẽ thấy ngay lập tức để không lặp lại.</span>
          </div>

          {/* Vet Appointment Audit Stream */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-cyan-500" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Nhật ký Lịch khám thú y ({appointments.length})
                </h4>
              </div>
              <span className="text-[10px] text-slate-400">Đồng bộ 2 chiều</span>
            </div>

            {appointments.length === 0 ? (
              <p className="text-center py-4 text-[11px] text-slate-400">Chưa có lịch khám nào được đặt.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {appointments.slice(0, 5).map(apt => (
                  <div 
                    key={apt.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                        {apt.petName} ({apt.service})
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        apt.status === 'Chờ duyệt' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                        apt.status === 'Đã duyệt' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        apt.status === 'Đang khám' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{apt.facility} • {apt.time} {apt.date}</span>
                      <span className="text-slate-400 font-mono text-[10px]">bởi {apt.ownerName}</span>
                    </div>
                    {apt.assignedDoctor && (
                      <div className="text-[10px] text-cyan-500 flex items-center gap-1 mt-0.5">
                        <span>👨‍⚕️ BS phụ trách: <strong>{apt.assignedDoctor}</strong></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Thêm Người Chăm Sóc / Bác Sĩ
            </h3>
            
            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nguyễn Văn Nam"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vai trò:
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="member">Thành viên gia đình</option>
                    <option value="vet">Bác sĩ Thú y phụ trách</option>
                    <option value="admin">Quản trị viên gia đình</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mối quan hệ:
                  </label>
                  <input
                    type="text"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    placeholder="VD: Bố, Mẹ, Con trai..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Số điện thoại nhận thông báo:
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
                >
                  Lưu thành viên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
