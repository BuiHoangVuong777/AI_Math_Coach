import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Sparkles, X } from 'lucide-react';
import { DEMO_SCENARIOS } from '@/data/canvas/demoScenarios';

const button = 'inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-50';

export default function DemoScenarios({ onUse }: { onUse: (problem: string) => void }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={trigger} type="button" aria-haspopup="dialog" aria-expanded={open} className={`${button} border-cyan-400/40 bg-cyan-400/10 text-cyan-100`} onClick={() => setOpen(true)}>
      <Sparkles size={15} aria-hidden="true" /> Kịch bản demo
    </button>
    {open && <DemoDialog onClose={() => setOpen(false)} onUse={onUse} returnFocus={() => trigger.current?.focus()} />}
  </>;
}

function DemoDialog({ onClose, onUse, returnFocus }: { onClose: () => void; onUse: (problem: string) => void; returnFocus: () => void }) {
  const [active, setActive] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState('');
  const dialog = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const mounted = useRef(true);
  const demo = DEMO_SCENARIOS[active];
  useEffect(() => {
    mounted.current = true;
    const root = document.getElementById('root');
    const previousInert = root?.inert;
    const overflow = document.body.style.overflow;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
    return () => {
      mounted.current = false;
      clearTimeout(timer.current);
      if (root) root.inert = previousInert ?? false;
      document.body.style.overflow = overflow;
      returnFocus();
    };
  // Callbacks belong to this modal opening; avoid resetting focus on parent renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function copy(text: string, id: string, label: string) {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      if (!mounted.current) return;
      setCopied(id); setFeedback(`Đã sao chép ${label}.`);
    } catch {
      if (!mounted.current) return;
      setCopied(''); setFeedback('Chưa sao chép được. Em có thể chọn văn bản và sao chép thủ công.');
    }
    timer.current = setTimeout(() => { setCopied(''); setFeedback(''); }, 2500);
  }
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md sm:p-6" data-testid="demo-backdrop">
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="demo-title" aria-describedby="demo-description" data-testid="demo-dialog"
        className="demo-dialog flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-900 shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
        onKeyDown={(e) => {
          if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); }
          if (e.key === 'Tab') {
            const nodes = [...dialog.current!.querySelectorAll<HTMLElement>('button, summary, [href], [tabindex="0"]')].filter(el => !el.hasAttribute('disabled') && el.getClientRects().length > 0);
            const first = nodes[0], last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
          }
        }}>
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 p-4 sm:p-6">
          <div><p className="mb-1 text-xs font-semibold uppercase tracking-widest text-cyan-300">Khám phá từng bước</p><h2 id="demo-title" className="text-xl font-semibold text-white">Kịch bản demo</h2><p id="demo-description" className="mt-2 text-sm text-slate-300">Chọn đề, sao chép từng bước khi cần. Đây là lời giải mẫu để tham khảo.</p></div>
          <button type="button" className={button} onClick={onClose} aria-label="Đóng kịch bản demo"><X size={18} aria-hidden="true" /><span className="hidden sm:inline">Đóng</span></button>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6" data-testid="demo-scroll">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Chọn kịch bản">
            {DEMO_SCENARIOS.map((s, i) => <button key={s.id} type="button" data-demo-id={s.id} aria-pressed={active === i}
              onClick={() => { setActive(i); setFeedback(''); setCopied(''); clearTimeout(timer.current); }}
              className={`rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${active === i ? 'border-cyan-300 bg-cyan-300/15 ring-1 ring-cyan-300/40' : 'border-white/15 bg-slate-950/40 hover:border-white/35'}`}>
              <span className="mb-2 flex items-center justify-between text-xs font-semibold text-cyan-200">Kịch bản {i + 1}{active === i && <Check size={16} aria-hidden="true" />}</span>
              <span className="block text-sm font-semibold text-white">{s.title}</span><span className="mt-1 block text-xs leading-relaxed text-slate-300">{s.subtitle}</span>
            </button>)}
          </div>
          <section className="mt-5 rounded-xl border border-white/10 bg-slate-950/50 p-4" aria-label="Đề bài demo">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold text-white">Đề bài</h3><button type="button" data-testid="copy-problem" className={button} onClick={() => void copy(demo.problem, 'problem', 'đề bài')}><Copy size={15} aria-hidden="true" />{copied === 'problem' ? 'Đã sao chép' : 'Sao chép đề'}</button></div>
            <p className="text-sm leading-7 text-slate-100" data-testid="demo-problem">{demo.problem}</p>
            <button type="button" className={`${button} mt-4 bg-indigo-500/20`} onClick={() => { onUse(demo.problem); onClose(); }}>Dùng đề này</button>
          </section>
          <h3 className="mb-3 mt-5 font-semibold text-white">Các bước suy luận mẫu</h3>
          <ol className="space-y-2">{demo.steps.map((text, i) => <li key={`${demo.id}-${i}`} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3" data-demo-step={i}>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-semibold text-cyan-200" aria-hidden="true">{i + 1}</span>
            <p className="min-w-0 flex-1 break-words text-sm leading-6 text-slate-100">{text}</p>
            <button type="button" className={`${button} shrink-0 px-2`} aria-label={`Sao chép bước ${i + 1}`} onClick={() => void copy(text, `step-${i}`, `bước ${i + 1}`)}>{copied === `step-${i}` ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}</button>
          </li>)}</ol>
          <details key={demo.id} className="mt-5 rounded-xl border border-white/15 p-4" data-testid="demo-answer"><summary className="cursor-pointer rounded text-sm font-medium text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300">Đáp án tham khảo</summary><p className="mt-3 text-sm leading-7 text-slate-300">{demo.answer}</p></details>
        </div>
        <div className="min-h-9 shrink-0 border-t border-white/10 px-4 py-2 text-xs text-cyan-200 sm:px-6" role="status" aria-live="polite" aria-atomic="true">{feedback || 'Chỉ sao chép mục em chọn; không tự gửi lời giải.'}</div>
      </div>
    </div>, document.body,
  );
}
