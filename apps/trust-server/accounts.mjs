import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
const hash = value => createHash('sha256').update(value).digest('hex');
const DAY = 86400000;

export function accountRoutes({db,get,all,run,transaction,now,fail,fields,text,limit}) {
  const add = (name,type) => { if(!all('PRAGMA table_info(users)').some(c=>c.name===name)) db.exec(`ALTER TABLE users ADD COLUMN ${name} ${type}`); };
  add('email','TEXT'); add('guest','INTEGER NOT NULL DEFAULT 0');
  db.exec('CREATE UNIQUE INDEX IF NOT EXISTS user_email ON users(email) WHERE email IS NOT NULL; CREATE TABLE IF NOT EXISTS guest_issues(ip_hash TEXT NOT NULL, created INTEGER NOT NULL);');
  const isGuest = id => !!get('SELECT guest FROM users WHERE id=?',id)?.guest;
  const userView = id => { const u=get('SELECT id,name,email,guest FROM users WHERE id=?',id); return {id:u.id,name:u.name,email:u.email||'',guest:!!u.guest}; };
  const session = id => {const token=randomBytes(32).toString('hex');run('INSERT INTO sessions VALUES(?,?,?)',hash(token),id,now()+30*DAY);return {token,user:userView(id)};};
  async function dispatch(path,body,actor,ip) {
    if(path==='/guest') {
      fields(body,[]);
      if(actor) return session(actor);
      limit(`guest:${ip}`,20,60000);
      return transaction(()=>{
        const ipHash=hash(ip);
        run('DELETE FROM guest_issues WHERE created<?',now()-DAY);
        if(get('SELECT COUNT(*) AS n FROM guest_issues WHERE ip_hash=?',ipHash).n>=100) fail(429,'Heute wurden in diesem Netz zu viele Gastzugänge geöffnet. Bitte später erneut versuchen.');
        const id=randomUUID(),name=`gast-${randomBytes(5).toString('hex')}`;
        run('INSERT INTO users(id,name,salt,password,guest) VALUES(?,?,?,?,1)',id,name,randomBytes(16).toString('hex'),randomBytes(64).toString('hex'));
        run('INSERT INTO guest_issues VALUES(?,?)',ipHash,now());
        return session(id);
      });
    }
    fields(body,path==='/register'?['name','email','password']:['name','password']);
    limit(`auth:${ip}`,30,10*60000);
    // Do not trim passwords: registration and login must compare the exact same secret.
    if(typeof body.password!=='string'||body.password.length<10||body.password.length>128) fail(422,'Das Passwort braucht 10–128 Zeichen.');
    if(path==='/login') {
      const identifier=text(body.name,254,3).toLowerCase();
      const u=get('SELECT * FROM users WHERE (name=? OR email=?) AND guest=0',identifier,identifier);
      const digest=await derive(body.password,u?.salt??'invalid-user-salt',64);
      if(!u||!timingSafeEqual(digest,Buffer.from(u.password,'hex'))) fail(401,'E-Mail, Benutzername oder Passwort stimmt nicht.');
      return session(u.id);
    }
    const name=text(body.name,24,3).toLowerCase();
    if(!/^[a-z0-9._-]+$/.test(name)||name.startsWith('gast-')) fail(422,'Benutzername: 3–24 Buchstaben, Zahlen, Punkt, Bindestrich oder Unterstrich.');
    const email=text(body.email,254,5).toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(422,'Bitte eine gültige E-Mail-Adresse eingeben.');
    if(actor&&!isGuest(actor)) fail(409,'Du bist bereits angemeldet.');
    limit(`register:${ip}`,10,DAY);
    const salt=randomBytes(16).toString('hex'),digest=(await derive(body.password,salt,64)).toString('hex');
    return transaction(()=>{
      if(get('SELECT 1 FROM users WHERE name=? OR email=?',name,email)) fail(409,'Benutzername oder E-Mail ist bereits vergeben.');
      // Recheck after asynchronous hashing: concurrent guest upgrades must not overwrite each other.
      if(actor&&!isGuest(actor)) fail(409,'Dieser Zugang wurde bereits eingerichtet.');
      const id=actor||randomUUID();
      if(actor) {run('UPDATE users SET name=?,email=?,salt=?,password=?,guest=0 WHERE id=?',name,email,salt,digest,id);run('DELETE FROM sessions WHERE user_id=?',id);}
      else run('INSERT INTO users(id,name,salt,password,email,guest) VALUES(?,?,?,?,?,0)',id,name,salt,digest,email);
      return session(id);
    });
  }
  return {dispatch,isGuest,userView};
}
