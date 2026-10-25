import React, { useState, useEffect } from 'react';
import { 
  Scan, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Camera, 
  RefreshCw, 
  AlertTriangle, 
  Crosshair, 
  Check, 
  Stethoscope, 
  Activity, 
  Bandage, 
  Microscope, 
  Info,
  ShieldCheck,
  Cpu,
  AlertCircle,
  FileText
} from 'lucide-react';
import { sound } from '../../services/soundService';

// =========================================================================
// 1. TỪ ĐIỂN THAM KHẢO BỆNH LÝ THÚ CƯNG THƯỜNG GẶP (VETERINARY PATHOLOGY REFERENCE)
// Tài liệu tra cứu bệnh học đối chiếu dành cho chủ nuôi (Không dùng làm chẩn đoán giả lập)
// =========================================================================
export const PET_PATHOLOGY_DATASET = {
  // 1. Viêm da dị ứng bọ chét (FAD): Vùng da ửng đỏ, rụng lông, mẩn ngứa
  fad: {
    id: 'fad',
    name: 'Viêm da dị ứng bọ chét / ve rận (Flea Allergy Dermatitis - FAD)',
    category: 'Ngoại ký sinh trùng',
    riskLevel: 'Trung bình',
    riskColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    image: '/images/pathology/macro_fad_lesion.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80',
    boxCoordinates: { top: '28%', left: '26%', width: '48%', height: '42%' },
    symptoms: [
      'Mẩn đỏ li ti dạng hạt cườm, tập trung dày ở vùng sống lưng và háng bẹn.',
      'Da sậm màu, dày sừng do cọ xát cắn gãi liên tục.',
      'Dấu hiệu hạt phân bọ chét đen nhỏ bám sát chân lông.'
    ],
    firstAid: [
      'Nhỏ thuốc trị ký sinh trùng đặc trị theo hướng dẫn của bác sĩ thú y.',
      'Đeo loa Elizabeth chống cắn rách da nhiễm trùng huyết.',
      'Vệ sinh nhẹ nhàng bằng nước muối sinh lý ấm, không bôi thuốc mỡ người.'
    ],
    clinicalAdvice: 'Cần đưa đến phòng khám cạo tế bào biểu bì và kiểm tra phân bọ chét dưới kính hiển vi.'
  },

  // 2. Nấm tròn Ringworm: Tổn thương hình tròn đồng xu, viền gờ đỏ bong vảy
  ringworm: {
    id: 'ringworm',
    name: 'Nấm da tròn đồng xu (Ringworm / Dermatophytosis)',
    category: 'Nhiễm vi nấm biểu bì',
    riskLevel: 'Trung bình',
    riskColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    image: '/images/pathology/macro_ringworm_lesion.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=900&q=80',
    boxCoordinates: { top: '30%', left: '32%', width: '38%', height: '38%' },
    symptoms: [
      'Vùng rụng lông tròn trịa viền đỏ nổi gờ như đồng xu (Microsporum canis).',
      'Bề mặt da phủ vảy trắng xám như gàu, sợi lông khô giòn gãy sát chân.',
      'CẢNH BÁO: Bệnh có khả năng lây lan trực tiếp sang người (Zoonosis).'
    ],
    firstAid: [
      'Cách ly thú cưng riêng biệt, khử trùng ổ nằm bằng Cloramin B.',
      'Đeo găng tay y tế khi vệ sinh bôi thuốc cho bé.',
      'Bôi kem kháng nấm đặc trị theo chỉ định chuyên khoa.'
    ],
    clinicalAdvice: 'Cần soi đèn Wood (Wood’s Lamp) phát quang và cấy nấm DTM để định danh chủng vi nấm.'
  },

  // 3. Xà mâu Demodex & Men kẽ chân: Viêm đỏ sưng múp kẽ ngón, rụng lông quanh mắt
  demodex: {
    id: 'demodex',
    name: 'Xà mâu Demodex & Viêm nấm men Malassezia kẽ ngón',
    category: 'Ký sinh trùng bao lông & Nấm men',
    riskLevel: 'Khẩn cấp',
    riskColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    image: '/images/pathology/macro_demodex_lesion.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=900&q=80',
    boxCoordinates: { top: '35%', left: '30%', width: '44%', height: '40%' },
    symptoms: [
      'Kẽ móng và đệm bàn chân sưng đỏ, nhờn rít, rỉ dịch mủ mùi chua nồng.',
      'Rụng lông quầng mắt (kính râm Demodex) và khóe mép sưng tấy.',
      'Bé liên tục gặm chân, liếm móng và đi khập khiễng do đau buốt.'
    ],
    firstAid: [
      'Ngâm rửa bàn chân bằng dung dịch Chlorhexidine 2% pha loãng.',
      'Sấy khô tuyệt đối kẽ móng sau khi rửa (men nấm kỵ khô ráo).',
      'Không dùng xà phòng giữ ẩm vì kích thích men Malassezia sinh sôi.'
    ],
    clinicalAdvice: 'Cần cạo sâu tới chân lông (Deep Scraping) đến khi rớm máu để đếm mật độ ký sinh trùng Demodex.'
  },

  // 4. Viêm da mủ Pyoderma: Vết loét trợt da, bóng nước và mụn mủ vàng
  pyoderma: {
    id: 'pyoderma',
    name: 'Viêm da mủ sâu & Viêm loét vi khuẩn (Pyoderma)',
    category: 'Nhiễm khuẩn tụ cầu da (Staphylococcus)',
    riskLevel: 'Khẩn cấp',
    riskColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    image: '/images/pathology/macro_pyoderma_lesion.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=900&q=80',
    boxCoordinates: { top: '22%', left: '25%', width: '52%', height: '50%' },
    symptoms: [
      'Nổi nhiều bọc mụn mủ nhỏ (Pustules), vảy tiết đóng thành mảng màu mật ong.',
      'Vùng da trợt loét, sưng phù, chảy dịch huyết thanh và đau đớn khi chạm.',
      'Rụng lông nham nhở quanh vùng viêm nhiễm.'
    ],
    firstAid: [
      'Tuyệt đối không bóp hoặc nặn các nốt mụn mủ tránh vỡ sâu vào mô tế bào.',
      'Chấm rửa nhẹ nhàng bằng cồn đỏ Povidine Iodine 10%.',
      'Đeo vòng cổ chống liếm liên tục 24/24.'
    ],
    clinicalAdvice: 'Cần nuôi cấy vi khuẩn làm kháng sinh đồ và điều trị kháng sinh toàn thân tối thiểu 3-4 tuần.'
  }
};

// 4 Ca bệnh mẫu tham khảo tra cứu
export const SAMPLE_PATHOLOGY_CASES = [
  {
    id: 'fad',
    shortName: 'Dị ứng bọ chét (FAD)',
    badge: 'Ngoại ký sinh trùng',
    color: 'rose',
    summary: 'Mẩn đỏ li ti, rụng lông sống lưng & gốc đuôi'
  },
  {
    id: 'ringworm',
    shortName: 'Nấm tròn Ringworm',
    badge: 'Vi nấm biểu bì',
    color: 'amber',
    summary: 'Rụng lông hình đồng xu, bong vảy sừng hóa'
  },
  {
    id: 'demodex',
    shortName: 'Xà mâu Demodex & Men',
    badge: 'Ký sinh trùng nang lông',
    color: 'orange',
    summary: 'Sưng đỏ kẽ móng, rụng lông quanh khóe mắt'
  },
  {
    id: 'pyoderma',
    shortName: 'Viêm da mủ Pyoderma',
    badge: 'Nhiễm trùng vi khuẩn',
    color: 'red',
    summary: 'Mụn mủ li ti, trợt loét đóng vảy vàng rơm'
  }
];

export const AiVisionScannerView = ({
  pets = [],
  currentUser = null,
  onOpenAddSchedule,
  onOpenVetBooking
}) => {
  // Trạng thái ảnh và phân tích
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeCaseKey, setActiveCaseKey] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null); // Đã khai báo đầy đủ, tránh lỗi ReferenceError
  const [boxCoords, setBoxCoords] = useState(null);
  const [imageBase64Info, setImageBase64Info] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState(() => pets?.[0]?.id || '');
  const [modelStatus, setModelStatus] = useState(null);
  const [userSymptomsNote, setUserSymptomsNote] = useState('');

  // Tự động kiểm tra trạng thái mô hình AI cục bộ khi vào giao diện
  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/ai/vision-status');
        if (res.ok) {
          const data = await res.json();
          if (active) setModelStatus(data);
        }
      } catch (err) {
        console.warn('[AI Vision] Không thể kết nối endpoint kiểm tra mô hình AI cục bộ:', err);
      }
    };
    fetchStatus();
    return () => { active = false; };
  }, []);

  // Cập nhật selectedPetId nếu danh sách pets thay đổi
  useEffect(() => {
    if (pets?.length > 0 && !selectedPetId) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  // Nén ảnh trên Client để tối ưu kích thước tải lên
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.src = objUrl;
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let { width, height } = img;
        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        resolve(base64Data);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result?.split(',')?.[1] || '');
        };
        reader.readAsDataURL(file);
      };
    });
  };

  // 1. Tải ảnh từ máy tính của người dùng
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try { sound?.playPop?.(); } catch (_) {}
    setActiveCaseKey(null);
    setHasScanned(false);
    setScanResult(null);
    setScanError(null);

    const previewUrl = URL.createObjectURL(file);
    setSelectedImage(previewUrl);
    setBoxCoords({ top: '25%', left: '25%', width: '50%', height: '50%' });

    const base64Data = await compressImage(file);
    setImageBase64Info({ data: base64Data, mimeType: file.type || 'image/jpeg' });
  };

  // 2. Xem tư liệu bệnh học tham khảo (Tra cứu giáo dục, không tạo chẩn đoán giả)
  const handleSelectCase = (caseId) => {
    const caseData = PET_PATHOLOGY_DATASET[caseId];
    if (!caseData) return;

    try { sound?.playClick?.(); } catch (_) {}
    setActiveCaseKey(caseId);
    setSelectedImage(caseData.image);
    setBoxCoords(caseData.boxCoordinates);
    setHasScanned(false);
    setScanResult(null);
    setScanError(null);
  };

  // 3. Yêu cầu phân tích ảnh: Gửi tới mô hình AI cục bộ và kiểm tra thực tế
  const triggerScan = async () => {
    if (isScanning || !selectedImage) return;

    try { sound?.playPop?.(); } catch (_) {}
    setIsScanning(true);
    setScanResult(null);
    setScanError(null);

    try {
      const token = localStorage.getItem('petcare_token') || localStorage.getItem('petcare_auth_token');

      // Gửi Network request tới backend API cục bộ
      const response = await fetch('/api/ai/vision-analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`
        },
        body: JSON.stringify({
          petId: selectedPetId,
          imageBase64: imageBase64Info?.data || '',
          mimeType: imageBase64Info?.mimeType || 'image/jpeg'
        })
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        // Xử lý lỗi và thông báo rõ ràng, không im lặng, không giả mạo kết quả
        const errorMsg = data?.error || 'Mô hình AI cục bộ không khả dụng để phân tích ảnh.';
        setScanError(errorMsg);
        setHasScanned(true);
        setScanResult({
          isAvailable: false,
          code: data?.code || 'AI_UNAVAILABLE',
          model: data?.configuredModel || modelStatus?.configuredModel || 'qwen3:1.7b',
          isRunning: Boolean(data?.isRunning),
          supportsVision: Boolean(data?.supportsVision),
          errorDescription: errorMsg,
          clinicalAdvice: 'Mô hình AI cục bộ hiện tại chưa chạy hoặc đang cấu hình mô hình văn bản (qwen3:1.7b) không hỗ trợ thị giác. Để đảm bảo an toàn y khoa tuyệt đối, hệ thống không tạo kết quả chẩn đoán giả lập hoặc dùng dữ liệu mẫu. Vui lòng đặt lịch khám để Bác sĩ Thú y cạo tươi biểu bì và soi kính hiển vi chẩn đoán chính xác.'
        });
        console.warn('[AI Vision] Thông báo trạng thái mô hình cục bộ:', errorMsg);
        try { sound?.playPop?.(); } catch (_) {}
      } else {
        // Mô hình thị giác cục bộ đã phân tích thành công
        setHasScanned(true);
        setScanResult({
          isAvailable: true,
          analysis: data.analysis,
          model: data.model,
          isUserUpload: true,
          clinicalAdvice: data.analysis
        });
        console.info('[AI Vision] Phân tích hoàn tất từ mô hình cục bộ:', data.model);
        try { sound?.playSuccess?.(); } catch (_) {}
      }
    } catch (netErr) {
      console.error('[AI Vision] Lỗi kết nối mạng khi yêu cầu phân tích ảnh AI:', netErr);
      const networkErrorMsg = 'Lỗi kết nối mạng: Không thể kết nối tới máy chủ phân tích AI cục bộ. Vui lòng kiểm tra lại dịch vụ backend.';
      setScanError(networkErrorMsg);
      setHasScanned(true);
      setScanResult({
        isAvailable: false,
        code: 'NETWORK_ERROR',
        errorDescription: networkErrorMsg,
        clinicalAdvice: 'Không thể kết nối tới máy chủ nội bộ. Vui lòng kiểm tra lại dịch vụ backend đang chạy.'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const currentPet = pets?.find(p => p.id === selectedPetId) || pets?.[0] || { name: 'Chưa chọn thú cưng', species: '' };

  return (
    <div className="space-y-6 pb-12 text-slate-900 dark:text-white">
      
      {/* Laser Scanning Animation Keyframes (Hiệu ứng radar quét vi tổn thương) */}
      <style>{`
        @keyframes greenLaserScanSweep {
          0% { top: 2%; opacity: 0.95; }
          50% { top: 94%; opacity: 1; }
          100% { top: 2%; opacity: 0.95; }
        }
        .animate-green-laser {
          animation: greenLaserScanSweep 1.2s ease-in-out infinite;
        }
      `}</style>

      {/* Header: Thanh điều hướng & Cấu hình Mô hình Cục Bộ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-[#12192A] backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black shadow-md shadow-rose-500/15 shrink-0">
            <Scan className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-wide flex items-center gap-2.5 flex-wrap">
              <span>AI Thị Giác & Chẩn Đoán Bệnh Lý Da Liễu Thú Cưng</span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-400/30 font-bold normal-case">
                Local AI Vision
              </span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Phân tích quang học cận cảnh tổn thương da lông. Chỉ dùng mô hình AI cục bộ bảo mật, không gửi dữ liệu ra bên ngoài.
            </p>
          </div>
        </div>

        {/* Khối chọn thú cưng & Trạng thái mô hình cục bộ */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Bệnh nhân:</span>
            <select
              id="select-pet-for-vision"
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
              className="bg-transparent text-slate-900 dark:text-cyan-300 font-bold focus:outline-hidden cursor-pointer text-xs"
            >
              {pets && pets.length > 0 ? (
                pets.map(pet => (
                  <option key={pet.id} value={pet.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                    {pet.name} ({pet.species === 'cat' ? 'Mèo' : pet.species === 'dog' ? 'Chó' : (pet.species || 'Thú cưng')})
                  </option>
                ))
              ) : (
                <option value="" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
                  Chưa chọn thú cưng
                </option>
              )}
            </select>
          </div>

          {/* Badge trạng thái mô hình cục bộ */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-xs">
            <Cpu className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="font-mono text-[11px]">
              Ollama: {modelStatus?.configuredModel || 'qwen3:1.7b'}
            </span>
            <span className={`w-2 h-2 rounded-full ${modelStatus?.isRunning ? 'bg-emerald-400' : 'bg-slate-400'}`} title={modelStatus?.isRunning ? 'Đang chạy' : 'Chưa bật'} />
          </div>
        </div>
      </div>

      {/* Thông báo lỗi nếu có - Thông báo rõ ràng, không im lặng */}
      {scanError && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-950 dark:text-amber-300 flex items-center gap-2">
              <span>Thông Báo Trạng Thái Mô Hình AI Cục Bộ:</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-amber-200/60 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300">
                {modelStatus?.configuredModel || 'qwen3:1.7b'}
              </span>
            </div>
            <p className="leading-relaxed">
              {scanError}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Cột trái (Kính soi & Tải ảnh) / Cột phải (Hồ sơ phân tích lâm sàng) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================================================================= */}
        {/* CỘT TRÁI: KHUNG CHỨA ẢNH, XEM TRƯỚC, TẢI ẢNH TỪ MÁY & QUÉT AI     */}
        {/* ================================================================= */}
        <div className="bg-white dark:bg-[#12192A] backdrop-blur-2xl rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-rose-500" />
              <span>Kính Soi Quang Học Cận Cảnh Tổn Thương Da</span>
            </h3>
            {activeCaseKey && (
              <span className="text-[11px] font-mono text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-500/15 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-500/30 flex items-center gap-1 font-bold">
                <FileText className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                <span>Tài liệu tham khảo: {PET_PATHOLOGY_DATASET[activeCaseKey]?.name?.split('(')[0]?.trim()}</span>
              </span>
            )}
          </div>

          {/* 1. KHUNG XEM TRƯỚC ẢNH VỚI EMPTY STATE HOẶC TIA LASER QUÉT */}
          <div className={`relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden flex items-center justify-center group shadow-xs dark:shadow-2xl ${
            selectedImage 
              ? 'border border-slate-200 dark:border-white/15 bg-slate-950'
              : 'bg-slate-50 border-2 border-dashed border-slate-200 text-slate-500 dark:bg-slate-950 dark:border-white/15 dark:text-slate-400'
          }`}>
            {selectedImage ? (
              <>
                <img
                  id="preview-pet-image"
                  key={selectedImage}
                  src={selectedImage}
                  alt="Vùng da tổn thương lâm sàng của thú cưng"
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    isScanning ? 'scale-105 brightness-90 filter contrast-110' : ''
                  }`}
                  onError={(e) => {
                    const fallback = PET_PATHOLOGY_DATASET[activeCaseKey]?.fallbackImage;
                    if (fallback && e.target.src !== fallback) {
                      e.target.src = fallback;
                    }
                  }}
                />

                {/* Badge thông báo ảnh đã nạp vào kính soi khi chưa quét */}
                {!hasScanned && !isScanning && (
                  <div className="absolute bottom-3 left-3 right-3 px-3.5 py-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 text-xs text-slate-200 flex items-center justify-between shadow-xl">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      Ảnh tổn thương đã nạp vào khung xem trước
                    </span>
                    <span className="text-cyan-300 font-bold bg-cyan-500/15 px-2.5 py-0.5 rounded-lg border border-cyan-500/30 text-[11px]">
                      Sẵn sàng phân tích
                    </span>
                  </div>
                )}

                {/* HIỆU ỨNG TIA LASER QUÉT KHI ĐANG BẤM PHÂN TÍCH */}
                {isScanning && (
                  <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px] flex flex-col justify-between p-4 pointer-events-none z-20 overflow-hidden">
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee,0_0_40px_#06b6d4] animate-green-laser z-30">
                      <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-cyan-500/25 pointer-events-none" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-28 h-28 rounded-full border border-cyan-400/40 animate-ping opacity-60" />
                      <div className="absolute w-20 h-20 rounded-full border-2 border-dashed border-cyan-400/70 animate-spin" />
                      <Crosshair className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_#22d3ee] animate-pulse" />
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-cyan-300 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 shadow-md">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        LOCAL AI SCANNER
                      </span>
                      <span>KIỂM TRA TỔN THƯƠNG THỰC THỂ</span>
                    </div>

                    <div className="bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-cyan-500/30 text-white space-y-1.5 shadow-2xl">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-cyan-300 flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                          Đang kết nối mô hình AI cục bộ và phân tích...
                        </span>
                        <span className="text-cyan-400 font-mono">Local Request</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 w-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* EMPTY STATE: Chưa có ảnh */
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/20 flex items-center justify-center mb-3 text-slate-400 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors shadow-xs">
                  <Camera className="w-8 h-8 opacity-75" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Chưa có ảnh vi tổn thương da
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">
                  Tải lên ảnh chụp cận cảnh vùng da của thú cưng (mẩn đỏ, rụng lông, mụn mủ hoặc kẽ móng) để xem trước và yêu cầu phân tích y khoa.
                </p>
                <label className="py-2.5 px-5 rounded-xl bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-xs">
                  <Upload className="w-4 h-4 text-rose-500" />
                  <span>Tải ảnh từ máy</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    id="input-file-pet-vision"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Action Buttons: Tải ảnh & Yêu cầu phân tích */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label 
                htmlFor="input-file-pet-vision-btn"
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
              >
                <Upload className="w-4 h-4 text-rose-500" />
                <span>{selectedImage ? 'Đổi ảnh khác' : 'Tải ảnh từ máy'}</span>
                <input
                  id="input-file-pet-vision-btn"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                id="btn-trigger-ai-scan"
                onClick={() => triggerScan()}
                disabled={isScanning || !selectedImage}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isScanning 
                    ? 'Đang Kiểm Tra & Phân Tích...' 
                    : hasScanned 
                    ? 'Yêu Cầu Phân Tích Lại' 
                    : 'Yêu Cầu Phân Tích'}
                </span>
              </button>
            </div>

            {/* Thư viện kiến thức đối chiếu tham khảo */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/10">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tài liệu tham khảo các bệnh lý thường gặp (Dành cho chủ nuôi đối chiếu):</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {SAMPLE_PATHOLOGY_CASES.map((item) => {
                  const isSelected = activeCaseKey === item.id;
                  const itemData = PET_PATHOLOGY_DATASET[item.id];
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectCase(item.id)}
                      className={`p-2.5 rounded-2xl text-left transition-all group cursor-pointer border flex items-center gap-3 ${
                        isSelected
                          ? 'bg-rose-50/80 border-rose-300 dark:bg-rose-500/20 dark:border-rose-500/70 shadow-md ring-2 ring-rose-400/40 dark:shadow-rose-500/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] hover:border-slate-300 dark:bg-white/[0.03] dark:hover:bg-rose-500/10 dark:border-white/10 dark:hover:border-rose-500/40'
                      }`}
                    >
                      <img 
                        src={itemData.image} 
                        alt={item.shortName} 
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-white/15 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-rose-600 dark:text-white dark:group-hover:text-rose-300 truncate">
                            {item.shortName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-1">
                          {item.summary}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* ================================================================= */}
        {/* CỘT PHẢI: BẢNG KẾT QUẢ PHÂN TÍCH & BÁO CÁO TÌNH TRẠNG LÂM SÀNG    */}
        {/* ================================================================= */}
        <div className="bg-white dark:bg-[#12192A] backdrop-blur-2xl rounded-3xl p-6 border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.05)] dark:shadow-2xl text-slate-800 dark:text-slate-100 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Header kết quả */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Microscope className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Hồ Sơ Nhận Diện & Phân Tích Y Khoa
                  </h3>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Bệnh nhân: <strong className="text-cyan-700 dark:text-cyan-300">{currentPet.name}</strong>
                  </span>
                </div>
              </div>

              {/* Tag trạng thái */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Mô hình cục bộ</span>
                </span>
              </div>
            </div>

            {/* Lưu ý y khoa bắt buộc */}
            <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-200 flex items-start gap-2.5 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                <strong className="font-bold text-rose-950 dark:text-rose-300 mr-1">Nguyên tắc an toàn:</strong>
                Chỉ sử dụng mô hình AI cục bộ trên thiết bị. Nếu mô hình chưa chạy hoặc không hỗ trợ đọc ảnh, hệ thống thông báo đúng thực tế, tuyệt đối không tạo chẩn đoán giả lập hay dùng dữ liệu mẫu.
              </p>
            </div>

            {/* TRẠNG THÁI 1: CHƯA QUÉT */}
            {!hasScanned && (
              <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-4 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400 shadow-xs">
                  <Microscope className="w-8 h-8 opacity-80" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedImage ? 'Ảnh đã sẵn sàng trong kính soi' : 'Chưa có ảnh tổn thương để phân tích'}
                  </h4>
                  <p className="text-xs max-w-sm mx-auto text-slate-500 dark:text-slate-400 leading-relaxed">
                    {selectedImage 
                      ? 'Nhấn nút "Yêu cầu phân tích" ở khung bên trái để kiểm tra hình ảnh qua mô hình AI cục bộ.'
                      : 'Vui lòng nhấn "Tải ảnh từ máy" để chọn ảnh chụp vùng da tổn thương của thú cưng, sau đó yêu cầu hệ thống phân tích.'
                    }
                  </p>
                </div>

                {selectedImage && !isScanning && (
                  <button
                    type="button"
                    onClick={triggerScan}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Yêu Cầu Phân Tích Ngay</span>
                  </button>
                )}
              </div>
            )}

            {/* TRẠNG THÁI 2: ĐÃ YÊU CẦU PHÂN TÍCH NHƯNG MÔ HÌNH CHƯA CHẠY / KHÔNG HỖ TRỢ ẢNH (BÁO CÁO THẬT, KHÔNG GIẢ MẠO) */}
            {hasScanned && scanResult && !scanResult.isAvailable && (
              <div className="space-y-3.5 text-xs leading-relaxed animate-in fade-in duration-300">
                <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Tình trạng mô hình AI cục bộ:</span>
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border text-amber-800 bg-amber-100 border-amber-300 dark:text-amber-300 dark:bg-amber-500/20 dark:border-amber-500/30">
                      Mô hình: {scanResult.model || 'qwen3:1.7b'}
                    </span>
                  </div>
                  
                  <h4 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-200 leading-snug">
                    Không thể phân tích hình ảnh qua mô hình cục bộ hiện tại
                  </h4>

                  <p className="text-xs text-amber-900/90 dark:text-amber-100 leading-relaxed">
                    {scanResult.errorDescription}
                  </p>

                  <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-amber-200/60 dark:border-white/10 space-y-1">
                    <div className="font-bold text-amber-950 dark:text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Cam kết an toàn thú y:</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      Hệ thống <strong>không tạo kết quả chẩn đoán giả lập</strong>, <strong>không sử dụng dữ liệu mẫu</strong> để suy đoán sai lệch, và <strong>không tự lưu dữ liệu</strong> vào bệnh án hoặc đơn thuốc.
                    </p>
                  </div>
                </div>

                {/* Form nhập triệu chứng quan sát thực tế để chuyển Bác sĩ */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-white/10 space-y-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-rose-500" />
                    <span>Ghi chú triệu chứng lâm sàng quan sát được (gửi kèm Bác sĩ khi khám):</span>
                  </label>
                  <textarea
                    rows={3}
                    value={userSymptomsNote}
                    onChange={(e) => setUserSymptomsNote(e.target.value)}
                    placeholder="Mô tả cụ thể: Vết tổn thương xuất hiện mấy ngày, bé có liếm/gãi liên tục, có rỉ dịch mủ hoặc rụng lông xung quanh không..."
                    className="w-full p-2.5 rounded-xl text-xs bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 resize-none focus:outline-hidden focus:ring-2 focus:ring-rose-500/40"
                  />
                </div>

                {/* Khuyến nghị sơ cứu an toàn */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-500/25 space-y-1">
                  <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-300 font-bold text-xs">
                    <Bandage className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>Hướng dẫn sơ cứu & giữ an toàn tại nhà:</span>
                  </div>
                  <ul className="text-xs text-slate-700 dark:text-slate-300 pl-6 list-disc space-y-1 mt-1">
                    <li>Đeo vòng cổ chống liếm (loa Elizabeth) ngay nếu bé liếm/gặm nhiều gây trợt loét da.</li>
                    <li>Giữ vùng da khô thoáng, tránh tự ý bôi các loại thuốc mỡ chứa corticoid của người.</li>
                    <li>Đặt lịch khám để Bác sĩ cạo tươi tế bào biểu bì soi dưới kính hiển vi chuyên dụng.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TRẠNG THÁI 3: MÔ HÌNH VISION CỤC BỘ ĐÃ TRẢ KẾT QUẢ THỰC */}
            {hasScanned && scanResult && scanResult.isAvailable && (
              <div className="space-y-3.5 text-xs leading-relaxed animate-in fade-in duration-300">
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Kết quả phân tích từ mô hình cục bộ ({scanResult.model}):</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {scanResult.analysis}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[11px] text-slate-500 dark:text-slate-400">
                  ⚠️ Kết quả được sinh ra từ mô hình AI cục bộ mang tính chất tham khảo nhận diện quang học. Hệ thống không tự động lưu vào bệnh án hay đơn thuốc.
                </div>
              </div>
            )}

          </div>

          {/* Nút hành động đặt lịch khám với Bác sĩ Thú y (KHÔNG tự động lưu vào cơ sở dữ liệu) */}
          {hasScanned && (
            <div className="pt-4 border-t border-slate-100 dark:border-white/10 mt-4 flex flex-col gap-2.5">
              <button
                type="button"
                id="btn-book-vet-from-vision"
                onClick={() => {
                  try { sound?.playClick?.(); } catch (_) {}
                  const noteContent = `[Ảnh tổn thương da]: ${userSymptomsNote || 'Chủ nuôi đã cung cấp ảnh vi tổn thương da liễu cần Bác sĩ thăm khám trực tiếp.'}`;

                  if (typeof onOpenVetBooking === 'function') {
                    onOpenVetBooking({
                      petId: currentPet.id,
                      service: 'Khám Da liễu & Vết nấm/ve rận',
                      note: noteContent,
                      isAiVision: true,
                      aiVisionPetId: currentPet.id
                    });
                  } else if (typeof onOpenAddSchedule === 'function') {
                    onOpenAddSchedule('vet', 'Khám Da liễu & Vết nấm/ve rận');
                  }
                }}
                className="w-full py-3.5 px-5 font-bold text-xs sm:text-sm rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-xl shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Stethoscope className="w-5 h-5 text-white" />
                <span>🩺 Đặt Lịch Khám Da Liễu Với Bác Sĩ (Thăm Khám Trực Tiếp)</span>
              </button>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
                Thao tác mở giao diện đặt lịch khám. Hệ thống <strong>không tự lưu</strong> thành bệnh án, đơn thuốc hay lịch chăm sóc khi chưa có chỉ định của Bác sĩ.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default AiVisionScannerView;
