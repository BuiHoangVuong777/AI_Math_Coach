import { useState, type FormEvent } from 'react';
import { CheckCircle2, FileQuestion, Loader2 } from 'lucide-react';
import { PROBLEM_STATUS_TEXT, SAMPLE_PROBLEMS } from '@/data/canvas/copy';
import { formatExact, fromDecimal } from '@/lib/reasoning/exact';
import { displaySymbol } from '@/lib/reasoning/expr';
import { groundedSpan, type ProblemForm } from '@/lib/reasoning/problemParser';
import { KIND_LABEL } from '@/lib/reasoning/rules';
import type { Kind, ProblemSpec, Span, SymbolId, Unit } from '@/lib/reasoning/types';
import { LIMITS } from '@/lib/reasoning/types';
import { useCanvas, type Group } from '@/stores/reasoningSessionStore';

export function ProblemInput() {
  const { problemText, setProblemText, submitProblem, pending } = useCanvas();
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submitProblem();
  };
  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-3 rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <h2 className="text-lg font-semibold text-white">1. Nhập đề bài</h2>
      <p className="text-sm text-slate-300">
        Nhập một bài về <strong>hình trụ</strong> (bán kính, đường kính, chiều cao, diện tích đáy, thể tích). Đừng ghi tên
        hay thông tin cá nhân vào đề.
      </p>
      <label htmlFor="problem-text" className="sr-only">Đề bài</label>
      <textarea
        id="problem-text"
        value={problemText}
        onChange={(e) => setProblemText(e.target.value)}
        maxLength={LIMITS.problemText}
        rows={5}
        className="w-full rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        placeholder="Ví dụ: Một cốc hình trụ có đường kính đáy 6 cm và chiều cao 10 cm…"
      />
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="sample" className="text-xs text-slate-400">Đề mẫu:</label>
        <select
          id="sample"
          className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-xs text-slate-200"
          value=""
          onChange={(e) => e.target.value && setProblemText(e.target.value)}
        >
          <option value="">— chọn để điền —</option>
          {SAMPLE_PROBLEMS.map((s) => <option key={s.label} value={s.text}>{s.label}</option>)}
        </select>
        <span className="ml-auto text-xs text-slate-500">{problemText.length}/{LIMITS.problemText}</span>
        <button type="submit" disabled={!problemText.trim() || pending} className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40">
          {pending && <Loader2 className="h-4 w-4 animate-spin" />} Phân tích đề
        </button>
      </div>
    </form>
  );
}

function Highlighted({ text, span }: { text: string; span: Span | null }) {
  if (!span) return <>{text}</>;
  return (
    <>
      {text.slice(0, span.start)}
      <mark className="rounded bg-amber-400/30 px-0.5 text-amber-100">{text.slice(span.start, span.end)}</mark>
      {text.slice(span.end)}
    </>
  );
}

const GROUPS: { key: Group; label: string }[] = [
  { key: 'givens', label: 'Dữ kiện' },
  { key: 'unknowns', label: 'Ẩn số' },
  { key: 'conditions', label: 'Điều kiện' },
  { key: 'target', label: 'Cần tìm' },
];

export function ProblemReview() {
  const s = useCanvas();
  const d = s.draft!;
  const [focus, setFocus] = useState<Span | null>(null);
  const [showForm, setShowForm] = useState(d.interpretationStatus === 'unsupported' && d.givens.length === 0);
  const blocked = d.interpretationStatus !== 'draft';
  const allConfirmed = GROUPS.every((g) => s.confirmedGroups.includes(g.key));
  const kindOf = (sym: SymbolId) => sym[0] as Kind;

  const unknownSyms = d.unknowns.map((u) => u.symbol);
  const baseUnknowns = unknownSyms.filter((u) => !u.startsWith('k'));

  return (
    <div className="mx-auto max-w-4xl space-y-3">
      <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4" aria-label="Đề bài">
        <h2 className="mb-2 text-lg font-semibold text-white">2. Kiểm tra cách hệ thống hiểu đề</h2>
        <p className="text-sm leading-relaxed text-slate-200" data-testid="problem-text"><Highlighted text={d.text} span={focus} /></p>
        <p className="mt-2 text-xs text-slate-400">
          Nguồn diễn giải: {d.interpretationProvenance === 'llm_interpretation' ? 'AI (đã kiểm tra bám đúng chữ trong đề)' : d.interpretationProvenance === 'learner_form' ? 'em tự khai báo' : 'quy tắc xác định'} ·
          Chọn một mục để tô đoạn tương ứng trong đề.
        </p>
      </section>

      {d.interpretationStatus === 'unsupported' || d.interpretationStatus === 'insufficient' ? (
        <section role="alert" className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100" data-testid="problem-status">
          <p className="flex items-center gap-2 font-semibold"><FileQuestion className="h-4 w-4" /> {d.interpretationStatus === 'unsupported' ? 'Đề này nằm ngoài phạm vi POC' : 'Đề chưa đủ dữ kiện'}</p>
          <ul className="mt-1 list-disc pl-5">
            {d.statusReasons.map((r) => (
              <li key={r}>{r.startsWith('missing:') ? `Thiếu ${KIND_LABEL[r[8] as Kind] ?? r.slice(8)} (${displaySymbol(r.slice(8))}) — hệ thống không tự bổ sung.` : PROBLEM_STATUS_TEXT[r] ?? r}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {d.clarifications.map((c) => (
        <section key={c.id} className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100" data-testid="problem-clarification">
          <p className="font-semibold">Cần làm rõ</p>
          <p className="mt-1">{c.question}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {c.options.map((o, i) => (
              <button key={o.label} type="button" onClick={() => s.clarifyProblem(c.id, i)} className="rounded-lg bg-amber-400/20 px-2 py-1 text-xs hover:bg-amber-400/30">{o.label}</button>
            ))}
          </div>
        </section>
      ))}

      {(d.givens.length > 0 || d.unknowns.length > 0) && (
        <section className="grid gap-3 sm:grid-cols-2" aria-label="Bản phân tích đề">
          {GROUPS.map((g) => (
            <fieldset key={g.key} className="rounded-xl border border-white/10 bg-slate-900/60 p-3" data-group={g.key}>
              <legend className="px-1 text-sm font-semibold text-slate-100">{g.label}</legend>
              {g.key === 'givens' && d.givens.map((gv) => {
                const edit = s.edits[gv.symbol];
                const kind = edit?.kind ?? kindOf(gv.symbol);
                const value = edit ? formatExact(edit.value) : formatExact(gv.value);
                const grounded = edit ? !!groundedSpan(d.text, edit.kind, edit.value) : true;
                return (
                  <div key={gv.symbol} className="mt-1 flex flex-wrap items-center gap-2 text-sm" onFocus={() => setFocus(gv.sourceSpan)} onMouseEnter={() => setFocus(gv.sourceSpan)}>
                    <label className="sr-only" htmlFor={`kind-${gv.symbol}`}>Loại đại lượng</label>
                    <select id={`kind-${gv.symbol}`} value={kind} disabled={blocked} onChange={(e) => s.editGiven({ symbol: gv.symbol, kind: e.target.value as Kind, value: edit?.value ?? gv.value })} className="rounded border border-white/10 bg-slate-950 px-1 py-0.5 text-slate-100">
                      {(['r', 'd', 'h', 'A', 'V'] as Kind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                    </select>
                    <span className="text-slate-400">({d.cylinders.find((c) => c.index === Number(gv.symbol[1]))?.label})</span>
                    <label className="sr-only" htmlFor={`val-${gv.symbol}`}>Giá trị</label>
                    <input
                      id={`val-${gv.symbol}`}
                      defaultValue={value.replace(/π$/, '')}
                      disabled={blocked || gv.value.piPow === 1}
                      onBlur={(e) => {
                        try {
                          const v = fromDecimal(e.target.value.replace(',', '.').trim());
                          s.editGiven({ symbol: gv.symbol, kind, value: v });
                        } catch {
                          /* invalid number: keep draft */
                        }
                      }}
                      className="w-20 rounded border border-white/10 bg-slate-950 px-1 py-0.5 font-mono text-slate-100"
                    />
                    <span className="text-slate-400">{gv.unit}</span>
                    {!grounded && <span className="text-xs text-rose-300">✗ khác với cụm từ trong đề — sẽ được giữ như khai báo của em</span>}
                  </div>
                );
              })}
              {g.key === 'unknowns' && (baseUnknowns.length ? baseUnknowns.map((u) => <p key={u} className="mt-1 text-sm text-slate-200">{displaySymbol(u)} — {KIND_LABEL[u[0] as Kind]}</p>) : <p className="mt-1 text-sm text-slate-400">Không có ẩn số độ dài/diện tích/thể tích riêng; đề hỏi một hệ số.</p>)}
              {g.key === 'conditions' && (
                <>
                  {d.constraints.map((c) => <p key={c.id} className="mt-1 text-sm text-slate-200" tabIndex={0} onFocus={() => setFocus(c.sourceSpan)} onMouseEnter={() => setFocus(c.sourceSpan)}>{KIND_LABEL[c.symbols[0][0] as Kind]} giữ nguyên</p>)}
                  {d.relations.map((r) => <p key={r.id} className="mt-1 text-sm text-slate-200" tabIndex={0} onFocus={() => setFocus(r.sourceSpan)} onMouseEnter={() => setFocus(r.sourceSpan)}>{r.expr.replace(/([rdhAV])([12])/g, (_, a, b) => displaySymbol(a + b))}</p>)}
                  {!d.constraints.length && !d.relations.length && <p className="mt-1 text-sm text-slate-400">Không có điều kiện thêm.</p>}
                </>
              )}
              {g.key === 'target' && d.unknowns.map((u) => (
                <p key={u.symbol} className="mt-1 text-sm text-slate-200" tabIndex={0} onFocus={() => setFocus(u.sourceSpan)} onMouseEnter={() => setFocus(u.sourceSpan)}>
                  {u.symbol.startsWith('k') ? `Hệ số ${displaySymbol(u.symbol)}` : displaySymbol(u.symbol)} · “{u.askedAs}”
                </p>
              ))}
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                <input type="checkbox" disabled={blocked} checked={s.confirmedGroups.includes(g.key)} onChange={() => s.toggleGroup(g.key)} data-confirm={g.key} />
                Em xác nhận nhóm “{g.label}”
              </label>
            </fieldset>
          ))}
        </section>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={s.backToInput} className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">← Sửa đề</button>
        <button type="button" onClick={() => setShowForm((v) => !v)} className="rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">Tự khai báo dữ kiện (biểu mẫu)</button>
        <button
          type="button"
          disabled={blocked || !allConfirmed}
          onClick={s.confirm}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          <CheckCircle2 className="h-4 w-4" /> Xác nhận và bắt đầu giải
        </button>
      </div>
      {showForm && <ProblemFormPanel text={d.text} />}
    </div>
  );
}

function ProblemFormPanel({ text }: { text: string }) {
  const useForm = useCanvas((s) => s.useForm);
  const [unit, setUnit] = useState<Unit>('cm');
  const [two, setTwo] = useState(true);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [fixed, setFixed] = useState<('r' | 'h')[]>(['h']);
  const [unknown, setUnknown] = useState<SymbolId>('kV');
  const fields = two ? ['r1', 'd1', 'h1', 'r2', 'd2', 'h2'] : ['r1', 'd1', 'h1'];
  const submit = () => {
    const values: ProblemForm['values'] = {};
    for (const f of fields) if (vals[f]?.trim()) values[f as keyof ProblemForm['values']] = Number(vals[f].replace(',', '.'));
    useForm({ text, unit, twoCylinders: two, values, fixed: two ? fixed : [], unknown });
  };
  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200" aria-label="Biểu mẫu khai báo">
      <p className="mb-2 text-slate-300">Dùng khi hệ thống chưa đọc được đề: em tự khai báo, hệ thống vẫn kiểm tra phạm vi.</p>
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-1">Đơn vị
          <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className="rounded bg-slate-950 px-1">{['mm', 'cm', 'dm', 'm'].map((u) => <option key={u}>{u}</option>)}</select>
        </label>
        <label className="flex items-center gap-1"><input type="checkbox" checked={two} onChange={(e) => setTwo(e.target.checked)} /> Hai hình trụ</label>
        {fields.map((f) => (
          <label key={f} className="flex items-center gap-1">{displaySymbol(f)}
            <input value={vals[f] ?? ''} onChange={(e) => setVals({ ...vals, [f]: e.target.value })} className="w-16 rounded bg-slate-950 px-1 font-mono" />
          </label>
        ))}
        {two && (['r', 'h'] as const).map((k) => (
          <label key={k} className="flex items-center gap-1"><input type="checkbox" checked={fixed.includes(k)} onChange={() => setFixed(fixed.includes(k) ? fixed.filter((x) => x !== k) : [...fixed, k])} /> {KIND_LABEL[k]} giữ nguyên</label>
        ))}
        <label className="flex items-center gap-1">Cần tìm
          <select value={unknown} onChange={(e) => setUnknown(e.target.value as SymbolId)} className="rounded bg-slate-950 px-1">
            {(two ? ['kV', 'kA', 'V2', 'V1'] : ['V1', 'A1', 'h1', 'r1']).map((u) => <option key={u} value={u}>{displaySymbol(u)}</option>)}
          </select>
        </label>
        <button type="button" onClick={submit} className="rounded-lg bg-indigo-500 px-3 py-1 font-semibold text-white">Dùng khai báo này</button>
      </div>
    </section>
  );
}

export type { ProblemSpec };
