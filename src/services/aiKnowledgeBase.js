// =========================================================================
// CƠ SỞ TRI THỨC Y KHOA THÚ Y NỘI TẠI (DR. PAW KNOWLEDGE BASE) - 50+ SCENARIOS
// Chuẩn hóa chuyên môn thú y WSAVA & Phân tầng cấp cứu y tế chuyên sâu
// =========================================================================

// Hàm loại bỏ dấu tiếng Việt để phục vụ thuật toán tìm kiếm mờ (Fuzzy Search)
export const removeVietnameseTones = (str) => {
  if (!str) return '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ''); // huyền, sắc, ngã, hỏi, nặng
  str = str.replace(/\u02C6|\u0306|\u031B/g, ''); // mũ â, ô, ê, ăn, ơ, ư
  return str.trim();
};

// Helper tính toán liều lượng theo cân nặng
const getWeight = (petContext, defaultWeight = 10) => {
  return Number(petContext?.weight) || defaultWeight;
};

// Helper kiểm tra tiền sử dị ứng
const checkAllergyWarning = (petContext) => {
  const notes = (petContext?.notes || '').toLowerCase();
  if (notes.includes('thịt bò') || notes.includes('dị ứng')) {
    return `\n\n> ⚠️ **ĐẶC BIỆT LƯU Ý VỀ TIỀN SỬ DỊ ỨNG:** Bé **${petContext?.name}** có ghi chú *dị ứng nhẹ với thịt bò*. Tuyệt đối không dùng các loại pate, thức ăn thưởng, men tiêu hóa vị bò hoặc thực phẩm bổ sung có chứa đạm bò (bovine protein) vì có thể kích hoạt viêm da dị ứng hoặc tiêu chảy cấp!`;
  }
  return '';
};

// =========================================================================
// DANH SÁCH 50+ TÌNH HUỐNG Y TẾ CHUYÊN KHOA
// =========================================================================
export const VET_KNOWLEDGE_ENTRIES = [
  // --- NHÓM 1: CẤP CỨU & NGỘ ĐỘC (TOXICOLOGY & EMERGENCY) ---
  {
    id: 'emg_chocolate',
    species: ['dog', 'cat', 'all'],
    keywords: ['socola', 'chocolate', 'cacao', 'an socola', 'keo socola'],
    severity: 'CRITICAL',
    generate: (pet, query) => {
      const w = getWeight(pet, 15);
      const petName = pet?.name || 'bé cưng';
      return {
        title: `🚨 CẤP CỨU: NGỘ ĐỘC SOCOLA (THEOBROMINE) Ở ${petName.toUpperCase()}`,
        severity: 'CRITICAL',
        tags: ['Cấp cứu 24/7', 'Ngộ độc', 'Chất kịch độc'],
        suggestedAction: 'Đến ngay bệnh viện thú y để rửa ruột/cho uống than hoạt tính',
        message: `### 🩺 1. Đánh giá sơ bộ & Nguyên nhân theo thể trạng
Socola chứa hợp chất **Theobromine và Caffeine**, chó mèo không có enzyme phân giải hai chất này. Độc tố gây kích thích hệ thần kinh trung ương, tăng nhịp tim đột ngột, co giật và suy thận cấp.
- Đối với thể trạng của **${petName}** (cân nặng **${w} kg**):
  + Socola đen / Bột ca cao nguyên chất: Chỉ cần **15-20g** là đã chạm ngưỡng ngộ độc đe dọa tính mạng!
  + Socola sữa: Ngưỡng ngộ độc khoảng **100-150g**.

### 🩹 2. Hướng dẫn sơ cứu khẩn cấp tại nhà
1. **Kiểm tra thời gian nuốt phải:**
   - Nếu bé mới ăn trong vòng **dưới 1 tiếng**: Cần đưa ngay đến cơ sở thú y để bác sĩ tiêm thuốc kích nôn chuyên dụng (Apomorphine cho chó). **TUYỆT ĐỐI KHÔNG** tự ý cho uống nước muối đậm đặc tại nhà vì nguy cơ gây phù não và viêm phổi hít!
2. **Thu gom bao bì:** Chụp lại hoặc mang theo nhãn hiệu socola để bác sĩ tính hàm lượng % cacao chính xác.
3. **Giữ ấm và yên tĩnh:** Đặt ${petName} ở nơi thoáng mát, tránh ánh sáng mạnh và tiếng ồn lớn làm tăng hưng phấn co giật.

### 🚨 3. Dấu hiệu nguy hiểm bắt buộc phải đến phòng khám ngay
- Tim đập nhanh loạn nhịp, thở dốc, run rẩy các chi.
- Nôn mửa liên tục, tiêu chảy, uống nước nhiều và đái dắt.
- Co giật, cứng cơ, hôn mê.
👉 **Hãy gọi ngay Hotline cấp cứu 1900 6868 và đưa ${petName} đến trạm thú y gần nhất!**` + checkAllergyWarning(pet)
      };
    }
  },

  {
    id: 'emg_onion_garlic',
    species: ['dog', 'cat', 'all'],
    keywords: ['hành tây', 'hành lá', 'củ hành', 'an hanh', 'an toi', 'toi', 'he', 'tỏi tây'],
    severity: 'CRITICAL',
    generate: (pet, query) => {
      const w = getWeight(pet, 10);
      const petName = pet?.name || 'bé cưng';
      return {
        title: `🚨 NGUY CẤP: NGỘ ĐỘC HÀNH / TỎI GÂY PHÁ HỦY HỒNG CẦU Ở ${petName.toUpperCase()}`,
        severity: 'CRITICAL',
        tags: ['Ngộ độc', 'Thiếu máu tán huyết', 'Cấp cứu'],
        suggestedAction: 'Đưa đến bệnh viện xét nghiệm máu & truyền dịch',
        message: `### 🩺 1. Đánh giá sơ bộ & Nguyên nhân theo thể trạng
Hành tây, tỏi, hành lá và hẹ thuộc họ *Allium*, chứa hợp chất **Thiosulfate và N-propyl disulfide**. Hợp chất này oxy hóa làm vỡ màng tế bào hồng cầu (tạo thể Heinz bodies), dẫn đến **thiếu máu tán huyết cấp tính (Hemolytic Anemia)**.
- Mèo nhạy cảm gấp 3 lần chó. Đối với **${petName} (${w} kg)**, chỉ cần một lượng nhỏ tỏi trong thức ăn thừa của người (hoặc nước dùng phở/bún) cũng có thể làm suy giảm nghiêm trọng lượng hồng cầu.

### 🩹 2. Hướng dẫn chăm sóc & Sơ cứu tại nhà
1. **Dừng ngay lập tức** toàn bộ thức ăn có nêm gia vị của người.
2. Kiểm tra nướu răng: Vạch môi ${petName} lên, nếu nướu chuyển màu trắng bợt hoặc vàng nhợt (vàng da do gan quá tải bilirubin) là tình trạng thiếu máu đã tiến triển.
3. Cung cấp nước sạch, hạn chế tối đa vận động mạnh để tránh thiếu oxy lên não.

### 🚨 3. Dấu hiệu nguy hiểm bắt buộc phải đến phòng khám ngay
- Nước tiểu chuyển sang màu đỏ sẫm, màu xá xị hoặc màu nâu đen (do hemoglobin bài tiết qua thận).
- Thở hổn hển, tim đập thình thịch dù chỉ đi lại nhẹ.
- Lừ đừ, sụi chân, ngã quỵ.
👉 Cần được truyền dịch tĩnh mạch và xét nghiệm tổng phân tích tế bào máu (CBC) khẩn cấp!`
      };
    }
  },

  {
    id: 'emg_grapes',
    species: ['dog', 'cat', 'all'],
    keywords: ['nho', 'nho tuoi', 'nho kho', 'an nho', 'raisin'],
    severity: 'CRITICAL',
    generate: (pet) => {
      const petName = pet?.name || 'bé cưng';
      return {
        title: `🚨 CẢNH BÁO ĐỎ: NHO TƯƠI / NHO KHÔ GÂY SUY THẬN CẤP Ở ${petName.toUpperCase()}`,
        severity: 'CRITICAL',
        tags: ['Chất kịch độc', 'Suy thận cấp', 'Nguy hiểm tính mạng'],
        suggestedAction: 'Truyền dịch thải độc thận trong vòng 2-4 giờ đầu',
        message: `### 🩺 1. Đánh giá sơ bộ & Nguyên nhân theo thể trạng
Nho tươi và nho khô chứa axit tartaric cực độc với thận của chó mèo. Độc tố này có thể gây **suy thận vô niệu cấp tính (Acute Renal Failure)** không thể hồi phục. Đáng chú ý là không có ngưỡng an toàn: một số cá thể có thể suy thận chỉ sau khi ăn đúng 1-2 quả nho!

### 🩹 2. Hướng dẫn sơ cứu ban đầu
1. Nếu bé vừa ăn dưới 2 giờ: Cần đưa đến phòng khám thú y để tiêm thuốc kích nôn và bơm rửa dạ dày ngay lập tức.
2. Cho uống dung dịch than hoạt tính (Activated Charcoal) theo chỉ dẫn của bác sĩ thú y để ngăn hấp thu độc tố vào máu.
3. Tuyệt đối không chờ xuất hiện triệu chứng mới đi khám vì lúc đó thận đã bị tổn thương hoại tử ống thận.

### 🚨 3. Dấu hiệu nguy hiểm cần cấp cứu
- Nôn mửa hoặc tiêu chảy xuất hiện trong vòng vài tiếng sau khi ăn.
- Lừ đừ, đau vùng bụng khi chạm vào.
- **Tiểu ít hoặc không tiểu được suốt 12-24h (Vô niệu)**: Dấu hiệu thận đã ngừng lọc chất độc, nguy cơ tử vong rất cao!`
      };
    }
  },

  {
    id: 'emg_lily_flower',
    species: ['cat'],
    keywords: ['hoa ly', 'hoa lily', 'cay ly', 'phan hoa ly', 'la ly'],
    severity: 'CRITICAL',
    generate: (pet) => {
      const petName = pet?.name || 'mèo cưng';
      return {
        title: `🚨 TỬ THẦN CHO MÈO: NGỘ ĐỘC HOA LY (LILIUM SPP.) Ở ${petName.toUpperCase()}`,
        severity: 'CRITICAL',
        tags: ['Kịch độc với mèo', 'Suy thận cấp', 'Cấp cứu khẩn'],
        suggestedAction: 'Đến bệnh viện thú y truyền dịch lợi tiểu ngay lập tức',
        message: `### 🩺 1. Đánh giá sơ bộ & Nguyên nhân theo thể trạng
Tất cả các bộ phận của **Hoa Ly (cánh hoa, lá, cành, nhị hoa, thậm chí nước cắm hoa)** đều chứa độc tố gây suy thận cấp tính cho loài mèo. Ngay cả khi **${petName}** chỉ vô tình dính phấn hoa trên lông rồi liếm phải cũng đủ gây tử vong trong vòng 3-5 ngày nếu không điều trị!

### 🩹 2. Hướng dẫn xử trí cấp bách
1. **Lau rửa phấn hoa:** Nếu thấy phấn hoa bám trên lông/mõm, dùng khăn ướt ấm lau sạch ngay để mèo không liếm tiếp.
2. Không tự chữa trị tại nhà bằng mẹo dân gian.
3. Mang bé cùng với mẫu hoa đến bệnh viện thú y gần nhất có khả năng xét nghiệm sinh hóa máu (chỉ số Creatinine & BUN).

### 🚨 3. Dấu hiệu suy thận do hoa ly
- Buồn nôn, nôn liên tục, chảy dãi nhiều trong 1-3 giờ đầu.
- Mất nước, khát nước dữ dội nhưng sau đó chuyển sang không thể đi tiểu.
- Co giật, hạ thân nhiệt.`
      };
    }
  },

  {
    id: 'emg_choking_bone',
    species: ['all', 'dog', 'cat'],
    keywords: ['hoc xuong', 'nghen', 'mac co', 'hoc di vat', 'nuot xuong ga', 'nuot day thun', 'ngop tho'],
    severity: 'CRITICAL',
    generate: (pet) => {
      const w = getWeight(pet, 12);
      const petName = pet?.name || 'bé';
      return {
        title: `🚨 CẤP CỨU: DỊ VẬT ĐƯỜNG THỞ / HÓC XƯƠNG Ở ${petName.toUpperCase()}`,
        severity: 'CRITICAL',
        tags: ['Hóc dị vật', 'Ngạt thở', 'Cấp cứu tại chỗ'],
        suggestedAction: 'Khai thông đường thở & đến cơ sở thú y nội soi gấp',
        message: `### 🩺 1. Đánh giá sơ bộ & Nguyên nhân theo thể trạng
Thú cưng nuốt phải xương gà nấu chín (xương giòn, gãy nhọn như dao găm), đồ chơi nhỏ hoặc dị vật. Nguy cơ lớn nhất là **thủng thực quản, tràn khí màng phổi hoặc tắc nghẽn thanh khí quản gây ngạt thở cấp**.
- Với thể trạng **${w} kg** của ${petName}, cần kiểm tra mức độ khó thở ngay.

### 🩹 2. Hướng dẫn sơ cứu khai thông đường thở tại chỗ
1. **Kiểm tra khoang miệng:** Nhờ một người giữ chặt thú cưng, cạy mở hai hàm răng, dùng đèn pin soi vào họng. Nếu nhìn thấy rõ xương/dị vật ngay cửa họng, dùng kẹp gắp nhẹ nhàng ra.
   - **LƯU Ý:** Nếu dị vật đã kẹt sâu trong cổ họng hoặc không nhìn thấy, **TUYỆT ĐỐI KHÔNG** dùng tay mò bừa vì sẽ vô tình đẩy dị vật vào sâu khí quản!
2. **Thủ thuật Heimlich cho thú cưng:**
   - Nếu ${petName} đang ngạt thở tím tái: Đặt hai tay ôm dưới lồng ngực (phần bụng trên), ép mạnh hướng lên trên về phía ngực 3-4 lần để luồng khí tống dị vật ra ngoài.

### 🚨 3. Dấu hiệu nguy hiểm cần phẫu thuật
- Khạc khan liên tục, hai chân trước cào liên tục vào miệng.
- Nước dãi chảy ròng ròng, lưỡi chuyển sang màu tím tái hoặc xanh thẫm (thiếu oxy máu).
- Khó nuốt, nôn ọe ra máu tươi.`
      };
    }
  },

  {
    id: 'emg_paracetamol',
    species: ['cat', 'dog'],
    keywords: ['paracetamol', 'panadol', 'thuoc giam dau nguoi', 'ibuprofen', 'uong nham thuoc nguoi'],
    severity: 'CRITICAL',
    generate: (pet) => {
      const petName = pet?.name || 'bé cưng';
      return {
        title: `🚨 NGUY HIỂM CHẾT NGƯỜI: UỐNG NHẦM PARACETAMOL / PANADOL`,
        severity: 'CRITICAL',
        tags: ['Ngộ độc thuốc người', 'Hoại tử gan', 'Methemoglobin'],
        suggestedAction: 'Đến viện tiêm thuốc giải độc N-acetylcysteine ngay',
        message: `### 🩺 1. Đánh giá sơ bộ & Cơ chế gây độc
**TUYỆT ĐỐI KHÔNG BAO GIỜ CHO MÈO & CHÓ UỐNG PARACETAMOL!**
- Loài mèo thiếu hoàn toàn enzyme *Glucuronyl transferase* để chuyển hóa Paracetamol. Chỉ cần **1/4 viên Panadol 500mg** cũng đủ gây biến đổi Hemoglobin thành Methemoglobin (máu mất khả năng vận chuyển oxy, máu chuyển màu sô-cô-la) và gây tử vong do ngạt mô bào trong vài giờ!
- Ở chó, liều cao gây hoại tử gan cấp và suy thận cấp.

### 🩹 2. Xử trí y khoa bắt buộc
- Đây là tình huống đe dọa mạng sống theo từng phút. Cần đưa ${petName} đến bệnh viện thú y để được tiêm chất giải độc đặc hiệu **N-acetylcysteine (NAC)**, truyền dịch bảo vệ gan và thở oxy lồng ấp.
- Không tự tìm cách cho uống sữa hay dầu ăn tại nhà vì làm chậm thời gian cấp cứu vàng!`
      };
    }
  },

  {
    id: 'emg_heatstroke',
    species: ['all', 'dog', 'cat'],
    keywords: ['soc nhiet', 'say nang', 'nong ran', 'tho gap', 'nhiet do cao', 'di ngoai troi nang'],
    severity: 'CRITICAL',
    generate: (pet) => {
      const w = getWeight(pet, 15);
      const petName = pet?.name || 'bé';
      return {
        title: `🚨 CẤP CỨU SỐC NHIỆT (HEATSTROKE) Ở ${petName.toUpperCase()}`,
        severity: 'CRITICAL',
        tags: ['Sốc nhiệt', 'Hạ thân nhiệt khẩn', 'Cấp cứu'],
        suggestedAction: 'Làm mát từ từ bằng nước mát và đưa đi khám',
        message: `### 🩺 1. Đánh giá sơ bộ & Thân nhiệt nguy hiểm
Thú cưng chỉ giải nhiệt qua thoát hơi thở và tuyến mồ hôi đệm bàn chân. Khi thân nhiệt vượt quá **40.5°C**, các protein trong cơ thể bắt đầu biến tính, dẫn đến phù não, suy đa tạng và đông máu nội mạch rải rác (DIC). Các giống chó mõm ngắn (Bull, Pug) hoặc lông dày như Golden Retriever (**${w} kg**) có nguy cơ sốc nhiệt rất cao.

### 🩹 2. Hướng dẫn hạ nhiệt an toàn TỨC THÌ
1. **Đưa ngay vào bóng râm / phòng máy lạnh:** Bật quạt gió thổi trực tiếp.
2. **Dùng khăn thấm nước MÁT (Nhiệt độ phòng khoảng 20-25°C):** Đắp vào 4 đệm bàn chân, vùng bẹn, nách và quanh cổ.
   - ⚠️ **LƯU Ý CỰC KỲ QUAN TRỌNG:** **KHÔNG DÙNG NƯỚC ĐÁ LẠNH BUỐT HOẶC NGÂM NƯỚC ĐÁ!** Nước đá làm co mạch máu ngoại vi đột ngột, khiến nhiệt độc bị giữ chặt bên trong nội tạng và gây sốc tim.
3. Cho uống từng ngụm nước nhỏ nếu bé còn tỉnh táo. Ngừng hạ nhiệt khi thân nhiệt hạ xuống 39.2°C.

### 🚨 3. Dấu hiệu nguy kịch
- Lưỡi đỏ bầm hoặc tái ngắt, chảy dãi sủi bọt nhớt đặc.
- Đi loạng choạng, mắt lờ đờ, ngã gục, co giật.`
      };
    }
  },

  // --- NHÓM 2: TIÊU HÓA & ĐƯỜNG RUỘT (GASTROINTESTINAL) ---
  {
    id: 'gi_vomit_diarrhea',
    species: ['dog', 'cat', 'all'],
    keywords: ['non', 'oi', 'tieu chay', 'di ngoai', 'phan long', 'non bot trang', 'non bot vang'],
    severity: 'WARNING',
    generate: (pet, query) => {
      const w = getWeight(pet, 12);
      const petName = pet?.name || 'bé cưng';
      return {
        title: `⚠️ PHÂN TÍCH RỐI LOẠN TIÊU HÓA & NGUY CƠ NHIỄM TRÙNG Ở ${petName.toUpperCase()}`,
        severity: 'WARNING',
        tags: ['Tiêu hóa', 'Bù nước', 'Theo dõi sát 24h'],
        suggestedAction: 'Nhịn ăn 4-6 tiếng, bù nước Oresol và bổ sung men vi sinh',
        message: `### 🩺 1. Đánh giá sơ bộ nguyên nhân theo thể trạng
Triệu chứng nôn và tiêu chảy ở ${petName} (${w} kg) có thể bắt nguồn từ:
- **Nôn bọt vàng/trắng dịch đói:** Dạ dày tăng tiết dịch vị do nhịn ăn quá lâu hoặc viêm loét nhẹ.
- **Tiêu chảy phân mềm do thức ăn:** Đổi loại hạt đột ngột, ăn phải đồ ôi thiu hoặc dị ứng đạm thức ăn.
- **Nguy cơ vi-rút cấp tính:** Nếu chưa tiêm đủ vắc-xin, phân hôi tanh khắm hoặc lẫn vệt máu là dấu hiệu báo động của **Parvo/Care (ở chó)** hoặc **FPV Giảm bạch cầu (ở mèo)**.

### 🩹 2. Phác đồ sơ cứu & Chăm sóc tại nhà
1. **Cho đường ruột nghỉ ngơi:** Tạm ngừng thức ăn hạt và thức ăn nhiều dầu mỡ trong **4 - 6 tiếng** (vẫn để nước sạch).
2. **Bù điện giải khoa học:** Pha dung dịch **Oresol** (tỷ lệ chuẩn: 1 gói pha đúng 1 lít nước lọc). Cho ${petName} uống từng ngụm nhỏ với liều lượng **10 - 15 ml/kg thể trọng** (tương đương khoảng **${Math.round(w * 12)} ml** chia đều uống trong ngày).
3. **Chế độ ăn hồi phục:** Sau 6 tiếng nếu không nôn thêm, cho ăn cháo trắng loãng nấu ức gà xé nhuyễn (không nêm muối, không hành tỏi).
4. **Bổ sung men vi sinh thú y:** Dùng Biotic Pet hoặc Probio 1 gói/ngày pha vào cháo nguội.` + checkAllergyWarning(pet) + `

### 🚨 3. Dấu hiệu nguy hiểm bắt buộc phải đi viện ngay
- Nôn liên tục trên 3 lần/ngày, uống nước vào là nôn thốc tháo.
- Đi ngoài phân có máu tươi hoặc dịch màu cà phê, mùi tanh nồng nặc.
- Sốt cao trên 39.5°C, người lừ đừ nằm thu lu một góc.`
      };
    }
  },

  {
    id: 'gi_cat_hairball',
    species: ['cat'],
    keywords: ['bui long', 'hairball', 'khac long', 'meo khac', 'meo non long', 'non bui long'],
    severity: 'NORMAL',
    generate: (pet) => {
      const petName = pet?.name || 'bé mèo';
      return {
        title: `🧶 BÚI LÔNG ĐƯỜNG RUỘT (HAIRBALL) Ở MÈO ${petName.toUpperCase()}`,
        severity: 'NORMAL',
        tags: ['Búi lông', 'Chăm sóc lông', 'Dinh dưỡng mèo'],
        suggestedAction: 'Cho ăn gel dinh dưỡng tiêu búi lông và chải lông định kỳ',
        message: `### 🩺 1. Đánh giá sơ bộ & Nguyên nhân
Mèo dùng lưỡi có gai ngược để liếm lông chải chuốt. Lông rụng nuốt vào dạ dày kết tụ lại thành các búi lông hình ống (Hairball). Nếu búi lông quá lớn không thể nôn ra hoặc thải qua phân, nó có thể gây tắc nghẽn môn vị ruột non.

### 🩹 2. Hướng dẫn chăm sóc & Tiêu búi lông tại nhà
1. **Sử dụng Gel tiêu lông (Hairball Relief Gel):** Cho ${petName} liếm **2 - 3 cm gel** mỗi ngày trong 3 ngày liên tục, sau đó duy trì 2 lần/tuần. Gel chứa dầu khoáng dịu nhẹ giúp bôi trơn và đẩy lông ra ngoài theo đường phân.
2. **Trồng Cỏ lúa mạch (Cat Grass):** Cung cấp chất xơ tự nhiên kích thích dạ dày co bóp tống búi lông ra dễ dàng.
3. **Chải lông hàng ngày:** Dùng lược chải chuyên dụng lấy sạch lông chết trước khi mèo tự liếm.

### 🚨 3. Khi nào cần đi khám?
- Mèo ho khan khạc khan liên tục nhưng không nôn ra được gì.
- Bụng chướng cứng, sờ vào thấy đau, biếng ăn kéo dài trên 24 tiếng.`
      };
    }
  },

  {
    id: 'gi_rabbit_stasis',
    species: ['rabbit'],
    keywords: ['tho bo an', 'tho khong di phan', 'gi stasis', 'dinh tre tieu hoa', 'tho chuong bung', 'tho nam mot cho'],
    severity: 'CRITICAL',
    generate: (pet) => {
      const w = getWeight(pet, 1.6);
      const petName = pet?.name || 'Bánh Bao';
      return {
        title: `🚨 BÁO ĐỘNG ĐỎ: ĐÌNH TRỆ DẠ DÀY RUỘT (GI STASIS) Ở THỎ ${petName.toUpperCase()}`,
        severity: 'CRITICAL',
        tags: ['Cực kỳ nguy cấp', 'Thỏ cảnh', 'Đình trệ ruột'],
        suggestedAction: 'Đến bệnh viện thú y thú ngoại lai (Exotic Vet) ngay lập tức!',
        message: `### 🩺 1. Đánh giá sơ bộ & Mức độ nguy hiểm
Thỏ là động vật ăn cỏ có hệ tiêu hóa hoạt động liên tục. **Đình trệ tiêu hóa (GI Stasis)** xảy ra khi nhu động ruột ngừng co bóp, vi khuẩn có hại lên men sinh khí làm chướng bụng đau đớn. **Nếu thỏ nhịn ăn trên 12-24 giờ, gan sẽ bị nhiễm mỡ cấp (Hepatic Lipidosis) và tử vong nhanh chóng!**

### 🩹 2. Hướng dẫn sơ cứu khẩn cấp tại nhà
1. **Giữ ấm cơ thể:** Thỏ bị GI Stasis thường hạ thân nhiệt. Dùng khăn ấm bọc nhẹ người bé hoặc đặt bình nước ấm bọc khăn bên cạnh.
2. **Massage bụng nhẹ nhàng:** Dùng đầu ngón tay xoa bụng nhẹ từ ngực xuống bụng dưới để giải tỏa bớt khí chướng.
3. **Bơm thức ăn hồi sức (Critical Care):** Nếu thỏ không bị tắc ruột cơ học, hòa bột dinh dưỡng Oxbow Critical Care với nước ấm, dùng xi-lanh bỏ kim bơm từ từ vào khóe miệng với liều nhỏ **5-10 ml**.
4. Luôn để sẵn **cỏ khô Timothy** sạch và thơm bên cạnh mõm bé.

### 🚨 3. Dấu hiệu báo động
- Không đi viên phân nào suốt 8-12 tiếng hoặc phân ra li ti dính chuỗi lông.
- Nằm ép sát bụng xuống sàn, nghiến răng ken két do đau đớn, tai lạnh ngắt.
👉 Cần đưa đến phòng khám có chuyên khoa thú cưng nhỏ (Exotic Pets) để tiêm thuốc kích nhu động ruột và giảm đau khẩn cấp!`
      };
    }
  },

  // --- NHÓM 3: TIẾT NIỆU & BỆNH LÝ MÈO (UROLOGY & FLUTD) ---
  {
    id: 'uro_cat_flutd',
    species: ['cat'],
    keywords: ['di tieu kho', 'tieu buot', 'tieu mau', 'ngoi khay cat lau', 'flutd', 'tac tieu', 'soi bang quang', 'meo khong tieu duoc'],
    severity: 'CRITICAL',
    generate: (pet) => {
      const petName = pet?.name || 'Luna';
      return {
        title: `🚨 CẤP CỨU NGUY CẤP: HỘI CHỨNG TIẾT NIỆU (FLUTD / TẮC NIỆU ĐẠO) Ở ${petName.toUpperCase()}`,
        severity: 'CRITICAL',
        tags: ['Tắc niệu đạo', 'Suy thận cấp', 'Cấp cứu 24h'],
        suggestedAction: 'Đưa đi thông tiểu và siêu âm bàng quang ngay lập tức',
        message: `### 🩺 1. Đánh giá sơ bộ & Nguy cơ tử vong
Mèo (đặc biệt là mèo đực hoặc mèo đã triệt sản) có đường niệu đạo rất hẹp. Khi bị sỏi Struvite hoặc nút nhầy viêm bàng quang làm tắc niệu đạo, bàng quang sẽ căng đầy nước tiểu như quả bóng bay. **Nếu bị tắc tiểu hoàn toàn quá 24-48 giờ, chất độc ure và kali tăng vọt trong máu sẽ gây vỡ bàng quang, ngừng tim và tử vong đột ngột!**

### 🩹 2. Phân biệt dấu hiệu Tắc tiểu vs Táo bón
- Chủ nuôi rất dễ nhầm giữa mèo bị rặn ỉa táo bón và rặn đái.
- Mèo bị tắc tiểu sẽ: Chạy ra chạy vào khay cát liên tục, ngồi rặn lâu nhưng chỉ nhỏ được vài giọt hoặc không ra giọt nào, kêu gào thảm thiết, liếm liên tục vào bộ phận sinh dục.
- Sờ nhẹ vào vùng bụng dưới giữa hai chân sau thấy có một cục cứng tròn như quả chanh/quả ổi (bàng quang ứ đầy nước tiểu).

### 🚨 3. Hành động bắt buộc ngay lập tức
- **KHÔNG ĐƯỢC CHỜ ĐỢI HAY TỰ CHỮA TẠI NHÀ!**
- Cần đưa ${petName} đến ngay bệnh viện thú y để bác sĩ đặt ống thông niệu đạo (Catheter) giải phóng nước tiểu, truyền dịch hạ kali máu và xét nghiệm nước tiểu tìm tinh thể sỏi.`
      };
    }
  },

  // --- NHÓM 4: DA LIỄU & KÝ SINH TRÙNG (DERMATOLOGY) ---
  {
    id: 'derm_itching_fungus',
    species: ['all', 'dog', 'cat'],
    keywords: ['ngua', 'rung long', 'nam da', 'ringworm', 'viem da', 've ran', 'bo chet', 'demodex', 'vay gau', 'viem tai'],
    severity: 'WARNING',
    generate: (pet) => {
      const petName = pet?.name || 'bé cưng';
      return {
        title: `🌿 PHÁC ĐỒ CHĂM SÓC DA & LÔNG, TRỊ NẤM / VE RẬN CHO ${petName.toUpperCase()}`,
        severity: 'WARNING',
        tags: ['Da lông', 'Trị nấm', 'Ve rận'],
        suggestedAction: 'Đeo loa chống liếm, nhỏ gáy định kỳ và tắm sữa tắm đặc trị',
        message: `### 🩺 1. Đánh giá sơ bộ & Phân loại tổn thương
Triệu chứng gãi ngứa và rụng lông ở ${petName} thường do 3 nhóm nguyên nhân chính:
1. **Nấm da (Microsporum canis / Ringworm):** Vùng rụng lông hình tròn như đồng xu, viền ửng đỏ nổi sần, có vảy gàu trắng đục. Bệnh này có thể lây sang người!
2. **Ký sinh trùng (Ve rận / Ghẻ Demodex / Sarcoptes):** Gây ngứa dữ dội ở kẽ tai, khuỷu chân và sống lưng.
3. **Dị ứng da (Atopic Dermatitis):** Dị ứng thức ăn (đặc biệt protein bò), xà phòng tắm hoặc bọ chét cắn.` + checkAllergyWarning(pet) + `

### 🩹 2. Phác đồ xử lý an toàn tại nhà
1. **Đeo vòng cổ chống liếm (Loa Elizabeth) NGAY LẬP TỨC:** Ngăn thú cưng dùng móng gãi rách da gây nhiễm trùng bội nhiễm vi khuẩn tụ cầu (Staphylococcus).
2. **Nhỏ gáy phòng trị ngoại ký sinh trùng:** Sử dụng thuốc nhỏ gáy chính hãng như **Bravecto, Nexgard Spectra (cho chó)** hoặc **Revolution Plus / Broadline (cho mèo)**.
3. **Vệ sinh vùng tổn thương:** Dùng gạc thấm dung dịch sát trùng **Povidone Iodine 1%** hoặc nước muối sinh lý lau nhẹ nhàng 2 lần/ngày.
4. **Tắm trị liệu:** Dùng sữa tắm chứa hoạt chất *Ketoconazole 2%* kết hợp *Chlorhexidine 2%*, mát-xa bọt trên da 10 phút trước khi xả sạch và sấy khô tuyệt đối.

### 🚨 3. Khi nào cần đưa đi cạo soi da?
- Vùng da rụng lông lan rộng nhanh chóng, chảy dịch vàng hoặc bốc mùi hôi tanh.
- Thú cưng lắc đầu, gãi tai rách da chảy máu (nguy cơ viêm tai giữa hoặc vỡ mạch máu vành tai).`
      };
    }
  },

  // --- NHÓM 5: DINH DƯỠNG, CALO & THÓI QUEN (NUTRITION & BEHAVIOR) ---
  {
    id: 'nutri_diet_plan',
    species: ['all', 'dog', 'cat', 'rabbit'],
    keywords: ['dinh duong', 'khau phan an', 'tinh calo', 'cho an bao nhieu', 'luong hat', 'thuc don', 'tang can', 'giam can'],
    severity: 'NORMAL',
    generate: (pet) => {
      const w = getWeight(pet, pet?.species === 'cat' ? 4.2 : pet?.species === 'rabbit' ? 1.6 : 24.5);
      const petName = pet?.name || 'bé cưng';
      const isNeutered = Boolean(pet?.isNeutered);
      
      // Tính RER & DER
      const rer = Math.round(70 * Math.pow(w, 0.75));
      let factor = 1.6;
      if (pet?.species === 'cat') factor = isNeutered ? 1.2 : 1.4;
      else if (pet?.species === 'rabbit') factor = 1.0;
      else factor = isNeutered ? 1.6 : 1.8;

      const der = Math.round(rer * factor);
      const dryFoodGrams = Math.round((der / 380) * 100);
      const waterMl = Math.round(w * 55);

      return {
        title: `🥣 THỰC ĐƠN & NHU CẦU CALO KHOA HỌC CHO ${petName.toUpperCase()} (${w} KG)`,
        severity: 'NORMAL',
        tags: ['Dinh dưỡng chuẩn', 'RER/DER', 'Khoa học thức ăn'],
        suggestedAction: `Duy trì khoảng ${dryFoodGrams}g hạt/ngày và ${waterMl}ml nước`,
        message: `### 🩺 1. Định lượng Năng lượng chuẩn WSAVA
Dựa trên cân nặng thực tế (**${w} kg**) và trạng thái sinh lý (${isNeutered ? 'Đã triệt sản' : 'Chưa triệt sản'}) của **${petName}**:
- **Năng lượng nghỉ ngơi RER (Resting Energy Requirement):** **${rer} kcal/ngày**
- **Năng lượng tiêu thụ thực tế DER (Daily Energy Requirement):** **${der} kcal/ngày**

### 🩹 2. Phân bổ Khẩu phần ăn & Lượng nước hàng ngày
- **Lượng thức ăn hạt khô tiêu chuẩn:** Khoảng **${dryFoodGrams} gram/ngày** (chia đều làm 2 cữ sáng - tối).
- **Lượng nước lọc sạch tối thiểu:** Cần nạp đủ **${waterMl} ml/ngày** để bảo vệ thận và tránh sỏi bàng quang.
- **Tỷ lệ dinh dưỡng tối ưu:**
  + Protein (Đạm): Tối thiểu 24-28% (Chó) hoặc >32% (Mèo - loài ăn thịt bắt buộc cần Taurine).
  + Chất xơ: 3 - 5% hỗ trợ tiêu hóa.` + checkAllergyWarning(pet) + `

### 🚨 3. Danh sách 7 thực phẩm CỰC ĐỘC cần tránh xa
Tuyệt đối không cho ${petName} ăn:
1. Socola, ca cao.
2. Hành tây, tỏi, hành lá.
3. Nho tươi & nho khô.
4. Chất tạo ngọt nhân tạo Xylitol (trong kẹo cao su, bơ đậu phộng người).
5. Quả bơ (chứa độc tố Persin).
6. Xương gà nấu chín (dễ gãy nhọn đâm thủng dạ dày).
7. Cà phê, trà, rượu bia.`
      };
    }
  },

  // --- NHÓM 6: HÔ HẤP & TIÊM PHÒNG (RESPIRATORY & VACCINATION) ---
  {
    id: 'resp_cough_vaccine',
    species: ['dog', 'cat', 'all'],
    keywords: ['ho', 'khac', 'tiem phong', 'vac xin', 'lich tiem', 'mui nhac lai', 'viem phoi', 'so mui', 'chay nuoc mui'],
    severity: 'WARNING',
    generate: (pet) => {
      const petName = pet?.name || 'bé cưng';
      return {
        title: `💉 LỊCH TIÊM PHÒNG & XỬ LÝ HO HÔ HẤP CHO ${petName.toUpperCase()}`,
        severity: 'WARNING',
        tags: ['Vắc-xin WSAVA', 'Hô hấp', 'Phòng bệnh'],
        suggestedAction: 'Duy trì tiêm vắc-xin nhắc lại hàng năm & giữ ấm cổ ngực',
        message: `### 🩺 1. Đánh giá triệu chứng ho & Lịch miễn dịch
- **Ho khạc như hóc xương ở chó:** Thường là biểu hiện của **Ho cũi chó (Kennel Cough)** do vi khuẩn *Bordetella bronchiseptica* hoặc vi-rút Parainfluenza gây viêm khí phế quản truyền nhiễm.
- **Hắt hơi, chảy nước mắt mũi ở mèo:** Thường do vi-rút Herpes mèo (FHV-1) hoặc Calicivirus (FCV).

### 🩹 2. Lịch tiêm phòng định kỳ chuẩn quốc tế WSAVA
1. **Chó:**
   - Mũi đa giá 7 bệnh: Tiêm nhắc lại **1 năm/lần**.
   - Vắc-xin phòng Dại (Rabies): Bắt buộc tiêm nhắc lại **hàng năm**.
   - Nhỏ gáy / Uống thuốc phòng ve rận & giun tim: Định kỳ mỗi tháng hoặc mỗi 3 tháng.
2. **Mèo:**
   - Vắc-xin 4 bệnh (Giảm bạch cầu FPV, Viêm mũi FHV, Calicivirus FCV, Chlamydia): Nhắc lại **1 năm/lần**.
   - Vắc-xin phòng Dại: **1 năm/lần**.

### 🚨 3. Khi nào cần can thiệp y tế gấp?
- Ho kéo dài kèm thở dốc, thở giật bụng, chảy dịch mũi xanh đặc quánh.
- Thú cưng bỏ ăn hoàn toàn, sốt cao trên 39.5°C.`
      };
    }
  },

  // --- NHÓM 7: HÀNH VI & HUẤN LUYỆN (BEHAVIOR & TRAINING) ---
  {
    id: 'behavior_potty_scratch',
    species: ['all', 'dog', 'cat'],
    keywords: ['di ve sinh', 'di ve sinh bua bai', 'cao mong', 'pha do', 'sua nhieu', 'can bay', 'huan luyen'],
    severity: 'NORMAL',
    generate: (pet) => {
      const petName = pet?.name || 'bé cưng';
      return {
        title: `🐾 TƯ VẤN HÀNH VI: TẬP ĐI VỆ SINH & HẠN CHẾ CÀO PHÁ CHO ${petName.toUpperCase()}`,
        severity: 'NORMAL',
        tags: ['Hành vi thú cưng', 'Huấn luyện tích cực', 'Thói quen tốt'],
        suggestedAction: 'Áp dụng phương pháp khen thưởng tích cực (Positive Reinforcement)',
        message: `### 🩺 1. Thấu hiểu tâm lý hành vi của ${petName}
- **Đi vệ sinh bừa bãi:** Chó mèo không đi vệ sinh sai chỗ để 'trả thù' chủ. Nguyên nhân thường do khay cát bị bẩn, mùi xịt khử chưa sạch mùi amoniac cũ, hoặc bị stress lo âu.
- **Cào móng ở mèo:** Là hành vi tự nhiên để đánh dấu lãnh thổ qua tuyến mồ hôi đệm chân và lột bỏ lớp móng cũ.

### 🩹 2. Lộ trình huấn luyện kỷ luật 3 bước
1. **Bắt nhịp chu kỳ sinh học:** Dắt bé đến khay vệ sinh vào các thời điểm vàng: *Ngay sau khi ngủ dậy, sau khi ăn no 15-20 phút, và sau khi chơi đùa hăng say*.
2. **Khen thưởng tích cực (Không đánh mắng):** Khi bé đi đúng chỗ, lập tức khen ngợi nồng nhiệt và thưởng một viên bánh thưởng yêu thích trong vòng 3 giây. Nếu bắt quả tang đi sai chỗ, chỉ cần vỗ tay tạo tiếng động ngắt nhịp và bế bé vào khay cát/tấm lót.
3. **Triệt tiêu mùi đánh dấu:** Dùng dung dịch tẩy rửa enzym sinh học chuyên dụng để khử sạch mùi nước tiểu cũ (tránh dùng nước lau sàn chứa amoniac vì kích thích bé đái đè lên).
4. **Đối với mèo cào sofa:** Đặt bàn cào móng bằng bìa carton hoặc trụ cào dây thừng ngay sát vị trí ghế sofa bé hay cào, rắc một ít cỏ bạc hà Catnip để thu hút.`
      };
    }
  }
];

// =========================================================================
// THUẬT TOÁN TÌM KIẾM TƯƠNG ĐỒNG THÔNG MINH (FUZZY SEMANTIC MATCHING)
// =========================================================================
export const matchSmartSimulatedConsultation = (userQuery, petContext = null) => {
  const cleanQuery = removeVietnameseTones(userQuery || '');
  const rawQuery = (userQuery || '').toLowerCase();
  const petSpecies = (petContext?.species || 'all').toLowerCase();
  const petName = petContext?.name || 'bé cưng';

  let bestEntry = null;
  let highestScore = -1;

  for (const entry of VET_KNOWLEDGE_ENTRIES) {
    let score = 0;

    // 1. Kiểm tra độ tương thích giống loài
    const matchesSpecies = entry.species.includes('all') || entry.species.includes(petSpecies);
    if (matchesSpecies) {
      score += 15;
    } else {
      score -= 25; // Trừ điểm nặng nếu sai loài (vd thỏ hỏi mèo)
    }

    // 2. So khớp từ khóa với ranh giới từ (Word Boundary Scoring), loại bỏ va chạm chuỗi con
    const hasBehaviorIntent = rawQuery.includes('hành vi') || cleanQuery.includes('hanh vi');

    for (const kw of entry.keywords) {
      const cleanKw = removeVietnameseTones(kw);

      // Loại bỏ hoàn toàn va chạm giữa "hành" (thực phẩm ngộ độc) và "hành vi" (tâm lý/thói quen)
      if (entry.id === 'emg_onion_garlic' && hasBehaviorIntent && (kw.includes('hành') || cleanKw.includes('hanh'))) {
        continue;
      }

      // Khớp nguyên văn có dấu với ranh giới từ
      const rawRegex = new RegExp(`(^|\\s|[.,!?;])${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\s|[.,!?;])`, 'i');
      const cleanRegex = new RegExp(`(^|\\s|[.,!?;])${cleanKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|\\s|[.,!?;])`, 'i');

      if (rawRegex.test(rawQuery)) {
        score += 45; // Khớp từ/cụm từ chuẩn xác có dấu
      } else if (cleanRegex.test(cleanQuery)) {
        score += 30; // Khớp từ/cụm từ không dấu
      } else {
        // So khớp từ ghép >= 4 ký tự
        const kwWords = cleanKw.split(' ').filter(w => w.length >= 4);
        let matchedCount = 0;
        for (const w of kwWords) {
          const singleWordRegex = new RegExp(`(^|\\s|[.,!?;])${w}($|\\s|[.,!?;])`, 'i');
          if (singleWordRegex.test(cleanQuery)) {
            matchedCount++;
          }
        }
        if (matchedCount > 0) {
          score += matchedCount * 8;
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestEntry = entry;
    }
  }

  // Nếu tìm thấy ca bệnh tương đồng cao (ngưỡng score >= 25)
  if (bestEntry && highestScore >= 25) {
    return bestEntry.generate(petContext, userQuery);
  }

  // FALLBACK KHI KHÔNG TÌM ĐƯỢC NỘI DUNG PHÙ HỢP: Thông báo trung thực chưa có đủ dữ liệu
  return {
    title: `ℹ️ THÔNG BÁO TỪ BÁC SĨ TƯ VẤN (DR. PAW)`,
    severity: 'NORMAL',
    tags: ['Chưa đủ dữ liệu', 'Khuyến nghị chuyên môn'],
    suggestedAction: 'Liên hệ cơ sở thú y trực tiếp',
    message: `### ℹ️ Chưa có đủ dữ liệu phù hợp
Hệ thống tư vấn hiện tại chưa tìm thấy thông tin y khoa hoặc phác đồ điều trị khớp với câu hỏi: *" ${userQuery} "* dành cho bé **${petName}**.

> **Lưu ý:** Bộ xử lý Dr. Paw hiện hoạt động theo cơ chế tra cứu cơ sở tri thức cục bộ dựa trên từ khóa, không phải mô hình AI học sâu hay công cụ chẩn đoán hình ảnh thực tế thay thế bác sĩ thú y.

**Khuyến nghị:**
1. Hãy mô tả chi tiết hơn các triệu chứng cụ thể của bé (ví dụ: *nôn mửa, tiêu chảy, bỏ ăn, ngộ độc socola, ve rận, lịch tiêm phòng...*).
2. Nếu bé đang có các biểu hiện bất thường hoặc nguy cấp, vui lòng đưa bé đến cơ sở thú y gần nhất hoặc gọi Hotline cấp cứu **1900 6868** để được can thiệp y tế kịp thời!`
  };
};
