import {test} from 'node:test';import assert from 'node:assert/strict';import type {AddressInfo} from 'node:net';
import {createCoachServer} from './app.ts';import {createRateLimiter} from './rateLimit.ts';import {createDemoAuth,demoAuthConfig,DEMO_LIFETIME_MS} from './demoAuth.ts';import {Session} from '../src/lib/reasoning/testkit.ts';import * as F from '../src/lib/reasoning/fixtures.ts';import {toWire} from '../src/lib/reasoning/orchestrator.ts';import {voicePlan} from '../src/lib/voice/plan.ts';
import type {IncomingMessage} from 'node:http';
test('demo auth disabled in production unless explicit; cookie session expires',()=>{
 assert.equal(demoAuthConfig({NODE_ENV:'production'}).enabled,false);assert.equal(demoAuthConfig({NODE_ENV:'production',DEMO_AUTH_ENABLED:'true'}).enabled,true);
 const a=createDemoAuth(demoAuthConfig({}),()=>DEMO_LIFETIME_MS+1);assert.equal(a.session({headers:{cookie:'mathcoach_demo='+'a'.repeat(64)}} as IncomingMessage),null);
});
test('HTTP demo login/logout and Voice rebuild: only approved text reaches mock provider',async()=>{
 const spoken:string[]=[];const logs:unknown[]=[];const server=createCoachServer({generator:null,model:'test',timeoutMs:1000,perClientLimiter:createRateLimiter({windowMs:60000,max:100}),globalLimiter:createRateLimiter({windowMs:60000,max:100}),demoAuth:demoAuthConfig({}),speech:{name:'mock',async speak(text){spoken.push(text);return{bytes:Buffer.from('fixture'),type:'audio/wav'};}},log:x=>logs.push(x)});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
 const post=(path:string,body:unknown,cookie='')=>fetch(url+path,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
 try{
  assert.equal((await post('/api/demo-auth/login',{email:'student@mathcoach.demo',password:'wrong'})).status,401);
  const login=await post('/api/demo-auth/login',{email:'student@mathcoach.demo',password:'Demo@123456'});assert.equal(login.status,200);const header=login.headers.get('set-cookie')!;assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Lax/);const cookie=header.split(';')[0];assert.ok(!(await login.text()).includes('Demo@'));
  assert.ok((await(await fetch(url+'/api/demo-auth/session',{headers:{Cookie:cookie}})).json()).session);
  const s=new Session(F.PROBLEM_B);await s.add(F.ROWS_B.hypothesis);const req={request:{context:toWire(s.ctx),expectedGraphVersion:s.ctx.graph.version,opId:'voice',op:{type:'select_node',nodeId:'n1'}},segmentIndex:0};
  assert.equal((await post('/api/voice/speech',req)).status,401);assert.equal(spoken.length,0);
  const audio=await post('/api/voice/speech',req,cookie);assert.equal(audio.status,200);assert.equal(audio.headers.get('X-Voice-Plan'),voicePlan(s.ctx,'n1')!.id);assert.equal(spoken[0],voicePlan(s.ctx,'n1')!.segments[0].text);assert.ok(!spoken[0].includes('9'));
  assert.equal((await post('/api/voice/speech',{...req,text:'đáp án là 9'},cookie)).status,400);
  const context=structuredClone(s.ctx);context.phase='independent';assert.equal((await post('/api/voice/speech',{...req,request:{...req.request,context}},cookie)).status,400);assert.equal(spoken.length,1);
  const cross=await fetch(url+'/api/demo-auth/logout',{method:'POST',headers:{Origin:'https://evil.test',Cookie:cookie}});assert.equal(cross.status,403);
  await post('/api/demo-auth/logout',{},cookie);assert.equal((await(await fetch(url+'/api/demo-auth/session',{headers:{Cookie:cookie}})).json()).session,null);assert.equal((await post('/api/voice/speech',req,cookie)).status,401);
  assert.ok(!JSON.stringify(logs).includes('Demo@'));
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});

test('server demo session expiry and disabled authentication are enforced',async()=>{
 const {createServer}=await import('node:http');let now=1000;const auth=createDemoAuth(demoAuthConfig({}),()=>now);
 const server=createServer(async(req,res)=>{await auth.handle(req,res,new URL(req.url??'/','http://localhost'));});await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
 try{const login=await fetch(url+'/api/demo-auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'student@mathcoach.demo',password:'Demo@123456'})});const cookie=login.headers.get('set-cookie')!.split(';')[0];assert.ok((await(await fetch(url+'/api/demo-auth/session',{headers:{Cookie:cookie}})).json()).session);now+=DEMO_LIFETIME_MS;assert.equal((await(await fetch(url+'/api/demo-auth/session',{headers:{Cookie:cookie}})).json()).session,null);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});

test('TTS provider failure returns safe fallback signal, no upstream secret',async()=>{
 const server=createCoachServer({generator:null,model:'test',timeoutMs:1000,perClientLimiter:createRateLimiter({windowMs:60000,max:100}),globalLimiter:createRateLimiter({windowMs:60000,max:100}),demoAuth:demoAuthConfig({}),speech:{name:'mock',async speak(){throw new Error('upstream-private-key');}}});await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${(server.address() as AddressInfo).port}`;
 try{const login=await fetch(url+'/api/demo-auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'student@mathcoach.demo',password:'Demo@123456'})});const cookie=login.headers.get('set-cookie')!.split(';')[0];const s=new Session(F.PROBLEM_A);await s.add(F.ROWS_A[0]);const r=await fetch(url+'/api/voice/speech',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({request:{context:toWire(s.ctx),expectedGraphVersion:s.ctx.graph.version,opId:'tts',op:{type:'select_node',nodeId:'n1'}},segmentIndex:0})});assert.equal(r.status,400);assert.deepEqual(await r.json(),{error:'voice_unavailable'});}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
