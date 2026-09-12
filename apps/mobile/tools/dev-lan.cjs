const {spawn}=require('node:child_process');
const {resolve}=require('node:path');
const root=resolve(__dirname,'..');
const port=Number(process.env.TRUST_PORT||8787);
if(port!==8787&&!process.env.EXPO_PUBLIC_TRUST_URL){console.error('Bei einem anderen Serverport bitte EXPO_PUBLIC_TRUST_URL auf die private Serveradresse setzen.');process.exit(1);}
let expo,started=false,stopping=false;
const server=spawn(process.execPath,[resolve(root,'../trust-server/server.mjs'),'--lan'],{cwd:root,env:process.env,stdio:['ignore','pipe','inherit']});
function stop(code=0){if(stopping)return;stopping=true;server.kill('SIGINT');expo?.kill('SIGINT');process.exitCode=code;}
server.stdout.on('data',data=>{
  process.stdout.write(data);
  if(started||stopping||!String(data).includes('Übergaben-Server bereit'))return;
  started=true;
  expo=spawn(process.execPath,[resolve(root,'node_modules/expo/bin/cli'),'start','--go','--lan','--clear',...process.argv.slice(2)],{cwd:root,env:process.env,stdio:'inherit'});
  expo.on('error',e=>{console.error(e.message);stop(1);});
  expo.on('exit',code=>stop(code||0));
});
server.on('error',e=>{console.error(e.message);stop(1);});
server.on('exit',code=>{if(!stopping){console.error('Der lokale Server wurde beendet. Falls Port 8787 belegt ist, den bisherigen Server zuerst mit Ctrl+C stoppen.');stop(code||1);}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>stop());
