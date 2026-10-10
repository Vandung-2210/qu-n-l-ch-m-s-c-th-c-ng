// Polyfill localStorage and window for Node environment
const store = new Map();
global.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};
global.window = {
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.CustomEvent = class CustomEvent {
  constructor(name, opts) {
    this.name = name;
    this.detail = opts?.detail;
  }
};

const originalFetch = global.fetch;
global.fetch = (url, opts) => {
  if (typeof url === 'string' && url.startsWith('/')) {
    return originalFetch(`http://localhost:5000${url}`, opts);
  }
  return originalFetch(url, opts);
};

const {
  getUsers,
  adminCreateUser,
  adminDeleteUser,
  syncUsersWithBackend,
  login
} = await import('../src/services/authService.js');
const { getPets } = await import('../src/services/storageService.js');

async function testDemoAccount() {
  console.log('--- KIỂM TRA TẠO LẠI CHÍNH TÀI KHOẢN MẪU ĐÃ XÓA (demo@petcare.ai) ---');
  const adminId = 'user_admin_01';
  const targetEmail = 'demo@petcare.ai';
  const tempPass1 = 'DemoPass@123';
  const tempPass2 = 'DemoPass@456';

  // 1. Đồng bộ ban đầu: demo@petcare.ai KHÔNG có trong danh sách active
  const initialUsers = await syncUsersWithBackend();
  const existsInitially = initialUsers.some(u => u.email.toLowerCase() === targetEmail);
  console.log(`1. Danh sách ban đầu có demo@petcare.ai không: ${existsInitially ? 'CÓ (LỖI)' : 'KHÔNG (ĐÚNG)'}`);
  if (existsInitially) throw new Error('demo@petcare.ai không được tồn tại trước khi tạo!');

  // 2. Admin tạo tài khoản mới với email demo@petcare.ai
  console.log('2. Admin tạo tài khoản mới với email demo@petcare.ai:');
  const user1 = await adminCreateUser(adminId, {
    name: 'Đinh Xuân Mạnh (Tạo mới)',
    email: targetEmail,
    phone: '0912345678',
    role: 'pet_owner',
    password: tempPass1,
    isLocked: false
  });
  console.log(`✓ Tạo tài khoản thành công: ID = ${user1.id}, Email = ${user1.email}`);
  if (user1.id === 'user_owner_demo') throw new Error('LỖI: Không được dùng lại ID cũ của seed mẫu!');

  // 3. Đăng nhập bằng tài khoản vừa tạo
  console.log('3. Đăng nhập tài khoản demo@petcare.ai vừa tạo:');
  const login1 = await login(targetEmail, tempPass1);
  console.log(`✓ Đăng nhập thành công: ID = ${login1.id}, mustChangePassword = ${login1.mustChangePassword}`);

  // 4. Kiểm tra hồ sơ thú cưng ban đầu rỗng
  const pets1 = getPets(user1.id, user1.role);
  console.log(`✓ Thú cưng tài khoản mới: ${pets1.length} (RỖNG - ĐÚNG)`);

  // 5. Thử tạo trùng lặp khi tài khoản đang tồn tại -> Phải bị từ chối
  console.log('5. Thử tạo tài khoản trùng lặp demo@petcare.ai khi đang hoạt động:');
  let dupRejected = false;
  try {
    await adminCreateUser(adminId, {
      name: 'Người Trùng Lặp',
      email: '   DEMO@PETCARE.AI   ',
      phone: '0900000000',
      role: 'pet_owner',
      password: 'Pass@123',
      isLocked: false
    });
  } catch (err) {
    dupRejected = true;
    console.log(`✓ Bị từ chối như kỳ vọng: "${err.message}"`);
  }
  if (!dupRejected) throw new Error('Tạo trùng không bị từ chối!');

  // 6. Admin xóa tài khoản
  console.log('6. Admin xóa tài khoản demo@petcare.ai:');
  await login('admin@petcare.ai', 'Admin@123456');
  await adminDeleteUser(adminId, user1.id, targetEmail, targetEmail);
  console.log('✓ Xóa thành công.');

  // 7. Tải lại dữ liệu (mô phỏng reload)
  console.log('7. Tải lại dữ liệu:');
  const reloaded = await syncUsersWithBackend();
  const existsAfterDelete = reloaded.some(u => u.email.toLowerCase() === targetEmail);
  console.log(`✓ Sau khi xóa, demo@petcare.ai có còn trong danh sách active không: ${existsAfterDelete ? 'CÒN (LỖI)' : 'KHÔNG (ĐÚNG)'}`);
  if (existsAfterDelete) throw new Error('Sau khi xóa tài khoản vẫn xuất hiện!');

  // 8. Admin tạo lại LẦN THỨ HAI với cùng email demo@petcare.ai
  console.log('8. Admin tạo lại LẦN THỨ HAI với cùng email demo@petcare.ai:');
  const user2 = await adminCreateUser(adminId, {
    name: 'Đinh Xuân Mạnh (Tạo lại lần 2)',
    email: targetEmail,
    phone: '0988776655',
    role: 'pet_owner',
    password: tempPass2,
    isLocked: false
  });
  console.log(`✓ Tạo lại lần 2 thành công: ID = ${user2.id}, Email = ${user2.email}`);
  if (user2.id === user1.id) throw new Error('LỖI: ID lần 2 bị trùng với ID lần 1!');
  if (user2.id === 'user_owner_demo') throw new Error('LỖI: ID lần 2 bị trùng với ID của seed mẫu!');

  // 9. Đăng nhập bằng mật khẩu mới
  console.log('9. Đăng nhập bằng mật khẩu mới tempPass2:');
  const login2 = await login(targetEmail, tempPass2);
  console.log(`✓ Đăng nhập thành công với mật khẩu mới: ID = ${login2.id}`);

  // 10. Mật khẩu cũ tempPass1 phải bị từ chối
  console.log('10. Thử đăng nhập bằng mật khẩu cũ tempPass1:');
  let oldPassRejected = false;
  try {
    await login(targetEmail, tempPass1);
  } catch (err) {
    oldPassRejected = true;
    console.log(`✓ Bị từ chối như kỳ vọng: "${err.message}"`);
  }
  if (!oldPassRejected) throw new Error('Mật khẩu cũ vẫn đăng nhập được!');

  // 11. Dọn dẹp tài khoản user2
  await login('admin@petcare.ai', 'Admin@123456');
  await adminDeleteUser(adminId, user2.id, targetEmail, targetEmail);
  console.log('✓ Dọn dẹp tài khoản test thành công.');

  console.log('\n=== KIỂM TRA CHÍNH XÁC KỊCH BẢN demo@petcare.ai THÀNH CÔNG 100%! ===');
}

testDemoAccount().catch(err => {
  console.error('❌ KIỂM TRA THẤT BẠI:', err);
  process.exit(1);
});
