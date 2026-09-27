import { useEffect } from 'react';
import { useVoice } from '@/stores/voiceStore';
import { useCanvas } from '@/stores/reasoningSessionStore';
export function VoiceListen({nodeId,disabled=false}:{nodeId:string;disabled?:boolean}){
 const listen=useVoice(s=>s.listen);const ctx=useCanvas(s=>s.ctx);
 if(ctx?.phase!=='reasoning')return null;
 return <button type="button" disabled={disabled} data-voice-listen={nodeId} onClick={e=>{e.stopPropagation();const s=useCanvas.getState();if(s.selected[0]!==nodeId)s.select([nodeId]);listen(nodeId);}} aria-label={`Nghe giải thích bước ${ctx.graph.nodes[nodeId]?.rowIndex ?? ''}`} className="rounded bg-indigo-800 px-1.5 py-0.5 text-[11px] text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-40">Nghe</button>;
}
export default function VoiceControls(){
 const v=useVoice();
 useEffect(()=>()=>useVoice.getState().stop(),[]);
 if(!v.plan)return null;
 const label={idle:'Đã đọc xong',loading:'Đang tải giọng đọc…',speaking:'Đang đọc',paused:'Đã tạm dừng',unavailable:'Không có giọng tiếng Việt khả dụng trên thiết bị này. Em vẫn đọc phụ đề được.',error:'Giọng đọc gặp lỗi. Em thử nghe lại hoặc đọc phụ đề nhé.'}[v.state];
 const btn='rounded bg-slate-800 px-2 py-1 text-xs text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-40';
 return <section aria-label="Giọng đọc hướng dẫn" className="sticky top-16 z-50 mb-3 space-y-2 rounded-xl border border-indigo-400/40 bg-slate-950 p-3" data-testid="voice-controls" data-voice-state={v.state}>
 <p role="status" className="text-xs text-slate-300">{label} · {v.provider}</p>
 <p className="break-words text-sm text-white" data-testid="voice-subtitle" aria-live="off">{v.subtitle}</p>
 <div className="flex flex-wrap items-center gap-2">
 <button className={btn} type="button" onClick={v.pause} disabled={v.state!=='speaking'}>Tạm dừng</button>
 <button className={btn} type="button" onClick={v.resume} disabled={v.state!=='paused'}>Tiếp tục</button>
 <button className={btn} type="button" onClick={v.replay} disabled={v.state==='loading'}>Nghe lại</button>
 <button className={btn} type="button" onClick={v.stop}>Dừng đọc</button>
 <label className="text-xs text-slate-300">Tốc độ <select aria-label="Tốc độ giọng đọc" value={v.rate} onChange={e=>v.speed(Number(e.target.value))} className="rounded bg-slate-800 p-1">{[0.75,1,1.25,1.5].map(r=><option key={r} value={r}>{r}×</option>)}</select></label>
 </div><p className="text-[11px] text-slate-400">Giọng tổng hợp, không phải người thật. Đồng bộ theo đoạn; tốc độ giọng trình duyệt áp dụng đầy đủ từ đoạn tiếp theo.</p>
 </section>;
}
