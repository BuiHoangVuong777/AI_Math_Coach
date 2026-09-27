import { useVoice } from '@/stores/voiceStore';
import { useMemo, type KeyboardEvent } from 'react';
import 'katex/dist/katex.min.css';
import { KaTeX } from '@/components/ui/KaTeX';
import { EPISTEMIC_UI, STATUS_UI } from '@/data/canvas/copy';
import type { ChartParams, FormulaParams, GraphParams, TableParams, VisualSpec } from '@/lib/reasoning/types';

interface SelectProps {
  selected: string[];
  onSelectNodes: (ids: string[]) => void;
}

const onKey = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};

// ------------------------------------------------------------------ comparison table

export function ComparisonTableView({ spec, selected, onSelectNodes }: { spec: VisualSpec } & SelectProps) {
  const p = spec.params as TableParams;
  const sel = new Set(selected);
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-3" data-testid="comparison-table">
      <table className="w-full text-xs text-slate-200 sm:text-sm">
        <caption className="pb-1 text-left text-xs text-slate-400">{p.mode === 'experiment' ? 'Giá trị tại tham số em đang thử (không có cột hệ số)' : 'Giá trị do em viết (kèm trạng thái) và dữ kiện của đề'}</caption>
        <thead className="text-left text-slate-400">
          <tr>
            <th className="font-normal">Đại lượng</th>
            {p.columns.map((c) => <th key={c.index} className="font-normal">{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {p.rows.map((r) => (
            <tr key={r.label} className="border-t border-white/5">
              <th scope="row" className="py-1 pr-2 text-left font-medium text-slate-300">{r.label}{r.unit ? ` (${r.unit})` : ''}</th>
              {r.cells.map((c, i) => {
                if (!c) return <td key={i} className="text-slate-500">?</td>;
                const ui = EPISTEMIC_UI[c.epistemic];
                const isSel = c.sourceNodeIds.some((x) => sel.has(x));
                const nodeIds = c.sourceNodeIds.filter((x) => /^n\d+|^f1-/.test(x));
                return (
                  <td key={i} className="py-1">
                    <button
                      type="button"
                      data-element-id={c.elementId}
                      data-epistemic={c.epistemic}
                      disabled={!nodeIds.length}
                      onClick={() => onSelectNodes(nodeIds)}
                      className={`rounded px-1 ${ui.dash ? 'border border-dashed' : ''} ${isSel ? 'ring-2 ring-white' : ''}`}
                      style={{ color: ui.color, borderColor: ui.color }}
                    >
                      {ui.icon} {c.text}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ------------------------------------------------------------------ scaling chart

export function ScalingChartView({ spec, selected, onSelectNodes }: { spec: VisualSpec } & SelectProps) {
  const p = spec.params as ChartParams;
  const W = 440;
  const H = 240;
  const pad = { l: 56, r: 12, t: 12, b: 34 };
  const f = (exp: number, x: number) => p.reference.y * (x / p.reference.x) ** exp;
  const yMax = Math.max(p.reference.y, ...p.points.map((q) => q.y), ...p.curves.map((c) => f(c.exponent, p.xMax))) * 1.08;
  const sx = (x: number) => pad.l + (x / p.xMax) * (W - pad.l - pad.r);
  const sy = (y: number) => H - pad.b - (y / yMax) * (H - pad.t - pad.b);
  const sel = new Set(selected);
  const path = (exp: number) => Array.from({ length: 41 }, (_, i) => (p.xMax * i) / 40).map((x, i) => `${i ? 'L' : 'M'} ${sx(x).toFixed(1)} ${sy(Math.min(f(exp, x), yMax)).toFixed(1)}`).join(' ');
  return (
    <figure className="rounded-xl border border-white/10 bg-slate-900/60 p-3" data-testid="scaling-chart">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={spec.fallback.content}>
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#475569" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="#475569" />
        <text x={W - pad.r} y={H - 8} fill="#94a3b8" fontSize={10} textAnchor="end">{p.axis === 'r' ? 'bán kính' : 'chiều cao'} ({p.unit ?? ''})</text>
        <text x={6} y={pad.t + 8} fill="#94a3b8" fontSize={10}>V (bội của π)</text>
        {p.curves.map((c) => {
          const ui = EPISTEMIC_UI[c.epistemic];
          const hl = c.sourceNodeIds.some((x) => sel.has(x));
          return <path key={c.elementId} d={path(c.exponent)} fill="none" stroke={ui.color} strokeWidth={hl ? 3.5 : 2} strokeDasharray={ui.dash ?? undefined} data-element-id={c.elementId} onClick={() => onSelectNodes(c.sourceNodeIds)} className="cursor-pointer" />;
        })}
        <circle cx={sx(p.reference.x)} cy={sy(p.reference.y)} r={4} fill="#cbd5e1" />
        {p.points.map((q) => <circle key={q.elementId} cx={sx(q.x)} cy={sy(q.y)} r={5} fill="#67e8f9" stroke="#0e7490" data-element-id={q.elementId}><title>{q.label}</title></circle>)}
      </svg>
      <figcaption className="mt-2 space-y-1 text-xs">
        {p.curves.map((c) => {
          const ui = EPISTEMIC_UI[c.epistemic];
          return (
            <button key={c.elementId} type="button" onClick={() => onSelectNodes(c.sourceNodeIds)} className="mr-2 inline-flex items-center gap-1.5" style={{ color: ui.color }}>
              <svg width="26" height="6" aria-hidden><line x1="0" y1="3" x2="26" y2="3" stroke={ui.color} strokeWidth="2" strokeDasharray={ui.dash ?? undefined} /></svg>
              {ui.icon} {c.label}
            </button>
          );
        })}
        {p.points.length > 0 && <p className="text-cyan-300">⚗ Điểm đã thử: {p.points.map((q) => q.label).join('; ')}</p>}
        <p className="text-slate-500">Biểu đồ chỉ vẽ giá trị, không ghi sẵn hệ số — em tự so sánh nhé.</p>
      </figcaption>
    </figure>
  );
}

// ------------------------------------------------------------------ formula highlight

export function FormulaView({ spec }: { spec: VisualSpec }) {
  const cue = useVoice(s => s.cue);
  const active = spec.elements.some(e => cue?.elementIds.includes(e.elementId));
  const p = spec.params as FormulaParams;
  // LaTeX comes only from the approved rule catalog; highlighted parts use \textcolor (no trust needed).
  let latex = p.latex;
  for (const h of p.highlight) latex = latex.replace(h, `\\textcolor{#f97316}{${h}}`);
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-slate-100" data-testid="formula-highlight" data-voice-highlight={active || undefined} style={active ? {outline:"2px solid #67e8f9"} : undefined}>
      <p className="mb-1 text-xs text-slate-400">{spec.elements[0]?.label} — liên quan đến dòng đang chọn</p>
      <KaTeX latex={latex} trust={false} />
    </div>
  );
}
