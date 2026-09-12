import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { award } from '../mobile/src/engine/reward.ts';
import { settleFee, SETTLE_REASONS } from '../mobile/src/engine/loan.ts';

const catalog = JSON.parse(readFileSync(new URL('../mobile/src/data/vytal-stores.json', import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
const DAY = 86400000;

export function reuseRoutes({ db, get, all, run, transaction, now, fail, fields, text, limit, foodAwards, isGuest, pins }) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS merchants(user_id TEXT NOT NULL REFERENCES users(id), store_id TEXT NOT NULL, PRIMARY KEY(user_id,store_id));
    CREATE TABLE IF NOT EXISTS reuse_loans(id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES users(id), code TEXT NOT NULL, kind TEXT NOT NULL, store_id TEXT, store_name TEXT NOT NULL, borrowed INTEGER NOT NULL, returned INTEGER, return_store TEXT, damage TEXT, demo INTEGER NOT NULL DEFAULT 0);
    CREATE UNIQUE INDEX IF NOT EXISTS reuse_active_code ON reuse_loans(code) WHERE returned IS NULL;
    CREATE TABLE IF NOT EXISTS reuse_receipts(id TEXT PRIMARY KEY, loan_id TEXT NOT NULL REFERENCES reuse_loans(id), issuer TEXT NOT NULL REFERENCES users(id), store_id TEXT NOT NULL, token_hash TEXT NOT NULL, expires INTEGER NOT NULL, consumed INTEGER);
    CREATE TABLE IF NOT EXISTS reuse_awards(key TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), payload TEXT NOT NULL);
  `);
  // Additive Migration: bezahlte Verlust- und Schadensfälle an bestehenden Ausleihen.
  if(!all('PRAGMA table_info(reuse_loans)').some(c=>c.name==='settlement')) db.exec('ALTER TABLE reuse_loans ADD COLUMN settlement TEXT');
  const awards = actor => all('SELECT payload FROM reuse_awards WHERE user_id=?', actor).map(r => JSON.parse(r.payload));
  const stores = actor => all('SELECT store_id FROM merchants WHERE user_id=?', actor).map(r => catalog.find(s => s.id === r.store_id)).filter(Boolean);
  const loanView = l => ({ id:l.id, code:l.code, kind:l.kind, storeId:l.store_id, storeName:l.store_name, borrowedAt:l.borrowed, returnedAt:l.returned, returnStoreName:catalog.find(s=>s.id===l.return_store)?.name, damage:l.damage ? JSON.parse(l.damage) : null, settlement:l.settlement ? JSON.parse(l.settlement) : null, demo:!!l.demo });
  const owned = (id, actor) => { const l=get('SELECT * FROM reuse_loans WHERE id=?',id); if(!l) fail(404,'Behälter nicht gefunden.'); if(l.owner!==actor) fail(403,'Dieser Behälter gehört zu einem anderen Zugang.'); return l; };
  function dispatch(method,path,body,actor) {
    if (method==='GET' && path==='/reuse/loans') return all('SELECT * FROM reuse_loans WHERE owner=? ORDER BY borrowed DESC',actor).map(loanView);
    if (method==='GET' && path==='/reuse/stores') return [...new Set(all('SELECT store_id FROM merchants').map(r=>r.store_id))];
    if (method==='GET' && path==='/reuse/merchant') return { stores:stores(actor) };
    if (method==='POST' && path==='/reuse/loans') return transaction(()=>{
      fields(body,['code','kind','storeId','demo']);
      const code=text(body.code,32,6).toUpperCase();
      if(!/^[A-Z0-9]{6,32}$/.test(code)||!['cup','bowl'].includes(body.kind)|| (body.demo!==undefined && typeof body.demo!=='boolean')) fail(422,'Bitte einen gültigen Behältercode scannen.');
      const active=get('SELECT * FROM reuse_loans WHERE code=? AND returned IS NULL',code);
      if(active) fail(409,'Dieser Behälter ist gerade ausgeliehen. Er kann erst nach bestätigter Rückgabe erneut ausgeliehen werden.');
      if(get('SELECT COUNT(*) AS n FROM reuse_loans WHERE owner=? AND returned IS NULL',actor).n>=10) fail(409,'Bitte zuerst deine offenen Behälter zurückbringen.');
      limit(`borrow:${actor}`,20,DAY);
      const store=catalog.find(s=>s.id===body.storeId);
      const l={id:randomUUID(),owner:actor,code,kind:body.kind,store_id:store?.id??null,store_name:store?.name??'Ausleihe selbst erfasst',borrowed:now(),demo:body.demo?1:0};
      run('INSERT INTO reuse_loans(id,owner,code,kind,store_id,store_name,borrowed,demo) VALUES(?,?,?,?,?,?,?,?)',l.id,actor,code,l.kind,l.store_id,l.store_name,l.borrowed,l.demo);
      return loanView(l);
    });
    const damage=path.match(/^\/reuse\/loans\/([^/]+)\/damage$/);
    if(method==='POST' && damage) {
      fields(body,['reason','note']); const l=owned(damage[1],actor);
      if(l.returned) fail(409,'Dieser Behälter wurde schon zurückgegeben.');
      if(!['cracked','lid','leaking','other'].includes(body.reason)) fail(422,'Bitte den Schaden auswählen.');
      const report={reason:body.reason,note:text(body.note??'',300,0),at:now()};
      run('UPDATE reuse_loans SET damage=? WHERE id=?',JSON.stringify(report),l.id);
      return loanView({...l,damage:JSON.stringify(report)});
    }
    const settle=path.match(/^\/reuse\/loans\/([^/]+)\/settle$/);
    if(method==='POST' && settle) return transaction(()=>{
      fields(body,['reason','method']); const l=owned(settle[1],actor);
      if(l.returned) fail(409,'Dieser Behälter ist bereits abgeschlossen.');
      if(typeof body.reason!=='string'||!Object.hasOwn(SETTLE_REASONS,body.reason)) fail(422,'Bitte Verlust oder Beschädigung auswählen.');
      limit(`settle:${actor}`,10,DAY);
      // Der Betrag kommt aus den Konditionen des Servers, nie aus dem Gerät.
      const record={reason:body.reason,amount:settleFee(body.reason),at:now(),method:text(body.method,40,3),reference:`MS-${randomBytes(3).toString('hex').toUpperCase()}`,demo:true};
      // Abgeschlossen, aber keine Rücknahme: kein Rückgabeort, keine Punkte.
      run('UPDATE reuse_loans SET settlement=?,returned=? WHERE id=?',JSON.stringify(record),record.at,l.id);
      return loanView({...l,returned:record.at,settlement:JSON.stringify(record)});
    });
    if(method==='POST' && path==='/reuse/merchant/inspect') {
      fields(body,['code','storeId']);
      if(!stores(actor).some(s=>s.id===body.storeId)) fail(403,'Dieses Konto ist nicht für die Rücknahmestelle freigegeben.');
      const l=get('SELECT * FROM reuse_loans WHERE code=? AND returned IS NULL',text(body.code,32,6).toUpperCase());
      if(!l) fail(404,'Keine offene Ausleihe für diesen Behälter gefunden.');
      if(l.owner===actor) fail(403,'Die eigene Rückgabe darfst du nicht als Laden bestätigen.');
      return loanView(l);
    }
    if(method==='POST' && path==='/reuse/merchant/receipt') return transaction(()=>{
      fields(body,['loanId','storeId']);
      if(!stores(actor).some(s=>s.id===body.storeId)) fail(403,'Nur freigegebene Rücknahmestellen können Belege ausstellen.');
      const l=get('SELECT * FROM reuse_loans WHERE id=?',text(body.loanId,80));
      if(!l||l.returned) fail(409,'Für diesen Behälter gibt es keine offene Ausleihe.');
      if(l.owner===actor) fail(403,'Eigene Rückgaben können nicht selbst bestätigt werden.');
      limit(`receipt:${actor}`,60,60000);
      // A replacement invalidates screenshots of older, unconsumed receipts.
      run('UPDATE reuse_receipts SET expires=? WHERE loan_id=? AND consumed IS NULL',now(),l.id);
      const id=randomUUID(),secret=randomBytes(24).toString('hex'),expires=now()+180000;
      run('INSERT INTO reuse_receipts(id,loan_id,issuer,store_id,token_hash,expires) VALUES(?,?,?,?,?,?)',id,l.id,actor,body.storeId,hash(secret),expires);
      return {proof:`mainsam:return:${id}:${secret}`,code:pins.issue(`return:${l.id}`,expires),expiresAt:expires,loan:loanView(l),storeName:catalog.find(s=>s.id===body.storeId).name};
    });
    if(method==='POST' && path==='/reuse/return') {
      fields(body,['loanId','proof']); const l=owned(text(body.loanId,80),actor);
      const value=text(body.proof,200),short=/^\d{4}$/.test(value);
      let r;
      if(short) {
        if(l.returned) fail(409,'Dieser Behälter ist bereits zurückgegeben.');
        pins.verify(`return:${l.id}`,value);
        r=get('SELECT * FROM reuse_receipts WHERE loan_id=? AND consumed IS NULL AND expires>? ORDER BY expires DESC LIMIT 1',l.id,now());
      } else {
        const match=value.match(/^mainsam:return:([a-f0-9-]{36}):([a-f0-9]{48})$/);
        if(!match) fail(422,'Bitte den frischen Rückgabe-QR oder den vierstelligen Code vom Personal verwenden.');
        r=get('SELECT * FROM reuse_receipts WHERE id=?',match[1]);
        if(!r||r.loan_id!==l.id||!timingSafeEqual(Buffer.from(hash(match[2])),Buffer.from(r.token_hash))) fail(422,'Dieser Rückgabecode passt nicht zu deinem Behälter.');
      }
      if(!r) fail(409,'Kein aktueller Rückgabebeleg vorhanden.');
      if(r.consumed && l.returned) return {loan:loanView(l),awards:awards(actor),duplicate:true};
      if(l.returned||r.expires<=now()) fail(409,'Dieser Code ist abgelaufen oder bereits verwendet. Bitte das Personal um einen neuen Code bitten.');
      if(!get('SELECT 1 FROM merchants WHERE user_id=? AND store_id=?',r.issuer,r.store_id)) fail(403,'Diese Rücknahmestelle ist nicht mehr freigegeben.');
      return transaction(()=>{
      run('UPDATE reuse_loans SET returned=?,return_store=? WHERE id=?',now(),r.store_id,l.id);
      run('UPDATE reuse_receipts SET consumed=? WHERE id=?',now(),r.id);
      const ledger=[...foodAwards(actor),...awards(actor)];
      const repeated=get('SELECT 1 FROM reuse_loans WHERE code=? AND id<>? AND returned>?',l.code,l.id,now()-DAY);
      if(!l.demo) for(const type of ['reuse.return',...(now()-l.borrowed<48*3600000?['reuse.return_fast']:[])]) {
        const key=`trust:reuse:${l.id}:${type}`;
        const result=award({type,partner:'vytal',status:'bestätigt',key,at:now(),title:type==='reuse.return_fast'?'Schnelle Rückgabe':`Rückgabe ${l.code}`,meta:{source:'mainsam-store',containers:type==='reuse.return'?1:0,kind:l.kind,evidence:[`Annahme durch freigegebene Rücknahmestelle ${catalog.find(s=>s.id===r.store_id).name}`,'Persönlicher, einmaliger Rückgabe-QR innerhalb von drei Minuten eingelöst','Mainsam-Beleg; keine Buchung im externen Vytal-Konto']}},ledger,{verifiedReuse:true});
        if(repeated||isGuest(actor)) {result.points=0;result.formula=isGuest(actor)?'Gast-Rückgabe → Beleg ohne einlösbare Punkte':'Derselbe Behälter innerhalb von 24 Stunden → 0 Punkte';result.reasons.push(result.formula);}
        run('INSERT INTO reuse_awards VALUES(?,?,?)',key,actor,JSON.stringify(result));ledger.push(result);
      }
      return {loan:loanView({...l,returned:now(),return_store:r.store_id}),awards:awards(actor)};
      });
    }
  }
  return {dispatch,awards,stores};
}
