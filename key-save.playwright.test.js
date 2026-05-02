const { chromium } = require('playwright');
const path = require('path');
const http = require('http');
const fs = require('fs');

function createServer(port) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
      if (!fs.existsSync(filePath)) { res.writeHead(404); res.end('Not found'); return; }
      const mime = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css' }[path.extname(filePath)] || 'text/plain';
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': mime, 'Content-Length': data.length, 'Cache-Control': 'no-cache' });
      res.end(data);
    });
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  const server = await createServer(8899);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push('[console] ' + msg.text());
  });

  // Intercept ALL errors with try-catch via page.addInitScript
  await page.addInitScript(() => {
    window.__errors = [];
    const originalError = window.onerror;
    window.onerror = function(msg, src, line, col, err) {
      window.__errors.push({ msg, line, col: col || '?' });
      return false;
    };
    window.addEventListener('error', e => {
      window.__errors.push({ msg: e.message, line: e.lineno || '?', col: e.colno || '?' });
    });
  });

  console.log('\n=== TEST 1: Fresh load, check errors ===');
  await page.goto('http://localhost:8899', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const errors1 = await page.evaluate(() => window.__errors || []);
  const modal1 = await page.isVisible('#key-modal:not(.hidden)');
  console.log('  Errors:', JSON.stringify(errors1));
  console.log('  Modal visible:', modal1);

  console.log('\n=== TEST 2: Save key ===');
  await page.fill('#api-key-input', 'test-key-12345678');
  await page.check('#key-remember');
  await page.click('#key-save-btn');
  await page.waitForTimeout(500);

  const afterSave = await page.evaluate(() => ({
    localStorage: (() => { try { return localStorage.getItem('lingo-glm-key'); } catch(e) { return 'ERR'; } })(),
    sessionStorage: (() => { try { return sessionStorage.getItem('lingo-glm-key'); } catch(e) { return 'ERR'; } })(),
    cookie: document.cookie,
    cachedKey: window._cachedKey,
    modalHidden: document.getElementById('key-modal').classList.contains('hidden')
  }));
  console.log('  After save:', JSON.stringify(afterSave));
  console.log('  After save errors:', JSON.stringify(await page.evaluate(() => window.__errors || [])));

  console.log('\n=== TEST 3: Reload, check init ===');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const errors3 = await page.evaluate(() => window.__errors || []);
  const afterReload = await page.evaluate(() => ({
    localStorage: (() => { try { return localStorage.getItem('lingo-glm-key'); } catch(e) { return 'ERR'; } })(),
    cookie: document.cookie,
    cachedKey: window._cachedKey,
    modalHidden: document.getElementById('key-modal').classList.contains('hidden'),
    initRan: typeof window._cachedKey !== 'undefined' && window._cachedKey !== null
  }));
  console.log('  Errors:', JSON.stringify(errors3));
  console.log('  After reload:', JSON.stringify(afterReload));

  console.log('\n=== TEST 4: Manually hide modal to verify it is the ONLY issue ===');
  await page.evaluate(() => document.getElementById('key-modal').classList.add('hidden'));
  const manualHide = await page.isVisible('#key-modal:not(.hidden)');
  console.log('  After manual hide, modal visible:', manualHide, '(should be false)');

  await browser.close();
  server.close();

  const allErrors = [...errors1, ...errors3];
  console.log('\n=== SUMMARY ===');
  if (allErrors.length > 0) {
    console.log('  JS ERRORS FOUND:', allErrors);
  }
  console.log('  Save works:', afterSave.localStorage === 'test-key-12345678' ? '✓' : '✗');
  console.log('  Init restores key:', afterReload.cachedKey === 'test-key-12345678' ? '✓' : '✗');
  console.log('  Init hides modal on reload:', !afterReload.modalHidden ? '✓' : '✗');
}

run().catch(e => { console.error(e); process.exit(1); });