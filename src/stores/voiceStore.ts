import { create } from 'zustand';
import { VoiceController, type VoiceSnapshot, type SpeechPort } from '@/lib/voice/playback';
import { browserSpeechPort, audioPlayback } from '@/lib/voice/browserPort';
import { voicePlan } from '@/lib/voice/plan';
import { toWire } from '@/lib/reasoning/orchestrator';
import { useCanvas } from '@/stores/reasoningSessionStore';
import { useDemoAuth } from '@/stores/demoAuthStore';
interface VoiceStore extends VoiceSnapshot {provider:string; listen(id:string):void;pause():void;resume():void;replay():void;stop():void;speed(r:number):void;}
let controller:VoiceController;
const port:SpeechPort={async start(segment,rate,signal,end,error){
 const state=useCanvas.getState();const plan=controller.snapshot.plan;
 if(!state.ctx||!plan||state.ctx.phase!=='reasoning'||state.ctx.graph.version!==plan.graphVersion)throw new Error('stale');
 if(useDemoAuth.getState().session?.mode==='server'){
  const abort=new AbortController();const cancel=()=>abort.abort();
  signal.addEventListener('abort',cancel,{once:true});const timer=window.setTimeout(cancel,15000);
  try{
   const r=await fetch('/api/voice/speech',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},signal:abort.signal,body:JSON.stringify({request:{context:toWire(state.ctx),expectedGraphVersion:plan.graphVersion,opId:'voice-read',op:{type:'select_node',nodeId:plan.nodeId},selectedNodeIds:[plan.nodeId]},segmentIndex:controller.snapshot.index})});
   if(!r.ok || r.headers.get('X-Voice-Plan')!==plan.id)throw new Error('provider_unavailable');
   const blob=await r.blob();if(signal.aborted)throw new Error('aborted');
   const provider=r.headers.get('X-Voice-Provider')==='mock'?'mock':'openai';
   controller.metadata(provider);
   useVoice.setState({provider:provider==='mock'?'Âm thanh giả lập kiểm thử':'Giọng AI tổng hợp'});
   return await audioPlayback(blob,rate,signal,end,error);
  }catch{if(signal.aborted)throw new Error('aborted');}
  finally{window.clearTimeout(timer);signal.removeEventListener('abort',cancel);}
 }
 controller.metadata('speechSynthesis',useDemoAuth.getState().session?.mode==='offline'?'offline_demo':'server_unavailable');
 useVoice.setState({provider:'Giọng tổng hợp của trình duyệt · dự phòng'});
 return browserSpeechPort().start(segment,rate,signal,end,error);
}};
export const useVoice=create<VoiceStore>((set)=>({state:'idle',subtitle:'',cue:null,plan:null,index:0,rate:1,provider:'',
 listen(id){const s=useCanvas.getState();if(!s.ctx||s.pending)return;const p=voicePlan(s.ctx,id);if(p)void controller.play(p);},
 pause(){controller.pause();},resume(){controller.resume();},replay(){controller.replay();},stop(){controller.stop();},speed(r){controller.speed(r);}
}));
controller=new VoiceController(port,s=>useVoice.setState(s));
// Synchronous subscription invalidates audio before the UI changes (including F8).
useCanvas.subscribe((s,prev)=>{if(s.ctx!==prev.ctx||s.pending!==prev.pending||s.selected!==prev.selected||s.selectedEdgeId!==prev.selectedEdgeId||s.ui!==prev.ui)controller.stop();});
useDemoAuth.subscribe((s,prev)=>{if(s.session!==prev.session)controller.stop();});
