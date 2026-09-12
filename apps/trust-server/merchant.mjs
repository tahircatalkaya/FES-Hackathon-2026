import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const stores=JSON.parse(readFileSync(new URL('../mobile/src/data/vytal-stores.json',import.meta.url),'utf8'));
const [command,name,storeId]=process.argv.slice(2);
if(command==='stores') {
  for(const s of stores) console.log(`${s.id}\t${s.name}`);
} else if(['grant','revoke'].includes(command)&&name&&storeId) {
  const store=stores.find(s=>s.id===storeId);
  if(!store) throw new Error('Unbekannte Store-ID. Zuerst: node merchant.mjs stores');
  const db=new DatabaseSync(process.env.TRUST_DB??fileURLToPath(new URL('./data/trust.sqlite',import.meta.url)));
  try {
    const user=db.prepare('SELECT id FROM users WHERE name=?').get(name.toLowerCase());
    if(!user) throw new Error('Dieses Konto muss zuerst in Mainsam angelegt werden.');
    if(command==='grant') db.prepare('INSERT OR IGNORE INTO merchants VALUES(?,?)').run(user.id,store.id);
    else db.prepare('DELETE FROM merchants WHERE user_id=? AND store_id=?').run(user.id,store.id);
    console.log(`${command==='grant'?'Freigegeben':'Entzogen'}: ${name} · ${store.name}`);
  } finally {db.close();}
} else {console.error('Auf dem Server: node merchant.mjs stores | grant <Benutzername> <Store-ID> | revoke <Benutzername> <Store-ID>');process.exitCode=1;}
