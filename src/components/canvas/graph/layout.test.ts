import test from 'node:test';
import assert from 'node:assert/strict';
import { CARD_H, CARD_H_COMPACT, layoutGraph, neighbour } from './layout.ts';
import type { GraphNodeViewModel, GraphEdgeViewModel } from '../../../lib/reasoning/types.ts';

test('FR-XN-003: cards fit the specified 96 px maximum without overlaps at 40 rows', () => {
  assert.ok(CARD_H <= 96 && CARD_H_COMPACT <= 96);
  const nodes = Array.from({ length: 40 }, (_, i) => ({ nodeId: `n${i + 1}`, row: i + 1 }) as GraphNodeViewModel);
  for (const compact of [false, true]) {
    const layout = layoutGraph(nodes, [], compact);
    const boxes = [...layout.pos.values()];
    for (let i = 1; i < boxes.length; i++) assert.ok(boxes[i].y >= boxes[i - 1].y + layout.cardH);
  }
});

test('FR-XN-001: left/right traverse established sources and ignore provisional edges', () => {
  const nodes = [{ nodeId: 'g:r1', row: null }, { nodeId: 'n1', row: 1 }, { nodeId: 'n2', row: 2 }] as GraphNodeViewModel[];
  const edges = [
    { from: 'g:r1', to: 'n1', depth: 'direct', relation: 'depends_on', status: 'established' },
    { from: 'n1', to: 'n2', depth: 'direct', relation: 'depends_on', status: 'provisional' },
  ] as GraphEdgeViewModel[];
  const layout = layoutGraph(nodes, edges, false);
  const visible = new Set(nodes.map(n => n.nodeId));
  assert.equal(neighbour('n1', 'ArrowLeft', layout, edges, visible), 'g:r1');
  assert.equal(neighbour('g:r1', 'ArrowRight', layout, edges, visible), 'n1');
  assert.equal(neighbour('n1', 'ArrowRight', layout, edges, visible), null);
});
