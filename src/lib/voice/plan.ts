/** Deterministic derivative of approved visible explanations. Never changes reasoning. */
import { buildGraphViewModel, explanationForbidden, type ExplainContext } from '../reasoning/explanations.ts';
import { solveProblem } from '../reasoning/facts.ts';
import { findLeak } from '../reasoning/disclosure.ts';
import { planForContext } from '../reasoning/orchestrator.ts';
import { buildScoringResult } from '../reasoning/completion.ts';
import { hash } from '../reasoning/problemParser.ts';
import type { DisclosureLevel, SessionContext } from '../reasoning/types.ts';
export interface VoiceCue { nodeIds:string[]; edgeIds:string[]; elementIds:string[]; }
export interface SpeechSegment { id:string; text:string; cue:VoiceCue; }
export interface VoiceExplanationPlan {
 /** 'completion' = mission-completion summary (§24.8); absent = row explanation. */
 kind?:'completion';
 id:string; nodeId:string; nodeRevision:number; graphVersion:number; disclosureLevel:DisclosureLevel;
 approvedText:string; segments:SpeechSegment[]; sourceNodeIds:string[]; sourceEdgeIds:string[]; sourceElementIds:string[];
 provider:{preferred:'server';fallback:'speechSynthesis';timing:'segment';actual?:'openai'|'mock'|'speechSynthesis';reason?:string};
}
const PII=/\b[^\s@]+@[^\s@]+\.[^\s@]+\b|(?:\+?84|0)\d[\d .-]{7,}/;
export function voicePlan(ctx:SessionContext,nodeId:string):VoiceExplanationPlan|null {
 if(ctx.phase!=='reasoning' || ctx.graph.graphId!=='main')return null;
 const specs=planForContext(ctx,[nodeId]);
 const evidence:ExplainContext={spec:ctx.problemSpec,facts:solveProblem(ctx.problemSpec),graph:ctx.graph,phase:ctx.phase,disclosure:ctx.disclosure};
 const vm=buildGraphViewModel(evidence);const nv=vm.nodes.find(n=>n.nodeId===nodeId);const node=ctx.graph.nodes[nodeId];const e=nv?.explanation;
 if(!nv||!node||node.lifecycle!=='active'||!e||e.graphVersion!==ctx.graph.version||e.nodeRevision!==node.revision)return null;
 const forbidden=explanationForbidden(evidence);
 const elements=specs.flatMap(s=>s.elements);
 const cue=(ids:string[],edgeIds:string[]=[]):VoiceCue=>({nodeIds:ids,edgeIds,elementIds:[...new Set(elements.filter(el=>el.sourceNodeIds.some(id=>ids.includes(id))).map(el=>el.elementId))]});
 // Incorrect D0: ONLY the current approved Socratic question, not a generated script.
 const texts=nv.validationStatus==='invalid' && nv.disclosureLevel===0 ? [e.prompt] : [e.explanationShort,e.explanationDetailed,e.prompt];
 const segments:SpeechSegment[]=[];
 const append=(text:string|null|undefined,c:VoiceCue)=>{
  if(!text||segments.some(s=>s.text===text)||findLeak(text,forbidden))return;
  // Only authored builder text, never learner names/free-form text, reaches TTS.
  if(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b|(?:\+?84|0)\d[\d .-]{7,}/.test(text))return;
  segments.push({id:`segment-${segments.length}`,text,cue:c});
 };
 for(const text of texts)append(text,cue([nodeId]));
 if(nv.validationStatus!=='invalid' || nv.disclosureLevel>0)for(const edge of vm.edges.filter(x=>x.to===nodeId).slice(0,2))append(edge.explanation,cue([edge.from,edge.to],[edge.edgeId]));
 if(!segments.length)return null;
 const unique=(xs:string[])=>[...new Set(xs)];
 return {id:`voice:${e.explanationId}`,nodeId,nodeRevision:node.revision,graphVersion:ctx.graph.version,disclosureLevel:e.disclosureLevel,approvedText:segments.map(s=>s.text).join('\n'),segments,sourceNodeIds:unique(segments.flatMap(s=>s.cue.nodeIds)),sourceEdgeIds:unique(segments.flatMap(s=>s.cue.edgeIds)),sourceElementIds:unique(segments.flatMap(s=>s.cue.elementIds)),provider:{preferred:'server',fallback:'speechSynthesis',timing:'segment'}};
}
/**
 * Completion summary for Voice: exactly the approved completion message sentences
 * (deterministic templates over recomputed evidence), in display order. Only in summary.
 */
export function completionVoicePlan(ctx:SessionContext):VoiceExplanationPlan|null {
 if(ctx.phase!=='summary'||ctx.graph.graphId!=='main')return null;
 const texts=buildScoringResult(ctx).message.spoken;
 const segments:SpeechSegment[]=texts.map((text,i)=>({id:`completion-${i}`,text,cue:{nodeIds:[],edgeIds:[],elementIds:[`completion:${i}`]}})).filter(s=>!PII.test(s.text));
 if(!segments.length)return null;
 const approvedText=segments.map(s=>s.text).join('\n');
 return {kind:'completion',id:`voice:completion:${hash(approvedText)}@v${ctx.graph.version}`,nodeId:'',nodeRevision:0,graphVersion:ctx.graph.version,disclosureLevel:0,approvedText,segments,sourceNodeIds:[],sourceEdgeIds:[],sourceElementIds:segments.flatMap(s=>s.cue.elementIds),provider:{preferred:'server',fallback:'speechSynthesis',timing:'segment'}};
}
