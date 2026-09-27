import {test} from 'node:test';import assert from 'node:assert/strict';
import {offlineLogin,validSession,safeReturn,loginError} from './demo.ts';
test('offline demo requires public credentials, bounded expiry and internal return route',()=>{
 assert.equal(offlineLogin('wrong','wrong'),null);const s=offlineLogin('student@mathcoach.demo','Demo@123456',1000)!;assert.equal(s.mode,'offline');assert.equal(validSession(s,1000),true);assert.equal(validSession(s,s.expiresAt),false);assert.ok(!JSON.stringify(s).includes('Demo@'));assert.equal(safeReturn('//evil.test'),'/canvas');assert.equal(safeReturn('/canvas?demo=1'),'/canvas?demo=1');assert.ok(loginError('',''));assert.ok(loginError('bad','x'));assert.equal(loginError('x@y.z','x'),null);
});
