import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useVoice } from '@/stores/voiceStore';
import NodeCard from '@/components/canvas/graph/NodeCard';
import { CARD_W, chainOf, layoutGraph, neighbour } from '@/components/canvas/graph/layout';
import type { GraphEdgeViewModel, GraphNodeViewModel } from '@/lib/reasoning/types';

interface Props {
  nodes: GraphNodeViewModel[];
  edges: GraphEdgeViewModel[];
  selected: string[];
  selectedEdgeId: string | null;
  staleIds: string[];
  recent: string[];
  onSelectNode: (id: string | null) => void;
  onSelectEdge: (e: GraphEdgeViewModel) => void;
  zoom: number;
  setZoom: (z: number) => void;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  collapseProblem: boolean;
  chainOnly: boolean;
}

const EDGE_STYLE: Record<string, { stroke: string; dash?: string }> = {
  depends_on: { stroke: '#64748b' },
  supports: { stroke: '#a78bfa', dash: '1 3' },
  tests: { stroke: '#f59e0b', dash: '4 3' },
  corrects: { stroke: '#34d399', dash: '6 4' },
  contradicts: { stroke: '#fb7185', dash: '2 3' },
  implements: { stroke: '#38bdf8', dash: '5 2' },
};

/** Level 1 map: HTML cards over an SVG edge layer, zoom/pan, labels, keyboard navigation (§10.8.1–10.8.2). */
export default function GraphMap(p: Props) {
  const voiceCue = useVoice(s => s.cue);
  const viewportRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      p.setZoom(Math.max(0.5, Math.min(2, +(p.zoom + (event.deltaY < 0 ? 0.25 : -0.25)).toFixed(2))));
    };
    const distance = (event: TouchEvent) => Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY);
    const start = (event: TouchEvent) => {
      if (event.touches.length === 2) pinchRef.current = { distance: distance(event), zoom: p.zoom };
    };
    const move = (event: TouchEvent) => {
      const pinch = pinchRef.current;
      if (event.touches.length !== 2 || !pinch || !pinch.distance) return;
      event.preventDefault();
      p.setZoom(Math.max(0.5, Math.min(2, +(pinch.zoom * distance(event) / pinch.distance).toFixed(2))));
    };
    const end = () => { pinchRef.current = null; };
    viewport.addEventListener('wheel', wheel, { passive: false });
    viewport.addEventListener('touchstart', start, { passive: true });
    viewport.addEventListener('touchmove', move, { passive: false });
    viewport.addEventListener('touchend', end);
    viewport.addEventListener('touchcancel', end);
    return () => {
      viewport.removeEventListener('wheel', wheel);
      viewport.removeEventListener('touchstart', start);
      viewport.removeEventListener('touchmove', move);
      viewport.removeEventListener('touchend', end);
      viewport.removeEventListener('touchcancel', end);
    };
  }, [p.zoom, p.setZoom]);
  const drawnAll = p.edges.filter((e) => e.depth === 'direct');
  const selectedId = p.selected[0] ?? null;
  const chain = useMemo(() => (p.chainOnly && selectedId ? chainOf(selectedId, drawnAll) : null), [p.chainOnly, selectedId, drawnAll]);
  const nodes = p.nodes.filter((n) => (!p.collapseProblem || n.row !== null) && (!chain || chain.has(n.nodeId)));
  const visible = new Set(nodes.map((n) => n.nodeId));
  const drawn = drawnAll.filter((e) => visible.has(e.from) && visible.has(e.to));
  const learnerCount = nodes.filter((n) => n.row !== null).length;
  const compact = learnerCount > 15 || p.zoom < 0.75;
  const layout = useMemo(() => layoutGraph(nodes, drawn, compact), [nodes, drawn, compact]);
  const refs = useRef(new Map<string, HTMLButtonElement>());
  const firstLearner = nodes.find((n) => n.row !== null)?.nodeId ?? nodes[0]?.nodeId ?? null;
  const [focusId, setFocusId] = useState<string | null>(selectedId ?? firstLearner);
  // The map mounts with only problem nodes. Once row 1 arrives, Tab must enter
  // the learner's reasoning, rather than keep the original given as its sole stop.
  useEffect(() => {
    setFocusId(selectedId ?? firstLearner);
  }, [selectedId, firstLearner]);
  useEffect(() => {
    if (!focusId || !visible.has(focusId)) setFocusId(selectedId && visible.has(selectedId) ? selectedId : firstLearner);
  }, [focusId, selectedId, firstLearner, visible]);

  const labelsAuto = p.showLabels && p.zoom >= 1 && drawn.length <= 20;
  const recentSet = new Set(p.recent);
  const staleSet = new Set(p.staleIds);

  const moveFocus = (id: string | null) => {
    if (!id) return;
    setFocusId(id);
    refs.current.get(id)?.focus();
    refs.current.get(id)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };
  const onKey = (id: string) => (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
      moveFocus(neighbour(id, e.key, layout, drawn, visible));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      p.onSelectNode(null);
    } else if (e.key === 'l' || e.key === 'L') {
      p.setShowLabels(!p.showLabels);
    } else if (e.key === '+' || e.key === '=') {
      p.setZoom(Math.min(2, +(p.zoom + 0.25).toFixed(2)));
    } else if (e.key === '-') {
      p.setZoom(Math.max(0.5, +(p.zoom - 0.25).toFixed(2)));
    } else if (e.key === '0') {
      p.setZoom(1);
    }
  };

  const center = (id: string, side: 'in' | 'out') => {
    const q = layout.pos.get(id)!;
    return { x: q.x + (side === 'out' ? CARD_W : 0), y: q.y + layout.cardH / 2 };
  };

  return (
    <div ref={viewportRef} className="max-h-[560px] overflow-auto rounded-xl border border-white/10 bg-slate-950/60" data-testid="reasoning-graph" data-layout-width={layout.width} role="group" aria-label="Bản đồ suy luận — dùng phím mũi tên để đi giữa các bước, Enter để xem chi tiết">
      <div style={{ width: layout.width * p.zoom, height: layout.height * p.zoom, position: 'relative' }}>
        <div style={{ width: layout.width, height: layout.height, transform: `scale(${p.zoom})`, transformOrigin: '0 0', position: 'absolute', left: 0, top: 0 }} data-zoom={p.zoom}>
          <svg width={layout.width} height={layout.height} className="absolute left-0 top-0" aria-hidden>
            <defs>
              <marker id="xg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
              </marker>
            </defs>
            {drawn.map((e) => {
              const a = center(e.from, 'out');
              const b = center(e.to, 'in');
              const back = b.x <= a.x;
              const d = back
                ? `M ${a.x - CARD_W / 2} ${a.y + layout.cardH / 2} C ${a.x - CARD_W / 2} ${a.y + layout.cardH / 2 + 40}, ${b.x + CARD_W / 2} ${b.y + layout.cardH / 2 + 40}, ${b.x + CARD_W / 2} ${b.y + layout.cardH / 2}`
                : `M ${a.x} ${a.y} C ${a.x + 40} ${a.y}, ${b.x - 40} ${b.y}, ${b.x} ${b.y}`;
              const st = EDGE_STYLE[e.relation] ?? EDGE_STYLE.depends_on;
              const hl = !!voiceCue?.edgeIds.includes(e.edgeId) || p.selectedEdgeId === e.edgeId || (selectedId && (e.from === selectedId || e.to === selectedId));
              const stroke = e.status === 'broken' ? '#f43f5e' : e.status === 'provisional' ? '#94a3b8' : e.sourceEpistemic === 'learner_invalid' ? '#fb7185' : st.stroke;
              const dash = e.status === 'broken' ? '8 4' : e.status === 'provisional' ? '1 4' : st.dash;
              const flash = recentSet.has(e.from) && recentSet.has(e.to);
              return (
                <path key={e.edgeId} d={d} fill="none" stroke={hl ? '#f8fafc' : stroke} strokeWidth={hl ? 2.6 : e.status === 'provisional' ? 1 : 1.5} strokeDasharray={dash} markerEnd="url(#xg-arrow)"
                  data-edge-id={e.edgeId} data-voice-highlight={voiceCue?.edgeIds.includes(e.edgeId) || undefined} data-edge-status={e.status} data-relation={e.relation} className={flash ? 'animate-pulse motion-reduce:animate-none' : ''} />
              );
            })}
          </svg>
          {drawn.map((e) => {
            const hl = !!voiceCue?.edgeIds.includes(e.edgeId) || p.selectedEdgeId === e.edgeId || (selectedId && (e.from === selectedId || e.to === selectedId));
            if (!e.labelShort || !(labelsAuto || hl)) return null;
            const a = center(e.from, 'out');
            const b = center(e.to, 'in');
            const mx = b.x <= a.x ? (a.x - CARD_W / 2 + b.x + CARD_W / 2) / 2 : (a.x + b.x) / 2;
            const my = b.x <= a.x ? Math.max(a.y, b.y) + layout.cardH / 2 + 30 : (a.y + b.y) / 2;
            return (
              <button
                key={`l-${e.edgeId}`}
                type="button"
                tabIndex={-1}
                onClick={() => p.onSelectEdge(e)}
                data-edge-label={e.edgeId}
                className={`absolute max-w-[180px] -translate-x-1/2 -translate-y-1/2 truncate rounded border px-1 text-[10px] ${e.status === 'broken' ? 'border-rose-400 bg-rose-950/90 text-rose-100' : e.status === 'provisional' ? 'border-dashed border-slate-400 bg-slate-900/90 text-slate-300' : 'border-slate-600 bg-slate-900/90 text-slate-200'} ${p.selectedEdgeId === e.edgeId ? 'ring-2 ring-white' : ''}`}
                style={{ left: mx, top: my }}
                title={e.explanation}
              >
                {e.status === 'broken' ? '⚠ ' : ''}{e.labelShort}
              </button>
            );
          })}
          {nodes.map((n) => {
            const q = layout.pos.get(n.nodeId)!;
            return (
              <NodeCard
                key={n.nodeId}
                ref={(el) => {
                  if (el) refs.current.set(n.nodeId, el);
                  else refs.current.delete(n.nodeId);
                }}
                nv={n}
                selected={p.selected.includes(n.nodeId)}
                focusable={n.nodeId === focusId}
                compact={layout.compact}
                recent={recentSet.has(n.nodeId)}
                stale={staleSet.has(n.nodeId)}
                onSelect={() => {
                  setFocusId(n.nodeId);
                  p.onSelectNode(n.nodeId);
                }}
                onKeyDown={onKey(n.nodeId)}
                className="absolute"
                style={{ left: q.x, top: q.y, width: CARD_W, height: layout.cardH }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
