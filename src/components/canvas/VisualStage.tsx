import { lazy, Suspense, useEffect } from 'react';
import { useVoice } from '@/stores/voiceStore';
import { Lock } from 'lucide-react';
import { ComparisonTableView, FormulaView, ScalingChartView } from '@/components/canvas/Visuals';
import { primaryVisual } from '@/lib/canvas/presentation';
import { EPISTEMIC_UI } from '@/data/canvas/copy';
import { displaySymbol } from '@/lib/reasoning/expr';
import type { VisualSpec } from '@/lib/reasoning/types';
import { useCanvas } from '@/stores/reasoningSessionStore';

const CylinderScene = lazy(() => import('@/components/canvas/CylinderScene'));


export default function VisualStage() {
  const { specs, selected, select, turn, ctx, pending, visualTab: tab, setVisualTab: setTab } = useCanvas();
  const voiceCue = useVoice(s => s.cue);
  const highlighted = [...selected, ...(voiceCue?.nodeIds ?? [])];
  const find = (r: VisualSpec['renderer']) => specs.find((s) => s.renderer === r);
  const graph = find('reasoning_graph');
  const d3 = find('cylinder_3d');
  const chart = find('scaling_chart');
  const table = find('comparison_table');
  const formula = find('formula_highlight');
  const exp = ctx?.experiment?.active ? ctx.experiment : null;
  useEffect(() => {
    if (exp) setTab('3d');
  }, [exp?.active, setTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectNodes = (ids: string[]) => select(ids.filter((id) => /^n\d+|^f1-/.test(id)));
  const selectElement = (spec: VisualSpec, elementId: string) => {
    const el = spec.elements.find((e) => e.elementId === elementId);
    if (el) selectNodes(el.sourceNodeIds);
  };
  const tabs: { key: typeof tab; label: string; show: boolean }[] = [
    { key: '3d', label: 'Hình 3D', show: !!d3 },
    { key: 'chart', label: 'Biểu đồ', show: !!chart },
  ];
  const current = primaryVisual(specs, tab);
  const availableTabs = tabs.filter(t => t.show);
  const slider = d3?.interaction.slider;

  return (
    <section aria-label="Hình trực quan toán học" data-testid="learner-visuals" className="min-w-0 space-y-3">
      {availableTabs.length > 1 ? <div role="tablist" aria-label="Chọn hình" className="flex gap-1">
        {availableTabs.map((t) => (
          <button key={t.key} role="tab" aria-selected={current === t.key} onClick={() => setTab(t.key)} data-tab={t.key}
            className={`rounded-lg px-3 py-1 text-xs ${current === t.key ? 'bg-indigo-500 font-semibold text-white' : 'bg-slate-800 text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div> : <h2 className="text-sm font-semibold text-slate-200">{current === '3d' ? 'Hình 3D' : current === 'chart' ? 'Biểu đồ' : 'Thông tin trực quan'}</h2>}
      {graph?.unsupported && <p role="status" className="rounded-lg border border-amber-400/40 bg-amber-500/10 p-2 text-xs text-amber-100">Không có hình cho yêu cầu “{graph.unsupported.request}”. {graph.unsupported.reason}</p>}

      <div role={availableTabs.length > 1 ? "tabpanel" : undefined}>
        {!current && <p role="status" className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300" data-testid="visual-fallback">Chưa có đủ kích thước để dựng hình 3D chính xác. Em vẫn có thể tiếp tục bằng lời giải thích ở từng bước, công thức và bảng khi có.</p>}
        {current === '3d' && d3 && (
          <Suspense fallback={<div role="status" className="h-[340px] rounded-xl border border-white/10 p-4 text-sm text-slate-400">Đang tải mô hình 3D…</div>}>
            <CylinderScene spec={d3} selected={highlighted} onSelectElement={(id) => selectElement(d3, id)} />
          </Suspense>
        )}
        {current === 'chart' && chart && <ScalingChartView spec={chart} selected={highlighted} onSelectNodes={selectNodes} />}
      </div>

      {current === '3d' && d3 && (
        <details className="rounded-lg border border-white/10 bg-slate-900/60 p-2 text-xs text-slate-300" open>
          <summary className="cursor-pointer">Các phần tử trên hình (chọn để xem bước nguồn)</summary>
          <ul className="mt-1 flex flex-wrap gap-1" data-testid="element-list">
            {d3.elements.map((e) => {
              const ui = EPISTEMIC_UI[e.epistemic];
              return (
                <li key={e.elementId}>
                  <button type="button" data-element-id={e.elementId} data-voice-highlight={voiceCue?.elementIds.includes(e.elementId) || undefined} onClick={() => selectElement(d3, e.elementId)} className={`rounded border px-1.5 py-0.5 ${voiceCue?.elementIds.includes(e.elementId) ? "ring-2 ring-cyan-300" : ""} ${ui.dash ? 'border-dashed' : ''}`} style={{ color: ui.color, borderColor: ui.color }}>
                    {ui.icon} {e.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {exp && slider && (
        <div className="rounded-xl border border-cyan-400/40 bg-cyan-500/5 p-3" data-testid="experiment-panel">
          <label htmlFor="exp-slider" className="flex items-center justify-between text-sm text-slate-200">
            <span>Thử nghiệm: {exp.symbol === 'r2' ? 'bán kính' : 'chiều cao'} của hình so sánh</span>
            <span className="font-mono text-cyan-300">{String(exp.value).replace('.', ',')} {ctx?.problemSpec.unit ?? ''}</span>
          </label>
          <input
            id="exp-slider" type="range" min={slider.min} max={slider.max} step={slider.step} value={exp.value}
            aria-valuetext={`${String(exp.value).replace('.', ',')} ${ctx?.problemSpec.unit ?? ''}`}
            onChange={(e) => void turn({ type: 'experiment', event: 'set', value: Number(e.target.value) }, { localOnly: true })}
            className="mt-2 w-full accent-cyan-400"
          />
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <Lock className="h-3 w-3" /> {displaySymbol(exp.symbol === 'r2' ? 'h2' : 'r2')} bị khóa: giữ một đại lượng cố định để so sánh công bằng.
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={pending} onClick={() => void turn({ type: 'experiment', event: 'start', symbol: exp.symbol === 'r2' ? 'h2' : 'r2', nodeId: exp.hypothesisNodeId ?? undefined })} className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-200">Đổi biến thử nghiệm</button>
            <button type="button" disabled={pending} onClick={() => void turn({ type: 'experiment', event: 'end' })} className="rounded-lg bg-cyan-600 px-2 py-1 text-xs font-semibold text-white">Kết thúc thử nghiệm</button>
          </div>
        </div>
      )}

      {table && <ComparisonTableView spec={table} selected={highlighted} onSelectNodes={selectNodes} />}
      {formula && <FormulaView spec={formula} />}
    </section>
  );
}
