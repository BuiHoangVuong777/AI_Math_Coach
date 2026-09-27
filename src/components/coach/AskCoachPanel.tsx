import { FormEvent, useState } from 'react';
import { Bot, Loader2, MessageCircle } from 'lucide-react';
import { CYLINDER_LESSON as L } from '@/data/lessons/cylinderLesson';
import { LEARNER_MESSAGE_MAX, type CoachRequest } from '@/lib/cylinder/coachContract';
import { askCoach, type CoachResult } from '@/lib/cylinder/coachClient';
import { CALC_STEPS, type CalcStep } from '@/lib/cylinder/session';
import { useCoachSession } from '@/stores/coachSessionStore';

interface Turn {
  learnerText: string;
  result: CoachResult;
}

/**
 * Free-text coaching for the current S4 calculation step. The reply is
 * advisory text only: it cannot grade, unlock values or advance the step.
 */
export default function AskCoachPanel({ step }: { step: CalcStep }) {
  const session = useCoachSession((s) => s.session);
  const dispatch = useCoachSession((s) => s.dispatch);
  const [text, setText] = useState('');
  const [pending, setPending] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const learnerText = text.trim();
    if (!learnerText || pending) return;

    const progress = session.steps[step];
    const lastCalc = [...session.events].reverse().find((ev) => ev.type === 'calc_submitted' && ev.step === step);
    // Only what the coach needs for this step — no ids, names or other stages' data.
    const request: CoachRequest = {
      step,
      learnerMessage: learnerText,
      hintLevel: progress.hintLevel,
      solvedSteps: CALC_STEPS.filter((s) => session.steps[s].calcCorrect),
      stepReasonCorrect: progress.reasonCorrect,
      lastAttempt:
        lastCalc?.type === 'calc_submitted'
          ? { inputs: lastCalc.inputs.map((i) => i.slice(0, 40)), feedback: lastCalc.feedback }
          : null,
      prediction: session.prediction?.raw.slice(0, 40) ?? null,
    };

    setPending(true);
    const result = await askCoach(request);
    setPending(false);
    setTurns((prev) => [...prev, { learnerText, result }]);
    setText('');
    dispatch({
      type: 'LOG_COACH_EXCHANGE',
      step,
      exchange: {
        learnerText,
        source: result.source,
        replyType: result.reply.replyType,
        possibleMisconception: result.reply.misconception.detected ? result.reply.misconception.code : null,
      },
    });
  };

  return (
    <section className="space-y-3 rounded-lg border border-cyan-400/20 bg-cyan-500/5 p-3" aria-label={L.coach.title}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-cyan-200">
        <MessageCircle className="h-4 w-4" /> {L.coach.title}
      </h3>
      <p className="text-xs text-slate-300">
        {L.coach.intro} <span className="text-slate-400">{L.coach.privacy}</span>
      </p>

      {turns.length > 0 && (
        <ol className="space-y-3" aria-live="polite" data-testid="coach-turns">
          {turns.map((turn, i) => (
            <li key={i} className="space-y-1.5">
              <p className="rounded-lg bg-slate-800/80 px-3 py-2 text-sm text-slate-100">
                <span className="font-semibold text-slate-300">Em: </span>
                {turn.learnerText}
              </p>
              <div className="rounded-lg bg-indigo-500/10 px-3 py-2 text-sm text-indigo-50" data-coach-source={turn.result.source}>
                <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-indigo-300">
                  <Bot className="h-3.5 w-3.5" />
                  {turn.result.source === 'ai' ? L.coach.sourceAi : L.coach.sourceFallback}
                </p>
                {turn.result.reply.misconception.detected && (
                  <p className="mb-1 text-xs text-amber-200">
                    {L.coach.possibleMisconception}
                    {turn.result.reply.misconception.evidence ? `: ${turn.result.reply.misconception.evidence}` : '.'}
                  </p>
                )}
                {/* Rendered as plain text (React escapes it); never as HTML. */}
                <p className="whitespace-pre-line">{turn.result.reply.message}</p>
                {turn.result.reply.question && <p className="mt-1 font-medium text-cyan-200">{turn.result.reply.question}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={onSubmit} className="space-y-2">
        <label htmlFor={`coach-${step}`} className="sr-only">
          {L.coach.title}
        </label>
        <textarea
          id={`coach-${step}`}
          rows={2}
          maxLength={LEARNER_MESSAGE_MAX}
          value={text}
          disabled={pending}
          onChange={(e) => setText(e.target.value)}
          placeholder={L.coach.placeholder}
          className="w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40"
        />
        <button
          type="submit"
          disabled={pending || !text.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
          {pending ? L.coach.loading : L.coach.submit}
        </button>
      </form>
    </section>
  );
}
