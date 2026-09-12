import React, { useCallback, useRef, useState } from 'react';
import { AppState, Linking, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { reuseTrust, trust, type ReuseLoan } from '@/api/trust';
import { useStore } from '@/store';
import { Button, Card, Pill, Row, T, Tag } from './ui';
import TrustAccount from './TrustAccount';
import { C } from '@/theme';

export const DAMAGE:Record<string,string>={cracked:'Riss oder Bruch',lid:'Deckel beschädigt / fehlt',leaking:'Undicht',other:'Anderer Schaden'};
export async function syncReuse() {
  const [loans,profile]=await Promise.all([reuseTrust.loans(),trust.me()]);
  useStore.getState().syncFoodAwards(profile.awards);
  useStore.getState().syncContainers(loans.map(l=>({code:l.code,kind:l.kind,storeId:l.storeId||'',storeName:l.storeName,borrowedAt:l.borrowedAt,returnedAt:l.returnedAt||undefined,txId:`trust:${l.id}`})));
  return {loans,profile};
}
export default function ReuseInventory({returnOnly=false}:{returnOnly?:boolean}) {
  const router=useRouter();
  const [loans,setLoans]=useState<ReuseLoan[]>([]),[ready,setReady]=useState(false),[signed,setSigned]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[merchant,setMerchant]=useState(false);
  const running=useRef(false);
  const load=useCallback(async()=>{if(running.current)return;running.current=true;try{const has=await trust.hasSession();setSigned(has);if(!has)return;const r=await syncReuse();setLoans(r.loans);setMerchant(!!r.profile.merchantStores.length);setError('');}catch(e:any){setError(e.message);if(e.status===401)setSigned(false);}finally{setReady(true);running.current=false;}},[]);
  useFocusEffect(useCallback(()=>{void load();const timer=setInterval(()=>{if(AppState.currentState==='active')void load();},10000);return()=>clearInterval(timer);},[load]));
  const open=loans.filter(l=>!l.returnedAt),returned=loans.filter(l=>l.returnedAt);
  const legacy=useStore(s=>s.containers).filter(c=>!c.txId.startsWith('trust:')&&!c.returnedAt&&!loans.some(l=>l.code===c.code));
  return <View style={{gap:12}}>
    <Card style={{backgroundColor:C.reuse,gap:8}}><Text style={[T.h2,{color:'#fff'}]}>{returnOnly?'Deine Rückgabe':`${open.length} unterwegs · ${returned.length} zurück`}</Text><Text style={[T.body,{color:'#fff'}]}>Behälter abgeben, frischen Rückgabe-QR vom Personal scannen. Dein Beleg wird danach sofort angezeigt.</Text></Card>
    {!!error&&<><Text accessibilityRole="alert" style={[T.body,{color:C.danger}]}>{error}</Text><Button label="Erneut laden" variant="soft" onPress={()=>void load()}/></>}
    {!ready?<Text style={T.body}>Lade Behälter…</Text>:!signed?<TrustAccount color={C.reuse} onReady={()=>void load()}/>:<>
      {!open.length&&<Card><Text style={T.body}>Keine offenen Behälter. Erfasse zuerst die Ausleihe mit dem QR-Code auf Schale oder Becher.</Text></Card>}
      {open.map(l=><LoanCard key={l.id} loan={l} onSaved={load}/>)}
      {!returnOnly&&<Button label="Ausleihe scannen" icon="scan" color={C.reuse} onPress={()=>router.push('/scan?mode=vytal')}/>}
      {legacy.map(c=><Card key={c.txId} style={{gap:8}}><Text style={T.h3}>{c.code} · früher auf diesem Gerät erfasst</Text><Text style={T.small}>Ordne diesen Behälter deinem Zugang zu. Frühere Selbstbestätigungen sind kein Rückgabenachweis.</Text><Button label="Diesem Zugang zuordnen" color={C.reuse} variant="soft" disabled={busy} onPress={()=>{setBusy(true);void reuseTrust.borrow({code:c.code,kind:c.kind,storeId:c.storeId}).then(load).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}/></Card>)}
      {!!returned.length&&<><Text style={T.h3}>Deine Rückgabebelege</Text>{returned.slice(0,5).map(l=><Card key={l.id} style={{gap:5}}><Text style={T.h3}>{l.code}</Text><Tag label={l.demo?'Demo · ohne Punkte':'Rücknahme bestätigt'} color={C.reuse}/><Text style={T.small}>{l.returnStoreName} · {new Date(l.returnedAt!).toLocaleString('de-DE')}</Text>{l.damage&&<Text style={T.small}>Mit Schaden abgegeben: {DAMAGE[l.damage.reason]}</Text>}</Card>)}</>}
      {merchant&&<Button label="Rücknahmestelle öffnen" color={C.reuse} variant="soft" onPress={()=>router.push('/ruecknahmestelle')}/>}
    </>}
  </View>;
}
function LoanCard({loan:l,onSaved}:{loan:ReuseLoan;onSaved:()=>Promise<void>}) {
  const router=useRouter();const [form,setForm]=useState(false),[reason,setReason]=useState(l.damage?.reason||'cracked'),[note,setNote]=useState(l.damage?.note||''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const days=Math.ceil((l.borrowedAt+14*86400000-Date.now())/86400000);
  return <Card style={{gap:10,borderLeftWidth:4,borderLeftColor:l.damage?C.warn:C.reuse}}>
    <Text style={T.h3}>{l.kind==='cup'?'Becher':'Schale'} {l.code}</Text><Text style={T.small}>{l.storeName} · {days>0?`Erinnerung in ${days} Tagen`:'Rückgabe-Erinnerung fällig'}</Text>
    {l.demo&&<Tag label="Demo-Behälter · keine Punkte" color={C.muted}/>}
    {l.damage&&<><Tag label={`Schaden gemeldet: ${DAMAGE[l.damage.reason]}`} color={C.warn}/><Text style={T.small}>In Mainsam gespeichert und bei der Rücknahme für das Personal sichtbar. Bitte separat übergeben; noch nicht an Vytal gesendet.</Text></>}
    <Text style={T.small}>Die verbindliche Frist findest du in deinem Vytal-Konto.</Text>
    <Button label="Rückgabe-QR scannen" icon="qr-code" color={C.reuse} onPress={()=>router.push({pathname:'/scan',params:{mode:'vytal-return',id:l.id}})}/>
    <Button label={form?'Schadensmeldung schließen':l.damage?'Schadensmeldung ansehen':'Schaden melden'} color={C.muted} variant="ghost" onPress={()=>setForm(!form)}/>
    {form&&<View style={{gap:10}}><Button label="Vytal-Hilfe zu Rückgabe & Schäden" variant="ghost" color={C.reuse} onPress={()=>void Linking.openURL('https://www.vytal.org/de/faq/return')}/><Text style={T.body}>Was ist kaputt? Der Behälter bleibt bis zur bestätigten Rücknahme offen.</Text><Row style={{flexWrap:'wrap'}}>{Object.entries(DAMAGE).map(([id,label])=><Pill key={id} label={label} active={reason===id} color={C.warn} onPress={()=>setReason(id)}/>)}</Row><TextInput accessibilityLabel="Beschreibung des Schadens" placeholder="Kurze Beschreibung · optional" multiline maxLength={300} value={note} onChangeText={setNote} style={{padding:12,backgroundColor:C.bg,borderRadius:12,fontSize:16}}/>{!!error&&<Text accessibilityRole="alert" style={{color:C.danger}}>{error}</Text>}<Button label={busy?'Speichere…':'Schaden speichern'} disabled={busy} color={C.reuse} onPress={()=>{setBusy(true);setError('');void reuseTrust.damage(l.id,reason,note).then(async()=>{await onSaved();setForm(false);}).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}/></View>}
  </Card>;
}
