import React, { useState } from 'react';
import { 
  X, QrCode, Download, Share2, Shield, Heart, 
  Phone, MapPin, AlertCircle, Copy, Check, Sparkles 
} from 'lucide-react';
import { sound } from '../../services/soundService';

export default function PublicPetQrModal({ isOpen, onClose, pet }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !pet) return null;

  const publicUrl = `https://petcare.ai/id/${pet.id || 'p1'}?tag=collar_smart_nfc`;

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    sound.playSuccess();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Thẻ Căn Cước Số (Digital Pet ID)
              </h3>
              <p className="text-[11px] text-slate-500">Mã QR in lên vòng cổ hoặc thẻ bài kim loại</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center space-y-4">
          {/* Pet Avatar & Name */}
          <div className="relative inline-block">
            <img
              src={pet.avatar || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150'}
              alt={pet.name}
              className="w-20 h-20 rounded-3xl object-cover mx-auto border-2 border-indigo-500/30 shadow-md"
            />
            {pet.lostMode?.isLost && (
              <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider animate-bounce shadow-lg">
                Đang Thất Lạc
              </span>
            )}
          </div>

          <div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white">{pet.name}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pet.species === 'dog' ? 'Chó' : 'Mèo'} • {pet.breed} • Microchip: #{pet.id?.toUpperCase()}
            </p>
          </div>

          {/* QR Code Container */}
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 inline-block shadow-inner">
            {/* Mock QR SVG representation */}
            <div className="w-44 h-44 mx-auto bg-white p-2 rounded-2xl shadow-sm flex flex-col items-center justify-center border border-slate-100">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(publicUrl)}`}
                alt={`QR Code for ${pet.name}`}
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2.5">
              Quét bằng Camera điện thoại hoặc Zalo
            </p>
          </div>

          {/* Public Link Copy */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 bg-transparent border-none text-slate-600 dark:text-slate-300 text-[11px] focus:outline-none px-1 truncate"
            />
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
            </button>
          </div>

          {/* Safety Notice */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 pt-1">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Người nhặt được có thể gọi điện trực tiếp hoặc gửi vị trí GPS cho bạn.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">ID Vòng cổ thông minh</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
