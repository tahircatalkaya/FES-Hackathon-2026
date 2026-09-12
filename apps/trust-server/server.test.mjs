import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTrustServer } from './server.mjs';
import { award, BASE } from '../mobile/src/engine/reward.ts';

async function fixture(t, dbPath=':memory:') {
  let timestamp = Date.now();
  const server = createTrustServer({dbPath, now:()=>timestamp});
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  t.after(()=>new Promise(resolve=>{ if (!server.listening) return resolve(); server.closeAllConnections(); server.close(resolve); }));
  const base=`http://127.0.0.1:${server.address().port}`;
  async function call(path, token, body, expected=200, method=body?'POST':'GET', extra={}) {
    const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{ }),...extra},...(body?{body:JSON.stringify(body)}:{})});
    const data=await res.json(); assert.equal(res.status,expected,`${path}: ${data.error||'unexpected status'}`);return data;
  }
  const register=async name=>(await call('/register',null,{name,password:'Only-a-test-password-123'})).token;
  const offer=(token,patch={})=>call('/offers',token,{title:'Brot und Äpfel',items:[{name:'Brot',qty:'1 Stück',cat:'Backwaren',grams:500}],portions:1,area:'Bockenheim',address:'Privater Treffpunkt 12',startsAt:timestamp,endsAt:timestamp+3600000,requestKey:crypto.randomUUID(),...patch});
  async function complete(provider,receiver,o) {
    const h=await call(`/offers/${o.id}/request`,receiver,{});
    await call(`/handoffs/${h.id}/accept`,provider,{});
    const {code}=await call(`/handoffs/${h.id}/code`,provider,{});
    await call(`/handoffs/${h.id}/receive`,receiver,{code});
    await call(`/handoffs/${h.id}/complete`,provider,{});return h;
  }
  return {server,base,call,register,offer,complete,now:()=>timestamp,advance:ms=>timestamp+=ms};
}

test('Food self-reports cannot award points or inflate impact, regardless of caller metadata',()=>{
  for(const type of Object.keys(BASE).filter(t=>t.startsWith('food.'))) {
    const result=award({type,partner:'foodsharing',status:'bestätigt',key:`fake:${type}`,at:Date.now(),title:'Fake',meta:{food_g:999999,source:'api',handoffId:'forged',verifiedFood:true}},[]);
    assert.equal(result.points,0);assert.equal(result.impact.food_g,0);assert.equal(result.impact.co2_g,0);assert.equal(result.status,'ausstehend');
  }
});

test('Separate accounts, owner-only acceptance, privacy, two-party proof and idempotent receipts',async t=>{
  const f=await fixture(t), p=await f.register('provider'), r=await f.register('receiver'), x=await f.register('outsider');
  await f.call('/offers',null,undefined,401);await f.call('/login',null,{name:'receiver',password:'Wrong-password-123'},401);
  const o=await f.offer(p,{startsAt:f.now()+30*60000,endsAt:f.now()+90*60000});
  assert.equal((await f.call('/offers',r))[0].address,undefined);
  await f.call(`/offers/${o.id}/request`,p,{},403);
  const h=await f.call(`/offers/${o.id}/request`,r,{});
  await f.call(`/handoffs/${h.id}/accept`,r,{},403);await f.call(`/handoffs/${h.id}/accept`,x,{},403);
  await f.call(`/handoffs/${h.id}/accept`,p,{});
  assert.equal((await f.call('/handoffs',r))[0].offer.address,undefined);
  await f.call(`/handoffs/${h.id}/code`,p,{},409);
  f.advance(30*60000);
  assert.equal((await f.call('/handoffs',r))[0].offer.address,'Privater Treffpunkt 12');
  await f.call(`/handoffs/${h.id}/complete`,p,{},409);
  await f.call(`/handoffs/${h.id}/code`,r,{},403);
  const {code}=await f.call(`/handoffs/${h.id}/code`,p,{});
  const exposed=JSON.stringify(await f.call('/handoffs',r));assert.ok(!exposed.includes(code));assert.ok(!exposed.includes('code_hash'));
  await f.call(`/handoffs/${h.id}/receive`,p,{code},403);
  await f.call(`/handoffs/${h.id}/receive`,r,{code,verified:true},422);
  await f.call(`/handoffs/${h.id}/receive`,r,{code:'000000'},422);
  await f.call(`/handoffs/${h.id}/receive`,r,{code});
  assert.equal((await f.call('/me',r)).awards.length,0);
  await f.call(`/handoffs/${h.id}/complete`,r,{},403);
  await f.call(`/handoffs/${h.id}/complete`,p,{});
  await f.call(`/handoffs/${h.id}/complete`,p,{});
  await f.call(`/handoffs/${h.id}/receive`,r,{code},409);
  const me=await f.call('/me',r);assert.equal(me.awards.length,1);assert.equal(me.awards[0].points,15);assert.equal(me.awards[0].impact.food_g,500);
  const owner=await f.call('/me',p);assert.equal(owner.awards[0].impact.food_g,0);assert.equal(owner.awards.length,1);
  await f.call('/offers',r,undefined,403,'GET',{Origin:'https://evil.example'});
});

test('Atomic inventory, one active pickup, no self-booking and cancellation release',async t=>{
  const f=await fixture(t),p=await f.register('provider'),r=await f.register('receiver'),x=await f.register('another');
  const o=await f.offer(p);
  const send=token=>fetch(f.base+`/offers/${o.id}/request`,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:'{}'});
  const results=await Promise.all([send(r),send(x)]);assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
  const winner=results[0].status===200?r:x;
  const h=(await f.call('/handoffs',winner))[0];
  const other=await f.offer(p);
  await f.call(`/offers/${other.id}/request`,winner,{},409);
  await f.call(`/handoffs/${h.id}/cancel`,winner,{});
  const restored=(await f.call('/offers',p)).find(x=>x.id===o.id);assert.equal(restored.remaining,1);
  const replay=await f.call(`/offers/${o.id}/request`,winner,{});assert.equal(replay.status,'cancelled');
  await f.call(`/handoffs/${h.id}/complete`,p,{},409);
});

test('Expired codes, five guesses, attempt persistence and expired appointments cannot pass',async t=>{
  const f=await fixture(t),p=await f.register('provider'),r=await f.register('receiver');
  const o=await f.offer(p),h=await f.call(`/offers/${o.id}/request`,r,{});
  await f.call(`/handoffs/${h.id}/accept`,p,{});
  const first=await f.call(`/handoffs/${h.id}/code`,p,{});f.advance(11*60000);
  await f.call(`/handoffs/${h.id}/receive`,r,{code:first.code},409);
  const next=await f.call(`/handoffs/${h.id}/code`,p,{});
  for(let i=0;i<5;i++)await f.call(`/handoffs/${h.id}/receive`,r,{code:'000000'},422);
  await f.call(`/handoffs/${h.id}/receive`,r,{code:next.code},429);await f.call(`/handoffs/${h.id}/code`,p,{},429);
  f.advance(60*60000);assert.equal((await f.call('/handoffs',r))[0].status,'expired');
  assert.equal((await f.call('/me',r)).awards.length,0);
});

test('Ratings need completed handovers; duplicate, forged, revenge and repeated-pair farming protections',async t=>{
  const f=await fixture(t),p=await f.register('provider'),r=await f.register('receiver'),x=await f.register('outsider');
  const o=await f.offer(p), h=await f.call(`/offers/${o.id}/request`,r,{}),scores={satisfaction:5,reliability:4,respect:5};
  await f.call(`/handoffs/${h.id}/review`,p,scores,409);
  await f.complete(p,r,o);
  await f.call(`/handoffs/${h.id}/review`,x,scores,403);
  await f.call(`/handoffs/${h.id}/review`,p,{...scores,respect:9},422);
  await f.call(`/handoffs/${h.id}/review`,p,scores);
  assert.equal((await f.call('/me',r)).reputation.count,0);
  await f.call(`/handoffs/${h.id}/review`,p,scores,409);
  await f.call(`/handoffs/${h.id}/review`,r,scores);
  assert.deepEqual((await f.call('/me',r)).reputation,{count:1,visible:false});
  const second=await f.offer(p);await f.complete(p,r,second);
  const rewards=(await f.call('/me',r)).awards;assert.equal(rewards.length,2);assert.equal(rewards.find(a=>a.meta.handoffId!==h.id).points,0);
  const secondH=(await f.call('/handoffs',r)).find(v=>v.offer.id===second.id);
  await f.call(`/handoffs/${secondH.id}/review`,p,scores);await f.call(`/handoffs/${secondH.id}/review`,r,scores);
  assert.equal((await f.call('/me',r)).reputation.count,1);
  await f.call(`/handoffs/${h.id}/concern`,p,{reason:'took_more'});
  assert.equal((await f.call('/handoffs',x)).length,0);
  await f.call(`/handoffs/${h.id}/dispute`,r,{});
  assert.equal((await f.call('/handoffs',p)).find(v=>v.id===h.id).concern[0].disputed,true);
});

test('Reputation becomes visible only after three distinct counterparts; data survives restart',async t=>{
  const dir=mkdtempSync(join(tmpdir(),'mainsam-trust-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
  const f=await fixture(t,join(dir,'db.sqlite')),r=await f.register('receiver'),scores={satisfaction:5,reliability:5,respect:4};
  for(const name of ['saver-one','saver-two','saver-three']){
    const p=await f.register(name),o=await f.offer(p),h=await f.complete(p,r,o);
    await f.call(`/handoffs/${h.id}/review`,p,scores);await f.call(`/handoffs/${h.id}/review`,r,scores);
  }
  assert.deepEqual((await f.call('/me',r)).reputation,{count:3,visible:true,satisfaction:5,reliability:5,respect:4});
  f.server.closeAllConnections(); await new Promise(resolve=>f.server.close(resolve));
  const reopened=await fixture(t,join(dir,'db.sqlite'));
  assert.equal((await reopened.call('/me',r)).awards.length,3);
  assert.equal((await reopened.call('/me',r)).reputation.count,3);
});

test('No-show reports require a prior agreement and grace period; stale receipts stay unconfirmed',async t=>{
  const f=await fixture(t),p=await f.register('provider'),r=await f.register('receiver');
  const o=await f.offer(p),h=await f.call(`/offers/${o.id}/request`,r,{});
  await f.call(`/handoffs/${h.id}/concern`,p,{reason:'no_show'},409);
  f.advance(76*60000);
  await f.call(`/handoffs/${h.id}/concern`,p,{reason:'no_show'},409);
  const second=await f.offer(p),h2=await f.call(`/offers/${second.id}/request`,r,{});
  await f.call(`/handoffs/${h2.id}/accept`,p,{});f.advance(76*60000);
  await f.call(`/handoffs/${h2.id}/concern`,p,{reason:'no_show'});
  assert.equal((await f.call('/me',r)).reputation.visible,false);
  const third=await f.offer(p),h3=await f.call(`/offers/${third.id}/request`,r,{});
  await f.call(`/handoffs/${h3.id}/accept`,p,{});
  const {code}=await f.call(`/handoffs/${h3.id}/code`,p,{});
  await f.call(`/handoffs/${h3.id}/receive`,r,{code});f.advance(25*3600000);
  await f.call(`/handoffs/${h3.id}/complete`,p,{},409);
  assert.equal((await f.call('/handoffs',r)).find(h=>h.id===h3.id).status,'disputed');
  assert.equal((await f.call('/me',r)).awards.length,0);
});
