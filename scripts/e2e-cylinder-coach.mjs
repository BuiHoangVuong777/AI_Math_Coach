#!/usr/bin/env node
/**
 * Browser E2E for the cylinder happy case (S1 → S6), with no npm dependencies:
 * launches headless Chrome and drives it through the DevTools protocol using
 * Node's built-in WebSocket (Node ≥ 22).
 *
 * Usage:
 *   npm run build && npx vite preview --port 4173 &   # or: npm run dev
 *   npm run test:e2e
 * Env: E2E_BASE_URL (default http://localhost:4173), CHROME_PATH (default google-chrome),
 *      E2E_SCREENSHOT_DIR (optional; saves S4/S6 screenshots there),
 *      E2E_COACH_MODE = fallback (default: no backend or no API key → rule-based replies)
 *                     | ai (backend is scripts/mock-coach-server.ts → validated fake-model replies).
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:4173';
const CHROME = process.env.CHROME_PATH ?? 'google-chrome';
const SHOTS = process.env.E2E_SCREENSHOT_DIR;
const PORT = 9333;
const COACH_MODE = process.env.E2E_COACH_MODE === 'ai' ? 'ai' : 'fallback';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'coach-e2e-'));
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--window-size=1400,1000',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

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

async function waitFor(expression, label, timeout = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(expression)) return;
    await sleep(100);
  }
  throw new Error(`Timed out waiting for: ${label}`);
}

// Page-side helpers: set React-controlled values and click by visible text.
const HELPERS = `
window.__e2e = {
  set(sel, value) {
    const el = document.querySelector(sel);
    if (!el) throw new Error('missing ' + sel);
    const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
      : el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, String(value));
    el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  },
  click(text) {
    const el = [...document.querySelectorAll('button, a, label')].find(b => b.textContent.trim().startsWith(text) && !b.disabled);
    if (!el) throw new Error('no enabled clickable starting with: ' + text);
    el.click();
  },
  submitOf(sel) { document.querySelector(sel).form.querySelector('button[type="submit"]').click(); },
  radio(name, value) { document.querySelector('input[name="' + name + '"][value="' + value + '"]').click(); },
  text() { return document.body.innerText; },
  viewerText() { return document.querySelector('[data-testid="cylinder-viewer"]')?.innerText ?? ''; },
  stage() { return document.querySelector('[aria-current="step"]')?.textContent ?? ''; },
};`;

const js = {
  set: (sel, v) => evaluate(`__e2e.set(${JSON.stringify(sel)}, ${JSON.stringify(v)})`),
  click: (t) => evaluate(`__e2e.click(${JSON.stringify(t)})`),
  submitOf: (sel) => evaluate(`__e2e.submitOf(${JSON.stringify(sel)})`),
  radio: (n, v) => evaluate(`__e2e.radio(${JSON.stringify(n)}, ${JSON.stringify(v)})`),
  text: () => evaluate('__e2e.text()'),
  viewerText: () => evaluate('__e2e.viewerText()'),
  stageIs: (s) => waitFor(`__e2e.stage().includes(${JSON.stringify(s)})`, `stage ${s}`),
};

async function screenshot(name) {
  if (!SHOTS) return;
  const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(join(SHOTS, name), Buffer.from(data, 'base64'));
}

const steps = [];
async function step(name, fn) {
  await fn();
  steps.push(name);
  console.log(`  ✓ ${name}`);
}

async function main() {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = list.find((t) => t.type === 'page');
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
    } else if (msg.method === 'Runtime.exceptionThrown') {
      pageErrors.push(msg.params.exceptionDetails.exception?.description ?? 'exception');
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      pageErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');

  console.log(`E2E cylinder coach @ ${BASE} (coach mode: ${COACH_MODE})`);

  await step('legacy /coach is no longer linked from home but loads by direct URL', async () => {
    await send('Page.navigate', { url: `${BASE}/` });
    await waitFor(`!!document.querySelector('a[href="/canvas"]')`, 'home hero', 20_000);
    assert.equal(await evaluate(`document.querySelectorAll('a[href="/coach"]').length`), 0, 'no legacy CTA on home');
    await send('Page.navigate', { url: `${BASE}/coach` });
    await waitFor(`location.pathname === '/coach' && !!document.querySelector('[aria-current="step"]')`, 'direct /coach', 20_000);
    await evaluate(HELPERS);
    await js.stageIs('S1');
  });

  await step('S1: no 3D model yet; diameter mix-up gets targeted feedback and blocks progress', async () => {
    assert.equal(await evaluate(`document.querySelectorAll('canvas').length`), 0);
    const text = await js.text();
    for (const leak of ['20π', '80π', 'gấp 4']) assert.ok(!text.includes(leak), `S1 leaks ${leak}`);
    await js.set('#an-r1', '2');
    await js.set('#an-r2', '8');
    await js.set('#an-h', '5');
    await js.set('#an-unit', 'cm');
    await js.set('#an-fixed', 'height');
    await js.set('#an-target', 'volume_ratio');
    await js.click('Kiểm tra phân tích');
    await waitFor(`__e2e.text().includes('không phải đường kính')`, 'diameter feedback');
    await js.stageIs('S1');
    await js.set('#an-r2', '4');
    await js.click('Kiểm tra phân tích');
    await js.stageIs('S2');
  });

  await step('S2: two labelled cylinders render, slider locked, camera moves keep r/h', async () => {
    await waitFor(`!!document.querySelector('[data-testid="cylinder-viewer"] canvas')`, 'canvas');
    await waitFor(`__e2e.viewerText().includes('Tham chiếu (cố định)')`, '3D labels rendered');
    const text = await js.viewerText();
    assert.ok(text.includes('Tham chiếu (cố định)') && text.includes('So sánh'));
    assert.equal((text.match(/r = 2 cm/g) ?? []).length, 2, 'both cylinders start at r = 2 cm');
    assert.equal((text.match(/h = 5 cm/g) ?? []).length, 2, 'both cylinders have h = 5 cm');
    assert.equal(await evaluate(`document.querySelector('#comparison-radius').disabled`), true);
    for (const label of ['Xoay sang trái', 'Phóng to', 'Thu nhỏ', 'Đặt lại góc nhìn']) {
      await evaluate(`document.querySelector('button[aria-label="${label}"]').click()`);
    }
    assert.equal(((await js.viewerText()).match(/r = 2 cm/g) ?? []).length, 2, 'camera moves do not change dimensions');
    await js.radio('figure', 'diameter');
    await js.click('Trả lời');
    await waitFor(`__e2e.text().includes('Chưa đúng. Đường kính')`, 'figure feedback');
    await js.radio('figure', 'radius');
    await js.click('Trả lời');
    await js.stageIs('S3');
  });

  await step('S3: demo prediction "2" is stored and unlocks the slider', async () => {
    assert.equal(await evaluate(`document.querySelector('#comparison-radius').disabled`), true);
    await js.click('Điền dự đoán minh họa');
    await js.stageIs('S4');
    assert.equal(await evaluate(`document.querySelector('#comparison-radius').disabled`), false);
    assert.ok((await js.text()).includes('Dự đoán đã lưu: “2” (minh họa)'));
  });

  await step('S4: slider drives model live; experiment requires r = 4 cm', async () => {
    await js.click('Em đã đặt r = 4 cm');
    await waitFor(`__e2e.text().includes('chưa bằng 4 cm')`, 'must set radius');
    await js.set('#comparison-radius', '3');
    await waitFor(`__e2e.viewerText().includes('r = 3 cm')`, 'label follows slider');
    await js.set('#comparison-radius', '4');
    await waitFor(`__e2e.viewerText().includes('r = 4 cm')`, 'r = 4 label');
    const labels = await js.viewerText();
    assert.ok(labels.includes('r = 2 cm') && (labels.match(/h = 5 cm/g) ?? []).length === 2, 'reference fixed, both h = 5 cm');
    await js.click('Em đã đặt r = 4 cm');
    await js.click('Bắt đầu tính');
  });

  await step('S4 area: wrong answer → targeted feedback + hint; correct → value unlocked', async () => {
    assert.ok(!(await js.text()).includes('16π cm²'), 'area hidden before attempt');
    await js.set('#calc-area-0', '4π');
    await js.set('#calc-area-1', '8π');
    await js.click('Kiểm tra phép tính');
    await waitFor(`__e2e.text().includes('thay vì bình phương')`, 'area_linear feedback');
    await js.click('Xin gợi ý');
    await waitFor(`__e2e.text().includes('Gợi ý 1:')`, 'hint 1');
  });

  await step(`S4 Hỏi Coach: free-text reasoning gets a ${COACH_MODE} reply without blocking the step`, async () => {
    await js.set('#coach-area', 'Em nghĩ bán kính gấp 2 thì diện tích cũng gấp 2');
    await js.submitOf('#coach-area');
    await waitFor(`document.querySelectorAll('[data-coach-source]').length === 1`, 'coach reply', 20_000);
    const source = await evaluate(`document.querySelector('[data-coach-source]').dataset.coachSource`);
    assert.equal(source, COACH_MODE);
    const reply = await evaluate(`document.querySelector('[data-coach-source]').textContent`);
    for (const leak of ['16π', '20π', '80π']) assert.ok(!reply.includes(leak), `coach reply leaks ${leak}`);
    if (COACH_MODE === 'ai') {
      assert.ok(reply.includes('MOCK-AI') && reply.includes('Có thể em đang nhầm'), 'validated AI reply rendered');
      // A model reply that reveals an unsolved answer is rejected → rule-based fallback.
      await js.set('#coach-area', 'LEAK please');
      await js.submitOf('#coach-area');
      await waitFor(`document.querySelectorAll('[data-coach-source]').length === 2`, 'second coach reply', 20_000);
      await evaluate(`document.querySelector('[data-testid="coach-turns"]').scrollIntoView({ block: 'center' })`);
      await screenshot('s4-coach.png');
      const second = await evaluate(`[...document.querySelectorAll('[data-coach-source]')][1].dataset.coachSource`);
      assert.equal(second, 'fallback');
      assert.ok(!(await js.text()).includes('Đáp án: A₂ = 16π'));
    } else {
      assert.ok(reply.includes('Coach cơ bản'), 'fallback is labelled');
    }
  });

  await step('S4 area: correct answer unlocks the value (coach did not change grading)', async () => {
    assert.ok(!(await js.text()).includes('16π cm²'), 'coach reply did not unlock the value');
    await js.set('#calc-area-1', '16pi');
    await js.click('Kiểm tra phép tính');
    await waitFor(`!!document.querySelector('input[name="reason-area"]')`, 'reason question');
    assert.ok((await js.text()).includes('16π cm²'), 'area revealed after correct calc');
    await js.radio('reason-area', 'square');
    await js.click('Kiểm tra lý do');
    await waitFor(`__e2e.text().includes('Vì sao đúng')`, 'what/why card');
    await js.click('Sang bước tiếp theo');
  });

  await step('S4 volume and ratio steps complete; revealed values stay synced with the slider', async () => {
    await js.set('#calc-volume-0', '20π');
    await js.set('#calc-volume-1', '80π');
    await js.click('Kiểm tra phép tính');
    await waitFor(`!!document.querySelector('input[name="reason-volume"]')`, 'volume reason');
    await js.radio('reason-volume', 'base_times_height');
    await js.click('Kiểm tra lý do');
    await js.click('Sang bước tiếp theo');
    await js.set('#calc-ratio-0', '4');
    await js.click('Kiểm tra phép tính');
    await waitFor(`!!document.querySelector('input[name="reason-ratio"]')`, 'ratio reason');
    await js.radio('reason-ratio', 'ratio_squared');
    await js.click('Kiểm tra lý do');
    await waitFor(`__e2e.text().includes('Dự đoán ban đầu của em: “2”')`, 'prediction comparison');
    let text = await js.text();
    assert.ok(text.includes('80π cm³') && text.includes('Kết quả tính: gấp 4 lần'));
    await screenshot('s4-complete.png');
    await js.set('#comparison-radius', '6');
    await waitFor(`__e2e.text().includes('36π cm²') && __e2e.text().includes('180π cm³')`, 'values follow slider to r = 6');
    text = await js.text();
    assert.ok(/V₂\/V₁ =\s*9/.test(text), 'ratio updates to 9 at r = 6');
    await js.set('#comparison-radius', '4');
    await js.click('Sang bài tự kiểm chứng');
    await js.stageIs('S5');
  });

  await step('S5: model, slider, hints and S4 history hidden; answer and reasoning graded separately', async () => {
    assert.equal(await evaluate(`document.querySelectorAll('canvas').length`), 0, 'no 3D in S5');
    assert.equal(await evaluate(`!!document.querySelector('#comparison-radius')`), false, 'no slider in S5');
    const text = await js.text();
    assert.ok(!text.includes('Xin gợi ý') && !text.includes('Gợi ý 1') && !text.includes('80π'), 'no hints/history in S5');
    await js.set('#transfer-answer', '9');
    await js.set('#transfer-reason', 'Chiều cao giữ nguyên, bán kính gấp 9/3 = 3 nên thể tích gấp 3² = 9 lần');
    await js.click('Gửi bài');
    await waitFor(`__e2e.text().includes('Đúng: thể tích gấp 9 lần')`, 'answer verdict');
    assert.ok((await js.text()).includes('Đủ bằng chứng'), 'reason verdict');
    assert.equal(await evaluate(`document.querySelector('#transfer-answer').disabled`), true, 'locked after submit');
    await js.click('Xem tổng kết phiên');
    await js.stageIs('S6');
  });

  await step('S6: evidence summary keeps the demo prediction verbatim and states its limits', async () => {
    const text = await js.text();
    assert.ok(text.includes('"2" — chưa khớp kết quả'), 'prediction verbatim');
    assert.ok(text.includes('dự đoán minh họa của demo'), 'demo flagged');
    assert.ok(text.includes('diện tích đáy: mức 1'), 'hint usage recorded');
    assert.ok(text.includes('Từ 2 cm đến'), 'radius manipulation recorded');
    assert.ok(text.includes('đủ bằng chứng theo quy tắc chấm'), 'reasoning evaluation');
    assert.ok(
      COACH_MODE === 'ai' ? text.includes('2 lượt (AI: 1, cơ bản: 1)') : text.includes('1 lượt (AI: 0, cơ bản: 1)'),
      'coach exchanges recorded as evidence',
    );
    assert.ok(text.includes('không khẳng định em đã thành thạo'), 'limitation statement');
    await screenshot('s6-summary.png');
  });

  const relevantErrors = pageErrors.filter((e) => !/fonts\.(googleapis|gstatic)|ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e));
  assert.deepEqual(relevantErrors, [], `page errors: ${relevantErrors.join('\n')}`);
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
