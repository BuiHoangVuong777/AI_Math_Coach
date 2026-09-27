#!/usr/bin/env node
/**
 * Browser E2E for the Math Reasoning Canvas (/canvas): demo cases A, B, C, REG-01,
 * an unsupported problem and the v0.5 Explainable Reasoning Graph (XG-AC, keyboard-only, mobile), driven through the real UI in headless Chrome via
 * the DevTools protocol (no npm dependencies; Node ≥ 22).
 *
 * Usage:
 *   npm run build && npx vite preview --port 4173 &      # optionally a backend
 *   npm run test:e2e:canvas
 * Env: E2E_BASE_URL (default http://localhost:4173), CHROME_PATH, E2E_SCREENSHOT_DIR,
 *      E2E_CDP_PORT (default 9334), E2E_BUILD_MODE=dev (otherwise production),
 *      E2E_COACH_MODE = fallback (default: no backend / no key → rule-based coach, possibly offline)
 *                     | ai (backend is scripts/mock-coach-server.ts → fake-model replies, validated).
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { DEMO_SCENARIOS } from '../src/data/canvas/demoScenarios.ts';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:4173';
const CHROME = process.env.CHROME_PATH ?? 'google-chrome';
const SHOTS = process.env.E2E_SCREENSHOT_DIR;
const PORT = Number(process.env.E2E_CDP_PORT ?? 9334);
const DEV_BUILD = process.env.E2E_BUILD_MODE === 'dev';
const MODE = process.env.E2E_COACH_MODE === 'ai' ? 'ai' : 'fallback';

const PROBLEM_A = 'Một lon nước hình trụ có bán kính đáy 3 cm và chiều cao 12 cm. Người ta làm một lon mới có cùng bán kính đáy nhưng chiều cao chỉ bằng một nửa lon cũ. Tính thể tích lon mới và cho biết thể tích lon mới bằng mấy phần thể tích lon cũ.';
const ROWS_A = ['Chiều cao lon mới là 12 : 2 = 6 cm.', 'Diện tích đáy A₁ = π·3² = 9π cm².', 'Lon mới cùng bán kính nên A₂ = A₁ = 9π cm².', 'V₁ = 9π·12 = 108π cm³.', 'V₂ = 9π·6 = 54π cm³.', 'Vậy V₂ : V₁ = 54π : 108π = 1/2, lon mới bằng một nửa lon cũ vì cùng đáy mà chiều cao chỉ bằng một nửa.'];
const PROBLEM_B = 'Một bể nước hình trụ có bán kính đáy 5 dm và chiều cao 8 dm. Nếu bán kính đáy tăng thành 15 dm và giữ nguyên chiều cao thì thể tích bể tăng gấp bao nhiêu lần?';
const PROBLEM_C = 'Một cốc hình trụ có đường kính đáy 6 cm và chiều cao 10 cm. Người ta thay bằng một cốc có đường kính đáy 12 cm, cùng chiều cao. Thể tích cốc mới gấp mấy lần thể tích cốc cũ?';
const ROWS_C = ['Bán kính cốc cũ r₁ = 6 cm.', 'r₂ = 12 cm.', 'A₁ = π·6² = 36π cm².', 'A₂ = π·12² = 144π cm².', 'V₂ : V₁ = (144π·10) : (36π·10) = 4. Vậy cốc mới gấp 4 lần cốc cũ.'];
const EDITS_C = ['r₁ = 6 : 2 = 3 cm vì 6 cm là đường kính.', 'r₂ = 12 : 2 = 6 cm.', 'A₁ = π·3² = 9π cm².', 'A₂ = π·6² = 36π cm².', 'V₂ : V₁ = (36π·10) : (9π·10) = 4. Vậy cốc mới gấp 4 lần cốc cũ vì chiều cao như nhau.'];
const PROBLEM_REG = 'Một hình trụ có bán kính r = 2 cm, chiều cao h = 5 cm. Nếu bán kính tăng thành 4 cm và chiều cao giữ nguyên, thể tích tăng gấp bao nhiêu lần?';
const ROWS_REG = ['Em đoán thể tích gấp 2 lần.', 'A₁ = π·2² = 4π cm²', 'A₂ = π·4² = 16π cm²', 'V₁ = 4π·5 = 20π cm³', 'V₂ = 16π·5 = 80π cm³', 'V₂/V₁ = 80π/20π = 4, gấp 4 lần vì chiều cao không đổi.'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), 'canvas-e2e-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1500,1100', 'about:blank'], { stdio: 'ignore' });

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
async function waitFor(expression, label, timeout = 15_000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await sleep(80);
  }
  const state = await evaluate(`JSON.stringify({phase: document.querySelector('[data-testid="phase"]')?.textContent, voice:document.querySelector('[data-voice-state]')?.dataset.voiceState, focus: document.activeElement?.outerHTML?.slice(0,800), problem: document.querySelector('#problem-text')?.value, row: document.querySelector('#row-input')?.value, text: document.body.innerText.slice(-1800)})`);
  throw new Error(`Timed out waiting for: ${label}; browser state: ${state}`);
}

const HELPERS = `
window.confirm = () => true;
window.__e = {
  set(el, value) {
    const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, String(value));
    el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  },
  q(sel) { const el = document.querySelector(sel); if (!el) throw new Error('missing ' + sel); return el; },
  click(text, root = document) {
    const el = [...root.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith(text) && !b.disabled);
    if (!el) throw new Error('no enabled button: ' + text);
    el.click();
  },
  rows() { return [...document.querySelectorAll('[data-testid="rows"] > li')].map((li) => ({ id: li.dataset.nodeId, row: +li.dataset.row, status: li.dataset.status, text: li.querySelector('[data-testid="original-text"]')?.textContent ?? '' })); },
  row(n) { return document.querySelector('[data-testid="rows"] > li[data-row="' + n + '"]'); },
  text() { return document.body.innerText; },
  coach() { return [...document.querySelectorAll('[data-coach-source]')].map((c) => ({ source: c.dataset.coachSource, type: c.dataset.replyType, level: +c.dataset.level, text: c.textContent })); },
  viewer() { return document.querySelector('[data-testid="canvas-3d"]')?.innerText ?? ''; },
  phase() { return document.querySelector('[data-testid="phase"]')?.textContent ?? ''; },
  idle() { return !document.querySelector('#row-input') || !document.querySelector('form button[type="submit"]')?.disabled || !document.querySelector('#row-input').value; },
};`;

const E = {
  set: (sel, v) => evaluate(`__e.set(__e.q(${JSON.stringify(sel)}), ${JSON.stringify(v)})`),
  click: (t) => evaluate(`__e.click(${JSON.stringify(t)})`),
  rows: () => evaluate('__e.rows()'),
  text: () => evaluate('__e.text()'),
  coach: () => evaluate('__e.coach()'),
  viewer: () => evaluate('__e.viewer()'),
};

async function screenshot(name) {
  if (!SHOTS) return;
  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(SHOTS, name), Buffer.from(data, 'base64'));
}

let inspect = false;
async function startProblem(text) {
  await send('Page.navigate', { url: `${BASE}/canvas${inspect ? '?inspect=graph' : ''}` });
  await waitFor(`Boolean(document.querySelector('#problem-text'))`, 'problem input', 20_000);
  await evaluate(HELPERS);
  await E.set('#problem-text', text);
  await E.click('Phân tích đề');
  await waitFor(`Boolean(document.querySelector('[data-testid="problem-text"]'))`, 'review');
}
async function confirmAll() {
  for (const g of ['givens', 'unknowns', 'conditions', 'target']) await evaluate(`__e.q('[data-confirm="${g}"]').click()`);
  await E.click('Xác nhận và bắt đầu giải');
  await waitFor(`Boolean(document.querySelector('#row-input'))`, 'reasoning phase');
}
async function addRow(text) {
  const before = (await E.rows()).length;
  await E.set('#row-input', text);
  await waitFor(`!__e.q('#row-input').form.querySelector('button[type="submit"]').disabled`, 'row can be submitted');
  await evaluate(`__e.q('#row-input').form.requestSubmit()`);
  await waitFor(`__e.rows().length === ${before + 1} && __e.q('#row-input').value === ''`, `row "${text}"`);
  return (await E.rows()).at(-1);
}
async function editRow(n, text) {
  await evaluate(`__e.click('Sửa', __e.row(${n}))`);
  await waitFor(`!!__e.row(${n}).querySelector('input')`, 'edit input');
  await evaluate(`(() => { const i = __e.row(${n}).querySelector('input'); __e.set(i, ${JSON.stringify(text)}); i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); })()`);
  await waitFor(`!__e.row(${n}).querySelector('input') && __e.row(${n}).querySelector('[data-testid="original-text"]').textContent === ${JSON.stringify(text)}`, `edit row ${n}`);
}
const statuses = async () => (await E.rows()).map((r) => r.status);
const tab = async (t) => {
  if (t === 'graph') { if (!inspect) throw new Error('learner cannot navigate to graph'); return; }
  await evaluate(`(() => { const button=document.querySelector('[data-tab="${t}"]'); if(button)button.click(); else if(${JSON.stringify(t)}==='3d' && document.querySelector('[data-testid="canvas-3d"]')) return; else throw new Error('missing visual tab'); })()`);
};

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
  console.log(`E2E Math Reasoning Canvas @ ${BASE} (coach mode: ${MODE})`);
  await send('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__nativeSpeech = window.speechSynthesis;
    window.__NativeUtterance = window.SpeechSynthesisUtterance;
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text=text; } };
    window.__speechEvents = [];
    const synth = {
      getVoices: () => [{lang:'vi-VN',name:'Mock Vietnamese',default:true,localService:true,voiceURI:'mock-vi'}],
      addEventListener(){},removeEventListener(){},
      cancel(){clearTimeout(window.__speechTimer);window.__speechEvents.push('cancel');},
      pause(){clearTimeout(window.__speechTimer);window.__speechEvents.push('pause');},
      resume(){window.__speechEvents.push('resume');},
      speak(u){window.__speechEvents.push({text:u.text,rate:u.rate});window.__utterance=u;},
    };
    Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});
  `});


  await step('home page links to /canvas', async () => {
    await send('Page.navigate', { url: `${BASE}/` });
    await waitFor(`Boolean(document.querySelector('a[href="/canvas"]'))`, 'canvas link', 20_000);
    await evaluate(`document.querySelector('a[href="/canvas"]').click()`);
    await waitFor(`location.pathname === '/login' && !!document.querySelector('#demo-email')`, 'protected Canvas redirects to login');
    await evaluate(HELPERS);
    await E.click('Đăng nhập demo');
    await waitFor(`Boolean(document.querySelector('[role=alert]')?.textContent.includes('nhập email'))`, 'required validation');
    await E.set('#demo-email','not-an-email'); await E.set('#demo-password','wrong'); await E.click('Đăng nhập demo');
    await waitFor(`Boolean(document.querySelector('[role=alert]')?.textContent.includes('định dạng'))`, 'email validation');
    await E.set('#demo-email','student@mathcoach.demo');
    if (MODE !== 'ai') await evaluate(`document.querySelector('[data-testid="offline-demo"]').click()`);
    await E.click('Đăng nhập demo');
    await waitFor(`Boolean(document.querySelector('[role=alert]')?.textContent.includes('chưa đúng'))`, 'invalid credentials');
    await E.set('#demo-password','Demo@123456');
    await E.click('Hiện'); assert.equal(await evaluate(`document.querySelector('#demo-password').type`),'text');
    await E.click('Ẩn');
    await evaluate(`(() => { window.__loginRequests=0; const f=window.fetch;window.fetch=(...args)=>{if(String(args[0]).endsWith('/demo-auth/login'))window.__loginRequests++;return f(...args);}; const b=[...document.querySelectorAll('button')].find(b=>b.type==='submit');b.click();b.click();})()`);
    await waitFor(`location.pathname === '/canvas' && !!document.querySelector('#problem-text')`, 'return to protected Canvas');
    assert.ok((await E.text()).includes('Tài khoản demo'));
    assert.equal(await evaluate('window.__loginRequests'),MODE==='ai'?1:0,'duplicate-submit protection');
    assert.equal(await evaluate(`Object.values({...localStorage,...sessionStorage}).some(v=>String(v).includes('Demo@123456'))`),false);
    await send('Page.reload');
    await waitFor(`Boolean(document.querySelector('#problem-text'))`, 'login survives refresh');
    await evaluate(HELPERS);
    await screenshot('demo-login-return.png');
  });

  await step('Demo modal: four exact fixtures, copy isolation, keyboard, mobile and no session mutation', async () => {
    assert.equal(await evaluate(`!!document.querySelector('[data-testid="demo-dialog"]')`), false, 'never opens automatically');
    await E.set('#problem-text','Đề đang soạn');
    if (DEV_BUILD) await evaluate(`(async()=>{const r=performance.getEntriesByType('resource').find(e=>new URL(e.name).pathname==='/src/stores/reasoningSessionStore.ts');window.__demoStore=(await import(r.name)).useCanvas;window.__demoBefore=JSON.stringify(__demoStore.getState());})()`);
    await evaluate(`window.__demoWrites=[];window.__demoRequests=0;window.__savedClipboard=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=async text=>{__demoWrites.push(text);};window.__demoFetch=window.fetch;window.fetch=(...a)=>{__demoRequests++;return __demoFetch(...a);};`);
    await E.click('Kịch bản demo');
    await waitFor(`!!document.querySelector('[data-testid="demo-dialog"]')`, 'demo modal opens');
    assert.equal(await evaluate(`document.querySelector('#root').inert`),true);
    assert.equal(await evaluate(`document.activeElement.getAttribute('aria-label')`),'Đóng kịch bản demo');
    for (const demo of DEMO_SCENARIOS) {
      await evaluate(`document.querySelector('[data-demo-id="${demo.id}"]').click()`);
      assert.equal(await evaluate(`document.querySelectorAll('[data-demo-id][aria-pressed="true"]').length`),1);
      assert.equal(await evaluate(`document.querySelector('[data-demo-id="${demo.id}"]').getAttribute('aria-pressed')`),'true');
      assert.equal(await evaluate(`document.querySelector('[data-testid="demo-problem"]').textContent`),demo.problem);
      assert.equal(await evaluate(`document.querySelector('[data-testid="demo-answer"]').open`),false);
      await evaluate(`document.querySelector('[data-testid="copy-problem"]').click()`);
      await waitFor(`document.querySelector('[role="status"]').textContent.includes('Đã sao chép đề bài')`, 'accessible problem copy feedback');
      assert.equal(await evaluate(`__demoWrites.at(-1)`),demo.problem);
      for (const [i,text] of demo.steps.entries()) {
        await evaluate(`document.querySelector('[data-demo-step="${i}"] button').click()`);
        await waitFor(`document.querySelector('[role="status"]').textContent.includes('Đã sao chép bước ${i+1}')`, 'individual step copy feedback');
        assert.equal(await evaluate(`__demoWrites.at(-1)`),text,'only one exact step copied');
      }
      await evaluate(`document.querySelector('[data-testid="demo-answer"] summary').click()`);
      assert.equal(await evaluate(`document.querySelector('[data-testid="demo-answer"]').open`),true);
    }
    const key = async (key, code, vk, modifiers=0) => {await send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:vk,modifiers,...(key==='Enter'?{text:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:vk,modifiers});};
    await evaluate(`document.querySelector('[data-testid="demo-dialog"] button').focus()`);
    await key('Tab','Tab',9,8);
    assert.equal(await evaluate(`document.activeElement.tagName`),'SUMMARY','Shift+Tab wraps');
    await key('Tab','Tab',9);
    assert.equal(await evaluate(`document.activeElement.getAttribute('aria-label')`),'Đóng kịch bản demo','Tab wraps');
    await evaluate(`document.querySelector('[data-demo-id="height-half"]').focus()`);
    await key('Enter','Enter',13);
    await waitFor(`document.querySelector('[data-demo-id="height-half"]').getAttribute('aria-pressed')==='true'`, 'keyboard selects scenario');
    assert.equal(await evaluate(`document.querySelector('[data-demo-id="height-half"]').getAttribute('aria-pressed')`),'true');
    await screenshot('demo-modal-desktop.png');
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    await sleep(250);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-testid="demo-dialog"]')).animationName`),'none');
    assert.ok(await evaluate(`(()=>{const r=document.querySelector('[data-testid="demo-dialog"]').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})()`));
    assert.ok(await evaluate(`(()=>{const s=document.querySelector('[data-testid="demo-scroll"]');s.scrollTop=s.scrollHeight;return s.scrollHeight>s.clientHeight&&s.scrollTop>0&&s.scrollWidth<=s.clientWidth;})()`));
    await screenshot('demo-modal-mobile.png');
    await evaluate(`navigator.clipboard.writeText=async()=>{throw new Error('denied')};document.querySelector('[data-testid="copy-problem"]').click()`);
    await waitFor(`document.querySelector('[role="status"]').textContent.includes('Chưa sao chép được')`, 'clipboard failure feedback');
    if(DEV_BUILD) assert.equal(await evaluate(`JSON.stringify(__demoStore.getState())`),await evaluate('__demoBefore'),'opening/selecting/copying never mutates session');
    assert.equal(await evaluate('__demoRequests'),0,'no requests from modal');
    assert.equal(await evaluate(`document.querySelector('#problem-text').value`),'Đề đang soạn');
    await key('Escape','Escape',27);
    await waitFor(`!document.querySelector('[data-testid="demo-dialog"]')`, 'Escape closes');
    assert.equal(await evaluate(`document.activeElement.textContent.trim()`),'Kịch bản demo');
    assert.equal(await evaluate(`document.querySelector('#root').inert`),false);
    await E.click('Kịch bản demo');
    await evaluate(`document.querySelector('[data-demo-id="diameter-double"]').click()`);
    await E.click('Dùng đề này');
    assert.equal(await evaluate(`document.querySelector('#problem-text').value`),DEMO_SCENARIOS[2].problem);
    assert.equal(await evaluate(`!!document.querySelector('[data-testid="demo-dialog"]')`),false);
    assert.equal(await evaluate(`!!document.querySelector('#row-input')`),false);
    assert.equal(await evaluate('__demoRequests'),0,'use only populates textarea');
    await E.click('Kịch bản demo');await E.click('Đóng');
    await evaluate(`navigator.clipboard.writeText=__savedClipboard;window.fetch=__demoFetch;`);
    await send('Emulation.clearDeviceMetricsOverride');await send('Emulation.setEmulatedMedia',{features:[]});
  });

  await step('F1 unsupported problem (cone) is reported, not solved', async () => {
    await startProblem('Một hình nón có bán kính 3 cm, chiều cao 4 cm. Tính thể tích.');
    await waitFor(`Boolean(document.querySelector('[data-testid="problem-status"]'))`, 'status');
    assert.ok((await E.text()).includes('hình nón'));
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Xác nhận và bắt đầu')).disabled`), true);
  });

  await step('Case A: F1 review → six rows all valid; tutor silent until the invitation; 3D + table from real specs', async () => {
    await startProblem(PROBLEM_A);
    assert.ok((await E.text()).includes('Cần tìm'));
    assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.includes('Xác nhận và bắt đầu')).disabled`), true, 'J-AC-02 gate');
    await confirmAll();
    for (const r of ROWS_A) await addRow(r);
    assert.deepEqual(await statuses(), Array(6).fill('valid'));
    // §24.3 mission bar: observational milestones, neutral next action, no score/badges while learning.
    await waitFor(`document.querySelector('[data-testid="milestone-reason"]')?.dataset.state === 'achieved'`, 'mission reasoning milestone');
    assert.deepEqual(await evaluate(`[...document.querySelectorAll('[data-testid^="milestone-"]')].map(li => li.dataset.state)`), ['achieved', 'not_yet', 'achieved', 'not_yet']);
    assert.equal(await evaluate(`document.querySelector('[data-testid="mission-next-action"]').dataset.kind`), 'verify_optional');
    assert.equal(await evaluate(`document.querySelectorAll('[data-testid="score-total"], [data-badge], [data-testid="completion-panel"]').length`), 0, 'no score or badges during reasoning');
    const coach = await E.coach();
    assert.equal(coach.length, 1);
    assert.equal(coach[0].type, 'invitation');
    await tab('3d');
    await waitFor(`__e.viewer().includes('h₂ = 6 cm (bước 1 · khớp)')`, '3D learner label');
    assert.ok(await evaluate(`!!document.querySelector('[data-testid="canvas-3d"] canvas')`), 'WebGL canvas rendered');
    const cells = await evaluate(`[...document.querySelectorAll('[data-testid="comparison-table"] [data-element-id]')].map(b => b.textContent)`);
    assert.ok(cells.some((c) => c.includes('54π') && c.includes('bước 5')));
    await screenshot('canvas-a-3d.png');
  });

  await step('bidirectional selection: 3D/table element → row; row → linked learning visual', async () => {
    await evaluate(`[...document.querySelectorAll('[data-testid="comparison-table"] [data-element-id]')].find(b => b.textContent.includes('108π')).click()`);
    await waitFor(`__e.row(4).querySelector('button[aria-pressed="true"]') !== null`, 'row 4 selected from table');
    await evaluate(`__e.q('[data-testid="element-list"] [data-element-id^="a-n"]').click()`);
    await waitFor(`Boolean(document.querySelector('[data-testid="rows"] button[aria-pressed="true"]'))`, 'row selected from 3D element');
    await evaluate(`__e.row(2).querySelector('button').click()`);
    await waitFor(`document.querySelector('[data-testid="comparison-table"] [data-element-id="t-n2-A1"]').className.includes('ring-2')`, 'row highlights linked table');
    await waitFor(`Boolean(document.querySelector('[data-testid="formula-highlight"]'))`, 'formula highlight for selected row');
    assert.equal(await evaluate(`document.querySelectorAll('[data-tab="graph"], [data-testid="reasoning-graph"], [data-mode]').length`),0,'graph and modes absent');
    await screenshot('canvas-a-row-details.png');
  });

  await step('Case B: invalid hypothesis kept, D0 question, experiment (no factor), revision, revised-by link', async () => {
    await startProblem(PROBLEM_B);
    await confirmAll();
    const r1 = await addRow('Em nghĩ bán kính gấp 3 lần nên thể tích cũng gấp 3 lần.');
    assert.equal(r1.status, 'invalid');
    const c = (await E.coach()).at(-1);
    assert.equal(c.level, 0);
    assert.equal(c.source, MODE === 'ai' ? 'ai' : 'rule_based');
    assert.ok(!/9 lần|gấp 9|1800π/.test(await E.text()), 'no answer before the learner writes it');
    await evaluate(`__e.click('Điều tra', __e.row(1))`);
    await waitFor(`Boolean(document.querySelector('[data-testid="experiment-panel"]'))`, 'experiment');
    await E.set('#exp-slider', 10);
    await waitFor(`Boolean(document.querySelector('[data-testid="comparison-table"]')?.innerText.includes('100π'))`, 'table at r = 10');
    assert.ok(!(await evaluate(`document.querySelector('[data-testid="comparison-table"]').innerText`)).includes('Hệ số'), 'F6-AC-03');
    await addRow('Em thử r = 10 dm thì A = 100π, gấp 4 lần 25π chứ không phải gấp 2.');
    assert.equal((await E.rows())[1].status, 'valid');
    await E.set('#exp-slider', 15);
    await waitFor(`Boolean(document.querySelector('[data-testid="comparison-table"]')?.innerText.includes('1800π'))`, 'table at r = 15 (learner-chosen)');
    await tab('chart');
    await waitFor(`Boolean(document.querySelector('[data-testid="scaling-chart"]'))`, 'chart');
    await screenshot('canvas-b-experiment.png');
    await E.click('Kết thúc thử nghiệm');
    await waitFor(`!document.querySelector('[data-testid="experiment-panel"]')`, 'experiment ended');
    await addRow('Vậy bán kính gấp 3 thì diện tích đáy gấp 3² = 9 lần.');
    await addRow('Chiều cao giữ nguyên nên thể tích cũng gấp 9 lần, không phải 3 lần như em đoán ở bước 1.');
    assert.deepEqual(await statuses(), ['invalid', 'valid', 'valid', 'valid']);
    await waitFor(`Boolean(document.querySelector('[data-testid="clarification"]')?.dataset.kind === 'revised_by')`, 'revised_by prompt');
    await evaluate(`__e.q('[data-option="accept"]').click()`);
    await waitFor(`__e.row(1).innerText.includes('Em đã sửa ở bước 4')`, 'revised-by shown');
    assert.equal((await E.rows())[0].text, 'Em nghĩ bán kính gấp 3 lần nên thể tích cũng gấp 3 lần.', 'B-AC-01 text kept');
    assert.equal((await E.rows())[0].status, 'invalid');
  });

  await step('Case B F8: support hidden; answer and reasoning evaluated separately; summary keeps the hypothesis', async () => {
    await E.click('Tự kiểm tra');
    await waitFor(`Boolean(document.querySelector('[data-testid="independent-view"]'))`, 'independent view');
    assert.equal(await evaluate(`document.querySelectorAll('[data-coach-source], canvas, [data-testid="comparison-table"], [data-testid="scaling-chart"]').length`), 0, 'J-AC-13');
    assert.ok(await evaluate(`!!document.querySelector('[data-testid="mission-independent"]') && !document.querySelector('[data-testid="mission-progress"], [data-testid^="milestone-"]')`), 'F8 shows only the mission step, no main evidence');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await waitFor(`matchMedia('(prefers-reduced-motion: reduce)').matches`, 'reduced-motion media active');
    const main = await E.text();
    assert.ok(!main.includes('Em nghĩ bán kính gấp 3'), 'main history hidden');
    const analog = await evaluate(`document.querySelector('[data-testid="analog-text"]').textContent`);
    const [r1, r2] = [...analog.matchAll(/(\d+) dm/g)].map((m) => Number(m[1])).filter((_, i) => i !== 1);
    const k = r2 / r1;
    await addRow(`r gấp ${r2} : ${r1} = ${k} lần.`);
    await addRow(`Chiều cao không đổi nên V gấp ${k}² = ${k * k} lần.`);
    assert.deepEqual(await statuses(), ['none', 'none'], 'no verdict before submission');
    // Style at the moment the completion header is inserted (no timing luck): reduced motion → already visible.
    await evaluate(`window.__firstHeader = new Promise((resolve) => { const mo = new MutationObserver(() => { const h = document.querySelector('[data-testid="completion-panel"] header'); if (h) { mo.disconnect(); const cs = getComputedStyle(h); resolve({ opacity: cs.opacity, transform: cs.transform }); } }); mo.observe(document.body, { subtree: true, childList: true }); }); void 0`);
    await E.click('Nộp bài');
    await waitFor(`Boolean(document.querySelector('[data-testid="summary-view"]'))`, 'summary');
    const t = await E.text();
    assert.ok(t.includes('Đáp án: đúng') && t.includes('Lập luận: đủ bằng chứng'), 'F8 verdicts');
    assert.ok(t.includes('“Em nghĩ bán kính gấp 3 lần nên thể tích cũng gấp 3 lần.”'), 'hypothesis verbatim');
    assert.ok(t.includes('không phải đánh giá năng lực lâu dài'), 'limitation');
    assert.ok(t.includes('Đổi r₂ từ 5 đến 15'), 'experiment evidence');
    const motionState = await evaluate('window.__firstHeader');
    assert.ok(motionState.opacity === '1' && (motionState.transform === 'none' || motionState.transform === 'matrix(1, 0, 0, 1, 0, 0)'), 'reduced motion: completion shown without entrance movement ' + JSON.stringify(motionState));
    await send('Emulation.setEmulatedMedia', { features: [] });
    await screenshot('canvas-b-summary.png');
  });

  await step('Mission completion (Case B): 100/100, criteria with evidence, badges, separate self-check, support, Coach message + Voice, next challenge, mobile', async () => {
    await waitFor(`Boolean(document.querySelector('[data-testid="completion-panel"]'))`, 'completion panel');
    assert.equal(await evaluate(`document.querySelector('[data-testid="completion-panel"]').dataset.missionComplete`), 'true');
    assert.equal(await evaluate(`document.querySelector('[data-testid="score-total"]').dataset.total`), '100');
    const crit = await evaluate(`[...document.querySelectorAll('details[data-testid^="criterion-"]')].map(d => [d.dataset.testid, +d.dataset.points, +d.dataset.max, d.dataset.status])`);
    assert.deepEqual(crit, [['criterion-problem_understanding', 15, 15, 'full'], ['criterion-evidence_reasoning', 30, 30, 'full'], ['criterion-verification', 20, 20, 'full'], ['criterion-independent_transfer', 25, 25, 'full'], ['criterion-own_explanation', 10, 10, 'full']]);
    assert.ok((await evaluate(`document.querySelector('[data-testid="score-disclaimer"]').textContent`)).includes('không phải điểm đánh giá trí thông minh'));
    // Evidence is traceable to the learner's rows/events (opened details).
    await evaluate(`document.querySelector('[data-testid="criterion-verification"]').open = true`);
    const kinds = await evaluate(`[...document.querySelectorAll('[data-testid="criterion-verification"] [data-evidence-kind]')].map(li => li.dataset.evidenceKind + ':' + li.dataset.nodeIds)`);
    assert.ok(kinds.includes('self_correction:n1 n4') && kinds.includes('tested_prediction:n1 n2'), 'verification evidence cites rows ' + kinds);
    assert.ok((await evaluate(`document.querySelector('[data-testid="criterion-verification"]').innerText`)).includes('sự kiện #'), 'event sequence numbers shown');
    assert.deepEqual(await evaluate(`[...document.querySelectorAll('[data-badge]')].map(b => b.dataset.badge).sort()`), ['data_detective', 'explainer', 'independent_explorer', 'little_scientist']);
    assert.equal(await evaluate(`document.querySelector('[data-testid="independent-outcome"]').dataset.status`), 'evaluated');
    assert.ok((await evaluate(`document.querySelector('[data-testid="independent-outcome"]').innerText`)).includes('Đáp án: khớp'));
    assert.equal(await evaluate(`document.querySelector('[data-testid="guided-points"]').textContent`), '75/75');
    assert.ok((await evaluate(`document.querySelector('[data-testid="support-used"]').innerText`)).includes('Thử nghiệm trên mô hình: 1 lần'));
    const message = await evaluate(`[...document.querySelectorAll('[data-completion-segment]')].map(li => li.textContent)`);
    assert.equal(message.at(-1), 'Tóm tắt này chỉ phản ánh phiên học này; không phải đánh giá năng lực lâu dài.');
    assert.ok(!/giỏi|thông minh|thành thạo|nắm vững|kém|yếu/.test(message.join(' ')), 'no ability or mastery claims');
    // Voice reads exactly the approved message (user-initiated only).
    assert.equal(await evaluate(`!!document.querySelector('[data-testid="voice-controls"]')`), false, 'no automatic speech');
    await evaluate(`document.querySelector('[data-testid="listen-completion"]').click()`);
    await waitFor(`Boolean(document.querySelector('[data-voice-state="speaking"]'))`, 'completion Voice speaking', 20_000);
    assert.equal(await evaluate(`document.querySelector('[data-testid="voice-subtitle"]').textContent`), message[0]);
    assert.ok(await evaluate(`document.querySelector('[data-completion-segment="0"]').className.includes('ring-1')`), 'spoken sentence highlighted');
    if (MODE !== 'ai') {
      assert.equal(await evaluate(`window.__utterance.text`), message[0]);
      await evaluate(`window.__utterance.onend()`);
      await waitFor(`document.querySelector('[data-testid="voice-subtitle"]')?.textContent === ${JSON.stringify(message[1])}`, 'second approved segment');
    }
    await E.click('Dừng đọc');
    assert.equal(await evaluate(`!!document.querySelector('[data-testid="voice-controls"]')`), false);
    await screenshot('completion-desktop.png');
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await sleep(300);
    assert.ok(await evaluate(`document.scrollingElement.scrollWidth <= innerWidth`), 'completion has no horizontal overflow at 390 px');
    assert.ok(await evaluate(`(() => { const r = document.querySelector('[data-testid="score-card"]').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; })()`));
    await screenshot('completion-mobile.png');
    await send('Emulation.clearDeviceMetricsOverride');
    // Optional next challenge: problem text only, opens a fresh F1 (no answer).
    const nc = await evaluate(`document.querySelector('[data-testid="next-challenge-text"]').textContent`);
    assert.ok(nc.length > 20 && !/đáp án/i.test(nc));
    await E.click('Làm bài này trong phiên mới');
    await waitFor(`document.querySelector('#problem-text')?.value === ${JSON.stringify(nc)}`, 'next challenge prefilled in problem input');
  });

  await step('Case C: diameter misread drawn as-is; edits revalidate dependents; rows never rewritten', async () => {
    await startProblem(PROBLEM_C);
    await confirmAll();
    for (const r of ROWS_C) await addRow(r);
    assert.deepEqual(await statuses(), ['invalid', 'invalid', 'invalid', 'invalid', 'insufficient_evidence']);
    await tab('3d');
    await waitFor(`__e.viewer().includes('r₁ = 6 cm (bước 1 · chưa khớp)')`, 'invalid radius label');
    const v = await E.viewer();
    assert.ok(v.includes('d₁ = 6 cm (đề)') && !v.includes('r₁ = 3'), 'C-AC-03');
    assert.equal(await evaluate(`document.querySelector('[data-testid="canvas-3d"] [data-epistemic="learner_invalid"]') !== null`), true);
    await screenshot('canvas-c-before.png');
    await editRow(1, EDITS_C[0]);
    let rows = await E.rows();
    assert.deepEqual(rows.map((r) => r.status), ['valid', 'invalid', 'invalid', 'invalid', 'insufficient_evidence']);
    assert.ok((await evaluate(`__e.row(3).innerText`)).includes('vẫn dùng số cũ'), 'premise_changed shown on row 3');
    assert.equal(rows[2].text, ROWS_C[2], 'row 3 not rewritten');
    await waitFor(`__e.viewer().includes('r₁ = 3 cm (bước 1 · khớp)')`, '3D label updated');
    for (let i = 1; i < 5; i++) await editRow(i + 1, EDITS_C[i]);
    assert.deepEqual(await statuses(), Array(5).fill('valid'));
    assert.ok((await evaluate(`__e.row(1).innerText`)).includes('Lịch sử (1)'));
    await screenshot('canvas-c-after.png');
  });

  await step('Early finish (Case C): incomplete self-check marked, only supported evidence scored, data-reading challenge', async () => {
    await E.click('Kết thúc phiên');
    await waitFor(`Boolean(document.querySelector('[data-testid="completion-panel"]'))`, 'completion after early finish');
    assert.ok((await evaluate(`document.querySelector('[data-testid="completion-headline"]').textContent`)).includes('kết thúc sớm'));
    assert.equal(await evaluate(`document.querySelector('[data-testid="score-total"]').dataset.total`), '75');
    assert.ok(await evaluate(`!!document.querySelector('[data-testid="score-incomplete"]')`));
    assert.equal(await evaluate(`document.querySelector('[data-testid="criterion-independent_transfer"]').dataset.status`), 'incomplete');
    assert.equal(await evaluate(`document.querySelector('[data-testid="independent-outcome"]').dataset.status`), 'not_started');
    assert.equal(await evaluate(`document.querySelector('[data-testid="independent-points"]').textContent`), 'chưa có bằng chứng');
    assert.equal(await evaluate(`document.querySelector('[data-testid="next-challenge"]').dataset.family`), 'diameter_change');
    assert.ok(!(await evaluate(`[...document.querySelectorAll('[data-badge]')].map(b => b.dataset.badge)`)).includes('independent_explorer'));
  });

  await step('REG-01: v0.3 lesson through the generic pipeline', async () => {
    await startProblem(PROBLEM_REG);
    await confirmAll();
    for (const r of ROWS_REG) await addRow(r);
    assert.deepEqual(await statuses(), ['invalid', 'valid', 'valid', 'valid', 'valid', 'valid']);
  });


  // ================================================================ v0.5 Explainable Reasoning Graph (XG-AC)
  const cards = () => evaluate(`[...document.querySelectorAll('[data-testid="reasoning-graph"] [data-node-id^="n"]')].map(c => ({ id: c.dataset.nodeId, status: c.dataset.status, eid: c.dataset.explanationId ?? '', tid: c.dataset.templateId ?? '', text: c.querySelector('[data-testid="node-learner-text"]')?.textContent ?? '', expl: c.querySelector('[data-testid="node-explanation"]')?.textContent ?? '' }))`);
  const graphText = () => evaluate(`(document.querySelector('[data-testid="reasoning-graph"]')?.innerText ?? '') + (document.querySelector('[data-testid="graph-detail"]')?.innerText ?? '')`);
  const clickCard = (id) => evaluate(`__e.q('[data-testid="reasoning-graph"] [data-node-id="${id}"]').click()`);
  const detailText = () => evaluate(`document.querySelector('[data-testid="graph-detail"]')?.innerText ?? ''`);

  if (DEV_BUILD) {
    inspect = true;
  await step('XG Case A: every node explained (verbatim text, status, explanation, traceable id); labelled edges; Level 2 sections', async () => {
    await startProblem(PROBLEM_A);
    await confirmAll();
    for (const r of ROWS_A) await addRow(r);
    await tab('graph');
    await waitFor(`document.querySelectorAll('[data-testid="reasoning-graph"] [data-node-id^="n"]').length === 6`, 'six cards');
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    assert.ok(await evaluate(`[...document.querySelectorAll('[data-testid="reasoning-graph"] .animate-pulse')].every(el => getComputedStyle(el).animationName === 'none')`), 'reduced motion disables update animations');
    await send('Emulation.setEmulatedMedia', { features: [] });
    const cs = await cards();
    const rowIds = (await E.rows()).map((r) => r.id);
    assert.deepEqual(cs.map((c) => c.text.replace(/^Em viết/, '')), ROWS_A, 'FR-XG-003 verbatim');
    assert.ok(cs.every((c) => c.status === 'valid' && c.expl.length > 5 && /@r1@v\d+@D0$/.test(c.eid) && c.tid.startsWith('XT-')), 'XG-AC-01/14');
    const labels = await evaluate(`[...document.querySelectorAll('[data-edge-label]')].map(b => b.textContent)`);
    assert.ok(labels.includes('dữ kiện r₁ = 3 cm') && labels.some((l) => l.startsWith('dùng A₁ = 9π')), 'XG-AC-05 labels on the map');
    await clickCard(rowIds[1]);
    await waitFor(`Boolean(document.querySelector('[data-testid="graph-detail"]'))`, 'Level 2');
    const sections = await evaluate(`[...document.querySelectorAll('[data-testid="graph-detail"] [data-section]')].map(s => s.dataset.section)`);
    assert.deepEqual(sections, ['learner', 'interpretation', 'verification', 'rules', 'sources', 'affected', 'visuals', 'history', 'next'], 'FR-XG-008');
    assert.ok((await detailText()).includes('Diện tích đáy A = πr²'), 'rule of a valid node');
    await evaluate(`document.querySelector('[data-testid="reasoning-graph"]').scrollIntoView({block:'center'})`);
    const mapPoint = await evaluate(`(() => { const r = document.querySelector('[data-testid="reasoning-graph"]').getBoundingClientRect(); return {x: r.left + 20, y: r.top + 20}; })()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseWheel', ...mapPoint, deltaX: 0, deltaY: -120, modifiers: 2 });
    await waitFor(`Boolean(document.querySelector('[data-zoom]')?.dataset.zoom === '1.25')`, 'Ctrl+wheel zoom');
    assert.deepEqual((await cards()).map(c => c.eid), cs.map(c => c.eid), 'zoom preserves explanation revisions and graph version');
    await send('Input.dispatchMouseEvent', { type: 'mouseWheel', ...mapPoint, deltaX: 0, deltaY: 120, modifiers: 2 });
    await waitFor(`Boolean(document.querySelector('[data-zoom]')?.dataset.zoom === '1')`, 'Ctrl+wheel restore');
    const touches = (width) => [{ x: mapPoint.x, y: mapPoint.y + 20, id: 0 }, { x: mapPoint.x + width, y: mapPoint.y + 20, id: 1 }];
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: touches(100) });
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touches(150) });
    await waitFor(`Boolean(document.querySelector('[data-zoom]')?.dataset.zoom === '1.5')`, 'two-finger zoom first move');
    await send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: touches(200) });
    await waitFor(`Boolean(document.querySelector('[data-zoom]')?.dataset.zoom === '2')`, 'two-finger zoom continues after render');
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await evaluate(`document.querySelector('[data-testid="reasoning-graph"] button[data-node-id="${rowIds[1]}"]').focus()`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: '0', code: 'Digit0', text: '0', windowsVirtualKeyCode: 48 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: '0', code: 'Digit0', windowsVirtualKeyCode: 48 });
    await waitFor(`Boolean(document.querySelector('[data-zoom]')?.dataset.zoom === '1')`, 'keyboard zoom reset');
    assert.deepEqual((await cards()).map(c => c.eid), cs.map(c => c.eid), 'touch zoom preserves explanation versions');
    assert.ok(await evaluate(`[...document.querySelectorAll('[data-testid="reasoning-graph"] [data-node-id]')].every(c => c.getBoundingClientRect().height <= 96)`), 'normal cards respect 96 px');
    await screenshot('xg-a-detail.png');
  });

  await step('XG-AC-09: node ↔ row ↔ table/3D and edge selection stay synchronized', async () => {
    const rowIds = (await E.rows()).map((r) => r.id);
    assert.equal(await evaluate(`__e.row(2).querySelector('button').getAttribute('aria-pressed')`), 'true', 'graph → row');
    assert.ok(await evaluate(`[...document.querySelectorAll('[data-testid="comparison-table"] [data-element-id]')].some(b => b.dataset.elementId === 't-n2-A1' && b.className.includes('ring-2'))`), 'graph → table cell');
    await evaluate(`[...document.querySelectorAll('[data-edge-label]')].find(b => b.textContent.startsWith('dùng A₁ = 9π')).click()`);
    await waitFor(`(document.querySelector('[data-testid="edge-explanation"]')?.textContent ?? '').includes('sử dụng diện tích đáy A₁')`, 'edge detail');
    assert.equal(await evaluate(`__e.row(2).querySelector('button').getAttribute('aria-pressed')`), 'true', 'edge → source row');
    await evaluate(`[...document.querySelectorAll('[data-testid="comparison-table"] [data-element-id]')].find(b => b.dataset.elementId === 't-n4-V1').click()`);
    await waitFor(`Boolean(document.querySelector('[data-testid="reasoning-graph"] [data-node-id="${rowIds[3]}"]')?.getAttribute('aria-pressed') === 'true' && (document.querySelector('[data-testid="detail-learner-text"]')?.textContent ?? '') === ${JSON.stringify(ROWS_A[3])})`, 'table → graph node + Level 2');
  });

  await step('XG-AC-12: presenter/debug modes share state, send no request and leak nothing (prod build: no debug)', async () => {
    let canonicalBefore;
    if (DEV_BUILD) {
      canonicalBefore = await evaluate(`(async () => {
        const resource = performance.getEntriesByType('resource').filter(e => new URL(e.name).pathname === '/src/stores/reasoningSessionStore.ts').at(-1);
        if (!resource) throw new Error('canonical store module not found');
        window.__canvasTestStore = (await import(resource.name)).useCanvas;
        const ctx = __canvasTestStore.getState().ctx;
        if (!ctx || ctx.graph.version < 2) throw new Error('wrong store instance');
        return JSON.stringify(ctx);
      })()`);
    }
    await send('Network.enable');
    let requests = 0;
    ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.method === 'Network.requestWillBeSent' && m.params.request.url.includes('/api/')) requests++; });
    const before = await evaluate(`JSON.stringify([...document.querySelectorAll('[data-testid="rows"] > li')].map(li => li.dataset.status + li.querySelector('[data-testid="original-text"]').textContent))`);
    await evaluate(`__e.q('[data-mode="presenter"]').click()`);
    await waitFor(`Boolean(document.querySelector('[data-testid="presenter-lanes"]'))`, 'presenter lanes');
    assert.equal(await evaluate(`document.querySelectorAll('[data-lane-row]').length`), 6);
    assert.ok(await evaluate(`[...document.querySelectorAll('[data-lane="3"]')].some(td => td.innerText.includes('liên hệ dữ kiện với hình'))`), 'lane 3 explains the visual');
    await evaluate(`__e.q('[data-lane-row] button').click()`);
    await waitFor(`__e.row(1).querySelector('button').getAttribute('aria-pressed') === 'true'`, 'lane → row sync');
    assert.equal(await evaluate(`!!document.querySelector('[data-mode="debug"]')`), DEV_BUILD, 'debug is available only in development');
    if (DEV_BUILD) {
      await evaluate(`__e.q('[data-mode="debug"]').click()`);
      await waitFor(`Boolean(document.querySelector('[data-testid="debug-panel"]'))`, 'development debug panel');
      assert.equal(await evaluate(`document.querySelector('[data-graph-mode]').dataset.graphMode`), 'debug');
    }
    await evaluate(`__e.q('[data-mode="learner"]').click()`);
    const after = await evaluate(`JSON.stringify([...document.querySelectorAll('[data-testid="rows"] > li')].map(li => li.dataset.status + li.querySelector('[data-testid="original-text"]').textContent))`);
    assert.equal(after, before, 'state unchanged');
    assert.equal(requests, 0, 'mode switching sends no request');
    if (DEV_BUILD) assert.equal(await evaluate(`JSON.stringify(__canvasTestStore.getState().ctx)`), canonicalBefore, 'canonical SessionContext unchanged deeply across all modes');
    await screenshot('xg-presenter.png');
  });

  await step('XG Case B: D0 explanation reveals nothing; D2 adds the rule; correction edge after revision', async () => {
    await startProblem(PROBLEM_B);
    await confirmAll();
    await addRow('Em nghĩ bán kính gấp 3 lần nên thể tích cũng gấp 3 lần.');
    await tab('graph');
    const [c1] = await cards();
    assert.equal(c1.status, 'invalid');
    assert.equal(c1.tid, 'XT-INVALID-ROOT-D0');
    await clickCard(c1.id);
    await waitFor(`Boolean(document.querySelector('[data-testid="graph-detail"]'))`, 'detail');
    if (DEV_BUILD) {
      await evaluate(`__e.q('[data-mode="debug"]').click()`);
      await waitFor(`Boolean(document.querySelector('[data-testid="debug-panel"]'))`, 'debug for incorrect hypothesis');
      await evaluate(`document.querySelectorAll('[data-testid="debug-panel"] details').forEach(d => d.open = true)`);
      const debugText = await evaluate(`document.querySelector('[data-testid="debug-panel"]').innerText`);
      assert.ok(debugText.includes('[ẩn theo mức tiết lộ]'), 'non-disclosable facts are visibly masked');
      assert.ok(!/1800|225|"n":9|bình phương|r²/.test(debugText), 'debug cannot expose protected results or formulas at D0');
      await evaluate(`__e.q('[data-mode="learner"]').click()`);
    }
    let t = await graphText();
    assert.ok(!/9 lần|gấp 9|chín|1800π|225π|bình phương|r²/.test(t), 'XG-AC-04 D0: no answer, no rule');
    assert.ok((await evaluate(`__e.q('[data-section="rules"]').innerText`)).includes('không có'));
    assert.equal(await evaluate(`!!document.querySelector('[data-testid="formula-highlight"]')`), false, 'no formula at D0');
    for (let i = 0; i < 2; i++) {
      await evaluate(`__e.click('Gợi ý', __e.q('[data-testid="graph-detail"]'))`);
      await waitFor(`(document.querySelector('[data-testid="graph-detail"] [data-testid="detail-trace"]')?.textContent ?? '').includes('mức D${i + 1}')`, `D${i + 1}`);
    }
    t = await graphText();
    assert.ok(!/9 lần|gấp 9|chín|1800π/.test(t), 'still no answer at D2');
    assert.ok((await evaluate(`__e.q('[data-section="rules"]').innerText`)).includes('h không đổi'), 'rule shown at D2');
    await evaluate(`__e.click('Điều tra', __e.q('[data-testid="graph-detail"]'))`);
    await waitFor(`Boolean(document.querySelector('[data-testid="experiment-panel"]'))`, 'experiment from Level 2');
    await E.set('#exp-slider', 10);
    await addRow('Em thử r = 10 dm thì A = 100π, gấp 4 lần 25π chứ không phải gấp 2.');
    await E.click('Kết thúc thử nghiệm');
    await waitFor(`!document.querySelector('[data-testid="experiment-panel"]')`, 'experiment ended');
    await addRow('Vậy bán kính gấp 3 thì diện tích đáy gấp 3² = 9 lần.');
    await addRow('Chiều cao giữ nguyên nên thể tích cũng gấp 9 lần, không phải 3 lần như em đoán ở bước 1.');
    await evaluate(`__e.q('[data-option="accept"]').click()`);
    await tab('graph');
    await waitFor(`Boolean(document.querySelector('path[data-relation="corrects"]'))`, 'correction edge');
    assert.ok(await evaluate(`!!document.querySelector('path[data-relation="tests"]')`), 'tests edge');
    const after = await cards();
    assert.equal(after[0].status, 'invalid');
    assert.equal(after[0].text.replace(/^Em viết/, ''), 'Em nghĩ bán kính gấp 3 lần nên thể tích cũng gấp 3 lần.');
    assert.ok(after[0].expl.includes('em đã sửa ở bước 4'));
    await screenshot('xg-b-revised.png');
  });

  await step('XG Case C: insufficient final ratio; broken edge and fresh explanations after the edit; texts never rewritten', async () => {
    await startProblem(PROBLEM_C);
    await confirmAll();
    for (const r of ROWS_C) await addRow(r);
    await tab('graph');
    let cs = await cards();
    assert.deepEqual(cs.map((c) => c.status), ['invalid', 'invalid', 'invalid', 'invalid', 'insufficient_evidence']);
    assert.ok(cs[4].expl.startsWith('Kết quả của em khớp đề, nhưng dựa trên bước 3, 4'));
    assert.ok(!/r₁ = 3|r₂ = 6|9π/.test(await graphText()), 'no derived value before the learner writes it');
    await evaluate(`document.documentElement.style.filter = 'grayscale(1)'`);
    await screenshot('xg-c-grayscale.png');
    await evaluate(`document.documentElement.style.filter = ''`);
    const oldIds = cs.map((c) => c.eid);
    await editRow(1, EDITS_C[0]);
    await tab('graph');
    await waitFor(`Boolean(document.querySelector('path[data-edge-status="broken"]'))`, 'broken edge');
    cs = await cards();
    assert.ok(!cs.some((c) => oldIds.includes(c.eid)), 'XG-AC-08: no obsolete explanation id in the DOM');
    assert.ok(cs[2].expl.includes('vẫn dùng số cũ') && cs[2].text.endsWith(ROWS_C[2]), 'stale premise, text kept');
    for (let i = 1; i < 5; i++) await editRow(i + 1, EDITS_C[i]);
    await tab('graph');
    await waitFor(`[...document.querySelectorAll('[data-testid="reasoning-graph"] [data-node-id^="n"]')].every(c => c.dataset.status === 'valid')`, 'all valid');
    assert.equal(await evaluate(`document.querySelectorAll('path[data-edge-status="broken"]').length`), 0);
    await screenshot('xg-c-final.png');
  });

    await step('Dev inspector cannot render graph/debug/Voice in independent assessment or summary', async () => {
      await evaluate(`__e.q('[data-mode="debug"]').click()`);
      await waitFor(`document.querySelector('[data-testid="debug-panel"]')`,'explicit dev inspection');
      await E.click('Tự kiểm tra');await waitFor(`document.querySelector('[data-testid="independent-view"]')`,'inspector enters F8');
      assert.equal(await evaluate(`document.querySelectorAll('[data-testid="graph-inspector"],[data-testid="reasoning-graph"],[data-mode],[data-voice-listen],[data-testid="debug-panel"]').length`),0);
      await addRow('Em đoán thể tích gấp 2 lần.');assert.equal((await E.rows())[0].status,'none');
      await E.click('Nộp bài');await waitFor(`document.querySelector('[data-testid="summary-view"]')`,'inspector enters summary');
      assert.equal(await evaluate(`document.querySelectorAll('[data-testid="graph-inspector"],[data-testid="reasoning-graph"],[data-mode],[data-voice-listen],[data-testid="debug-panel"]').length`),0);
    });
    inspect = false;
  }

  await step('No-3D fallback preserves reasoning without inventing geometry or exposing a graph', async () => {
    await startProblem('Nếu bán kính đáy của một hình trụ tăng gấp 3 lần và chiều cao giữ nguyên thì thể tích tăng gấp mấy lần?');await confirmAll();
    assert.ok(await evaluate(`!!document.querySelector('[data-testid="visual-fallback"]')`));
    assert.equal(await evaluate(`document.querySelectorAll('canvas,[data-testid="reasoning-graph"],[data-tab="graph"]').length`),0);
    await addRow('Em đoán thể tích gấp 3 lần.');assert.equal((await E.rows())[0].status,'invalid');
    assert.ok(await evaluate(`!!document.querySelector('[data-testid="visual-fallback"]')`),'symbolic dimensions retain honest text fallback');
    assert.equal(await evaluate(`document.querySelectorAll('canvas,[data-testid="reasoning-graph"]').length`),0);
    assert.ok(!/gấp 9|9 lần|chín lần/.test(await E.text()),'fallback does not disclose answer');
  });
  if (!DEV_BUILD) await step('Production ignores explicit development graph inspector URL', async () => {
    inspect=true;await startProblem(PROBLEM_A);await confirmAll();inspect=false;
    assert.equal(await evaluate(`document.querySelectorAll('[data-testid="graph-inspector"],[data-mode],[data-testid="reasoning-graph"]').length`),0);
    await waitFor(`document.querySelector('[data-testid="canvas-3d"]')`,'3D renders normally despite ignored inspector query');
  });

  await step('Learner rows: approved explanations, provenance, disclosure and hidden internal graph', async () => {
    await startProblem(PROBLEM_A); await confirmAll();
    await waitFor(`document.querySelector('[data-testid="canvas-3d"]')`,'3D defaults before any row without visual navigation');
    for(const r of ROWS_A) await addRow(r);
    const rows=await evaluate(`[...document.querySelectorAll('[data-testid="rows"] > li')].map(c=>({text:c.querySelector('[data-testid="original-text"]').textContent,status:c.dataset.status,eid:c.dataset.explanationId,tid:c.dataset.templateId,version:Number(c.dataset.graphVersion),explanation:c.querySelector('[data-testid="node-explanation"]').textContent}))`);
    assert.deepEqual(rows.map(r=>r.text),ROWS_A);
    assert.ok(rows.every(r=>r.status==='valid' && /@r1@v\d+@D0$/.test(r.eid) && r.tid.startsWith('XT-') && r.explanation.length>5));
    assert.ok(rows.every(r=>r.version===rows[0].version && r.version>=6),'graph version advances internally');
    assert.equal(await evaluate(`document.querySelectorAll('[data-tab="graph"], [data-testid="reasoning-graph"], [data-testid="reasoning-graph-list"], [data-mode], [data-view], [data-testid="graph-inspector"]').length`),0);
    await evaluate(`__e.row(4).querySelector('button').click()`);
    assert.deepEqual(await evaluate(`[...document.querySelectorAll('[data-testid="row-detail"] [data-section]')].map(s=>s.dataset.section)`),['learner','interpretation','verification','rules','sources','affected','visuals','history','next']);
    assert.ok(await evaluate(`document.querySelector('[data-testid="row-detail"] [data-section="sources"]').textContent.includes('bước 2')`),'earlier source explained alongside row');
    await screenshot('learner-explanations.png');
    await startProblem(PROBLEM_B); await confirmAll(); await addRow('Em nghĩ bán kính gấp 3 lần nên thể tích cũng gấp 3 lần.');
    await evaluate(`__e.row(1).querySelector('button').click()`);
    assert.ok(!/9 lần|gấp 9|chín|1800π|225π|bình phương|r²/.test(await E.text()),'D0 row/detail/visual do not disclose hidden answer or rule');
    assert.equal(await evaluate(`!!document.querySelector('[data-testid="formula-highlight"]')`),false);
    for(let i=1;i<=2;i++){await evaluate(`__e.click('Gợi ý',document.querySelector('[data-testid="row-detail"]'))`);await waitFor(`document.querySelector('[data-testid="detail-trace"]').textContent.includes('D${i}')`,'row disclosure '+i);}
    assert.ok(!/9 lần|gấp 9|chín|1800π/.test(await E.text()),'D2 still protects answer');
    assert.ok(await evaluate(`document.querySelector('[data-section="rules"]').textContent.includes('h không đổi')`));
  });
  await step('Case C row explanations: upstream edit refreshes every ID, flags stale premise and preserves history', async () => {
    await startProblem(PROBLEM_C);await confirmAll();for(const r of ROWS_C)await addRow(r);
    const old=await evaluate(`[...document.querySelectorAll('[data-testid="rows"] > li')].map(n=>n.dataset.explanationId)`);
    assert.ok(await evaluate(`__e.row(5).querySelector('[data-testid="node-explanation"]').textContent.startsWith('Kết quả của em khớp đề, nhưng dựa trên bước 3, 4')`));
    const before=await evaluate(`Number(__e.row(1).dataset.graphVersion)`);
    await editRow(1,EDITS_C[0]);
    assert.ok(await evaluate(`Number(__e.row(1).dataset.graphVersion)>${before} && Number(__e.row(1).dataset.nodeRevision)===2`));
    assert.ok(await evaluate(`[...document.querySelectorAll('[data-testid="rows"] > li')].every(n=>!${JSON.stringify(old)}.includes(n.dataset.explanationId))`),'no old explanation ids');
    assert.ok(await evaluate(`__e.row(3).querySelector('[data-testid="node-explanation"]').textContent.includes('vẫn dùng số cũ')`));
    assert.equal((await E.rows())[2].text,ROWS_C[2]);
    await evaluate(`__e.row(3).querySelector('button').click()`);
    assert.ok(await evaluate(`!!document.querySelector('[data-testid="row-detail"] [data-edge-status="broken"]')`),'actual dependency is broken after upstream revision');
    for(let i=1;i<5;i++)await editRow(i+1,EDITS_C[i]);
    assert.deepEqual(await statuses(),Array(5).fill('valid'));
    assert.equal(await evaluate(`document.querySelectorAll('[data-testid="row-detail"] [data-edge-status="broken"]').length`),0);
    assert.ok(await evaluate(`__e.row(1).textContent.includes('Lịch sử (1)')`));
  });
  await step('F8 hides graph, explanations, hints, visuals and Voice while internal assessment continues', async () => {
    await E.click('Tự kiểm tra');await waitFor(`document.querySelector('[data-testid="independent-view"]')`,'F8');
    await addRow('Em đoán thể tích gấp 2 lần.');
    assert.equal((await E.rows())[0].status,'none');
    assert.equal(await evaluate(`document.querySelectorAll('[data-testid="reasoning-graph"], [data-testid="row-detail"], [data-testid="node-explanation"], [data-mode], [data-testid="debug-panel"], [data-voice-listen], canvas, [data-testid="comparison-table"], [data-testid="scaling-chart"]').length`),0);
    assert.equal(await evaluate(`__e.row(1).dataset.explanationId??''`),'');
  });
  await step('40 reasoning rows stay readable at 390 px, with inline details and no graph navigation', async () => {
    await startProblem(PROBLEM_C);await confirmAll();for(let i=0;i<40;i++)await addRow(EDITS_C[i%5]);
    assert.equal((await E.rows()).length,40);
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await sleep(300);
    await evaluate(`__e.row(1).querySelector('button').click()`);
    assert.ok(await evaluate(`document.scrollingElement.scrollWidth<=innerWidth`),'mobile no horizontal overflow');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-testid="row-detail"]')).position`),'static','inline detail, no graph bottom sheet');
    await screenshot('learner-rows-mobile.png');
    await evaluate(`[...document.querySelectorAll('[role="tab"]')].find(b=>b.textContent.trim()==='Hình').click()`);
    await waitFor(`(()=>{const r=document.querySelector('[data-testid="canvas-3d"]')?.getBoundingClientRect();return r && r.width>0 && r.left>=0 && r.right<=innerWidth;})()`,'mobile 3D actually fits visible viewport, not clipped by parent');
    await waitFor(`(()=>{const v=document.querySelector('[data-testid="canvas-3d"]');const c=v?.querySelector('canvas');return c && Math.abs(c.getBoundingClientRect().width-v.clientWidth)<2;})()`,'WebGL canvas has resized to the visible mobile container');
    await send('Runtime.evaluate',{expression:'new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))',awaitPromise:true});
    assert.ok(await evaluate(`document.scrollingElement.scrollWidth<=innerWidth`));await screenshot('learner-3d-mobile.png');
    await send('Emulation.clearDeviceMetricsOverride');await sleep(200);
  });

  await step('POC-AC-08 / XG-AC-10: keyboard-only session — problem, confirmation, rows, source explanations, self-check, summary', async () => {
    await send('Page.navigate', { url: `${BASE}/canvas` });
    await waitFor(`Boolean(document.querySelector('#problem-text'))`, 'canvas', 20_000);
    await evaluate(HELPERS);
    // CDP must send Enter's carriage return to trigger native button/form activation.
    const key = async (k, code = k, text = k === 'Enter' ? '\r' : undefined) => {
      const vk = { Tab: 9, Enter: 13, Escape: 27, ' ': 32, ArrowLeft: 37, ArrowUp: 38, ArrowRight: 39, ArrowDown: 40 }[k] ?? 0;
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: vk, ...(text ? { text } : {}) });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk });
    };
    const tabTo = async (pred, label, max = 120) => {
      for (let i = 0; i < max; i++) {
        if (await evaluate(`(() => { const a = document.activeElement; return !!a && (${pred}); })()`)) return;
        await key('Tab');
      }
      throw new Error('Tab never reached ' + label + '; ' + await evaluate(`JSON.stringify({focus: document.activeElement?.outerHTML, width: innerWidth, view: document.querySelector('[data-graph-view]')?.dataset.graphView})`));
    };
    const type = (t) => send('Input.insertText', { text: t });
    const btn = (txt) => `a.tagName === 'BUTTON' && a.textContent.trim().startsWith(${JSON.stringify(txt)})`;
    await tabTo(`a.id === 'problem-text'`, 'problem');
    await type(PROBLEM_A);
    await tabTo(btn('Phân tích đề'), 'analyse');
    await key('Enter');
    await waitFor(`Boolean(document.querySelector('[data-confirm]'))`, 'review');
    for (const g of ['givens', 'unknowns', 'conditions', 'target']) {
      await tabTo(`a.dataset.confirm === '${g}'`, g);
      await key(' ', 'Space', ' ');
    }
    await tabTo(btn('Xác nhận và bắt đầu'), 'confirm');
    await key('Enter');
    await waitFor(`Boolean(document.querySelector('#row-input'))`, 'reasoning');
    for (const r of ROWS_A) {
      await tabTo(`a.id === 'row-input'`, 'row input');
      await type(r);
      await key('Enter', 'Enter', '\r');
      await waitFor(`Boolean(document.querySelector('#row-input').value === '' && __e.rows().some(x => x.text === ${JSON.stringify(r)}))`, r);
    }
    await tabTo(`a.dataset.nodeId === 'n4' && a.getAttribute('aria-label')==='Chọn bước 4'`, 'row 4 selection');
    const contrast = await evaluate(`(() => {
      const el = document.activeElement;
      if (!el.matches(':focus-visible')) throw new Error('card focus is not visibly marked');
      const css = getComputedStyle(el);
      if (css.boxShadow === 'none') throw new Error('card has no focus ring');
      const rgb = value => (value.match(/[0-9.]+/g) ?? []).slice(0, 3).map(Number);
      const luminance = colour => colour.map(n => { const v = n / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      const ring = luminance(rgb(css.getPropertyValue('--tw-ring-color')));
      const background = luminance(rgb(css.backgroundColor));
      return (Math.max(ring, background) + 0.05) / (Math.min(ring, background) + 0.05);
    })()`);
    assert.ok(contrast >= 3, 'focus-ring contrast >=3:1, observed ' + contrast);
    await key('Enter');await waitFor(`document.querySelector('[data-testid="row-detail"]')`,'keyboard inline explanation');
    await tabTo(`a.dataset.sourceNodeId==='n2'`, 'actual earlier source step');await key('Enter');
    await waitFor(`document.activeElement.dataset.nodeId==='n2' && !!document.querySelector('[data-testid="row-detail"]')`,'dependency focuses earlier reasoning row');
    await tabTo(`a.getAttribute('aria-label')==='Đóng chi tiết'`,'close detail');await key('Escape');
    await waitFor(`!document.querySelector('[data-testid="row-detail"]') && document.activeElement.dataset.nodeId==='n2'`,'Esc restores source-row focus');
    await tabTo(btn('Tự kiểm tra'), 'self-check');
    await key('Enter');
    await waitFor(`Boolean(document.querySelector('[data-testid="independent-view"]'))`, 'independent');
    const analog = await evaluate(`document.querySelector('[data-testid="analog-text"]').textContent`);
    await tabTo(`a.id === 'row-input'`, 'row input');
    await type(/một phần/.test(analog) ? 'Thể tích bằng một phần mấy?' : 'Em đoán thể tích gấp 2 lần.');
    await key('Enter', 'Enter', '\r');
    await waitFor(`__e.rows().length === 1`, 'independent row');
    await tabTo(btn('Nộp bài'), 'submit');
    await key('Enter');
    await waitFor(`Boolean(document.querySelector('[data-testid="summary-view"]'))`, 'summary reached by keyboard only', 20_000);
    await tabTo(`a.tagName === 'SUMMARY' && a.parentElement.dataset.testid === 'criterion-problem_understanding'`, 'first score criterion');
    assert.equal(await evaluate(`document.activeElement.matches(':focus-visible')`), true);
    await key('Enter');
    await waitFor(`document.querySelector('[data-testid="criterion-problem_understanding"]').open`, 'criterion details open by keyboard');
    await tabTo(`a.dataset.testid === 'listen-completion'`, 'listen completion');
    await key('Enter');
    await waitFor(`!!document.querySelector('[data-voice-state="speaking"]')`, 'keyboard completion Voice');
    await tabTo(btn('Dừng đọc'), 'stop completion Voice');
    await key('Enter');
    await tabTo(btn('Làm bài này trong phiên mới'), 'next challenge button');
    assert.equal(await evaluate(`document.activeElement.matches(':focus-visible')`), true);
    await screenshot('xg-keyboard-summary.png');
  });

  if (MODE === 'ai') {
    await step('AI mode: LLM parser reading is grounded; a leaking tutor reply falls back to rule-based', async () => {
      await startProblem(PROBLEM_REG);
      await confirmAll();
      const r = await addRow('diện tích đáy A1 bằng pi nhân 2 bình phương bằng 4 pi');
      assert.equal(r.status, 'valid');
      assert.ok((await evaluate(`__e.row(1).innerText`)).includes('AI đọc'));
      await addRow('LEAK Em đoán thể tích gấp 2 lần.');
      const last = (await E.coach()).at(-1);
      assert.equal(last.source, 'rule_based');
      assert.ok(!last.text.includes('gấp 9'));
    });
  }

  if (DEV_BUILD) {
    await step('XG-AC-07: an earlier update timer cannot clear the latest turn', async () => {
      const result = await evaluate(`(async () => {
        const resource = performance.getEntriesByType('resource').filter(e => new URL(e.name).pathname === '/src/stores/reasoningSessionStore.ts').at(-1);
        const store = (await import(resource.name)).useCanvas;
        if (!store.getState().ctx) throw new Error('wrong store');
        const originalTimer = window.setTimeout;
        const callbacks = [];
        window.setTimeout = (fn, ms, ...args) => ms === 3000 ? (callbacks.push(() => fn(...args)), 0) : originalTimer(fn, ms, ...args);
        try {
          await store.getState().turn({ type: 'add_row', rowText: 'Em chưa biết bắt đầu ở đâu.' }, { localOnly: true });
          await store.getState().turn({ type: 'add_row', rowText: 'Em sẽ đọc lại đề.' }, { localOnly: true });
          if (callbacks.length !== 2) throw new Error('update timers not captured');
          const latest = JSON.stringify(store.getState().recentlyChanged);
          if (latest === '[]') throw new Error('no latest update to protect');
          callbacks[0]();
          const afterOld = JSON.stringify(store.getState().recentlyChanged);
          callbacks[1]();
          return { latest, afterOld, afterLatest: store.getState().recentlyChanged };
        } finally { window.setTimeout = originalTimer; }
      })()`);
      assert.equal(result.afterOld, result.latest, 'old timer preserves the latest update');
      assert.deepEqual(result.afterLatest, [], 'current timer clears its own update');
    });
  }


  await step('Voice: user-initiated audio, exact subtitles, node/edge/formula cues, pause/resume/replay/speed/stop', async () => {
    await startProblem(PROBLEM_A); await confirmAll();
    for (const row of ROWS_A.slice(0,4)) await addRow(row);
    await evaluate(`__e.row(4).querySelector('button').click()`);
    assert.equal(await evaluate(`!!document.querySelector('[data-testid="voice-controls"]')`),false,'no automatic speech');
    const sel='[data-testid="row-detail"] [data-voice-listen="n4"]';
    await evaluate(`document.querySelector(${JSON.stringify(sel)}).scrollIntoView({block:'center'})`);
    const rect=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...rect});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...rect});
    await waitFor(`Boolean(document.querySelector('[data-voice-state="speaking"]'))`, 'Voice speaking');
    assert.equal(await evaluate(`document.querySelector('[data-testid="voice-subtitle"]').textContent`),await evaluate(`document.querySelector('[data-testid="rows"] > li[data-node-id="n4"] [data-testid="node-explanation"]').textContent`));
    assert.ok(await evaluate(`!!document.querySelector('[data-node-id="n4"][data-voice-highlight="true"]')`));
    assert.ok(await evaluate(`!!document.querySelector('[data-testid="formula-highlight"][data-voice-highlight="true"]')`),'spoken formula cue is rendered');
    await E.click('Tạm dừng');
    await tab('3d');
    await waitFor(`document.querySelector('[data-testid="element-list"] [data-voice-highlight="true"]')`,'actual cylinder element has Voice cue');
    await E.click('Tiếp tục');
    await E.click('Tạm dừng');await waitFor(`Boolean(document.querySelector('[data-voice-state="paused"]'))`,'paused');
    await E.click('Tiếp tục');await waitFor(`Boolean(document.querySelector('[data-voice-state="speaking"]'))`,'resumed');
    await E.set('[aria-label="Tốc độ giọng đọc"]','1.25');
    await E.click('Nghe lại');await waitFor(`Boolean(document.querySelector('[data-voice-state="speaking"]'))`,'replay');
    if(MODE==='ai'){
      await waitFor(`Boolean(document.querySelector('[data-edge-id][data-voice-highlight="true"]'))`,'actual dependency edge highlighted',20000);
    }else{
      for(let i=0;i<5 && !await evaluate(`!!document.querySelector('[data-edge-id][data-voice-highlight="true"]')`);i++){
        await evaluate(`window.__utterance.onend()`);await sleep(50);
      }
      assert.ok(await evaluate(`!!document.querySelector('[data-edge-id][data-voice-highlight="true"]')`));
      assert.ok(await evaluate(`__speechEvents.some(e=>e==='pause') && __speechEvents.some(e=>e==='resume')`),'browser fallback controls');
    }
    await evaluate(`document.querySelector('[data-testid="voice-controls"]').scrollIntoView({block:'nearest'})`);
    assert.ok(await evaluate(`(()=>{const r=document.querySelector('[data-testid="voice-controls"]').getBoundingClientRect();return r.top>=0 && r.bottom<=innerHeight;})()`),'playback controls visible');
    await screenshot('voice-controls.png');
    await E.click('Tạm dừng');
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    await evaluate(`document.querySelector('[data-testid="voice-controls"]').scrollIntoView({block:'nearest'})`);
    assert.ok(await evaluate(`document.scrollingElement.scrollWidth<=innerWidth`),'mobile Voice has no horizontal page overflow');
    assert.ok(await evaluate(`(()=>{const r=document.querySelector('[data-testid="voice-controls"]').getBoundingClientRect();return r.left>=0 && r.right<=innerWidth && r.top>=0 && r.bottom<=innerHeight;})()`),'mobile Voice controls remain visible');
    await screenshot('voice-controls-mobile.png');
    await send('Emulation.clearDeviceMetricsOverride');
    await E.click('Dừng đọc');assert.equal(await evaluate(`!!document.querySelector('[data-testid="voice-controls"]')`),false);
    assert.equal(await evaluate(`document.querySelectorAll('[data-voice-highlight="true"]').length`),0);
  });
  await step('Voice: provider failure uses browser fallback; unsupported VI keeps subtitles', async () => {
    await evaluate(`window.__realFetch=window.fetch;window.fetch=(url,...args)=>String(url)==='/api/voice/speech'?Promise.resolve(new Response(null,{status:503})):window.__realFetch(url,...args);`);
    await evaluate(`__e.q('[data-voice-listen="n4"]').click()`);
    await waitFor(`Boolean(document.querySelector('[data-voice-state="speaking"]'))`,'browser fallback');
    assert.ok(await evaluate(`!!document.querySelector('[data-testid="voice-controls"]').textContent.includes('trình duyệt')`));
    assert.equal(await evaluate(`window.__utterance.text`),await evaluate(`document.querySelector('[data-testid="voice-subtitle"]').textContent`));
    await E.click('Dừng đọc');
    const nativeCount=await evaluate(`window.__nativeSpeech?.getVoices().filter(v=>v.lang.startsWith('vi')).length??0`);
    if(nativeCount===0){
      await evaluate(`window.__mockSynth=window.speechSynthesis;Object.defineProperty(window,'speechSynthesis',{value:window.__nativeSpeech,configurable:true});__e.q('[data-voice-listen="n4"]').click()`);
      await waitFor(`Boolean(document.querySelector('[data-voice-state="unavailable"]'))`,'native headless has no VI voice');
      assert.ok(await evaluate(`!!document.querySelector('[data-testid="voice-subtitle"]').textContent.length>0`));
      await E.click('Dừng đọc');await evaluate(`Object.defineProperty(window,'speechSynthesis',{value:window.__mockSynth,configurable:true});void 0`);
    }
    await evaluate(`window.fetch=window.__realFetch`);
  });
  await step('Voice: D0 incorrect hypothesis, revision cancellation, selection cancellation and F8 isolation', async () => {
    await startProblem(PROBLEM_B);await confirmAll();await addRow('Em nghĩ bán kính gấp 3 lần nên thể tích cũng gấp 3 lần.');
await evaluate(`__e.q('[data-voice-listen="n1"]').click()`);
    await waitFor(`Boolean(document.querySelector('[data-voice-state="speaking"]'))`,'D0 speech');
    const text=await evaluate(`document.querySelector('[data-testid="voice-subtitle"]').textContent`);
    assert.ok(text.includes('?')&&!/9|chín|225π|1800π|bình phương/.test(text));
    await editRow(1,'Em nghĩ thể tích cũng gấp 3 lần.');
    assert.equal(await evaluate(`!!document.querySelector('[data-testid="voice-controls"]')`),false,'edit cancels');
    await evaluate(`__e.q('[data-voice-listen="n1"]').click()`);await waitFor(`Boolean(document.querySelector('[data-voice-state="speaking"]'))`,'restarted');
    await evaluate(`__e.q('[data-testid="rows"] > li[data-node-id="n1"] > div > button').click()`);
    assert.equal(await evaluate(`!!document.querySelector('[data-testid="voice-controls"]')`),false,'selection cancels');
    await evaluate(`__e.q('[data-voice-listen="n1"]').click()`);await waitFor(`Boolean(document.querySelector('[data-voice-state="speaking"]'))`,'before F8');
    await E.click('Tự kiểm tra');await waitFor(`Boolean(document.querySelector('[data-testid="independent-view"]'))`,'F8');
    assert.equal(await evaluate(`document.querySelectorAll('[data-voice-listen], [data-testid="voice-controls"], [data-voice-highlight="true"]').length`),0);
  });
  await step('Demo auth: logout clears Canvas, refresh/back cannot expose old session, login return URL and mobile', async () => {
    await E.click('Đăng xuất');await waitFor(`location.pathname==='/login'`,'logout redirects');
    assert.equal(await evaluate(`!!document.querySelector('[data-testid="independent-view"]')`),false);
    await send('Page.navigate',{url:BASE+'/canvas?demo=1'});await waitFor(`location.pathname==='/login' && document.querySelector('#demo-email')`,'guard after logout');
    await evaluate(HELPERS);await E.set('#demo-email','student@mathcoach.demo');await E.set('#demo-password','Demo@123456');
    if(MODE!=='ai')await evaluate(`document.querySelector('[data-testid="offline-demo"]').click()`);
    await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
    assert.ok(await evaluate(`document.scrollingElement.scrollWidth<=innerWidth`));await screenshot('demo-login-mobile.png');
    await E.click('Đăng nhập demo');await waitFor(`location.pathname==='/canvas'&&location.search==='?demo=1'&&document.querySelector('#problem-text')`,'return URL');
    await send('Emulation.clearDeviceMetricsOverride');
  });
  await step('Demo login and Voice controls are usable by keyboard with visible focus', async () => {
    await E.click('Đăng xuất');await waitFor(`location.pathname==='/login' && !!document.querySelector('#demo-email')`,'keyboard login');
    const key=async(k,code=k,text=k==='Enter'?'\r':undefined)=>{
      const vk={Tab:9,Enter:13,' ':32}[k]??0;
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:k,code,windowsVirtualKeyCode:vk,...(text?{text}:{})});
      await send('Input.dispatchKeyEvent',{type:'keyUp',key:k,code,windowsVirtualKeyCode:vk});
    };
    const tabTo=async(pred)=>{for(let i=0;i<160;i++){if(await evaluate(`(()=>{const a=document.activeElement;return !!a && (${pred});})()`))return;await key('Tab');}throw new Error('keyboard target not reached: '+pred);};
    await tabTo(`a.id==='demo-email'`);await send('Input.insertText',{text:'student@mathcoach.demo'});
    await key('Tab');assert.equal(await evaluate(`document.activeElement.id`),'demo-password');await send('Input.insertText',{text:'Demo@123456'});
    await key('Tab');await key(' ','Space',' ');assert.equal(await evaluate(`document.querySelector('#demo-password').type`),'text');
    await key(' ','Space',' ');await key('Tab');
    if(MODE!=='ai')await key(' ','Space',' ');
    await key('Tab');await key('Enter');await waitFor(`!!document.querySelector('#problem-text')`,'keyboard login returned');
    await startProblem(PROBLEM_A);await confirmAll();await addRow(ROWS_A[0]);
    await tabTo(`a.dataset.voiceListen==='n1'`);assert.equal(await evaluate(`document.activeElement.matches(':focus-visible')`),true);await key('Enter');
    await waitFor(`!!document.querySelector('[data-voice-state="speaking"]')`,'keyboard Listen');
    await tabTo(`a.textContent.trim()==='Tạm dừng'`);await key('Enter');await waitFor(`!!document.querySelector('[data-voice-state="paused"]')`,'keyboard pause');
    await tabTo(`a.textContent.trim()==='Tiếp tục'`);await key('Enter');await waitFor(`!!document.querySelector('[data-voice-state="speaking"]')`,'keyboard resume');
    await tabTo(`a.textContent.trim()==='Dừng đọc'`);await key('Enter');assert.equal(await evaluate(`!!document.querySelector('[data-testid="voice-controls"]')`),false);
  });
  console.log('Native Vietnamese voices available (headless; NOT an audio-quality test):',await evaluate(`window.__nativeSpeech?.getVoices().filter(v=>v.lang.startsWith('vi')).length ?? 0`));

  const relevant = pageErrors.filter((e) => !/fonts\.(googleapis|gstatic)|ERR_INTERNET_DISCONNECTED|Failed to load resource|GPU stall|WebGL/.test(e));
  assert.deepEqual(relevant, [], `page errors: ${relevant.join('\n')}`);
  console.log(`E2E passed: ${steps.length} steps, no page errors.`);
}

main()
  .catch((err) => {
    console.error('E2E FAILED:', err.stack ?? err.message);
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
