import type { VoiceExplanationPlan, SpeechSegment, VoiceCue } from './plan.ts';
export type VoiceState='idle'|'loading'|'speaking'|'paused'|'unavailable'|'error';
export interface Playback { pause():void; resume():void; stop():void; speed(rate:number):void; }
export interface SpeechPort { start(segment:SpeechSegment,rate:number,signal:AbortSignal,onEnd:()=>void,onError:()=>void):Promise<Playback>; }
export interface VoiceSnapshot { state:VoiceState; subtitle:string; cue:VoiceCue|null; plan:VoiceExplanationPlan|null; index:number; rate:number; }
/** One owner, generation guards both asynchronous loading and audio callbacks. */
export class VoiceController {
 snapshot:VoiceSnapshot={state:'idle',subtitle:'',cue:null,plan:null,index:0,rate:1};
 private epoch=0;private abort:AbortController|null=null;private active:Playback|null=null;
 private port:SpeechPort;private emit:(s:VoiceSnapshot)=>void;
 constructor(port:SpeechPort,emit:(s:VoiceSnapshot)=>void){this.port=port;this.emit=emit;}
 private update(p:Partial<VoiceSnapshot>){this.snapshot={...this.snapshot,...p};this.emit(this.snapshot);}
 stop(){this.epoch++;this.abort?.abort();this.active?.stop();this.abort=null;this.active=null;this.update({state:'idle',subtitle:'',cue:null,plan:null,index:0});}
 async play(plan:VoiceExplanationPlan){this.stop();this.update({plan,index:0});await this.segment();}
 private async segment(){
  const s=this.snapshot.plan?.segments[this.snapshot.index];if(!s){this.update({state:'idle',cue:null});return;}
  const epoch=++this.epoch;this.abort=new AbortController();this.update({state:'loading',subtitle:s.text,cue:null});
  try{
   const playback=await this.port.start(s,this.snapshot.rate,this.abort.signal,()=>{
    if(epoch!==this.epoch)return;this.epoch++;this.active=null;this.update({index:this.snapshot.index+1});void this.segment();
   },()=>{if(epoch===this.epoch){this.epoch++;this.active?.stop();this.update({state:'error',cue:null});}});
   if(epoch!==this.epoch){playback.stop();return;}this.active=playback;this.update({state:'speaking',cue:s.cue});
  }catch{if(epoch===this.epoch)this.update({state:'unavailable',cue:null});}
 }
 metadata(actual:'openai'|'mock'|'speechSynthesis',reason?:string){const p=this.snapshot.plan;if(p)this.update({plan:{...p,provider:{...p.provider,actual,reason}}});}
 pause(){if(this.snapshot.state==='speaking'){this.active?.pause();this.update({state:'paused'});}}
 resume(){if(this.snapshot.state==='paused'){this.active?.resume();this.update({state:'speaking'});}}
 replay(){const p=this.snapshot.plan;if(p)void this.play(p);}
 speed(rate:number){if(rate<0.75||rate>1.5)return;this.update({rate});this.active?.speed(rate);}
}
