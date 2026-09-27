import { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useDemoAuth } from '@/stores/demoAuthStore';
import { safeReturn } from '@/lib/auth/demo';
export default function DemoLoginPage(){
 const auth=useDemoAuth();const nav=useNavigate();const location=useLocation();const target=safeReturn((location.state as {from?:string}|null)?.from ?? new URLSearchParams(location.search).get('return'));
 const submitting=useRef(false);
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [show,setShow]=useState(false);const [offline,setOffline]=useState(false);
 useEffect(()=>{if(!auth.ready)void auth.init();},[auth.ready]);
 if(auth.session)return <Navigate to={target} replace/>;
 return <main className="flex h-full w-full items-center justify-center overflow-y-auto bg-[#0a0a1a] p-4 text-slate-100">
 <section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl" aria-labelledby="login-title">
 <Link to="/" className="text-sm text-cyan-300">← Vũ trụ Toán học</Link>
 <h1 id="login-title" className="mt-4 text-2xl font-semibold">Đăng nhập Math Coach</h1>
 <p className="mt-2 text-sm text-amber-200">Tài khoản demo · Chỉ để trình diễn, không phải xác thực sản phẩm.</p>
 <form noValidate className="mt-5 space-y-4" onSubmit={async e=>{e.preventDefault();if(submitting.current)return;submitting.current=true;try{if(await auth.login(email.trim(),password,offline)){setPassword('');nav(target,{replace:true});}}finally{submitting.current=false;}}}>
 <div><label htmlFor="demo-email">Email</label><input autoFocus id="demo-email" type="email" required autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"/></div>
 <div><label htmlFor="demo-password">Mật khẩu</label><div className="mt-1 flex gap-2"><input id="demo-password" type={show?'text':'password'} required autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-600 bg-slate-950 p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"/><button type="button" aria-pressed={show} aria-label={show?'Ẩn mật khẩu':'Hiện mật khẩu'} onClick={()=>setShow(!show)} className="rounded-lg bg-slate-800 px-2">{show?'Ẩn':'Hiện'}</button></div></div>
 <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={offline} onChange={e=>setOffline(e.target.checked)} data-testid="offline-demo"/>Demo ngoại tuyến (chỉ chặn điều hướng, không bảo mật)</label>
 {auth.error&&<p role="alert" className="text-sm text-rose-300">{auth.error}</p>}
 <button type="submit" disabled={auth.pending||!auth.ready} className="w-full rounded-lg bg-indigo-500 p-2 font-semibold focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-50">{auth.pending?'Đang đăng nhập…':'Đăng nhập demo'}</button>
 </form>
 <div className="mt-5 rounded-lg bg-slate-950 p-3 text-sm text-slate-300"><p>Tài khoản công khai để thử:</p><p className="break-all">student@mathcoach.demo</p><p>Demo@123456</p><p className="mt-2 text-xs">Phiên đăng nhập tối đa 8 giờ. Bài đang giải không lưu khi tải lại trang.</p></div>
 </section></main>;
}
