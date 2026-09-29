import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Key, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  Info,
  Sparkles
} from 'lucide-react';
import { 
  getSettings, 
  saveSettings, 
  exportAllData, 
  importAllData, 
  resetToDefaultData 
} from '../../services/storageService';

export const SettingsModal = ({
  isOpen,
  onClose,
  onDataChanged
}) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-1.5-flash');
  const [isSaved, setIsSaved] = useState(false);
  const [importStatus, setImportStatus] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const current = getSettings();
      setApiKey(current.geminiApiKey || '');
      setModel(current.selectedModel || 'gemini-1.5-flash');
      setIsSaved(false);
      setImportStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveSettings = (e) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (typeof window !== 'undefined') {
      localStorage.setItem('gemini_api_key', cleanKey);
    }
    saveSettings({
      geminiApiKey: cleanKey,
      selectedModel: model
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleExport = () => {
    const jsonString = exportAllData();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `petcare_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importAllData(content);
        if (res.success) {
          setImportStatus('Khôi phục dữ liệu thành công!');
          onDataChanged();
          setTimeout(() => {
            onClose();
          }, 1000);
        } else {
          setImportStatus('Lỗi: File dữ liệu không đúng định dạng!');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm('Bạn có chắc chắn muốn đặt lại toàn bộ dữ liệu mẫu ban đầu? Các dữ liệu tự tạo sẽ được khôi phục về mặc định.')) {
      resetToDefaultData();
      onDataChanged();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Cài Đặt Hệ Thống & AI</h2>
              <p className="text-xs text-slate-500">Cấu hình kết nối Google Gemini API và quản lý dữ liệu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          
          {/* Section 1: Gemini API Key */}
          <form onSubmit={handleSaveSettings} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Gemini API Key</span>
              </label>
              <input
                type="password"
                placeholder="Dán mã API Key của bạn (AIzaSy...)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-hidden text-sm"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                * Nếu để trống, hệ thống sẽ tự động sử dụng <strong>Bộ Não Thú Y Giả Lập Thông Minh (Smart Knowledge Base)</strong> sẵn có mà không cần Internet.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSaved ? 'Đã Lưu Thành Công!' : 'Lưu Cài Đặt AI'}</span>
            </button>
          </form>

          {/* Section 2: Backup & Restore */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Sao Lưu & Phục Hồi Dữ Liệu
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExport}
                className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 transition-all flex flex-col items-center gap-1 text-center"
              >
                <Download className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">Xuất Dữ Liệu (JSON)</span>
                <span className="text-[10px] text-slate-400">Tải về máy tính</span>
              </button>

              <label className="p-3 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 hover:text-emerald-800 transition-all flex flex-col items-center gap-1 text-center cursor-pointer">
                <Upload className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">Nhập Dữ Liệu (JSON)</span>
                <span className="text-[10px] text-slate-400">Chọn file khôi phục</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <p className="text-xs font-semibold text-emerald-700 text-center bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                {importStatus}
              </p>
            )}
          </div>

          {/* Section 3: Reset demo data */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-700">Khôi phục dữ liệu mẫu</div>
              <div className="text-[11px] text-slate-400">Xóa dữ liệu hiện tại và nạp lại thú cưng mẫu</div>
            </div>

            <button
              onClick={handleResetData}
              className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Khôi phục gốc
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
