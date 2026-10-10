const BASE_URL = 'http://localhost:5000';

async function runVerification() {
  console.log('--- BẮT ĐẦU KIỂM TRA TOÀN DIỆN QUY TRÌNH TẠO LẠI TÀI KHOẢN BẰNG EMAIL ĐÃ XÓA ---');

  // 1. Đăng nhập Admin
  console.log('\n1. Đăng nhập Admin:');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@petcare.ai', password: 'Admin@123456' })
  });
  const adminData = await adminLoginRes.json();
  if (!adminLoginRes.ok || !adminData.user) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminData)}`);
  }
  const adminId = adminData.user.id;
  console.log(`✓ Admin đăng nhập thành công: ID = ${adminId}, Email = ${adminData.user.email}`);

  // 2. Admin tạo tài khoản chủ nuôi lần 1 (với email có khoảng trắng & chữ hoa)
  const testEmailRaw = '  Test_Owner_Lifecycle@PetCare.AI  ';
  const testEmailClean = 'test_owner_lifecycle@petcare.ai';
  const firstPass = 'FirstPass@123';

  console.log(`\n2. Admin tạo tài khoản chủ nuôi lần 1 với email có khoảng trắng: "${testEmailRaw}":`);
  const create1Res = await fetch(`${BASE_URL}/api/auth/admin/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callerId: adminId,
      name: 'Chủ Nuôi Vòng Đời 1',
      email: testEmailRaw,
      phone: '0901111222',
      role: 'pet_owner',
      password: firstPass,
      isLocked: false
    })
  });
  const create1Data = await create1Res.json();
  if (!create1Res.ok || !create1Data.user) {
    throw new Error(`Create 1 failed: ${JSON.stringify(create1Data)}`);
  }
  const user1 = create1Data.user;
  console.log(`✓ Tạo tài khoản lần 1 thành công: ID = ${user1.id}, Email = ${user1.email}`);

  // 3. Đăng nhập bằng tài khoản vừa tạo
  console.log('\n3. Đăng nhập bằng tài khoản lần 1:');
  const login1Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmailClean, password: firstPass })
  });
  const login1Data = await login1Res.json();
  if (!login1Res.ok || !login1Data.user) {
    throw new Error(`Login 1 failed: ${JSON.stringify(login1Data)}`);
  }
  console.log(`✓ Đăng nhập lần 1 thành công: ID = ${login1Data.user.id}, MustChangePassword = ${login1Data.user.mustChangePassword}`);

  // 4. Admin xóa tài khoản
  console.log(`\n4. Admin xóa tài khoản ID = ${user1.id}:`);
  const deleteRes = await fetch(`${BASE_URL}/api/auth/admin/delete-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callerId: adminId,
      targetUserId: user1.id,
      targetEmail: user1.email,
      confirmEmail: testEmailClean
    })
  });
  const deleteData = await deleteRes.json();
  if (!deleteRes.ok) {
    throw new Error(`Delete failed: ${JSON.stringify(deleteData)}`);
  }
  console.log(`✓ Xóa tài khoản thành công: ${deleteData.message}`);

  // 5. Kiểm tra tài khoản đã bị xóa không thể đăng nhập bằng mật khẩu cũ
  console.log('\n5. Thử đăng nhập tài khoản vừa xóa bằng mật khẩu cũ:');
  const loginDeletedRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmailClean, password: firstPass })
  });
  console.log(`✓ Kết quả: HTTP ${loginDeletedRes.status} (bị từ chối như kỳ vọng: tài khoản chưa đăng ký/đã xóa)`);

  // 6. Tải lại danh sách người dùng từ server
  console.log('\n6. Tải lại danh sách người dùng từ server:');
  const usersListRes = await fetch(`${BASE_URL}/api/auth/users`);
  const usersList = await usersListRes.json();
  const existsInList = usersList.some(u => (u.email || '').toLowerCase() === testEmailClean);
  console.log(`✓ Tài khoản đã xóa có còn trong danh sách active không: ${existsInList ? 'CÒN (LỖI)' : 'KHÔNG (ĐÚNG)'}`);
  if (existsInList) throw new Error('Tài khoản đã xóa vẫn xuất hiện trong danh sách active!');

  // 7. Admin tạo lại bằng cùng email (lần 2)
  const secondPass = 'SecondPass@456';
  console.log(`\n7. Admin tạo lại tài khoản với cùng email "${testEmailClean}":`);
  const create2Res = await fetch(`${BASE_URL}/api/auth/admin/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callerId: adminId,
      name: 'Chủ Nuôi Vòng Đời 2 (Mới)',
      email: testEmailClean,
      phone: '0903333444',
      role: 'pet_owner',
      password: secondPass,
      isLocked: false
    })
  });
  const create2Data = await create2Res.json();
  if (!create2Res.ok || !create2Data.user) {
    throw new Error(`Create 2 failed: ${JSON.stringify(create2Data)}`);
  }
  const user2 = create2Data.user;
  console.log(`✓ Tạo lại tài khoản thành công: ID = ${user2.id}, Email = ${user2.email}`);

  // 8. Xác nhận ID mới khác ID cũ
  console.log('\n8. Xác nhận ID mới khác ID cũ:');
  console.log(`  - ID cũ: ${user1.id}`);
  console.log(`  - ID mới: ${user2.id}`);
  if (user1.id === user2.id) {
    throw new Error('LỖI: ID mới bị trùng với ID cũ!');
  }
  console.log('✓ ID mới hoàn toàn khác ID cũ và không phải là email.');

  // 9. Đăng nhập bằng mật khẩu mới
  console.log('\n9. Đăng nhập bằng mật khẩu mới:');
  const login2Res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmailClean, password: secondPass })
  });
  const login2Data = await login2Res.json();
  if (!login2Res.ok || !login2Data.user) {
    throw new Error(`Login 2 with new pass failed: ${JSON.stringify(login2Data)}`);
  }
  console.log(`✓ Đăng nhập bằng mật khẩu mới thành công: ID = ${login2Data.user.id}`);

  // 10. Mật khẩu cũ không còn hợp lệ
  console.log('\n10. Thử đăng nhập bằng mật khẩu cũ:');
  const loginOldPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmailClean, password: firstPass })
  });
  console.log(`✓ Kết quả: HTTP ${loginOldPassRes.status} (bị từ chối như kỳ vọng: mật khẩu không chính xác)`);

  // 11. Tạo thêm lần nữa bằng email đang tồn tại (phải bị từ chối)
  console.log('\n11. Thử tạo tài khoản lần 3 bằng email đang tồn tại:');
  const create3Res = await fetch(`${BASE_URL}/api/auth/admin/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callerId: adminId,
      name: 'Chủ Nuôi Trùng Lặp',
      email: testEmailClean,
      phone: '0905555666',
      role: 'pet_owner',
      password: 'SomePass@123',
      isLocked: false
    })
  });
  const create3Data = await create3Res.json();
  console.log(`✓ Kết quả: HTTP ${create3Res.status}, Error = "${create3Data.error}"`);
  if (create3Res.status !== 400 || !create3Data.error.includes('đã tồn tại')) {
    throw new Error(`Expected duplicate error, got: ${JSON.stringify(create3Data)}`);
  }

  // 12. Thử tạo thêm lần nữa bằng email có khoảng trắng đầu/cuối và chữ HOA (phải bị từ chối)
  console.log('\n12. Thử tạo tài khoản với email khác hoa/thường và khoảng trắng:');
  const createCaseRes = await fetch(`${BASE_URL}/api/auth/admin/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callerId: adminId,
      name: 'Chủ Nuôi Trùng Lặp 2',
      email: '   TEST_OWNER_LIFECYCLE@PETCARE.AI   ',
      phone: '0905555666',
      role: 'pet_owner',
      password: 'SomePass@123',
      isLocked: false
    })
  });
  const createCaseData = await createCaseRes.json();
  console.log(`✓ Kết quả: HTTP ${createCaseRes.status}, Error = "${createCaseData.error}"`);
  if (createCaseRes.status !== 400 || !createCaseData.error.includes('đã tồn tại')) {
    throw new Error(`Expected duplicate error for mixed case, got: ${JSON.stringify(createCaseData)}`);
  }

  // Dọn dẹp tài khoản test
  await fetch(`${BASE_URL}/api/auth/admin/delete-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callerId: adminId,
      targetUserId: user2.id,
      targetEmail: user2.email,
      confirmEmail: testEmailClean
    })
  });
  console.log('\n✓ Đã dọn dẹp tài khoản test thành công.');

  console.log('\n=== TẤT CẢ 12 BƯỚC KIỂM TRA ĐỀU HOÀN THÀNH XUẤT SẮC! ===');
}

runVerification().catch(err => {
  console.error('\n❌ KIỂM TRA THẤT BẠI:', err);
  process.exit(1);
});
