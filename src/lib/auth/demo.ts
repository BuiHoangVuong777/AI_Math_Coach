/** Offline credentials are intentionally public. This adapter only gates navigation. */
export const PUBLIC_DEMO_EMAIL = 'student@mathcoach.demo';
export const PUBLIC_DEMO_PASSWORD = 'Demo@123456';
export interface DemoSession { email: string; expiresAt: number; mode: 'server' | 'offline'; demo: true; }
export function validSession(s: unknown, now=Date.now()): s is DemoSession {
  const x=s as DemoSession;return !!x && x.demo===true && typeof x.email==='string' && typeof x.expiresAt==='number' && x.expiresAt>now && ['server','offline'].includes(x.mode);
}
export function offlineLogin(email:string,password:string,now=Date.now()): DemoSession|null {
  return email===PUBLIC_DEMO_EMAIL && password===PUBLIC_DEMO_PASSWORD ? {email,expiresAt:now+8*3600000,mode:'offline',demo:true}:null;
}
export function safeReturn(path:unknown): string { return typeof path==='string' && /^\/canvas(?:[?#].*)?$/.test(path) ? path : '/canvas'; }
export function loginError(email:string,password:string): string|null {
  if (!email.trim() || !password) return 'Em nhập email và mật khẩu nhé.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email chưa đúng định dạng.';
  return null;
}
