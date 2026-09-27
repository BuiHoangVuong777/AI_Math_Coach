import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useDemoAuth } from '@/stores/demoAuthStore';
export default function DemoGuard({children}:{children:React.ReactNode}){
 const a=useDemoAuth();const loc=useLocation();
 useEffect(()=>{if(!a.ready)void a.init();},[a.ready]);
 useEffect(()=>{
  if(!a.session)return;
  const timer=window.setTimeout(()=>void a.logout(),Math.max(0,a.session.expiresAt-Date.now()));
  const check=()=>{if(a.session && a.session.expiresAt<=Date.now())void a.logout();};
  window.addEventListener('focus',check);return()=>{clearTimeout(timer);window.removeEventListener('focus',check);};
 },[a.session]);
 if(!a.ready)return <p role="status" className="p-6 text-slate-200">Đang kiểm tra phiên demo…</p>;
 if(!a.session || a.session.expiresAt<=Date.now())return <Navigate to="/login" replace state={{from:loc.pathname+loc.search+loc.hash}}/>;
 return <>{children}</>;
}
