#!/usr/bin/env node
/**
 * Browser E2E for the homepage hero (Math Reasoning Canvas as the single primary CTA),
 * driven through headless Chrome via the DevTools protocol (no npm dependencies).
 *
 * Usage: npm run build && npx vite preview --port 4173 &  →  npm run test:e2e:home
 * Env: E2E_BASE_URL (default http://localhost:4173), CHROME_PATH, E2E_CDP_PORT (default 9335),
 *      E2E_SCREENSHOT_DIR (optional).
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:4173';
const CHROME = process.env.CHROME_PATH ?? 'google-chrome';
const SHOTS = process.env.E2E_SCREENSHOT_DIR;
const PORT = Number(process.env.E2E_CDP_PORT ?? 9335);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'home-e2e-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });

let ws;
let nextId = 1;
const pending = new Map();
const pageErrors = [];
function send(method, params = {}) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (res.exceptionDetails) throw new Error(`evaluate failed: ${res.exceptionDetails.exception?.description ?? expression}`);
  return res.result.value;
}
async function waitFor(expression, label, timeout = 30_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for: ${label}`);
}
async function screenshot(name) {
  if (!SHOTS) return;
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(SHOTS, name), Buffer.from(data, 'base64'));
}
async function key(k, code = k) {
  const vk = { Tab: 9, Enter: 13 }[k] ?? 0;
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
}
async function clickAt(x, y) {
  for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 });
}
const rect = (sel) => evaluate(`(() => { const r = document.querySelector(${JSON.stringify(sel)})?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2, r: r.right, b: r.bottom } : null; })()`);
const overlap = (a, b) => !!a && !!b && a.x < b.r - 1 && b.x < a.r - 1 && a.y < b.b - 1 && b.y < a.b - 1;

async function openHome() {
  await send('Page.navigate', { url: `${BASE}/` });
  await waitFor(`!!document.querySelector('[data-testid="home-primary-cta"]') && getComputedStyle(document.querySelector('[data-testid="home-hero"]')).opacity === '1'`, 'hero visible');
  await sleep(300);
}

/** Layout checks shared by all viewports. */
async function checkLayout(label) {
  const hero = await rect('[data-testid="home-hero"]');
  const cta = await rect('[data-testid="home-primary-cta"]');
  const vw = await evaluate('innerWidth');
  const vh = await evaluate('innerHeight');
  assert.ok(Math.abs(hero.cx - vw / 2) <= 2, `${label}: hero horizontally centered (${hero.cx} vs ${vw / 2})`);
  assert.ok(hero.x >= 12 && hero.r <= vw - 12, `${label}: safe side margins`);
  assert.ok(hero.y >= 0 && hero.b <= vh, `${label}: hero inside the viewport`);
  assert.ok(Math.abs(hero.cy - vh / 2) <= vh * 0.12, `${label}: hero roughly vertically centered (${hero.cy} vs ${vh / 2})`);
  assert.ok(cta.h >= 44 && cta.w >= 44, `${label}: CTA touch target`);
  const [sw, iw] = await evaluate('[document.scrollingElement.scrollWidth, innerWidth]');
  assert.ok(sw <= iw, `${label}: no horizontal overflow`);
  const header = await rect('header');
  const filters = await rect('[class*="max-w-[92vw]"]');
  const search = await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(b => /tìm|search|搜索/i.test(b.getAttribute('aria-label') ?? '')); const r = b?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, r: r.right, b: r.bottom } : null; })()`);
  const headerButtons = await evaluate(`[...document.querySelectorAll('header button, header a')].map(e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, r: r.right, b: r.bottom }; })`);
  assert.ok(!overlap(hero, filters), `${label}: hero clear of the filter bar`);
  assert.ok(!headerButtons.some((b) => overlap(hero, b)), `${label}: hero clear of header controls`);
  assert.ok(!overlap(hero, search), `${label}: hero clear of the search button`);
  const hit = await evaluate(`(() => { const c = document.querySelector('[data-testid="home-primary-cta"]').getBoundingClientRect(); return document.querySelector('[data-testid="home-primary-cta"]').contains(document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2)); })()`);
  assert.ok(hit, `${label}: the 3D scene does not intercept the CTA`);
  void header;
}

/** A real drag on the universe collapses the hero into the compact pill above the filter bar. */
async function collapseByDrag(label) {
  const [vw, vh] = await evaluate('[innerWidth, innerHeight]');
  // Start on a spot where the universe itself (not the hero or other controls) is on top.
  const from = await evaluate(`(() => { for (let y = 140; y < innerHeight - 140; y += 20) for (const x of [innerWidth / 2, 8, innerWidth - 8]) if (document.elementFromPoint(x, y)?.tagName === 'CANVAS') return { x, y }; return null; })()`);
  assert.ok(from, `${label}: an exposed part of the universe to drag`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...from, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: from.x + 40, y: from.y + 10, button: 'left', buttons: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: from.x + 40, y: from.y + 10, button: 'left', clickCount: 1 });
  await waitFor(`document.querySelector('[data-testid="home-hero"]')?.dataset.variant === 'compact' && getComputedStyle(document.querySelector('[data-testid="home-hero"]')).opacity === '1'`, `${label}: hero collapses on drag`);
  await sleep(300);
  const pill = await rect('[data-testid="home-hero"]');
  const cta = await rect('[data-testid="home-primary-cta"]');
  const filters = await rect('[class*="max-w-[92vw]"]');
  assert.ok(Math.abs(pill.cx - vw / 2) <= 2 && pill.x >= 12 && pill.r <= vw - 12, `${label}: compact pill centered with safe margins`);
  assert.ok(pill.b <= filters.y - 8, `${label}: compact pill clear of the filter bar (${pill.b} vs ${filters.y})`);
  assert.ok(cta.h >= 44 && cta.w >= 44, `${label}: compact CTA touch target`);
  assert.equal(await evaluate('document.querySelectorAll(\'a[href="/canvas"]\').length'), 1, `${label}: still one primary CTA`);
  assert.equal(await evaluate(`document.elementFromPoint(${vw / 2}, ${vh / 2})?.tagName`), 'CANVAS', `${label}: centre of the universe is reachable`);
  const [sw, iw] = await evaluate('[document.scrollingElement.scrollWidth, innerWidth]');
  assert.ok(sw <= iw, `${label}: no horizontal overflow when compact`);
  const hit = await evaluate(`(() => { const c = document.querySelector('[data-testid="home-primary-cta"]').getBoundingClientRect(); return document.querySelector('[data-testid="home-primary-cta"]').contains(document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2)); })()`);
  assert.ok(hit, `${label}: compact CTA hit-testable`);
}

const steps = [];
async function step(name, fn) {
  await fn();
  steps.push(name);
  console.log(`  ✓ ${name}`);
}

function luminance([r, g, b]) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const rgb = (s) => s.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number);

async function main() {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try {
      target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === 'page');
    } catch {
      await sleep(200);
    }
  }
  assert.ok(target, 'Chrome DevTools endpoint not reachable');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') pageErrors.push(msg.params.exceptionDetails.exception?.description ?? 'exception');
    else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') pageErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
  });
  await send('Runtime.enable');
  await send('Page.enable');
  console.log(`E2E homepage @ ${BASE}`);

  await step('desktop: single primary Canvas CTA in a centered hero; legacy CTA gone', async () => {
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await openHome();
    assert.equal(await evaluate(`document.querySelectorAll('a[href="/coach"]').length`), 0, 'no /coach link');
    assert.equal(await evaluate(`[...document.querySelectorAll('a,button')].filter(e => /AI Math Coach · Thể tích hình trụ/.test(e.textContent)).length`), 0, 'legacy label gone');
    assert.equal(await evaluate(`document.querySelectorAll('a[href="/canvas"]').length`), 1, 'exactly one Canvas entry');
    const text = await evaluate(`document.querySelector('[data-testid="home-hero"]').innerText`);
    for (const s of ['AI MATH COACH', 'Math Reasoning Canvas', 'Viết cách em nghĩ. Nhìn thấy cách em hiểu.', 'Từng bước suy luận của em được kiểm tra', 'Bắt đầu khám phá', 'Viết từng bước · Trực quan 3D · AI hướng dẫn']) assert.ok(text.includes(s), s);
    assert.equal(await evaluate(`document.querySelector('#home-hero-title').tagName`), 'H2');
    await checkLayout('desktop');
    const [fg, bg] = await evaluate(`(() => { const s = getComputedStyle(document.querySelector('[data-testid="home-primary-cta"]')); return [s.color, s.backgroundColor]; })()`);
    const [l1, l2] = [luminance(rgb(fg)), luminance(rgb(bg))].sort((a, b) => b - a);
    assert.ok((l1 + 0.05) / (l2 + 0.05) >= 4.5, 'CTA text contrast ≥ 4.5:1');
    assert.ok(await evaluate(`!!document.querySelector('canvas')`), '3D universe still rendered');
    await screenshot('home-desktop.png');
  });

  await step('universe controls remain usable around the hero (filter bar, header, language); hero collapses for a category', async () => {
    const filterBtn = await evaluate(`(() => { const b = document.querySelector('[class*="max-w-[92vw]"] button:nth-of-type(2)'); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, inside: b.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)) }; })()`);
    assert.ok(filterBtn.inside, 'filter button hit-testable');
    await evaluate(`document.querySelector('button[aria-label="Đổi ngôn ngữ"]').click()`);
    await waitFor(`document.querySelector('[data-testid="home-hero"]').innerText.includes('Write how you think. See how you understand.')`, 'English hero');
    assert.ok((await evaluate(`document.querySelector('[data-testid="home-primary-cta"]').innerText`)).includes('Start exploring'));
    // en/zh have no app.changeLanguage key, so the toggle keeps its Vietnamese fallback label (pre-existing).
    const toggle = `document.querySelector('header button[aria-label="Đổi ngôn ngữ"]').click()`;
    await evaluate(toggle);
    await waitFor(`document.documentElement.lang === 'zh'`, 'zh');
    assert.ok((await evaluate(`document.querySelector('[data-testid="home-primary-cta"]').innerText`)).includes('开始探索'));
    await evaluate(toggle);
    await waitFor(`document.documentElement.lang === 'vi'`, 'back to vi');
    // A real click on a category collapses the hero (filtered nodes cluster at the centre); "all" restores it.
    await clickAt(filterBtn.x, filterBtn.y);
    await waitFor(`document.querySelector('[data-testid="home-hero"]')?.dataset.variant === 'compact'`, 'compact hero while a category is explored');
    const all = await evaluate(`(() => { const r = document.querySelector('[class*="max-w-[92vw]"] button').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
    await clickAt(all.x, all.y);
    await waitFor(`document.querySelector('[data-testid="home-hero"]')?.dataset.variant === 'full'`, 'full hero back on the "all" view');
  });

  await step('keyboard: Tab reaches the CTA with a visible focus ring; Enter opens the guarded /canvas flow', async () => {
    await openHome();
    let reached = false;
    for (let i = 0; i < 40 && !reached; i++) {
      await key('Tab');
      reached = await evaluate(`document.activeElement?.dataset?.testid === 'home-primary-cta'`);
    }
    assert.ok(reached, 'CTA reachable by Tab');
    const ring = await evaluate(`getComputedStyle(document.activeElement).boxShadow`);
    assert.ok(ring && ring !== 'none', `visible focus ring (${ring})`);
    await screenshot('home-focus.png');
    await key('Enter');
    // DemoGuard renders a short session check at /canvas before redirecting unauthenticated users.
    await waitFor(`location.pathname === '/login'`, 'unauthenticated → existing demo guard at /login');
    assert.equal(await evaluate(`history.state?.usr?.from ?? ''`), '/canvas', 'guard returns to /canvas after login');
  });

  await step('pointer: a real click on the CTA opens the Canvas flow; dragging the universe collapses the hero and frees the centre', async () => {
    await openHome();
    const c = await rect('[data-testid="home-primary-cta"]');
    await clickAt(c.cx, c.cy);
    await waitFor(`location.pathname === '/login'`, 'click navigates');
    await openHome();
    await collapseByDrag('desktop');
    await screenshot('home-desktop-compact.png');
    const k = await rect('[data-testid="home-primary-cta"]');
    await clickAt(k.cx, k.cy);
    await waitFor(`location.pathname === '/login'`, 'compact CTA click navigates');
  });

  await step('legacy /coach still works when visited directly', async () => {
    await send('Page.navigate', { url: `${BASE}/coach` });
    await waitFor(`location.pathname === '/coach' && !!document.querySelector('[aria-current="step"]')`, 'coach page');
  });

  for (const [label, width, height, mobile] of [['tablet', 820, 1180, true], ['mobile', 390, 844, true], ['small mobile', 360, 640, true]]) {
    await step(`${label} ${width}×${height}: readable centered hero, comfortable CTA, no overflow or overlap`, async () => {
      await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile });
      await openHome();
      await checkLayout(label);
      const title = await evaluate(`parseFloat(getComputedStyle(document.querySelector('#home-hero-title')).fontSize)`);
      assert.ok(title >= 28, `${label}: title ≥ 28px (${title})`);
      await screenshot(`home-${label.replace(' ', '-')}.png`);
      await collapseByDrag(label);
      await screenshot(`home-${label.replace(' ', '-')}-compact.png`);
    });
  }

  await step('reduced motion: hero is shown without entrance movement', async () => {
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await send('Page.navigate', { url: `${BASE}/` });
    await waitFor(`!!document.querySelector('[data-testid="home-hero"]')`, 'hero');
    const st = await evaluate(`(() => { const s = getComputedStyle(document.querySelector('[data-testid="home-hero"]')); return [s.opacity, s.transform]; })()`);
    assert.equal(st[0], '1', 'no fade-in');
    assert.ok(st[1] === 'none' || st[1] === 'matrix(1, 0, 0, 1, 0, 0)', `no translate (${st[1]})`);
    await send('Emulation.setEmulatedMedia', { features: [] });
  });

  const relevant = pageErrors.filter((e) => !/fonts\.(googleapis|gstatic)|ERR_INTERNET_DISCONNECTED|Failed to load resource|GPU stall|WebGL/.test(e));
  assert.deepEqual(relevant, [], `page errors: ${relevant.join('\n')}`);
  console.log(`E2E passed: ${steps.length} steps, no page errors.`);
}

main()
  .catch((err) => {
    console.error('E2E FAILED:', err.message);
    if (pageErrors.length) console.error('Page errors:\n' + pageErrors.join('\n'));
    process.exitCode = 1;
  })
  .finally(() => {
    try {
      ws?.close();
    } catch {
      /* ignore */
    }
    chrome.kill();
    setTimeout(() => rmSync(profile, { recursive: true, force: true }), 500);
  });
