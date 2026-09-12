import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomInt, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reuseRoutes } from './reuse.mjs';
import { shelfRoutes } from './shelves.mjs';
import { pinCodes } from './pins.mjs';
import { cleanupRoutes } from './cleanups.mjs';
import { accountRoutes } from './accounts.mjs';
import { award } from '../mobile/src/engine/reward.ts';

const hash = value => createHash('sha256').update(value).digest('hex');
const shelfIds = new Set(JSON.parse(readFileSync(new URL('../mobile/src/data/fairteiler.json',import.meta.url),'utf8')).map(p=>p.id));
const DAY = 86400_000, CODE_TTL = 10 * 60_000;
class Problem extends Error { constructor(status, message) { super(message); this.status = status; } }
const fail = (status, message) => { throw new Problem(status, message); };
const text = (value, max = 160, min = 1) => typeof value === 'string' && value.trim().length >= min && value.trim().length <= max ? value.trim() : fail(422, 'Bitte die Textfelder vollständig und passend ausfüllen.');
const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max ? value : fail(422, 'Ungültige Anzahl.');
const fields = (body, keys) => { if (!body || Array.isArray(body) || Object.keys(body).some(k => !keys.includes(k))) fail(422, 'Unzulässige Eingabefelder.'); };
const privateHost = host => host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || /^192\.168\.\d+\.\d+$/.test(host) || /^10\.\d+\.\d+\.\d+$/.test(host) || /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host);

export function createTrustServer({ dbPath = ':memory:', now = Date.now, allowedOrigin = process.env.TRUST_ORIGIN } = {}) {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, salt TEXT NOT NULL, password TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS offers(id TEXT PRIMARY KEY, owner TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, items TEXT NOT NULL, portions INTEGER NOT NULL, remaining INTEGER NOT NULL, area TEXT NOT NULL, address TEXT NOT NULL, starts INTEGER NOT NULL, ends INTEGER NOT NULL, created INTEGER NOT NULL, request_key TEXT NOT NULL, UNIQUE(owner,request_key));
    CREATE TABLE IF NOT EXISTS handoffs(id TEXT PRIMARY KEY, offer_id TEXT NOT NULL REFERENCES offers(id), receiver TEXT NOT NULL REFERENCES users(id), status TEXT NOT NULL, created INTEGER NOT NULL, accepted INTEGER, code_hash TEXT, code_expires INTEGER, attempts INTEGER NOT NULL DEFAULT 0, generations INTEGER NOT NULL DEFAULT 0, received INTEGER, completed INTEGER, UNIQUE(offer_id,receiver));
    CREATE TABLE IF NOT EXISTS awards(user_id TEXT NOT NULL REFERENCES users(id), handoff_id TEXT NOT NULL REFERENCES handoffs(id), payload TEXT NOT NULL, PRIMARY KEY(user_id,handoff_id));
    CREATE TABLE IF NOT EXISTS reviews(handoff_id TEXT NOT NULL REFERENCES handoffs(id), reviewer TEXT NOT NULL REFERENCES users(id), target TEXT NOT NULL REFERENCES users(id), satisfaction INTEGER NOT NULL, reliability INTEGER NOT NULL, respect INTEGER NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(handoff_id,reviewer));
    CREATE TABLE IF NOT EXISTS concerns(handoff_id TEXT NOT NULL REFERENCES handoffs(id), reporter TEXT NOT NULL REFERENCES users(id), reason TEXT NOT NULL, disputed INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, PRIMARY KEY(handoff_id,reporter));
  `);
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const transaction = fn => { db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (e) { db.exec('ROLLBACK'); throw e; } };
  const username = id => get('SELECT name FROM users WHERE id=?', id)?.name ?? 'Person';
  const foodAwards = actor => [...all('SELECT payload FROM awards WHERE user_id=?', actor).map(a => JSON.parse(a.payload)),...shelves.awards(actor),...cleanups.awards(actor)];
  const accounts = accountRoutes({db,get,all,run,transaction,now,fail,fields,text,limit});
  const pins = pinCodes({db,get,run,now,fail});
  const reuse = reuseRoutes({ db, get, all, run, transaction, now, fail, fields, text, limit, foodAwards, isGuest:accounts.isGuest, pins });
  // Additive migrations retain existing accounts, appointments and receipts.
  const addColumn = (table, name, type) => { if (!all(`PRAGMA table_info(${table})`).some(c=>c.name===name)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`); };
  addColumn('offers','slot_minutes','INTEGER');
  addColumn('handoffs','slot_start','INTEGER'); addColumn('handoffs','slot_end','INTEGER');
  addColumn('handoffs','reserve_expires','INTEGER'); addColumn('handoffs','ticket_hash','TEXT'); addColumn('handoffs','ticket_expires','INTEGER'); addColumn('handoffs','ticket_role','INTEGER NOT NULL DEFAULT 0');
  db.exec(`CREATE TABLE IF NOT EXISTS shelf_updates(id TEXT PRIMARY KEY, point_id INTEGER NOT NULL, actor TEXT NOT NULL REFERENCES users(id), kind TEXT NOT NULL, fill TEXT NOT NULL, items TEXT NOT NULL, created INTEGER NOT NULL, request_key TEXT NOT NULL, UNIQUE(actor,request_key));`);
  const shelves = shelfRoutes({db,get,all,run,transaction,now,fail,fields,text,pins,isGuest:accounts.isGuest,ledger:actor=>[...foodAwards(actor),...reuse.awards(actor)]});
  const cleanups=cleanupRoutes({db,get,all,run,transaction,now,fail,fields,text,isGuest:accounts.isGuest,ledger:actor=>[...foodAwards(actor),...reuse.awards(actor)]});
  const slotOffer = (h,o) => ({...o,starts:h.slot_start??o.starts,ends:h.slot_end??o.ends});
  function slots(o) {
    if(!o.slot_minutes) return [];
    const booked=all("SELECT h.slot_start,h.slot_end FROM handoffs h JOIN offers x ON x.id=h.offer_id WHERE x.owner=? AND h.status IN ('pending','accepted','received','completed')",o.owner);
    const result=[];
    for(let start=o.starts;start+o.slot_minutes*60000<=o.ends;start+=o.slot_minutes*60000) {
      if(start<now()-60000) continue;
      result.push({startsAt:start,endsAt:start+o.slot_minutes*60000,available:!booked.some(h=>h.slot_start<start+o.slot_minutes*60000&&h.slot_end>start)});
    }
    return result;
  }
  const rate = new Map();
  function limit(key, max, windowMs) {
    const t = now(), entry = rate.get(key);
    const next = entry && entry.until > t ? entry : { n: 0, until: t + windowMs };
    if (++next.n > max) fail(429, 'Zu viele Versuche. Bitte später erneut versuchen.');
    rate.set(key, next);
    if (rate.size > 5000) for (const [k, v] of rate) if (v.until <= t) rate.delete(k);
  }
  function expire() {
    for (const h of all("SELECT h.id,h.offer_id FROM handoffs h JOIN offers o ON o.id=h.offer_id WHERE h.status IN ('pending','accepted') AND (COALESCE(h.slot_end,o.ends)<? OR (h.status='pending' AND h.reserve_expires IS NOT NULL AND h.reserve_expires<?))", now(), now())) {
      run("UPDATE handoffs SET status='expired',code_hash=NULL WHERE id=?", h.id);
      run('UPDATE offers SET remaining=remaining+1 WHERE id=?', h.offer_id);
    }
    run("UPDATE handoffs SET status='disputed',code_hash=NULL WHERE status='received' AND received<?", now() - DAY);
    run('DELETE FROM sessions WHERE expires<?', now());
  }
  function reputation(id) {
    // One contribution per counterpart, latest first. Blind until both submit or 14 days pass.
    const rows = all(`SELECT r.* FROM reviews r JOIN handoffs h ON h.id=r.handoff_id
      WHERE r.target=? AND r.reviewer IN (SELECT id FROM users WHERE guest=0) AND ((SELECT COUNT(*) FROM reviews x WHERE x.handoff_id=r.handoff_id)=2 OR h.completed<=?) ORDER BY r.created DESC`, id, now() - 14 * DAY);
    const unique = [...new Map(rows.toReversed().map(r => [r.reviewer, r])).values()];
    if (unique.length < 3) return { count: unique.length, visible: false };
    const avg = key => Math.round(unique.reduce((n, r) => n + r[key], 0) / unique.length * 10) / 10;
    return { count: unique.length, visible: true, satisfaction: avg('satisfaction'), reliability: avg('reliability'), respect: avg('respect') };
  }
  function offerView(o, actor, showAddress = false) {
    return { id: o.id, ownerId: o.owner, ownerName: username(o.owner), title: o.title, items: JSON.parse(o.items), portions: o.portions, remaining: o.remaining, area: o.area, startsAt: o.starts, endsAt: o.ends, slots: slots(o),
      address: o.owner === actor || showAddress ? o.address : undefined, reputation: reputation(o.owner) };
  }
  function handoff(id, actor) {
    const h = get('SELECT * FROM handoffs WHERE id=?', id);
    if (!h) fail(404, 'Übergabe nicht gefunden.');
    const o = get('SELECT * FROM offers WHERE id=?', h.offer_id);
    if (o.owner !== actor && h.receiver !== actor) fail(403, 'Diese Übergabe gehört anderen Personen.');
    return { h, o: slotOffer(h,o) };
  }
  function view(h, o, actor) {
    o = slotOffer(h,o);
    const counterpart = actor === o.owner ? h.receiver : o.owner;
    const locationVisible = ['accepted','received'].includes(h.status) && now() >= o.starts - 15 * 60_000 && now() <= o.ends;
    return { id: h.id, status: h.status, reserveExpiresAt:h.reserve_expires, role: actor === o.owner ? 'provider' : 'receiver', offer: offerView(o, actor, locationVisible), counterpart: { id: counterpart, name: username(counterpart), reputation: reputation(counterpart) },
      codeExpiresAt: actor === o.owner ? h.code_expires : undefined, completedAt: h.completed,
      reviewed: !!get('SELECT 1 FROM reviews WHERE handoff_id=? AND reviewer=?', h.id, actor),
      concern: all('SELECT reporter,reason,disputed FROM concerns WHERE handoff_id=?', h.id).map(c => ({ mine: c.reporter === actor, reason: c.reason, disputed: !!c.disputed })) };
  }
  function receipt(h, o, actor, type) {
    const ledger = [...foodAwards(actor),...reuse.awards(actor)];
    const other = actor === o.owner ? h.receiver : o.owner;
    const recentPair = get(`SELECT 1 FROM handoffs h JOIN offers o ON o.id=h.offer_id WHERE h.status='completed' AND h.id<>? AND h.completed>? AND ((o.owner=? AND h.receiver=?) OR (o.owner=? AND h.receiver=?))`, h.id, now() - 7 * DAY, actor, other, other, actor);
    const dailyRole = ledger.filter(a => a.type === type && new Date(a.at).toDateString() === new Date(now()).toDateString()).length;
    const event = { type, partner: 'foodsharing', status: 'bestätigt', key: `trust:${h.id}:${actor}`, at: now(), title: `${type === 'food.pickup' ? 'Abgeholt' : 'Übergeben'}: ${o.title}`,
      meta: { source: 'mainsam-server', handoffId: h.id, food_g: type === 'food.pickup' ? JSON.parse(o.items).reduce((n, i) => n + i.grams, 0) : 0, evidence: ['Übergabecode innerhalb des vereinbarten Zeitfensters eingelöst', 'Empfang und Übergabe von zwei getrennten Konten bestätigt', 'Mengen sind Schätzungen; Foto und Audio dienen zur Erfassung'] } };
    const result = award(event, ledger, { verifiedFood: true });
    if (recentPair || dailyRole >= 2 || accounts.isGuest(actor) || accounts.isGuest(other)) {
      result.points = 0; result.multiplier = 0; result.formula = 'Wiederholungsgrenze → 0 Punkte';
      result.reasons.push(accounts.isGuest(actor)||accounts.isGuest(other) ? 'Gastübergabe: Essen teilen ohne Anmeldung; keine einlösbaren Punkte für beide Seiten.' : recentPair ? 'Mit derselben Person gibt es innerhalb von sieben Tagen nur einmal Punkte.' : 'Höchstens zwei gewertete Übergaben pro Rolle und Tag.');
    }
    // The same food must never count twice across provider and recipient.
    if (type !== 'food.pickup') { result.impact.food_g = 0; result.impact.co2_g = 0; }
    run('INSERT INTO awards VALUES(?,?,?)', actor, h.id, JSON.stringify(result));
  }
  function createOffer(body,actor) {
      fields(body, ['title','items','portions','area','address','startsAt','endsAt','requestKey','slotMinutes']);
      const key = text(body.requestKey, 80, 8), old = get('SELECT * FROM offers WHERE owner=? AND request_key=?', actor, key);
      if (old) return offerView(old, actor);
      limit(`offer:${actor}`, 60, DAY);
      if (!Array.isArray(body.items) || !body.items.length || body.items.length > 20) fail(422, 'Bitte 1–20 Lebensmittel pro Portion erfassen.');
      const items = body.items.map(i => { fields(i, ['name','qty','cat','grams']); return { name: text(i.name, 100), qty: text(i.qty, 60), cat: text(i.cat, 60), grams: integer(i.grams, 1, 10000) }; });
      if (items.reduce((n, i) => n + i.grams, 0) > 20000) fail(422, 'Eine Portion darf höchstens 20 kg umfassen.');
      const starts = integer(body.startsAt, now() - 60_000, now() + 7 * DAY), ends = integer(body.endsAt, starts + 15 * 60_000, starts + 4 * 3600_000);
      const minutes=body.slotMinutes===undefined?null:integer(body.slotMinutes,5,30);
      const o = { id: randomUUID(), owner: actor, title: text(body.title), items: JSON.stringify(items), portions: integer(body.portions, 1, 20), area: text(body.area, 80), address: text(body.address, 200), starts, ends, created: now(), request_key: key };
      run('INSERT INTO offers(id,owner,title,items,portions,remaining,area,address,starts,ends,created,request_key) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)', o.id, actor, o.title, o.items, o.portions, o.portions, o.area, o.address, starts, ends, o.created, key);
      if(minutes!==null) run('UPDATE offers SET slot_minutes=? WHERE id=?',minutes,o.id);
      return offerView({ ...o, slot_minutes:minutes, remaining: o.portions }, actor);
  }
  async function dispatch(method, path, body, actor, ip) {
    if (method === 'GET' && path === '/health') return { ok: true, version: 2 };
    if (method === 'POST' && ['/register','/login','/guest'].includes(path)) return accounts.dispatch(path,body,actor,ip);
    if (method === 'GET' && path === '/offers' && !actor) return all('SELECT * FROM offers WHERE ends>? ORDER BY created DESC LIMIT 100',now()).map(o=>offerView(o,null));
    if(method==='GET' && /^\/shelves(\/\d+)?$/.test(path)) {
      const point=path.split('/')[2];
      const rows=point?all('SELECT * FROM shelf_updates WHERE point_id=? ORDER BY created DESC LIMIT 20',Number(point)):all("SELECT * FROM shelf_updates WHERE kind='shelf' AND id IN (SELECT id FROM shelf_updates s WHERE kind='shelf' AND created=(SELECT MAX(created) FROM shelf_updates WHERE point_id=s.point_id AND kind='shelf')) ORDER BY created DESC LIMIT 100");
      return rows.map(r=>({id:r.id,pointId:r.point_id,kind:r.kind,fill:r.fill,items:JSON.parse(r.items),at:r.created}));
    }
    if (!actor) fail(401, 'Bitte anmelden.');
    if (method === 'GET' && path === '/me') return { user: accounts.userView(actor), reputation: reputation(actor), awards: [...foodAwards(actor),...reuse.awards(actor)], merchantStores:reuse.stores(actor), shelfStores:shelves.stores(actor) };
    if(path.startsWith('/cleanups/')) {const result=cleanups.dispatch(method,path,body,actor);if(result!==undefined)return result;}
    if(path.startsWith('/shelf-actions')) {const result=shelves.dispatch(method,path,body,actor);if(result!==undefined)return result;}
    if(path.startsWith('/reuse/')) { const result=reuse.dispatch(method,path,body,actor); if(result!==undefined) return result; }
    if (method === 'GET' && path === '/offers') return all('SELECT * FROM offers WHERE owner=? OR (ends>?) ORDER BY created DESC LIMIT 100', actor, now()).map(o => offerView(o, actor));
    if (method === 'GET' && path === '/handoffs') return all('SELECT h.* FROM handoffs h JOIN offers o ON h.offer_id=o.id WHERE o.owner=? OR h.receiver=? ORDER BY h.created DESC LIMIT 100', actor, actor).map(h => view(h, get('SELECT * FROM offers WHERE id=?', h.offer_id), actor));
    if (method === 'POST' && path === '/offers') {
      return createOffer(body,actor);
    }
    if(method==='POST' && path==='/distributions') return transaction(()=>{
      fields(body,['title','area','address','startsAt','endsAt','requestKey','lots']);
      if(!Array.isArray(body.lots)||!body.lots.length||body.lots.length>20) fail(422,'Bitte 1–20 Lebensmittelposten zusammenstellen.');
      return body.lots.map((lot,i)=>{
        fields(lot,['items','portions']);
        return createOffer({title:body.lots.length===1?body.title:`${text(body.title,80)} · ${text(lot.items?.[0]?.name,70)}`,area:body.area,address:body.address,startsAt:body.startsAt,endsAt:body.endsAt,requestKey:`${text(body.requestKey,65,8)}-${i}`,items:lot.items,portions:lot.portions,slotMinutes:5},actor);
      });
    });
    const request = path.match(/^\/offers\/([^/]+)\/request$/);
    if (method === 'POST' && request) return transaction(() => {
      fields(body, ['slotStart']); const o = get('SELECT * FROM offers WHERE id=?', request[1]);
      if (!o) fail(404, 'Angebot nicht gefunden.');
      if (o.owner === actor) fail(403, 'Eigene Angebote können nicht abgeholt werden.');
      const old = get('SELECT * FROM handoffs WHERE offer_id=? AND receiver=?', o.id, actor);
      if (old) return view(old, o, actor);
      if (o.remaining < 1 || o.ends <= now()) fail(409, 'Keine Portion mehr verfügbar.');
      if (get("SELECT 1 FROM handoffs WHERE receiver=? AND status IN ('pending','accepted','received')", actor)) fail(409, 'Du hast bereits eine offene Abholung. Bitte zuerst abschließen oder absagen.');
      const cancellations=get("SELECT COUNT(*) AS n FROM handoffs WHERE receiver=? AND status IN ('cancelled','expired') AND created>?",actor,now()-DAY).n;
      if(cancellations>=3) fail(429,'Heute sind drei Anfragen abgesagt oder verfallen. Bitte morgen wieder reservieren.');
      let chosen=null;
      if(o.slot_minutes) { chosen=slots(o).find(s=>s.startsAt===body.slotStart&&s.available); if(!chosen) fail(409,'Bitte einen noch freien Abholtermin wählen.'); }
      const h = { slot_start:chosen?.startsAt,slot_end:chosen?.endsAt,reserve_expires:Math.min(now()+15*60000,chosen?.endsAt??o.ends), id: randomUUID(), offer_id: o.id, receiver: actor, status: 'pending', created: now() };
      run('INSERT INTO handoffs(id,offer_id,receiver,status,created) VALUES(?,?,?,?,?)', h.id, o.id, actor, h.status, h.created);
      run('UPDATE handoffs SET slot_start=?,slot_end=?,reserve_expires=? WHERE id=?',h.slot_start??null,h.slot_end??null,h.reserve_expires,h.id);
      run('UPDATE offers SET remaining=remaining-1 WHERE id=?', o.id);
      return view(h, {...o,remaining:o.remaining-1}, actor);
    });
    const ticket=path.match(/^\/handoffs\/([^/]+)\/(ticket|confirm-ticket)$/);
    if(method==='POST' && ticket) {
      const {h,o}=handoff(ticket[1],actor);
      fields(body,ticket[2]==='ticket'?[]:['proof']);
      if(ticket[2]==='ticket') {
        if(actor!==o.owner) fail(403,'Den Übergabecode zeigt die verteilende Person.');
        if(h.status!=='accepted'||now()<o.starts||now()>o.ends) fail(409,'Dein Abholcode ist nur zum zugesagten Termin verfügbar.');
        limit(`ticket:${h.id}`,10,60000);
        const secret=randomBytes(24).toString('hex'),expires=Math.min(now()+5*60000,o.ends);
        const code=pins.issue(`food:${h.id}`,expires);
        run('UPDATE handoffs SET ticket_hash=?,ticket_expires=?,ticket_role=2 WHERE id=?',hash(secret),expires,h.id);
        return {proof:`mainsam:food:${h.id}:${secret}`,code,expiresAt:expires};
      }
      if(actor!==h.receiver) fail(403,'Nur die abholende Person kann diesen Übergabecode bestätigen.');
      if(h.ticket_role!==2)fail(409,'Bitte den neuen Code von der verteilenden Person anzeigen lassen.');
      const value=text(body.proof,200);
      if(/^\d{4}$/.test(value)) { if(h.status!=='accepted') fail(409,'Diese Übergabe wurde bereits abgeschlossen.'); pins.verify(`food:${h.id}`,value); }
      else {
        const match=value.match(/^mainsam:food:([a-f0-9-]{36}):([a-f0-9]{48})$/);
        if(!match||match[1]!==h.id||!h.ticket_hash||!timingSafeEqual(Buffer.from(hash(match[2])),Buffer.from(h.ticket_hash))) fail(422,'Dieser Abholcode gehört nicht zu dieser Zusage.');
      }
      if(h.status==='completed') return view(h,o,actor);
      if(h.status!=='accepted'||h.ticket_expires<=now()||now()<o.starts||now()>o.ends) fail(409,'Der Abholcode ist abgelaufen. Bitte vor Ort erneuern.');
      return transaction(()=>{
        run("UPDATE handoffs SET status='completed',received=?,completed=?,code_hash=NULL WHERE id=?",now(),now(),h.id);
        receipt(h,o,o.owner,'food.distribute');receipt(h,o,h.receiver,'food.pickup');
        return view(get('SELECT * FROM handoffs WHERE id=?',h.id),o,actor);
      });
    }
    const shelf=path.match(/^\/shelves\/(\d+)$/);
    if(shelf && method==='GET') return all('SELECT * FROM shelf_updates WHERE point_id=? ORDER BY created DESC LIMIT 20',Number(shelf[1])).map(r=>({id:r.id,pointId:r.point_id,kind:r.kind,fill:r.fill,items:JSON.parse(r.items),at:r.created}));
    if(shelf && method==='POST') {
      if(!shelfIds.has(Number(shelf[1]))) fail(404,'Fairteiler nicht gefunden.');
      fields(body,['kind','fill','items','requestKey']);
      const key=text(body.requestKey,80,8); const old=get('SELECT id FROM shelf_updates WHERE actor=? AND request_key=?',actor,key); if(old) return {id:old.id};
      if(!['shelf','stock','pickup'].includes(body.kind)||!['leer','wenig','mittel','voll'].includes(body.fill)) fail(422,'Bitte eine Regalaktion wählen.');
      if(!Array.isArray(body.items)||body.items.length>20) fail(422,'Bitte höchstens 20 Posten angeben.');
      const items=body.items.map(i=>({name:text(i.name,100),qty:text(i.qty,60),cat:text(i.cat,60),grams:integer(i.grams,0,10000)}));
      limit(`shelf:${actor}:${shelf[1]}`,8,3600000);
      const id=randomUUID();run('INSERT INTO shelf_updates VALUES(?,?,?,?,?,?,?,?)',id,Number(shelf[1]),actor,body.kind,body.fill,JSON.stringify(items),now(),key);
      return {id};
    }
    const action = path.match(/^\/handoffs\/([^/]+)\/(accept|cancel|code|receive|complete|review|concern|dispute)$/);
    if (method === 'POST' && action) {
      const { h, o } = handoff(action[1], actor), op = action[2], provider = actor === o.owner;
      fields(body, op === 'receive' ? ['code'] : op === 'review' ? ['satisfaction','reliability','respect'] : op === 'concern' ? ['reason'] : []);
      if (op === 'accept') {
        if (!provider) fail(403, 'Nur die anbietende Person kann zusagen.');
        if (h.status === 'accepted') return view(h, o, actor);
        if (h.status !== 'pending' || o.ends <= now()) fail(409, 'Diese Anfrage kann nicht mehr zugesagt werden.');
        run("UPDATE handoffs SET status='accepted',accepted=? WHERE id=?", now(), h.id);
      } else if (op === 'cancel') {
        if (!['pending','accepted'].includes(h.status)) fail(409, 'Diese Übergabe lässt sich nicht mehr absagen.');
        transaction(() => { run("UPDATE handoffs SET status='cancelled',code_hash=NULL WHERE id=?", h.id); run('UPDATE offers SET remaining=remaining+1 WHERE id=?', o.id); });
      } else if (op === 'code') {
        if (!provider) fail(403, 'Nur die anbietende Person erhält den Übergabecode.');
        if (h.status !== 'accepted' || now() < o.starts || now() > o.ends) fail(409, 'Der Übergabecode ist erst im vereinbarten Zeitfenster verfügbar.');
        if (h.generations >= 5 || h.attempts >= 5) fail(429, 'Versuchslimit erreicht. Diese Übergabe bitte absagen und neu vereinbaren.');
        const code = String(randomInt(100000, 1000000)); const expires = Math.min(now() + CODE_TTL, o.ends);
        run('UPDATE handoffs SET code_hash=?,code_expires=?,generations=generations+1 WHERE id=?', hash(`${h.id}:${code}`), expires, h.id);
        return { code, expiresAt: expires };
      } else if (op === 'receive') {
        if (provider) fail(403, 'Den Empfang bestätigt die abholende Person.');
        if (h.attempts >= 5) fail(429, 'Zu viele falsche Codes. Bitte mit der anbietenden Person klären.');
        if (h.status !== 'accepted' || !h.code_hash || h.code_expires <= now() || now() < o.starts || now() > o.ends) fail(409, 'Der Code ist abgelaufen oder die Übergabe noch nicht bereit.');
        const code = text(body.code, 6, 6);
        if (!timingSafeEqual(Buffer.from(hash(`${h.id}:${code}`)), Buffer.from(h.code_hash))) {
          run('UPDATE handoffs SET attempts=attempts+1 WHERE id=?', h.id); fail(422, 'Der Übergabecode stimmt nicht.');
        }
        run("UPDATE handoffs SET status='received',received=?,code_hash=NULL WHERE id=?", now(), h.id);
      } else if (op === 'complete') {
        if (!provider) fail(403, 'Zum Abschluss muss die anbietende Person die Übergabe bestätigen.');
        if (h.status === 'completed') return view(h, o, actor);
        if (h.status !== 'received') fail(409, 'Die andere Person muss zuerst den Empfang per Code bestätigen.');
        if (now() > h.received + DAY) fail(409, 'Die Abschlussfrist ist abgelaufen. Bitte das Problem zur Übergabe vermerken.');
        transaction(() => {
          run("UPDATE handoffs SET status='completed',completed=? WHERE id=?", now(), h.id);
          receipt(h, o, o.owner, 'food.distribute'); receipt(h, o, h.receiver, 'food.pickup');
        });
      } else if (op === 'review') {
        if (h.status !== 'completed') fail(409, 'Bewertungen sind erst nach beidseitig bestätigter Übergabe möglich.');
        if (now() > h.completed + 14 * DAY) fail(409, 'Die Bewertungsfrist von 14 Tagen ist abgelaufen.');
        if (get('SELECT 1 FROM reviews WHERE handoff_id=? AND reviewer=?', h.id, actor)) fail(409, 'Du hast diese Übergabe bereits bewertet.');
        run('INSERT INTO reviews VALUES(?,?,?,?,?,?,?)', h.id, actor, provider ? h.receiver : o.owner, integer(body.satisfaction, 1, 5), integer(body.reliability, 1, 5), integer(body.respect, 1, 5), now());
      } else if (op === 'concern') {
        const reason = text(body.reason, 30);
        if (!['no_show','early','took_more','disrespect'].includes(reason)) fail(422, 'Bitte einen passenden Grund auswählen.');
        if (reason === 'no_show' && (!h.accepted || now() < o.ends + 15 * 60_000 || !['expired','accepted'].includes(h.status))) fail(409, 'Nicht erschienen kann erst 15 Minuten nach Ende des Zeitfensters vermerkt werden.');
        if (now() > o.ends + 14 * DAY) fail(409, 'Die Frist für einen Vermerk ist abgelaufen.');
        if (get('SELECT 1 FROM concerns WHERE handoff_id=? AND reporter=?', h.id, actor)) fail(409, 'Dein Hinweis wurde bereits gespeichert.');
        run('INSERT INTO concerns VALUES(?,?,?,0,?)', h.id, actor, reason, now());
      } else if (op === 'dispute') {
        run('UPDATE concerns SET disputed=1 WHERE handoff_id=? AND reporter<>?', h.id, actor);
      }
      return view(get('SELECT * FROM handoffs WHERE id=?', h.id), o, actor);
    }
    fail(404, 'Endpunkt nicht gefunden.');
  }
  const server = createServer(async (req, res) => {
    try {
      const origin = req.headers.origin;
      const validOrigin = origin && (origin === allowedOrigin || (() => { try { const u = new URL(origin); return u.protocol === 'http:' && privateHost(u.hostname); } catch { return false; } })());
      if (origin && !validOrigin) fail(403, 'Dieser Browser-Ursprung ist nicht freigegeben.');
      if (!privateHost(new URL(`http://${req.headers.host}`).hostname) && !allowedOrigin) fail(403, 'Dieser Server ist nur für das private Netz eingerichtet.');
      if (validOrigin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary','Origin'); }
      res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods','GET, POST, DELETE, OPTIONS');
      res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff');
      if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
      limit(`request:${req.socket.remoteAddress}`, 600, 60_000);
      const path = new URL(req.url, 'http://localhost').pathname;
      let body = {}, bytes = 0, chunks = [];
      for await (const chunk of req) { bytes += chunk.length; if (bytes > 32768) fail(413, 'Die Anfrage ist zu groß.'); chunks.push(chunk); }
      if (bytes) { try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch { fail(400, 'Ungültige Anfrage.'); } }
      expire();
      const token = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
      const actor = token ? get('SELECT user_id FROM sessions WHERE token=? AND expires>?', hash(token), now())?.user_id : null;
      let result;
      if (req.method === 'DELETE' && path === '/session' && actor) { run('DELETE FROM sessions WHERE token=?', hash(token)); result = { ok: true }; }
      else result = await dispatch(req.method, path, body, actor, req.socket.remoteAddress);
      res.writeHead(200, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(e.status ?? 500, {'Content-Type':'application/json; charset=utf-8'});
      res.end(JSON.stringify({ error: e.status ? e.message : 'Die Anfrage konnte nicht abgeschlossen werden.' }));
      if (!e.status) console.error('Trust request failed:', e.code ?? e.name);
    }
  });
  server.requestTimeout = 10_000; server.headersTimeout = 10_000;
  server.once('close', () => db.close());
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dbPath = process.env.TRUST_DB ?? fileURLToPath(new URL('./data/trust.sqlite', import.meta.url));
  const host = process.argv.includes('--lan') ? '0.0.0.0' : '127.0.0.1';
  const port = Number(process.env.TRUST_PORT ?? 8787);
  const server = createTrustServer({ dbPath });
  server.listen(port, host, () => console.log(`Übergaben-Server bereit auf ${host}:${port}. ${host === '0.0.0.0' ? 'Nur im eigenen privaten Netz verwenden.' : 'Nur auf diesem Rechner erreichbar.'}`));
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
