import { create } from 'zustand';
import { validSession, offlineLogin, loginError, type DemoSession } from '@/lib/auth/demo';
import { useCanvas } from '@/stores/reasoningSessionStore';
const KEY='mathcoach.offline-demo'; const OUT='mathcoach.demo-signed-out';
let generation=0;
async function api(path:string,body?:unknown) {
  const r=await fetch(`/api/demo-auth/${path}`,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(5000)});
  if(!r.ok)throw new Error(r.status===401?'invalid_credentials':r.status===429?'try_later':'unavailable');
  return r.json();
}
interface State { session:DemoSession|null; ready:boolean; pending:boolean; error:string|null; init():Promise<void>; login(e:string,p:string,offline:boolean):Promise<boolean>; logout():Promise<void>; }
export const useDemoAuth=create<State>((set,get)=>({session:null,ready:false,pending:false,error:null,
 async init(){
  const epoch=generation;
  let session:DemoSession|null=null;
  try { const s=JSON.parse(sessionStorage.getItem(KEY)??'null');if(validSession(s)&&s.mode==='offline')session=s; }catch{/* no persistence */}
  if(!session && sessionStorage.getItem(OUT)!=='true')try{const r=await api('session');if(validSession(r.session))session=r.session;}catch{/* explicit offline login required */}
  if(epoch===generation)set({session,ready:true});
 },
 async login(email,password,offline){
  if(get().pending)return false;
  const error=loginError(email,password);if(error){set({error});return false;}
  set({pending:true,error:null}); const epoch=++generation;
  try{
   const s=offline?offlineLogin(email,password):(await api('login',{email,password})).session;
   if(!validSession(s))throw new Error('invalid_credentials');
   if(epoch!==generation)return false;
   useCanvas.getState().reset();sessionStorage.removeItem(OUT);
   if(s.mode==='offline')sessionStorage.setItem(KEY,JSON.stringify(s));else sessionStorage.removeItem(KEY);
   set({session:s,pending:false,ready:true});return true;
  }catch(e){if(epoch===generation)set({pending:false,error:(e as Error).message==='invalid_credentials'?'Email hoặc mật khẩu chưa đúng.':(e as Error).message==='try_later'?'Em thử lại sau một phút nhé.':'Không kết nối được máy chủ. Em có thể chọn demo ngoại tuyến.'});return false;}
 },
 async logout(){
  ++generation;const mode=get().session?.mode;
  set({session:null,ready:true,pending:false,error:null});sessionStorage.removeItem(KEY);sessionStorage.setItem(OUT,'true');useCanvas.getState().reset();
  if(mode==='server')try{await api('logout',{});}catch{/* signed-out marker prevents restoring the cookie locally */}
 }
}));
