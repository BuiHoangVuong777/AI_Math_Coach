import { FormEvent, ReactNode, useState } from 'react';
import { Check, Lightbulb, X } from 'lucide-react';
import { CYLINDER_LESSON as L } from '@/data/lessons/cylinderLesson';
import {
  AnalysisField,
  AnalysisInput,
  CALC_STEPS,
  CalcStep,
  FeedbackCode,
  MAX_HINT_LEVEL,
  SUMMARY_LIMITATION,
  buildSummary,
  expectedCalc,
  isStepComplete,
} from '@/lib/cylinder/session';
import { formatPi } from '@/lib/cylinder/math';
import { useCoachSession } from '@/stores/coachSessionStore';
import AskCoachPanel from './AskCoachPanel';

// ---------------------------------------------------------------- shared UI

const inputClass =
  'w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40';
const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400';
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400';

export function CoachBubble({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-3 text-sm leading-relaxed text-indigo-100">
      <span className="mr-1 font-semibold text-indigo-300">Coach:</span>
      {children}
    </div>
  );
}

/** Feedback always pairs an icon and words with colour (NFR-A11Y-002). */
function Feedback({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <p role="status" className={`mt-1 flex items-start gap-1.5 text-xs ${ok ? 'text-emerald-300' : 'text-amber-200'}`}>
      {ok ? <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <X className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-white/10 bg-slate-900/60 p-4">
      {title && <h2 className="text-base font-semibold text-white">{title}</h2>}
      {children}
    </section>
  );
}

function Choice({ name, options, value, onChange, disabled }: {
  name: string;
  options: readonly { id: string; text: string }[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" className="space-y-2">
      {options.map((o) => (
        <label
          key={o.id}
          className={`flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
            value === o.id ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-white/10 bg-slate-950/40 hover:border-white/25'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={o.id}
            checked={value === o.id}
            onChange={() => onChange(o.id)}
            disabled={disabled}
            className="mt-1 accent-cyan-400"
          />
          <span>{o.text}</span>
        </label>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- problem

export function ProblemCard() {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-slate-400">Đề bài · {L.grade}</p>
      <p className="text-base leading-relaxed text-slate-100">
        {L.problem.map((seg, i) =>
          seg.key ? (
            <mark key={i} className="rounded bg-amber-400/20 px-0.5 text-amber-100">
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          ),
        )}
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------- S1

const EMPTY_ANALYSIS: AnalysisInput = { r1: '', r2: '', h: '', unit: '', fixed: '', target: '' };

export function AnalysisStage() {
  const feedback = useCoachSession((s) => s.session.analysisFeedback);
  const dispatch = useCoachSession((s) => s.dispatch);
  const [input, setInput] = useState<AnalysisInput>(EMPTY_ANALYSIS);
  const set = (field: AnalysisField) => (value: string) => setInput((prev) => ({ ...prev, [field]: value }));

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SUBMIT_ANALYSIS', input });
  };

  const fieldFeedback = (field: AnalysisField) => {
    const code = feedback?.[field];
    if (!code) return null;
    return <Feedback ok={code === 'ok'}>{L.analysisFeedback[code] ?? L.analysisFeedback.wrong_value}</Feedback>;
  };

  const lengthField = (field: 'r1' | 'r2' | 'h') => (
    <div>
      <label htmlFor={`an-${field}`} className="mb-1 block text-xs text-slate-300">
        {L.analysisLabels[field]} (cm)
      </label>
      <input
        id={`an-${field}`}
        inputMode="decimal"
        className={inputClass}
        value={input[field]}
        onChange={(e) => set(field)(e.target.value)}
      />
      {fieldFeedback(field)}
    </div>
  );

  const select = (field: 'unit' | 'fixed' | 'target', options: readonly { id: string; text: string }[]) => (
    <div>
      <label htmlFor={`an-${field}`} className="mb-1 block text-xs text-slate-300">
        {L.analysisLabels[field]}
      </label>
      <select id={`an-${field}`} className={inputClass} value={input[field]} onChange={(e) => set(field)(e.target.value)}>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.text}
          </option>
        ))}
      </select>
      {fieldFeedback(field)}
    </div>
  );

  return (
    <Card title="Bước 1 · Hiểu đề">
      <CoachBubble>
        {L.analysis.intro} {L.analysis.questions}
      </CoachBubble>
      <form onSubmit={onSubmit} className="space-y-4" aria-label="Phân tích đề">
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-semibold text-slate-200">Dữ kiện</legend>
          <div className="grid grid-cols-3 gap-2">
            {lengthField('r1')}
            {lengthField('r2')}
            {lengthField('h')}
          </div>
          {select('unit', L.analysis.unitOptions)}
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold text-slate-200">Ẩn số</legend>
          <p className="text-sm text-slate-300">{L.analysis.unknowns}</p>
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold text-slate-200">Điều kiện</legend>
          {select('fixed', L.analysis.fixedOptions)}
        </fieldset>
        <fieldset>
          <legend className="mb-1 text-sm font-semibold text-slate-200">Cần tìm</legend>
          {select('target', L.analysis.targetOptions)}
        </fieldset>
        <button type="submit" className={primaryButton}>
          Kiểm tra phân tích
        </button>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------- S2

export function FigureStage() {
  const feedback = useCoachSession((s) => s.session.figureFeedback);
  const dispatch = useCoachSession((s) => s.dispatch);
  const [choice, setChoice] = useState('');

  return (
    <Card title="Bước 2 · Quan sát mô hình">
      <Feedback ok>{L.analysis.done}</Feedback>
      <CoachBubble>{L.figure.intro}</CoachBubble>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (choice) dispatch({ type: 'ANSWER_FIGURE', choice: choice as 'radius' | 'diameter' | 'height' });
        }}
      >
        <p className="text-sm font-medium text-slate-100">{L.figure.question}</p>
        <Choice name="figure" options={L.figure.options} value={choice} onChange={setChoice} />
        {feedback === 'wrong' && <Feedback ok={false}>{L.figure.wrong}</Feedback>}
        <button type="submit" className={primaryButton} disabled={!choice}>
          Trả lời
        </button>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------- S3

export function PredictionStage() {
  const error = useCoachSession((s) => s.session.predictionError);
  const dispatch = useCoachSession((s) => s.dispatch);
  const [raw, setRaw] = useState('');

  return (
    <Card title="Bước 3 · Dự đoán">
      <Feedback ok>Đúng: đó là bán kính, đi từ tâm đáy ra mép đáy.</Feedback>
      <CoachBubble>
        {L.prediction.question} {L.prediction.note}
      </CoachBubble>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ type: 'SUBMIT_PREDICTION', raw, source: 'learner' });
        }}
      >
        <label htmlFor="prediction" className="flex items-center gap-2 text-sm text-slate-200">
          Thể tích sẽ gấp
          <input
            id="prediction"
            inputMode="decimal"
            className={`${inputClass} w-24`}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          lần
        </label>
        {error && <Feedback ok={false}>{L.prediction.invalid}</Feedback>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={primaryButton} disabled={!raw.trim()}>
            Gửi dự đoán
          </button>
          <button
            type="button"
            className={secondaryButton}
            onClick={() => dispatch({ type: 'SUBMIT_PREDICTION', raw: '2', source: 'demo' })}
          >
            {L.prediction.demoLabel}
          </button>
        </div>
        <p className="text-xs text-slate-400">{L.prediction.demoNote}</p>
      </form>
    </Card>
  );
}

// ---------------------------------------------------------------- S4

function Hints({ hints, level, onRequest }: { hints: readonly string[]; level: number; onRequest: () => void }) {
  return (
    <div className="space-y-2">
      {hints.slice(0, level).map((h, i) => (
        <p key={i} className="flex gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <span>
            <span className="font-semibold">Gợi ý {i + 1}:</span> {h}
          </span>
        </p>
      ))}
      <button type="button" className={secondaryButton} onClick={onRequest} disabled={level >= MAX_HINT_LEVEL}>
        <Lightbulb className="h-4 w-4" />
        {level >= MAX_HINT_LEVEL ? 'Đã dùng hết gợi ý' : `Xin gợi ý (${level}/${MAX_HINT_LEVEL})`}
      </button>
    </div>
  );
}

function ExplainCard({ what, why }: { what: string; why: string }) {
  return (
    <dl className="grid gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm">
      <div>
        <dt className="font-semibold text-emerald-300">Làm gì</dt>
        <dd className="text-slate-100">{what}</dd>
      </div>
      <div>
        <dt className="font-semibold text-emerald-300">Vì sao đúng</dt>
        <dd className="text-slate-100">{why}</dd>
      </div>
    </dl>
  );
}

function ExperimentStep() {
  const session = useCoachSession((s) => s.session);
  const dispatch = useCoachSession((s) => s.dispatch);
  const done = isStepComplete(session, 'experiment');

  return (
    <Card title={L.experiment.title}>
      <p className="text-sm text-slate-300">
        <span className="font-semibold text-slate-100">Mục tiêu:</span> {L.experiment.goal}
      </p>
      <CoachBubble>{L.experiment.prompt}</CoachBubble>
      {done ? (
        <>
          <Feedback ok>{L.experiment.done}</Feedback>
          <button type="button" className={primaryButton} onClick={() => dispatch({ type: 'NEXT_STEP' })}>
            Bắt đầu tính
          </button>
        </>
      ) : (
        <>
          <button type="button" className={primaryButton} onClick={() => dispatch({ type: 'CONFIRM_EXPERIMENT' })}>
            {L.experiment.confirm}
          </button>
          {session.experimentFeedback === 'set_radius_to_4' && <Feedback ok={false}>{L.experiment.notYet}</Feedback>}
          <Hints
            hints={L.experiment.hints}
            level={session.experimentHintLevel}
            onRequest={() => dispatch({ type: 'REQUEST_HINT', step: 'experiment' })}
          />
        </>
      )}
    </Card>
  );
}

function CalcStepCard({ step }: { step: CalcStep }) {
  const session = useCoachSession((s) => s.session);
  const dispatch = useCoachSession((s) => s.dispatch);
  const content = L.steps[step];
  const progress = session.steps[step];
  const [inputs, setInputs] = useState<string[]>(() => content.fields.map(() => ''));
  const [reason, setReason] = useState('');
  const isLast = step === 'ratio';
  const done = progress.calcCorrect && progress.reasonCorrect;

  const feedbackText = (code: FeedbackCode) => L.calcFeedback[code] ?? L.calcFeedback.wrong_value;

  return (
    <Card title={content.title}>
      <p className="text-sm text-slate-300">
        <span className="font-semibold text-slate-100">Mục tiêu:</span> {content.goal}
      </p>
      <CoachBubble>{content.prompt}</CoachBubble>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ type: 'SUBMIT_CALC', step, inputs });
        }}
      >
        <div className={`grid gap-2 ${content.fields.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {content.fields.map((f, i) => (
            <div key={f.label}>
              <label htmlFor={`calc-${step}-${i}`} className="mb-1 block text-xs text-slate-300">
                {f.label} <span className="text-slate-500">({f.unit})</span>
              </label>
              <input
                id={`calc-${step}-${i}`}
                className={inputClass}
                placeholder={f.placeholder}
                value={inputs[i]}
                disabled={progress.calcCorrect}
                onChange={(e) => setInputs((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
              />
              {progress.calcFeedback && (
                <Feedback ok={progress.calcFeedback[i] === 'ok'}>{feedbackText(progress.calcFeedback[i])}</Feedback>
              )}
            </div>
          ))}
        </div>
        {!progress.calcCorrect && (
          <button type="submit" className={primaryButton} disabled={inputs.some((v) => !v.trim())}>
            Kiểm tra phép tính
          </button>
        )}
      </form>

      {progress.calcCorrect && (
        <form
          className="space-y-3 border-t border-white/10 pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (reason) dispatch({ type: 'SUBMIT_REASON', step, choice: reason });
          }}
        >
          <p className="text-sm font-medium text-slate-100">{content.reasonQuestion}</p>
          <Choice name={`reason-${step}`} options={content.reasonOptions} value={reason} onChange={setReason} disabled={done} />
          {progress.reasonFeedback && (
            <Feedback ok={progress.reasonFeedback === 'ok'}>{feedbackText(progress.reasonFeedback)}</Feedback>
          )}
          {!done && (
            <button type="submit" className={primaryButton} disabled={!reason}>
              Kiểm tra lý do
            </button>
          )}
        </form>
      )}

      {!done && (
        <Hints
          hints={content.hints}
          level={progress.hintLevel}
          onRequest={() => dispatch({ type: 'REQUEST_HINT', step })}
        />
      )}

      {done && (
        <>
          <ExplainCard what={content.what} why={content.why} />
          {isLast && session.prediction && (
            <p className="rounded-lg bg-slate-800/80 p-3 text-sm text-slate-100">
              Dự đoán ban đầu của em: <strong>“{session.prediction.raw}”</strong>
              {session.prediction.source === 'demo' && ' (dự đoán minh họa)'}. Kết quả tính: gấp{' '}
              <strong>{expectedCalc('ratio')[0]} lần</strong>.{' '}
              {session.prediction.verdict === 'correct'
                ? 'Dự đoán của em khớp với kết quả.'
                : 'Hai kết quả khác nhau — vì bán kính được bình phương, không tăng cùng tỷ lệ với thể tích.'}
            </p>
          )}
          <button type="button" className={primaryButton} onClick={() => dispatch({ type: 'NEXT_STEP' })}>
            {isLast ? 'Sang bài tự kiểm chứng' : 'Sang bước tiếp theo'}
          </button>
        </>
      )}

      <AskCoachPanel step={step} />
    </Card>
  );
}

function CompletedSteps() {
  const session = useCoachSession((s) => s.session);
  const completed = CALC_STEPS.filter((s) => isStepComplete(session, s) && s !== session.s4Step);
  if (!completed.length) return null;
  return (
    <ul className="space-y-1 text-sm text-slate-300" aria-label="Các bước đã hoàn thành">
      {completed.map((step) => {
        const values = expectedCalc(step);
        const text =
          step === 'area'
            ? `A₁ = ${formatPi(values[0])} cm², A₂ = ${formatPi(values[1])} cm²`
            : step === 'volume'
              ? `V₁ = ${formatPi(values[0])} cm³, V₂ = ${formatPi(values[1])} cm³`
              : `V₂/V₁ = ${values[0]}`;
        return (
          <li key={step} className="flex items-center gap-2">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>
              {L.steps[step].title}: {text}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function SolveStage() {
  const session = useCoachSession((s) => s.session);
  return (
    <div className="space-y-3">
      {session.prediction && (
        <p className="text-xs text-slate-400">
          {L.prediction.saved} Dự đoán đã lưu: “{session.prediction.raw}”
          {session.prediction.source === 'demo' ? ' (minh họa)' : ''}.
        </p>
      )}
      <CompletedSteps />
      {session.s4Step === 'experiment' ? (
        <ExperimentStep />
      ) : (
        <CalcStepCard key={session.s4Step} step={session.s4Step} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- S5

export function TransferStage() {
  const session = useCoachSession((s) => s.session);
  const dispatch = useCoachSession((s) => s.dispatch);
  const [answer, setAnswer] = useState('');
  const [reason, setReason] = useState('');
  const evaluation = session.transferEvaluation;
  const submitted = session.transfer !== null;

  return (
    <Card title="Bước 5 · Tự kiểm chứng">
      <CoachBubble>{L.transfer.intro}</CoachBubble>
      <p className="rounded-lg bg-slate-950/60 p-3 text-base leading-relaxed text-slate-100">{L.transfer.problem}</p>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ type: 'SUBMIT_TRANSFER', answerRaw: answer, reasonRaw: reason });
        }}
      >
        <label htmlFor="transfer-answer" className="flex items-center gap-2 text-sm text-slate-200">
          {L.transfer.answerLabel}
          <input
            id="transfer-answer"
            inputMode="decimal"
            className={`${inputClass} w-24`}
            value={submitted ? session.transfer!.answerRaw : answer}
            disabled={submitted}
            onChange={(e) => setAnswer(e.target.value)}
          />
          lần
        </label>
        <div>
          <label htmlFor="transfer-reason" className="mb-1 block text-sm text-slate-200">
            {L.transfer.reasonLabel}
          </label>
          <textarea
            id="transfer-reason"
            rows={3}
            className={inputClass}
            placeholder={L.transfer.reasonPlaceholder}
            value={submitted ? session.transfer!.reasonRaw : reason}
            disabled={submitted}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        {session.transferError && <Feedback ok={false}>{L.transfer.empty}</Feedback>}
        {!submitted && (
          <button type="submit" className={primaryButton} disabled={!answer.trim()}>
            Gửi bài (không sửa được sau khi gửi)
          </button>
        )}
      </form>

      {evaluation && (
        <div className="space-y-3 border-t border-white/10 pt-3" aria-live="polite">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-950/60 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Đáp án</p>
              <Feedback ok={evaluation.answerVerdict === 'correct'}>
                {evaluation.answerVerdict === 'correct'
                  ? `Đúng: thể tích gấp ${evaluation.expectedFactor} lần.`
                  : evaluation.answerVerdict === 'incorrect'
                    ? `Chưa đúng. Kết quả kiểm chứng là gấp ${evaluation.expectedFactor} lần.`
                    : 'Không đọc được số trong câu trả lời.'}
              </Feedback>
              <p className="mt-2 text-xs text-slate-400">{evaluation.method}</p>
            </div>
            <div className="rounded-lg bg-slate-950/60 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400">Lập luận</p>
              <Feedback ok={evaluation.reasonVerdict === 'sufficient'}>
                {evaluation.reasonVerdict === 'sufficient'
                  ? 'Đủ bằng chứng: lập luận nêu đúng quan hệ cần thiết.'
                  : evaluation.reasonVerdict === 'partial'
                    ? 'Một phần / chưa đủ bằng chứng: lập luận có ý liên quan nhưng chưa đầy đủ.'
                    : 'Chưa có bằng chứng về lập luận.'}
              </Feedback>
              <p className="mt-2 text-xs text-slate-400">{L.transfer.reasonRule}</p>
            </div>
          </div>
          <button type="button" className={primaryButton} onClick={() => dispatch({ type: 'FINISH' })}>
            Xem tổng kết phiên
          </button>
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------- S6

export function SummaryStage() {
  const session = useCoachSession((s) => s.session);
  const dispatch = useCoachSession((s) => s.dispatch);
  const items = buildSummary(session);

  return (
    <Card title="Bước 6 · Bằng chứng học tập trong phiên">
      <dl className="divide-y divide-white/10">
        {items.map((item) => (
          <div key={item.id} className="grid gap-1 py-2 sm:grid-cols-[220px_1fr]">
            <dt className="text-sm font-medium text-slate-300">{item.label}</dt>
            <dd className="text-sm text-slate-100">
              {item.value ?? <span className="italic text-slate-400">chưa có bằng chứng</span>}
              {item.sources.length > 0 && (
                <span className="ml-2 text-xs text-slate-500">(bản ghi #{item.sources.join(', #')})</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      <p className="rounded-lg border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-100">{SUMMARY_LIMITATION}</p>
      <details className="text-xs text-slate-400">
        <summary className="cursor-pointer text-slate-300">Nhật ký bằng chứng ({session.events.length} bản ghi)</summary>
        <ol className="mt-2 space-y-1 font-mono">
          {session.events.map((e) => (
            <li key={e.seq}>
              #{e.seq} · {e.stage} · {e.type}
            </li>
          ))}
        </ol>
      </details>
      <button type="button" className={secondaryButton} onClick={() => dispatch({ type: 'RESET' })}>
        Bắt đầu phiên mới
      </button>
    </Card>
  );
}
