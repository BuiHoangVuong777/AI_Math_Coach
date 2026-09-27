/** Test helpers (node:test only): drive runTurn like the UI does. */
import { confirmAndStart, runTurn, type Ports } from './orchestrator.ts';
import { parseProblem } from './problemParser.ts';
import type { ReasoningNode, SessionContext, TurnOp, TurnResult } from './types.ts';

export class Session {
  ctx: SessionContext;
  last!: TurnResult;
  results: TurnResult[] = [];
  private seq = 0;
  private readonly ports: Ports;
  constructor(problem: string, ports: Ports = {}) {
    this.ports = { now: () => 1_000 + this.seq, ...ports };
    this.ctx = confirmAndStart(parseProblem(problem), [], 1_000);
  }
  graph() {
    return this.ctx.phase === 'independent' && this.ctx.independent ? this.ctx.independent.graph : this.ctx.graph;
  }
  async op(op: TurnOp, selected: string[] = []): Promise<TurnResult> {
    const r = await runTurn({ context: this.ctx, expectedGraphVersion: this.graph().version, opId: `op-${++this.seq}`, op, selectedNodeIds: selected }, this.ports);
    if (r.error) throw new Error(`${op.type}: ${r.error.code} ${r.error.message}`);
    this.ctx = r.context;
    this.last = r;
    this.results.push(r);
    return r;
  }
  add(text: string) {
    return this.op({ type: 'add_row', rowText: text });
  }
  edit(row: number, text: string) {
    return this.op({ type: 'edit_row', nodeId: this.row(row).id, rowText: text });
  }
  row(n: number, graph = this.graph()): ReasoningNode {
    const node = Object.values(graph.nodes).find((x) => x.rowIndex === n && x.source !== 'problem');
    if (!node) throw new Error(`no row ${n}`);
    return node;
  }
  status(n: number) {
    return this.row(n).validation!.status;
  }
  deps(n: number) {
    return this.row(n).dependsOn.map((d) => d.nodeId).sort();
  }
  spec(renderer: string) {
    return this.last.visualSpecs.find((s) => s.renderer === renderer);
  }
}
