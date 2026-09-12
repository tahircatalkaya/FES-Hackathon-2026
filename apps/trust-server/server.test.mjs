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

async function merchantFixture(t) {
  const {DatabaseSync}=await import('node:sqlite');
  const {readFileSync}=await import('node:fs');
  const directory=mkdtempSync(join(tmpdir(),'mainsam-reuse-'));
  const dbPath=join(directory,'test.sqlite');
  const f=await fixture(t,dbPath);
  t.after(()=>rmSync(directory,{recursive:true,force:true}));
  const stores=JSON.parse(readFileSync(new URL('../mobile/src/data/vytal-stores.json',import.meta.url),'utf8'));
  const customer=await f.register('customer'),staff=await f.register('staff'),outsider=await f.register('outsider');
  const grant=(name,storeId)=>{const db=new DatabaseSync(dbPath);try{const user=db.prepare('SELECT id FROM users WHERE name=?').get(name);db.prepare('INSERT INTO merchants VALUES(?,?)').run(user.id,storeId);}finally{db.close();}};
  return {...f,dbPath,stores,customer,staff,outsider,grant};
}

test('Reuse client claims cannot award points; the fast-return bonus never doubles physical impact',()=>{
  for(const type of ['reuse.return','reuse.return_fast']) {
    const r=award({type,partner:'vytal',status:'bestätigt',key:'fake',at:Date.now(),title:'Fake',meta:{source:'store',containers:500,verifiedReuse:true}},[]);
    assert.equal(r.points,0);assert.equal(r.impact.packaging,0);
  }
  const r=award({type:'reuse.return_fast',partner:'vytal',status:'bestätigt',key:'bonus',at:Date.now(),title:'Bonus'},[],{verifiedReuse:true});
  assert.equal(r.impact.packaging,0);assert.equal(r.impact.co2_g,0);
});

test('Return requires assigned merchant, exact loan and fresh proof; damage persists, concurrent replay awards once',async t=>{
  const f=await merchantFixture(t),store=f.stores[0].id;
  const l=await f.call('/reuse/loans',f.customer,{code:'CUP12345',kind:'cup',storeId:store});
  assert.equal((await f.call('/reuse/loans',f.customer,{code:l.code,kind:'cup'})).id,l.id);
  await f.call('/reuse/loans',f.outsider,{code:l.code,kind:'cup'},409);
  await f.call('/reuse/merchant/receipt',f.customer,{loanId:l.id,storeId:store},403);
  await f.call('/reuse/merchant/receipt',f.staff,{loanId:l.id,storeId:store},403);
  f.grant('staff',store);
  await f.call(`/reuse/loans/${l.id}/damage`,f.outsider,{reason:'cracked'},403);
  const damaged=await f.call(`/reuse/loans/${l.id}/damage`,f.customer,{reason:'cracked',note:'Riss am Rand'});
  assert.equal(damaged.damage.note,'Riss am Rand');assert.equal(damaged.returnedAt,null);
  assert.equal((await f.call('/reuse/merchant/inspect',f.staff,{code:l.code,storeId:store})).damage.reason,'cracked');
  await f.call('/reuse/merchant/receipt',f.staff,{loanId:l.id,storeId:f.stores[1].id},403);
  const first=await f.call('/reuse/merchant/receipt',f.staff,{loanId:l.id,storeId:store});
  assert.equal((await f.call('/me',f.customer)).awards.length,0);
  await f.call('/reuse/return',f.customer,{loanId:l.id,proof:'https://vytal.org/store/static-qr'},422);
  const other=await f.call('/reuse/loans',f.customer,{code:'BOWL2345',kind:'bowl'});
  await f.call('/reuse/return',f.customer,{loanId:other.id,proof:first.proof},422);
  await f.call('/reuse/return',f.outsider,{loanId:l.id,proof:first.proof},403);
  f.advance(180001);await f.call('/reuse/return',f.customer,{loanId:l.id,proof:first.proof},409);
  const fresh=await f.call('/reuse/merchant/receipt',f.staff,{loanId:l.id,storeId:store});
  const send=()=>f.call('/reuse/return',f.customer,{loanId:l.id,proof:fresh.proof});
  const results=await Promise.all([send(),send()]);assert.equal(results.filter(r=>r.duplicate).length,1);
  const me=await f.call('/me',f.customer);assert.equal(me.awards.length,2);assert.equal(me.awards.reduce((n,a)=>n+a.impact.packaging,0),1);assert.equal(me.awards.reduce((n,a)=>n+a.impact.co2_g,0),30);
  assert.equal(me.awards.filter(a=>a.type==='reuse.return').length,1);
  await f.call(`/reuse/loans/${l.id}/damage`,f.customer,{reason:'other'},409);
  assert.ok((await f.call('/reuse/loans',f.customer)).find(x=>x.id===l.id).returnedAt);
  assert.ok(!JSON.stringify(await f.call('/reuse/loans',f.customer)).includes(fresh.proof));
});

test('Merchant cannot confirm own return; revoked, replaced and demo proofs cannot produce rewards',async t=>{
  const f=await merchantFixture(t),store=f.stores[0].id;f.grant('staff',store);
  const own=await f.call('/reuse/loans',f.staff,{code:'OWN12345',kind:'bowl'});
  await f.call('/reuse/merchant/receipt',f.staff,{loanId:own.id,storeId:store},403);
  const l=await f.call('/reuse/loans',f.customer,{code:'DEMO2345',kind:'bowl',demo:true});
  const old=await f.call('/reuse/merchant/receipt',f.staff,{loanId:l.id,storeId:store});
  const fresh=await f.call('/reuse/merchant/receipt',f.staff,{loanId:l.id,storeId:store});
  await f.call('/reuse/return',f.customer,{loanId:l.id,proof:old.proof},409);
  const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(f.dbPath);db.prepare('DELETE FROM merchants WHERE store_id=?').run(store);db.close();
  await f.call('/reuse/return',f.customer,{loanId:l.id,proof:fresh.proof},403);
  f.grant('staff',store);await f.call('/reuse/return',f.customer,{loanId:l.id,proof:fresh.proof});
  assert.equal((await f.call('/me',f.customer)).awards.length,0);
  const second=await f.call('/reuse/loans',f.customer,{code:l.code,kind:'bowl'});
  const again=await f.call('/reuse/merchant/receipt',f.staff,{loanId:second.id,storeId:store});
  await f.call('/reuse/return',f.customer,{loanId:second.id,proof:again.proof});
  assert.equal((await f.call('/me',f.customer)).awards.reduce((n,a)=>n+a.points,0),0);
});

test('Distribution posts are atomic; provider time slots cannot overlap and pending stock expires',async t=>{
  const f=await fixture(t),p=await f.register('provider'),r=await f.register('receiver'),x=await f.register('another');
  const item={name:'Brot',qty:'1 Stück',cat:'Backwaren',grams:500};
  const draft={title:'Heute gerettet',area:'Bockenheim',address:'Privater Treffpunkt',startsAt:f.now()+30*60000,endsAt:f.now()+2*3600000,requestKey:'batch-test-key',lots:[{items:[item],portions:2},{items:[{...item,name:'Äpfel'}],portions:3}]};
  await f.call('/distributions',p,{...draft,lots:[draft.lots[0],{items:[item],portions:0}]},422);
  assert.equal((await f.call('/offers',p)).length,0);
  const offers=await f.call('/distributions',p,draft);assert.equal(offers.length,2);
  assert.deepEqual((await f.call('/distributions',p,draft)).map(o=>o.id),offers.map(o=>o.id));
  const slot=offers[0].slots[0].startsAt;
  const h=await f.call(`/offers/${offers[0].id}/request`,r,{slotStart:slot});
  assert.equal(h.offer.remaining,1);assert.equal(h.offer.address,undefined);
  await f.call(`/offers/${offers[1].id}/request`,x,{slotStart:slot},409);
  f.advance(16*60000);
  assert.equal((await f.call('/handoffs',r))[0].status,'expired');
  assert.equal((await f.call('/offers',p)).find(o=>o.id===offers[0].id).remaining,2);
  await f.call(`/offers/${offers[1].id}/request`,x,{slotStart:slot});
});

test('Personal food QR is restricted to agreed pickup and provider, expiring, one-time and private',async t=>{
  const f=await fixture(t),p=await f.register('provider'),r=await f.register('receiver'),x=await f.register('outsider');
  const o=await f.offer(p,{slotMinutes:10});const h=await f.call(`/offers/${o.id}/request`,r,{slotStart:o.slots[0].startsAt});
  await f.call(`/handoffs/${h.id}/ticket`,r,{},409);
  await f.call(`/handoffs/${h.id}/accept`,p,{});
  await f.call(`/handoffs/${h.id}/ticket`,p,{},403);
  const ticket=await f.call(`/handoffs/${h.id}/ticket`,r,{});
  assert.ok(!JSON.stringify(await f.call('/handoffs',p)).includes(ticket.proof));
  await f.call(`/handoffs/${h.id}/confirm-ticket`,r,{proof:ticket.proof},403);
  await f.call(`/handoffs/${h.id}/confirm-ticket`,x,{proof:ticket.proof},403);
  f.advance(5*60000+1);await f.call(`/handoffs/${h.id}/confirm-ticket`,p,{proof:ticket.proof},409);
  const fresh=await f.call(`/handoffs/${h.id}/ticket`,r,{});
  await f.call(`/handoffs/${h.id}/confirm-ticket`,p,{proof:fresh.proof});
  await f.call(`/handoffs/${h.id}/confirm-ticket`,p,{proof:fresh.proof});
  assert.equal((await f.call('/me',r)).awards.length,1);assert.equal((await f.call('/me',p)).awards.length,1);
  assert.equal((await f.call('/handoffs',r))[0].offer.address,undefined);
  await f.call(`/handoffs/${h.id}/review`,r,{satisfaction:5,reliability:4,respect:5});
  const next=await f.offer(p,{slotMinutes:10});
  assert.equal(next.slots[0].available,false);
  await f.call(`/offers/${next.id}/request`,x,{slotStart:next.slots[0].startsAt},409);
});

test('Public shelf updates are shared, idempotent and remain self-reports without points or photos',async t=>{
  const {readFileSync}=await import('node:fs');const point=JSON.parse(readFileSync(new URL('../mobile/src/data/fairteiler.json',import.meta.url),'utf8'))[0].id;
  const f=await fixture(t),p=await f.register('reporter');const data={kind:'shelf',fill:'mittel',items:[{name:'Brot',qty:'1 Stück',cat:'Backwaren',grams:500}],requestKey:'shelf-test-unique'};
  await f.call(`/shelves/${point}`,null,data,401);await f.call('/shelves/999999',p,data,404);
  const first=await f.call(`/shelves/${point}`,p,data);const repeat=await f.call(`/shelves/${point}`,p,data);assert.equal(first.id,repeat.id);
  const shared=await f.call(`/shelves/${point}`,null);assert.equal(shared.length,1);assert.equal(shared[0].items[0].name,'Brot');assert.equal(shared[0].actor,undefined);assert.equal(shared[0].photo,undefined);
  f.advance(1000);await f.call(`/shelves/${point}`,p,{...data,kind:'pickup',requestKey:'shelf-pickup-unique'});
  assert.equal((await f.call(`/shelves/${point}`,null)).length,2);
  assert.equal((await f.call('/shelves',null))[0].kind,'shelf');
  assert.equal((await f.call('/me',p)).awards.length,0);
});
