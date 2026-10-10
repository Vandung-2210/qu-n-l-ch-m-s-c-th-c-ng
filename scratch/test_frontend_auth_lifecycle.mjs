import assert from 'assert';

// 1. Mock LocalStorage & Browser environment
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear()
};

global.window = {
  location: { pathname: '/login', search: '', hash: '' },
  history: { replaceState: () => {} },
  dispatchEvent: () => {}
};

// 2. Mock Backend fetch
global.fetch = async (url, options = {}) => {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body) : {};

  if (url.includes('/api/auth/deleted-users')) {
    return {
      ok: true,
      json: async () => [{ id: 'user_owner_demo', email: '', deletedAt: new Date().toISOString() }]
    };
  }

  if (url.includes('/api/auth/users')) {
    return {
      ok: true,
      json: async () => [
        { id: 'user_admin_01', name: 'Quản trị viên Hệ thống', email: 'admin@petcare.ai', role: 'system_admin' },
        { id: 'user_vet_pro', name: 'BS. Hoàng Hải Nam', email: 'tester@petcare.ai', role: 'vet_doctor', vetStatus: 'approved' }
      ]
    };
  }

  if (url.includes('/api/auth/admin/create-user')) {
    const cleanEmail = body.email.toLowerCase().trim();
    // Giả lập backend DB
    const currentServerUsers = storage.get('__server_users') ? JSON.parse(storage.get('__server_users')) : [
      { id: 'user_admin_01', email: 'admin@petcare.ai' },
      { id: 'user_vet_pro', email: 'tester@petcare.ai' }
    ];

    if (currentServerUsers.some(u => u.email === cleanEmail)) {
      return {
        ok: false,
        status: 400,
        json: async () => ({ success: false, error: 'Địa chỉ email này đã tồn tại trong hệ thống.' })
      };
    }

    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: body.name,
      email: cleanEmail,
      role: body.role,
      phone: body.phone,
      isLocked: false,
      vetStatus: null,
      mustChangePassword: true,
      createdAt: new Date().toISOString()
    };
    currentServerUsers.push(newUser);
    storage.set('__server_users', JSON.stringify(currentServerUsers));

    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, user: newUser })
    };
  }

  if (url.includes('/api/auth/admin/delete-user')) {
    const currentServerUsers = storage.get('__server_users') ? JSON.parse(storage.get('__server_users')) : [];
    const filtered = currentServerUsers.filter(u => u.id !== body.targetUserId && u.email !== body.targetEmail);
    storage.set('__server_users', JSON.stringify(filtered));
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    };
  }

  return { ok: true, status: 200, json: async () => ({}) };
};

// 3. Khởi tạo trạng thái dữ liệu mô phỏng như tình trạng thực tế của người dùng:
// - petcare_deleted_users_v1 chứa user_owner_demo (demo@petcare.ai)
// - petcare_auth_users_v1 chỉ chứa admin và doctor
storage.set('petcare_deleted_users_v1', JSON.stringify([
  { id: 'user_owner_demo', email: 'demo@petcare.ai', deletedAt: '2026-10-09T07:50:29.957Z' }
]));

storage.set('petcare_auth_users_v1', JSON.stringify([
  {
    id: 'user_admin_01',
    name: 'Quản trị viên Hệ thống',
    email: 'admin@petcare.ai',
    role: 'system_admin',
    isLocked: false,
    vetStatus: null
  },
  {
    id: 'user_vet_pro',
    name: 'BS. Hoàng Hải Nam',
    email: 'tester@petcare.ai',
    role: 'vet_doctor',
    isLocked: false,
    vetStatus: 'approved'
  }
]));

// Import dịch vụ authService
const {
  getUsers,
  adminCreateUser,
  adminDeleteUser,
  ROLES
} = await import('../src/services/authService.js');

const {
  getPets
} = await import('../src/services/storageService.js');

async function runFrontendAuthTests() {
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TẦNG FRONTEND & LOCAL STORAGE SERVICE...');

  // Bước 1: Kiểm tra getUsers() ban đầu
  const initialUsers = getUsers();
  assert.strictEqual(initialUsers.length, 2, 'Ban đầu danh sách chỉ có 2 tài khoản (Admin và Bác sĩ)');
  assert(!initialUsers.some(u => u.email === 'demo@petcare.ai'), 'Tài khoản demo@petcare.ai không được tự ý tái sinh');
  console.log('✅ 1. Ban đầu chỉ có 2 tài khoản (Admin, Vet), demo@petcare.ai KHÔNG tự tái sinh.');

  // Bước 2: Admin tạo lại tài khoản demo@petcare.ai
  const adminId = 'user_admin_01';
  const created1 = await adminCreateUser(adminId, {
    name: 'Đinh Xuân Mạnh Tái Tạo',
    email: 'demo@petcare.ai',
    phone: '0912.333.444',
    role: ROLES.PET_OWNER,
    password: 'Password@123',
    isLocked: false
  });

  assert(created1 && created1.id, 'Tạo tài khoản thành công');
  assert.notStrictEqual(created1.id, 'user_owner_demo', 'Tài khoản mới phải có ID mới');
  assert.strictEqual(created1.email, 'demo@petcare.ai', 'Email phải là demo@petcare.ai');
  console.log(`✅ 2. Admin tạo lại demo@petcare.ai thành công với ID mới: ${created1.id}`);

  // Kiểm tra danh sách người dùng sau khi tạo
  const usersAfterCreate = getUsers();
  assert.strictEqual(usersAfterCreate.length, 3, 'Danh sách người dùng tăng lên 3');
  assert(usersAfterCreate.some(u => u.id === created1.id), 'Tài khoản mới có mặt trong getUsers()');

  // Kiểm tra dữ liệu thú cưng của tài khoản mới
  const petsForNewUser = getPets(created1.id, ROLES.PET_OWNER);
  assert.strictEqual(petsForNewUser.length, 0, 'Tài khoản mới tạo phải có dữ liệu thú cưng rỗng');
  console.log(`✅ 3. Tài khoản mới tạo có dữ liệu rỗng (Số thú cưng: ${petsForNewUser.length})`);

  // Bước 3: Thử tạo trùng email demo@petcare.ai -> phải ném lỗi
  let duplicateThrew = false;
  try {
    await adminCreateUser(adminId, {
      name: 'Trùng Email',
      email: 'demo@petcare.ai',
      phone: '0912.000.111',
      role: ROLES.PET_OWNER,
      password: 'Password@123',
      isLocked: false
    });
  } catch (err) {
    duplicateThrew = true;
    assert.strictEqual(err.message, 'Địa chỉ email này đã tồn tại trong hệ thống.');
  }
  assert(duplicateThrew, 'Tạo trùng email phải ném lỗi');
  console.log('✅ 4. Tạo trùng email khi tài khoản đang hoạt động bị từ chối chính xác.');

  // Bước 4: Xóa tài khoản vừa tạo
  const deleteResult = await adminDeleteUser(adminId, created1.id, 'demo@petcare.ai', 'demo@petcare.ai');
  assert(deleteResult.success, 'Xóa tài khoản thành công');
  const usersAfterDelete = getUsers();
  assert.strictEqual(usersAfterDelete.length, 2, 'Danh sách trở về 2 tài khoản sau khi xóa');
  assert(!usersAfterDelete.some(u => u.email === 'demo@petcare.ai'), 'demo@petcare.ai đã bị loại khỏi getUsers()');
  console.log(`✅ 5. Xóa tài khoản ${created1.id} thành công, danh sách trở lại 2 người dùng.`);

  // Bước 5: Tạo lại cùng email demo@petcare.ai lần nữa
  const created2 = await adminCreateUser(adminId, {
    name: 'Đinh Xuân Mạnh Tái Tạo Lần 2',
    email: 'demo@petcare.ai',
    phone: '0912.555.666',
    role: ROLES.PET_OWNER,
    password: 'Password@456',
    isLocked: false
  });

  assert(created2 && created2.id, 'Tạo tài khoản lần 2 thành công');
  assert.notStrictEqual(created2.id, created1.id, 'ID lần 2 phải khác ID lần 1');
  assert.notStrictEqual(created2.id, 'user_owner_demo', 'ID lần 2 phải khác ID gốc');
  console.log(`✅ 6. Tạo lại cùng email lần 2 thành công với ID mới: ${created2.id}`);

  console.log('🎉 TOÀN BỘ KIỂM THỬ TẦNG FRONTEND & LOCAL STORAGE ĐÃ HOÀN TẤT THÀNH CÔNG RỰC RỠ!');
}

runFrontendAuthTests().catch(err => {
  console.error('❌ Kiểm thử frontend thất bại:', err);
  process.exit(1);
});
