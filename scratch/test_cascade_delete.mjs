import assert from 'assert';

// Mock localStorage for Node.js environment
const mockStorage = new Map();
global.localStorage = {
  getItem: (key) => mockStorage.get(key) || null,
  setItem: (key, value) => mockStorage.set(key, String(value)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
  get length() { return mockStorage.size; },
  key: (i) => Array.from(mockStorage.keys())[i] || null
};

// Mock window and dispatchEvent
global.window = {
  dispatchEvent: (event) => {
    // console.log(`[Event dispatched]: ${event.type}`);
  }
};
global.CustomEvent = class CustomEvent {
  constructor(type, params = {}) {
    this.type = type;
    this.detail = params.detail;
  }
};

// Import storageService functions
const {
  getPets,
  savePets,
  addPet,
  deletePet,
  getSchedules,
  saveSchedules,
  addSchedule,
  getExpenses,
  saveExpenses,
  addExpense,
  getDailyLogs,
  saveDailyLogs,
  addDailyLog,
  getPrescriptions,
  savePrescriptions,
  addPrescription,
  getDailyHabits,
  saveDailyHabits,
  getFamilyMembers,
  saveFamilyMembers,
  addFamilyMember,
  getAppointments,
  saveActiveAppointments,
  handleUserDeletedCascade,
  auditOrphanedPets,
  cleanupDeletedOwnersPets
} = await import('../src/services/storageService.js');

async function runCascadeDeleteTests() {
  console.log('🚀 Bắt đầu bộ kiểm thử toàn diện: Cơ chế xóa tài khoản chủ nuôi & dọn dữ liệu tồn đọng...');

  // Setup initial active users in storage
  const activeUsers = [
    { id: 'admin_1', name: 'Quản trị viên', email: 'admin@petcare.ai', role: 'system_admin' },
    { id: 'owner_A', name: 'Chủ Nuôi A', email: 'owner_a@petcare.ai', role: 'pet_owner' },
    { id: 'owner_B', name: 'Chủ Nuôi B', email: 'owner_b@petcare.ai', role: 'pet_owner' },
    { id: 'vet_1', name: 'BS. Tuấn', email: 'vet_1@petcare.ai', role: 'vet_doctor' }
  ];
  localStorage.setItem('petcare_auth_users_v1', JSON.stringify(activeUsers));
  localStorage.setItem('petcare_deleted_users_v1', JSON.stringify([]));
  localStorage.setItem('petcare_system_initialized_v2', 'true');

  // =========================================================================
  // TEST 1: THÊM DỮ LIỆU CHO 2 CHỦ NUÔI KHÁC NHAU
  // =========================================================================
  console.log('\n--- 1. Thiết lập thú cưng và dữ liệu chăm sóc cho 2 chủ nuôi ---');

  // Thú cưng của Owner A
  const petA1 = addPet({
    id: 'pet_A_1',
    name: 'Kiki',
    species: 'dog',
    breed: 'Poodle',
    weight: 5.5,
    ownerId: 'owner_A'
  }, false, 'owner_A');

  const petA2 = addPet({
    id: 'pet_A_2',
    name: 'Mimi',
    species: 'cat',
    breed: 'Mèo Mướp',
    weight: 3.8,
    ownerId: 'owner_A'
  }, false, 'owner_A');

  // Thú cưng của Owner B
  const petB1 = addPet({
    id: 'pet_B_1',
    name: 'Bông',
    species: 'dog',
    breed: 'Corgi',
    weight: 11.2,
    ownerId: 'owner_B',
    sharedWithUserIds: ['owner_A'] // Chia sẻ quyền xem với Owner A
  }, false, 'owner_B');

  // Thêm dữ liệu chăm sóc gắn liền với pet của Owner A
  addSchedule({ id: 'sch_A_1', petId: 'pet_A_1', title: 'Tiêm phòng dại', date: '2026-10-15', ownerId: 'owner_A' }, 'owner_A');
  addExpense({ id: 'exp_A_1', petId: 'pet_A_1', title: 'Mua thức ăn hạt', amount: 350000, date: '2026-10-09' }, 'owner_A');
  addDailyLog({ id: 'log_A_1', petId: 'pet_A_1', note: 'Ăn khỏe, đi dạo 30p', date: '2026-10-09' }, 'owner_A');
  addPrescription({ id: 'pres_A_1', petId: 'pet_A_1', medicineName: 'NexGard Spectra', durationDays: 1, ownerId: 'owner_A' }, 'owner_A');
  addFamilyMember({ id: 'mem_A_1', name: 'Em gái của A', relation: 'Sister' }, 'owner_A');

  // Thêm dữ liệu chăm sóc gắn liền với pet của Owner B
  addSchedule({ id: 'sch_B_1', petId: 'pet_B_1', title: 'Tẩy giun định kỳ', date: '2026-10-20', ownerId: 'owner_B' }, 'owner_B');
  addExpense({ id: 'exp_B_1', petId: 'pet_B_1', title: 'Pate cao cấp', amount: 200000, date: '2026-10-09' }, 'owner_B');

  const initialPets = getPets();
  assert.strictEqual(initialPets.length, 3, 'Tổng số thú cưng ban đầu phải là 3');
  console.log('✅ 1. Khởi tạo thành công: 2 thú cưng cho Owner A, 1 thú cưng cho Owner B');

  // =========================================================================
  // TEST 2: ADMIN XÓA CHỦ NUÔI A (CASCADE DELETE THEO CHỦ SỞ HỮU)
  // =========================================================================
  console.log('\n--- 2. Kiểm thử xóa tài khoản Chủ nuôi A (Cascade delete) ---');

  // Đặt phiên làm việc giả định của Owner A
  localStorage.setItem('petcare_active_user', JSON.stringify({ id: 'owner_A', email: 'owner_a@petcare.ai' }));
  localStorage.setItem('petcare_is_authenticated', 'true');

  // Thực hiện xóa cascade
  handleUserDeletedCascade('owner_A', 'pet_owner');

  // 2.1. Kiểm tra thú cưng của Owner A bị xóa
  const petsAfterDeleteA = getPets();
  const petIdsAfterDeleteA = petsAfterDeleteA.map(p => p.id);
  assert.ok(!petIdsAfterDeleteA.includes('pet_A_1'), 'Thú cưng pet_A_1 của Owner A phải bị xóa');
  assert.ok(!petIdsAfterDeleteA.includes('pet_A_2'), 'Thú cưng pet_A_2 của Owner A phải bị xóa');
  console.log('✅ 2.1. Toàn bộ thú cưng của Owner A đã bị xóa vĩnh viễn');

  // 2.2. Kiểm tra thú cưng của Owner B vẫn NGUYÊN VẸN
  assert.ok(petIdsAfterDeleteA.includes('pet_B_1'), 'Thú cưng pet_B_1 của Owner B phải còn nguyên');
  const petB = petsAfterDeleteA.find(p => p.id === 'pet_B_1');
  assert.strictEqual(petB.name, 'Bông');
  assert.ok(!petB.sharedWithUserIds?.includes('owner_A'), 'Liên kết chia sẻ với Owner A đã được gỡ an toàn');
  console.log('✅ 2.2. Thú cưng của Owner B được bảo toàn tuyệt đối');

  // 2.3. Kiểm tra toàn bộ dữ liệu chăm sóc của Owner A bị xóa sạch
  const schedulesAfter = getSchedules();
  assert.ok(!schedulesAfter.some(s => s.petId === 'pet_A_1' || s.ownerId === 'owner_A'), 'Lịch của Owner A phải bị xóa');
  assert.ok(schedulesAfter.some(s => s.petId === 'pet_B_1'), 'Lịch của Owner B phải còn nguyên');

  const expensesAfter = getExpenses();
  assert.ok(!expensesAfter.some(e => e.petId === 'pet_A_1' || e.ownerId === 'owner_A'), 'Chi tiêu của Owner A phải bị xóa');
  assert.ok(expensesAfter.some(e => e.petId === 'pet_B_1'), 'Chi tiêu của Owner B phải còn nguyên');

  const logsAfter = getDailyLogs();
  assert.ok(!logsAfter.some(l => l.petId === 'pet_A_1' || l.ownerId === 'owner_A'), 'Nhật ký của Owner A phải bị xóa');

  const prescriptionsAfter = getPrescriptions();
  assert.ok(!prescriptionsAfter.some(pr => pr.petId === 'pet_A_1' || pr.ownerId === 'owner_A'), 'Đơn thuốc của Owner A phải bị xóa');

  const familyAfter = getFamilyMembers();
  assert.ok(!familyAfter.some(m => m.ownerId === 'owner_A'), 'Thành viên gia đình của Owner A phải bị xóa');
  console.log('✅ 2.3. Lịch chăm sóc, chi tiêu, nhật ký, đơn thuốc của Owner A bị xóa dây chuyền triệt để');

  // 2.4. Kiểm tra phiên đăng nhập của Owner A đã bị thu hồi
  assert.strictEqual(localStorage.getItem('petcare_active_user'), null, 'Phiên đăng nhập của tài khoản bị xóa phải bị thu hồi');
  assert.strictEqual(localStorage.getItem('petcare_is_authenticated'), null, 'Cờ xác thực phải bị thu hồi');
  console.log('✅ 2.4. Phiên đăng nhập của tài khoản bị xóa đã bị thu hồi ngay lập tức');

  // =========================================================================
  // TEST 3: XÓA TÀI KHOẢN BÁC SĨ THÚ Y KHÔNG XÓA THÚ CƯNG CỦA CHỦ NUÔI
  // =========================================================================
  console.log('\n--- 3. Kiểm thử xóa tài khoản Bác sĩ thú y ---');

  // Phân công Bác sĩ Tuấn phụ trách pet của Owner B
  const allCurrentPets = getPets();
  savePets(allCurrentPets.map(p => p.id === 'pet_B_1' ? { ...p, assignedVetId: 'vet_1' } : p));

  handleUserDeletedCascade('vet_1', 'vet_doctor');

  const petsAfterVetDelete = getPets();
  const petBAfterVet = petsAfterVetDelete.find(p => p.id === 'pet_B_1');
  assert.ok(petBAfterVet, 'Thú cưng của Owner B KHÔNG được bị xóa khi xóa Bác sĩ thú y');
  assert.strictEqual(petBAfterVet.assignedVetId, null, 'Phân công bác sĩ đã xóa phải được thu hồi an toàn');
  console.log('✅ 3. Xóa Bác sĩ thú y: Không xóa thú cưng của chủ nuôi, chỉ thu hồi phân công');

  // =========================================================================
  // TEST 4: AUDIT HỒ SƠ TỒN ĐỌNG & DỌN DẸP HỒ SƠ TÀI KHOẢN ĐÃ XÓA
  // =========================================================================
  console.log('\n--- 4. Kiểm thử rà soát (Audit) và dọn dẹp hồ sơ tồn đọng ---');

  // Giả lập trạng thái gồm:
  // - 1 pet của active user (owner_B)
  // - 2 pet của deleted user (owner_deleted_1)
  // - 1 pet mẫu ban đầu (pet-1 Mochi) gắn với deleted user
  // - 1 pet thiếu ownerId (unclear)
  const testAuditPets = [
    { id: 'pet_B_1', name: 'Bông', ownerId: 'owner_B' }, // active
    { id: 'pet_orphan_1', name: 'Miu Miu', ownerId: 'user_deleted_123', isOwnerDeleted: true }, // deleted owner
    { id: 'pet-1', name: 'Mochi', ownerId: 'user_owner_demo' }, // sample pet, demo owner deleted
    { id: 'pet_unclear_1', name: 'Bé Không Rõ Chủ', ownerId: '' } // missing ownerId
  ];
  savePets(testAuditPets);

  const deletedUsersList = [
    { id: 'user_deleted_123', email: 'deleted@petcare.ai' },
    { id: 'user_owner_demo', email: 'demo@petcare.ai' }
  ];
  localStorage.setItem('petcare_deleted_users_v1', JSON.stringify(deletedUsersList));

  // Thực hiện audit
  const auditResult = auditOrphanedPets();
  console.log(`Kết quả audit: Tổng ${auditResult.totalPets} hồ sơ:`, {
    confirmedDeletedOwnerPets: auditResult.confirmedDeletedOwnerPets.length,
    unclearOwnerPets: auditResult.unclearOwnerPets.length,
    activeOwnerPets: auditResult.activeOwnerPets.length
  });

  assert.strictEqual(auditResult.confirmedDeletedOwnerPets.length, 2, 'Phải phát hiện 2 hồ sơ thuộc tài khoản đã xóa');
  assert.strictEqual(auditResult.unclearOwnerPets.length, 1, 'Phải phát hiện 1 hồ sơ thiếu ownerId');
  assert.strictEqual(auditResult.activeOwnerPets.length, 1, 'Phải phát hiện 1 hồ sơ thuộc tài khoản đang hoạt động');
  assert.strictEqual(auditResult.unclearOwnerPets[0].id, 'pet_unclear_1', 'Hồ sơ thiếu ownerId phải được báo riêng');
  console.log('✅ 4.1. Audit phân loại chính xác 3 nhóm: Đã xóa, Thiếu ownerId (báo riêng), Đang hoạt động (bảo vệ)');

  // Thực hiện dọn dẹp các hồ sơ của tài khoản đã xóa
  const cleanupRes = cleanupDeletedOwnersPets();
  assert.strictEqual(cleanupRes.count, 2, 'Phải dọn sạch đúng 2 hồ sơ của tài khoản đã xóa');

  const petsAfterCleanup = getPets();
  assert.strictEqual(petsAfterCleanup.length, 2, 'Sau khi dọn, còn lại 2 hồ sơ (1 active + 1 unclear)');
  assert.ok(petsAfterCleanup.some(p => p.id === 'pet_B_1'), 'Hồ sơ tài khoản còn tồn tại (pet_B_1) KHÔNG bị xóa');
  assert.ok(petsAfterCleanup.some(p => p.id === 'pet_unclear_1'), 'Hồ sơ thiếu ownerId KHÔNG bị tự ý xóa');
  console.log('✅ 4.2. Dọn dẹp hoàn tất: Không tự xóa hồ sơ tài khoản còn tồn tại và không tự đoán xóa hồ sơ thiếu ownerId');

  // =========================================================================
  // TEST 5: NGĂN DỮ LIỆU TỰ XUẤT HIỆN LẠI KHI DANH SÁCH RỖNG
  // =========================================================================
  console.log('\n--- 5. Kiểm thử ngăn dữ liệu tự tái sinh (Data resurrection prevention) ---');

  // Xóa nốt tất cả thú cưng để đưa về mảng rỗng []
  savePets([]);
  assert.strictEqual(getPets().length, 0, 'Danh sách thú cưng rỗng [] là trạng thái hợp lệ');

  // Gọi getPets() nhiều lần để xác nhận không tự thêm dữ liệu mẫu
  const call1 = getPets();
  const call2 = getPets();
  assert.strictEqual(call1.length, 0, 'Lần gọi 1: Danh sách phải duy trì 0');
  assert.strictEqual(call2.length, 0, 'Lần gọi 2: Danh sách phải duy trì 0');
  console.log('✅ 5.1. Danh sách thú cưng rỗng [] được tôn trọng tuyệt đối, không tự thêm mock data');

  // Kiểm tra getSchedules không tự gán user_owner_demo
  saveSchedules([]);
  assert.strictEqual(getSchedules().length, 0, 'Lịch trình rỗng duy trì 0, không tự thêm mock data');
  console.log('✅ 5.2. Lịch trình rỗng duy trì 0, không tự tái sinh');

  console.log('\n=============================================================');
  console.log('🎉 TẤT CẢ CÁC BÀI KIỂM THỬ XÓA DÂY CHUYỀN ĐÃ VƯỢT QUA 100%!');
  console.log('=============================================================\n');
}

runCascadeDeleteTests().catch(err => {
  console.error('❌ Kiểm thử thất bại:', err);
  process.exit(1);
});
