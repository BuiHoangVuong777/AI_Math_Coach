import type { IncomingMessage,ServerResponse } from 'node:http';
import { bodyJson,json,sameOrigin } from './demoAuth.ts';
import { validateTurnRequest } from '../src/lib/reasoning/contract.ts';
import { runTurn } from '../src/lib/reasoning/orchestrator.ts';
import { completionVoicePlan, voicePlan } from '../src/lib/voice/plan.ts';
import type { RateLimiter } from './rateLimit.ts';
export interface SpeechProvider {name:'openai'|'mock';speak(text:string,signal:AbortSignal):Promise<{bytes:Buffer;type:string}>;}
export async function handleVoice(req:IncomingMessage,res:ServerResponse,url:URL,provider:SpeechProvider|null,authenticated:boolean,limiter:RateLimiter):Promise<boolean>{
 if(!url.pathname.startsWith('/api/voice/'))return false;
 if(!authenticated||!sameOrigin(req)){json(res,401,{error:'demo_login_required'});return true;}
 if(req.method!=='POST'||url.pathname!=='/api/voice/speech'){json(res,404,{error:'not_found'});return true;}
 if(limiter.take(req.socket.remoteAddress??'local')){json(res,429,{error:'try_later'});return true;}
 const abort=new AbortController();const timeout=setTimeout(()=>abort.abort(),12000);res.on('close',()=>abort.abort());
 try{
  const b=await bodyJson(req) as {request:unknown;segmentIndex:number;kind?:unknown};
  const keys=b&&typeof b==='object'?Object.keys(b).sort().join():'';
  const completion=keys==='kind,request,segmentIndex'&&b.kind==='completion';
  if(!b||(keys!=='request,segmentIndex'&&!completion)||!Number.isInteger(b.segmentIndex))throw new Error('invalid');
  const v=validateTurnRequest(b.request);
  if(!v.ok||v.value.op.type!=='select_node')throw new Error('invalid');
  if(completion?v.value.context.phase!=='summary':(!v.value.op.nodeId||v.value.context.phase!=='reasoning'))throw new Error('invalid');
  // Recompute all validations; client view models/approved scripts/scores are never accepted.
  const request=completion?{...v.value,context:{...v.value.context,processedOpIds:[]}}:v.value;
  const result=await runTurn(request,{});if(result.error)throw new Error('invalid');
  const p=completion?completionVoicePlan(result.context):voicePlan(result.context,v.value.op.nodeId!);const s=p?.segments[b.segmentIndex];
  if(!p||!s)throw new Error('invalid');
  if(!provider){json(res,503,{error:'browser_fallback'});return true;}
  const speech=await Promise.race([provider.speak(s.text,abort.signal),new Promise<never>((_,reject)=>abort.signal.addEventListener('abort',()=>reject(new Error('timeout')),{once:true}))]);
  if(!abort.signal.aborted){res.writeHead(200,{'Content-Type':speech.type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Voice-Plan':p.id,'X-Voice-Provider':provider.name});res.end(speech.bytes);}
 }catch{if(!res.headersSent&&!res.destroyed)json(res,400,{error:'voice_unavailable'});}finally{clearTimeout(timeout);}
 return true;
}
