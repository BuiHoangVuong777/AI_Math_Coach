import { useState, type FormEvent } from 'react';
import { Bot, Lightbulb, Loader2 } from 'lucide-react';
import { MISCONCEPTION_TEXT } from '@/data/canvas/copy';
import { learnerNodes } from '@/lib/reasoning/graph';
import { LIMITS } from '@/lib/reasoning/types';
import { useCanvas } from '@/stores/reasoningSessionStore';

/** Coach column: tutor replies (advisory only), clarification cards, hints, questions. */
export default function CoachPanel() {
  const { coachLog, clarification, turn, pending, ctx, selected, select } = useCanvas();
  const [msg, setMsg] = useState('');
  if (!ctx) return null;
  const g = ctx.graph;
  const target = selected[0] ?? learnerNodes(g).find((n) => n.lifecycle === 'active' && n.validation?.status === 'invalid' && !n.validation.rootCauseNodeIds.length)?.id ?? null;
  const rowOf = (id: string) => g.nodes[id]?.rowIndex;

  const ask = async (e: FormEvent) => {
    e.preventDefault();
    const t = msg.trim();
    if (!t) return;
    if (await turn({ type: 'ask_coach', message: t, nodeId: selected[0] ?? null })) setMsg('');
  };
  const answer = (value: string) => {
    if (!clarification) return;
    if (clarification.kind === 'ambiguity') void turn(value === 'reject' ? { type: 'reject_interpretation', nodeId: clarification.nodeId } : { type: 'resolve_ambiguity', nodeId: clarification.nodeId, choiceIndex: Number(value) });
    if (clarification.kind === 'conflict') void turn({ type: 'resolve_conflict', nodeId: clarification.nodeId, action: value as 'replace' | 'keep_both' });
    if (clarification.kind === 'revised_by' && ctx.pendingRevisedBy) void turn({ type: 'mark_revised_by', nodeId: ctx.pendingRevisedBy.nodeId, byNodeId: ctx.pendingRevisedBy.byNodeId, accept: value === 'accept' });
  };

  return (
    <aside aria-label="Coach" className="space-y-3">
      {clarification && (
        <div className="rounded-xl border border-amber-400/50 bg-amber-500/10 p-3 text-sm text-amber-100" data-testid="clarification" data-kind={clarification.kind}>
          <p className="font-semibold">{clarification.kind === 'revised_by' ? 'Liên kết bước đã sửa' : clarification.kind === 'conflict' ? 'Hai giá trị khác nhau' : 'Cần làm rõ'} · bước {rowOf(clarification.nodeId)}</p>
          <p className="mt-1">{clarification.question}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {clarification.options.map((o) => (
              <button key={o.value} type="button" disabled={pending} onClick={() => answer(o.value)} data-option={o.value} className="rounded-lg bg-amber-400/20 px-2 py-1 text-left text-xs hover:bg-amber-400/30">{o.label}</button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
        <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-100"><Bot className="h-4 w-4" /> Coach</h2>
        <div aria-live="polite" className="max-h-[360px] space-y-2 overflow-y-auto" data-testid="coach-log">
          {coachLog.length === 0 && <p className="text-xs text-slate-400">Coach sẽ hỏi lại khi một bước chưa khớp hoặc khi em cần gợi ý. Coach không đưa đáp án.</p>}
          {coachLog.map(({ id, coach: c }) => (
            <div key={id} className="rounded-lg bg-slate-800/70 p-2 text-sm text-slate-100" data-coach-source={c.source} data-reply-type={c.replyType} data-level={c.disclosureLevel}>
              <p className="mb-1 flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
                <span className={`rounded px-1 ${c.source === 'ai' ? 'bg-violet-500/30 text-violet-100' : 'bg-slate-600/60 text-slate-200'}`}>{c.source === 'ai' ? 'Coach AI' : 'Coach cơ bản'}</span>
                <span>mức D{c.disclosureLevel}</span>
                {c.relevantNodeIds.map((n) => (
                  <button key={n} type="button" onClick={() => select([n])} className="rounded bg-slate-700 px-1 text-slate-200">bước {rowOf(n)}</button>
                ))}
              </p>
              {c.explanation && <p className="whitespace-pre-line">{c.explanation}</p>}
              {c.question && <p className="whitespace-pre-line">{c.question}</p>}
              {c.hint && <p className="mt-1 whitespace-pre-line text-amber-100">💡 {c.hint.text}</p>}
              {c.misconception.detected && <p className="mt-1 text-xs text-rose-200">Hiểu lầm {MISCONCEPTION_TEXT[c.misconception.code] ?? c.misconception.code} (chỉ là khả năng).</p>}
            </div>
          ))}
        </div>

        {ctx.phase === 'reasoning' && (
          <>
            <button type="button" disabled={pending || !target} onClick={() => target && void turn({ type: 'request_hint', nodeId: target })} className="mt-2 flex items-center gap-1 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-200 disabled:opacity-40">
              <Lightbulb className="h-3.5 w-3.5" /> Gợi ý cho {target ? `bước ${rowOf(target)}` : 'bước đang chọn'}
            </button>
            <form onSubmit={ask} className="mt-2 space-y-1">
              <label htmlFor="ask-coach" className="text-xs text-slate-400">Hỏi Coach (không ghi thông tin cá nhân)</label>
              <textarea id="ask-coach" rows={2} maxLength={LIMITS.coachMessage} value={msg} onChange={(e) => setMsg(e.target.value)} className="w-full rounded-lg border border-white/10 bg-slate-950 p-2 text-sm text-slate-100" />
              <button type="submit" disabled={pending || !msg.trim()} className="flex items-center gap-1 rounded-lg bg-indigo-500 px-2 py-1 text-xs font-semibold text-white disabled:opacity-40">
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Gửi câu hỏi
              </button>
            </form>
          </>
        )}
      </div>

      {ctx.phase === 'reasoning' && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => window.confirm('Làm bài tương tự không có gợi ý? Coach, hình và lời giải bài chính sẽ bị ẩn cho đến khi em nộp bài.') && void turn({ type: 'start_independent' })}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Tự kiểm tra
          </button>
          <button type="button" disabled={pending} onClick={() => window.confirm('Kết thúc phiên mà không làm bài tương tự?') && void turn({ type: 'finish' })} className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300">Kết thúc phiên</button>
        </div>
      )}
    </aside>
  );
}
