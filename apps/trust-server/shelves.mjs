import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { award } from '../mobile/src/engine/reward.ts';
const catalog=JSON.parse(readFileSync(new URL('../mobile/src/data/fairteiler.json',import.meta.url),'utf8'));
const hash=s=>createHash('sha256').update(s).digest('hex');
const DAY=86400000;
export function shelfRoutes({db,get,all,run,transaction,now,fail,fields,text,pins,isGuest,ledger}) {
  db.exec(`CREATE TABLE IF NOT EXISTS shelf_staff(user_id TEXT NOT NULL REFERENCES users(id),point_id INTEGER NOT NULL,PRIMARY KEY(user_id,point_id));
    CREATE TABLE IF NOT EXISTS shelf_proofs(action_id TEXT PRIMARY KEY REFERENCES shelf_updates(id),digest TEXT NOT NULL,expires INTEGER NOT NULL,confirmed INTEGER,issuer TEXT);
    CREATE TABLE IF NOT EXISTS shelf_awards(action_id TEXT PRIMARY KEY REFERENCES shelf_updates(id),user_id TEXT NOT NULL,payload TEXT NOT NULL);`);
  const stores=actor=>all('SELECT point_id FROM shelf_staff WHERE user_id=?',actor).map(r=>catalog.find(p=>p.id===r.point_id)).filter(Boolean).map(p=>({id:p.id,name:p.name}));
  const awards=actor=>all('SELECT payload FROM shelf_awards WHERE user_id=?',actor).map(r=>JSON.parse(r.payload));
  const view=(r,actor)=>({id:r.id,pointId:r.point_id,pointName:catalog.find(p=>p.id===r.point_id)?.name,kind:r.kind,items:JSON.parse(r.items),at:r.created,mine:r.actor===actor,name:get('SELECT name FROM users WHERE id=?',r.actor)?.name,confirmed:!!get('SELECT confirmed FROM shelf_proofs WHERE action_id=?',r.id)?.confirmed});
  function dispatch(method,path,body,actor) {
    if(method==='GET'&&path==='/shelf-actions') return all('SELECT * FROM shelf_updates WHERE actor=? OR point_id IN (SELECT point_id FROM shelf_staff WHERE user_id=?) ORDER BY created DESC LIMIT 100',actor,actor).map(r=>view(r,actor));
    const m=path.match(/^\/shelf-actions\/([^/]+)\/(ticket|confirm)$/);
    if(!m||method!=='POST')return;
    const r=get('SELECT * FROM shelf_updates WHERE id=?',m[1]);if(!r)fail(404,'Regalmeldung nicht gefunden.');
    const context=`shelf:${r.id}`;
    if(m[2]==='ticket') {
      fields(body,[]);if(r.actor!==actor)fail(403,'Nur die meldende Person kann ihren Code zeigen.');
      if(now()>r.created+30*60000)fail(409,'Diese Meldung liegt mehr als 30 Minuten zurück. Bitte den aktuellen Stand neu erfassen.');
      const old=get('SELECT * FROM shelf_proofs WHERE action_id=?',r.id);if(old?.confirmed)fail(409,'Bereits bestätigt.');
      const secret=randomBytes(24).toString('hex'),expires=Math.min(now()+5*60000,r.created+30*60000);
      const code=pins.issue(context,expires);
      run('INSERT INTO shelf_proofs(action_id,digest,expires) VALUES(?,?,?) ON CONFLICT(action_id) DO UPDATE SET digest=excluded.digest,expires=excluded.expires',r.id,hash(secret),expires);
      return {proof:`mainsam:shelf:${r.id}:${secret}`,code,expiresAt:expires};
    }
    fields(body,['proof']);
    if(r.actor===actor||!get('SELECT 1 FROM shelf_staff WHERE user_id=? AND point_id=?',actor,r.point_id))fail(403,'Nur die freigegebene Regalbetreuung darf die Meldung einer anderen Person bestätigen.');
    const proof=get('SELECT * FROM shelf_proofs WHERE action_id=?',r.id),value=text(body.proof,200);
    if(/^\d{4}$/.test(value)) {if(proof?.confirmed)fail(409,'Bereits bestätigt.');pins.verify(context,value);}
    else {const parts=value.match(/^mainsam:shelf:([a-f0-9-]{36}):([a-f0-9]{48})$/);if(!parts||parts[1]!==r.id||!proof||!timingSafeEqual(Buffer.from(hash(parts[2])),Buffer.from(proof.digest)))fail(422,'Der Code passt nicht zu dieser Regalmeldung.');}
    if(!proof)fail(409,'Die andere Person muss ihren Code zuerst anzeigen.');
    if(proof.confirmed)return view(r,actor);
    if(proof.expires<=now())fail(409,'Code abgelaufen.');
    return transaction(()=>{
      run('UPDATE shelf_proofs SET confirmed=?,issuer=? WHERE action_id=?',now(),actor,r.id);
      const type=r.kind==='pickup'?'food.pickup':r.kind==='stock'?'food.stock':'food.report';
      const result=award({type,partner:'foodsharing',status:'bestätigt',key:`trust:shelf:${r.id}`,at:now(),title:`Regal: ${catalog.find(p=>p.id===r.point_id)?.name}`,meta:{source:'mainsam-server',food_g:r.kind==='pickup'?JSON.parse(r.items).reduce((n,i)=>n+i.grams,0):0,evidence:['Persönlicher Einmalcode von der freigegebenen Regalbetreuung vor Ort bestätigt','Ein QR-Aufkleber allein gibt keine Punkte','Mengen bleiben Schätzungen']}},ledger(r.actor),{verifiedFood:true});
      const repeated=get('SELECT 1 FROM shelf_awards a JOIN shelf_updates s ON a.action_id=s.id JOIN shelf_proofs p ON p.action_id=s.id WHERE a.user_id=? AND s.point_id=? AND s.kind=? AND p.confirmed>?',r.actor,r.point_id,r.kind,now()-DAY);
      if(repeated||isGuest(r.actor)){result.points=0;result.formula=isGuest(r.actor)?'Gastmeldung → Beleg ohne einlösbare Punkte':'Dieser Ort und diese Aktion innerhalb von 24 Stunden → 0 Punkte';result.reasons.push(result.formula);}
      if(r.kind!=='pickup'){result.impact.food_g=0;result.impact.co2_g=0;}
      run('INSERT INTO shelf_awards VALUES(?,?,?)',r.id,r.actor,JSON.stringify(result));return view(r,actor);
    });
  }
  return {dispatch,awards,stores};
}
