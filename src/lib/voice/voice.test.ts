import {test} from 'node:test';import assert from 'node:assert/strict';
import {Session} from '../reasoning/testkit.ts';import * as F from '../reasoning/fixtures.ts';
import {voicePlan,type VoiceExplanationPlan} from './plan.ts';import {VoiceController,type Playback,type SpeechPort} from './playback.ts';
import {buildGraphViewModel,explanationForbidden} from '../reasoning/explanations.ts';import {solveProblem} from '../reasoning/facts.ts';import {findLeak} from '../reasoning/disclosure.ts';import {planForContext} from '../reasoning/orchestrator.ts';
test('Voice A/B/C plans are grounded, immutable, leak guarded at D0–D4; F8 refuses coaching',async()=>{
 for(const [problem,rows] of [[F.PROBLEM_A,F.ROWS_A],[F.PROBLEM_B,[F.ROWS_B.hypothesis]],[F.PROBLEM_C,F.ROWS_C]] as const){
  const s=new Session(problem);for(const row of rows)await s.add(row);
  for(let level=0;level<5;level++){
   const before=JSON.stringify(s.ctx);const evidence={spec:s.ctx.problemSpec,facts:solveProblem(s.ctx.problemSpec),graph:s.ctx.graph,phase:s.ctx.phase,disclosure:s.ctx.disclosure};const vm=buildGraphViewModel(evidence);const specs=planForContext(s.ctx,['n1']);
   for(const nv of vm.nodes.filter(n=>n.row!==null)){
    const p=voicePlan(s.ctx,nv.nodeId);if(!p)continue;
    assert.equal(p.graphVersion,s.ctx.graph.version);assert.equal(p.nodeRevision,s.ctx.graph.nodes[p.nodeId].revision);assert.equal(p.approvedText,p.segments.map(x=>x.text).join('\n'));
    for(const x of p.segments){assert.equal(findLeak(x.text,explanationForbidden(evidence)),null);for(const id of x.cue.nodeIds)assert.ok(s.ctx.graph.nodes[id]);for(const id of x.cue.edgeIds)assert.ok(vm.edges.some(e=>e.edgeId===id));for(const id of x.cue.elementIds)assert.ok(specs.some(v=>v.elements.some(e=>e.elementId===id))||planForContext(s.ctx,[nv.nodeId]).some(v=>v.elements.some(e=>e.elementId===id)));}
    if(nv.validationStatus==='invalid' && nv.disclosureLevel===0){assert.equal(p.segments.length,1);assert.equal(p.segments[0].text,nv.explanation?.prompt);}
   }
   assert.equal(JSON.stringify(s.ctx),before);if(level<4)await s.op({type:'request_hint',nodeId:'n1'});
  }
  const previous=voicePlan(s.ctx,'n1');await s.edit(1,rows[0]);const current=voicePlan(s.ctx,'n1');if(previous&&current)assert.notEqual(previous.id,current.id);
  await s.op({type:'start_independent'});assert.equal(voicePlan(s.ctx,'n1'),null);
 }
});
const plan:VoiceExplanationPlan={id:'p',nodeId:'n1',nodeRevision:1,graphVersion:1,disclosureLevel:0,approvedText:'Em kiểm tra nhé?',segments:[{id:'s',text:'Em kiểm tra nhé?',cue:{nodeIds:['n1'],edgeIds:[],elementIds:['rg-n1']}}],sourceNodeIds:['n1'],sourceEdgeIds:[],sourceElementIds:['rg-n1'],provider:{preferred:'server',fallback:'speechSynthesis',timing:'segment'}};
test('one Voice owner: subtitles, controls, replay, cancellation and late callbacks',async()=>{
 let end=()=>{};let stops=0,pauses=0,resumes=0,rate=1;const playback:Playback={stop(){stops++;},pause(){pauses++;},resume(){resumes++;},speed(r){rate=r;}};
 const port:SpeechPort={async start(s,r,signal,onEnd){assert.equal(s.text,plan.approvedText);assert.equal(signal.aborted,false);end=onEnd;rate=r;return playback;}};
 const c=new VoiceController(port,()=>{});await c.play(plan);assert.equal(c.snapshot.state,'speaking');assert.equal(c.snapshot.subtitle,plan.approvedText);assert.deepEqual(c.snapshot.cue,plan.segments[0].cue);c.pause();assert.equal(c.snapshot.state,'paused');c.resume();c.speed(1.25);assert.deepEqual([pauses,resumes,rate],[1,1,1.25]);const old=end;c.replay();await new Promise(r=>setTimeout(r,0));old();assert.equal(c.snapshot.state,'speaking');assert.ok(stops>=1);c.stop();end();assert.equal(c.snapshot.state,'idle');assert.equal(c.snapshot.cue,null);assert.equal(c.snapshot.plan,null);
});
test('stopped loading cannot start stale audio; unavailable keeps approved subtitle',async()=>{
 let resolve!:(p:Playback)=>void;let stopped=false;const c=new VoiceController({start:()=>new Promise(r=>{resolve=r;})},()=>{});const run=c.play(plan);c.stop();resolve({stop(){stopped=true;},pause(){},resume(){},speed(){}});await run;assert.ok(stopped);assert.equal(c.snapshot.plan,null);
 const unavailable=new VoiceController({async start(){throw new Error('no_vi_voice');}},()=>{});await unavailable.play(plan);assert.equal(unavailable.snapshot.state,'unavailable');assert.equal(unavailable.snapshot.subtitle,plan.approvedText);assert.equal(unavailable.snapshot.cue,null);
});

test('SpeechSynthesis fallback uses VI, same text, controls and cancellation; missing VI is explicit',async()=>{
 const {browserSpeechPort}=await import('./browserPort.ts');
 const prior=globalThis.SpeechSynthesisUtterance;
 class Utterance {text:string;lang='';voice:unknown;rate=1;onend:(()=>void)|null=null;onerror:(()=>void)|null=null;constructor(text:string){this.text=text;}}
 globalThis.SpeechSynthesisUtterance=Utterance as unknown as typeof SpeechSynthesisUtterance;
 let utterance!:Utterance;let cancelled=0,paused=0,resumed=0;const synth={getVoices:()=>[{lang:'vi-VN'}],addEventListener(){},removeEventListener(){},cancel(){cancelled++;},pause(){paused++;},resume(){resumed++;},speak(u:Utterance){utterance=u;}} as unknown as SpeechSynthesis;
 try{
  const abort=new AbortController();let ended=0;const p=await browserSpeechPort(synth).start(plan.segments[0],1.25,abort.signal,()=>ended++,()=>{});
  assert.equal(utterance.text,plan.approvedText);assert.equal(utterance.lang,'vi-VN');assert.equal(utterance.rate,1.25);p.pause();p.resume();assert.deepEqual([paused,resumed],[1,1]);abort.abort();assert.equal(utterance.onend,null);assert.ok(cancelled>=2);assert.equal(ended,0);
  const noVoice={...synth,getVoices:()=>[]} as unknown as SpeechSynthesis;const a=new AbortController();const attempt=browserSpeechPort(noVoice).start(plan.segments[0],1,a.signal,()=>{},()=>{});a.abort();await assert.rejects(attempt,/no_vi_voice/);
 }finally{globalThis.SpeechSynthesisUtterance=prior;}
});

test('instant completion cannot resurrect speaking state',async()=>{
 let stop=0;const c=new VoiceController({async start(_s,_r,_a,end){end();return{pause(){},resume(){},stop(){stop++;},speed(){}};}},()=>{});await c.play(plan);assert.equal(c.snapshot.state,'idle');assert.equal(c.snapshot.cue,null);assert.ok(stop>=1);
});
