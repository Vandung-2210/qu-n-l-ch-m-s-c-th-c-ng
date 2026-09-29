import React, { useState } from 'react';
import { 
  X, Camera, Upload, Sparkles, CheckCircle, FileText, 
  Calendar, DollarSign, Pill, ArrowRight, AlertCircle, RefreshCw 
} from 'lucide-react';
import { sound } from '../../services/soundService';

export default function AiMedicalOcrModal({ 
  isOpen = true, 
  isModal = true, 
  onClose, 
  pets = [], 
  onOcrComplete 
}) {
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || 'p1');
  const [ocrType, setOcrType] = useState('vaccine_book'); // 'vaccine_book', 'prescription_invoice'
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [isApplied, setIsApplied] = useState(false);

  if (isModal && !isOpen) return null;

  const mockVaccineResult = {
    detectedType: 'Sổ tiêm chủng thú cưng (Vaccination Record)',
    confidence: 98.4,
    vaccineName: 'Vanguard Plus 5/CV-L (Vắc-xin 7 bệnh cho Chó)',
    manufacturer: 'Zoetis USA',
    batchNumber: 'ZTS-88492-B',
    injectedDate: '2026-09-20',
    nextDueDate: '2027-09-20',
    vetClinic: 'Bệnh viện Thú Y 24/7 PetCare',
    vetDoctor: 'BS. Nguyễn Văn Hùng',
    cost: 350000,
    extractedItems: [
      { type: 'vaccine', name: 'Mũi 7 bệnh nhắc lại hàng năm', dueDate: '2027-09-20' },
      { type: 'expense', name: 'Tiêm phòng Vanguard 7 bệnh', amount: 350000, category: 'medical' },
      { type: 'medical_record', diagnosis: 'Tiêm chủng định kỳ năm 2026', notes: 'Bé khỏe mạnh, thân nhiệt 38.5C bình thường' }
    ]
  };

  const mockPrescriptionResult = {
    detectedType: 'Đơn thuốc & Hóa đơn khám chữa bệnh (Prescription & Invoice)',
    confidence: 96.8,
    vetClinic: 'Phòng khám Thú y Alpha Pet',
    vetDoctor: 'ThS. Trần Thị Mai',
    treatmentDate: '2026-09-20',
    diagnosis: 'Viêm tai ngoài do nấm Malassezia',
    followUpDate: '2026-09-27',
    cost: 480000,
    medicines: [
      { name: 'Otomax Ear Drops', dosage: 'Nhỏ tai 4 giọt/lần x 2 lần/ngày trong 7 ngày' },
      { name: 'Ketoconazole 200mg', dosage: 'Uống 1/2 viên sau ăn sáng x 5 ngày' }
    ],
    extractedItems: [
      { type: 'schedule', name: 'Tái khám kiểm tra tai sau 7 ngày', date: '2026-09-27', time: '10:00' },
      { type: 'expense', name: 'Khám tai & thuốc Otomax điều trị', amount: 480000, category: 'medical' },
      { type: 'medical_record', diagnosis: 'Viêm tai ngoài do nấm', doctor: 'ThS. Trần Thị Mai' }
    ]
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
        sound.playClick();
        triggerOcrScan();
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerOcrScan = () => {
    setIsProcessing(true);
    setOcrResult(null);
    setIsApplied(false);

    // Simulate AI Vision analysis latency
    setTimeout(() => {
      setIsProcessing(false);
      sound.playSuccess();
      if (ocrType === 'vaccine_book') {
        setOcrResult(mockVaccineResult);
      } else {
        setOcrResult(mockPrescriptionResult);
      }
    }, 1800);
  };

  const handleApplyTo3Pipelines = () => {
    if (!ocrResult) return;
    sound.playSuccess();
    setIsApplied(true);

    if (onOcrComplete) {
      onOcrComplete(ocrResult, selectedPetId);
    }
  };

  const content = (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full shadow-xl overflow-hidden ${
      isModal ? 'max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200' : 'animate-in fade-in duration-200'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Medical Vision OCR Scanner
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                AI 3-in-1 Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Quét ảnh sổ tiêm / hóa đơn thuốc ➔ Tự động lưu Lịch hẹn + Sổ Y bạ + Chi tiêu
            </p>
          </div>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className={`p-6 space-y-5 ${isModal ? 'max-h-[80vh] overflow-y-auto' : ''}`}>
        
        {/* Pet & Document Type Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Chọn Thú cưng áp dụng:
            </label>
            <select
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              {pets.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.species === 'dog' ? 'Chó' : 'Mèo'} - {p.breed})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Loại tài liệu y tế:
            </label>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
              <button
                type="button"
                onClick={() => { setOcrType('vaccine_book'); setOcrResult(null); }}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all ${
                  ocrType === 'vaccine_book'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                💉 Sổ tiêm chủng
              </button>
              <button
                type="button"
                onClick={() => { setOcrType('prescription_invoice'); setOcrResult(null); }}
                className={`py-1.5 px-2 rounded-lg font-medium transition-all ${
                  ocrType === 'prescription_invoice'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🧾 Đơn thuốc/Hóa đơn
              </button>
            </div>
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-6 text-center transition-all bg-slate-50/50 dark:bg-slate-800/30">
          {imagePreview ? (
            <div className="space-y-3">
              <div className="relative inline-block rounded-xl overflow-hidden shadow-md max-h-56 border border-slate-200 dark:border-slate-700">
                <img src={imagePreview} alt="Medical Document" className="max-h-56 object-cover mx-auto" />
                {isProcessing && (
                  <div className="absolute inset-0 bg-indigo-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-400 mb-2" />
                    <span className="text-xs font-semibold">Gemini Flash Medical OCR đang trích xuất dữ liệu...</span>
                    <span className="text-[10px] text-slate-300 mt-1">Nhận diện thuốc, vắc-xin, ngày tái khám, chi phí</span>
                  </div>
                )}
              </div>
              <div>
                <label className="cursor-pointer text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Chọn ảnh khác hoặc chụp lại</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Tải lên ảnh chụp sổ tiêm hoặc hóa đơn thú y
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Hỗ trợ định dạng JPG, PNG. AI sẽ tự động đọc tem nhãn thuốc và lịch tái khám.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <label className="cursor-pointer px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 active:scale-95 transition-all">
                  <span>Chọn ảnh từ thiết bị</span>
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview('https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?w=600&auto=format&fit=crop&q=80');
                    triggerOcrScan();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  ⚡ Thử mẫu sổ tiêm chủng
                </button>
              </div>
            </div>
          )}
        </div>

        {/* OCR Extracted Results Preview */}
        {ocrResult && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Kết quả nhận diện tự động ({ocrResult.confidence}% độ chính xác)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {ocrResult.detectedType}
              </span>
            </div>

            {/* 3 Pipeline Cards Showcase */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. Schedule */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-200 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>1. Lịch hẹn tự sinh</span>
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {ocrResult.vaccineName || ocrResult.diagnosis}
                </div>
                <div className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-semibold">
                  Hạn: {ocrResult.nextDueDate || ocrResult.followUpDate}
                </div>
              </div>

              {/* 2. Medical Record / Prescription */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-200 mb-2">
                  <Pill className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>2. Sổ Y bạ / Thuốc</span>
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {ocrResult.vetClinic}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Bác sĩ: {ocrResult.vetDoctor}
                </div>
              </div>

              {/* 3. Expense */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-200 mb-2">
                  <DollarSign className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>3. Chi phí khám</span>
                </div>
                <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  {Number(ocrResult.cost).toLocaleString('vi-VN')} đ
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Danh mục: Y tế / Thuốc
                </div>
              </div>
            </div>

            {/* Feedback Alert */}
            {isApplied ? (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Đã đẩy dữ liệu thành công vào: Lịch hẹn, Sổ y bạ và Chi phí!
                </span>
                {isModal && onClose && (
                  <button onClick={onClose} className="underline text-[11px]">Đóng modal</button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleApplyTo3Pipelines}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Xác nhận & Tự động lưu 3-trong-1 (Lịch + Y bạ + Chi tiêu)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between text-xs text-slate-500">
        <span>Hỗ trợ nhận diện tiếng Việt & tiếng Anh</span>
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
          >
            Đóng
          </button>
        )}
      </div>

    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        {content}
      </div>
    );
  }

  return content;
}
