import React, { useState } from 'react';
import { 
  Users, UserPlus, Shield, ShieldCheck, Stethoscope, 
  Trash2, QrCode, Clock, CheckCircle2, AlertTriangle, X, Sparkles
} from 'lucide-react';
import { sound } from '../../services/soundService';

export const FamilyGroupSettingsModal = ({
  isOpen,
  onClose,
  familyMembers = [],
  pets = [],
  onAddMember,
  onDeleteMember,
  onOpenPetSitterModal
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('member');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('Mẹ');

  if (!isOpen) return null;

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
    setShowAddForm(false);
    sound.playSuccess();
  };

  const getRoleBadge = (r) => {
    switch (r) {
      case 'admin':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
            <ShieldCheck className="w-3 h-3" /> Chủ sở hữu (Admin)
          </span>
        );
      case 'vet':
        return (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
            <Stethoscope className="w-3 h-3" /> Bác sĩ phụ trách
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
            <Shield className="w-3 h-3" /> Thành viên gia đình
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-[#0F172A] border border-white/20 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-slate-100 space-y-5 animate-in zoom-in-95 duration-150 relative my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center border border-cyan-400/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Cài Đặt Nhóm & Gia Đình Chăm Sóc</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-bold">
                  CO-PARENTING
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Phân quyền người thân, ủy quyền bảo mẫu Pet Sitter & kết nối bác sĩ gia đình
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap bg-white/5 p-3 rounded-2xl border border-white/10">
          <div className="text-xs font-semibold text-slate-300">
            Tổng cộng: <strong className="text-cyan-300 font-bold">{familyMembers.length}</strong> thành viên
          </div>

          <div className="flex items-center gap-2">
            {onOpenPetSitterModal && (
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  onOpenPetSitterModal();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Ủy quyền Pet Sitter</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowAddForm(!showAddForm);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/30 transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Đóng form' : '+ Mời thành viên'}</span>
            </button>
          </div>
        </div>

        {/* Form thêm thành viên */}
        {showAddForm && (
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-white/5 border border-cyan-400/30 space-y-3 animate-in fade-in duration-150">
            <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Thêm thành viên mới vào gia đình</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Họ và tên:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Nguyễn Văn A..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Số điện thoại:</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Quan hệ với thú cưng:</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white outline-none"
                >
                  <option value="Mẹ">Mẹ bé</option>
                  <option value="Bố">Bố bé</option>
                  <option value="Anh/Chị">Anh / Chị</option>
                  <option value="Bạn cùng phòng">Bạn cùng phòng</option>
                  <option value="Người trông giữ">Người trông giữ</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Vai trò quyền hạn:</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-white outline-none"
                >
                  <option value="member">Thành viên gia đình</option>
                  <option value="admin">Đồng sở hữu (Admin)</option>
                  <option value="vet">Bác sĩ phụ trách</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20"
              >
                Lưu thành viên
              </button>
            </div>
          </form>
        )}

        {/* Danh sách thành viên */}
        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center font-bold text-cyan-300 text-sm">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{member.name}</span>
                    <span className="text-xs text-slate-400">({member.relationship || 'Người thân'})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(member.role)}
                    <span className="text-[11px] text-slate-400 font-mono">{member.phone}</span>
                  </div>
                </div>
              </div>

              {member.role !== 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Xóa ${member.name} khỏi danh sách gia đình?`)) {
                      onDeleteMember(member.id);
                    }
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  title="Xóa thành viên"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default FamilyGroupSettingsModal;
