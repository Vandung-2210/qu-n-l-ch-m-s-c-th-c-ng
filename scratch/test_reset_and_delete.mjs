import assert from 'assert';

const BASE_URL = 'http://localhost:5000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

async function runTests() {
  console.log('🚀 Bắt đầu bộ kiểm thử toàn diện: Đặt lại mật khẩu & Xóa tài khoản...');

  // 1. Health check
  const health = await request('/api/health');
  assert.strictEqual(health.status, 200, 'Health check phải trả về 200');
  console.log('✅ 1. Health check: OK');

  // Lấy danh sách admin ban đầu
  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@petcare.ai', password: 'Admin@123456' })
  });
  assert.strictEqual(adminLogin.status, 200, 'Đăng nhập admin ban đầu phải thành công');
  const adminId = adminLogin.data.user.id;
  console.log(`✅ 2. Đăng nhập admin thành công (ID: ${adminId})`);

  // Tạo tài khoản chủ nuôi thử nghiệm
  const testOwnerEmail = `test_owner_${Date.now()}@petcare.ai`;
  const createOwner = await request('/api/auth/admin/create-user', {
    method: 'POST',
    body: JSON.stringify({
      callerId: adminId,
      name: 'Chủ Nuôi Kiểm Thử',
      email: testOwnerEmail,
      phone: '0912334455',
      role: 'pet_owner',
      password: 'TempPassword@123',
      isLocked: false
    })
  });
  assert.strictEqual(createOwner.status, 200, 'Admin tạo tài khoản chủ nuôi phải thành công');
  const testOwner = createOwner.data.user;
  console.log(`✅ 3. Tạo tài khoản chủ nuôi kiểm thử thành công: ${testOwner.email} (ID: ${testOwner.id})`);

  // Tạo tài khoản bác sĩ thử nghiệm
  const testVetEmail = `test_vet_${Date.now()}@petcare.ai`;
  const createVet = await request('/api/auth/admin/create-user', {
    method: 'POST',
    body: JSON.stringify({
      callerId: adminId,
      name: 'BS. Kiểm Thử Thú Y',
      email: testVetEmail,
      phone: '0988112233',
      role: 'vet_doctor',
      password: 'VetPassword@123',
      isLocked: false
    })
  });
  assert.strictEqual(createVet.status, 200, 'Admin tạo tài khoản bác sĩ phải thành công');
  const testVet = createVet.data.user;
  console.log(`✅ 4. Tạo tài khoản bác sĩ kiểm thử thành công: ${testVet.email} (ID: ${testVet.id})`);

  // =========================================================================
  // PHẦN 1: KIỂM THỬ ĐẶT LẠI MẬT KHẨU (RESET PASSWORD)
  // =========================================================================

  // Test 1.1: Admin đặt lại mật khẩu bằng ID và Email fallback cho chủ nuôi
  const newOwnerTempPass = 'NewOwnerPass@789';
  const resetOwner = await request('/api/auth/admin/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      callerId: adminId,
      targetUserId: testOwner.id,
      targetEmail: testOwner.email,
      newTemporaryPassword: newOwnerTempPass
    })
  });
  assert.strictEqual(resetOwner.status, 200, 'Admin đặt lại mật khẩu cho chủ nuôi phải thành công');
  assert.strictEqual(resetOwner.data.user.mustChangePassword, true, 'mustChangePassword phải là true');
  console.log('✅ 5. Admin đặt lại mật khẩu bằng ID & Email cho chủ nuôi thành công');

  // Test 1.2: Mật khẩu cũ bị từ chối
  const loginOldPass = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testOwnerEmail, password: 'TempPassword@123' })
  });
  assert.strictEqual(loginOldPass.status, 401, 'Đăng nhập bằng mật khẩu cũ phải bị từ chối (401)');
  console.log('✅ 6. Mật khẩu cũ bị từ chối chính xác (401)');

  // Test 1.3: Mật khẩu tạm thời mới đăng nhập được
  const loginNewPass = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testOwnerEmail, password: newOwnerTempPass })
  });
  assert.strictEqual(loginNewPass.status, 200, 'Đăng nhập bằng mật khẩu tạm thời mới phải thành công');
  assert.strictEqual(loginNewPass.data.user.mustChangePassword, true, 'Tài khoản đăng nhập phải có cờ mustChangePassword: true');
  console.log('✅ 7. Đăng nhập bằng mật khẩu tạm thời mới thành công, yêu cầu đổi mật khẩu ở lần đầu');

  // Test 1.4: Đổi mật khẩu bắt buộc ở lần đăng nhập đầu tiên
  const finalPass = 'FinalOwnerSecurePass@999';
  const firstChange = await request('/api/auth/first-login-change-password', {
    method: 'POST',
    body: JSON.stringify({ userId: testOwner.id, newPassword: finalPass })
  });
  assert.strictEqual(firstChange.status, 200, 'Đổi mật khẩu lần đầu phải thành công');
  assert.strictEqual(firstChange.data.user.mustChangePassword, false, 'mustChangePassword phải tắt thành false');
  console.log('✅ 8. Đổi mật khẩu lần đầu thành công (mustChangePassword -> false)');

  // Test 1.5: Mật khẩu tạm thời bị vô hiệu hóa sau khi đổi
  const loginTempAgain = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testOwnerEmail, password: newOwnerTempPass })
  });
  assert.strictEqual(loginTempAgain.status, 401, 'Mật khẩu tạm thời cũ không còn đăng nhập được sau khi đổi');
  console.log('✅ 9. Mật khẩu tạm thời cũ đã bị vô hiệu hóa hoàn toàn');

  // Test 1.6: Mật khẩu cuối cùng đăng nhập thành công
  const loginFinalPass = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testOwnerEmail, password: finalPass })
  });
  assert.strictEqual(loginFinalPass.status, 200, 'Mật khẩu mới đăng nhập thành công');
  assert.strictEqual(loginFinalPass.data.user.mustChangePassword, false);
  console.log('✅ 10. Mật khẩu chính thức mới đăng nhập thành công');

  // Test 1.7: Đặt lại mật khẩu cho tài khoản không tồn tại hoặc đã xóa
  const resetNonExistent = await request('/api/auth/admin/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      callerId: adminId,
      targetUserId: 'user_non_existent_9999',
      targetEmail: 'non_existent@petcare.ai',
      newTemporaryPassword: 'AnyPassword@123'
    })
  });
  assert.strictEqual(resetNonExistent.status, 404, 'Đặt lại mật khẩu cho tài khoản không tồn tại phải trả về 404');
  console.log('✅ 11. Đặt lại mật khẩu tài khoản không tồn tại trả về lỗi 404 rõ ràng');

  // =========================================================================
  // PHẦN 2: KIỂM THỬ XÓA TÀI KHOẢN (DELETE ACCOUNT) VÀ RÀNG BUỘC BẢO MẬT
  // =========================================================================

  // Test 2.1: Người dùng thường gọi chức năng xóa -> Bị từ chối (403)
  const nonAdminDelete = await request('/api/auth/admin/delete-user', {
    method: 'POST',
    body: JSON.stringify({
      callerId: testOwner.id,
      targetUserId: testVet.id,
      targetEmail: testVet.email,
      confirmEmail: testVet.email
    })
  });
  assert.strictEqual(nonAdminDelete.status, 403, 'Người dùng thường gọi xóa tài khoản phải bị từ chối (403)');
  console.log('✅ 12. Chặn người dùng thường gọi chức năng xóa tài khoản (403 Forbidden)');

  // Test 2.2: Admin tự xóa tài khoản của chính mình -> Bị từ chối (400)
  const selfDelete = await request('/api/auth/admin/delete-user', {
    method: 'POST',
    body: JSON.stringify({
      callerId: adminId,
      targetUserId: adminId,
      targetEmail: 'admin@petcare.ai',
      confirmEmail: 'admin@petcare.ai'
    })
  });
  assert.strictEqual(selfDelete.status, 400, 'Không được phép tự xóa tài khoản admin đang đăng nhập (400)');
  console.log('✅ 13. Chặn admin tự xóa chính tài khoản đang đăng nhập (400 Bad Request)');

  // Test 2.3: Xóa quản trị viên hoạt động cuối cùng -> Bị từ chối (400)
  const lastAdminDelete = await request('/api/auth/admin/delete-user', {
    method: 'POST',
    body: JSON.stringify({
      callerId: adminId,
      targetUserId: 'user_admin_01',
      targetEmail: 'admin@petcare.ai',
      confirmEmail: 'admin@petcare.ai'
    })
  });
  assert.strictEqual(lastAdminDelete.status, 400, 'Không được xóa quản trị viên cuối cùng (400)');
  console.log('✅ 14. Chặn xóa quản trị viên hoạt động duy nhất còn lại (400)');

  // Test 2.4: Nhập sai email xác nhận -> Bị từ chối (400)
  const wrongEmailConfirm = await request('/api/auth/admin/delete-user', {
    method: 'POST',
    body: JSON.stringify({
      callerId: adminId,
      targetUserId: testOwner.id,
      targetEmail: testOwner.email,
      confirmEmail: 'wrong_email@petcare.ai'
    })
  });
  assert.strictEqual(wrongEmailConfirm.status, 400, 'Email xác nhận không khớp phải bị từ chối (400)');
  console.log('✅ 15. Bắt buộc nhập chính xác email để xác nhận xóa (400 nếu sai)');

  // Test 2.5: Admin xác nhận xóa tài khoản Chủ nuôi
  const deleteOwner = await request('/api/auth/admin/delete-user', {
    method: 'POST',
    body: JSON.stringify({
      callerId: adminId,
      targetUserId: testOwner.id,
      targetEmail: testOwner.email,
      confirmEmail: testOwner.email
    })
  });
  assert.strictEqual(deleteOwner.status, 200, 'Admin xóa tài khoản chủ nuôi phải thành công');
  console.log(`✅ 16. Admin xóa thành công tài khoản chủ nuôi: ${testOwner.email}`);

  // Test 2.6: Tài khoản chủ nuôi đã xóa không thể đăng nhập nữa
  const loginDeletedOwner = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testOwnerEmail, password: finalPass })
  });
  assert.strictEqual(loginDeletedOwner.status, 401, 'Tài khoản đã xóa không được phép đăng nhập');
  console.log('✅ 17. Tài khoản chủ nuôi đã xóa không thể đăng nhập (401)');

  // Test 2.7: Admin xác nhận xóa tài khoản Bác sĩ thú y
  const deleteVet = await request('/api/auth/admin/delete-user', {
    method: 'POST',
    body: JSON.stringify({
      callerId: adminId,
      targetUserId: testVet.id,
      targetEmail: testVet.email,
      confirmEmail: testVet.email
    })
  });
  assert.strictEqual(deleteVet.status, 200, 'Admin xóa tài khoản bác sĩ phải thành công');
  console.log(`✅ 18. Admin xóa thành công tài khoản bác sĩ: ${testVet.email}`);

  // Test 2.8: Tài khoản bác sĩ đã xóa không thể đăng nhập nữa
  const loginDeletedVet = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testVetEmail, password: 'VetPassword@123' })
  });
  assert.strictEqual(loginDeletedVet.status, 401, 'Tài khoản bác sĩ đã xóa không thể đăng nhập');
  console.log('✅ 19. Tài khoản bác sĩ đã xóa không thể đăng nhập (401)');

  // Test 2.9: Danh sách users không còn chứa 2 tài khoản đã xóa
  const usersList = await request('/api/auth/users');
  assert.strictEqual(usersList.status, 200);
  const userEmails = usersList.data.map(u => u.email.toLowerCase());
  assert.ok(!userEmails.includes(testOwnerEmail.toLowerCase()), 'Tài khoản chủ nuôi đã xóa không được xuất hiện trong danh sách');
  assert.ok(!userEmails.includes(testVetEmail.toLowerCase()), 'Tài khoản bác sĩ đã xóa không được xuất hiện trong danh sách');
  console.log('✅ 20. Danh sách tài khoản đã đồng bộ, không còn chứa các tài khoản đã xóa');

  // Test 2.10: Xóa lại tài khoản vừa xóa trả về 404 rõ ràng
  const deleteAgain = await request('/api/auth/admin/delete-user', {
    method: 'POST',
    body: JSON.stringify({
      callerId: adminId,
      targetUserId: testOwner.id,
      targetEmail: testOwner.email,
      confirmEmail: testOwner.email
    })
  });
  assert.strictEqual(deleteAgain.status, 404, 'Xóa tài khoản đã xóa phải trả về 404');
  console.log('✅ 21. Báo rõ khi tài khoản đã bị xóa trước đó (404)');

  console.log('\n=============================================================');
  console.log('🎉 TẤT CẢ 21/21 BÀI KIỂM THỬ ĐÃ VƯỢT QUA XUẤT SẮC!');
  console.log('=============================================================\n');
}

runTests().catch(err => {
  console.error('❌ Kiểm thử thất bại:', err);
  process.exit(1);
});
