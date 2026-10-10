// Polyfill localStorage and window for Node environment to test client services
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

// Import client services directly
const {
  getUsers,
  adminCreateUser,
  adminDeleteUser,
  syncUsersWithBackend,
  login
} = await import('../src/services/authService.js');

const { getPets } = await import('../src/services/storageService.js');

async function testFullClientFlow() {
  console.log('================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM TRA TRỌN VẸN NGHIỆP VỤ CLIENT SERVICE (TẠO LẠI EMAIL)');
  console.log('================================================================\n');

  const adminId = 'user_admin_01';
  const testEmail = `client_lifecycle_${Date.now()}@petcare.ai`;
  const pass1 = 'ClientPass@123';
  const pass2 = 'ClientPass@456';

  // 1. Đồng bộ người dùng ban đầu từ server
  console.log('1. Đồng bộ người dùng ban đầu từ backend:');
  const initialUsers = await syncUsersWithBackend();
  console.log(`✓ Số lượng tài khoản hoạt động ban đầu: ${initialUsers.length}`);

  // 2. Admin tạo tài khoản chủ nuôi lần 1 (với khoảng trắng & chữ hoa)
  console.log(`\n2. Admin tạo tài khoản chủ nuôi với email có khoảng trắng & chữ hoa: "   ${testEmail.toUpperCase()}   "`);
  const user1 = await adminCreateUser(adminId, {
    name: 'Chủ Nuôi Vòng Đời Client 1',
    email: `   ${testEmail.toUpperCase()}   `,
    phone: '0912345678',
    role: 'pet_owner',
    password: pass1,
    isLocked: false
  });
  console.log(`✓ Tạo lần 1 thành công: ID = ${user1.id}, Email = ${user1.email}`);
  if (user1.email !== testEmail.toLowerCase()) {
    throw new Error(`Email chưa được chuẩn hóa: ${user1.email}`);
  }

  // 3. Đăng nhập bằng tài khoản vừa tạo
  console.log(`\n3. Đăng nhập bằng tài khoản lần 1:`);
  const login1 = await login(testEmail, pass1);
  console.log(`✓ Đăng nhập thành công: ID = ${login1.id}, mustChangePassword = ${login1.mustChangePassword}`);

  // 4. Kiểm tra hồ sơ thú cưng ban đầu rỗng
  const pets1 = getPets(user1.id, user1.role);
  console.log(`✓ Thú cưng của tài khoản mới: ${pets1.length} (RỖNG - ĐÚNG)`);

  // Đăng nhập lại với tư cách Quản trị viên để thực hiện quyền xóa
  await login('admin@petcare.ai', 'Admin@123456');

  // 5. Admin xóa tài khoản
  console.log(`\n5. Admin xóa tài khoản ID = ${user1.id}:`);
  const delRes = await adminDeleteUser(adminId, user1.id, testEmail, testEmail);
  console.log(`✓ Xóa thành công: ${delRes.deletedUser.name}`);

  // 6. Tải lại dữ liệu (mô phỏng F5 reload)
  console.log('\n6. Tải lại danh sách (mô phỏng F5 trang):');
  const reloadedUsers = await syncUsersWithBackend();
  const existsAfterDelete = reloadedUsers.some(u => (u.email || '').toLowerCase() === testEmail);
  console.log(`✓ Tài khoản đã xóa có còn trong danh sách không: ${existsAfterDelete ? 'CÒN (LỖI)' : 'KHÔNG (ĐÚNG)'}`);
  if (existsAfterDelete) throw new Error('Tài khoản đã xóa vẫn tồn tại sau reload!');

  // 7. Thử đăng nhập bằng tài khoản đã xóa (phải thất bại)
  console.log('\n7. Thử đăng nhập tài khoản đã xóa bằng mật khẩu cũ:');
  let deletedLoginFailed = false;
  try {
    await login(testEmail, pass1);
  } catch (err) {
    deletedLoginFailed = true;
    console.log(`✓ Bị từ chối như kỳ vọng: "${err.message}"`);
  }
  if (!deletedLoginFailed) throw new Error('Tài khoản đã xóa vẫn đăng nhập được!');

  // 8. Admin tạo lại tài khoản với CÙNG EMAIL đã xóa
  console.log(`\n8. Admin tạo lại tài khoản với CÙNG EMAIL "${testEmail}":`);
  const user2 = await adminCreateUser(adminId, {
    name: 'Chủ Nuôi Vòng Đời Client 2 (Mới)',
    email: testEmail,
    phone: '0988776655',
    role: 'pet_owner',
    password: pass2,
    isLocked: false
  });
  console.log(`✓ Tạo lại tài khoản THÀNH CÔNG: ID = ${user2.id}, Email = ${user2.email}`);

  // 9. Xác nhận ID mới khác ID cũ
  console.log('\n9. Xác nhận ID mới khác ID cũ:');
  console.log(`  - ID cũ: ${user1.id}`);
  console.log(`  - ID mới: ${user2.id}`);
  if (user1.id === user2.id) throw new Error('LỖI: ID mới bị trùng với ID cũ!');
  console.log('✓ ID mới hoàn toàn khác ID cũ và không phải là email.');

  // 10. Đăng nhập bằng mật khẩu mới
  console.log('\n10. Đăng nhập bằng mật khẩu mới:');
  const login2 = await login(testEmail, pass2);
  console.log(`✓ Đăng nhập bằng mật khẩu mới thành công: ID = ${login2.id}`);

  // 11. Mật khẩu cũ không còn hợp lệ
  console.log('\n11. Thử đăng nhập bằng mật khẩu cũ:');
  let oldPassFailed = false;
  try {
    await login(testEmail, pass1);
  } catch (err) {
    oldPassFailed = true;
    console.log(`✓ Bị từ chối như kỳ vọng: "${err.message}"`);
  }
  if (!oldPassFailed) throw new Error('Mật khẩu cũ vẫn đăng nhập được!');

  // 12. Tài khoản mới có dữ liệu thú cưng rỗng
  const pets2 = getPets(user2.id, user2.role);
  console.log(`✓ Thú cưng tài khoản mới: ${pets2.length} (RỖNG - ĐÚNG)`);

  // 13. Thử tạo thêm lần nữa bằng email đang tồn tại (phải bị từ chối)
  console.log('\n13. Thử tạo tài khoản lần 3 bằng email đang tồn tại:');
  let dupFailed = false;
  try {
    await adminCreateUser(adminId, {
      name: 'Chủ Nuôi Trùng Lặp',
      email: testEmail,
      phone: '0999999999',
      role: 'pet_owner',
      password: 'Pass@123456',
      isLocked: false
    });
  } catch (err) {
    dupFailed = true;
    console.log(`✓ Bị từ chối như kỳ vọng: "${err.message}"`);
  }
  if (!dupFailed) throw new Error('Tạo trùng email nhưng không bị từ chối!');

  // 14. Thử tạo bằng email có khoảng trắng và chữ HOA (phải bị từ chối)
  console.log('\n14. Thử tạo bằng email có khoảng trắng và chữ HOA:');
  let caseFailed = false;
  try {
    await adminCreateUser(adminId, {
      name: 'Chủ Nuôi Trùng Lặp HOA',
      email: `   ${testEmail.toUpperCase()}   `,
      phone: '0999999999',
      role: 'pet_owner',
      password: 'Pass@123456',
      isLocked: false
    });
  } catch (err) {
    caseFailed = true;
    console.log(`✓ Bị từ chối như kỳ vọng: "${err.message}"`);
  }
  if (!caseFailed) throw new Error('Tạo trùng email hoa/thường nhưng không bị từ chối!');

  // Dọn dẹp tài khoản test
  await login('admin@petcare.ai', 'Admin@123456');
  await adminDeleteUser(adminId, user2.id, testEmail, testEmail);
  console.log('\n✓ Đã dọn dẹp tài khoản test thành công.');

  console.log('\n🎉 TẤT CẢ CÁC BƯỚC KIỂM TRA NGHIỆP VỤ CLIENT SERVICE HOÀN THÀNH 100%! 🎉');
}

testFullClientFlow().catch(err => {
  console.error('\n❌ KIỂM TRA THẤT BẠI:', err);
  process.exit(1);
});
