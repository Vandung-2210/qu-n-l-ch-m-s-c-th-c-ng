import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  FileText, 
  Plus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Eye, 
  Save, 
  X,
  Database,
  Info
} from 'lucide-react';
import { sound } from '../../services/soundService';

export const AdminAiDocsView = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [editFilename, setEditFilename] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('petcare_token');
      const res = await fetch('/api/admin/docs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setDocs(data.data);
      } else {
        throw new Error(data.error || 'Không thể tải danh sách tài liệu tri thức');
      }
    } catch (err) {
      console.error('Lỗi tải docs:', err);
      setError(err.message || 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleStartCreate = () => {
    sound?.playClick?.();
    setEditFilename('');
    setEditContent('# Tiêu đề tài liệu mới\n\nNội dung kiến thức chuẩn thú y để cung cấp cho Ollama AI...');
    setIsCreating(true);
    setIsEditing(true);
    setSelectedDoc(null);
  };

  const handleStartEdit = (doc) => {
    sound?.playClick?.();
    setEditFilename(doc.filename);
    setEditContent(doc.content);
    setIsCreating(false);
    setIsEditing(true);
    setSelectedDoc(doc);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editFilename.trim() || !editContent.trim()) {
      alert('Vui lòng nhập tên tệp và nội dung tài liệu.');
      return;
    }
    setSaveLoading(true);
    setStatusMessage(null);
    try {
      const token = localStorage.getItem('petcare_token');
      const res = await fetch('/api/admin/docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          filename: editFilename.trim(),
          content: editContent
        })
      });
      const data = await res.json();
      if (data.success) {
        sound?.playSuccess?.();
        setStatusMessage({ type: 'success', text: 'Đã lưu tài liệu tri thức thành công.' });
        setIsEditing(false);
        setIsCreating(false);
        fetchDocs();
      } else {
        throw new Error(data.error || 'Lỗi khi lưu tài liệu');
      }
    } catch (err) {
      sound?.playPop?.();
      setStatusMessage({ type: 'error', text: err.message || 'Không thể lưu tài liệu' });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (filename === 'README.md') {
      alert('Không thể xóa tệp README hệ thống.');
      return;
    }
    if (!window.confirm(`Xác nhận xóa tài liệu tri thức "${filename}"?\nAI sẽ không còn tham chiếu nội dung này khi trả lời người dùng.`)) {
      return;
    }
    try {
      const token = localStorage.getItem('petcare_token');
      const res = await fetch(`/api/admin/docs/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        sound?.playTrash?.();
        fetchDocs();
        if (selectedDoc?.filename === filename) setSelectedDoc(null);
      } else {
        throw new Error(data.error || 'Lỗi khi xóa tài liệu');
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi xóa tài liệu');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-white/10">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-indigo-500" />
            Quản Lý Tri Thức AI Cục Bộ (Ollama RAG)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Nạp tài liệu, phác đồ thú y và FAQ chính thống. Chatbot Ollama sẽ tự động truy xuất các tài liệu này để phản hồi người dùng kèm trích dẫn nguồn.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => { sound?.playClick?.(); fetchDocs(); }}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#1a1b2e] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleStartCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm tài liệu mới</span>
          </button>
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-500/10 border border-indigo-200/80 dark:border-indigo-500/20 text-xs text-indigo-900 dark:text-indigo-200">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Nguyên tắc tri thức chuẩn: </span>
          AI không được bịa đặt kiến thức y tế hoặc suy diễn dữ liệu. Mọi phản hồi phải dựa trên các tài liệu đã được nạp dưới đây. Nếu không tìm thấy thông tin phù hợp trong kho tài liệu, trợ lý AI sẽ thông báo rõ chưa có thông tin thay vì tự bịa câu trả lời.
        </div>
      </div>

      {statusMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid: Documents list & Viewer/Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: List of documents */}
        <div className="lg:col-span-1 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            Kho tài liệu ({docs.length})
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 bg-white dark:bg-[#151622] rounded-2xl border border-slate-200 dark:border-white/10">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500 mb-2" />
              <p className="text-xs">Đang tải tài liệu...</p>
            </div>
          ) : docs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-white dark:bg-[#151622] rounded-2xl border border-slate-200 dark:border-white/10">
              <Database className="w-6 h-6 mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-bold">Chưa có tài liệu nào</p>
              <p className="text-[11px] text-slate-400 mt-1">Bấm nút "Thêm tài liệu mới" để nạp tài liệu cho AI.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {docs.map(doc => {
                const isSelected = selectedDoc?.filename === doc.filename;
                return (
                  <div
                    key={doc.filename}
                    onClick={() => {
                      sound?.playClick?.();
                      setSelectedDoc(doc);
                      setIsEditing(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-500/15 border-indigo-400/80 shadow-sm'
                        : 'bg-white dark:bg-[#151622] border-slate-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className={`w-4 h-4 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {doc.title || doc.filename}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] text-slate-500">
                        {(doc.size / 1024).toFixed(1)} KB
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                      <span>{doc.filename}</span>
                      <span>v{doc.version || '1.0'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Preview or Editor */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <div className="bg-white dark:bg-[#151622] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {isCreating ? 'Soạn thảo tài liệu tri thức mới' : `Chỉnh sửa: ${editFilename}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Tên file (định dạng .md) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFilename}
                    onChange={(e) => setEditFilename(e.target.value)}
                    disabled={!isCreating}
                    placeholder="vi_du_cham_soc_cho_con.md"
                    className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 font-mono disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Nội dung tài liệu (Markdown) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={16}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="# Tiêu đề tài liệu..."
                    className="w-full p-3 rounded-xl text-xs sm:text-sm bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 font-mono resize-y"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saveLoading ? 'Đang lưu...' : 'Lưu tài liệu'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : selectedDoc ? (
            <div className="bg-white dark:bg-[#151622] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-white/10">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" />
                    {selectedDoc.title || selectedDoc.filename}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                    <span>{selectedDoc.filename}</span>
                    <span>•</span>
                    <span>{(selectedDoc.size / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span>Cập nhật: {new Date(selectedDoc.updatedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStartEdit(selectedDoc)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa</span>
                  </button>
                  {selectedDoc.filename !== 'README.md' && (
                    <button
                      onClick={() => handleDelete(selectedDoc.filename)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Content preview */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-200/80 dark:border-white/5 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-[500px] overflow-y-auto custom-scrollbar">
                {selectedDoc.content}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-white dark:bg-[#151622] rounded-2xl border border-slate-200 dark:border-white/10 text-center text-slate-400">
              <FileText className="w-10 h-10 mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Chọn một tài liệu để xem nội dung</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Bạn có thể xem trước, chỉnh sửa hoặc thêm tài liệu mới vào cơ sở tri thức cục bộ cho trợ lý ảo Ollama.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
