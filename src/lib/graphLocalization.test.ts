import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { runInThisContext } from 'node:vm';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { getLocalizedText, normalizeLanguage } from './localization.ts';

// Compile the actual app modules in memory: no extra test dependency or source changes.
const nativeRequire = createRequire(import.meta.url);
const cache = new Map<string, { exports: any }>();
function load(filename: string): any {
  let path = resolve(filename);
  if (existsSync(path) && statSync(path).isDirectory()) path = resolve(path, 'index.ts');
  if (!existsSync(path)) path = ['.ts', '.tsx', '.json'].map(ext => path + ext).find(existsSync) || resolve(path, 'index.ts');
  if (path.endsWith('.json')) return JSON.parse(readFileSync(path, 'utf8'));
  if (cache.has(path)) return cache.get(path)!.exports;
  const module = { exports: {} as any }; cache.set(path, module);
  const output = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  }}).outputText;
  const requireModule = (id: string): any => id.startsWith('@/') ? load('src/' + id.slice(2))
    : id.startsWith('.') ? load(resolve(dirname(path), id)) : nativeRequire(id);
  runInThisContext(`(function(require,module,exports){${output}\n})`, { filename: path })(requireModule, module, module.exports);
  return module.exports;
}
const { fieldsData } = load('src/data/fields/index.ts');
const { useFieldStore } = load('src/stores/fieldStore.ts');
const i18n = load('src/i18n/index.ts').default;
const chinese = /[\u3400-\u9fff]/u;

test('all catalog locale fields have complete Vietnamese translations', () => {
  let count = 0;
  function walk(value: any, path: string) {
    if (!value || typeof value !== 'object') return;
    if (typeof value.zh === 'string' && typeof value.en === 'string') {
      assert.equal(typeof value.vi, 'string', path);
      assert.ok(value.vi.trim() || !value.en.trim(), path);
      assert.ok(!chinese.test(value.vi), path); count++;
    }
    for (const [key, child] of Object.entries(value)) walk(child, `${path}.${key}`);
  }
  walk(fieldsData, 'catalog');
  assert.ok(count > 1700);
  for (const field of fieldsData) {
    for (const pioneer of field.pioneers) assert.ok(pioneer.nationalityNames.vi);
    for (const formula of field.formulas) assert.ok(!chinese.test(formula.latexLocales?.vi || formula.latex), formula.id);
  }
});

test('locale normalization and explicit Vietnamese fallback never leak Chinese', () => {
  assert.equal(normalizeLanguage('vi-VN'), 'vi');
  assert.equal(normalizeLanguage('zh-CN'), 'zh');
  assert.equal(normalizeLanguage('unsupported'), 'vi');
  const text = { zh: '一般拓扑学', en: 'General topology', vi: 'Tô pô đại cương' };
  assert.equal(getLocalizedText(text, 'vi-VN'), text.vi);
  assert.equal(getLocalizedText(text, 'zh'), text.zh);
  assert.equal(getLocalizedText({ ...text, vi: '' }, 'vi'), 'Nội dung tiếng Việt đang được cập nhật.');
  assert.equal(getLocalizedText({ ...text, vi: text.zh }, 'vi'), 'Nội dung tiếng Việt đang được cập nhật.');
  assert.equal(getLocalizedText({ zh: text.zh, en: 'English' }, 'en'), 'English');
});

test('default language, store, programmatic switching and Vietnamese search agree', async () => {
  assert.equal(i18n.language, 'vi'); assert.equal(useFieldStore.getState().language, 'vi');
  assert.ok(useFieldStore.getState().searchFields('tô pô đại cương').some((f: any) => f.id === 'general-topology'));
  await i18n.changeLanguage('en'); assert.equal(useFieldStore.getState().language, 'en');
  useFieldStore.getState().setLanguage('zh'); assert.equal(i18n.language, 'zh');
  await i18n.changeLanguage('vi-VN'); assert.equal(useFieldStore.getState().language, 'vi');
  await i18n.changeLanguage('vi');
});

test('representative detail and tooltip renderings from every category contain Vietnamese, no Chinese', () => {
  // Feed the SSR components the current store snapshot (Zustand SSR otherwise reads initial state).
  load('src/stores/fieldStore.ts').useFieldStore = Object.assign(
    (selector?: (state: any) => any) => selector ? selector(useFieldStore.getState()) : useFieldStore.getState(),
    useFieldStore,
  );
  const DetailPanel = load('src/components/detail/DetailPanel.tsx').default;
  const Tooltip = load('src/components/ui/Tooltip.tsx').default;
  const { getFilteredFields } = load('src/stores/fieldStore.ts');
  const { FILTER_LABELS } = load('src/types/index.ts');
  for (const category of Object.keys(FILTER_LABELS)) {
    const field = getFilteredFields(fieldsData, category)[0]; assert.ok(field, category);
    useFieldStore.setState({ selectedField: field, hoveredField: field, isDetailOpen: true, language: 'vi' });
    const detail = renderToStaticMarkup(React.createElement(DetailPanel));
    const tooltip = renderToStaticMarkup(React.createElement(Tooltip));
    assert.ok(detail.includes(field.names.vi), field.id);
    assert.ok(tooltip.includes(field.names.vi), field.id);
    assert.ok(!chinese.test(detail + tooltip), field.id);
  }
  useFieldStore.setState({ selectedField: null, hoveredField: null, isDetailOpen: false });
});

test('Vietnamese UI resources cover every English key without Chinese', () => {
  const vi = load('src/i18n/vi.json'); const en = load('src/i18n/en.json');
  function walk(source: any, localized: any, path: string) {
    for (const [key, value] of Object.entries(source)) {
      assert.ok(localized[key] !== undefined, path + key);
      if (typeof value === 'object') walk(value, localized[key], path + key + '.');
      else assert.ok(!chinese.test(localized[key]), path + key);
    }
  }
  walk(en, vi, '');
});


test('all graph tags have a Vietnamese concept or keyword label', () => {
  const vi = load('src/i18n/vi.json');
  for (const field of fieldsData) for (const tag of [...field.tags, ...field.basics.tags]) {
    assert.ok(fieldsData.some((f: any) => f.id === tag && f.names.vi) || vi.tags[tag], `${field.id}: ${tag}`);
  }
});
