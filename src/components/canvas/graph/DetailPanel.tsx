import { useVoice } from '@/stores/voiceStore';
import { VoiceListen } from '@/components/voice/VoiceControls';
import { X } from 'lucide-react';
import { KaTeX } from '@/components/ui/KaTeX';
import { MISCONCEPTION_TEXT } from '@/data/canvas/copy';
import { RULES } from '@/lib/reasoning/rules';
import type { GraphEdgeViewModel, GraphNodeViewModel, ReasoningGraph, VisualSpec } from '@/lib/reasoning/types';
import { useCanvas, type VisualTab } from '@/stores/reasoningSessionStore';

interface Props {
  nodes: GraphNodeViewModel[];
  edges: GraphEdgeViewModel[];
  graph: ReasoningGraph;
  specs: VisualSpec[];
  neutral: boolean;
  onClose: () => void;
  presentation?: 'graph' | 'row';
}

const RENDERER_TAB: Record<string, VisualTab | null> = { cylinder_3d: '3d', scaling_chart: 'chart', comparison_table: null, formula_highlight: null, reasoning_graph: 'graph' };
const rowLabel = (n?: GraphNodeViewModel) => (!n ? '?' : n.row === null ? 'dữ kiện đề' : `bước ${n.row === 0 ? 'F1' : n.row}`);

function Section({ title, children, testId }: { title: string; children: React.ReactNode; testId?: string }) {
  return (
    <section className="border-t border-white/10 pt-2" data-section={testId}>
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{title}</h4>
      <div className="mt-0.5 text-sm text-slate-100">{children}</div>
    </section>
  );
}
const None = () => <span className="text-slate-500">không có</span>;

/** Level 2 (§10.8.1): opened on selection; everything shown is already disclosure-checked by the builder. */
export default function DetailPanel({ nodes, edges, graph, specs, neutral, onClose, presentation = 'graph' }: Props) {
  const { selected, selectedEdgeId, select, selectEdge, turn, pending, ctx, setVisualTab, setEditing, staleIds } = useCanvas();
  const voiceCue = useVoice(s => s.cue);
  const rowPresentation = presentation === 'row';
  const focusNode = (id: string) => {
    requestAnimationFrame(() => {
      const selector = `button[data-node-id="${CSS.escape(id)}"]`;
      const row = document.querySelector<HTMLButtonElement>(`[data-testid="rows"] > li[data-node-id="${CSS.escape(id)}"] button[aria-label^="Chọn bước"]`);
      const card = rowPresentation ? row : document.querySelector<HTMLButtonElement>(`[data-testid="reasoning-graph"] ${selector}`)
        ?? document.querySelector<HTMLButtonElement>(`[data-testid="reasoning-graph-list"] ${selector}`);
      card?.focus();
      card?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    });
  };
  const goToNode = (id: string) => { if (rowPresentation && byId.get(id)?.row === null) return; select([id]); focusNode(id); };
  const close = () => { const id = selected[0]; onClose(); if (id) focusNode(id); };
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const edge = selectedEdgeId ? edges.find((e) => e.edgeId === selectedEdgeId) : null;
  const nv = !edge && selected[0] ? byId.get(selected[0]) : null;
  if (!edge && !nv) return null;
  const shell = (title: string, body: React.ReactNode) => (
    <div
      className={rowPresentation ? "mt-2 rounded-xl border border-white/15 bg-slate-950 p-3" : "fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-white/15 bg-slate-950 p-3 shadow-2xl lg:static lg:z-auto lg:max-h-none lg:rounded-xl lg:shadow-none"}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
      }}
      role="region"
      aria-label={title}
      data-testid={rowPresentation ? "row-detail" : "graph-detail"}
    >
      <div className="mb-2 flex items-center gap-2">
        <h3 className="flex-1 text-sm font-semibold text-white">{title}</h3>
        <button type="button" onClick={close} aria-label="Đóng chi tiết" className="rounded p-1 text-slate-400 hover:bg-slate-800"><X className="h-4 w-4" /></button>
      </div>
      <div className="space-y-2">{body}</div>
    </div>
  );

  if (edge) {
    const from = byId.get(edge.from);
    const to = byId.get(edge.to);
    return shell(`Liên kết: ${rowLabel(from)} → ${rowLabel(to)}`, (
      <>
        <p className="text-sm text-slate-100" data-testid="edge-explanation">{edge.status === 'broken' ? '⚠ ' : ''}{edge.explanation}</p>
        <p className="text-xs text-slate-400">Trạng thái: {edge.status === 'established' ? 'đã xác lập' : edge.status === 'provisional' ? 'chưa xác nhận' : 'bị lỗi thời (nguồn đã đổi)'}</p>
        <div className="flex flex-wrap gap-1">
          {[from, to].filter(Boolean).map((n) => (
            <button key={n!.nodeId} type="button" onClick={() => goToNode(n!.nodeId)} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-100">Tới {rowLabel(n)}</button>
          ))}
        </div>
        {edge.ruleIds.length > 0 && <Section title="Quy tắc liên quan">{edge.ruleIds.map((r) => RULES[r]?.name ?? r).join('; ')}</Section>}
      </>
    ));
  }

  const n = nv!;
  const node = graph.nodes[n.nodeId];
  const e = n.explanation;
  const stale = staleIds.includes(n.nodeId);
  const inEdges = edges.filter((x) => x.to === n.nodeId);
  const linked = specs.filter(s => !rowPresentation || s.renderer !== 'reasoning_graph').flatMap((s) => s.elements.filter((el) => n.linkedElementIds.includes(el.elementId)).map((el) => ({ spec: s, el })));
  const canInvestigate = !neutral && ctx?.phase === 'reasoning' && (n.isHypothesis || node?.interpretation.normalized?.kind === 'scaling') && (ctx?.problemSpec.cylinders.length ?? 0) > 1;
  const learner = n.row !== null;
  return shell(`Chi tiết ${rowLabel(n)}`, (
    <>
      {!neutral && !stale && e && <VoiceListen nodeId={n.nodeId} disabled={pending} />}
      <Section title="Em viết" testId="learner">
        <p className="break-words" data-testid="detail-learner-text">{n.learnerText}</p>
      </Section>
      <Section title="Hệ thống hiểu" testId="interpretation">
        <p className="break-words">{n.interpretedMeaning || '—'}</p>
        <p className="text-xs text-slate-400">{n.interpretationProvenance === 'llm_interpretation' ? 'AI đọc — đã kiểm tra bám chữ em viết' : n.interpretationProvenance === 'problem_given' ? 'Dữ kiện đề em đã xác nhận' : n.interpretationProvenance === 'learner_form' ? 'Em khai báo' : 'Đọc bằng quy tắc'}</p>
        {n.notation && !neutral && <KaTeX latex={n.notation} displayMode={false} trust={false} />}
      </Section>
      <Section title="Đã kiểm chứng" testId="verification">
        {neutral ? (
          <p className="text-slate-300">Bài tự kiểm tra — kết quả chỉ hiển thị sau khi em nộp bài.</p>
        ) : stale ? (
          <p className="text-slate-300">⟳ Đang kiểm tra lại…</p>
        ) : !learner ? (
          <p className="text-slate-300">Dữ kiện của đề — em đã xác nhận ở bước đọc đề.</p>
        ) : e ? (
          <>
            <p className="font-semibold" data-testid="detail-status">{n.statusBadge.icon} {n.statusBadge.label}</p>
            <p data-testid="detail-why">{e.whyStatus}</p>
            <p className="mt-1" data-testid="detail-detailed">{e.explanationDetailed ?? <span className="text-slate-400">Chi tiết sẽ mở khi em xin gợi ý.</span>}</p>
            {n.possibleMisconceptions.map((m) => <p key={m} className="text-xs text-rose-200">Hiểu lầm {MISCONCEPTION_TEXT[m] ?? m} (chỉ là khả năng).</p>)}
            <p className={rowPresentation ? "sr-only" : "text-[10px] text-slate-500"} data-testid="detail-trace">{rowPresentation ? `Mức gợi ý D${e.disclosureLevel}` : `mức D${e.disclosureLevel} · phiên bản bước ${n.nodeRevision} · đồ thị v${n.graphVersion}`}</p>
          </>
        ) : <None />}
      </Section>
      <Section title="Quy tắc liên quan" testId="rules">
        {n.relevantRuleIds.length && !stale ? n.relevantRuleIds.map((r) => (
          <div key={r} className="text-sm">{RULES[r]?.name ?? r}{RULES[r]?.latex ? <KaTeX latex={RULES[r].latex} displayMode={false} trust={false} /> : null}</div>
        )) : <None />}
      </Section>
      <Section title="Dựa trên" testId="sources">
        {inEdges.length ? (
          <ul className="space-y-1">
            {inEdges.map((x) => (
              <li key={x.edgeId} data-edge-id={x.edgeId} data-edge-status={x.status} data-relation={x.relation} data-voice-highlight={voiceCue?.edgeIds.includes(x.edgeId) || undefined} className={`${x.depth === 'indirect' ? 'text-slate-400' : ''} ${voiceCue?.edgeIds.includes(x.edgeId) ? 'rounded ring-2 ring-cyan-300' : ''}`}>
                <button type="button" disabled={rowPresentation && byId.get(x.from)?.row === null} data-source-node-id={x.from} onClick={() => goToNode(x.from)} className="rounded bg-slate-800 px-1.5 text-xs">{rowLabel(byId.get(x.from))}</button>{' '}
                <span className="text-xs">{x.depth === 'indirect' ? '(gián tiếp) ' : ''}{x.status === 'provisional' ? '(chưa xác nhận) ' : ''}{x.status === 'broken' ? '⚠ ' : ''}{neutral ? 'liên kết' : x.explanation}</span>
                {!neutral && !rowPresentation && <button type="button" onClick={() => selectEdge(x.edgeId, [x.from, x.to].filter((id) => /^n\d+|^f1-/.test(id)))} className="ml-1 text-[10px] text-cyan-300 underline">xem liên kết</button>}
              </li>
            ))}
          </ul>
        ) : <None />}
      </Section>
      <Section title="Ảnh hưởng tới" testId="affected">
        {n.affectedNodeIds.length ? n.affectedNodeIds.map((id) => (
          <button key={id} type="button" onClick={() => goToNode(id)} className="mr-1 rounded bg-slate-800 px-1.5 text-xs">{rowLabel(byId.get(id))}</button>
        )) : <None />}
      </Section>
      <Section title="Hình liên quan" testId="visuals">
        {linked.length && !neutral ? linked.map(({ spec, el }) => (
          <button key={el.elementId} type="button" data-linked-element={el.elementId}
            onClick={() => { const t = RENDERER_TAB[spec.renderer]; if (t) setVisualTab(t); select([n.nodeId]); }}
            className="mr-1 mt-0.5 rounded border border-slate-600 px-1.5 text-xs">{el.label}</button>
        )) : <None />}
      </Section>
      <Section title="Lịch sử" testId="history">
        {node?.history.length ? (
          <ol className="text-xs text-slate-300">
            {node.history.map((h) => <li key={h.revision}>Phiên bản {h.revision}: “{h.originalText}”{neutral ? '' : ` — ${h.validation ? ({ valid: 'khớp', invalid: 'chưa khớp', ambiguous: 'cần làm rõ', unverified: 'chưa kiểm tra được', insufficient_evidence: 'thiếu cơ sở' } as Record<string, string>)[h.validation.status] : '—'}`}</li>)}
          </ol>
        ) : <None />}
      </Section>
      <Section title="Tiếp theo" testId="next">
        {e?.prompt && !neutral && !stale && <p className="mb-1" data-testid="detail-prompt">{e.prompt}</p>}
        {learner && ctx && (ctx.phase === 'reasoning' || ctx.phase === 'independent') && n.row !== 0 ? (
          <div className="flex flex-wrap gap-1">
            <button type="button" onClick={() => setEditing(n.nodeId)} className="rounded bg-slate-800 px-2 py-0.5 text-xs">Sửa bước này</button>
            {!neutral && (n.validationStatus === 'invalid' || n.validationStatus === 'insufficient_evidence') && (
              <button type="button" disabled={pending} onClick={() => void turn({ type: 'request_hint', nodeId: n.nodeId })} className="rounded bg-slate-800 px-2 py-0.5 text-xs">Gợi ý</button>
            )}
            {canInvestigate && <button type="button" disabled={pending || !!ctx.experiment?.active} onClick={() => void turn({ type: 'experiment', event: 'start', nodeId: n.nodeId })} className="rounded bg-slate-800 px-2 py-0.5 text-xs">Điều tra</button>}
            {!neutral && node?.interpretation.status === 'interpreted' && <button type="button" disabled={pending} onClick={() => void turn({ type: 'reject_interpretation', nodeId: n.nodeId })} className="rounded bg-slate-800 px-2 py-0.5 text-xs">Không phải ý em</button>}
          </div>
        ) : !e?.prompt ? <None /> : null}
      </Section>
    </>
  ));
}
