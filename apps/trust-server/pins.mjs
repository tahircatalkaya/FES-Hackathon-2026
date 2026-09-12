import { randomInt, createHash, timingSafeEqual } from 'node:crypto';
const hash = value => createHash('sha256').update(value).digest('hex');
/** Short codes are only valid inside one already authorized handoff/loan, never globally. */
export function pinCodes({db,get,run,now,fail}) {
  db.exec('CREATE TABLE IF NOT EXISTS proof_pins(context TEXT PRIMARY KEY, digest TEXT NOT NULL, expires INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, generations INTEGER NOT NULL DEFAULT 0);');
  function issue(context,expires) {
    const old=get('SELECT * FROM proof_pins WHERE context=?',context);
    if(old&&(old.attempts>=5||old.generations>=10)) fail(429,'Code-Limit erreicht. Bitte den persönlichen QR-Code verwenden oder die Übergabe klären.');
    const code=String(randomInt(1000,10000));
    run('INSERT INTO proof_pins(context,digest,expires,generations) VALUES(?,?,?,1) ON CONFLICT(context) DO UPDATE SET digest=excluded.digest,expires=excluded.expires,generations=proof_pins.generations+1',context,hash(`${context}:${code}`),expires);
    return code;
  }
  // Call outside rollback transactions so failed attempts survive errors and server restarts.
  function verify(context,code) {
    const row=get('SELECT * FROM proof_pins WHERE context=?',context);
    if(!row||row.expires<=now()) fail(409,'Code abgelaufen. Bitte vor Ort einen neuen anzeigen lassen.');
    if(row.attempts>=5) fail(429,'Zu viele falsche Codes. Bitte den persönlichen QR-Code verwenden.');
    if(!/^\d{4}$/.test(code)||!timingSafeEqual(Buffer.from(hash(`${context}:${code}`)),Buffer.from(row.digest))) {
      run('UPDATE proof_pins SET attempts=attempts+1 WHERE context=?',context);fail(422,'Der vierstellige Code stimmt nicht.');
    }
  }
  return {issue,verify};
}
