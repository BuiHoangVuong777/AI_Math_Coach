#!/usr/bin/env node
/**
 * Vietnamese graph E2E using Chrome DevTools Protocol and Node's WebSocket.
 * Run a Vite dev server, then npm run test:e2e:graph.
 * Requires Node >=22 and Chrome; E2E_BASE_URL defaults to http://localhost:4180.
 * CHROME_PATH overrides the Chrome executable. No additional dependencies.
 * Checks real pointer clicks/hover in every filter group, all node-detail tabs,
 * Vietnamese search, VI/EN/ZH cycling and document language.
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:4180';
const CHROME = process.env.CHROME_PATH ?? 'google-chrome';
const PORT = 9334;

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

async function main() {
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page'); }
    catch { await sleep(200); }
  }
  assert.ok(target, 'Chrome unavailable');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise(r => ws.addEventListener('open', r, {once:true}));
  ws.addEventListener('message', ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const {resolve,reject} = pending.get(msg.id); pending.delete(msg.id);
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
    } else if (msg.method === 'Runtime.exceptionThrown') pageErrors.push(msg.params.exceptionDetails.exception?.description || 'exception');
  });
  await send('Runtime.enable'); await send('Page.enable');
  // Use an existing sphere style to keep software-rendered E2E economical.
  // This changes only the isolated Chrome profile, never the app or user settings.
  await send('Page.addScriptToEvaluateOnNewDocument', {source: `performance.setResourceTimingBufferSize(1000);localStorage.setItem('math-universe-sphere-config', JSON.stringify({variantId:'minimal',params:{color:'#00ffff',radius:1,opacity:0.4,metalness:0.1,roughness:0.3,emissiveIntensity:0.3,clearcoat:0.5,latLines:10,lonLines:16,lineOpacity:0.35,particleCount:40,particleSize:0.04,particleOpacity:0.3,autoRotate:true}}))`});
  await send('Page.navigate', {url: BASE + '/'});
  await waitFor(`!!document.querySelector('a[href="/canvas"]')`, 'home loaded', 30000);
  await evaluate(HELPERS);
  // Dev-server modules are the app's actual instances; used for exhaustive catalog checks.
  await evaluate(`(async()=>{
    // Vite may append HMR timestamps: import the exact module URL the page loaded.
    const loaded = name => performance.getEntriesByType('resource').find(e => e.name.includes(name))?.name || name;
    window.graphStore=(await import(loaded('/src/stores/fieldStore.ts'))).useFieldStore;
    window.graphTypes=await import(loaded('/src/types/index.ts'));
    window.graphI18n=(await import(loaded('/src/i18n/index.ts'))).default;
    window.graphFiber=await import('/node_modules/.vite/deps/@react-three_fiber.js');
    window.graphThree=await import('/node_modules/.vite/deps/three.js');
  })()`);
  assert.equal(await evaluate('document.documentElement.lang'), 'vi');
  const categories = await evaluate('Object.keys(graphTypes.FILTER_LABELS)');
  for (const category of categories) {
    await evaluate(`graphStore.getState().setDetailOpen(false);graphStore.getState().setFilterMode(${JSON.stringify(category)});graphStore.getState().setAutoRotating(false)`);
    await evaluate(`(()=>{const state=[...graphFiber._roots.values()][0].store.getState();state.camera.position.set(0,0,75);state.camera.lookAt(0,0,0);state.camera.updateMatrixWorld(true)})()`);
    await waitFor(`(()=>{let count=0;[...graphFiber._roots.values()][0].store.getState().scene.traverse(o=>{if(o.__r3f?.handlers?.onClick)count++});return count>0})()`, '3D nodes mounted');
    await sleep(2000);
    const points = await evaluate(`(()=>{
      const state=[...graphFiber._roots.values()][0].store.getState();
      const canvas=state.gl.domElement.getBoundingClientRect();
      const groups=[]; state.scene.updateMatrixWorld(true);
      state.scene.traverse(o=>{if(o.__r3f?.handlers?.onClick && o.type==='Group'){
        const v=o.getWorldPosition(new graphThree.Vector3()).project(state.camera);
        if(v.z>-1&&v.z<1) groups.push({x:canvas.x+(v.x+1)*canvas.width/2,y:canvas.y+(1-v.y)*canvas.height/2});
      }});return groups.filter(p=>p.x>80&&p.x<innerWidth-80&&p.y>150&&p.y<innerHeight-160);
    })()`);
    let clicked=false;
    for(const point of points.flatMap(p => [[0,0],[3,0],[-3,0],[0,3],[0,-3]].map(([x,y])=>({x:p.x+x,y:p.y+y})))) {
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await sleep(40);
      if(!await evaluate('!!graphStore.getState().hoveredField')) continue;
      const tip=await evaluate('document.body.innerText');assert.ok(!/[\u3400-\u9fff]/u.test(tip),category+' tooltip');
      await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
      await sleep(150);
      if(await evaluate('graphStore.getState().isDetailOpen')){clicked=true;break}
    }
    assert.ok(clicked, 'actual 3D node click: '+category);
    assert.ok(!/[\u3400-\u9fff]/u.test(await js.text()),category+' detail');
    console.log('✓ 3D hover/click '+category);
  }
  await evaluate(`(()=>{const state=[...graphFiber._roots.values()][0].store.getState();state.setFrameloop('demand')})()`);
  // Every catalog node, every visible tab, using the same selected-node state as a click.
  const nodes = await evaluate('graphStore.getState().fields.map(f=>({id:f.id,name:f.names.vi}))');
  const tabs=[['basics','Thông tin cơ bản'],['formulas','Công thức chính'],['pioneers','Nhà toán học tiêu biểu'],['history','Lịch sử'],['references','Tài liệu tham khảo']];
  for(const node of nodes) {
    await evaluate(`graphStore.getState().setSelectedField(graphStore.getState().fields.find(f=>f.id===${JSON.stringify(node.id)}))`);
    await sleep(20);
    for(const [key,tab] of tabs){
      await js.click(tab);
      await waitFor(`document.querySelector('[data-detail-tab]')?.dataset.detailTab===${JSON.stringify(key)}`,node.id+' '+key);
      await sleep(25);
      const text=await js.text();
      assert.ok(!/[\u3400-\u9fff]/u.test(text),node.id+' '+tab+' leaked Chinese');
      assert.ok(text.includes(node.name),node.id+' translated title');
    }
    if ((nodes.indexOf(node)+1)%25===0) console.log('✓ detail tabs checked for '+(nodes.indexOf(node)+1)+' nodes');
  }
  console.log('✓ '+nodes.length+' nodes × 5 detail tabs');
  await evaluate('graphStore.getState().setDetailOpen(false);graphStore.getState().setFilterMode("all")');
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'/',text:'/'});
  await waitFor(`!!document.querySelector('input[placeholder]')`,'search input');
  await js.set('input[placeholder]','Tô pô đại cương');
  await waitFor(`document.body.innerText.includes('Tô pô đại cương (tô pô tập điểm)')`,'Vietnamese search result');
  await js.click('Tô pô đại cương');
  await waitFor(`graphStore.getState().selectedField?.id==='general-topology'`,'search selection');
  assert.ok(!/[\u3400-\u9fff]/u.test(await js.text()));
  await evaluate(`graphStore.getState().setDetailOpen(false);graphStore.getState().setHoveredField(null)`);
  // Use the real switch button; document language and store must follow VI → EN → ZH → VI.
  for(const lang of ['en','zh','vi']){
    await evaluate(`document.querySelector('button[aria-label="'+graphI18n.t('app.changeLanguage')+'"]').click()`);
    await waitFor(`document.documentElement.lang===${JSON.stringify(lang)} && graphStore.getState().language===${JSON.stringify(lang)}`,'switch '+lang);
  }
  assert.ok(!/[\u3400-\u9fff]/u.test(await js.text()));
  assert.deepEqual(pageErrors,[]);
  console.log('✓ search, locale cycling, document lang; no page exceptions');
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
