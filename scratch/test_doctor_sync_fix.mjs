import assert from 'assert';

const BASE_URL = 'http://localhost:5000/api';

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res.json();
}

async function run() {
  console.log('=== TEST KIỂM TRA SỬA LỖI ĐỒNG BỘ TÀI KHOẢN BÁC SĨ ===\n');

  // 1. Đăng nhập tài khoản Bác sĩ
  console.log('1. Đăng nhập tài khoản Bác sĩ (tester@petcare.ai)...');
  const docLogin = await login('tester@petcare.ai', 'Doctor@123');
  assert(docLogin.token, 'Đăng nhập bác sĩ thành công');
  console.log('✓ Token bác sĩ OK:', docLogin.user.name, `(${docLogin.user.role})`);

  // 2. Bác sĩ đặt lịch cho Cún Kiểm Thử (pet-1792128958474) -> KHÔNG ĐƯỢC BỊ LỖI 403
  console.log('\n2. Kiểm tra Bác sĩ đặt lịch cho thú cưng Cún Kiểm Thử...');
  const docBookAppId = `BK-TEST-DOC-${Date.now()}`;
  const randomMin = String(Math.floor(Math.random() * 50) + 10).padStart(2, '0');
  const docBookRes = await fetch(`${BASE_URL}/data/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${docLogin.token}`
    },
    body: JSON.stringify({
      id: docBookAppId,
      petId: 'pet-1792128958474',
      petName: 'Cún Kiểm Thử',
      date: '2027-02-15',
      time: `10:${randomMin}`,
      facility: 'Bệnh viện Thú y PetHealth 262 Quang Trung',
      service: 'Khám tổng quát định kỳ',
      ownerName: 'Đinh Xuân Mạnh',
      phone: '0346587685',
      status: 'pending',
      note: 'Khám định kỳ cho Cún Kiểm Thử bởi BS'
    })
  });
  const docBookData = await docBookRes.json();
  console.log('Status đặt lịch từ Bác sĩ:', docBookRes.status);
  assert.strictEqual(docBookRes.status, 200, 'Bác sĩ phải đặt lịch thành công, không bị chặn 403: ' + JSON.stringify(docBookData));
  console.log('✓ Bác sĩ đặt lịch thành công 100%!');

  // 3. Đăng nhập Chủ nuôi (demo@petcare.ai) và tạo lịch chờ tiếp nhận
  console.log('\n3. Đăng nhập Chủ nuôi (demo@petcare.ai)...');
  const ownerLogin = await login('demo@petcare.ai', 'Owner@123');
  assert(ownerLogin.token, 'Đăng nhập chủ nuôi thành công');

  // Lấy hoặc tạo thú cưng của demo
  const ownerPetsRes = await fetch(`${BASE_URL}/data/pets`, {
    headers: { 'Authorization': `Bearer ${ownerLogin.token}` }
  });
  let ownerPets = await ownerPetsRes.json();
  let demoPet = ownerPets[0];
  if (!demoPet) {
    const createPetRes = await fetch(`${BASE_URL}/data/pets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerLogin.token}`
      },
      body: JSON.stringify({
        id: `pet-demo-${Date.now()}`,
        name: 'Mèo Miu Miu Demo',
        species: 'cat',
        breed: 'Mèo Anh Lông Ngắn',
        weight: 3.5
      })
    });
    demoPet = (await createPetRes.json()).data;
  }
  console.log('✓ Thú cưng của chủ nuôi demo:', demoPet.name, `(${demoPet.id})`);

  const ownerAppId = `BK-TEST-OWNER-${Date.now()}`;
  console.log(`- Chủ nuôi đặt lịch mới (${ownerAppId}) với trạng thái pending và assignedVet: "Đang xếp lịch"...`);
  const ownerBookRes = await fetch(`${BASE_URL}/data/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ownerLogin.token}`
    },
    body: JSON.stringify({
      id: ownerAppId,
      petId: demoPet.id,
      petName: demoPet.name,
      date: '2027-02-16',
      time: `14:${randomMin}`,
      facility: 'Bệnh viện Thú y PetHealth 262 Quang Trung',
      service: 'Khám tổng quát định kỳ',
      ownerName: 'Đinh Xuân Mạnh (Demo)',
      phone: '0346587685',
      status: 'pending',
      assignedVet: 'Đang xếp lịch',
      note: 'Chủ nuôi đặt ca khám mới từ tab thường'
    })
  });
  const ownerBookData = await ownerBookRes.json();
  assert.strictEqual(ownerBookRes.status, 200, 'Chủ nuôi đặt lịch thành công: ' + JSON.stringify(ownerBookData));
  console.log('✓ Chủ nuôi đã tạo lịch hẹn pending thành công');

  // 4. Bác sĩ (tab ẩn danh) lấy danh sách appointments
  console.log('\n4. Bác sĩ (tab ẩn danh) gọi GET /api/data/appointments...');
  const docGetAppsRes = await fetch(`${BASE_URL}/data/appointments`, {
    headers: { 'Authorization': `Bearer ${docLogin.token}` }
  });
  const docApps = await docGetAppsRes.json();
  console.log(`- Bác sĩ nhìn thấy tổng cộng: ${docApps.length} ca khám`);
  const foundOwnerApp = docApps.find(a => a.id === ownerAppId);
  assert(foundOwnerApp, 'Bác sĩ PHẢI nhìn thấy ca khám chờ tiếp nhận mà Chủ nuôi vừa đặt!');
  console.log('✓ Bác sĩ đã nhìn thấy ca khám vừa đặt trong hàng đợi tiếp nhận:', foundOwnerApp.id, foundOwnerApp.status);

  // 5. Bác sĩ bấm Tiếp nhận ca khám (PUT in_progress)
  console.log('\n5. Bác sĩ bấm Tiếp nhận ca khám (status: in_progress)...');
  const acceptRes = await fetch(`${BASE_URL}/data/appointments/${ownerAppId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${docLogin.token}`
    },
    body: JSON.stringify({
      status: 'in_progress',
      assignedVetId: docLogin.user.id,
      assignedVet: docLogin.user.name
    })
  });
  const acceptData = await acceptRes.json();
  console.log('Status tiếp nhận ca:', acceptRes.status);
  assert.strictEqual(acceptRes.status, 200, 'Bác sĩ tiếp nhận ca khám thành công, không bị lỗi 403');
  console.log('✓ Ca khám đã được tiếp nhận và gán cho Bác sĩ thành công:', acceptData.data.assignedVet, acceptData.data.status);

  // Dọn dẹp ca test
  await fetch(`${BASE_URL}/data/appointments/${docBookData.data.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${docLogin.token}` }
  });
  await fetch(`${BASE_URL}/data/appointments/${ownerAppId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${docLogin.token}` }
  });
  console.log('✓ Dọn dẹp dữ liệu test hoàn tất');

  console.log('\n🎉 TẤT CẢ CÁC ĐIỀU KIỆN ĐỒNG BỘ 2 CHIỀU ĐÃ ĐẠT 100%!');
}

run().catch(e => {
  console.error('Test thất bại:', e);
  process.exit(1);
});
