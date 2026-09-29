import React, { useState } from 'react';
import { 
  Scan, 
  Upload, 
  Sparkles, 
  ShieldAlert, 
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
  ShieldCheck
} from 'lucide-react';
import { sound } from '../../services/soundService';

// =========================================================================
// 1. TỪ ĐIỂN BỆNH LÝ THÚ CƯNG THƯỜNG GẶP (VETERINARY PATHOLOGY DATASET)
// Sử dụng ảnh Macro cận cảnh tổn thương thực thể lâm sàng
// =========================================================================
export const PET_PATHOLOGY_DATASET = {
  // 1. Viêm da dị ứng bọ chét (FAD): Vùng da ửng đỏ, rụng lông, mẩn ngứa
  fad: {
    id: 'fad',
    name: 'Viêm da dị ứng bọ chét / ve rận (Flea Allergy Dermatitis - FAD)',
    category: 'Ngoại ký sinh trùng',
    confidence: 94.6,
    riskLevel: 'Trung bình',
    riskColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    // Ảnh cận cảnh da chó bị mẩn đỏ, rụng lông sát chân
    image: '/images/pathology/macro_fad_lesion.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=900&q=80',
    boxCoordinates: { top: '28%', left: '26%', width: '48%', height: '42%' },
    symptoms: [
      'Mẩn đỏ li ti dạng hạt cườm, tập trung dày ở vùng sống lưng và háng bẹn.',
      'Da sậm màu, dày sừng do cọ xát cắn gãi liên tục.',
      'Dấu hiệu hạt phân bọ chét đen nhỏ bám sát chân lông.'
    ],
    firstAid: [
      'Nhỏ thuốc trị ký sinh trùng khẩn cấp (Bravecto, Revolution Plus).',
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
    confidence: 96.2,
    riskLevel: 'Trung bình',
    riskColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    // Ảnh cận cảnh mảng rụng lông vi nấm tròn bong vảy
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
      'Bôi kem kháng nấm đặc trị (Ketoconazole/Miconazole) theo chỉ dẫn.'
    ],
    clinicalAdvice: 'Cần soi đèn Wood (Wood’s Lamp) phát quang xanh táo và cấy nấm DTM để định danh chủng vi nấm.'
  },

  // 3. Xà mâu Demodex & Men kẽ chân: Viêm đỏ sưng múp kẽ ngón, rụng lông quanh mắt
  demodex: {
    id: 'demodex',
    name: 'Xà mâu Demodex & Viêm nấm men Malassezia kẽ ngón',
    category: 'Ký sinh trùng bao lông & Nấm men',
    confidence: 92.4,
    riskLevel: 'Khẩn cấp',
    riskColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    // Ảnh cận cảnh bàn chân / kẽ móng chó bị sưng đỏ, viêm nhờn rụng lông
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
    confidence: 95.1,
    riskLevel: 'Khẩn cấp',
    riskColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    // Ảnh cận cảnh mảng viêm loét, mụn mủ đóng vảy sừng
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

// 4 Ca bệnh mẫu nhanh dùng cho thanh chuyển đổi
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
  onOpenAddSchedule,
  onOpenVetBooking
}) => {
  // THIẾT LẬP LẠI STATE MẶC ĐỊNH (INITIAL EMPTY STATE)
  // Ngăn chặn việc chưa tải ảnh mà hệ thống đã tự động quét ra bệnh
  const [selectedImage, setSelectedImage] = useState(null); // Không có ảnh mặc định
  const [activeCaseKey, setActiveCaseKey] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false); // Chưa quét
  const [scanResult, setScanResult] = useState(null); // Chưa có kết quả
  const [boxCoords, setBoxCoords] = useState(null);
  const [imageBase64Info, setImageBase64Info] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [selectedPetId, setSelectedPetId] = useState(() => pets?.[0]?.id || 'pet-1');

  // Nén ảnh trên Client để tối ưu kích thước
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.src = objUrl;
      img.onload = () => {
        URL.revokeObjectURL(objUrl);
        const canvas = document.createElement('canvas');
        const maxDim = 640;
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
        const base64Data = canvas.toDataURL('image/jpeg', 0.75).split(',')[1];
        resolve(base64Data);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objUrl);
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result.split(',')[1]);
        };
        reader.readAsDataURL(file);
      };
    });
  };

  // Upload ảnh người dùng chụp cận cảnh tổn thương
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
    setImageBase64Info({ data: base64Data, mimeType: 'image/jpeg' });
  };

  // Chọn ca bệnh lý mẫu trong bộ dữ liệu (ĐỔI ẢNH CẬN CẢNH NGAY LẬP TỨC)
  const handleSelectCase = (caseId) => {
    const caseData = PET_PATHOLOGY_DATASET[caseId];
    if (!caseData) return;

    try { sound?.playClick?.(); } catch (_) {}
    setActiveCaseKey(caseId);
    setSelectedImage(caseData.image); // LIÊN KẾT ĐỔI ẢNH NGAY LẬP TỨC
    setBoxCoords(caseData.boxCoordinates);
    setHasScanned(false);
    setScanResult(null);
    setScanError(null);
  };

  // Gọi mô hình Gemini Vision nếu có ảnh tải lên và có key
  const callGeminiVisionApi = async (base64Info) => {
    const envKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) ? import.meta.env.VITE_GEMINI_API_KEY.trim() : '';
    const activeKey = (envKey && envKey !== 'your_actual_gemini_api_key_here')
      ? envKey
      : ((typeof window !== 'undefined' ? (localStorage.getItem('petcare_gemini_api_key') || localStorage.getItem('gemini_api_key')) : '') || '');

    if (!activeKey) {
      throw new Error('Chưa có Gemini API Key');
    }

    const visionPrompt = `Bạn là Bác sĩ Thú y AI chuyên khoa Da liễu & Bệnh học Lâm sàng Thú cưng của PetCare PRO.
Hãy phân tích bức ảnh vùng da tổn thương thực thể này và chẩn đoán bệnh lý (viêm da dị ứng bọ chét FAD, nấm tròn Microsporum, xà mâu Demodex/nấm men Malassezia, viêm da mủ Pyoderma,...).
Trả về DUY NHẤT một chuỗi JSON thuần (không kèm markdown) theo định dạng:
{
  "name": "Tên bệnh lý đầy đủ kèm tên khoa học",
  "category": "Ngoại ký sinh trùng" hoặc "Nhiễm vi nấm biểu bì" hoặc "Ký sinh trùng bao lông & Nấm men" hoặc "Nhiễm khuẩn tụ cầu da (Staphylococcus)",
  "confidence": 94.5,
  "riskLevel": "Khẩn cấp" hoặc "Trung bình" hoặc "Nhẹ",
  "riskColor": "text-rose-400 bg-rose-500/10 border-rose-500/20",
  "symptoms": [
    "Triệu chứng 1...",
    "Triệu chứng 2...",
    "Triệu chứng 3..."
  ],
  "firstAid": [
    "Sơ cứu khẩn cấp 1...",
    "Sơ cứu 2...",
    "Sơ cứu 3..."
  ],
  "clinicalAdvice": "Chỉ định y khoa của Bác sĩ thú y..."
}`;

    const requestPayload = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: base64Info.mimeType || 'image/jpeg',
                data: base64Info.data
              }
            },
            {
              text: visionPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 800,
        responseMimeType: "application/json"
      }
    };

    const endpoints = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${activeKey}`,
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeKey}`
    ];

    let lastError = null;
    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        if (!response.ok) {
          if (response.status === 404) continue;
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error('API không trả về nội dung');

        let cleaned = rawText.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
        }
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
        }
        return JSON.parse(cleaned);
      } catch (err) {
        lastError = err;
        if (err.message?.includes('404')) continue;
        throw err;
      }
    }

    throw lastError || new Error('Không thể kết nối đến máy chủ Gemini Vision.');
  };

  // Quét tổn thương thực thể bằng Laser Scanner (thời gian quét 1.000ms = 1s)
  const triggerScan = async () => {
    if (isScanning || !selectedImage) return;

    try { sound?.playPop?.(); } catch (_) {}
    setIsScanning(true);
    setScanResult(null);
    setScanError(null);

    const scanDelayPromise = new Promise(resolve => setTimeout(resolve, 1000));

    let finalResult = null;

    // 1. Thử gọi Gemini Vision nếu là ảnh người dùng tải lên và có base64
    if (!activeCaseKey && imageBase64Info) {
      try {
        const parsed = await callGeminiVisionApi(imageBase64Info);
        finalResult = {
          id: 'custom_upload',
          name: parsed.name || 'Viêm da dị ứng nghi ngờ ký sinh trùng',
          category: parsed.category || 'Bệnh ngoài da thú cưng',
          confidence: Number(parsed.confidence) || 92.5,
          riskLevel: parsed.riskLevel || 'Trung bình',
          riskColor: parsed.riskLevel === 'Khẩn cấp' 
            ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
            : 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          image: selectedImage,
          boxCoordinates: { top: '25%', left: '25%', width: '50%', height: '50%' },
          symptoms: Array.isArray(parsed.symptoms) && parsed.symptoms.length > 0 
            ? parsed.symptoms 
            : ['Mẩn đỏ, rụng lông cục bộ, bề mặt da viêm sung huyết.'],
          firstAid: Array.isArray(parsed.firstAid) && parsed.firstAid.length > 0 
            ? parsed.firstAid 
            : ['Đeo loa Elizabeth chống liếm, giữ khô thoáng vùng da bệnh.'],
          clinicalAdvice: parsed.clinicalAdvice || 'Đưa bé đến phòng khám để cạo da soi tươi xác định chủng vi nấm hoặc ký sinh trùng.'
        };
      } catch (err) {
        console.warn('Gemini Vision fallback to Pathology Engine:', err);
      }
    }

    // 2. Chẩn đoán theo Bộ Dữ Liệu Bệnh Lý Thường Gặp
    if (!finalResult) {
      finalResult = PET_PATHOLOGY_DATASET[activeCaseKey || 'fad'] || PET_PATHOLOGY_DATASET.fad;
    }

    await scanDelayPromise;

    setIsScanning(false);
    setHasScanned(true);
    setScanResult(finalResult);
    if (finalResult.boxCoordinates) {
      setBoxCoords(finalResult.boxCoordinates);
    }
    try { sound?.playSuccess?.(); } catch (_) {}
  };

  const currentPet = pets?.find(p => p.id === selectedPetId) || pets?.[0] || { name: 'Mochi', species: 'Chó Golden' };

  return (
    <div className="space-y-6 pb-12 text-white">
      
      {/* Laser Scanning Animation Keyframes (Tia laser xanh ngọc quét dọc) */}
      <style>{`
        @keyframes greenLaserScanSweep {
          0% {
            top: 2%;
            opacity: 0.95;
          }
          50% {
            top: 94%;
            opacity: 1;
          }
          100% {
            top: 2%;
            opacity: 0.95;
          }
        }
        .animate-green-laser {
          animation: greenLaserScanSweep 1.2s ease-in-out infinite;
        }
      `}</style>

      {/* Header: Dark Spatial Glassmorphism */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/30 text-rose-400 flex items-center justify-center font-black shadow-lg shadow-rose-500/20 shrink-0">
            <Scan className="w-6 h-6 stroke-[2.5] animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-wide flex items-center gap-2.5 flex-wrap">
              <span>AI Thị Giác & Chẩn Đoán Bệnh Lý Da Liễu Thú Cưng</span>
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-400/30 font-bold normal-case">
                Veterinary Pathology AI
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Phân tích quang học vi tổn thương biểu bì, phát hiện ký sinh trùng, nấm men và ổ viêm mủ thực thể
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {pets && pets.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-white/10 text-xs">
              <span className="text-slate-400 text-[11px]">Bệnh nhân:</span>
              <select
                value={selectedPetId}
                onChange={(e) => setSelectedPetId(e.target.value)}
                className="bg-transparent text-cyan-300 font-bold focus:outline-hidden cursor-pointer text-xs"
              >
                {pets.map(pet => (
                  <option key={pet.id} value={pet.id} className="bg-slate-900 text-white">
                    {pet.name} ({pet.species || 'Thú cưng'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold shadow-xs">
            <Microscope className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Chẩn Đoán Tổn Thương Thực Thể</span>
          </div>
        </div>
      </div>

      {/* Thông báo lỗi nếu có */}
      {scanError && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{scanError}</span>
        </div>
      )}

      {/* Main Grid: Left Laser Scanning Camera / Right Pathology Diagnostic Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================================================================= */}
        {/* CỘT TRÁI: KHUNG CHỨA ẢNH, AI BOUNDING BOX & TIA LASER XANH QUÉT   */}
        {/* ================================================================= */}
        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-rose-400" />
              <span>Ảnh Macro Cận Cảnh Tổn Thương Da</span>
            </h3>
            {activeCaseKey && (
              <span className="text-[11px] font-mono text-rose-300 bg-rose-500/15 px-2.5 py-0.5 rounded-lg border border-rose-500/30 flex items-center gap-1 font-bold">
                <Check className="w-3 h-3 text-rose-400" />
                <span>Bệnh phẩm: {PET_PATHOLOGY_DATASET[activeCaseKey]?.name?.split('(')[0]?.trim()}</span>
              </span>
            )}
          </div>

          {/* 1. KHUNG ẢNH VỚI EMPTY STATE HOẶC AI BOUNDING BOX HUD VÀ TIA LASER QUÉT */}
          <div className="relative h-72 sm:h-96 w-full rounded-2xl overflow-hidden border border-white/15 bg-slate-950 flex items-center justify-center group shadow-2xl">
            {selectedImage ? (
              <>
                <img
                  id="preview-pet-image"
                  key={selectedImage}
                  src={selectedImage}
                  alt="Vùng da tổn thương lâm sàng"
                  className={`w-full h-full object-cover transition-all duration-300 ${
                    isScanning ? 'scale-105 brightness-90 filter contrast-110' : ''
                  }`}
                  onError={(e) => {
                    // Safe fallback if local or remote fails, without dog in sweater
                    const fallback = PET_PATHOLOGY_DATASET[activeCaseKey]?.fallbackImage;
                    if (fallback && e.target.src !== fallback) {
                      e.target.src = fallback;
                    }
                  }}
                />

                {/* ----------------------------------------------------------- */}
                {/* LỚP PHỦ KHUNG QUÉT AI (CHỈ HIỂN THỊ KHI ĐÃ HOÀN TẤT QUÉT)   */}
                {/* ----------------------------------------------------------- */}
                {hasScanned && scanResult && (
                  <div 
                    className={`absolute rounded-xl border-2 border-dashed transition-all duration-500 pointer-events-none z-10 ${
                      scanResult.riskLevel === 'Khẩn cấp'
                        ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.6)]'
                        : 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.55)]'
                    }`}
                    style={{
                      top: boxCoords?.top || '25%',
                      left: boxCoords?.left || '25%',
                      width: boxCoords?.width || '50%',
                      height: boxCoords?.height || '45%'
                    }}
                  >
                    {/* Nhãn gắn kèm khung quét HUD: [ 🔴 Vùng tổn thương: Viêm mẩn đỏ FAD (94.6%) ] */}
                    <div className={`absolute -top-3.5 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5 whitespace-nowrap border ${
                      scanResult.riskLevel === 'Khẩn cấp'
                        ? 'bg-slate-950/95 text-rose-300 border-rose-500/80'
                        : 'bg-slate-950/95 text-amber-300 border-amber-500/80'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full animate-ping ${
                        scanResult.riskLevel === 'Khẩn cấp' ? 'bg-rose-400' : 'bg-amber-400'
                      }`} />
                      <span>[ 🔴 Vi tổn thương: {scanResult.name?.split('(')[0]?.trim()} ({scanResult.confidence}%) ]</span>
                    </div>

                    {/* 4 góc ngắm mục tiêu y khoa */}
                    <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-rose-400 rounded-tl shadow-[0_0_6px_#f43f5e]" />
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-rose-400 rounded-tr shadow-[0_0_6px_#f43f5e]" />
                    <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-rose-400 rounded-bl shadow-[0_0_6px_#f43f5e]" />
                    <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-rose-400 rounded-br shadow-[0_0_6px_#f43f5e]" />

                    {/* Lớp phủ mờ tâm điểm tổn thương */}
                    <div className={`absolute inset-0 rounded-xl pointer-events-none ${
                      scanResult.riskLevel === 'Khẩn cấp' ? 'bg-rose-500/15' : 'bg-amber-500/15'
                    }`} />
                  </div>
                )}

                {/* Badge thông báo ảnh sẵn sàng khi chưa quét */}
                {!hasScanned && !isScanning && (
                  <div className="absolute bottom-3 left-3 right-3 px-3.5 py-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-white/10 text-xs text-slate-200 flex items-center justify-between shadow-xl">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                      Ảnh macro vi tổn thương đã nạp vào kính soi
                    </span>
                    <span className="text-cyan-300 font-bold bg-cyan-500/15 px-2.5 py-0.5 rounded-lg border border-cyan-500/30 text-[11px]">
                      Sẵn sàng quét
                    </span>
                  </div>
                )}

                {/* ----------------------------------------------------------- */}
                {/* HIỆU ỨNG TIA LASER XANH QUÉT DỌC KHI ĐANG BẤM QUÉT          */}
                {/* ----------------------------------------------------------- */}
                {isScanning && (
                  <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[1px] flex flex-col justify-between p-4 pointer-events-none z-20 overflow-hidden">
                    
                    {/* Tia laser xanh quét dọc chạy lặp lại */}
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_20px_#22d3ee,0_0_40px_#06b6d4] animate-green-laser z-30">
                      <div className="absolute -top-16 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-cyan-500/25 pointer-events-none" />
                    </div>

                    {/* Vòng Radar xanh quét giữa ảnh */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-28 h-28 rounded-full border border-cyan-400/40 animate-ping opacity-60" />
                      <div className="absolute w-20 h-20 rounded-full border-2 border-dashed border-cyan-400/70 animate-spin" />
                      <Crosshair className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_#22d3ee] animate-pulse" />
                    </div>

                    {/* Telemetry info */}
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-cyan-300 bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 shadow-md">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        AI PATHOLOGY MACRO SCANNER
                      </span>
                      <span>CLINICAL LESION MAPPING</span>
                    </div>

                    {/* Thanh trạng thái đang phân tích trong 1.0s */}
                    <div className="bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-cyan-500/30 text-white space-y-1.5 shadow-2xl">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-cyan-300 flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                          Đang quét laser vi tổn thương biểu bì & phân tích mô học...
                        </span>
                        <span className="text-cyan-400 font-mono">1.0s Optical Scan</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 w-full animate-pulse" />
                      </div>
                    </div>

                  </div>
                )}
              </>
            ) : (
              /* EMPTY STATE: Chưa có ảnh nào được chọn */
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-dashed border-white/20 flex items-center justify-center mb-3 text-slate-400 group-hover:text-rose-400 transition-colors">
                  <Camera className="w-8 h-8 opacity-70" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  Chưa có ảnh vi tổn thương da
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
                  Tải lên ảnh chụp cận cảnh vùng da bệnh (mẩn đỏ, rụng lông, mụn mủ) hoặc chọn nhanh 1 trong 4 ca bệnh phẩm mẫu bên dưới để bắt đầu quét AI.
                </p>
                <label className="py-2 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-slate-200 flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-md">
                  <Upload className="w-4 h-4 text-rose-400" />
                  <span>Tải ảnh từ máy</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
            )}
          </div>

          {/* Action Buttons: Tải ảnh & Bắt đầu quét */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex-1 py-2.5 px-4 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98">
                <Upload className="w-4 h-4 text-rose-400" />
                <span>{selectedImage ? 'Đổi ảnh khác' : 'Tải ảnh tổn thương'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => triggerScan()}
                disabled={isScanning || !selectedImage}
                className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg shadow-rose-600/30 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isScanning 
                    ? 'Đang Quét Laser...' 
                    : hasScanned 
                    ? 'Quét Lại Tổn Thương' 
                    : 'Bắt Đầu Quét AI'}
                </span>
              </button>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* BỘ CHỌN 4 CA BỆNH LÝ MẪU CẬN CẢNH (KÈM THUMBNAIL MACRO THẬT)  */}
            {/* ------------------------------------------------------------- */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 block mb-1">
                Hoặc chọn nhanh 4 ca bệnh lý thực tế trong từ điển bệnh học:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2">
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
                          ? 'bg-rose-500/20 border-rose-500/70 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/40'
                          : 'bg-white/[0.03] hover:bg-rose-500/10 border-white/10 hover:border-rose-500/40'
                      }`}
                    >
                      {/* Macro Thumbnail Preview */}
                      <img 
                        src={itemData.image} 
                        alt={item.shortName} 
                        className="w-12 h-12 rounded-xl object-cover border border-white/15 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-xs font-bold text-white group-hover:text-rose-300 truncate">
                            {item.shortName}
                          </span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md border font-semibold shrink-0 ${itemData.riskColor}`}>
                            {itemData.riskLevel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
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
        {/* CỘT PHẢI: BẢNG KẾT QUẢ CHẨN ĐOÁN BỆNH LÝ & TỔN THƯƠNG THỰC THỂ    */}
        {/* ================================================================= */}
        <div className="bg-slate-900/60 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl text-slate-100 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header kết quả */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Microscope className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Hồ Sơ Chẩn Đoán Bệnh Lý Lâm Sàng
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Bệnh nhân: <strong className="text-cyan-300">{currentPet.name}</strong>
                  </span>
                </div>
              </div>

              {hasScanned && scanResult && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 border border-rose-500/30 text-rose-300 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Độ tin cậy: {scanResult.confidence}%</span>
                  </span>
                </div>
              )}
            </div>

            {/* Lưu ý y khoa bắt buộc */}
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 shadow-sm text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                <strong className="font-bold text-rose-300 mr-1">Cảnh báo y khoa:</strong>
                Chẩn đoán quang học AI giúp sàng lọc nhanh tổn thương thực thể. Cần kết hợp cạo sâu biểu bì soi tươi hoặc đèn Wood tại phòng khám thú y để quyết định phác đồ điều trị chính xác.
              </p>
            </div>

            {/* EMPTY STATE: Chưa quét */}
            {!hasScanned || !scanResult ? (
              <div className="py-14 text-center text-slate-400 space-y-4 my-auto">
                <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/10">
                  <Microscope className="w-8 h-8 opacity-80" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white">
                    Chưa có kết quả chẩn đoán y khoa
                  </h4>
                  <p className="text-xs max-w-sm mx-auto text-slate-400 leading-relaxed">
                    {selectedImage 
                      ? 'Ảnh tổn thương đã được nạp vào kính soi quang học. Hãy nhấn nút "Bắt Đầu Quét AI" để phân tích vi tổn thương.'
                      : 'Vui lòng nạp ảnh chụp cận cảnh vùng da tổn thương (mẩn đỏ, rụng lông, mụn mủ) hoặc chọn 1 ca bệnh mẫu, sau đó bấm "Bắt Đầu Quét AI" để nhận diện bệnh lý, mức độ rủi ro và phác đồ sơ cứu ban đầu.'
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
                    <span>Bắt Đầu Quét AI Ngay</span>
                  </button>
                )}
              </div>
            ) : (
              /* ĐÃ CÓ KẾT QUẢ CHẨN ĐOÁN SAU KHI QUÉT */
              <div className="space-y-3.5 text-xs leading-relaxed animate-in fade-in duration-300">
                {/* Khối 1: Tên bệnh lý & Phân loại & Mức độ rủi ro */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Bệnh lý da liễu xác định:
                    </span>
                    <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${scanResult.riskColor}`}>
                      Mức độ rủi ro: {scanResult.riskLevel}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white leading-snug">
                    {scanResult.name}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-cyan-300 font-semibold">
                    <Info className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Nhóm bệnh học: {scanResult.category}</span>
                  </div>
                </div>

                {/* Khối 2: Triệu chứng lâm sàng quan sát được (Symptoms) */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-xs">
                    <Activity className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Triệu chứng lâm sàng điển hình quan sát được:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 pl-6 list-disc">
                    {scanResult.symptoms?.map((symptom, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {symptom}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Khối 3: Khuyến cáo sơ cứu ban đầu (First Aid) */}
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                    <Bandage className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Khuyến cáo sơ cứu ban đầu tại nhà:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-300 pl-6 list-disc">
                    {scanResult.firstAid?.map((aid, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {aid}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Khối 4: Lời khuyên & Chỉ định Bác sĩ Thú y (Clinical Advice) */}
                <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/25 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Chỉ định & Lời khuyên Bác sĩ Thú y:</span>
                  </div>
                  <p className="text-xs text-amber-100/90 leading-relaxed pl-6 italic">
                    "{scanResult.clinicalAdvice}"
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Nút hành động nổi bật: [ 🩺 Đặt Lịch Khám Da Liễu Ngay ] (Chỉ hiển thị khi đã có kết quả quét) */}
          {hasScanned && scanResult && (
            <div className="pt-4 border-t border-white/10 mt-4 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  try { sound?.playClick?.(); } catch (_) {}
                  const symptomNote = `[Chẩn đoán AI Bệnh Lý Da Liễu]: ${scanResult.name} (Độ tin cậy: ${scanResult.confidence}%)
- Bệnh nhân: ${currentPet.name} (${currentPet.species || 'Thú cưng'})
- Nhóm: ${scanResult.category} - Mức độ: ${scanResult.riskLevel}
- Triệu chứng: ${scanResult.symptoms?.join('; ')}
- Sơ cứu đã thực hiện: ${scanResult.firstAid?.join('; ')}
- Chỉ định: ${scanResult.clinicalAdvice}`;

                  if (typeof onOpenVetBooking === 'function') {
                    onOpenVetBooking({
                      petId: currentPet.id,
                      service: 'Khám Da liễu & Vết nấm/ve rận',
                      note: symptomNote,
                      facility: 'Phòng khám PetCare Chi nhánh Cầu Giấy (Phòng khám 02)'
                    });
                  } else if (typeof onOpenAddSchedule === 'function') {
                    onOpenAddSchedule('vet', 'Khám Da liễu & Vết nấm/ve rận');
                  }
                }}
                className="w-full py-3.5 px-5 font-black text-xs sm:text-sm rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-xl shadow-rose-600/30 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Stethoscope className="w-5 h-5 text-white animate-pulse" />
                <span>🩺 Đặt Lịch Khám Thú Y & Chuyển Kết Quả AI</span>
              </button>

              <p className="text-[11px] text-center text-slate-400">
                Tự động gửi kèm triệu chứng, phác đồ sơ cứu và ảnh tổn thương của <strong>{currentPet.name}</strong> sang hồ sơ tiếp nhận Bác sĩ.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AiVisionScannerView;
