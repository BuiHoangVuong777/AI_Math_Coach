/** Public demonstration credentials; this is NOT production identity/security. */
import { randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
export const DEMO_LIFETIME_MS = 8 * 60 * 60 * 1000;
export interface DemoAuthConfig { enabled: boolean; email: string; password: string; }
export function demoAuthConfig(env: NodeJS.ProcessEnv = process.env): DemoAuthConfig {
  return { enabled: env.DEMO_AUTH_ENABLED === 'true' || (env.DEMO_AUTH_ENABLED !== 'false' && env.NODE_ENV !== 'production'), email: env.DEMO_AUTH_EMAIL || 'student@mathcoach.demo', password: env.DEMO_AUTH_PASSWORD || 'Demo@123456' };
}
export function json(res: ServerResponse, status: number, body: unknown, headers: Record<string,string> = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...headers });
  res.end(JSON.stringify(body));
}
export async function bodyJson(req: IncomingMessage, max = 65536): Promise<unknown> {
  if (!String(req.headers['content-type']).includes('application/json')) throw new Error('media');
  let size=0; const chunks: Buffer[]=[];
  for await (const chunk of req) { size+=chunk.length; if(size>max) throw new Error('size'); chunks.push(chunk); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export function sameOrigin(req: IncomingMessage): boolean {
  if (req.headers['sec-fetch-site'] === 'cross-site') return false;
  if (!req.headers.origin) return true; // Non-browser clients; no production security claim.
  try { return new URL(req.headers.origin).host === req.headers.host; } catch { return false; }
}
export function createDemoAuth(config: DemoAuthConfig, now = Date.now) {
  const sessions = new Map<string, { email: string; expiresAt: number }>();
  const attempts = new Map<string, { count: number; until: number }>();
  const token = (req: IncomingMessage) => /(?:^|;\s*)mathcoach_demo=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie ?? '')?.[1];
  const equal = (a: unknown, b: string) => typeof a === 'string' && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a),Buffer.from(b));
  const cookie = (req: IncomingMessage, id: string, seconds: number) => `mathcoach_demo=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${'encrypted' in req.socket && req.socket.encrypted ? '; Secure' : ''}`;
  const session = (req: IncomingMessage) => {
    const id = token(req); const s=id ? sessions.get(id) : null;
    if (!s || !config.enabled || s.expiresAt<=now()) { if(id) sessions.delete(id); return null; }
    return { ...s, mode: 'server' as const, demo: true as const };
  };
  return { session, async handle(req: IncomingMessage, res: ServerResponse, url: URL) {
    if (!url.pathname.startsWith('/api/demo-auth/')) return false;
    if (!config.enabled) { json(res,503,{error:'demo_disabled'}); return true; }
    if (req.method==='GET' && url.pathname.endsWith('/session')) { json(res,200,{session:session(req)}); return true; }
    if (req.method!=='POST' || !sameOrigin(req)) { json(res,403,{error:'not_allowed'}); return true; }
    if (url.pathname.endsWith('/logout')) { const id=token(req); if(id)sessions.delete(id); json(res,200,{ok:true},{'Set-Cookie':cookie(req,'',0)}); return true; }
    if (!url.pathname.endsWith('/login')) { json(res,404,{error:'not_found'}); return true; }
    const key=req.socket.remoteAddress??'local'; const old=attempts.get(key); const a=old && old.until>now()?old:{count:0,until:now()+60000}; attempts.set(key,a);
    if (++a.count>20) {json(res,429,{error:'try_later'});return true;}
    try {
      const b=await bodyJson(req,2048) as Record<string,unknown>;
      if (!b || Object.keys(b).sort().join()!=='email,password' || !equal(b.email,config.email) || !equal(b.password,config.password)) { json(res,401,{error:'invalid_credentials'}); return true; }
      for (const [id,s] of sessions) if(s.expiresAt<=now())sessions.delete(id);
      const prior=token(req);if(prior)sessions.delete(prior);
      const id=randomBytes(32).toString('hex'); const s={email:config.email,expiresAt:now()+DEMO_LIFETIME_MS};sessions.set(id,s);
      json(res,200,{session:{...s,mode:'server',demo:true}},{'Set-Cookie':cookie(req,id,DEMO_LIFETIME_MS/1000)});
    } catch { json(res,400,{error:'invalid_request'}); }
    return true;
  }};
}
