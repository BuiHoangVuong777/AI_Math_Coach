import { RowsPanel } from '@/components/canvas/RowsPanel';
import { STATUS_UI } from '@/data/canvas/copy';
import { LIMITATION } from '@/data/canvas/copy';
import { buildSummary } from '@/lib/reasoning/summary';
import { useCanvas } from '@/stores/reasoningSessionStore';

/** F8: only the analogous problem, the learner's rows and a internal graph — no visible map, coach, hints, visuals or main history. */
export function IndependentView() {
  const { ctx, turn, pending } = useCanvas();
  const ind = ctx?.independent;
  if (!ctx || !ind) return null;
  return (
    <div className="mx-auto max-w-3xl space-y-3" data-testid="independent-view">
      <section className="rounded-xl border border-emerald-400/40 bg-emerald-500/5 p-4">
        <h2 className="text-base font-semibold text-white">Tự kiểm tra — bài tương tự (không có gợi ý)</h2>
        <p className="mt-1 text-sm text-slate-200" data-testid="analog-text">{ind.problemSpec.text}</p>
        <p className="mt-1 text-xs text-slate-400">Hệ thống chỉ đánh giá sau khi em nộp bài. Em được gửi một lần.</p>
      </section>
      <RowsPanel graph={ind.graph} neutral />
      <button
        type="button"
        disabled={pending}
        onClick={() => window.confirm('Nộp bài? Sau khi nộp em không sửa được nữa.') && void turn({ type: 'submit_independent' })}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
      >
        Nộp bài
      </button>
    </div>
  );
}

export function SummaryView() {
  const { ctx, turn, pending, reset } = useCanvas();
  if (!ctx) return null;
  const items = buildSummary(ctx.graph, ctx.independent, ctx.problemSpec.text);
  return (
    <div className="mx-auto max-w-4xl space-y-3" data-testid="summary-view">
      <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold text-white">Tóm tắt bằng chứng của phiên</h2>
        <dl className="mt-2 space-y-3">
          {items.map((it) => (
            <div key={it.key} data-summary={it.key}>
              <dt className="text-sm font-semibold text-slate-200">
                {it.label}
                {it.demo && <span className="ml-2 rounded bg-amber-500/20 px-1 text-xs text-amber-200">có dữ liệu minh họa</span>}
                {it.sourceSeqs.length > 0 && <span className="ml-2 text-[11px] font-normal text-slate-500">nguồn: sự kiện #{it.sourceSeqs.slice(0, 8).join(', #')}{it.sourceSeqs.length > 8 ? '…' : ''}</span>}
              </dt>
              <dd className="mt-0.5 text-sm text-slate-300">
                {it.missing ? <em className="text-slate-500">chưa có bằng chứng</em> : <ul className="list-disc pl-5">{it.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 rounded-lg bg-slate-800 p-2 text-sm text-slate-200" data-testid="limitation">{LIMITATION}</p>
        {ctx.independent?.evaluationError && (
          <button type="button" disabled={pending} onClick={() => void turn({ type: 'retry_independent_evaluation' })} className="mt-2 rounded-lg bg-slate-700 px-3 py-1 text-sm text-white">Đánh giá lại</button>
        )}
      </section>
      {ctx.independent && <section aria-label="Bài tương tự sau khi nộp"><h3 className="mb-1 text-sm text-slate-300">Bài tương tự (sau khi nộp)</h3><RowsPanelReadOnly /></section>}
      <button type="button" onClick={reset} className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white">Phiên mới</button>
    </div>
  );
}

function RowsPanelReadOnly() {
  const ctx = useCanvas((s) => s.ctx);
  const rows = Object.values(ctx?.independent?.graph.nodes ?? {}).filter((n) => n.rowIndex > 0).sort((a, b) => a.rowIndex - b.rowIndex);
  return (
    <ol className="mb-2 space-y-1 text-sm" data-testid="independent-rows">
      {rows.map((n) => <li key={n.id} data-status={n.validation?.status} className="rounded bg-slate-900/60 px-2 py-1 text-slate-200">{n.rowIndex}. {n.originalText} — <span className="text-slate-400">{n.validation ? STATUS_UI[n.validation.status].label : 'Chưa có đánh giá'}</span></li>)}
    </ol>
  );
}
