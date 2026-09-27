/** No client secrets; send ONLY the guarded segment, no identifiers/history. */
import OpenAI from 'openai';
import type { SpeechProvider } from './voiceRoutes.ts';
export function createOpenAISpeech(apiKey:string,env:NodeJS.ProcessEnv=process.env):SpeechProvider|null{
 if(env.OPENAI_TTS_ENABLED==='false')return null;
 const client=new OpenAI({apiKey,maxRetries:0,timeout:12000});
 return {name:'openai',async speak(text,signal){
  const response=await client.audio.speech.create({model:env.OPENAI_TTS_MODEL||'gpt-4o-mini-tts',voice:env.OPENAI_TTS_VOICE||'coral',input:text,response_format:'mp3',instructions:'Đọc nguyên văn bằng tiếng Việt, rõ ràng và nhẹ nhàng. Không thêm hoặc sửa nội dung.'},{signal});
  return {bytes:Buffer.from(await response.arrayBuffer()),type:'audio/mpeg'};
 }};
}
