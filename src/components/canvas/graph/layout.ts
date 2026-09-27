import type { GraphEdgeViewModel, GraphNodeViewModel } from '@/lib/reasoning/types';

export const CARD_W = 240;
export const CARD_H = 96;
export const CARD_H_COMPACT = 76;
export const COL_GAP = 84;
export const ROW_GAP = 22;
export const PAD = 16;

export interface Layout {
  pos: Map<string, { x: number; y: number; col: number }>;
  columns: string[][];
  width: number;
  height: number;
  cardH: number;
  compact: boolean;
}

/** Deterministic layered layout: column = direct-dependency depth (§10.8.2). */
export function layoutGraph(nodes: GraphNodeViewModel[], edges: GraphEdgeViewModel[], compact: boolean): Layout {
  const ids = new Set(nodes.map((n) => n.nodeId));
  const incoming = new Map<string, string[]>();
  for (const e of edges) {
    if (e.depth !== 'direct' || !ids.has(e.from) || !ids.has(e.to) || e.relation === 'corrects' || e.relation === 'tests' || e.relation === 'contradicts') continue;
    incoming.set(e.to, [...(incoming.get(e.to) ?? []), e.from]);
  }
  const depth = new Map<string, number>();
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const d = (id: string, seen: Set<string>): number => {
    if (depth.has(id)) return depth.get(id)!;
    const n = byId.get(id);
    if (!n || n.row === null) return 0;
    if (seen.has(id)) return 1;
    seen.add(id);
    const v = 1 + Math.max(0, ...(incoming.get(id) ?? []).map((x) => d(x, seen)));
    depth.set(id, v);
    return v;
  };
  const columns: string[][] = [];
  for (const n of nodes) {
    const c = n.row === null ? 0 : d(n.nodeId, new Set());
    (columns[c] ??= []).push(n.nodeId);
  }
  const cardH = compact ? CARD_H_COMPACT : CARD_H;
  const pos = new Map<string, { x: number; y: number; col: number }>();
  columns.forEach((col, c) => {
    col.sort((a, b) => (byId.get(a)!.row ?? -1) - (byId.get(b)!.row ?? -1));
    col.forEach((id, i) => pos.set(id, { x: PAD + c * (CARD_W + COL_GAP), y: PAD + i * (cardH + ROW_GAP), col: c }));
  });
  const nonEmpty = columns.filter(Boolean);
  const width = PAD * 2 + Math.max(1, columns.length) * (CARD_W + COL_GAP) - COL_GAP;
  const height = PAD * 2 + Math.max(1, ...nonEmpty.map((c) => c.length)) * (cardH + ROW_GAP) - ROW_GAP;
  return { pos, columns: columns.map((c) => c ?? []), width, height, cardH, compact };
}

/** Keyboard neighbours (§10.8.2): ← source, → dependent, ↑/↓ same column. */
export function neighbour(id: string, key: string, layout: Layout, edges: GraphEdgeViewModel[], visible: Set<string>): string | null {
  const p = layout.pos.get(id);
  if (!p) return null;
  const byRow = (ids: string[]) => ids.filter((x) => visible.has(x)).sort((a, b) => (layout.pos.get(a)!.y - layout.pos.get(b)!.y) || (layout.pos.get(a)!.x - layout.pos.get(b)!.x));
  if (key === 'ArrowLeft') return byRow(edges.filter((e) => e.to === id && e.status !== 'provisional').map((e) => e.from))[0] ?? null;
  if (key === 'ArrowRight') return byRow(edges.filter((e) => e.from === id && e.status !== 'provisional').map((e) => e.to))[0] ?? null;
  const col = layout.columns[p.col].filter((x) => visible.has(x));
  const i = col.indexOf(id);
  if (key === 'ArrowUp') return col[i - 1] ?? null;
  if (key === 'ArrowDown') return col[i + 1] ?? null;
  return null;
}

/** Ancestors + node + descendants over drawn edges (“chỉ hiện chuỗi liên quan”). */
export function chainOf(id: string, edges: GraphEdgeViewModel[]): Set<string> {
  const out = new Set<string>([id]);
  const walk = (start: string, dir: 'up' | 'down') => {
    const stack = [start];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const e of edges) {
        const next = dir === 'up' ? (e.to === cur ? e.from : null) : e.from === cur ? e.to : null;
        if (next && !out.has(next)) {
          out.add(next);
          stack.push(next);
        }
      }
    }
  };
  walk(id, 'up');
  walk(id, 'down');
  return out;
}
