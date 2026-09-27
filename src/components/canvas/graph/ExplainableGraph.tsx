import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, Maximize2 } from 'lucide-react';
import DetailPanel from '@/components/canvas/graph/DetailPanel';
import GraphList from '@/components/canvas/graph/GraphList';
import GraphMap from '@/components/canvas/graph/GraphMap';
import PresenterLanes from '@/components/canvas/graph/PresenterLanes';
import { solveProblem } from '@/lib/reasoning/facts';
import type { ExplainContext } from '@/lib/reasoning/explanations';
import type { GraphEdgeViewModel, GraphParams, ReasoningGraph, VisualSpec } from '@/lib/reasoning/types';
import { useCanvas, type GraphMode } from '@/stores/reasoningSessionStore';

// Debug mode exists only in development builds; production bundles do not include it.
const DebugPanel = import.meta.env.DEV ? lazy(() => import('@/components/canvas/graph/DebugPanel')) : null;

interface Props {
  spec: VisualSpec;
  graph: ReasoningGraph;
  specs: VisualSpec[];
  /** Summary view of the submitted independent graph: read-only, no modes. */
  readOnly?: boolean;
}

/** Explainable Reasoning Graph (§10.8): Level 1 map/list, Level 2 detail, three presentation modes. */
export default function ExplainableGraph({ spec, graph, specs, readOnly = false }: Props) {
  const { selected, select, selectedEdgeId, selectEdge, staleIds, recentlyChanged, graphMode, setGraphMode, graphView, setGraphView, ctx } = useCanvas();
  const gp = spec.params as GraphParams;
  const nodes = useMemo(() => gp.nodeViews ?? [], [gp.nodeViews]);
  const edges = useMemo(() => gp.edgeViews ?? [], [gp.edgeViews]);
  const neutral = gp.neutral;
  const [zoom, setZoom] = useState(1);
  const [showLabels, setShowLabels] = useState(true);
  const [collapseProblem, setCollapseProblem] = useState(false);
  const [chainOnly, setChainOnly] = useState(false);
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 1023px)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(max-width: 1023px)');
    if (!mq) return;
    const on = () => setNarrow(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const view = graphView ?? (narrow ? 'list' : 'map');
  const independent = ctx?.phase === 'independent';
  const modesAllowed = !readOnly && !neutral && !independent;
  const mode: GraphMode = modesAllowed ? graphMode : 'learner';
  const debugAllowed = !!DebugPanel && modesAllowed;

  // aria-live summary of what changed in the last turn (NFR-A11Y-006).
  const [announce, setAnnounce] = useState('');
  const lastVersion = useRef(spec.graphVersion);
  useEffect(() => {
    if (spec.graphVersion === lastVersion.current) return;
    lastVersion.current = spec.graphVersion;
    const changed = nodes.filter((n) => n.row !== null && recentlyChanged.includes(n.nodeId));
    if (!changed.length || neutral) return;
    const ok = changed.filter((n) => n.validationStatus === 'valid').map((n) => n.row);
    const review = changed.filter((n) => n.validationStatus !== 'valid').map((n) => n.row);
    setAnnounce([ok.length ? `Bước ${ok.join(', ')} khớp` : '', review.length ? `bước ${review.join(', ')} cần xem lại` : ''].filter(Boolean).join('; ') + '.');
  }, [spec.graphVersion, nodes, recentlyChanged, neutral]);

  const onSelectNode = (id: string | null) => (id ? select([id]) : select([]));
  const onSelectEdge = (e: GraphEdgeViewModel) => selectEdge(e.edgeId, [e.from, e.to].filter((id) => /^n\d+|^f1-/.test(id)));
  const showDetail = !readOnly && (selected.length > 0 || !!selectedEdgeId);
  const explain: ExplainContext | null = ctx ? { spec: ctx.problemSpec, facts: solveProblem(ctx.problemSpec), graph, phase: ctx.phase, disclosure: ctx.disclosure } : null;

  const btn = 'rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-200 hover:bg-slate-700 aria-pressed:bg-indigo-500 aria-pressed:text-white';
  return (
    <div className="space-y-2" data-graph-mode={mode} data-graph-view={view}>
      <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Điều khiển bản đồ">
        {modesAllowed && (
          <div role="radiogroup" aria-label="Chế độ trình bày" className="mr-2 flex gap-1">
            {(['learner', 'presenter', ...(debugAllowed ? ['debug'] : [])] as GraphMode[]).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} aria-pressed={mode === m} data-mode={m} onClick={() => setGraphMode(m)} className={btn}>
                {{ learner: 'Học sinh', presenter: 'Trình bày', debug: 'Gỡ lỗi' }[m]}
              </button>
            ))}
          </div>
        )}
        {mode !== 'presenter' && (
          <>
            <button type="button" aria-pressed={view === 'map'} onClick={() => setGraphView('map')} className={btn} data-view="map">Bản đồ</button>
            <button type="button" aria-pressed={view === 'list'} onClick={() => setGraphView('list')} className={btn} data-view="list">Danh sách</button>
            {view === 'map' && (
              <>
                <button type="button" aria-label="Thu nhỏ bản đồ" onClick={() => setZoom(Math.max(0.5, +(zoom - 0.25).toFixed(2)))} className={btn}><Minus className="h-3 w-3" /></button>
                <span className="w-10 text-center text-xs text-slate-400" aria-live="off">{Math.round(zoom * 100)}%</span>
                <button type="button" aria-label="Phóng to bản đồ" onClick={() => setZoom(Math.min(2, +(zoom + 0.25).toFixed(2)))} className={btn}><Plus className="h-3 w-3" /></button>
                <button type="button" aria-label="Vừa khung" onClick={(event) => {
                  const viewport = event.currentTarget.closest('[data-graph-mode]')?.querySelector<HTMLElement>('[data-testid="reasoning-graph"]');
                  if (viewport) setZoom(Math.max(0.5, Math.min(1, +(viewport.clientWidth / Number(viewport.dataset.layoutWidth)).toFixed(2))));
                }} className={btn}><Maximize2 className="h-3 w-3" /></button>
                <button type="button" aria-pressed={showLabels} onClick={() => setShowLabels(!showLabels)} className={btn}>Nhãn liên kết</button>
                <button type="button" aria-pressed={chainOnly} disabled={!selected.length} onClick={() => setChainOnly(!chainOnly)} className={`${btn} disabled:opacity-40`}>Chỉ chuỗi liên quan</button>
              </>
            )}
            <button type="button" aria-pressed={collapseProblem} onClick={() => setCollapseProblem(!collapseProblem)} className={btn}>Thu gọn dữ kiện</button>
          </>
        )}
      </div>
      <p className="sr-only" aria-live="polite" data-testid="graph-announce">{announce}</p>

      {mode === 'presenter' ? (
        <PresenterLanes nodes={nodes} specs={specs} selected={selected} onSelectNode={(id) => select([id])} />
      ) : view === 'map' ? (
        <GraphMap nodes={nodes} edges={edges} selected={selected} selectedEdgeId={selectedEdgeId} staleIds={staleIds} recent={recentlyChanged} onSelectNode={onSelectNode} onSelectEdge={onSelectEdge}
          zoom={zoom} setZoom={setZoom} showLabels={showLabels} setShowLabels={setShowLabels} collapseProblem={collapseProblem} chainOnly={chainOnly} />
      ) : (
        <GraphList nodes={nodes} edges={edges} selected={selected} staleIds={staleIds} recent={recentlyChanged} onSelectNode={(id) => select([id])} collapseProblem={collapseProblem} />
      )}

      {showDetail && <DetailPanel nodes={nodes} edges={edges} graph={graph} specs={specs} neutral={neutral} onClose={() => select([])} />}

      {mode === 'debug' && DebugPanel && explain && (
        <Suspense fallback={null}>
          <DebugPanel graph={graph} nodes={nodes} edges={edges} specs={specs} explain={explain} />
        </Suspense>
      )}
    </div>
  );
}
