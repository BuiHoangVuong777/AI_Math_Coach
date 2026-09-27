import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { primaryVisual, rowExplanations } from './presentation.ts';
import { planForContext } from '../reasoning/orchestrator.ts';
import { Session } from '../reasoning/testkit.ts';
import * as F from '../reasoning/fixtures.ts';
test('learner visualization prefers 3D, falls back to chart/text, never to the internal graph',async()=>{
 const s=new Session(F.PROBLEM_B);await s.add(F.ROWS_B.hypothesis);const specs=planForContext(s.ctx);
 assert.equal(primaryVisual(specs,'graph'),'3d');assert.equal(primaryVisual(specs,'chart'),'chart');
 assert.equal(primaryVisual(specs.filter(v=>v.renderer!=='cylinder_3d'),'3d'),'chart');
 assert.equal(primaryVisual(specs.filter(v=>v.renderer==='reasoning_graph'),'graph'),null);
 await s.op({type:'start_independent'});assert.equal(primaryVisual(planForContext(s.ctx),'3d'),null);
});
test('hidden graph still processes A/B/C/REG; Case C revisions rebuild explanations and preserve downstream text',async()=>{
 for(const [problem,rows] of [[F.PROBLEM_A,F.ROWS_A],[F.PROBLEM_B,[F.ROWS_B.hypothesis]],[F.PROBLEM_C,F.ROWS_C],[F.PROBLEM_REG,F.ROWS_REG]] as const){
  const s=new Session(problem);let previous=s.ctx.graph.version;
  for(const text of rows){await s.add(text);assert.ok(s.ctx.graph.version>previous);previous=s.ctx.graph.version;const before=JSON.stringify(s.ctx);const views=rowExplanations(planForContext(s.ctx),s.ctx.graph);assert.equal(views.nodes.filter(v=>v.row!==null).length,Object.values(s.ctx.graph.nodes).filter(n=>n.rowIndex>0).length);assert.equal(JSON.stringify(s.ctx),before);}
 }
 const ambiguous=new Session(F.PROBLEM_REG);await ambiguous.add('V = 4π·5');
 const ambiguousView=rowExplanations(planForContext(ambiguous.ctx),ambiguous.ctx.graph).nodes.find(n=>n.nodeId==='n1');
 assert.equal(ambiguousView?.validationStatus,'ambiguous');assert.equal(ambiguousView?.learnerText,'V = 4π·5');
 assert.ok(ambiguousView?.explanation);assert.deepEqual(ambiguousView.relevantRuleIds,[]);
 const s=new Session(F.PROBLEM_C);for(const row of F.ROWS_C)await s.add(row);
 const old=rowExplanations(planForContext(s.ctx),s.ctx.graph);const oldIds=old.nodes.map(v=>v.explanation?.explanationId);
 await s.edit(1,F.EDITS_C[0]);const fresh=rowExplanations(planForContext(s.ctx),s.ctx.graph);
 assert.equal(s.ctx.graph.nodes.n1.revision,2);assert.equal(s.ctx.graph.nodes.n1.history[0].originalText,F.ROWS_C[0]);
 assert.equal(s.ctx.graph.nodes.n3.originalText,F.ROWS_C[2]);assert.ok(fresh.edges.some(e=>e.status==='broken'));
 assert.ok(fresh.nodes.find(n=>n.nodeId==='n3')?.explanation?.explanationShort?.includes('vẫn dùng số cũ'));
 assert.ok(fresh.nodes.every(n=>!n.explanation || !oldIds.includes(n.explanation.explanationId)));
 assert.deepEqual(rowExplanations(planForContext(s.ctx).map(v=>({...v,graphVersion:v.graphVersion-1})),s.ctx.graph),{nodes:[],edges:[]});
});
test('learner render paths do not mount graphs; dev inspector is explicit and F8/summary hide it',()=>{
 const visual=readFileSync(new URL('../../components/canvas/VisualStage.tsx',import.meta.url),'utf8');
 const end=readFileSync(new URL('../../components/canvas/EndStages.tsx',import.meta.url),'utf8');
 const page=readFileSync(new URL('../../pages/ReasoningCanvasPage.tsx',import.meta.url),'utf8');
 assert.ok(!visual.includes('ExplainableGraph'));assert.ok(!visual.includes("key: 'graph'"));assert.ok(!end.includes('ExplainableGraph'));
 assert.ok(page.includes("import.meta.env.DEV && new URLSearchParams(window.location.search).get('inspect') === 'graph'"));
 assert.ok(page.indexOf('s.ctx?.phase === \'reasoning\'')<page.indexOf('inspectGraph && graphSpec'));
});
