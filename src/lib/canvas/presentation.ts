/** Learner presentation only: the planner's reasoning_graph stays in the internal specs. */
import type { GraphParams, ReasoningGraph, VisualSpec } from '../reasoning/types.ts';
export function primaryVisual(specs: VisualSpec[], requested: string): '3d' | 'chart' | null {
  const has = (renderer: VisualSpec['renderer']) => specs.some(s => s.renderer === renderer);
  if (requested === 'chart' && has('scaling_chart')) return 'chart';
  if (has('cylinder_3d')) return '3d';
  return has('scaling_chart') ? 'chart' : null;
}
export function rowExplanations(specs: VisualSpec[], graph: ReasoningGraph) {
  const spec = specs.find(s => s.renderer === 'reasoning_graph' && s.graphVersion === graph.version);
  const params = spec?.params as GraphParams | undefined;
  const nodes = (params?.nodeViews ?? []).filter(n => graph.nodes[n.nodeId]?.revision === n.nodeRevision && n.graphVersion === graph.version);
  return { nodes, edges: params?.edgeViews ?? [] };
}
