import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Compass, Headphones, LifeBuoy, Sparkles, Trophy } from 'lucide-react';
import VoiceControls from '@/components/voice/VoiceControls';
import { CRITERION_STATUS_UI, MILESTONE_STATE_UI } from '@/data/canvas/copy';
import { buildScoringResult } from '@/lib/reasoning/completion';
import { BADGE_INFO, type BadgeId, type ScoreCriterion } from '@/lib/reasoning/learningScore';
import { useCanvas } from '@/stores/reasoningSessionStore';
import { useVoice } from '@/stores/voiceStore';

const GUIDED: ScoreCriterion['id'][] = ['problem_understanding', 'evidence_reasoning', 'verification', 'own_explanation'];

function Criterion({ c }: { c: ScoreCriterion }) {
  const ui = CRITERION_STATUS_UI[c.status];
  const pct = Math.round((c.points / c.max) * 100);
  return (
    <details data-testid={`criterion-${c.id}`} data-points={c.points} data-max={c.max} data-status={c.status} className="group rounded-lg border border-white/10 bg-slate-900/60">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 rounded-lg px-3 py-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
        <span className="min-w-0 flex-1 text-sm font-medium text-slate-100">{c.label}</span>
        <span className={`rounded px-1.5 py-0.5 text-[11px] ${ui.cls}`}><span aria-hidden>{ui.icon} </span>{ui.label}</span>
        <span className="w-16 text-right text-sm font-semibold tabular-nums text-white">{c.points}/{c.max}</span>
        <span aria-hidden className="h-1.5 w-full overflow-hidden rounded bg-slate-800"><span className="block h-full rounded bg-cyan-400/80" style={{ width: `${pct}%` }} /></span>
      </summary>
      <div className="space-y-2 px-3 pb-3 text-sm text-slate-300">
        <p data-testid="criterion-explanation">{c.explanation}</p>
        <ul className="space-y-1 text-xs">
          {c.parts.map((p) => (
            <li key={p.id} className="rounded bg-slate-950/60 p-2">
              <span className="font-semibold text-slate-100">{p.label}: {p.points}/{p.max}</span>
              <span className="block text-slate-400">Quy tắc: {p.rule}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate-400">Cách tính: {c.calculation}</p>
        {c.evidence.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-200">Bằng chứng</p>
            <ul className="list-disc pl-5 text-xs" data-testid="criterion-evidence">
              {c.evidence.map((e, i) => (
                <li key={i} data-evidence-kind={e.kind} data-node-ids={e.nodeIds.join(' ')}>
                  {e.note}
                  {e.rows.length > 0 && <span className="text-slate-400"> ({e.graph === 'independent' ? 'bài tự kiểm tra, ' : ''}bước {[...new Set(e.rows)].filter((r) => r > 0).join(', ')})</span>}
                  {e.eventSeqs.length > 0 && <span className="text-slate-500"> · sự kiện #{e.eventSeqs.slice(0, 6).join(', #')}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {c.missingEvidence.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-amber-200">Chưa có hoặc chưa rõ bằng chứng</p>
            <ul className="list-disc pl-5 text-xs text-amber-100/90" data-testid="criterion-missing">{c.missingEvidence.map((m, i) => <li key={i}>{m}</li>)}</ul>
          </div>
        )}
      </div>
    </details>
  );
}

/** Mission-completion screen (§24.6) on top of the existing evidence summary. */
export default function CompletionPanel() {
  const ctx = useCanvas((s) => s.ctx);
  const startNextChallenge = useCanvas((s) => s.startNextChallenge);
  const reduce = useReducedMotion();
  const voice = useVoice();
  const r = useMemo(() => (ctx ? buildScoringResult(ctx) : null), [ctx]);
  if (!ctx || !r) return null;
  const { score, badges, mission, assessment: a, support, nextChallenge, message } = r;
  const guided = score.criteria.filter((c) => GUIDED.includes(c.id));
  const independent = score.criteria.find((c) => c.id === 'independent_transfer')!;
  const earned = new Set(badges.map((b) => b.id));
  const speakingIndex = voice.plan?.kind === 'completion' ? voice.cue?.elementIds.find((id) => id.startsWith('completion:')) : undefined;
  const ev = a.evaluation;

  return (
    <section aria-labelledby="completion-title" data-testid="completion-panel" data-mission-complete={mission.complete} className="space-y-3">
      <motion.header
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="flex items-center gap-3 rounded-xl border border-cyan-400/30 bg-gradient-to-r from-indigo-500/15 via-slate-900/70 to-cyan-500/10 p-4"
      >
        <motion.span
          aria-hidden
          initial={reduce || !mission.complete ? false : { scale: 0.4, rotate: -12, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15, type: 'spring', bounce: 0.35 }}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${mission.complete ? 'bg-cyan-300 text-slate-950 shadow-[0_0_24px_rgba(34,211,238,0.45)]' : 'bg-slate-800 text-cyan-200'}`}
        >
          {mission.complete ? <Trophy className="h-6 w-6" /> : <Compass className="h-6 w-6" />}
        </motion.span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Nhiệm vụ · {mission.title}</p>
          <h2 id="completion-title" className="text-lg font-semibold text-white" data-testid="completion-headline">{message.headline}</h2>
          <p className="text-xs text-slate-300">{mission.subtitle}</p>
        </div>
      </motion.header>

      <ol aria-label="Các chặng của nhiệm vụ" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {mission.milestones.map((m, i) => {
          const ui = MILESTONE_STATE_UI[m.state];
          return (
            <li key={m.id} data-testid={`completion-milestone-${m.id}`} data-state={m.state} className={`rounded-lg border px-2 py-1.5 text-xs ${ui.cls}`}>
              <span className="font-medium"><span aria-hidden>{ui.icon} </span>{i + 1}. {m.label}{m.optional ? ' (tùy chọn)' : ''}</span>
              <span className="block text-[11px] opacity-90">{ui.label} · {m.detail}</span>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-3 md:grid-cols-[250px_minmax(0,1fr)]">
        <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/60 p-4" data-testid="score-card">
          <p className="text-xs text-slate-300">Điểm phiên học này</p>
          <p className="text-4xl font-bold tabular-nums text-white" data-testid="score-total" data-total={score.total}>{score.total}<span className="text-lg font-medium text-slate-400">/100</span></p>
          {!score.complete && <p className="text-xs text-amber-200" data-testid="score-incomplete">Còn {score.incompleteCriteria.length} phần chưa có bằng chứng — phần đó chưa được tính.</p>}
          <dl className="space-y-1 text-xs text-slate-300">
            <div className="flex justify-between gap-2"><dt>Học có hướng dẫn</dt><dd className="tabular-nums" data-testid="guided-points">{guided.reduce((s, c) => s + c.points, 0)}/{guided.reduce((s, c) => s + c.max, 0)}</dd></div>
            <div className="flex justify-between gap-2"><dt>Tự làm độc lập</dt><dd className="tabular-nums" data-testid="independent-points">{independent.status === 'incomplete' ? 'chưa có bằng chứng' : `${independent.points}/${independent.max}`}</dd></div>
          </dl>
          <p className="text-[11px] leading-relaxed text-slate-400" data-testid="score-disclaimer">{score.disclaimer}</p>
        </div>
        <div className="space-y-2" aria-label="Điểm từng tiêu chí">
          <p className="text-xs text-slate-400">Bấm vào từng tiêu chí để xem vì sao có điểm hoặc chưa có điểm, và bằng chứng từ các bước của em.</p>
          {score.criteria.map((c) => <Criterion key={c.id} c={c} />)}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <section aria-labelledby="independent-title" data-testid="independent-outcome" data-status={a.status} className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-3 text-sm text-slate-200">
          <h3 id="independent-title" className="font-semibold text-white">Kết quả tự làm (chấm riêng)</h3>
          {a.status === 'evaluated' && ev ? (
            <ul className="mt-1 space-y-0.5 text-xs">
              <li>Đáp án: {ev.answer === 'correct' ? (a.answerBare ? 'khớp, nhưng chưa có bước dẫn tới' : 'khớp') : ev.answer === 'incorrect' ? 'chưa khớp' : ev.answer === 'missing' ? 'chưa có kết luận' : 'chưa đọc được'}</li>
              <li>Lập luận: {({ sufficient: 'đủ bằng chứng', partial: 'một phần', contains_invalid: 'có bước chưa khớp', insufficient_evidence: 'chưa đủ bằng chứng' } as const)[ev.reasoning]}</li>
              <li className="text-slate-400">Không dùng gợi ý, hình hay Coach; không cộng từ bài chính.</li>
            </ul>
          ) : (
            <p className="mt-1 text-xs text-amber-200">{a.status === 'not_evaluated' ? 'Bài đã nộp nhưng chưa đánh giá được.' : a.status === 'in_progress' ? 'Bài tự kiểm tra chưa được nộp — chưa có bằng chứng.' : 'Em chưa làm bài tự kiểm tra — chưa có bằng chứng.'}</p>
          )}
        </section>

        <section aria-labelledby="support-title" data-testid="support-used" className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-200">
          <h3 id="support-title" className="flex items-center gap-1.5 font-semibold text-white"><LifeBuoy aria-hidden className="h-4 w-4" /> Hỗ trợ em đã dùng</h3>
          <ul className="mt-1 space-y-0.5 text-xs">
            <li data-testid="support-hints">Gợi ý: {support.hints.length ? support.hints.map((h) => `bước ${h.row ?? '?'} (${h.count} lần, cao nhất D${h.maxLevel})`).join('; ') : 'không dùng'}</li>
            <li>Coach phản hồi: {support.coach.total ? `${support.coach.total} lượt (AI: ${support.coach.ai}, cơ bản: ${support.coach.ruleBased})` : 'không có'}</li>
            <li>Thử nghiệm trên mô hình: {support.experiments.runs ? `${support.experiments.runs} lần` : 'không dùng'}</li>
          </ul>
          <p className="mt-1 text-[11px] text-slate-400">Dùng hỗ trợ không bị trừ điểm. Mục này giúp em và phụ huynh thấy em đã học thế nào.</p>
        </section>
      </div>

      <section aria-labelledby="badges-title" data-testid="badges" className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
        <h3 id="badges-title" className="flex items-center gap-1.5 text-sm font-semibold text-white"><Sparkles aria-hidden className="h-4 w-4 text-amber-300" /> Huy hiệu của phiên</h3>
        {badges.length === 0 && <p className="mt-1 text-xs text-slate-400">Chưa có huy hiệu trong phiên này — huy hiệu chỉ được trao khi có bằng chứng từ các bước của em.</p>}
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {badges.map((b, i) => (
            <motion.li
              key={b.id}
              data-badge={b.id}
              initial={reduce ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 + i * 0.08 }}
              className="flex gap-2 rounded-lg border border-amber-300/30 bg-amber-400/10 p-2 text-xs text-amber-50"
            >
              <span aria-hidden className="text-lg">{b.icon}</span>
              <span><span className="block font-semibold">{b.name}</span>{b.reason}</span>
            </motion.li>
          ))}
        </ul>
        {badges.length < 4 && (
          <details className="mt-2 text-xs text-slate-400">
            <summary className="cursor-pointer rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Cách nhận các huy hiệu khác</summary>
            <ul className="mt-1 list-disc pl-5">{(Object.keys(BADGE_INFO) as BadgeId[]).filter((id) => !earned.has(id)).map((id) => <li key={id} data-badge-locked={id}>{BADGE_INFO[id].name}: {BADGE_INFO[id].rule}</li>)}</ul>
          </details>
        )}
      </section>

      <section aria-labelledby="coach-message-title" data-testid="coach-message" className="rounded-xl border border-indigo-400/30 bg-indigo-500/5 p-3 text-sm text-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          <h3 id="coach-message-title" className="font-semibold text-white">Lời nhắn của Coach</h3>
          <span className="rounded bg-slate-700/70 px-1.5 text-[11px] text-slate-200">dựa trên bằng chứng · mẫu cố định, không do AI tự viết</span>
          <button type="button" data-testid="listen-completion" onClick={() => voice.listenCompletion()} className="ml-auto flex items-center gap-1 rounded bg-indigo-700 px-2 py-1 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">
            <Headphones aria-hidden className="h-3.5 w-3.5" /> Nghe tóm tắt
          </button>
        </div>
        <ul className="mt-2 space-y-1">
          {message.spoken.map((t, i) => (
            <li key={i} data-completion-segment={i} className={`rounded px-1 ${speakingIndex === `completion:${i}` ? 'bg-cyan-400/20 ring-1 ring-cyan-300' : ''}`}>{t}</li>
          ))}
        </ul>
      </section>
      {/* Mounted with the panel (renders nothing without a plan): mounting it only when playback
          starts would let StrictMode's remount cleanup stop the audio. Stops on unmount. */}
      <VoiceControls />

      {nextChallenge && (
        <section aria-labelledby="next-challenge-title" data-testid="next-challenge" data-family={nextChallenge.family} className="rounded-xl border border-cyan-400/30 bg-slate-900/60 p-3 text-sm text-slate-200">
          <h3 id="next-challenge-title" className="font-semibold text-white">Thử thách tiếp theo (tùy chọn): {nextChallenge.label}</h3>
          <p className="mt-1 text-xs text-slate-400">{nextChallenge.reason}</p>
          <p className="mt-2 rounded bg-slate-950/60 p-2" data-testid="next-challenge-text">{nextChallenge.problemText}</p>
          <button type="button" onClick={() => startNextChallenge(nextChallenge.problemText)} className="mt-2 rounded-lg bg-cyan-300 px-3 py-1.5 text-sm font-semibold text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            Làm bài này trong phiên mới
          </button>
          <p className="mt-1 text-[11px] text-slate-400">Đề mở ở bước nhập đề để em tự xác nhận; không có đáp án kèm theo.</p>
        </section>
      )}
    </section>
  );
}
