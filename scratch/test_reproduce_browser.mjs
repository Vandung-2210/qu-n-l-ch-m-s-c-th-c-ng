import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9666;
const profileDir = 'C:\\Users\\Dell Precision 5550\\Downloads\\PET_Ai\\scratch\\temp_debug_profile';

try {
  fs.rmSync(profileDir, { recursive: true, force: true });
} catch {}

const chrome = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${debugPort}`,
  '--disable-gpu',
  '--no-sandbox',
  `--user-data-dir=${profileDir}`,
  'http://127.0.0.1:5173/'
]);

await new Promise(r => setTimeout(r, 2000));

try {
  const listRes = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
  const listData = await listRes.json();
  const pageTarget = listData.find(t => t.type === 'page');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const callbacks = new Map();

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      callbacks.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg.result);
      callbacks.delete(msg.id);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (res?.exceptionDetails) {
      console.error('Evaluate Exception:', res.exceptionDetails);
    }
    return res?.result?.value;
  }

  // Chạy thử luồng: Admin tạo tài khoản -> Xóa tài khoản -> Tạo lại bằng cùng email
  console.log('--- TEST REPRODUCING IN BROWSER CONTEXT ---');
  const result = await evaluate(`
    (async () => {
      const { getUsers, adminCreateUser, adminDeleteUser, syncUsersWithBackend } = await import('/src/services/authService.js');
      
      const adminId = 'user_admin_01';
      const testEmail = 'user_test_flow@petcare.ai';
      
      // 1. Tạo tài khoản lần 1
      let u1;
      const initialUsers = getUsers();
      try {
        u1 = await adminCreateUser(adminId, {
          name: 'Chủ Nuôi Lần 1',
          email: testEmail,
          phone: '0900000001',
          role: 'pet_owner',
          password: 'Password@123',
          isLocked: false
        });
      } catch (e) {
        return { 
          step: 'create_1_failed', 
          error: e.message, 
          stack: e.stack,
          initialUsers: initialUsers.map(u => ({ id: u.id, email: u.email })),
          rawUsersStorage: JSON.parse(localStorage.getItem('petcare_auth_users_v1') || '[]').map(u => ({ id: u.id, email: u.email })),
          legacyStorage: JSON.parse(localStorage.getItem('petcare_registered_users') || '[]').map(u => ({ id: u.id, email: u.email }))
        };
      }

      // 2. Xóa tài khoản vừa tạo
      try {
        await adminDeleteUser(adminId, u1.id, testEmail, testEmail);
      } catch (e) {
        return { step: 'delete_failed', error: e.message };
      }

      // 3. Tạo lại tài khoản với CÙNG EMAIL testEmail
      let u2;
      try {
        u2 = await adminCreateUser(adminId, {
          name: 'Chủ Nuôi Lần 2',
          email: testEmail,
          phone: '0900000002',
          role: 'pet_owner',
          password: 'NewPassword@123',
          isLocked: false
        });
      } catch (e) {
        return { step: 'create_2_failed', error: e.message, usersNow: getUsers().map(u => ({ id: u.id, email: u.email })) };
      }

      return { step: 'success', u1Id: u1.id, u2Id: u2.id };
    })()
  `);

  console.log('Result in browser context:', JSON.stringify(result, null, 2));

  ws.close();
} catch (err) {
  console.error('Error:', err);
} finally {
  chrome.kill();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch {}
}
