import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import VoiceControls from '@/components/voice/VoiceControls';
import CoachPanel from '@/components/canvas/CoachPanel';
import MissionProgress from '@/components/canvas/MissionProgress';
import { IndependentView, SummaryView } from '@/components/canvas/EndStages';
import { ProblemInput, ProblemReview } from '@/components/canvas/ProblemStage';
import { RowsPanel } from '@/components/canvas/RowsPanel';
import VisualStage from '@/components/canvas/VisualStage';
import ExplainableGraph from '@/components/canvas/graph/ExplainableGraph';
import { useDemoAuth } from '@/stores/demoAuthStore';
import { useCanvas } from '@/stores/reasoningSessionStore';

const PHASE_LABEL: Record<string, string> = {
  problem_input: '1 · Nhập đề', problem_review: '2 · Xác nhận đề', reasoning: '3 · Suy luận', independent: '4 · Tự kiểm tra', summary: '5 · Tóm tắt',
};

function AiBadge() {
  const { status, degraded } = useCanvas();
  const label = degraded.offline || (status && !status.reachable)
    ? 'Ngoại tuyến · quy tắc xác định'
    : status?.tutorLLM
      ? degraded.tutor === 'rule_based' || degraded.parser ? 'AI (lượt này dùng chế độ cơ bản)' : `AI bật`
      : 'Chế độ cơ bản (không có AI)';
  return <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300" data-testid="ai-badge">{label}</span>;
}

export default function ReasoningCanvasPage() {
  const s = useCanvas();
  const auth = useDemoAuth();
  const [mobileTab, setMobileTab] = useState<'rows' | 'visual' | 'coach'>('rows');
  useEffect(() => {
    void s.loadStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const inspectGraph = import.meta.env.DEV && new URLSearchParams(window.location.search).get('inspect') === 'graph';
  const graphSpec = s.specs.find(spec => spec.renderer === 'reasoning_graph');
  const phase = s.ui === 'session' ? s.ctx!.phase : s.ui;

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0a0a1a] text-slate-100" data-phase={phase}>
      <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><ArrowLeft className="h-4 w-4" /> Vũ trụ Toán học</Link>
          <h1 className="min-w-0 flex-1 basis-full text-base font-semibold sm:basis-auto text-white">Math Reasoning Canvas <span className="font-normal text-slate-400">· hình trụ</span></h1>
          <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-xs text-indigo-200" aria-current="step" data-testid="phase">{PHASE_LABEL[phase]}</span>
          <AiBadge />
          <span className="text-xs text-amber-200">Tài khoản demo{auth.session?.mode === "offline" ? " · ngoại tuyến" : ""}</span>
          <button type="button" onClick={() => void auth.logout()} className="rounded-lg bg-slate-800 px-2 py-1 text-xs">Đăng xuất</button>
          <button type="button" onClick={() => window.confirm('Bắt đầu lại? Phiên hiện tại sẽ bị xóa (không lưu).') && s.reset()} className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-800 hover:text-white">
            <RotateCcw className="h-3.5 w-3.5" /> Làm lại
          </button>
        </div>
        {s.error && <p role="alert" className="mx-auto max-w-[1500px] px-4 pb-2 text-sm text-rose-300" data-testid="error">{s.error}</p>}
      </header>

      <main className="mx-auto max-w-[1500px] p-4">
        {s.ui === 'problem_input' && <ProblemInput />}
        {s.ui === 'problem_review' && s.draft && <ProblemReview />}
        {s.ui === 'session' && s.ctx?.phase === 'independent' && <IndependentView />}
        {s.ui === 'session' && s.ctx?.phase === 'summary' && <SummaryView />}
        {s.ui === 'session' && s.ctx?.phase === 'reasoning' && (
          <>
            <MissionProgress />
            <VoiceControls />
            <div role="tablist" aria-label="Khu vực" className="mb-3 flex gap-1 lg:hidden">
              {(['rows', 'visual', 'coach'] as const).map((t) => (
                <button key={t} role="tab" aria-selected={mobileTab === t} onClick={() => setMobileTab(t)} className={`rounded-lg px-3 py-1 text-xs ${mobileTab === t ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {{ rows: 'Lời giải', visual: 'Hình', coach: 'Coach' }[t]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_280px]">
              <div className={`min-w-0 space-y-3 ${mobileTab === 'rows' ? '' : 'hidden lg:block'}`}>
                <section className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-200" aria-label="Đề bài">
                  <p data-testid="problem-card">{s.ctx.problemSpec.text}</p>
                </section>
                <RowsPanel graph={s.ctx.graph} />
              </div>
              <div className={`min-w-0 ${mobileTab === 'visual' ? '' : 'hidden lg:block'}`}><VisualStage /></div>
              <div className={`min-w-0 ${mobileTab === 'coach' ? '' : 'hidden lg:block'}`}><CoachPanel /></div>
            </div>
            {inspectGraph && graphSpec && <section aria-label="Kiểm tra đồ thị nội bộ" className="mt-4" data-testid="graph-inspector"><ExplainableGraph spec={graphSpec} graph={s.ctx.graph} specs={s.specs} /></section>}
          </>
        )}
      </main>
    </div>
  );
}
