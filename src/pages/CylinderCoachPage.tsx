import { Link } from 'react-router-dom';
import { ArrowLeft, Lock, RotateCcw } from 'lucide-react';
import CylinderViewer from '@/components/coach/CylinderViewer';
import { REFERENCE_COLOR, COMPARISON_COLOR } from '@/components/three/CylinderPair';
import {
  AnalysisStage,
  FigureStage,
  PredictionStage,
  ProblemCard,
  SolveStage,
  SummaryStage,
  TransferStage,
} from '@/components/coach/CoachStages';
import { CYLINDER_LESSON, STAGE_LABELS } from '@/data/lessons/cylinderLesson';
import { MAIN_PROBLEM, RADIUS_SLIDER, baseAreaPiCoef, formatNumberVi, formatPi, volumePiCoef } from '@/lib/cylinder/math';
import { STAGES, Stage } from '@/lib/cylinder/session';
import { useCoachSession } from '@/stores/coachSessionStore';

function Stepper({ stage }: { stage: Stage }) {
  const current = STAGES.indexOf(stage);
  return (
    <ol className="flex flex-wrap gap-1.5" aria-label="Tiến trình bài học">
      {STAGES.map((s, i) => (
        <li
          key={s}
          aria-current={s === stage ? 'step' : undefined}
          className={`rounded-full px-2.5 py-1 text-xs ${
            s === stage
              ? 'bg-indigo-500 font-semibold text-white'
              : i < current
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-slate-800 text-slate-400'
          }`}
        >
          {i < current ? '✓ ' : ''}
          {s} · {STAGE_LABELS[s]}
        </li>
      ))}
    </ol>
  );
}

function RadiusControl() {
  const stage = useCoachSession((s) => s.session.stage);
  const radius = useCoachSession((s) => s.session.comparisonRadius);
  const dispatch = useCoachSession((s) => s.dispatch);
  const locked = stage !== 'S4';
  const r = formatNumberVi(radius);

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
      <label htmlFor="comparison-radius" className="flex items-center justify-between text-sm text-slate-200">
        <span>Bán kính hình So sánh</span>
        <span className="font-mono text-cyan-300">{r} cm</span>
      </label>
      <input
        id="comparison-radius"
        type="range"
        min={RADIUS_SLIDER.min}
        max={RADIUS_SLIDER.max}
        step={RADIUS_SLIDER.step}
        value={radius}
        disabled={locked}
        aria-valuetext={`${r} cm`}
        onChange={(e) => dispatch({ type: 'SET_RADIUS', value: parseFloat(e.target.value) })}
        className="mt-2 w-full accent-cyan-400 disabled:opacity-40"
      />
      <div className="flex justify-between text-[11px] text-slate-500">
        <span>{formatNumberVi(RADIUS_SLIDER.min)} cm</span>
        <span>Chiều cao cố định: {MAIN_PROBLEM.h} cm</span>
        <span>{formatNumberVi(RADIUS_SLIDER.max)} cm</span>
      </div>
      {locked && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <Lock className="h-3.5 w-3.5" /> Thanh trượt sẽ mở sau khi em gửi dự đoán.
        </p>
      )}
    </div>
  );
}

/** Values are computed from the current radius on every render, so revealed numbers never go stale (FR-CYL-004). */
function ValuesPanel() {
  const session = useCoachSession((s) => s.session);
  if (session.stage !== 'S4') {
    return (
      <p className="text-xs text-slate-400">
        Diện tích, thể tích và hệ số tăng sẽ được mở dần trong lúc em giải.
      </p>
    );
  }
  const { r1, h } = MAIN_PROBLEM;
  const r2 = session.comparisonRadius;
  const showArea = session.steps.area.calcCorrect;
  const showVolume = session.steps.volume.calcCorrect;
  const showRatio = session.steps.ratio.calcCorrect;
  const locked = (label: string) => (
    <span className="inline-flex items-center gap-1 text-slate-500">
      <Lock className="h-3 w-3" /> {label}
    </span>
  );

  const row = (name: string, color: string, r: number) => (
    <tr className="border-t border-white/5">
      <th scope="row" className="py-1.5 pr-2 text-left font-medium" style={{ color }}>
        {name}
      </th>
      <td className="font-mono">{formatNumberVi(r)} cm</td>
      <td className="font-mono">{h} cm</td>
      <td className="font-mono">{showArea ? `${formatPi(baseAreaPiCoef(r))} cm²` : locked('bước 1')}</td>
      <td className="font-mono">{showVolume ? `${formatPi(volumePiCoef({ r, h }))} cm³` : locked('bước 2')}</td>
    </tr>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-900/60 p-3">
      <table className="w-full text-xs text-slate-200 sm:text-sm" aria-label="Giá trị theo trạng thái hiện tại">
        <thead className="text-left text-slate-400">
          <tr>
            <th className="pb-1 font-normal">Hình</th>
            <th className="pb-1 font-normal">r</th>
            <th className="pb-1 font-normal">h</th>
            <th className="pb-1 font-normal">A = πr²</th>
            <th className="pb-1 font-normal">V = A·h</th>
          </tr>
        </thead>
        <tbody>
          {row('Tham chiếu', REFERENCE_COLOR, r1)}
          {row('So sánh', COMPARISON_COLOR, r2)}
        </tbody>
      </table>
      <p className="mt-2 text-sm text-slate-200">
        V₂/V₁ ={' '}
        {showRatio ? (
          <span className="font-mono text-cyan-300">
            {formatNumberVi(volumePiCoef({ r: r2, h }) / volumePiCoef({ r: r1, h }))}
          </span>
        ) : (
          locked('bước 3')
        )}
      </p>
    </div>
  );
}

function StagePanel({ stage }: { stage: Stage }) {
  switch (stage) {
    case 'S1':
      return <AnalysisStage />;
    case 'S2':
      return <FigureStage />;
    case 'S3':
      return <PredictionStage />;
    case 'S4':
      return <SolveStage />;
    case 'S5':
      return <TransferStage />;
    case 'S6':
      return <SummaryStage />;
  }
}

export default function CylinderCoachPage() {
  const stage = useCoachSession((s) => s.session.stage);
  const radius = useCoachSession((s) => s.session.comparisonRadius);
  const dispatch = useCoachSession((s) => s.dispatch);
  // 3D is required in S2–S4, not opened yet in S1, and hidden in S5/S6 (§7, §9.6).
  const showModel = stage === 'S2' || stage === 'S3' || stage === 'S4';
  const singleColumn = stage === 'S5' || stage === 'S6';

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0a0a1a] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Vũ trụ Toán học
          </Link>
          <h1 className="min-w-0 flex-1 text-base font-semibold text-white">
            AI Math Coach · <span className="font-normal text-slate-300">{CYLINDER_LESSON.title}</span>
          </h1>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Bắt đầu lại? Bằng chứng của phiên hiện tại sẽ bị xóa.')) dispatch({ type: 'RESET' });
            }}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Làm lại
          </button>
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-3">
          <Stepper stage={stage} />
        </div>
      </header>

      <main
        className={`mx-auto grid gap-4 p-4 ${
          singleColumn ? 'max-w-3xl' : 'max-w-7xl lg:grid-cols-[minmax(0,1fr)_420px]'
        }`}
      >
        {!singleColumn && (
          <section className="space-y-3" aria-label="Đề bài và mô hình">
            <ProblemCard />
            {showModel && (
              <>
                <CylinderViewer comparisonRadius={radius} />
                <RadiusControl />
                <ValuesPanel />
              </>
            )}
          </section>
        )}
        <section aria-label="Hướng dẫn của Coach">
          <StagePanel stage={stage} />
        </section>
      </main>
    </div>
  );
}
