import NodeCard from '@/components/canvas/graph/NodeCard';
import type { GraphEdgeViewModel, GraphNodeViewModel } from '@/lib/reasoning/types';

interface Props {
  nodes: GraphNodeViewModel[];
  edges: GraphEdgeViewModel[];
  selected: string[];
  staleIds: string[];
  recent: string[];
  onSelectNode: (id: string) => void;
  collapseProblem: boolean;
}

/** List form of the map (small screens, screen readers — NFR-A11Y-006): same Level 1 content + source chips. */
export default function GraphList({ nodes, edges, selected, staleIds, recent, onSelectNode, collapseProblem }: Props) {
  const shown = nodes.filter((n) => !collapseProblem || n.row !== null);
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  return (
    <ol className="space-y-2" data-testid="reasoning-graph-list" aria-label="Bản đồ suy luận dạng danh sách">
      {shown.map((n) => {
        const inEdges = edges.filter((e) => e.to === n.nodeId && e.depth === 'direct');
        return (
          <li key={n.nodeId}>
            <NodeCard nv={n} selected={selected.includes(n.nodeId)} focusable compact={false} recent={recent.includes(n.nodeId)} stale={staleIds.includes(n.nodeId)} onSelect={() => onSelectNode(n.nodeId)} className="w-full" style={{ minHeight: 72 }} />
            {inEdges.length > 0 && (
              <p className="mt-0.5 flex flex-wrap gap-1 pl-2 text-[11px] text-slate-400">
                {inEdges.map((e) => {
                  const src = byId.get(e.from);
                  return (
                    <span key={e.edgeId} className={`rounded border px-1 ${e.status === 'provisional' ? 'border-dashed' : ''} ${e.status === 'broken' ? 'border-rose-400 text-rose-200' : 'border-slate-600'}`} title={e.explanation}>
                      {e.status === 'broken' ? '⚠ ' : ''}{e.labelShort || `dựa trên ${src?.row === null ? 'dữ kiện đề' : `bước ${src?.row}`}`}
                    </span>
                  );
                })}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
