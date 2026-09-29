import React, { useState } from 'react';
import { 
  X, AlertTriangle, MapPin, Phone, DollarSign, 
  ShieldAlert, BellRing, Sparkles, Image, CheckCircle, Navigation 
} from 'lucide-react';
import { sound } from '../../services/soundService';

export default function LostModeManagerModal({ 
  isOpen, 
  onClose, 
  pet, 
  onSaveLostMode, 
  onOpenPosterModal 
}) {
  const [isLost, setIsLost] = useState(pet?.lostMode?.isLost || false);
  const [reward, setReward] = useState(pet?.lostMode?.reward || '5.000.000 VNĐ');
  const [emergencyPhone, setEmergencyPhone] = useState(pet?.lostMode?.emergencyPhone || '0912.345.678');
  const [lastSeenLocation, setLastSeenLocation] = useState(pet?.lostMode?.lastSeenLocation || 'Khu vực Công viên Cầu Giấy, Hà Nội');
  const [lostMessage, setLostMessage] = useState(
    pet?.lostMode?.lostMessage || 
    'Bé rất nhát người lạ và đang cần uống thuốc điều trị hàng ngày. Gia đình xin cảm tạ và hậu tạ chu đáo cho ai tìm được bé!'
  );

  if (!isOpen || !pet) return null;

  const handleToggleLostMode = () => {
    sound.playAlert();
    setIsLost(!isLost);
  };

  const handleSave = (e) => {
    e.preventDefault();
    sound.playSuccess();
    onSaveLostMode(pet.id, {
      isLost,
      reward,
      emergencyPhone,
      lastSeenLocation,
      lostMessage,
      updatedAt: new Date().toISOString()
    });
    onClose();
  };

  // Mock GPS Scan Alert Logs
  const scanLogs = [
    {
      id: 'sc-1',
      time: '10:15 Hôm nay',
      device: 'iPhone 15 Pro (Safari)',
      location: 'Gần 45 Trần Thái Tông, Cầu Giấy, Hà Nội',
      lat: 21.0315,
      lng: 105.7892,
      accuracy: 'Chính xác trong bán kính 15m'
    },
    {
      id: 'sc-2',
      time: '08:42 Hôm qua',
      device: 'Samsung Galaxy S24 (Chrome)',
      location: 'Cổng Công viên Cầu Giấy',
      lat: 21.0298,
      lng: 105.7915,
      accuracy: 'Chính xác trong bán kính 25m'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header with Lost Status Banner */}
        <div className={`p-6 border-b transition-colors ${
          isLost 
            ? 'bg-rose-600 text-white border-rose-700' 
            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isLost ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-600'
              }`}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-black ${isLost ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                  Chế độ Báo Mất (Lost Mode)
                </h3>
                <p className={`text-xs ${isLost ? 'text-rose-100' : 'text-slate-500 dark:text-slate-400'}`}>
                  Bé: <strong>{pet.name}</strong> • Microchip: #{pet.id}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-xl transition-colors ${
                isLost ? 'text-white/80 hover:bg-white/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* Big Toggle Switch */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Kích hoạt Cảnh Báo Thất Lạc
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Khi ai đó quét mã QR trên vòng cổ bé, màn hình khẩn cấp sẽ bật lên và gửi tọa độ GPS về điện thoại của bạn.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 ml-4">
              <input
                type="checkbox"
                checked={isLost}
                onChange={handleToggleLostMode}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          {/* Lost Details */}
          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-500" />
                  Số điện thoại khẩn cấp:
                </label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-amber-500" />
                  Tiền chuộc / Hậu tạ (Reward):
                </label>
                <input
                  type="text"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                  placeholder="VD: 5.000.000 đ"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none font-bold text-amber-600 dark:text-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                Vị trí nhìn thấy lần cuối:
              </label>
              <input
                type="text"
                value={lastSeenLocation}
                onChange={(e) => setLastSeenLocation(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lời nhắn gửi người đang giữ bé:
              </label>
              <textarea
                rows={2}
                value={lostMessage}
                onChange={(e) => setLostMessage(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Missing Poster Quick Generator CTA */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Trình tạo Poster Tìm Thú Lạc Tự Động</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Xuất ảnh khổ Story (9:16) đăng Facebook/TikTok & Khổ in A4 có QR code
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenPosterModal) onOpenPosterModal(pet);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex-shrink-0"
            >
              <Image className="w-3.5 h-3.5" />
              <span>Tạo poster</span>
            </button>
          </div>

          {/* GPS Scan Alert History */}
          {isLost && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5 text-rose-600">
                  <Navigation className="w-3.5 h-3.5 animate-pulse" />
                  Cảnh báo GPS quét vòng cổ gần đây ({scanLogs.length})
                </span>
                <span className="text-[10px] text-slate-400 font-normal">Tự động cập nhật</span>
              </div>

              <div className="space-y-2">
                {scanLogs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>{log.location}</span>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400">{log.time}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                      <span>Thiết bị: {log.device}</span>
                      <span className="text-emerald-600 font-medium">{log.accuracy}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all active:scale-95 ${
                isLost 
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/25' 
                  : 'bg-slate-900 dark:bg-slate-100 dark:text-slate-900'
              }`}
            >
              {isLost ? 'Cập nhật Chế độ Báo Mất' : 'Lưu cấu hình'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
