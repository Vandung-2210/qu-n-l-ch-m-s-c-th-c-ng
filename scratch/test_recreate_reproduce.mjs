const BASE_URL = 'http://localhost:5000';

async function testRecreate() {
  const adminLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@petcare.ai', password: 'Admin@123456' })
  });
  const adminData = await adminLogin.json();
  console.log('Admin login status:', adminLogin.status, 'User:', adminData?.user?.email);
  const adminId = adminData.user.id;

  const res = await fetch(`${BASE_URL}/api/auth/admin/create-user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callerId: adminId,
      name: 'Đinh Xuân Mạnh Recreated',
      email: 'demo@petcare.ai',
      phone: '0912345678',
      role: 'pet_owner',
      password: 'NewPassword@123',
      isLocked: false
    })
  });

  const data = await res.json();
  console.log('Create demo@petcare.ai response:', res.status, data);
}

testRecreate();
