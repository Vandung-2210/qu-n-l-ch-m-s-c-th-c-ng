import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const debugPort = 9333;
const profileDir = 'C:\\Users\\Dell Precision 5550\\Downloads\\PET_Ai\\scratch\\temp_test_profile';

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

// Wait for Chrome to open debugging port
await new Promise(r => setTimeout(r, 2000));

try {
  const versionRes = await fetch(`http://localhost:${debugPort}/json/version`);
  const versionData = await versionRes.json();
  console.log('Browser version:', versionData.Browser);

  const listRes = await fetch(`http://localhost:${debugPort}/json/list`);
  const listData = await listRes.json();
  const pageTarget = listData.find(t => t.type === 'page');
  console.log('Page target URL:', pageTarget?.url);

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
        consoleErrors.push(args);
      }
      console.log(`[CONSOLE ${msg.params.type.toUpperCase()}]:`, args);
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[UNCAUGHT EXCEPTION]:', msg.params.exceptionDetails?.text, msg.params.exceptionDetails?.exception?.description);
      uncaughtExceptions.push(msg.params.exceptionDetails);
    }
  };

  await new Promise(r => ws.onopen = r);

  await send('Runtime.enable');
  await send('Page.enable');

  console.log('Reloading page to capture initial load...');
  await send('Page.reload');

  // Wait 3 seconds for initial render
  await new Promise(r => setTimeout(r, 3000));

  const rootDom = await send('Runtime.evaluate', {
    expression: 'document.getElementById("root")?.innerHTML'
  });
  const html = rootDom?.result?.value || '';
  console.log('Root innerHTML length:', html.length);
  console.log('Is root empty?', html.trim() === '');
  console.log('Has dark blank screen?', html.length === 0);

  // Check what is rendered
  const pageTitle = await send('Runtime.evaluate', {
    expression: 'document.title'
  });
  console.log('Page title:', pageTitle?.result?.value);

  const headingText = await send('Runtime.evaluate', {
    expression: 'document.querySelector("h1, h2, h3")?.innerText'
  });
  console.log('First heading found on page:', headingText?.result?.value);

  const formOrButtons = await send('Runtime.evaluate', {
    expression: 'Array.from(document.querySelectorAll("button, input")).map(el => el.innerText || el.placeholder || el.value || el.type).slice(0, 10)'
  });
  console.log('Interactive elements visible:', formOrButtons?.result?.value);

  console.log('--- TEST SUMMARY ---');
  console.log('Uncaught Exceptions Count:', uncaughtExceptions.length);
  console.log('Console Errors Count:', consoleErrors.length);

  ws.close();
} catch (err) {
  console.error('Inspection error:', err);
} finally {
  chrome.kill();
  try {
    fs.rmSync(profileDir, { recursive: true, force: true });
  } catch {}
}
