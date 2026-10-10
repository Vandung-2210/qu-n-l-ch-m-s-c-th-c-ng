import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9555;
const profileDir = 'C:\\Users\\Dell Precision 5550\\Downloads\\PET_Ai\\scratch\\temp_new_user_profile';

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
  const uncaughtExceptions = [];
  const consoleErrors = [];

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
    if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(a => a.value ?? a.description ?? JSON.stringify(a)).join(' ');
      if (msg.params.type === 'error') {
        console.error('[BROWSER ERROR]:', args);
        consoleErrors.push(args);
      }
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('UNCAUGHT EXCEPTION:', msg.params.exceptionDetails?.text, msg.params.exceptionDetails?.exception?.description);
      uncaughtExceptions.push(msg.params.exceptionDetails);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Runtime.enable');
  await send('Page.enable');

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res?.result?.value;
  }

  console.log('--- TEST: TẠO TÀI KHOẢN MỚI TỪ ADMIN & ĐĂNG NHẬP LẦN ĐẦU ---');
  
  // 1. Cấp tài khoản mới trực tiếp qua authService trong browser
  const createResult = await evaluate(`
    (() => {
      const users = JSON.parse(localStorage.getItem('petcare_system_users_v2') || '[]');
      const admin = users.find(u => u.role === 'system_admin');
      
      // Import authService method
      const newAcc = {
        name: 'Trần Văn Mới',
        email: 'newuser@petcare.ai',
        phone: '0988112233',
        role: 'pet_owner',
        password: 'TempPassword@123',
        confirmPassword: 'TempPassword@123',
        isLocked: false
      };

      // Thêm user mới vào kho users với mustChangePassword = true
      const newUserRecord = {
        id: 'user_' + Date.now(),
        name: newAcc.name,
        email: newAcc.email,
        phone: newAcc.phone,
        role: newAcc.role,
        password: newAcc.password,
        isLocked: false,
        mustChangePassword: true,
        createdAt: new Date().toISOString()
      };

      users.push(newUserRecord);
      localStorage.setItem('petcare_system_users_v2', JSON.stringify(users));
      return { success: true, email: newAcc.email };
    })()
  `);
  console.log('1. Admin cấp tài khoản mới thành công:', createResult);

  // 2. Điều hướng tới /login
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/login' });
  await new Promise(r => setTimeout(r, 2000));

  // 3. Đăng nhập với tài khoản mới vừa cấp
  await evaluate(`
    (() => {
      function setNativeValue(element, value) {
        const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        valueSetter.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const emailInput = document.querySelectorAll('input')[0];
      const passInput = document.querySelectorAll('input')[1];
      const submitBtn = document.querySelector('#btn-sign-in-submit');

      setNativeValue(emailInput, 'newuser@petcare.ai');
      setNativeValue(passInput, 'TempPassword@123');

      if (submitBtn) submitBtn.click();
    })()
  `);

  await new Promise(r => setTimeout(r, 2500));

  // 4. Kiểm tra hộp thoại bắt buộc đổi mật khẩu lần đầu (FirstLoginPasswordModal)
  const passwordChangeModalHeader = await evaluate(`
    document.querySelector('h3, h2')?.innerText
  `);
  console.log('2. Tiêu đề sau khi đăng nhập tài khoản cấp mới:', `"${passwordChangeModalHeader}"`);

  const hasFirstLoginModal = await evaluate(`
    document.body.innerText.includes('Đổi Mật Khẩu Lần Đầu') || 
    document.body.innerText.includes('Mật khẩu tạm thời') || 
    document.body.innerText.includes('đổi mật khẩu')
  `);
  console.log('3. Hiển thị modal đổi mật khẩu lần đầu:', hasFirstLoginModal);

  // 5. Kiểm tra HTML #root
  const rootLen = await evaluate('document.getElementById("root")?.innerHTML?.length || 0');
  console.log('4. Độ dài HTML #root:', rootLen);
  console.log('5. Không bị màn hình tối trống:', rootLen > 0);

  console.log('--- TỔNG KẾT ---');
  console.log('Uncaught Exceptions:', uncaughtExceptions.length);
  console.log('Console Errors:', consoleErrors.length);

  if (uncaughtExceptions.length > 0 || rootLen === 0) {
    throw new Error('Đăng nhập tài khoản cấp mới bị lỗi!');
  }

  ws.close();
} catch (err) {
  console.error('LỖI TEST TÀI KHOẢN MỚI:', err);
  process.exitCode = 1;
} finally {
  chrome.kill();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch {}
}
