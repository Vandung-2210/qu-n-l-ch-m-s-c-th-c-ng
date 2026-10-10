import assert from 'assert';

// Mô phỏng môi trường localStorage trình duyệt chuẩn xác
const storageStore = new Map();
global.localStorage = {
  getItem: (key) => storageStore.get(key) || null,
  setItem: (key, val) => storageStore.set(key, String(val)),
  removeItem: (key) => storageStore.delete(key),
  clear: () => {
    throw new Error('VI PHẠM YÊU CẦU: Không được phép sử dụng localStorage.clear()!');
  },
  get length() {
    return storageStore.size;
  },
  key: (i) => Array.from(storageStore.keys())[i] || null
};

// Import trực tiếp các dịch vụ
const { 
  handleUserDeletedDataRetention, 
  getPets, 
  savePets 
} = await import('../src/services/storageService.js');

const { 
  getUsers, 
  adminDeleteUser, 
  AUTH_STORAGE_KEYS, 
  ROLES, 
  INITIAL_PET_OWNER, 
  INITIAL_VET_DOCTOR, 
  INITIAL_SYSTEM_ADMIN 
} = await import('../src/services/authService.js');

async function testFrontendStorageRetention() {
  console.log('🧪 Bắt đầu kiểm thử Frontend Storage & Data Retention & Anti-Resurrection...');

  // 1. Chuẩn bị dữ liệu thú cưng và người dùng
  const ownerIdA = 'user_owner_alpha_111';
  const ownerIdB = 'user_owner_beta_222';
  const vetIdC = 'user_vet_charlie_333';

  const mockPets = [
    {
      id: 'pet_01',
      name: 'Mochi (Của Alpha)',
      ownerId: ownerIdA,
      sharedWithVetIds: [vetIdC],
      assignedVetId: vetIdC,
      handoverToken: 'token_alpha_123',
      handoverLink: 'https://petcare.ai/handover/token_alpha_123'
    },
    {
      id: 'pet_02',
      name: 'Bánh Bao (Của Beta)',
      ownerId: ownerIdB,
      sharedWithVetIds: [vetIdC],
      assignedVetId: vetIdC
    }
  ];
  savePets(mockPets);

  const mockAppointments = [
    { id: 'appt_01', petId: 'pet_01', assignedVetId: vetIdC },
    { id: 'appt_02', petId: 'pet_02', assignedVetId: vetIdC }
  ];
  localStorage.setItem('petcare_appointments_v1', JSON.stringify(mockAppointments));

  // Giả lập phiên đang đăng nhập của ownerIdA
  localStorage.setItem('petcare_active_user', JSON.stringify({ id: ownerIdA, email: 'alpha@petcare.ai' }));
  localStorage.setItem('petcare_current_user', JSON.stringify({ id: ownerIdA, email: 'alpha@petcare.ai' }));
  localStorage.setItem('petcare_is_authenticated', 'true');

  console.log('✅ 1. Khởi tạo dữ liệu mô phỏng thành công');

  // 2. Thực hiện xóa an toàn và bảo lưu dữ liệu của ownerIdA
  handleUserDeletedDataRetention(ownerIdA, ROLES.PET_OWNER);

  const petsAfter = getPets(null, 'system_admin');
  const petA = petsAfter.find(p => p.id === 'pet_01');
  const petB = petsAfter.find(p => p.id === 'pet_02');

  // Kiểm tra hồ sơ thú cưng của ownerIdA được bảo lưu an toàn nhưng đánh dấu đã xóa
  assert.strictEqual(petA.isOwnerDeleted, true, 'Hồ sơ thú cưng pet_01 phải được đánh dấu isOwnerDeleted = true');
  assert.strictEqual(petA.ownerDeleted, true, 'ownerDeleted phải là true');
  assert.strictEqual(petA.ownerId, ownerIdA, 'Không tự ý chuyển nhượng ownerId sang người khác');
  assert.deepStrictEqual(petA.sharedWithVetIds, [], 'Quyền chia sẻ với bác sĩ phải bị thu hồi hoàn toàn');
  assert.strictEqual(petA.handoverToken, null, 'Liên kết bàn giao phải bị thu hồi (null)');
  assert.strictEqual(petA.handoverLink, null);

  // Kiểm tra hồ sơ thú cưng của ownerIdB không bị ảnh hưởng
  assert.strictEqual(petB.isOwnerDeleted, undefined, 'Hồ sơ pet_02 của Beta không bị ảnh hưởng');
  assert.strictEqual(petB.ownerId, ownerIdB);
  console.log('✅ 2. Hồ sơ thú cưng của chủ nuôi bị xóa được bảo lưu an toàn, đánh dấu đã xóa và thu hồi quyền chia sẻ');

  // 3. Kiểm tra bảo mật: Bác sĩ thú y KHÔNG nhìn thấy hồ sơ của chủ nuôi đã bị xóa
  const vetPets = getPets(vetIdC, 'vet_doctor');
  const vetPetIds = vetPets.map(p => p.id);
  assert.ok(!vetPetIds.includes('pet_01'), 'Bác sĩ thú y không được nhìn thấy hồ sơ của chủ nuôi đã bị xóa');
  assert.ok(vetPetIds.includes('pet_02'), 'Bác sĩ thú y vẫn nhìn thấy hồ sơ hợp lệ của chủ nuôi khác');
  console.log('✅ 3. Dữ liệu bảo lưu không bị công khai cho bác sĩ thú y');

  // 4. Kiểm tra quyền sở hữu dựa trên ID duy nhất: Tài khoản mới có cùng email không kế thừa dữ liệu
  const newOwnerSameEmailId = 'user_owner_new_unique_999';
  const newOwnerPets = getPets(newOwnerSameEmailId, 'pet_owner');
  assert.strictEqual(newOwnerPets.length, 0, 'Tài khoản mới tạo không được kế thừa dữ liệu của tài khoản cũ dù trùng email');
  console.log('✅ 4. Quyền sở hữu dựa trên ID duy nhất: Tài khoản mới không kế thừa dữ liệu cũ');

  // 5. Kiểm tra phiên đăng nhập của tài khoản bị xóa đã bị thu hồi
  assert.strictEqual(localStorage.getItem('petcare_active_user'), null, 'Phiên petcare_active_user phải bị thu hồi');
  assert.strictEqual(localStorage.getItem('petcare_current_user'), null, 'Phiên petcare_current_user phải bị thu hồi');
  assert.strictEqual(localStorage.getItem('petcare_is_authenticated'), null, 'petcare_is_authenticated phải bị xóa');
  console.log('✅ 5. Phiên đăng nhập của tài khoản bị xóa đã bị thu hồi hoàn toàn mà không dùng localStorage.clear()');

  // 6. Kiểm tra xóa Bác sĩ thú y: Thu hồi phân công và chia sẻ
  handleUserDeletedDataRetention(vetIdC, ROLES.VET_DOCTOR);
  const petsAfterVetDelete = getPets(null, 'system_admin');
  const petBAfter = petsAfterVetDelete.find(p => p.id === 'pet_02');
  assert.ok(!petBAfter.sharedWithVetIds.includes(vetIdC), 'Bác sĩ bị xóa phải bị gỡ khỏi sharedWithVetIds');
  assert.strictEqual(petBAfter.assignedVetId, null, 'assignedVetId phải bị hủy gán');

  const apptsAfter = JSON.parse(localStorage.getItem('petcare_appointments_v1'));
  assert.strictEqual(apptsAfter[1].assignedVetId, null, 'Lịch hẹn với bác sĩ bị xóa phải được unassign');
  console.log('✅ 6. Xóa tài khoản bác sĩ thu hồi quyền phân công và chia sẻ');

  // 7. Kiểm tra CHỐNG TÁI SINH TÀI KHOẢN MẪU (ANTI-RESURRECTION OF SEED ACCOUNTS)
  // Giả lập xóa tài khoản demo@petcare.ai
  const initialUsers = getUsers();
  const demoUser = initialUsers.find(u => u.email === 'demo@petcare.ai');
  assert.ok(demoUser, 'Tài khoản demo ban đầu phải tồn tại');

  // Ghi nhận xóa demoUser
  const deletedSeeds = [
    { id: demoUser.id, email: demoUser.email.toLowerCase(), deletedAt: new Date().toISOString() }
  ];
  localStorage.setItem(AUTH_STORAGE_KEYS.DELETED_USERS, JSON.stringify(deletedSeeds));

  // Loại bỏ khỏi USERS
  const remainingUsers = initialUsers.filter(u => u.email !== 'demo@petcare.ai');
  localStorage.setItem(AUTH_STORAGE_KEYS.USERS, JSON.stringify(remainingUsers));

  // Gọi getUsers() nhiều lần (như khi tải lại trang, chuyển tab, đăng nhập)
  const usersAfterReload1 = getUsers();
  assert.ok(!usersAfterReload1.some(u => u.email === 'demo@petcare.ai'), 'Lần 1: demo@petcare.ai không được tự tái sinh');

  const usersAfterReload2 = getUsers();
  assert.ok(!usersAfterReload2.some(u => u.email === 'demo@petcare.ai'), 'Lần 2: demo@petcare.ai không được tự tái sinh');

  console.log('✅ 7. Tài khoản mẫu demo@petcare.ai sau khi xóa không bao giờ tự động tái sinh');

  console.log('\n=============================================================');
  console.log('🎉 TẤT CẢ 7/7 KIỂM THỬ FRONTEND STORAGE & BẢO LƯU ĐÃ ĐẠT!');
  console.log('=============================================================\n');
}

testFrontendStorageRetention().catch(err => {
  console.error('❌ Kiểm thử frontend storage thất bại:', err);
  process.exit(1);
});
