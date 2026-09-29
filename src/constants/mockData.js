// Mock data ban đầu phong phú và chuẩn thú y
export const INITIAL_PETS = [
  {
    id: 'pet-1',
    name: 'Mochi',
    species: 'dog',
    breed: 'Golden Retriever',
    gender: 'male',
    birthDate: '2023-08-15',
    weight: 24.5, // kg
    color: 'Vàng kem',
    microchip: 'VN-9820003412',
    isNeutered: true,
    avatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80',
    notes: 'Rất thích bơi, hơi nhát tiếng sấm sét. Dị ứng nhẹ với thịt bò.',
    weightHistory: [
      { date: '2025-10-15', weight: 22.0 },
      { date: '2025-12-20', weight: 23.2 },
      { date: '2026-02-15', weight: 24.0 },
      { date: '2026-04-10', weight: 24.5 },
    ]
  },
  {
    id: 'pet-2',
    name: 'Luna',
    species: 'cat',
    breed: 'Mèo Anh Lông Ngắn (BSH)',
    gender: 'female',
    birthDate: '2024-03-10',
    weight: 4.2, // kg
    color: 'Xám xanh (Blue)',
    microchip: 'VN-9820008871',
    isNeutered: true,
    avatar: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80',
    notes: 'Thích nằm trên nóc tủ lạnh, thích ăn pate cá hồi. Đã tiêm ngừa dại đủ mũi.',
    weightHistory: [
      { date: '2025-09-10', weight: 3.6 },
      { date: '2025-11-25', weight: 3.9 },
      { date: '2026-01-15', weight: 4.1 },
      { date: '2026-03-30', weight: 4.2 },
    ]
  },
  {
    id: 'pet-3',
    name: 'Bánh Bao',
    species: 'rabbit',
    breed: 'Thỏ Minilop',
    gender: 'male',
    birthDate: '2024-11-05',
    weight: 1.6, // kg
    color: 'Trắng đốm nâu',
    microchip: '',
    isNeutered: false,
    avatar: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=600&q=80',
    notes: 'Rất háu ăn cỏ Timothy, cần chải lông tơ 2 ngày/lần.',
    weightHistory: [
      { date: '2025-12-05', weight: 1.2 },
      { date: '2026-02-10', weight: 1.5 },
      { date: '2026-04-01', weight: 1.6 },
    ]
  }
];

// Helper tính ngày linh động tương đối theo hôm nay
const getOffsetDate = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const INITIAL_SCHEDULES = [
  {
    id: 'sch-1',
    petId: 'pet-1',
    title: 'Tiêm phòng dại Rabisin & Vắc-xin 7 bệnh nhắc lại - Mochi',
    type: 'vaccine', // vaccine | deworm | grooming | vet | medicine
    date: '2026-09-26', // Hôm nay
    time: '09:30',
    location: 'Bệnh viện thú y PetHealth, Hà Nội',
    completed: false,
    notes: 'Mang theo sổ tiêm chủng của Mochi. Nhịn ăn sáng 2 tiếng trước khi tiêm.',
    repeat: 'yearly' // none | weekly | monthly | quarterly | yearly
  },
  {
    id: 'sch-2',
    petId: 'pet-2',
    title: 'Nhỏ gáy phòng ve rận & giun sán Broadline - Luna',
    type: 'deworm',
    date: '2026-09-27',
    time: '19:00',
    location: 'Tại nhà',
    completed: false,
    notes: 'Không tắm cho mèo trước và sau khi nhỏ thuốc 48 tiếng.',
    repeat: 'monthly'
  },
  {
    id: 'sch-3',
    petId: 'pet-3',
    title: 'Khám kiểm tra mài răng cửa & cắt móng định kỳ - Bánh Bao',
    type: 'vet',
    date: '2026-09-29',
    time: '10:00',
    location: 'Phòng khám thú y Sammi Animal Clinic',
    completed: false,
    notes: 'Kiểm tra khớp cắn và răng cửa xem có mọc lệch gây đau miệng không.',
    repeat: 'quarterly'
  },
  {
    id: 'sch-4',
    petId: 'pet-1',
    title: 'Tắm sục khoáng ozone, cắt tỉa lông & spa móng - Mochi',
    type: 'grooming',
    date: '2026-09-28',
    time: '14:00',
    location: 'Paddy Pet Care & Spa',
    completed: false,
    notes: 'Cạo sạch lông kẽ ngón chân và vệ sinh tuyến hôi.',
    repeat: 'monthly'
  },
  {
    id: 'sch-5',
    petId: 'pet-2',
    title: 'Siêu âm tim màu & Xét nghiệm sinh hóa máu định kỳ - Luna',
    type: 'vet',
    date: '2026-09-29',
    time: '15:30',
    location: 'Phòng khám thú y 2Vet Hospital',
    completed: false,
    notes: 'Nhịn ăn 6 tiếng trước giờ lấy mẫu để kiểm tra chức năng thận.',
    repeat: 'yearly'
  },
  {
    id: 'sch-6',
    petId: 'pet-1',
    title: 'Uống viên tẩy giun định kỳ Drontal Plus (2.5 viên) - Mochi',
    type: 'deworm',
    date: '2026-09-30',
    time: '08:00',
    location: 'Tại nhà',
    completed: false,
    notes: 'Mochi uống 2.5 viên theo đúng thể trọng 24.5kg, uống sau bữa ăn sáng.',
    repeat: 'quarterly'
  },
  {
    id: 'sch-7',
    petId: 'pet-3',
    title: 'Bổ sung men vi sinh tiêu hóa & cỏ Alfalfa dưỡng lông - Bánh Bao',
    type: 'medicine',
    date: '2026-09-27',
    time: '08:30',
    location: 'Tại nhà',
    completed: false,
    notes: 'Trộn 1/2 muỗng vào thức ăn hạt buổi sáng để phòng ngừa chướng hơi dạ dày.',
    repeat: 'monthly'
  },
  {
    id: 'sch-8',
    petId: 'pet-1',
    title: 'Nhỏ gáy phòng ve rận & ghẻ tai (Bravecto) - Mochi',
    type: 'deworm',
    date: '2026-09-28',
    time: '19:30',
    location: 'Tại nhà',
    completed: false,
    notes: 'Sử dụng Bravecto hoặc Nexgard / Frontline. Không tắm cho bé trong vòng 48h.',
    repeat: 'monthly'
  }
];

export const SCHEDULE_TYPES = {
  vaccine: {
    label: 'Tiêm phòng Vắc-xin',
    icon: 'Syringe',
    color: 'emerald',
    bgLight: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800'
  },
  deworm: {
    label: 'Tẩy giun / Nhỏ gáy',
    icon: 'Pill',
    color: 'amber',
    bgLight: 'bg-amber-50 border-amber-200 text-amber-700',
    badge: 'bg-amber-100 text-amber-800'
  },
  grooming: {
    label: 'Spa / Tắm / Cắt tỉa',
    icon: 'Sparkles',
    color: 'purple',
    bgLight: 'bg-purple-50 border-purple-200 text-purple-700',
    badge: 'bg-purple-100 text-purple-800'
  },
  vet: {
    label: 'Khám thú y',
    icon: 'Stethoscope',
    color: 'blue',
    bgLight: 'bg-blue-50 border-blue-200 text-blue-700',
    badge: 'bg-blue-100 text-blue-800'
  },
  medicine: {
    label: 'Uống thuốc / Trị liệu',
    icon: 'Activity',
    color: 'rose',
    bgLight: 'bg-rose-50 border-rose-200 text-rose-700',
    badge: 'bg-rose-100 text-rose-800'
  }
};

export const SPECIES_LIST = [
  { id: 'dog', label: 'Chó', emoji: '🐶', icon: 'Dog' },
  { id: 'cat', label: 'Mèo', emoji: '🐱', icon: 'Cat' },
  { id: 'rabbit', label: 'Thỏ', emoji: '🐰', icon: 'Rabbit' },
  { id: 'hamster', label: 'Hamster / Chuột kiểng', emoji: '🐹', icon: 'Mouse' },
  { id: 'bird', label: 'Chim cảnh', emoji: '🦜', icon: 'Bird' },
  { id: 'other', label: 'Khác', emoji: '🐾', icon: 'PawPrint' }
];

export const DAILY_AI_TIPS = [
  {
    title: 'Thời tiết ấm lên - Đề phòng ve rận & bọ chét',
    petType: 'all',
    content: 'Khi độ ẩm và nhiệt độ tăng, trứng ve rận phát triển rất nhanh. Hãy kiểm tra kẽ tai, đệm bàn chân và định kỳ nhỏ gáy phòng ngừa cho thú cưng mỗi tháng 1 lần.',
    tag: 'Phòng bệnh'
  },
  {
    title: 'Chăm sóc răng miệng cho Chó Golden & các giống chó lớn',
    petType: 'dog',
    content: 'Trên 80% chó từ 3 tuổi trở lên có dấu hiệu viêm nha chu. Cho gặm xương đồ chơi chuyên dụng và đánh răng bằng kem đánh răng thú y vị thịt 2-3 lần/tuần để tránh hôi miệng.',
    tag: 'Răng miệng'
  },
  {
    title: 'Khuyến khích mèo uống nhiều nước để ngừa sỏi thận',
    petType: 'cat',
    content: 'Mèo có thói quen lười uống nước đọng. Sử dụng đài phun nước lưu động hoặc bổ sung pate ướt trộn nước ấm sẽ giúp giảm 70% nguy cơ viêm bàng quang và sỏi tiết niệu.',
    tag: 'Dinh dưỡng'
  }
];

// Danh mục Chi tiêu Thú cưng
export const EXPENSE_CATEGORIES = {
  food: { label: 'Thức ăn & Bánh thưởng', icon: 'Utensils', color: 'bg-emerald-100 text-emerald-800' },
  medical: { label: 'Khám thú y & Thuốc men', icon: 'Stethoscope', color: 'bg-blue-100 text-blue-800' },
  grooming: { label: 'Spa & Cắt tỉa lông', icon: 'Sparkles', color: 'bg-purple-100 text-purple-800' },
  toys: { label: 'Đồ chơi & Phụ kiện', icon: 'Gamepad2', color: 'bg-amber-100 text-amber-800' },
  vaccine: { label: 'Tiêm phòng vắc-xin', icon: 'Syringe', color: 'bg-teal-100 text-teal-800' },
  hygiene: { label: 'Vệ sinh & Cát vệ sinh', icon: 'Trash2', color: 'bg-rose-100 text-rose-800' },
  other: { label: 'Chi phí khác', icon: 'Receipt', color: 'bg-slate-100 text-slate-800' }
};

export const INITIAL_EXPENSES = [
  {
    id: 'exp-1',
    petId: 'pet-1',
    petName: 'Mochi',
    category: 'food',
    title: 'Bao thức ăn Royal Canin Maxi Puppy 15kg',
    amount: 1850000, // VND
    date: '2026-04-01',
    notes: 'Mua tại Pet Mart kèm mã giảm giá 10%'
  },
  {
    id: 'exp-2',
    petId: 'pet-1',
    petName: 'Mochi',
    category: 'medical',
    title: 'Khám kiểm tra tai & thuốc nhỏ trị viêm tai',
    amount: 450000,
    date: '2026-03-25',
    notes: 'Phòng khám Sammi'
  },
  {
    id: 'exp-3',
    petId: 'pet-2',
    petName: 'Luna',
    category: 'food',
    title: 'Thùng Pate Ciao & hạt Orijen Cat & Kitten',
    amount: 920000,
    date: '2026-03-28',
    notes: 'Luna rất thích vị cá ngừ'
  },
  {
    id: 'exp-4',
    petId: 'pet-2',
    petName: 'Luna',
    category: 'hygiene',
    title: '2 Bao Cát đậu nành Tofu Cature 7L',
    amount: 320000,
    date: '2026-04-05',
    notes: 'Khử mùi tốt, không bụi'
  },
  {
    id: 'exp-5',
    petId: 'pet-1',
    petName: 'Mochi',
    category: 'grooming',
    title: 'Combo tắm spa, sấy lông, vệ sinh tai móng',
    amount: 350000,
    date: '2026-03-15',
    notes: 'Tiệm Paddy Spa'
  },
  {
    id: 'exp-6',
    petId: 'pet-3',
    petName: 'Bánh Bao',
    category: 'food',
    title: 'Cỏ Timothy nhập khẩu & Thức ăn nén cho Thỏ',
    amount: 280000,
    date: '2026-03-20',
    notes: 'Gói 2.5kg'
  }
];

// Nhật ký sinh hoạt hàng ngày
export const INITIAL_DAILY_LOGS = [
  {
    id: 'log-1',
    petId: 'pet-1',
    date: new Date().toISOString().split('T')[0],
    poopStatus: 'normal', // normal | soft | diarrhea | constipated
    peeStatus: 'normal', // normal | dark | frequent | painful
    walkMinutes: 45,
    mealStatus: 'good', // good | picky | refused
    mood: 'happy', // happy | calm | anxious | lethargic
    notes: 'Mochi chơi đùa rất hăng say ở công viên, ăn hết sạch phần ăn.'
  },
  {
    id: 'log-2',
    petId: 'pet-2',
    date: new Date().toISOString().split('T')[0],
    poopStatus: 'normal',
    peeStatus: 'normal',
    walkMinutes: 0,
    mealStatus: 'good',
    mood: 'calm',
    notes: 'Luna ngủ nhiều trên sofa, uống khoảng 150ml nước từ máy phun.'
  }
];

// Đơn thuốc đang điều trị
export const INITIAL_PRESCRIPTIONS = [
  {
    id: 'pres-1',
    petId: 'pet-1',
    medicineName: 'Men vi sinh Biotic Pet & Kháng viêm dị ứng',
    dosage: '1 gói/ngày, chia 2 lần sáng/tối',
    startDate: '2026-04-08',
    durationDays: 7,
    prescribedBy: 'BS. Tuấn - BV Thú y PetHealth',
    purpose: 'Hỗ trợ đường ruột và giảm ngứa do dị ứng nhẹ',
    notes: 'Pha trực tiếp vào pate hoặc nước ấm sau khi ăn'
  },
  {
    id: 'pres-2',
    petId: 'pet-2',
    medicineName: 'Gel dinh dưỡng Nourse & Dầu cá Hồi hồi phục lông',
    dosage: '3cm gel/ngày',
    startDate: '2026-04-01',
    durationDays: 30,
    prescribedBy: 'BS. Lan - Phòng khám Sammi',
    purpose: 'Bổ sung Omega 3 & Taurine giúp mượt lông',
    notes: 'Cho liếm trực tiếp trên ngón tay'
  }
];

// Danh bạ cứu hộ & bệnh viện thú y uy tín
export const PET_SERVICES = [
  {
    id: 'srv-1',
    name: 'Bệnh Viện Thú Y PetHealth 24/7',
    type: 'hospital',
    address: 'Số 240 Âu Cơ, Tây Hồ, Hà Nội',
    phone: '024 2242 8882',
    hotline: '1900 6868',
    is247: true,
    rating: 4.9,
    services: ['Cấp cứu 24/7', 'Phẫu thuật', 'X-Quang & Siêu âm', 'Xét nghiệm máu']
  },
  {
    id: 'srv-2',
    name: 'Phòng Khám Thú Y Sammi Pet Clinic',
    type: 'clinic',
    address: '159 Nguyễn Đình Chiểu, Quận 3, TP.HCM',
    phone: '028 3930 1234',
    hotline: '0903 123 456',
    is247: false,
    rating: 4.8,
    services: ['Tiêm phòng vắc-xin', 'Khám da liễu', 'Nha khoa thú cưng', 'Điều trị nội trú']
  },
  {
    id: 'srv-3',
    name: 'Paddy Spa & Pet Grooming Lounge',
    type: 'spa',
    address: '88 Trần Não, P. An Khánh, TP. Thủ Đức',
    phone: '0938 123 789',
    hotline: '0938 123 789',
    is247: false,
    rating: 4.9,
    services: ['Tắm sấy tạo kiểu', 'Nhuộm lông an toàn', 'Vệ sinh tai móng', 'Khách sạn thú cưng']
  }
];

// Thành viên gia đình cùng đồng chăm sóc (Co-Parenting)
export const INITIAL_FAMILY_MEMBERS = [
  {
    id: 'mem-1',
    name: 'Nguyễn Văn Hải (Bố)',
    role: 'owner', // owner | caregiver | vet
    roleLabel: 'Chủ sở hữu',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    phone: '0912 345 678',
    assignedPetIds: ['pet-1', 'pet-2', 'pet-3']
  },
  {
    id: 'mem-2',
    name: 'Trần Thu Trang (Mẹ)',
    role: 'caregiver',
    roleLabel: 'Người chăm sóc chính',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    phone: '0987 654 321',
    assignedPetIds: ['pet-1', 'pet-2', 'pet-3']
  },
  {
    id: 'mem-3',
    name: 'BS. Lê Minh Tuấn',
    role: 'vet',
    roleLabel: 'Bác sĩ thú y phụ trách',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120&q=80',
    phone: '024 2242 8882',
    assignedPetIds: ['pet-1', 'pet-2']
  }
];

// Thói quen & Công việc hàng ngày (Daily Habits & Streak)
export const INITIAL_DAILY_HABITS = [
  {
    id: 'habit-1',
    petId: 'pet-1',
    title: 'Cho Mochi ăn hạt bữa sáng (180g)',
    timeOfDay: 'morning', // morning | afternoon | evening
    completed: true,
    completedBy: 'Nguyễn Văn Hải (Bố)',
    completedAt: '07:15',
    streak: 14
  },
  {
    id: 'habit-2',
    petId: 'pet-1',
    title: 'Đi dạo công viên & ném bóng 30 phút',
    timeOfDay: 'afternoon',
    completed: false,
    completedBy: null,
    completedAt: null,
    streak: 12
  },
  {
    id: 'habit-3',
    petId: 'pet-1',
    title: 'Cho uống men tiêu hóa Biotic sau bữa tối',
    timeOfDay: 'evening',
    completed: false,
    completedBy: null,
    completedAt: null,
    streak: 9
  },
  {
    id: 'habit-4',
    petId: 'pet-2',
    title: 'Thay nước đài phun & cho Luna ăn 1 gói Pate Ciao',
    timeOfDay: 'morning',
    completed: true,
    completedBy: 'Trần Thu Trang (Mẹ)',
    completedAt: '08:00',
    streak: 21
  },
  {
    id: 'habit-5',
    petId: 'pet-2',
    title: 'Dọn và sàng cát vệ sinh cho Luna',
    timeOfDay: 'evening',
    completed: false,
    completedBy: null,
    completedAt: null,
    streak: 18
  }
];

// Đường cong tăng trưởng chuẩn của các giống loài (Growth Curves Standard)
export const BREED_GROWTH_STANDARDS = {
  'Golden Retriever': {
    species: 'dog',
    adultWeightRange: [25, 34], // kg
    monthlyStandards: [
      { month: 2, min: 4.5, max: 7.0, ideal: 5.8 },
      { month: 4, min: 11.0, max: 15.0, ideal: 13.0 },
      { month: 6, min: 18.0, max: 22.0, ideal: 20.0 },
      { month: 9, min: 22.0, max: 28.0, ideal: 25.0 },
      { month: 12, min: 25.0, max: 32.0, ideal: 28.5 },
      { month: 18, min: 26.0, max: 34.0, ideal: 30.0 },
      { month: 24, min: 27.0, max: 34.0, ideal: 30.5 }
    ],
    growthNotes: 'Chó Golden phát triển hệ khung xương mạnh nhất từ 3-8 tháng tuổi. Cần bổ sung Canxi Nano và Glucosamine để chống hạ bàn.'
  },
  'Mèo Anh Lông Ngắn (BSH)': {
    species: 'cat',
    adultWeightRange: [3.5, 6.5],
    monthlyStandards: [
      { month: 2, min: 0.8, max: 1.2, ideal: 1.0 },
      { month: 4, min: 1.6, max: 2.3, ideal: 2.0 },
      { month: 6, min: 2.4, max: 3.4, ideal: 2.9 },
      { month: 9, min: 3.2, max: 4.5, ideal: 3.8 },
      { month: 12, min: 3.5, max: 5.5, ideal: 4.4 },
      { month: 18, min: 3.8, max: 6.0, ideal: 4.8 },
      { month: 24, min: 4.0, max: 6.5, ideal: 5.0 }
    ],
    growthNotes: 'Mèo Anh lông ngắn có khung xương to, nọng má phúng phính. Cần kiểm soát lượng hạt sau khi triệt sản để tránh béo phì.'
  },
  'Thỏ Minilop': {
    species: 'rabbit',
    adultWeightRange: [1.4, 2.0],
    monthlyStandards: [
      { month: 2, min: 0.5, max: 0.8, ideal: 0.65 },
      { month: 4, min: 0.9, max: 1.3, ideal: 1.1 },
      { month: 6, min: 1.2, max: 1.7, ideal: 1.45 },
      { month: 12, min: 1.4, max: 2.0, ideal: 1.65 }
    ],
    growthNotes: 'Cần ăn 80% cỏ khô Timothy để mài răng cửa và bảo vệ hệ tiêu hóa.'
  }
};

