import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Target } from 'lucide-react';
import { MILESTONE_STATE_UI } from '@/data/canvas/copy';
import { deriveMissionProgress, missionFor } from '@/lib/reasoning/mission';
import { collectFinalAssessment, collectSessionEvidence } from '@/lib/reasoning/sessionEvidence';
import { familyOf } from '@/lib/reasoning/analog';
import { useCanvas } from '@/stores/reasoningSessionStore';

/**
 * Lightweight mission bar (§24.3): observational milestones derived from verified
 * evidence and one neutral next action. Secondary to the reasoning workspace; shows no
 * score and no value the disclosure policy still hides.
 */
export default function MissionProgress() {
  const ctx = useCanvas((s) => s.ctx);
  const reduce = useReducedMotion();
  const mission = useMemo(() => (ctx ? deriveMissionProgress(collectSessionEvidence(ctx), collectFinalAssessment(ctx)) : null), [ctx]);
  if (!ctx || !mission) return null;
  return (
    <section aria-labelledby="mission-title" data-testid="mission-progress" className="mb-3 rounded-xl border border-indigo-400/20 bg-slate-900/60 p-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <Target aria-hidden className="h-4 w-4 shrink-0 self-center text-cyan-300" />
        <h2 id="mission-title" className="text-sm font-semibold text-white">Nhiệm vụ: {mission.title}</h2>
        <p className="text-xs text-slate-300">{mission.subtitle}</p>
      </div>
      <p className="mt-1 text-xs text-slate-400">{mission.objective}</p>
      <ol aria-label="Các chặng của nhiệm vụ (em chọn thứ tự)" className="mt-2 grid grid-cols-2 gap-1.5 lg:grid-cols-4">
        {mission.milestones.map((m, i) => {
          const ui = MILESTONE_STATE_UI[m.state];
          return (
            <li key={m.id} data-testid={`milestone-${m.id}`} data-state={m.state} title={m.detail} className={`flex min-w-0 items-start gap-1.5 rounded-lg border px-2 py-1.5 text-xs ${ui.cls}`}>
              <motion.span
                key={m.state}
                aria-hidden
                initial={reduce || m.state !== 'achieved' ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="mt-px shrink-0 font-semibold"
              >
                {ui.icon}
              </motion.span>
              <span className="min-w-0">
                <span className="block font-medium">{i + 1}. {m.label}{m.optional && <span className="font-normal text-slate-400"> (tùy chọn)</span>}</span>
                <span className="block text-[11px] opacity-90">{ui.label}</span>
                <span className="sr-only">{m.detail}</span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 text-xs text-slate-200" data-testid="mission-next-action" data-kind={mission.nextAction.kind} aria-live="polite">
        <span className="font-semibold text-cyan-200">Việc tiếp theo: </span>{mission.nextAction.text}
      </p>
    </section>
  );
}

/** F8 banner: only the mission step itself — no main-problem evidence, statuses or values (F8-AC-01). */
export function MissionIndependentBanner() {
  const ctx = useCanvas((s) => s.ctx);
  if (!ctx) return null;
  const m = missionFor(familyOf(ctx.problemSpec));
  return (
    <p data-testid="mission-independent" className="rounded-lg border border-indigo-400/20 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
      <Target aria-hidden className="mr-1 inline h-3.5 w-3.5 text-cyan-300" />
      Chặng 4 của nhiệm vụ “{m.title}”: tự giải bài tương tự — không có gợi ý.
    </p>
  );
}
