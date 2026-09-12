const {spawn}=require('node:child_process');
const {resolve}=require('node:path');
const {networkInterfaces}=require('node:os');
const {lanConfig}=require('./lan-address.cjs');
const root=resolve(__dirname,'..');
const env={...process.env};
// Read the same .env settings as Expo, without logging API keys or other values.
require('@expo/env').loadProjectEnv(root,{mode:'development',silent:true,systemEnv:env});
let config;try{config=lanConfig(networkInterfaces(),env);}catch(error){console.error(error.message);process.exit(1);}
env.REACT_NATIVE_PACKAGER_HOSTNAME=config.host;
env.EXPO_PUBLIC_TRUST_URL=config.trustUrl;
console.log(`Handy-Verbindung: ${config.host} (WLAN/Hotspot). Übergaben-Server: ${new URL(config.trustUrl).origin}`);
let expo,started=false,stopping=false,startupLog='';
const server=spawn(process.execPath,[resolve(root,'../trust-server/server.mjs'),'--lan'],{cwd:root,env,stdio:['ignore','pipe','inherit']});
function stop(code=0){if(stopping)return;stopping=true;server.kill('SIGINT');expo?.kill('SIGINT');process.exitCode=code;}
server.stdout.on('data',data=>{
  process.stdout.write(data);
  startupLog=(startupLog+String(data)).slice(-8192);
  if(started||stopping||!startupLog.includes('Übergaben-Server bereit'))return;
  started=true;
  expo=spawn(process.execPath,[resolve(root,'node_modules/expo/bin/cli'),'start','--go','--lan','--clear',...process.argv.slice(2)],{cwd:root,env,stdio:'inherit'});
  expo.on('error',e=>{console.error(e.message);stop(1);});
  expo.on('exit',code=>stop(code||0));
});
server.on('error',e=>{console.error(e.message);stop(1);});
server.on('exit',code=>{if(!stopping){console.error(`Der lokale Server wurde beendet. Falls Port ${config.port} belegt ist, den bisherigen Server zuerst mit Ctrl+C stoppen.`);stop(code||1);}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>stop());
