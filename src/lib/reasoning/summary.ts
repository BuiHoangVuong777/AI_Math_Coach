/**
 * Evidence-based summary (§7.9, generalises S6). Built only from recorded graph
 * events and nodes; every item cites event sequence numbers; missing evidence is
 * stated, never inferred.
 */
import { formatExact } from './exact.ts';
import { displaySymbol } from './expr.ts';
import { learnerNodes } from './graph.ts';
import type { DisclosureLevel, GraphEvent, IndependentState, ReasoningGraph, ReasoningNode } from './types.ts';

export interface SummaryItem {
  key: string;
  label: string;
  lines: string[];
  sourceSeqs: number[];
  missing: boolean;
  demo: boolean;
}

export const SUMMARY_LIMITATION =
  'Tóm tắt này chỉ phản ánh phiên học này; không phải đánh giá năng lực lâu dài.';

const MISC: Record<string, string> = {
  radius_diameter: 'nhầm bán kính/đường kính', linear_scaling: 'coi thể tích/diện tích tăng cùng tỉ lệ với bán kính',
  area_linear: 'coi diện tích tăng cùng tỉ lệ với bán kính', square_as_double: 'tính r² như 2r', missing_pi: 'thiếu π',
  forgot_height: 'quên nhân chiều cao', increase_vs_factor: 'nhầm “tăng thêm” với “gấp”', percent_vs_factor: 'nhầm phần trăm với số lần',
};

const seqOf = (events: GraphEvent[], pred: (e: GraphEvent) => boolean) => events.filter(pred).map((e) => e.seq);

function firstText(n: ReasoningNode): string {
  return n.history.length ? n.history[0].originalText : n.originalText;
}

export function buildSummary(graph: ReasoningGraph, independent: IndependentState | null, problemText: string): SummaryItem[] {
  const ev = graph.events;
  const nodes = learnerNodes(graph).filter((n) => n.rowIndex > 0 || n.id.startsWith('f1-'));
  const items: SummaryItem[] = [];
  const isDemo = (n: ReasoningNode) => n.source === 'demo_script';

  items.push({ key: 'problem', label: 'Đề bài', lines: [problemText], sourceSeqs: seqOf(ev, (e) => e.type === 'problem_confirmed'), missing: false, demo: false });

  const hyps = nodes.filter((n) => n.interpretation.semanticType === 'hypothesis' || n.history.some((h) => h.interpretation.semanticType === 'hypothesis'));
  items.push({
    key: 'hypotheses',
    label: 'Dự đoán / giả thuyết ban đầu (nguyên văn)',
    lines: hyps.map((n) => {
      const mis = n.validation?.possibleMisconceptions.map((m) => MISC[m.code] ?? m.code) ?? [];
      return `Bước ${n.rowIndex}: “${firstText(n)}” — ${n.validation?.status === 'valid' ? 'khớp' : n.validation?.status === 'invalid' ? 'chưa khớp' : 'chưa kết luận'}${mis.length ? ` (hiểu lầm có thể có: ${mis.join(', ')})` : ''}${isDemo(n) ? ' [dữ liệu minh họa]' : ''}${n.revisedBy.length ? ` → em đã sửa ở bước ${n.revisedBy.map((id) => graph.nodes[id]?.rowIndex).join(', ')}` : ''}`;
    }),
    sourceSeqs: seqOf(ev, (e) => e.type === 'row_submitted' && hyps.some((n) => n.id === e.nodeId && e.revision === 1)),
    missing: hyps.length === 0,
    demo: hyps.some(isDemo),
  });

  const everInvalid = nodes.filter((n) => ev.some((e) => e.type === 'node_validated' && e.nodeId === n.id && e.status === 'invalid'));
  items.push({
    key: 'errors',
    label: 'Bước chưa khớp và việc tự sửa',
    lines: everInvalid.map((n) => {
      const now = n.validation?.status;
      const fixed = now === 'valid' ? (n.revision > 1 ? `đã tự sửa (phiên bản ${n.revision}) và nay khớp` : 'nay khớp') : n.revisedBy.length ? `được sửa bởi bước ${n.revisedBy.map((id) => graph.nodes[id]?.rowIndex).join(', ')}` : now === 'invalid' ? 'vẫn chưa khớp' : `hiện: ${now}`;
      const mis = [...new Set([...(n.validation?.possibleMisconceptions ?? []), ...n.history.flatMap((h) => h.validation?.possibleMisconceptions ?? [])].map((m) => MISC[m.code] ?? m.code))];
      return `Bước ${n.rowIndex === 0 ? 'F1' : n.rowIndex}: “${firstText(n)}” — ${fixed}${mis.length ? ` (có thể: ${mis.join(', ')})` : ''}`;
    }),
    sourceSeqs: seqOf(ev, (e) => (e.type === 'node_validated' && e.status === 'invalid') || e.type === 'node_revised' || (e.type === 'row_submitted' && e.revision > 1)),
    missing: everInvalid.length === 0,
    demo: everInvalid.some(isDemo),
  });

  const exps = ev.filter((e): e is Extract<GraphEvent, { type: 'experiment' }> => e.type === 'experiment');
  items.push({
    key: 'experiments',
    label: 'Thử nghiệm trên mô hình',
    lines: exps.filter((e) => e.event === 'end').map((e) => `Đổi ${displaySymbol(e.symbol)} từ ${String(e.from).replace('.', ',')} đến ${String(e.to).replace('.', ',')}`)
      .concat(exps.length && !exps.some((e) => e.event === 'end') ? ['Thử nghiệm đã bắt đầu, chưa kết thúc'] : []),
    sourceSeqs: exps.map((e) => e.seq),
    missing: exps.length === 0,
    demo: false,
  });

  const hints = ev.filter((e): e is Extract<GraphEvent, { type: 'hint_shown' }> => e.type === 'hint_shown');
  const maxBy = new Map<string, DisclosureLevel>();
  for (const h of hints) maxBy.set(h.nodeId, Math.max(maxBy.get(h.nodeId) ?? 0, h.level) as DisclosureLevel);
  items.push({
    key: 'hints',
    label: 'Gợi ý đã dùng (mức tiết lộ cao nhất)',
    lines: [...maxBy.entries()].map(([id, lv]) => `Bước ${graph.nodes[id]?.rowIndex ?? '?'}: D${lv}`),
    sourceSeqs: hints.map((h) => h.seq),
    missing: hints.length === 0,
    demo: false,
  });

  const coach = ev.filter((e): e is Extract<GraphEvent, { type: 'coach_exchange' }> => e.type === 'coach_exchange');
  items.push({
    key: 'coach',
    label: 'Trao đổi với Coach',
    lines: coach.length ? [`${coach.length} lượt (AI: ${coach.filter((c) => c.source === 'ai').length}, cơ bản: ${coach.filter((c) => c.source === 'rule_based').length})`] : [],
    sourceSeqs: coach.map((c) => c.seq),
    missing: coach.length === 0,
    demo: false,
  });

  const e = independent?.evaluation;
  const iev = independent?.graph.events ?? [];
  items.push({
    key: 'independent',
    label: 'Bài tương tự tự làm (không gợi ý)',
    lines: e
      ? [
          `Đề: ${independent!.problemSpec.text}`,
          `Đáp án: ${({ correct: 'đúng', incorrect: 'chưa đúng', missing: 'chưa có kết luận', unreadable: 'chưa đọc được' } as const)[e.answer]}${e.expected ? ` (kết quả kiểm chứng: ${formatExact(e.expected)})` : ''}`,
          `Lập luận: ${({ sufficient: 'đủ bằng chứng', partial: 'một phần', contains_invalid: 'có bước chưa khớp', insufficient_evidence: 'chưa đủ bằng chứng' } as const)[e.reasoning]}`,
          `Phương pháp kiểm chứng: ${e.method}`,
        ]
      : independent?.evaluationError
        ? ['Bài đã gửi nhưng chưa đánh giá được.']
        : [],
    sourceSeqs: iev.filter((x) => x.type === 'independent_submitted' || x.type === 'independent_evaluated').map((x) => x.seq),
    missing: !e,
    demo: !!independent && learnerNodes(independent.graph).some(isDemo),
  });
  return items;
}

export function describeValue(n: ReasoningNode): string {
  const v = n.validation?.claimedValue;
  return v && n.validation?.producedSymbol ? `${displaySymbol(n.validation.producedSymbol)} = ${formatExact(v)}` : n.interpretation.displayText;
}
