import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  User, 
  PhoneCall,
  PawPrint,
  ChevronDown,
  Check,
  Stethoscope,
  HeartPulse,
  Info,
  X,
  RotateCcw,
  Minimize2,
  Calendar,
  Pill,
  Save,
  MessageSquare,
  ArrowRight,
  Plus
} from 'lucide-react';
import { smartSimulatedAiConsultation } from '../../services/aiService';
import { sound } from '../../services/soundService';

// Bộ xử lý hội thoại Dr. Paw dựa trên Cơ sở tri thức y khoa cục bộ (Local Knowledge Base)

// =========================================================================
// GỢI Ý HỎI NHANH ĐỘNG THEO TỪNG LOÀI
// =========================================================================
const DYNAMIC_PROMPTS_BY_SPECIES = {
  dog: [
    '🍫 Bé lỡ ăn phải Socola, sơ cứu thế nào?',
    '🤢 Chó nôn bọt trắng/vàng & bỏ ăn 1 ngày',
    '🦟 Trị ve rận & ghẻ ngứa kẽ móng chân',
    '🥩 Thực đơn dinh dưỡng cho cún dị ứng thịt bò',
    '🌪️ Chướng hơi xoắn dạ dày (GDV) ở chó lớn'
  ],
  cat: [
    '🧶 Mèo nôn búi lông (Hairball) hay bị tắc ruột?',
    '🚽 Mèo đi tiểu rặn buốt, ngồi khay cát lâu (FLUTD)',
    '🌿 Hoa ly & hành tỏi độc chết người thế nào?',
    '🐟 Khẩu phần pate & lượng nước ngừa sỏi thận',
    '🛋️ Mèo cào sofa & cách giảm stress khi có khách'
  ],
  rabbit: [
    '🚨 Thỏ bỏ ăn & không đi phân (GI Stasis nguy cấp)',
    '🌾 Tỷ lệ cỏ khô Timothy & rau xanh chuẩn 80/20',
    '🦷 Răng cửa mọc quá dài, dấu hiệu cần mài răng',
    '💧 Cách tập thỏ uống nước bằng bình bi sạch'
  ],
  all: [
    '🚨 Sơ cứu khẩn cấp khi thú cưng nuốt phải dị vật',
    '🤢 Dấu hiệu ngộ độc thực phẩm nguy cấp',
    '🩹 Cách kiểm tra thân nhiệt & nướu răng tại nhà',
    '💉 Lịch tiêm phòng vắc-xin & tẩy giun chuẩn WSAVA',
    '🥣 Cách tính năng lượng RER & lượng thức ăn mỗi ngày'
  ]
};

// =========================================================================
// DANH MỤC THẺ ĐỀ XUẤT THUỐC & DỊCH VỤ GỢI Ý TƯƠNG TÁC (INTERACTIVE MINI-CARDS)
// =========================================================================
const SUGGESTED_CARDS_DATABASE = {
  digestive: [
    {
      id: 'med_probiotic',
      name: 'Men vi sinh Bio-Scour Pet',
      category: 'Thuốc đường ruột & Tiêu hóa',
      price: '85.000đ',
      icon: '💊',
      actionText: '+ Đặt lịch khám',
      desc: 'Bổ sung 5 tỷ bào tử lợi khuẩn Bacillus subtilis giúp phục hồi niêm mạc ruột, ngưng tiêu chảy sau 24h.'
    },
    {
      id: 'srv_digestive_check',
      name: 'Khám Nội Tiêu Hóa & Siêu Âm',
      category: 'Dịch vụ phòng khám thú y',
      price: '250.000đ',
      icon: '🩺',
      actionText: '+ Đặt lịch khám',
      desc: 'Bác sĩ kiểm tra thành ruột, phát hiện dị vật cản quang và tầm soát viêm tụy cấp.'
    }
  ],
  emergency: [
    {
      id: 'srv_emergency_247',
      name: 'Cấp Cứu Hồi Sức Thú Y 24/7',
      category: 'Hotline Cấp Cứu 1900 6868',
      price: 'Ưu tiên số 1',
      icon: '🚨',
      actionText: '+ Gọi cấp cứu',
      desc: 'Đội ngũ bác sĩ trực cấp cứu, rửa dạ dày, hỗ trợ thở oxy và truyền dịch chống sốc.'
    },
    {
      id: 'med_charcoal',
      name: 'Than hoạt tính Carbo-Pet',
      category: 'Sơ cứu giải độc khẩn cấp',
      price: '110.000đ',
      icon: '🧪',
      actionText: '+ Xem chi tiết',
      desc: 'Hấp phụ độc tố socola, bả độc và hóa chất trước khi ngấm vào máu.'
    }
  ],
  vaccine: [
    {
      id: 'srv_vax_7in1',
      name: 'Tiêm Vắc-xin 7 bệnh (Zoetis/Nobivac)',
      category: 'Phòng bệnh chuẩn WSAVA',
      price: '280.000đ',
      icon: '💉',
      actionText: '+ Thêm lịch tiêm',
      desc: 'Ngừa Care, Parvo, Viêm gan truyền nhiễm, Ho cũi chó và Leptospira.'
    },
    {
      id: 'med_deworm',
      name: 'Thuốc tẩy giun Drontal Plus',
      category: 'Ký sinh trùng định kỳ',
      price: '45.000đ/v',
      icon: '💊',
      actionText: '+ Thêm vào đơn',
      desc: 'Tiêu diệt 100% giun đũa, giun móc, giun tóc và sán dây an toàn cho hệ tiêu hóa.'
    }
  ],
  nutrition: [
    {
      id: 'nut_hypo',
      name: 'Hạt Hypoallergenic (Chống dị ứng)',
      category: 'Thức ăn trị liệu da & tiêu hóa',
      price: '340.000đ',
      icon: '🥣',
      actionText: '+ Xem chi tiết',
      desc: 'Đạm thủy phân phân tử siêu nhỏ, loại trừ triệt để nguy cơ dị ứng đạm bò và ngứa da.'
    },
    {
      id: 'nut_gel',
      name: 'Gel Dinh Dưỡng Nutri-plus Gel',
      category: 'Thực phẩm phục hồi thể trạng',
      price: '165.000đ',
      icon: '🍯',
      actionText: '+ Đặt mua',
      desc: 'Cung cấp năng lượng cao, vitamin và khoáng chất cho bé đang ốm biếng ăn.'
    }
  ],
  general: [
    {
      id: 'srv_general_exam',
      name: 'Gói Khám Thể Trạng Tổng Quát',
      category: 'Kiểm tra sức khỏe định kỳ',
      price: '200.000đ',
      icon: '🩺',
      actionText: '+ Đặt lịch khám',
      desc: 'Kiểm tra tổng thể mắt, tai, nướu, tim phổi, cân nặng và tầm soát ký sinh trùng.'
    },
    {
      id: 'srv_spa_clean',
      name: 'Vệ Sinh Tai & Cắt Móng Spa',
      category: 'Dịch vụ chăm sóc ngoại khoa',
      price: '90.000đ',
      icon: '✨',
      actionText: '+ Đặt lịch',
      desc: 'Vệ sinh tai khử mùi hôi ngừa ve rận tai, cắt mài móng gọn gàng không phạm tủy.'
    }
  ]
};

// Hàm tự động nhận diện thẻ gợi ý phù hợp với ngữ cảnh hội thoại
const detectSuggestedCards = (text) => {
  const lower = (text || '').toLowerCase();
  // Tránh nhận diện nhầm "hành vi" thành "hành" gây cảnh báo ngộ độc sai
  const hasOnionToxicity = /(?:^|\s|[.,!?;])(hành|củ hành|hành tây|hành lá)(?:$|\s|[.,!?;])/i.test(lower) && !lower.includes('hành vi');

  if (lower.includes('socola') || lower.includes('ngộ độc') || hasOnionToxicity || lower.includes('cấp cứu') || lower.includes('nguy hiểm') || lower.includes('khẩn cấp') || lower.includes('nuốt')) {
    return SUGGESTED_CARDS_DATABASE.emergency;
  }
  if (lower.includes('nôn') || lower.includes('tiêu chảy') || lower.includes('bỏ ăn') || lower.includes('dạ dày') || lower.includes('phân') || lower.includes('ruột') || lower.includes('bụng')) {
    return SUGGESTED_CARDS_DATABASE.digestive;
  }
  if (lower.includes('tiêm') || lower.includes('vắc-xin') || lower.includes('tẩy giun') || lower.includes('ve') || lower.includes('rận') || lower.includes('ghẻ') || lower.includes('bọ')) {
    return SUGGESTED_CARDS_DATABASE.vaccine;
  }
  if (lower.includes('dinh dưỡng') || lower.includes('dị ứng') || lower.includes('thịt bò') || lower.includes('hạt') || lower.includes('gầy') || lower.includes('cân') || lower.includes('pate')) {
    return SUGGESTED_CARDS_DATABASE.nutrition;
  }
  return SUGGESTED_CARDS_DATABASE.general;
};

// =========================================================================
// BỘ RENDER VĂN BẢN MARKDOWN CYBERPUNK (DR. PAW FORMATTER)
// =========================================================================
const FormattedAiMessage = ({ text }) => {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-0.5" />;
        }

        // 1. Blockquote / Alert callout (> ...)
        if (trimmed.startsWith('>')) {
          const content = trimmed.substring(1).trim();
          return (
            <div 
              key={idx}
              className="p-2.5 my-1.5 rounded-xl bg-purple-500/10 border-l-2 border-purple-400 text-purple-200 text-xs font-medium flex items-start gap-2 shadow-xs"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
              <div>{renderInlineFormat(content)}</div>
            </div>
          );
        }

        // 2. Header 3 (### )
        if (trimmed.startsWith('###')) {
          const headerText = trimmed.replace(/^###\s*/, '');
          let badgeColor = 'from-purple-600 to-indigo-600 text-white';
          let icon = <Stethoscope className="w-3.5 h-3.5" />;

          if (headerText.includes('1.') || headerText.includes('Đánh giá')) {
            badgeColor = 'from-purple-600 to-indigo-500 text-white';
            icon = <Stethoscope className="w-3.5 h-3.5" />;
          } else if (headerText.includes('2.') || headerText.includes('Hướng dẫn') || headerText.includes('Sơ cứu')) {
            badgeColor = 'from-emerald-600 to-teal-500 text-white';
            icon = <HeartPulse className="w-3.5 h-3.5" />;
          } else if (headerText.includes('3.') || headerText.includes('nguy hiểm') || headerText.includes('Cấp cứu')) {
            badgeColor = 'from-rose-600 to-red-500 text-white';
            icon = <ShieldAlert className="w-3.5 h-3.5" />;
          }

          return (
            <div key={idx} className="pt-2 pb-0.5">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-black bg-gradient-to-r ${badgeColor} shadow-xs mb-1`}>
                {icon}
                <span>{headerText}</span>
              </div>
            </div>
          );
        }

        // 3. Bullet points & Emojis
        if (
          trimmed.startsWith('- ') || 
          trimmed.startsWith('• ') || 
          trimmed.startsWith('* ') || 
          trimmed.startsWith('📌') || 
          trimmed.startsWith('🩺') || 
          trimmed.startsWith('⚠️') || 
          trimmed.startsWith('🩹') || 
          trimmed.startsWith('🚨')
        ) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0 mt-1.5" />
              <div className="flex-1 text-slate-200">
                {renderInlineFormat(trimmed.replace(/^[-•*]\s*/, ''))}
              </div>
            </div>
          );
        }

        // 4. Numbered item (1. , 2. ...)
        const numMatch = trimmed.match(/^(\d+)\.\s*(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const rest = numMatch[2];
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1.5">
              <span className="w-4 h-4 rounded-full bg-purple-900/60 border border-purple-500/30 text-purple-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                {num}
              </span>
              <div className="flex-1 text-slate-200">
                {renderInlineFormat(rest)}
              </div>
            </div>
          );
        }

        // 5. Đoạn văn thường
        return (
          <p key={idx} className="text-slate-200">
            {renderInlineFormat(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

// Helper format in đậm và in nghiêng
const renderInlineFormat = (text) => {
  if (!text) return '';
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return (
        <em key={index} className="italic text-purple-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

// =========================================================================
// BỘ DỮ LIỆU CƠ SỞ TRI THỨC DR. PAW (Q&A KNOWLEDGE BASE CHUẨN Y KHOA)
// =========================================================================
const DR_PAW_KNOWLEDGE_BASE = [
  // CHỦ ĐỀ 1: ĐỊA CHỈ PHÒNG KHÁM & BỆNH VIỆN THÚ Y
  {
    id: 'clinic_locations',
    category: 'ĐỊA CHỈ PHÒNG KHÁM & BỆNH VIỆN THÚ Y',
    keywords: [
      'địa chỉ', 'dia chi', 'ở đâu', 'o dau', 'phòng khám', 'phong kham', 
      'bệnh viện thú y', 'benh vien thu y', 'bác sĩ thú y', 'bac si thu y', 
      'cấp cứu 24/7', 'cap cuu 24/7', 'cap cuu', 'chỗ khám gần đây', 'cho kham gan day',
      'phong kham gan nhat', 'phòng khám gần nhất', 'trung tâm thú y', 'trung tam thu y',
      'bệnh viện gần nhất', 'benh vien gan day'
    ],
    cardCategory: 'emergency',
    getResponse: () => `### 🏥 DANH SÁCH BỆNH VIỆN & PHÒNG KHÁM THÚ Y UY TÍN 24/7

Dưới đây là danh sách các cơ sở thú y uy tín hàng đầu trong mạng lưới đối tác **PetCare PRO AI**, được trang bị đầy đủ hệ thống chẩn đoán hình ảnh kỹ thuật số, phòng mổ vô trùng và cấp cứu hồi sức:

1. **🏥 Bệnh viện Thú y PetHealth (Cấp Cứu 24/7)**
   - 📍 **Địa chỉ:** 262 Quang Trung, Hà Đông, Hà Nội.
   - ☎️ **Hotline cấp cứu 24/7:** **1900 6868** (Nhánh 1).
   - 🩺 **Chuyên môn:** Cấp cứu hồi sức, phẫu thuật ngoại khoa, xét nghiệm sinh hóa/huyết học tự động, tiêm chủng vắc-xin chuẩn WSAVA.

2. **🐰 Phòng khám Sammi Animal Clinic (Chuyên Thú Nhỏ & Thỏ)**
   - 📍 **Địa chỉ:** KĐT Văn Khê, La Khê, Hà Đông, Hà Nội.
   - ☎️ **Hotline:** **024 2242 8882**.
   - 🩺 **Chuyên môn:** Chuyên khoa khám & mài răng thỏ/bọ ú, siêu âm ổ bụng tổng quát, điều trị da liễu & nấm vi sinh.

3. **🔬 Bệnh viện Thú y 2Vet**
   - 📍 **Địa chỉ:** 335 Hoàng Công Chất, Bắc Từ Liêm, Hà Nội (và mạng lưới chi nhánh).
   - ☎️ **Hotline:** **098 632 8588**.
   - 🩺 **Chuyên môn:** Chụp X-quang kỹ thuật số, chẩn đoán hình ảnh chuyên sâu, điều trị nội trú truyền dịch và xét nghiệm sinh học phân tử PCR.

4. **✨ Paddy Pet Care & Clinic**
   - 📍 **Địa chỉ:** 168 Nguyễn Thị Thập, P. Bình Thuận, Quận 7, TP.HCM.
   - ☎️ **Hotline:** **086 740 8899**.
   - 🩺 **Chuyên môn:** Dịch vụ Grooming & Spa y tế, tắm trị nấm ngứa kẽ móng, vắt vệ sinh tuyến hôi, cắt mài móng chuẩn y khoa.

> 🚨 **CẢNH BÁO CẤP CỨU:** Nếu thú cưng xuất hiện triệu chứng hôn mê, co giật liên tục, sốc nhiệt hoặc hóc dị vật khó thở, vui lòng gọi ngay Hotline **1900 6868** trước khi di chuyển để kíp trực chuẩn bị lồng ấp oxy sẵn sàng!`
  },

  // CHỦ ĐỀ 2: DINH DƯỠNG & DỊ ỨNG THỊT BÒ
  {
    id: 'beef_allergy_nutrition',
    category: 'DINH DƯỠNG & DỊ ỨNG THỊT BÒ',
    keywords: [
      'thịt bò', 'thit bo', 'dị ứng', 'di ung', 'thức ăn cho cún dị ứng', 'thuc an cho cun di ung', 
      'thực đơn', 'thuc don', 'ăn gì', 'an gi', 'đổi hạt', 'doi hat',
      'dị ứng thịt bò', 'di ung thit bo', 'thịt gì thay bò', 'thit gi thay bo'
    ],
    cardCategory: 'nutrition',
    getResponse: (pet) => {
      const petName = pet?.name || 'thú cưng';
      const weightStr = pet?.weight ? ` (${pet.weight} KG)` : '';
      return `### 🥩 PHÁC ĐỒ DINH DƯỠNG ĐẶC BIỆT: LOẠI TRỪ ĐẠM BÒ CHO ${petName.toUpperCase()}${weightStr}

Hồ sơ y bạ ghi nhận **${petName}** có tiền sử **dị ứng nhẹ với đạm thịt bò** (triệu chứng ngứa kẽ móng, đỏ vành tai hoặc phân sống nhão khi ăn phải). Dưới đây là giải pháp dinh dưỡng thay thế chuẩn y khoa:

#### 1. 🐟 Nguồn Đạm Thay Thế Lành Tính & An Toàn:
- **Thịt cừu (Lamb):** Rất lành tính với hệ miễn dịch đường ruột, giàu kẽm hữu cơ và vitamin B12 mà không kích hoạt dị ứng.
- **Cá hồi đại dương (Salmon):** Nguồn đạm thượng hạng dồi dào **Omega-3 & Omega-6 (DHA/EPA)**, giúp dập tắt phản ứng viêm ngứa ngoài da và nuôi dưỡng bộ lông mượt mà.
- **Thịt gà luộc không gia vị:** Nạc ức gà xé nhỏ luộc chín kỹ, loại bỏ hoàn toàn da và mỡ thừa.
- **Trứng gà luộc:** Bổ sung **1 - 2 quả/tuần**, cung cấp choline và lecithin củng cố sức đề kháng.

#### 2. 🥣 Gợi Ý Các Dòng Hạt Chống Dị Ứng (Hypoallergenic):
- **Royal Canin Hypoallergenic:** Chứa protein đậu nành thủy phân phân tử siêu nhỏ, đường ruột hấp thu trực tiếp không gây phản ứng miễn dịch.
- **Orijen Six Fish:** 85% từ 6 loại cá tươi đại dương đánh bắt tự nhiên, 0% thịt gia súc đỏ.
- **Taste of the Wild Pacific Stream:** Công thức cá hồi xông khói không chứa ngũ cốc (Grain-Free), hỗ trợ tiêu hóa nhạy cảm.

#### 3. ⚠️ CẢNH BÁO NGUY HIỂM TUYỆT ĐỐI:
- **KHÔNG** cho chan nước phở bò, nước hầm xương bò (chứa protein bò cô đặc và muối gia vị làm bùng phát ngứa cấp).
- **KHÔNG** dùng các loại bánh thưởng (treats) trôi nổi vì đa số chứa bột huyết bò hoặc mỡ bò phụ gia.`;
    }
  },

  // CHỦ ĐỀ 3: CÁC THỰC PHẨM CẤM NGUY HIỂM TUYỆT ĐỐI
  {
    id: 'forbidden_foods',
    category: 'CÁC THỰC PHẨM CẤM NGUY HIỂM TUYỆT ĐỐI',
    keywords: [
      'không được ăn gì', 'khong duoc an gi', 'thực phẩm cấm', 'thuc pham cam', 'nguy hiểm', 'nguy hiem', 
      'độc hại', 'doc hai', 'trái cây nào cấm', 'trai cay nao cam', 'chó không được ăn gì', 
      'mèo không được ăn gì', 'thức ăn nguy hiểm', 'đồ ăn cấm'
    ],
    cardCategory: 'emergency',
    getResponse: () => `### 🚫 DANH MỤC THỰC PHẨM CẤM KỴ NGUY HIỂM TUYỆT ĐỐI CHO CHÓ MÈO

Hệ thống enzym chuyển hóa của thú cưng không thể xử lý các hợp chất sau, có thể gây ngộ độc kịch phát hoặc tử vong nhanh chóng:

1. **🧅 Hành tây, Tỏi, Hành lá & Hẹ:**
   - *Tác hại:* Chứa **N-propyl disulfide** phá hủy cấu trúc màng hồng cầu, gây thiếu máu tán huyết cấp tính (Heinz Body Anemia). Nước tiểu có màu xá xị, thú cưng thở dốc kiệt sức.

2. **🍇 Nho tươi & Nho khô (Raisins):**
   - *Tác hại:* Chứa dẫn xuất Tartaric acid gây suy thận cấp tính vô niệu chỉ sau **24 - 48 giờ**. Thậm chí chỉ **1 - 2 quả nho khô** cũng đủ gây nguy kịch cho thú cưng!

3. **🍬 Đường hóa học Xylitol (Trong kẹo cao su, bơ đậu phộng, bánh ăn kiêng):**
   - *Tác hại:* Khiến tuyến tụy phóng thích ồ ạt insulin làm đường huyết tụt dốc thảm khốc, dẫn đến co giật hôn mê và hoại tử tế bào gan cấp tính.

4. **🍗 Xương gà, xương vịt nấu chín:**
   - *Tác hại:* Khi nấu chín, canxi mất liên kết dẻo và vỡ thành các mảnh nhọn sắc nhọn như dao găm, dễ đâm thủng thực quản, rách niêm mạc dạ dày hoặc tắc ruột hoại tử cần mổ cấp cứu.

5. **☕ Cà phê, Trà xanh & Rượu bia:**
   - *Tác hại:* Caffeine và cồn Ethanol kích thích quá mức hệ thần kinh trung ương, gây rung nhĩ thất, tăng huyết áp ác tính và ngừng tim.

> 💡 *Nếu nghi ngờ bé vừa ăn phải bất kỳ thực phẩm nào trên đây, hãy liên hệ ngay trạm thú y gần nhất trong vòng 30 phút đầu để can thiệp kịp thời!*`
  },

  // CHỦ ĐỀ 4: SƠ CỨU KHI ĂN PHẢI SOCOLA
  {
    id: 'chocolate_poisoning',
    category: 'SƠ CỨU KHI ĂN PHẢI SOCOLA',
    keywords: [
      'socola', 'chocolate', 'ăn phải socola', 'an phai socola', 'ngộ độc bánh ngọt', 
      'theobromine', 'chó ăn socola', 'mèo ăn socola', 'socola đen', 'sơ cứu socola'
    ],
    cardCategory: 'emergency',
    getResponse: (pet) => {
      const petWeight = pet?.weight || 24.5;
      return `### 🍫 PHÁC ĐỒ SƠ CỨU KHẨN CẤP: NGỘ ĐỘC SOCOLA (THEOBROMINE)

Hoạt chất **Theobromine** trong hạt cacao phân giải cực kỳ chậm trong cơ thể thú cưng (thời gian bán hủy lên tới 17.5 giờ), gây co thắt cơ tim và kích thích thần kinh quá mức.

#### 1. 📊 Phân Loại Mức Độ Độc Tính:
- **Socola đen (Dark Chocolate 70-85%) & Bột Cacao:** Độc tính **cao gấp 3 - 4 lần** socola sữa.
- **Ngưỡng nguy hiểm:** Đối với bé cân nặng **~${petWeight} kg**, ăn từ **30 - 40g** socola đen nguyên chất hoặc **150g** socola sữa đã bắt đầu rơi vào tình trạng ngộ độc tim mạch.

#### 2. ⏱️ Các Bước Sơ Cứu Chuẩn Y Khoa Theo Khung Giờ Vàng:
- **Giai đoạn 30 - 60 phút đầu (Khi socola còn trong dạ dày):**
  - **TUYỆT ĐỐI KHÔNG** dùng tay móc họng thô bạo (dễ gây hít sặc dịch nôn vào phổi làm nghẹt thở).
  - Liên hệ thú y gần nhất để hướng dẫn gây nôn y tế (bằng dung dịch Oxy già Hydrogen Peroxide 3% chuẩn liều hoặc tiêm thuốc Apomorphine tại phòng khám).
- **Giai đoạn sau 2 giờ (Chất độc đã ngấm vào ruột):**
  - Cần đưa ngay đến cơ sở thú y để cho uống **Than hoạt tính (Activated Charcoal)** liều 1 - 2g/kg nhằm khóa các phân tử Theobromine tự do.
  - Tiến hành truyền dịch tĩnh mạch liên tục (IV Fluids) để tăng tốc độ bài tiết qua thận và chống rối loạn nhịp tim.

> 🚨 **Hotline Cấp Cứu Thú Y 24/7:** Gọi ngay **1900 6868** nếu bé có dấu hiệu thở dốc, run rẩy bắp cơ, nhịp tim đập loạn xạ hoặc nôn mửa liên tục!`;
    }
  },

  // CHỦ ĐỀ 5: NÔN MỬA, BỎ ĂN, TIÊU CHẢY
  {
    id: 'vomiting_diarrhea',
    category: 'NÔN MỬA, BỎ ĂN, TIÊU CHẢY',
    keywords: [
      'nôn', 'non', 'nôn bọt trắng', 'non bot trang', 'nôn bọt vàng', 'non bot vang', 
      'bỏ ăn', 'bo an', 'tiêu chảy', 'tieu chay', 'sốt', 'sot', 'đau bụng', 'dau bung', 
      'chó nôn', 'mèo nôn', 'ỉa chảy', 'ia chay', 'đi ngoài', 'nôn mửa', 'non mua', 'chán ăn', 'chan an'
    ],
    cardCategory: 'digestive',
    getResponse: (pet) => {
      const petName = pet?.name || 'bé cưng';
      return `### 🤢 CẢNH BÁO NGUY HIỂM & SƠ CỨU CẤP TÍNH: NÔN MỬA, BỎ ĂN Ở ${petName.toUpperCase()}

Chào bạn! Nôn mửa kèm bỏ ăn là triệu chứng cấp tính cần theo dõi sát sao vì cơ thể thú cưng mất nước rất nhanh:

#### 1. 🚨 CẢNH BÁO CÁC DẤU HIỆU NGUY HIỂM (BÁO ĐỘNG ĐỎ):
Cần đưa bé đi cấp cứu ngay lập tức nếu xuất hiện một trong các dấu hiệu sau:
- Bé nôn **trên 2 - 3 lần/ngày**, nôn khan liên tục hoặc nôn ra dịch bọt vàng, dịch nâu sẫm / lẫn máu tươi.
- Kèm tiêu chảy phân lỏng bắn tia, phân tanh khẳm (nguy cơ viêm ruột truyền nhiễm do Parvovirus, Care ở chó hoặc FPV ở mèo).
- Thân nhiệt **sốt cao trên 39.5°C** hoặc **hạ thân nhiệt dưới 37.5°C** (dấu hiệu sốc mất nước, suy kiệt).
- Bụng căng cứng, chướng hơi, đau đớn khi chạm vào (nguy cơ xoắn dạ dày GDV hoặc hóc dị vật đường tiêu hóa).

#### 2. 💧 HƯỚNG DẪN BÙ NƯỚC ĐIỆN GIẢI & CHĂM SÓC TẠI NHÀ:
- **Tạm ngưng thức ăn đặc:** Cho dạ dày nghỉ ngơi từ **6 - 8 tiếng**, không ép ăn hạt hay thịt để giảm kích ứng dạ dày.
- **Bù nước và điện giải khẩn cấp:** 
  - Pha dung dịch **Oresol** đúng tỉ lệ chuẩn với nước đun sôi để nguội.
  - Dùng xi-lanh bơm từng ngụm nhỏ **5 - 10ml mỗi 30 - 45 phút** vào mép miệng bé. Tránh cho uống dồn dập vì sẽ kích thích nôn ngược.
- **Bổ sung men vi sinh:** Sau khi dứt nôn 4 tiếng, cho uống men tiêu hóa lợi khuẩn (*Bio-Scour Pet / Probio Pet*) giúp phục hồi niêm mạc ruột.
- **Lưu ý:** Tuyệt đối **KHÔNG** tự ý cho uống thuốc hạ sốt, giảm đau của người (*như Paracetamol, Aspirin*) vì gây suy gan thận cấp dẫn đến tử vong.

#### 3. 🏥 ĐỀ XUẤT ĐẶT LỊCH KHÁM GẤP TẠI PETCARE CHI NHÁNH CẦU GIẤY:
- Nếu bé tiếp tục nôn mửa sau 6 tiếng hoặc lừ đừ không uống được nước:
- 👉 **Đề xuất bạn bấm "+ Đặt Lịch Khám" ngay trên ứng dụng** hoặc đưa bé đến **Phòng khám PetCare Chi nhánh Cầu Giấy (Phòng khám 02)** để bác sĩ tiêm thuốc chống nôn Cerenia, truyền dịch tĩnh mạch và làm test nhanh virus!`;
    }
  },

  // CHỦ ĐỀ 6: VE RẬN, BỌ CHÉT, RỤNG LÔNG, NẤM DA
  {
    id: 'parasites_skin_fungus',
    category: 'VE RẬN, BỌ CHÉT, RỤNG LÔNG, NẤM DA',
    keywords: [
      've rận', 've ran', 've', 'rận', 'ran', 'bọ chét', 'bo chet', 'ngứa', 'ngua', 
      'rụng lông', 'rung long', 'nấm', 'nam', 'nấm da', 'nam da', 'ghẻ', 'ghe', 
      'gãi liên tục', 'gai lien tuc', 'trị ve', 'tri ve', 'viêm da', 'viem da', 
      'rận tai', 'ran tai', 'vảy trắng', 'vay trang', 'nấm da chó', 'nấm da mèo'
    ],
    cardCategory: 'general',
    getResponse: (pet) => {
      const petName = pet?.name || 'bé cưng';
      return `### 🦟 HƯỚNG DẪN ĐIỀU TRỊ NẤM DA, VE RẬN & BỌ CHÉT CHO ${petName.toUpperCase()}

Chào bạn! Nấm da và ve rận là các bệnh da liễu ngoại ký sinh trùng rất phổ biến nhưng cần điều trị đúng phác đồ để tránh lây lan toàn thân hoặc lây sang người:

#### 1. 🧼 HƯỚNG DẪN VỆ SINH VÙNG DA & CHUỒNG TRẠI:
- **Làm sạch tổn thương:** Dùng gạc y tế thấm **nước muối sinh lý (NaCl 0.9%)** hoặc dung dịch **Povidone Iodine pha loãng tỉ lệ 1:10** lau sạch vảy gàu, chất nhờn và bụi bẩn quanh vùng nấm 2 lần/ngày.
- **Vệ sinh môi trường sống:** Giặt sạch nệm, thảm và đệm nằm bằng nước nóng trên 60°C. Phun xịt khử trùng chuồng trại bằng dung dịch Hantox-200 hoặc Chlorhexidine để tiêu diệt trứng ve và bào tử nấm ẩn nấp.
- **Giữ da khô thoáng:** Sau khi vệ sinh hoặc tắm, dùng máy sấy chế độ gió mát để **sấy thật khô tận chân lông**, tuyệt đối không để lông ẩm ướt làm nấm bùng phát.

#### 2. 💊 BÔI THUỐC SÁT KHUẨN & PHÁC ĐỒ ĐIỀU TRỊ:
- **Bôi kem kháng nấm & sát khuẩn:** Thoa một lớp mỏng kem **Fungikur** hoặc thuốc mỡ **Ketoconazole / Miconazole** 2 lần/ngày từ ngoài rìa vết nấm vào trong tâm.
- **Tiêu diệt ve rận tận gốc:**
  - *Với chó:* Dùng viên nhai diệt ký sinh trùng thế hệ mới (**NexGard / Simparica / Bravecto**) - tác dụng diệt sạch ve rận, bọ chét và ghẻ Demodex/Sarcoptes chỉ sau 12 - 24 giờ.
  - *Với mèo:* Nhỏ gáy định kỳ bằng **Revolution Plus** hoặc **Broadline** vào vị trí gáy sau đầu nơi mèo không thể liếm được.
- **Đeo loa chống liếm (vòng cổ Elizabeth):** Bắt buộc đeo vòng chống liếm 24/24 để ngăn bé liếm phải thuốc bôi hoặc cào gãi làm loét da nhiễm trùng thứ phát.

#### 3. 🏥 KHUYÊN ĐẾN PHÒNG KHÁM PETCARE CHI NHÁNH CẦU GIẤY:
- Nếu mảng nấm lan rộng trên 2 vị trí, rụng lông mảng lớn hoặc bé gãi chảy máu:
- 👉 **Khuyên bạn đưa bé đến Phòng khám PetCare Chi nhánh Cầu Giấy (Phòng khám 02 - Hotline: 024 3838 6688)** để các bác sĩ:
  - Cạo vảy da soi tươi dưới kính hiển vi và soi đèn Wood xác định chính xác chủng nấm (*Microsporum canis* hay *Trichophyton*).
  - Tắm bồn sục Ozone trị liệu da liễu và kê đơn kháng nấm đường uống chuẩn liều an toàn cho gan thận của ${petName}!`;
    }
  },

  // CHỦ ĐỀ 7: CHĂM SÓC MÈO LUNA (BÚI LÔNG & HỆ TIẾT NIỆU)
  {
    id: 'cat_luna_care',
    category: 'CHĂM SÓC MÈO LUNA (BÚI LÔNG & HỆ TIẾT NIỆU)',
    keywords: [
      'luna', 'mèo', 'meo', 'búi lông', 'bui long', 'pate cá hồi', 'pate ca hoi', 
      'uống ít nước', 'uong it nuoc', 'tiểu rắt', 'tieu rat', 'cát vệ sinh', 'cat ve sinh',
      'hairball', 'sỏi thận mèo', 'chăm sóc mèo', 'cham soc meo'
    ],
    cardCategory: 'nutrition',
    getResponse: () => `### 🐱 CẨM NANG CHĂM SÓC CHUYÊN BIỆT DÀNH CHO BÉ MÈO LUNA

Mèo cưng có tập tính liếm lông làm sạch thường xuyên và cơ chế khát nước rất kém. Dưới đây là 3 điểm cốt lõi để bảo vệ sức khỏe cho bé Luna:

#### 1. 🧶 Kiểm Soát & Đào Thải Búi Lông (Hairball Control):
- Gai lưỡi mèo liên tục cuốn lông rụng vào dạ dày tạo thành búi lông tắc nghẽn đường ruột.
- **Giải pháp:** Cho ăn **Gel tiêu búi lông (GimCat Hairball / Nourse)** liều **3cm/lần**, dùng đều đặn **2 - 3 lần/tuần**.
- Trồng thêm khay **cỏ mèo tươi (Cat Grass)** cung cấp chất xơ tự nhiên kích thích tống khứ búi lông ra ngoài qua đường phân hoặc nôn tự nhiên an toàn.

#### 2. 💧 Phòng Ngừa Sỏi Thận & Hội Chứng Tiết Niệu (FLUTD):
- Mèo có nguồn gốc sa mạc nên rất ít khi chủ động uống nước tĩnh trong bát.
- **Giải pháp:**
  - Trang bị **Đài phun nước tự động tuần hoàn** với màng lọc than hoạt tính để thu hút bản năng tò mò uống nước của mèo.
  - Tăng cường cữ ăn **Pate cá hồi / súp thưởng ngậm nước**, có thể pha thêm 15 - 20ml nước ấm vào mỗi bữa ăn ướt.

#### 3. 🚽 Vệ Sinh Khay Cát:
- Dọn dẹp khay cát vệ sinh **ít nhất 2 lần/ngày** để tránh mèo nhịn tiểu gây viêm bàng quang.
- Quan sát viên vón nước tiểu: Nếu kích thước viên tiểu nhỏ bất thường, hoặc bé ngồi rặn buốt, kêu khóc khi đi vệ sinh -> Đưa đi siêu âm bàng quang tầm soát sỏi Struvite ngay lập tức!`
  },

  // CHỦ ĐỀ 8: CHĂM SÓC THỎ CẢNH (MINILOP)
  {
    id: 'rabbit_care_minilop',
    category: 'CHĂM SÓC THỎ CẢNH (MINILOP)',
    keywords: [
      'thỏ', 'tho', 'cỏ timothy', 'co timothy', 
      'đình trệ dạ dày', 'dinh tre da day', 'mài răng', 'mai rang', 'chải lông', 
      'chai long', 'gi stasis', 'thỏ ăn gì', 'tho an gi', 'thỏ minilop'
    ],
    cardCategory: 'general',
    getResponse: () => `### 🐰 HƯỚNG DẪN CHĂM SÓC CHUYÊN SÂU: THỎ CẢNH (DÒNG MINILOP)

Hệ tiêu hóa của loài thỏ là hệ thống lên men manh tràng cực kỳ mỏng manh và phụ thuộc hoàn toàn vào chất xơ thô:

#### 1. 🌾 Tỷ Lệ Vàng Trong Khẩu Phần Ăn:
- **85% Cỏ khô Timothy:** Phải luôn có sẵn **24/7** trong máng ăn. Lượng xơ dài dồi dào là yếu tố sống còn kích thích ruột co bóp và mài mòn 28 chiếc răng liên tục dài ra trong suốt cuộc đời thỏ.
- **10% Rau xanh tươi sạch:** Xà lách Romaine, rau mùi, lá bạc hà (phải rửa thật sạch và **để thật ráo nước** trước khi cho ăn để ngừa sinh hơi tiêu chảy).
- **5% Hạt nén chuyên dụng (Pellets):** Chỉ cho ăn từ 1 - 2 muỗng canh/ngày, tuyệt đối không cho ăn hạt ngũ cốc trộn có đường.

#### 2. 🚨 Cảnh Báo Khẩn: Hội Chứng Đình Trệ Dạ Dày (GI Stasis):
- Thỏ không có phản xạ nôn ói. Khi nuốt phải lông rụng hoặc stress làm ruột ngưng nhu động:
- **DẤU HIỆU CẤP CỨU:** Thỏ bỏ ăn, nằm thu lu ép bụng xuống sàn, **không đi phân trong vòng 10 - 12 giờ**.
- Cần đưa ngay đến phòng khám chuyên khoa thú nhỏ (Exotic Pets) để được tiêm thuốc kích nhu động ruột, bù điện giải ấm và mớm thức ăn phục hồi Critical Care.

#### 3. ✂️ Chải Lông & Chăm Sóc Răng Miệng:
- Chải lông đều đặn **2 ngày/lần** (đặc biệt trong mùa thay lông).
- Cung cấp cành gỗ táo sấy sạch hoặc đồ chơi gặm nhấm để mài răng cửa, tránh răng mọc lệch đâm loét nướu.`
  },

  // CHỦ ĐỀ 9: LỊCH TIÊM VẮC-XIN & TẨY GIUN CHUẨN
  {
    id: 'vaccine_deworm_schedule',
    category: 'LỊCH TIÊM VẮC-XIN & TẨY GIUN CHUẨN',
    keywords: [
      'tiêm phòng', 'tiem phong', 'vắc xin', 'vac xin', 'vắc-xin', 'vac-xin', 'tiêm dại', 'tiem dai', 
      '7 bệnh', '7 benh', 'tẩy giun', 'tay giun', 'mũi nhắc lại', 'mui nhac lai', 
      'lịch tiêm', 'lich tiem', 'chích ngừa', 'chich ngua', 'sổ tiêm', 'tiêm', 'tiem',
      'phòng dại', 'phong dai', 'rabies', 'vắc xin 7 bệnh', 'vac xin 7 benh', 'tiêm chủng', 'tiem chung'
    ],
    cardCategory: 'vaccine',
    getResponse: () => `### 💉 PHÁC ĐỒ TIÊM PHÒNG VẮC-XIN & TẨY GIUN ĐỊNH KỲ (CHUẨN WSAVA)

Tiêm phòng chủ động là tấm lá chắn duy nhất bảo vệ thú cưng khỏi các bệnh truyền nhiễm virus có tỷ lệ tử vong lên đến 90%:

#### 1. 🐕 Phác Đồ Tiêm & Tẩy Giun Cho Chó:
- **Chó con (từ 6 - 8 tuần tuổi):**
  - *Mũi 1 (6-8 tuần):* Vắc-xin 5 bệnh (Care, Parvo, Viêm gan truyền nhiễm, Ho cũi chó, Phó cúm).
  - *Mũi 2 (10-12 tuần):* Vắc-xin 7 bệnh (Bổ sung thêm 2 chủng vi khuẩn Leptospira).
  - *Mũi 3 (14-16 tuần):* Vắc-xin 7 bệnh nhắc lại + **Vắc-xin phòng Bệnh Dại (Rabies)**.
- **Chó trưởng thành (Định kỳ hàng năm):**
  - Tiêm nhắc lại **1 năm/lần**: Gồm **1 mũi Vắc-xin 7 bệnh** (Zoetis/Nobivac) + **1 mũi Vắc-xin Dại**.
- **Lịch tẩy giun:** Dùng thuốc tẩy giun chuyên dụng (*Drontal Plus, Sanpet, Endogard*) định kỳ **3 tháng/lần** theo đúng cân nặng vào buổi sáng lúc đói.

#### 2. 🐈 Phác Đồ Tiêm & Tẩy Giun Cho Mèo:
- **Mèo con:** Tiêm 3 mũi Vắc-xin 4 bệnh (FPV Giảm bạch cầu, Calicivirus, Herpesvirus, Chlamydia) cách nhau 3 - 4 tuần + 1 mũi Vắc-xin Dại lúc 16 tuần.
- **Mèo trưởng thành:** Tiêm nhắc lại **1 năm/lần** (1 mũi 4 bệnh + 1 mũi Dại).
- **Tẩy giun:** Uống viên tẩy giun Drontal for Cats hoặc nhỏ gáy Broadline định kỳ **3 tháng/lần**.

> 📅 *Bạn có thể theo dõi và đặt lịch hẹn tiêm phòng ngay tại mục **"Lịch trình & Nhắc nhở"** của PetCare PRO AI để không bao giờ quên lịch nhắc lại nhé!*`
  }
];

// =========================================================================
// THUẬT TOÁN TÌM KIẾM TƯƠNG ĐỒNG & KHỚP TỪ KHÓA THÔNG MINH (KEYWORD MATCHING)
// =========================================================================
const findKnowledgeBaseMatch = (userQuery, petContext = null) => {
  if (!userQuery || typeof userQuery !== 'string') return null;

  // Chuẩn hóa câu hỏi về chữ thường và xóa khoảng trắng thừa
  const normalizedQuery = userQuery.toLowerCase().trim();

  let bestMatch = null;
  let highestScore = 0;

  for (const item of DR_PAW_KNOWLEDGE_BASE) {
    let score = 0;
    for (const kw of item.keywords) {
      const lowerKw = kw.toLowerCase().trim();
      if (!lowerKw) continue;

      // Với các từ khóa ngắn (<= 3 ký tự), kiểm tra ranh giới từ để tránh khớp nhầm
      if (lowerKw.length <= 3) {
        const wordRegex = new RegExp(`(^|[\\s,.!?;:])${lowerKw}([\\s,.!?;:]|$)`, 'i');
        if (wordRegex.test(normalizedQuery)) {
          score += lowerKw.length * 3;
        }
      } else {
        if (normalizedQuery.includes(lowerKw)) {
          // Điểm số tính theo độ dài từ khóa (từ khóa càng dài điểm càng cao, khớp chính xác)
          score += lowerKw.length * 2;
        }
      }
    }

    if (score > highestScore && score >= 4) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch) {
    const cardList = SUGGESTED_CARDS_DATABASE[bestMatch.cardCategory] || SUGGESTED_CARDS_DATABASE.general;
    return {
      id: bestMatch.id,
      category: bestMatch.category,
      text: bestMatch.getResponse(petContext),
      suggestedCards: cardList
    };
  }

  return null;
};

// =========================================================================
// PHẢN HỒI ĐẶC TRƯNG DR. PAW KHI CÂU HỎI NẰM NGOÀI DANH MỤC CƠ SỞ TRI THỨC
// =========================================================================
const getOutOfScopeResponse = (userMessage, selectedPet) => {
  const lowerMsg = (userMessage || '').toLowerCase();

  // 1. DỰ PHÒNG SMART MOCK: Khi hỏi về Nôn mửa / Bỏ ăn / Tiêu chảy
  if (
    lowerMsg.includes('nôn') || lowerMsg.includes('non') || 
    lowerMsg.includes('bỏ ăn') || lowerMsg.includes('bo an') || 
    lowerMsg.includes('tiêu chảy') || lowerMsg.includes('tieu chay') ||
    lowerMsg.includes('ỉa') || lowerMsg.includes('ia') ||
    lowerMsg.includes('chán ăn') || lowerMsg.includes('chan an')
  ) {
    const topic5 = DR_PAW_KNOWLEDGE_BASE.find(t => t.id === 'vomiting_diarrhea');
    if (topic5) return topic5.getResponse(selectedPet);
  }

  // 2. DỰ PHÒNG SMART MOCK: Khi hỏi về Nấm / Ve rận / Bọ chét / Ghẻ ngứa
  if (
    lowerMsg.includes('nấm') || lowerMsg.includes('nam') || 
    lowerMsg.includes('ve') || lowerMsg.includes('rận') || lowerMsg.includes('ran') || 
    lowerMsg.includes('bọ chét') || lowerMsg.includes('bo chet') || 
    lowerMsg.includes('ghẻ') || lowerMsg.includes('ghe') ||
    lowerMsg.includes('ngứa') || lowerMsg.includes('ngua') ||
    lowerMsg.includes('rụng lông') || lowerMsg.includes('rung long')
  ) {
    const topic6 = DR_PAW_KNOWLEDGE_BASE.find(t => t.id === 'parasites_skin_fungus');
    if (topic6) return topic6.getResponse(selectedPet);
  }

  // 3. DỰ PHÒNG SMART MOCK: Khi hỏi về Tiêm phòng / Vắc-xin / Bệnh Dại / 7 bệnh chuẩn WSAVA
  if (
    lowerMsg.includes('tiêm') || lowerMsg.includes('tiem') || 
    lowerMsg.includes('vắc') || lowerMsg.includes('vac') || 
    lowerMsg.includes('dại') || lowerMsg.includes('dai') || 
    lowerMsg.includes('7 bệnh') || lowerMsg.includes('7 benh') ||
    lowerMsg.includes('chích ngừa') || lowerMsg.includes('chich ngua') ||
    lowerMsg.includes('tẩy giun') || lowerMsg.includes('tay giun')
  ) {
    const topic9 = DR_PAW_KNOWLEDGE_BASE.find(t => t.id === 'vaccine_deworm_schedule');
    if (topic9) return topic9.getResponse(selectedPet);
  }

  const petName = selectedPet?.name || 'thú cưng';

  return `### ℹ️ THÔNG BÁO TỪ TRỢ LÝ TƯ VẤN DR. PAW

Hệ thống tư vấn hiện tại chưa tìm thấy thông tin y khoa hoặc phác đồ điều trị khớp với câu hỏi: *"**${userMessage}**"* dành cho bé **${petName}**.

> **Lưu ý:** Trợ lý Dr. Paw hoạt động dựa trên bộ cơ sở tri thức thú y cục bộ tra cứu theo từ khóa, không phải mô hình AI học sâu và không thay thế chẩn đoán lâm sàng trực tiếp của bác sĩ thú y.

---

#### 📋 Khuyến Nghị:
1. Hãy mô tả chi tiết hơn hoặc thử các từ khóa triệu chứng cụ thể (ví dụ: *nôn mửa, tiêu chảy, bỏ ăn, ngộ độc socola, ve rận, lịch tiêm phòng...*).
2. Nếu bé đang có các biểu hiện bất thường hoặc nguy cấp, vui lòng đưa bé đến cơ sở thú y gần nhất hoặc gọi Hotline cấp cứu **1900 6868** để được thăm khám kịp thời!`;
};

// =========================================================================
// MAIN COMPONENT: CỬA SỔ CHAT NỔI THÔNG MINH DR. PAW AI (FLOATING WIDGET DRAWER)
// =========================================================================
export const AiChatView = ({
  pets = [],
  activePetContextId = null,
  onOpenSettings,
  initialPrompt = null,
  onOpenAddSchedule = null,
  isOpen: propIsOpen,
  onToggleOpen: propOnToggleOpen
}) => {
  // =========================================================================
  // HỆ THỐNG WIDGET NỔI KÉO THẢ HỢP NHẤT (UNIFIED DRAGGABLE FLOATING SYSTEM)
  // Single Source of Truth: Dùng chung 1 state position cho cả Trigger & Modal
  // =========================================================================
  const ICON_SIZE = 56;
  const MODAL_WIDTH = 420;
  const MODAL_HEIGHT = 620;

  // Tính toán tọa độ mặc định ở góc dưới bên phải màn hình
  const calculateDefaultPosition = (forModal) => {
    if (typeof window === 'undefined') return { x: 24, y: 24 };
    const w = forModal ? MODAL_WIDTH : ICON_SIZE;
    const h = forModal ? MODAL_HEIGHT : ICON_SIZE;
    const x = Math.max(16, window.innerWidth - w - 24);
    const y = Math.max(16, window.innerHeight - h - 24);
    return { x, y };
  };

  // Trạng thái mở/thu nhỏ của Widget nổi
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isControlled = propIsOpen !== undefined;
  const isOpen = isControlled ? propIsOpen : internalIsOpen;

  // SINGLE SOURCE OF TRUTH: State tọa độ dùng chung duy nhất cho cả Icon thu nhỏ và Modal mở rộng
  const [position, setPosition] = useState(() => calculateDefaultPosition(propIsOpen !== undefined ? propIsOpen : true));

  // Chuyển đổi trạng thái Mở/Thu nhỏ - Tự động đồng bộ và giữ nguyên tọa độ
  const handleToggleOpen = (newVal) => {
    const nextVal = typeof newVal === 'boolean' ? newVal : !isOpen;

    if (nextVal && !isOpen) {
      // Khi MỞ: Cửa sổ xuất hiện ngay tại vị trí của nút icon, tự điều chỉnh nếu tràn màn hình
      setPosition(prev => {
        const cur = prev || calculateDefaultPosition(false);
        let newX = cur.x;
        let newY = cur.y;

        // Nếu icon ở sát mép phải, mở rộng về phía bên trái để không tràn màn hình
        if (newX + MODAL_WIDTH > window.innerWidth - 16) {
          newX = newX + ICON_SIZE - MODAL_WIDTH;
        }
        // Nếu icon ở sát mép dưới, mở rộng lên phía trên để không tràn màn hình
        if (newY + MODAL_HEIGHT > window.innerHeight - 16) {
          newY = newY + ICON_SIZE - MODAL_HEIGHT;
        }

        const minX = 16;
        const maxX = Math.max(16, window.innerWidth - MODAL_WIDTH - 16);
        const minY = 16;
        const maxY = Math.max(16, window.innerHeight - MODAL_HEIGHT - 16);

        return {
          x: Math.min(Math.max(newX, minX), maxX),
          y: Math.min(Math.max(newY, minY), maxY)
        };
      });
    } else if (!nextVal && isOpen) {
      // Khi THU NHỎ: Cửa sổ đóng lại và NÚT ICON ROBOT NẰM NGUYÊN TẠI VỊ TRÍ VỪA KÉO ĐÓ
      setPosition(prev => {
        if (!prev) return calculateDefaultPosition(false);
        const minX = 16;
        const maxX = Math.max(16, window.innerWidth - ICON_SIZE - 16);
        const minY = 16;
        const maxY = Math.max(16, window.innerHeight - ICON_SIZE - 16);

        return {
          x: Math.min(Math.max(prev.x, minX), maxX),
          y: Math.min(Math.max(prev.y, minY), maxY)
        };
      });
    }

    if (isControlled && propOnToggleOpen) {
      propOnToggleOpen(nextVal);
    } else {
      setInternalIsOpen(nextVal);
    }
    try { sound.playClick(); } catch (_) {}
  };

  // State context pet
  const [selectedPetId, setSelectedPetId] = useState(activePetContextId || pets[0]?.id || '');
  const [isPetDropdownOpen, setIsPetDropdownOpen] = useState(false);
  const petDropdownRef = useRef(null);



  // Card detail modal state
  const [activeCardDetail, setActiveCardDetail] = useState(null);
  const [toastNotification, setToastNotification] = useState(null);

  // Lịch sử tin nhắn
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: `### 🩺 Xin chào bạn! Mình là Dr. Paw AI Smart
Mình luôn túc trực 24/7 để phân tích triệu chứng bất thường, hướng dẫn sơ cứu khẩn cấp, cân đối dinh dưỡng và đề xuất lịch tiêm phòng khoa học cho các bé!

> 💡 **Gợi ý:** Chọn bé cưng ở góc trên để Dr. Paw tự động nạp hồ sơ bệnh án và đơn thuốc vào phiên khám nhé!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedCards: SUGGESTED_CARDS_DATABASE.general
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const selectedPet = useMemo(() => {
    return pets.find(p => p.id === selectedPetId) || null;
  }, [pets, selectedPetId]);


  const activeSuggestedPrompts = useMemo(() => {
    if (!selectedPet) return DYNAMIC_PROMPTS_BY_SPECIES.all;
    const sp = (selectedPet.species || '').toLowerCase();
    if (sp === 'dog') return DYNAMIC_PROMPTS_BY_SPECIES.dog;
    if (sp === 'cat') return DYNAMIC_PROMPTS_BY_SPECIES.cat;
    if (sp === 'rabbit') return DYNAMIC_PROMPTS_BY_SPECIES.rabbit;
    return DYNAMIC_PROMPTS_BY_SPECIES.all;
  }, [selectedPet]);

  // Đóng pet dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (petDropdownRef.current && !petDropdownRef.current.contains(event.target)) {
        setIsPetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Nhận initialPrompt từ tab khác nếu có
  useEffect(() => {
    if (initialPrompt) {
      handleToggleOpen(true);
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt]);

  // =========================================================================
  // LOGIC KÉO THẢ TỰ DO VÀ GIỚI HẠN VÙNG MÀN HÌNH (DRAGGABLE & CLAMPING)
  // =========================================================================
  const modalRef = useRef(null);
  const dragStartRef = useRef({
    startX: 0,
    startY: 0,
    clientX: 0,
    clientY: 0,
    hasMoved: false
  });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Khởi động kéo thả cho Nút Icon thu nhỏ
  const handleTriggerMouseDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragStartRef.current = {
      startX: position.x,
      startY: position.y,
      clientX: e.clientX,
      clientY: e.clientY,
      hasMoved: false
    };
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    setIsDragging(true);
  };

  const handleTriggerTouchStart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    dragStartRef.current = {
      startX: position.x,
      startY: position.y,
      clientX: touch.clientX,
      clientY: touch.clientY,
      hasMoved: false
    };
    dragOffsetRef.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    };
    setIsDragging(true);
  };

  // Khởi động kéo thả cho Header Modal mở rộng
  const handleHeaderMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.no-drag')) {
      return;
    }
    e.preventDefault();
    dragStartRef.current = {
      startX: position.x,
      startY: position.y,
      clientX: e.clientX,
      clientY: e.clientY,
      hasMoved: false
    };
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    setIsDragging(true);
  };

  const handleHeaderTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.no-drag')) {
      return;
    }
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    dragStartRef.current = {
      startX: position.x,
      startY: position.y,
      clientX: touch.clientX,
      clientY: touch.clientY,
      hasMoved: false
    };
    dragOffsetRef.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    };
    setIsDragging(true);
  };

  // Lắng nghe sự kiện kéo thả toàn cục (Clamping >= 16px, phân biệt Kéo vs Click < 5px)
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (clientX, clientY) => {
      const deltaX = clientX - dragStartRef.current.clientX;
      const deltaY = clientY - dragStartRef.current.clientY;
      const dist = Math.hypot(deltaX, deltaY);

      // Nếu di chuyển chuột >= 5px thì đánh dấu là Kéo (không mở chat)
      if (dist >= 5) {
        dragStartRef.current.hasMoved = true;
      }

      const w = isOpen ? MODAL_WIDTH : ICON_SIZE;
      const h = isOpen ? MODAL_HEIGHT : ICON_SIZE;

      const newX = clientX - dragOffsetRef.current.x;
      const newY = clientY - dragOffsetRef.current.y;

      const minX = 16;
      const maxX = Math.max(16, window.innerWidth - w - 16);
      const minY = 16;
      const maxY = Math.max(16, window.innerHeight - h - 16);

      setPosition({
        x: Math.min(Math.max(newX, minX), maxX),
        y: Math.min(Math.max(newY, minY), maxY)
      });
    };

    const handleMouseMove = (e) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e) => {
      if (!e.touches || e.touches.length === 0) return;
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    const handlePointerEnd = () => {
      // Khi thả chuột ở trạng thái thu nhỏ: Nếu di chuyển < 5px thì tính là CLICK -> Mở chat
      if (!isOpen && !dragStartRef.current.hasMoved) {
        handleToggleOpen(true);
      }
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handlePointerEnd);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handlePointerEnd);
    window.addEventListener('touchcancel', handlePointerEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handlePointerEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handlePointerEnd);
      window.removeEventListener('touchcancel', handlePointerEnd);
    };
  }, [isDragging, isOpen]);

  // Giữ vị trí an toàn trong màn hình khi thay đổi kích thước trình duyệt
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        if (!prev) return calculateDefaultPosition(isOpen);
        const w = isOpen ? MODAL_WIDTH : ICON_SIZE;
        const h = isOpen ? MODAL_HEIGHT : ICON_SIZE;
        const minX = 16;
        const maxX = Math.max(16, window.innerWidth - w - 16);
        const minY = 16;
        const maxY = Math.max(16, window.innerHeight - h - 16);
        return {
          x: Math.min(Math.max(prev.x, minX), maxX),
          y: Math.min(Math.max(prev.y, minY), maxY)
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Reset toàn bộ đoạn chat
  const handleResetChat = () => {
    try { sound.playClick(); } catch (_) {}
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'ai',
        text: `### 🩺 Đã làm mới phiên tư vấn với Dr. Paw AI!
Bạn đang lo lắng triệu chứng gì về **${selectedPet ? selectedPet.name : 'thú cưng'}**? Hãy nhập câu hỏi để bác sĩ hỗ trợ ngay nhé!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedCards: SUGGESTED_CARDS_DATABASE.general
      }
    ]);
  };

  // Xử lý đặt lịch nhanh (Quick Book) từ thẻ đề xuất
  const handleQuickBook = (typeOrCard) => {
    try { sound?.playClick?.(); } catch (_) {}
    let serviceName = 'Gói Khám Thể Trạng & Sàng Lọc';
    let schedType = 'vet';

    if (typeof typeOrCard === 'string') {
      if (typeOrCard === 'spa') {
        serviceName = 'Vệ Sinh Tai & Cắt Móng Y Tế';
        schedType = 'care';
      } else if (typeOrCard === 'general') {
        serviceName = 'Gói Khám Thể Trạng & Sàng Lọc';
        schedType = 'vet';
      } else {
        serviceName = typeOrCard;
      }
    } else if (typeOrCard && typeof typeOrCard === 'object') {
      serviceName = typeOrCard.name || 'Dịch vụ thú y';
      schedType = (typeOrCard.category || '').toLowerCase().includes('tiêm') ? 'vaccine' : 'vet';
    }

    if (typeof onOpenAddSchedule === 'function') {
      onOpenAddSchedule(schedType, serviceName);
    }
    try { sound?.playSuccess?.(); } catch (_) {}
    setToastNotification(`✨ Đã mở đặt lịch cho "${serviceName}"!`);
    setTimeout(() => setToastNotification(null), 3500);
  };

  // Xử lý click thẻ hành động (Suggestion Mini-Card)
  const handleCardAction = (card, actionType) => {
    if (actionType === 'schedule') {
      handleQuickBook(card);
    } else if (actionType === 'detail') {
      try { sound?.playClick?.(); } catch (_) {}
      setActiveCardDetail(card);
    }
  };

  // Helper phản hồi từ Cơ sở tri thức thú y nội bộ nếu chưa có API Key
  const getLocalKnowledgeResponse = (userMessage) => {
    const kbMatch = findKnowledgeBaseMatch(userMessage, selectedPet);
    if (kbMatch) {
      return kbMatch.text;
    }
    return getOutOfScopeResponse(userMessage, selectedPet);
  };

  const handleSendMessage = async (customText = null) => {
    const userMessage = (customText || inputMessage).trim();
    if (!userMessage || isLoading) return;

    try { sound.playPop(); } catch (_) {}

    // Thêm tin nhắn người dùng
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { apiFetch } = await import('../../services/apiService.js');
      const res = await apiFetch('/chat', 'POST', {
        message: userMessage,
        petContext: selectedPet
      });

      try { sound.playSuccess(); } catch (_) {}

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: res.reply || 'Không có phản hồi.',
          severity: 'NORMAL',
          suggestedCards: detectSuggestedCards(userMessage),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: res.source
        }
      ]);
    } catch (err) {
      console.error('Chat error', err);
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Lỗi: ${err.message || 'Không thể kết nối đến máy chủ.'}`,
          severity: 'WARNING',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // =========================================================================
  // RENDER: NÚT TRÒN CHATBOT NỔI THU NHỎ (DRAGGABLE TRIGGER BUTTON)
  // =========================================================================
  if (!isOpen) {
    return (
      <div 
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          zIndex: 50
        }}
        onMouseDown={handleTriggerMouseDown}
        onTouchStart={handleTriggerTouchStart}
        className={`group select-none ${isDragging ? 'cursor-grabbing transition-none' : 'cursor-grab transition-all duration-150'}`}
      >
        {/* Tooltip phát sáng khi hover (ẩn khi đang kéo) */}
        {!isDragging && (
          <div className="absolute right-16 top-1/2 -translate-y-1/2 bg-slate-950/95 backdrop-blur-xl border border-white/10 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-2xl shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dr. Paw AI Smart • Kéo thả tự do 24/7</span>
          </div>
        )}

        {/* Nút icon robot vuông bo góc có chấm online xanh */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (dragStartRef.current.hasMoved) return;
            handleToggleOpen(true);
          }}
          className={`w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)] hover:shadow-[0_0_35px_rgba(99,102,241,0.6)] flex items-center justify-center relative group/btn border border-white/20 ${
            isDragging ? 'cursor-grabbing ring-2 ring-indigo-400/50 shadow-2xl' : 'cursor-grab'
          }`}
          title="Nhấp để mở • Nhấp giữ để kéo di chuyển"
        >
          {/* Icon robot phát sáng */}
          <Bot className="w-7 h-7 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] group-hover/btn:rotate-6 transition-transform pointer-events-none" />

          {/* Hiệu ứng chấm xanh nhỏ nhấp nháy báo hiệu Dr. Paw đang trực tuyến */}
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 pointer-events-none">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-slate-950" />
          </span>
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={modalRef}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 50
      }}
      className={`w-[420px] max-w-[calc(100vw-1.5rem)] h-[620px] max-h-[85vh] flex flex-col bg-slate-950/95 backdrop-blur-2xl border border-white/10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_35px_rgba(99,102,241,0.15)] rounded-3xl overflow-hidden ${
        isDragging 
          ? 'select-none transition-none shadow-[0_30px_70px_rgba(0,0,0,0.9),0_0_45px_rgba(99,102,241,0.35)] ring-2 ring-indigo-500/40' 
          : 'animate-in zoom-in-95 duration-200'
      }`}
    >
      
      {/* Hiệu ứng ánh sáng Obsidian Spatial phản quang */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* ============================================================ */}
      {/* 1. SỬA HEADER (TAY CẦM KÉO THẢ TỰ DO - DRAG HANDLE)          */}
      {/* ============================================================ */}
      <div 
        onMouseDown={handleHeaderMouseDown}
        onTouchStart={handleHeaderTouchStart}
        onDoubleClick={(e) => {
          if (!e.target.closest('button')) {
            setPosition(calculateDefaultPosition(true));
          }
        }}
        className={`bg-slate-950/90 backdrop-blur-2xl border-b border-white/10 p-3.5 shrink-0 relative z-20 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        title="Nhấp giữ để kéo di chuyển cửa sổ • Nhấp đúp để đặt lại vị trí góc"
      >
        <div className="flex items-center justify-between gap-2">
          
          {/* Bên trái: Icon Robot + Cụm tiêu đề */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 pointer-events-none">
            <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-black text-white text-sm tracking-wide truncate">
                  Dr. Paw AI Smart
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Bác sĩ Thú y AI & Trợ lý Chăm sóc 24/7
              </p>
            </div>
          </div>

          {/* Bên phải: Nút làm mới phiên khám & nút đóng modal bo tròn kính mờ */}
          <div className="flex items-center gap-1.5 shrink-0 pointer-events-auto">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleResetChat();
              }}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              title="Làm mới phiên khám"
            >
              <RotateCcw size={14} />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleOpen(false);
              }}
              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
              title="Đóng cửa sổ"
            >
              <X size={15} />
            </button>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* THANH BỘ NHỚ RAG & CHỌN THÚ CƯNG (NGAY DƯỚI HEADER)          */}
      {/* ============================================================ */}
      <div className="px-3.5 py-2 bg-indigo-950/20 border-b border-white/5 flex items-center justify-between relative z-20">
        <div className="relative" ref={petDropdownRef}>
          <button 
            type="button"
            onClick={() => setIsPetDropdownOpen(!isPetDropdownOpen)}
            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>🐾</span>
            <span>{selectedPet ? `${selectedPet.name} (${selectedPet.breed || (selectedPet.species === 'cat' ? 'Mèo' : selectedPet.species === 'rabbit' ? 'Thỏ' : 'Chó')})` : (pets.length > 0 ? 'Chọn thú cưng' : 'Chưa có thú cưng')}</span>
            <ChevronDown size={12} className={`text-slate-400 transition-transform ${isPetDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown danh sách bé */}
          {isPetDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-60 bg-slate-950/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <p className="text-[10px] font-bold text-indigo-300 px-2.5 py-1 uppercase tracking-wider">
                Hồ sơ y bạ đang khám:
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                {pets.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPetId(p.id);
                      setIsPetDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      selectedPetId === p.id 
                        ? 'bg-indigo-600/30 text-white font-bold border border-indigo-400/40' 
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="truncate">{p.name} ({p.breed || p.species || 'Thú cưng'} • {p.weight}kg)</span>
                    {selectedPetId === p.id && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
          RAG Bệnh án: Tự động
        </span>
      </div>

      {/* Toast thông báo tương tác nhanh */}
      {toastNotification && (
        <div className="absolute top-28 left-4 right-4 z-40 bg-slate-900/95 border border-indigo-400/40 text-white text-xs font-semibold px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="flex-1 truncate">{toastNotification}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. SỬA BỐ CỤC KHUNG CHAT & KHẮC PHỤC LỖI CẮT CỤT CHỮ         */}
      {/* ============================================================ */}
      <div className="flex-1 overflow-y-auto p-4 pt-4 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';

          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 max-w-[96%] ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                isAi 
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-400/30' 
                  : 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-indigo-500/20'
              }`}>
                {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble Content */}
              <div className={`rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed max-w-[88%] break-words ${
                isAi
                  ? 'bg-slate-900/80 border border-white/10 text-slate-100 shadow-xl backdrop-blur-md rounded-tl-xs'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-xs shadow-md shadow-indigo-500/20'
              }`}>
                
                {/* Title if present */}
                {isAi && msg.title && (
                  <h4 className="font-black text-xs sm:text-sm mb-1.5 text-indigo-200 border-b border-white/10 pb-1 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{msg.title}</span>
                  </h4>
                )}

                {/* Formatted Markdown Body */}
                <FormattedAiMessage text={msg.text} />
                
                {isAi && msg.source && (
                  <div className="mt-2 text-[10px] text-slate-400 italic">
                    Nguồn tài liệu tham khảo: {msg.source}
                  </div>
                )}

                {/* Thẻ đề xuất dịch vụ & thuốc (Xóa bỏ truncate, hiển thị trọn vẹn thông tin) */}
                {isAi && (
                  msg.suggestedCards && msg.suggestedCards.length > 0 && msg.suggestedCards !== SUGGESTED_CARDS_DATABASE.general ? (
                    <div className="mt-2.5 space-y-2">
                      <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="text-indigo-400" size={12}/>
                        <span>Đề xuất dịch vụ & can thiệp phù hợp:</span>
                      </div>

                      {msg.suggestedCards.map((card) => {
                        const isSpa = card.id?.includes('spa') || card.id?.includes('clean');
                        const isEmergency = card.id?.includes('emergency') || card.category?.includes('Cấp cứu');
                        const isVaccine = card.id?.includes('vax') || card.category?.includes('Vắc-xin') || card.category?.includes('giun');

                        const iconBg = isEmergency 
                          ? 'bg-rose-500/20 text-rose-400' 
                          : isSpa 
                          ? 'bg-cyan-500/20 text-cyan-400' 
                          : isVaccine
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-indigo-500/20 text-indigo-400';

                        const IconComponent = isEmergency ? ShieldAlert : isSpa ? Sparkles : isVaccine ? Pill : Stethoscope;

                        return (
                          <div 
                            key={card.id}
                            className="bg-slate-900/80 border border-white/10 hover:border-indigo-400/40 rounded-2xl p-2.5 flex items-center justify-between gap-2.5 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                                <IconComponent size={16}/>
                              </div>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-white truncate">{card.name}</h5>
                                <p className="text-[10px] text-slate-400 line-clamp-1">{card.desc || card.category}</p>
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => handleQuickBook(card)}
                              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-[11px] shrink-0 shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                            >
                              {card.actionText || '+ Đặt lịch'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-2.5 space-y-2">
                      <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="text-indigo-400" size={12}/>
                        <span>Đề xuất dịch vụ & can thiệp phù hợp:</span>
                      </div>

                      {/* Thẻ 1: Khám thể trạng */}
                      <div className="bg-slate-900/80 border border-white/10 hover:border-indigo-400/40 rounded-2xl p-2.5 flex items-center justify-between gap-2.5 transition-all">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                            <Stethoscope size={16}/>
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">Gói Khám Thể Trạng & Sàng Lọc</h5>
                            <p className="text-[10px] text-slate-400 line-clamp-1">Kiểm tra chỉ số sinh học và da liễu định kỳ</p>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleQuickBook('general')}
                          className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-[11px] shrink-0 shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          + Đặt lịch
                        </button>
                      </div>

                      {/* Thẻ 2: Spa & Vệ sinh */}
                      <div className="bg-slate-900/80 border border-white/10 hover:border-indigo-400/40 rounded-2xl p-2.5 flex items-center justify-between gap-2.5 transition-all">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                            <Sparkles size={16}/>
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-white truncate">Vệ Sinh Tai & Cắt Móng Y Tế</h5>
                            <p className="text-[10px] text-slate-400 line-clamp-1">Làm sạch nấm kẽ móng và ve tai chuyên sâu</p>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleQuickBook('spa')}
                          className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-[11px] shrink-0 shadow-md shadow-indigo-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          + Đặt lịch
                        </button>
                      </div>
                    </div>
                  )
                )}

                <span className={`block text-[9px] mt-1.5 text-right ${isAi ? 'text-slate-400' : 'text-purple-200/80'}`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {/* Trạng thái Loading ("Dr. Paw đang suy nghĩ...") */}
        {isLoading && (
          <div className="flex gap-2.5 max-w-[85%] mr-auto animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-2.5 text-xs text-slate-300 flex items-center gap-2.5 shadow-xs backdrop-blur-md">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '180ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '360ms' }} />
              </div>
              <span className="font-semibold text-slate-300 text-xs">
                Dr. Paw đang suy nghĩ...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ============================================================ */}
      {/* 4. THANH HỎI NHANH & Ô NHẬP LIỆU (INPUT BAR CỐ ĐỊNH Ở ĐÁY)    */}
      {/* ============================================================ */}
      <div className="shrink-0 bg-slate-950/95 border-t border-white/10 backdrop-blur-2xl">
        
        {/* Thanh gợi ý câu hỏi nhanh cuộn ngang */}
        <div className="px-3.5 pt-2 pb-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          {activeSuggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-indigo-400/40 whitespace-nowrap transition-all active:scale-95 cursor-pointer shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar Obsidian bo tròn */}
        <div className="p-3.5 pt-1">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Hỏi Dr. Paw về ${selectedPet ? selectedPet.name : 'thú cưng'}...`}
              className="flex-1 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-indigo-400/60 text-white placeholder-slate-400 focus:outline-none text-xs sm:text-sm px-4 py-2.5 transition-all shadow-inner"
            />

            {/* Nút gửi hình tròn gradient tím hoàng gia */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-30 shadow-lg shadow-indigo-500/20 text-white flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer"
              title="Gửi tin nhắn (Enter)"
            >
              <Send size={15} />
            </button>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* MODAL XEM CHI TIẾT THUỐC / DỊCH VỤ (POPUP TRONG DRAWER)       */}
      {/* ============================================================ */}
      {activeCardDetail && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl p-5 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-lg text-indigo-400">
                  {activeCardDetail.icon}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">{activeCardDetail.name}</h4>
                  <p className="text-[11px] text-slate-400">{activeCardDetail.category}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveCardDetail(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-200">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-[11px] font-bold text-indigo-300 mb-1">Mô tả & Hướng dẫn y khoa:</p>
                <p className="leading-relaxed text-slate-300">{activeCardDetail.desc}</p>
              </div>

              <div className="p-3 rounded-2xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between">
                <span className="text-slate-300">Chi phí ước tính:</span>
                <span className="text-emerald-400 font-extrabold text-sm">{activeCardDetail.price}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveCardDetail(null)}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs transition-all"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => {
                handleCardAction(activeCardDetail, 'schedule');
                setActiveCardDetail(null);
              }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
            >
              {activeCardDetail.actionText || '+ Đặt lịch ngay'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
