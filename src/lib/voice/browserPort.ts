import type { SpeechPort, Playback } from './playback.ts';
/** VI only; unavailable devices keep the exact subtitle rather than choosing another language. */
export function browserSpeechPort(synth:SpeechSynthesis=window.speechSynthesis):SpeechPort {
 return {async start(segment,rate,signal,end,error){
  if(!synth || typeof SpeechSynthesisUtterance==='undefined')throw new Error('unsupported');
  let voice=synth.getVoices().find(v=>v.lang.toLowerCase().startsWith('vi'));
  if(!voice){await new Promise<void>(resolve=>{const done=()=>{clearTimeout(timer);synth.removeEventListener('voiceschanged',done);resolve();};const timer=setTimeout(done,1500);synth.addEventListener('voiceschanged',done);signal.addEventListener('abort',done,{once:true});});voice=synth.getVoices().find(v=>v.lang.toLowerCase().startsWith('vi'));}
  if(!voice||signal.aborted)throw new Error('no_vi_voice');
  const u=new SpeechSynthesisUtterance(segment.text);u.lang='vi-VN';u.voice=voice;u.rate=rate;
  let stopped=false;u.onend=()=>{if(!stopped)end();};u.onerror=()=>{if(!stopped)error();};
  const stop=()=>{stopped=true;u.onend=null;u.onerror=null;synth.cancel();};signal.addEventListener('abort',stop,{once:true});
  synth.cancel();synth.speak(u);
  return {pause:()=>synth.pause(),resume:()=>synth.resume(),stop,speed:r=>{u.rate=r; /* most browsers apply new rate to the next utterance */}};
 }};
}
export function audioPlayback(blob:Blob,rate:number,signal:AbortSignal,end:()=>void,error:()=>void):Promise<Playback>{
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(blob);const audio=new Audio(url);audio.playbackRate=rate;let stopped=false;
  const release=()=>{if(stopped)return;stopped=true;audio.pause();audio.removeAttribute('src');audio.load();URL.revokeObjectURL(url);};
  signal.addEventListener('abort',()=>{release();reject(new Error('aborted'));},{once:true});
  audio.onended=()=>{release();end();};audio.onerror=()=>{release();error();reject(new Error('audio_error'));};
  if(signal.aborted){release();reject(new Error('aborted'));return;}
  void audio.play().then(()=>resolve({pause:()=>audio.pause(),resume:()=>{void audio.play().catch(error);},stop:release,speed:r=>{audio.playbackRate=r;}})).catch(e=>{release();reject(e);});
 });
}
