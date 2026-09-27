import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { History, Loader2, Pencil, Search, Trash2, Lightbulb, XCircle } from 'lucide-react';
import DetailPanel from '@/components/canvas/graph/DetailPanel';
import { VoiceListen } from '@/components/voice/VoiceControls';
import { useVoice } from '@/stores/voiceStore';
import { rowExplanations } from '@/lib/canvas/presentation';
import { MISCONCEPTION_TEXT, REASON_TEXT, STATUS_UI } from '@/data/canvas/copy';
import { learnerNodes, transitiveDependents } from '@/lib/reasoning/graph';
import type { GraphNodeViewModel, GraphEdgeViewModel, ReasoningGraph, ReasoningNode } from '@/lib/reasoning/types';
import { LIMITS } from '@/lib/reasoning/types';
import { useCanvas } from '@/stores/reasoningSessionStore';

function statusKey(n: ReasoningNode, stale: boolean, neutral: boolean) {
  if (neutral) return null;
  if (stale) return 'stale' as const;
  if (n.interpretation.semanticType === 'question') return 'question' as const;
  return n.validation?.status ?? 'unverified';
}

export function RowItem({ n, graph, neutral, view, views, edges }: { n: ReasoningNode; graph: ReasoningGraph; neutral: boolean; view?: GraphNodeViewModel; views: GraphNodeViewModel[]; edges: GraphEdgeViewModel[] }) {
  const { selected, select, turn, pending, staleIds, recentlyChanged, ctx, specs } = useCanvas();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(n.originalText);
  const [showHistory, setShowHistory] = useState(false);
  const editingNodeId = useCanvas((s) => s.editingNodeId);
  const setEditingRequest = useCanvas((s) => s.setEditing);
  const liRef = useRef<HTMLLIElement>(null);
  // "Sửa bước này" from the graph detail panel opens this row's editor.
  useEffect(() => {
    if (editingNodeId === n.id) {
      setEditing(true);
      setText(n.originalText);
      liRef.current?.scrollIntoView({ block: 'center' });
      setEditingRequest(null);
    }
  }, [editingNodeId, n.id, n.originalText, setEditingRequest]);
  const cue = useVoice(s => s.cue);
  const stale = staleIds.includes(n.id);
  const explanation = !neutral && !stale ? view?.explanation : null;
  const isSel = selected.includes(n.id);
  const sk = statusKey(n, staleIds.includes(n.id), neutral);
  const st = sk ? STATUS_UI[sk] : null;
  const v = n.validation;
  const retracted = n.lifecycle === 'retracted';
  const st2 = n.interpretation.normalized;
  const investigable = !neutral && ctx?.phase === 'reasoning' && (n.interpretation.semanticType === 'hypothesis' || st2?.kind === 'scaling') && ctx.problemSpec.cylinders.length > 1;

  const save = async () => {
    const t = text.trim();
    if (!t || t === n.originalText) return setEditing(false);
    // Nodes that depend on this row are shown as "đang kiểm tra lại" while the request runs.
    const ok = await turn({ type: 'edit_row', nodeId: n.id, rowText: t }, { stale: [n.id, ...transitiveDependents(graph, n.id)] });
    if (ok) setEditing(false);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') void save();
    if (e.key === 'Escape') {
      setText(n.originalText);
      setEditing(false);
    }
  };
  const roots = v?.rootCauseNodeIds.map((id) => graph.nodes[id]?.rowIndex).filter(Boolean) ?? [];

  return (
    <li
      ref={liRef}
      data-node-id={n.id}
      data-row={n.rowIndex}
      data-node-revision={n.revision}
      data-graph-version={graph.version}
      data-explanation-id={explanation?.explanationId}
      data-template-id={explanation?.templateId}
      data-voice-highlight={cue?.nodeIds.includes(n.id) || undefined}
      data-status={neutral ? 'none' : v?.status}
      className={`rounded-lg border p-2 text-sm ${isSel ? 'border-white bg-slate-800/80' : 'border-white/10 bg-slate-900/60'} ${retracted ? 'opacity-50' : ''} ${cue?.nodeIds.includes(n.id) ? 'ring-2 ring-cyan-300' : recentlyChanged.includes(n.id) ? 'ring-1 ring-cyan-400/70' : ''}`}
    >
      <div className="flex items-start gap-2">
        <button type="button" onClick={() => select(isSel ? [] : [n.id])} aria-pressed={isSel} className="mt-0.5 min-w-[2rem] rounded bg-slate-800 px-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" data-node-id={n.id} onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); select([]); } }} aria-label={`Chọn bước ${n.rowIndex}`}>
          {n.rowIndex === 0 ? 'F1' : n.rowIndex}
        </button>
        <div className="min-w-0 flex-1">
          {editing ? (
            <input autoFocus value={text} maxLength={LIMITS.rowText} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} aria-label={`Sửa bước ${n.rowIndex}`} className="w-full rounded border border-cyan-400/60 bg-slate-950 px-2 py-1 text-slate-100" />
          ) : (
            <p className={`break-words text-slate-100 ${retracted ? 'line-through' : ''}`} data-testid="original-text">{n.originalText}</p>
          )}
          <p className="mt-0.5 text-xs text-slate-400">
            Hệ thống hiểu là: <span className="text-slate-300">{n.interpretation.displayText || '—'}</span>
            {n.interpretation.provenance === 'llm_interpretation' && <span className="ml-1 rounded bg-violet-500/20 px-1 text-violet-200">AI đọc</span>}
          </p>
          {st && !retracted && (
            <p className={`mt-1 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs ${st.cls}`} data-testid="status-chip">
              <span aria-hidden>{st.icon}</span> {st.label}
            </p>
          )}
          {!neutral && !retracted && <p className="mt-1 break-words text-xs text-slate-200" data-testid="node-explanation">{stale ? 'Đang kiểm tra lại…' : explanation?.explanationShort ?? explanation?.prompt}</p>}
          {!neutral && !retracted && !stale && explanation && (
            <div className="mt-1 flex flex-wrap gap-2">
              <button type="button" aria-expanded={isSel} onClick={() => select(isSel ? [] : [n.id])} className="rounded px-1.5 py-0.5 text-xs text-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Giải thích</button>
              <VoiceListen nodeId={n.id} disabled={pending} />
            </div>
          )}
          {!neutral && !retracted && !stale && v && (
            <ul className="mt-1 space-y-0.5 text-xs text-slate-300">
              {v.reasonCodes.filter((r) => REASON_TEXT[r]).map((r) => <li key={r}>• {REASON_TEXT[r]}{r === 'depends_on_invalid' && roots.length ? ` (bước ${roots.join(', ')})` : ''}</li>)}
              {v.possibleMisconceptions.map((m) => <li key={m.code} className="text-rose-200">• Hiểu lầm {MISCONCEPTION_TEXT[m.code] ?? m.code} (chỉ là khả năng).</li>)}
              {n.revisedBy.length > 0 && <li className="text-emerald-300">• Em đã sửa ở bước {n.revisedBy.map((id) => graph.nodes[id]?.rowIndex).join(', ')}.</li>}
            </ul>
          )}
          {showHistory && n.history.length > 0 && (
            <ol className="mt-1 space-y-0.5 border-l border-white/10 pl-2 text-xs text-slate-400" aria-label="Lịch sử sửa">
              {n.history.map((h) => <li key={h.revision}>Phiên bản {h.revision}: “{h.originalText}” — {h.validation ? STATUS_UI[h.validation.status].label : '—'}</li>)}
            </ol>
          )}
          {!retracted && !neutral && (
            <div className="mt-1 flex flex-wrap gap-1">
              {n.rowIndex > 0 && <Action icon={Pencil} label="Sửa" onClick={() => (editing ? void save() : setEditing(true))} disabled={pending} />}
              {n.rowIndex > 0 && <Action icon={Trash2} label="Rút" onClick={() => window.confirm('Rút bước này? Bước vẫn được giữ trong lịch sử.') && void turn({ type: 'retract_row', nodeId: n.id })} disabled={pending} />}
              {v?.status === 'invalid' || v?.status === 'insufficient_evidence' ? <Action icon={Lightbulb} label="Gợi ý" onClick={() => void turn({ type: 'request_hint', nodeId: n.id })} disabled={pending} /> : null}
              {investigable && <Action icon={Search} label="Điều tra" onClick={() => void turn({ type: 'experiment', event: 'start', nodeId: n.id })} disabled={pending || !!ctx?.experiment?.active} />}
              {n.interpretation.status === 'interpreted' && n.rowIndex > 0 && <Action icon={XCircle} label="Không phải ý em" onClick={() => void turn({ type: 'reject_interpretation', nodeId: n.id })} disabled={pending} />}
              {n.history.length > 0 && <Action icon={History} label={`Lịch sử (${n.history.length})`} onClick={() => setShowHistory((x) => !x)} />}
            </div>
          )}
          {!neutral && !stale && selected[0] === n.id && view && explanation && <DetailPanel nodes={views} edges={edges} graph={graph} specs={specs} neutral={false} presentation="row" onClose={() => select([])} />}
          {neutral && n.rowIndex > 0 && !retracted && (
            <div className="mt-1 flex gap-1">
              <Action icon={Pencil} label="Sửa" onClick={() => (editing ? void save() : setEditing(true))} disabled={pending} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

function Action({ icon: Icon, label, onClick, disabled }: { icon: typeof Pencil; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40">
      <Icon className="h-3 w-3" /> {label}
    </button>
  );
}

export function RowsPanel({ graph, neutral = false }: { graph: ReasoningGraph; neutral?: boolean }) {
  const { turn, pending, specs, recentlyChanged } = useCanvas();
  const { nodes: views, edges } = useMemo(() => rowExplanations(specs, graph), [specs, graph]);
  const [announce, setAnnounce] = useState('');
  useEffect(() => {
    if (neutral || !recentlyChanged.length) return;
    setAnnounce(views.filter(n => n.row !== null && recentlyChanged.includes(n.nodeId)).map(n => `Bước ${n.row}: ${n.statusBadge.label}`).join('; '));
  }, [views, recentlyChanged, neutral]);
  const [text, setText] = useState('');
  const rows = learnerNodes(graph);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    if (await turn({ type: 'add_row', rowText: t })) setText('');
  };
  return (
    <section aria-label="Các bước suy luận của em" className="space-y-2">
      <h2 className="text-sm font-semibold text-slate-200">Lời giải của em — mỗi dòng một bước</h2>
      <p className="sr-only" aria-live="polite" data-testid="rows-announce">{neutral ? '' : announce}</p>
      <ol className="space-y-2" data-testid="rows">
        {rows.map((n) => <RowItem key={n.id} n={n} graph={graph} neutral={neutral} view={views.find(v => v.nodeId === n.id)} views={views} edges={edges} />)}
      </ol>
      <form onSubmit={submit} className="flex gap-2">
        <label htmlFor="row-input" className="sr-only">Bước tiếp theo</label>
        <input
          id="row-input"
          value={text}
          maxLength={LIMITS.rowText}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ví dụ: A₁ = π·3² = 9π cm²"
          className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
        <button type="submit" disabled={pending || !text.trim()} className="flex items-center gap-1 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Gửi
        </button>
      </form>
      <p className="text-[11px] text-slate-500">Viết như trên giấy: “r₁ = 6 : 2 = 3 cm”, “V₂ : V₁ = 80π : 20π = 4”, “Em đoán thể tích gấp 2 lần”. Có thể gõ pi, ^2, dấu phẩy thập phân. Không ghi thông tin cá nhân.</p>
    </section>
  );
}
