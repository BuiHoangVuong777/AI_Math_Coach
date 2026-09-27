import type { GraphNodeViewModel, VisualSpec } from '@/lib/reasoning/types';

const PURPOSE_TEXT: Record<string, string> = {
  map_reasoning: 'bản đồ các bước của em',
  relate_given_to_shape: 'liên hệ dữ kiện với hình',
  investigate_invalid: 'để em điều tra bước chưa khớp',
  test_hypothesis: 'để em kiểm tra giả thuyết',
  compare_quantities: 'so sánh các đại lượng em viết',
  show_formula_structure: 'làm rõ cấu trúc công thức',
};
const RENDERER_TEXT: Record<string, string> = {
  cylinder_3d: 'Hình 3D', comparison_table: 'Bảng so sánh', scaling_chart: 'Biểu đồ', formula_highlight: 'Công thức', reasoning_graph: 'Bản đồ',
};

/**
 * Presenter mode (§10.8.3): three synchronized lanes over the SAME view models —
 * nothing here is computed differently from learner mode.
 */
export default function PresenterLanes({ nodes, specs, selected, onSelectNode }: { nodes: GraphNodeViewModel[]; specs: VisualSpec[]; selected: string[]; onSelectNode: (id: string) => void }) {
  const learner = nodes.filter((n) => n.row !== null);
  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/60" data-testid="presenter-lanes">
      <table className="w-full min-w-[640px] table-fixed text-xs text-slate-200">
        <thead className="text-left text-slate-400">
          <tr>
            <th className="w-1/3 p-2 font-semibold">1 · Em viết</th>
            <th className="w-1/3 p-2 font-semibold">2 · Hệ thống hiểu &amp; kiểm chứng</th>
            <th className="w-1/3 p-2 font-semibold">3 · Hình được tạo &amp; vì sao</th>
          </tr>
        </thead>
        <tbody>
          {learner.map((n) => {
            const sel = selected.includes(n.nodeId);
            const linked = specs.filter((s) => s.renderer !== 'reasoning_graph').flatMap((s) => s.elements.filter((e) => e.sourceNodeIds.includes(n.nodeId)).map((e) => ({ s, e })));
            return (
              <tr key={n.nodeId} onClick={() => onSelectNode(n.nodeId)} data-lane-row={n.nodeId} aria-selected={sel} className={`cursor-pointer border-t border-white/5 align-top ${sel ? 'bg-slate-800/80 outline outline-1 outline-white' : ''}`}>
                <td className="p-2" data-lane="1">
                  <button type="button" onClick={() => onSelectNode(n.nodeId)} className="text-left" aria-pressed={sel}>
                    <span className="mr-1 rounded bg-slate-700 px-1 font-semibold">{n.row === 0 ? 'F1' : n.row}</span>
                    {n.learnerText}
                  </button>
                </td>
                <td className="p-2" data-lane="2">
                  <p className="text-slate-300">{n.interpretedMeaning}</p>
                  <p className="font-semibold">{n.statusBadge.icon} {n.statusBadge.label}</p>
                  {n.explanation && <p>{n.explanation.explanationShort}</p>}
                </td>
                <td className="p-2" data-lane="3">
                  {linked.length ? (
                    <ul>{linked.map(({ s, e }) => <li key={e.elementId}>{RENDERER_TEXT[s.renderer]}: {e.label} — <span className="text-slate-400">{PURPOSE_TEXT[s.purpose] ?? s.purpose}</span></li>)}</ul>
                  ) : <span className="text-slate-500">Không tạo hình riêng cho bước này.</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
