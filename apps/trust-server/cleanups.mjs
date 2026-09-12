import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { CLEANUPS } from '../mobile/src/data/mock.ts';
import { award } from '../mobile/src/engine/reward.ts';
const hash=v=>createHash('sha256').update(v).digest('hex');
const distance=(a,b)=>{const r=Math.PI/180,dLat=(a.lat-b.lat)*r,dLon=(a.lon-b.lon)*r;return 6371000*2*Math.asin(Math.min(1,Math.sqrt(Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLon/2)**2)));};
export function cleanupRoutes({db,get,all,run,transaction,now,fail,fields,text,isGuest,ledger}) {
  db.exec(`CREATE TABLE IF NOT EXISTS cleanup_events(id TEXT PRIMARY KEY,payload TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS cleanup_members(event_id TEXT NOT NULL,user_id TEXT NOT NULL,PRIMARY KEY(event_id,user_id));
    CREATE TABLE IF NOT EXISTS cleanup_tickets(id TEXT PRIMARY KEY,event_id TEXT NOT NULL,issuer TEXT NOT NULL,digest TEXT NOT NULL,expires INTEGER NOT NULL,used_by TEXT);
    CREATE TABLE IF NOT EXISTS cleanup_awards(event_id TEXT NOT NULL,user_id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(event_id,user_id));`);
  const awards=actor=>all('SELECT payload FROM cleanup_awards WHERE user_id=?',actor).map(r=>JSON.parse(r.payload));
  function event(id){const e=get('SELECT payload FROM cleanup_events WHERE id=?',id);if(!e)fail(404,'Aktion nicht gefunden. Bitte zuerst mitmachen.');return JSON.parse(e.payload);}
  function member(id,actor){if(!get('SELECT 1 FROM cleanup_members WHERE event_id=? AND user_id=?',id,actor))fail(403,'Bitte zuerst bei dieser Aktion mitmachen.');}
  function position(e,p){if(!p||![p.lat,p.lon,p.accuracy,p.at].every(Number.isFinite)||p.accuracy<0||p.accuracy>60||Math.abs(now()-p.at)>60000||Math.abs(p.lat)>90||Math.abs(p.lon)>180)fail(422,'Für den Nachweis wird ein frischer, genauer Standort benötigt.');if(now()<e.start-30*60000||now()>e.end+30*60000)fail(409,'Die Aktion liegt außerhalb ihres Zeitfensters.');if(distance(e,p)>e.radiusM)fail(403,'Du bist noch außerhalb des Aktionsorts.');}
  function view(id,actor){return {id,event:event(id),confirmed:!!get('SELECT 1 FROM cleanup_awards WHERE event_id=? AND user_id=?',id,actor)};}
  function reward(id,actor,other,e){
    if(get('SELECT 1 FROM cleanup_awards WHERE event_id=? AND user_id=?',id,actor))return;
    const a=award({key:`trust:cleanup:${id}:${actor}`,type:'clean.participate',partner:'fes',status:'plausibel',title:e.title,at:now(),meta:{source:'mainsam-cleanup',evidence:['Zwei getrennte Zugänge haben einen kurz gültigen QR am Aktionsort ausgetauscht.','Frischer Standort beider Geräte im Gebiet und Zeitfenster geprüft.','Standorte sind Geräteangaben; keine externe FES-Bestätigung.']}},ledger(actor),{verifiedCleanup:true});
    if(isGuest(actor)||isGuest(other)){a.points=0;a.formula='Gastteilnahme → Beleg ohne einlösbare Punkte';a.reasons.push(a.formula);}
    run('INSERT INTO cleanup_awards VALUES(?,?,?)',id,actor,JSON.stringify(a));
  }
  function dispatch(method,path,body,actor){
    if(method==='POST'&&path==='/cleanups/join')return transaction(()=>{
      fields(body,['event']);const input=body.event;if(!input||typeof input!=='object')fail(422,'Aktion fehlt.');
      const known=CLEANUPS.find(e=>e.id===input.id);const e=known||{id:text(input.id,80),title:text(input.title,120),lat:input.lat,lon:input.lon,start:input.start,end:input.end,radiusM:input.radiusM};
      if(!known&&(!/^own-\d+$/.test(e.id)||![e.lat,e.lon,e.start,e.end,e.radiusM].every(Number.isFinite)||Math.abs(e.lat)>90||Math.abs(e.lon)>180||e.radiusM<50||e.radiusM>500||e.end<=e.start||e.end-e.start>86400000||e.start>now()+90*86400000))fail(422,'Ungültige Aktion.');
      const id=`${e.id}:${e.start}`;run('INSERT OR IGNORE INTO cleanup_events VALUES(?,?)',id,JSON.stringify(e));run('INSERT OR IGNORE INTO cleanup_members VALUES(?,?)',id,actor);return view(id,actor);
    });
    // Resolve a shared QR so people can join an event created on another device.
    if(method==='POST'&&path==='/cleanups/resolve')return transaction(()=>{
      fields(body,['proof']);
      const m=text(body.proof,200).match(/^mainsam:cleanup:([a-f0-9-]{36}):([a-f0-9]{48})$/),ticket=m&&get('SELECT * FROM cleanup_tickets WHERE id=?',m[1]);
      if(!ticket||!timingSafeEqual(Buffer.from(hash(m[2])),Buffer.from(ticket.digest)))fail(422,'Ungültiger Aktions-QR.');
      if(ticket.issuer===actor)fail(403,'Deinen eigenen QR kannst du nicht bestätigen.');
      if(ticket.used_by&&ticket.used_by!==actor)fail(409,'Dieser QR wurde bereits verwendet.');
      if(!ticket.used_by&&ticket.expires<=now())fail(409,'QR abgelaufen. Bitte vor Ort neu anzeigen lassen.');
      run('INSERT OR IGNORE INTO cleanup_members VALUES(?,?)',ticket.event_id,actor);
      return view(ticket.event_id,actor);
    });
    const match=path.match(/^\/cleanups\/([^/]+)(?:\/(ticket|confirm))?$/);if(!match)return;
    const id=decodeURIComponent(match[1]);member(id,actor);const e=event(id);
    if(method==='GET'&&!match[2])return view(id,actor);
    if(method==='POST'&&match[2]==='ticket')return transaction(()=>{
      fields(body,['position']);position(e,body.position);
      const ticketId=randomUUID(),secret=randomBytes(24).toString('hex'),expires=now()+120000;
      run('UPDATE cleanup_tickets SET expires=? WHERE event_id=? AND issuer=? AND used_by IS NULL',now(),id,actor);
      run('INSERT INTO cleanup_tickets VALUES(?,?,?,?,?,NULL)',ticketId,id,actor,hash(secret),expires);
      return {proof:`mainsam:cleanup:${ticketId}:${secret}`,expiresAt:expires};
    });
    if(method==='POST'&&match[2]==='confirm')return transaction(()=>{
      fields(body,['proof','position']);position(e,body.position);
      const m=text(body.proof,200).match(/^mainsam:cleanup:([a-f0-9-]{36}):([a-f0-9]{48})$/),ticket=m&&get('SELECT * FROM cleanup_tickets WHERE id=?',m[1]);
      if(!ticket||ticket.event_id!==id||!timingSafeEqual(Buffer.from(hash(m[2])),Buffer.from(ticket.digest)))fail(422,'Dieser QR gehört nicht zu dieser Aktion.');
      if(ticket.issuer===actor)fail(403,'Deinen eigenen QR kannst du nicht bestätigen.');
      if(ticket.used_by){if(ticket.used_by===actor)return {...view(id,actor),duplicate:true};fail(409,'Dieser QR wurde bereits verwendet. Bitte einen neuen zeigen lassen.');}
      if(ticket.expires<=now())fail(409,'QR abgelaufen. Bitte vor Ort neu anzeigen lassen.');
      run('UPDATE cleanup_tickets SET used_by=? WHERE id=?',actor,ticket.id);reward(id,actor,ticket.issuer,e);reward(id,ticket.issuer,actor,e);return view(id,actor);
    });
  }
  return {dispatch,awards};
}
