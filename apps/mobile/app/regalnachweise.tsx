import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useRouter, useLocalSearchParams } from 'expo-router';
import { Screen, Header } from '@/components/Screen';
import { Button, Card, T, Tag } from '@/components/ui';
import ProofCode from '@/components/ProofCode';
import { trust, type ShelfAction, type ProofTicket } from '@/api/trust';
import { C } from '@/theme';
import { useStore } from '@/store';
export default function ShelfReceipts(){
  const router=useRouter(),params=useLocalSearchParams<{id?:string}>();const [rows,setRows]=useState<ShelfAction[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[tickets,setTickets]=useState<Record<string,ProofTicket>>({});
  const load=useCallback(async()=>{try{if(!await trust.hasSession())return;const [actions,me]=await Promise.all([trust.shelfActions(),trust.me()]);setRows(actions);useStore.getState().syncFoodAwards(me.awards);setError('');}catch(e:any){setError(e.message);}finally{setReady(true);}},[]);
  useFocusEffect(useCallback(()=>{void load();const t=setInterval(()=>void load(),10000);return()=>clearInterval(t);},[load]));
  return <Screen tabBar={false}><Header title="Regalmeldungen" subtitle="Deine Meldung · Bestätigung vor Ort" color={C.food}/><Text style={[T.body,{marginBottom:14}]}>Du darfst auch ohne Anmeldung etwas mitnehmen. Ist eine freigegebene Regalbetreuung da, kann sie deine Aktion mit deinem persönlichen Code bestätigen. Ohne Betreuung bleibt sie als eigene Meldung sichtbar, ohne Punkte.</Text>
    {!!error&&<Card style={{gap:8}}><Text accessibilityRole="alert" style={{color:C.danger}}>{error}</Text><Button label="Erneut laden" onPress={()=>void load()}/></Card>}
    {!ready?<Text style={T.body}>Lade Meldungen…</Text>:!rows.length?<Text style={T.body}>Noch keine Regalmeldung. Öffne einen Regal-QR oder einen Fairteiler auf der Karte.</Text>:<View style={{gap:12}}>{rows.filter(r=>!params.id||r.id===params.id).map(r=><Card key={r.id} style={{gap:10}}><Tag label={r.confirmed?'Bestätigt':'Eigene Meldung · noch unbestätigt'} color={r.confirmed?C.food:C.muted}/><Text style={T.h3}>{r.pointName}</Text><Text style={T.body}>{r.kind==='stock'?'Eingestellt':r.kind==='pickup'?'Abgeholt':'Regal angesehen'} · {r.mine?'Du':r.name}</Text><Text style={T.small}>{r.items.map(i=>`${i.qty} ${i.name}`).join(' · ')||'Regalstand'} · {new Date(r.at).toLocaleString('de-DE')}</Text>
      {!r.confirmed&&(r.mine?<><Button label="Meinen 4-stelligen Code zeigen" color={C.food} disabled={busy||Date.now()>r.at+30*60000} onPress={()=>{setBusy(true);void trust.shelfTicket(r.id).then(ticket=>setTickets({...tickets,[r.id]:ticket})).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}/>{Date.now()>r.at+30*60000&&<Text style={T.small}>Die Frist von 30 Minuten ist vorbei. Der Eintrag bleibt unbestätigt.</Text>}{tickets[r.id]&&<ProofCode {...tickets[r.id]} label="Nur bei der Regalbetreuung zeigen"/>}</>:<Button label="Aktion prüfen · Code eingeben" color={C.food} onPress={()=>router.push({pathname:'/scan',params:{mode:'shelf-handover',id:r.id}})}/>)}
    </Card>)}</View>}
  </Screen>;
}
