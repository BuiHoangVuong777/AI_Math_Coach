/** Deterministic SILENT audio fixture. No spoken quality/provider claim. */
import type { SpeechProvider } from './voiceRoutes.ts';
export const mockSpeech:SpeechProvider={name:'mock',async speak(){
 const samples=16000*3;const bytes=Buffer.alloc(44+samples*2);bytes.write('RIFF');bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(16000,24);bytes.writeUInt32LE(32000,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(samples*2,40);
 return {bytes,type:'audio/wav'};
}};
