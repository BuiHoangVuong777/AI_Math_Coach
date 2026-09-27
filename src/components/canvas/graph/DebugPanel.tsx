import { findLeak } from '@/lib/reasoning/disclosure';
import { explanationForbidden, type ExplainContext } from '@/lib/reasoning/explanations';
import type { GraphEdgeViewModel, GraphNodeViewModel, ReasoningGraph, VisualSpec } from '@/lib/reasoning/types';

/**
 * Technical debug mode (§10.8.3). Loaded only in development builds; never in
 * independent assessment. Facts that are not disclosable are masked, and any line
 * that would still reveal a protected value is replaced.
 */
export default function DebugPanel({ graph, nodes, edges, specs, explain }: { graph: ReasoningGraph; nodes: GraphNodeViewModel[]; edges: GraphEdgeViewModel[]; specs: VisualSpec[]; explain: ExplainContext }) {
  const forbidden = explanationForbidden(explain);
  const MASK = '[ẩn theo mức tiết lộ]';
  const guard = (s: string) => (findLeak(s, forbidden) ? MASK : s);
  const dump = (v: unknown) => guard(JSON.stringify(v));
  return (
    <div className="space-y-2 rounded-xl border border-amber-400/40 bg-slate-950 p-2 font-mono text-[10px] text-slate-300" data-testid="debug-panel">
      <p className="font-sans text-xs text-amber-200">Gỡ lỗi kỹ thuật (chỉ bản phát triển) · graph v{graph.version} · specs: {specs.map((s) => `${s.specId}@v${s.graphVersion}`).join(', ')}</p>
      {nodes.filter((n) => n.row !== null).map((nv) => {
        const n = graph.nodes[nv.nodeId];
        const v = n.validation;
        return (
          <details key={nv.nodeId} className="rounded border border-white/10 p-1">
            <summary>{nv.nodeId} r{n.revision} · {v?.status} · {nv.explanation?.templateId} · {nv.explanation?.explanationId}</summary>
            <div>semantic: {n.interpretation.semanticType} · parse: {n.interpretation.status}/{n.interpretation.provenance} · provenance: {n.provenance}</div>
            <div>normalized: {dump(n.interpretation.normalized)}</div>
            <div>checks: {dump(v?.checks)} · method: {v?.method}</div>
            <div>reasonCodes: {dump(v?.reasonCodes)} · misconceptions: {dump(v?.possibleMisconceptions.map((m) => m.code))}</div>
            <div>ruleIds(persisted): {dump(v?.ruleIds)} · shown: {dump(nv.relevantRuleIds)}</div>
            <div>facts: {dump(v?.facts.map((f) => ({ id: f.id, value: f.disclosable ? f.value : MASK, provenance: f.provenance })))}</div>
            <div>dependsOn: {dump(n.dependsOn)}</div>
            <div>linkedElementIds: {dump(nv.linkedElementIds)} · affected: {dump(nv.affectedNodeIds)}</div>
          </details>
        );
      })}
      <details className="rounded border border-white/10 p-1">
        <summary>edges ({edges.length})</summary>
        {edges.map((e) => <div key={e.edgeId}>{guard(`${e.edgeId} [${e.status}/${e.depth}/${e.storedKind}${e.via ? '/' + e.via : ''}] ${e.labelShort}`)}</div>)}
      </details>
    </div>
  );
}
