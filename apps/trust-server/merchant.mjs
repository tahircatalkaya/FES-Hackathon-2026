import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const stores=JSON.parse(readFileSync(new URL('../mobile/src/data/vytal-stores.json',import.meta.url),'utf8'));
const shelves=JSON.parse(readFileSync(new URL('../mobile/src/data/fairteiler.json',import.meta.url),'utf8'));
const [command,name,placeId]=process.argv.slice(2);
if(command==='stores'||command==='shelves') {
  for(const p of command==='stores'?stores:shelves) console.log(`${p.id}\t${p.name}`);
} else if(['grant','revoke','grant-shelf','revoke-shelf'].includes(command)&&name&&placeId) {
  const shelf=command.endsWith('-shelf'),place=(shelf?shelves:stores).find(s=>String(s.id)===placeId);
  if(!place)throw new Error('Unbekannte Ort-ID. Zuerst: node merchant.mjs stores oder shelves');
  const db=new DatabaseSync(process.env.TRUST_DB??fileURLToPath(new URL('./data/trust.sqlite',import.meta.url)));
  try {
    const user=db.prepare('SELECT id,guest FROM users WHERE name=?').get(name.toLowerCase());
    if(!user||user.guest)throw new Error('Bitte zuerst einen regulären Mainsam-Zugang am App-Einstieg anlegen.');
    const table=shelf?'shelf_staff':'merchants',column=shelf?'point_id':'store_id';
    if(command.startsWith('grant'))db.prepare(`INSERT OR IGNORE INTO ${table} VALUES(?,?)`).run(user.id,place.id);
    else db.prepare(`DELETE FROM ${table} WHERE user_id=? AND ${column}=?`).run(user.id,place.id);
    console.log(`${command.startsWith('grant')?'Freigegeben':'Entzogen'}: ${name} · ${place.name}`);
  }finally{db.close();}
}else{console.error('node merchant.mjs stores | shelves | grant/revoke <Name> <Store-ID> | grant-shelf/revoke-shelf <Name> <Regal-ID>');process.exitCode=1;}
