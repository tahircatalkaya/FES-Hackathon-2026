import React, { useCallback, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, Header } from '@/components/Screen';
import { Button, Card, Pill, Row, T, Tag } from '@/components/ui';
import TrustAccount from '@/components/TrustAccount';
import ProofCode from '@/components/ProofCode';
import { DAMAGE } from '@/components/ReuseInventory';
import { trust, reuseTrust, type TrustProfile, type ReuseLoan } from '@/api/trust';
import { parseContainerCode } from '@/api/vytal';
import { C } from '@/theme';
export default function ReturnDesk() {
  const [profile,setProfile]=useState<TrustProfile|null>(null),[ready,setReady]=useState(false),[store,setStore]=useState(''),[code,setCode]=useState(''),[loan,setLoan]=useState<ReuseLoan|null>(null),[receipt,setReceipt]=useState<Awaited<ReturnType<typeof reuseTrust.receipt>>|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const load=useCallback(async()=>{try{if(await trust.hasSession()){const me=await trust.me();setProfile(me);setStore(me.merchantStores[0]?.id||'');}}catch(e:any){setError(e.message);}finally{setReady(true);}},[]);
  useFocusEffect(useCallback(()=>{void load();},[load]));
  async function run(action:()=>Promise<void>){if(busy)return;setBusy(true);setError('');try{await action();}catch(e:any){setError(e.message);}finally{setBusy(false);}}
  return <Screen tabBar={false}><Header title="Rücknahmestelle" subtitle="Für freigegebenes Personal" color={C.reuse}/>
    {!!error&&<Text accessibilityRole="alert" style={[T.body,{color:C.danger,marginBottom:12}]}>{error}</Text>}
    {!ready?<Text>Lade…</Text>:!profile?<TrustAccount color={C.reuse} onReady={()=>void load()}/>:!profile.merchantStores.length?<Card><Text style={T.h2}>Noch keine Rücknahmestelle freigegeben</Text><Text style={T.body}>Die Betreiber müssen dieses Konto einer Rücknahmestelle zuordnen. Endnutzer können sich diese Berechtigung nicht selbst geben.</Text></Card>:<View style={{gap:12}}>
      <Row style={{flexWrap:'wrap'}}>{profile.merchantStores.map(s=><Pill key={s.id} label={s.name} color={C.reuse} active={s.id===store} onPress={()=>{setStore(s.id);setLoan(null);setReceipt(null);}}/>)}</Row>
      <Card style={{gap:12}}><Text style={T.h2}>1. Behälter entgegennehmen</Text><Text style={T.body}>Code auf dem Behälter eingeben oder mit einem angeschlossenen Scanner einlesen. Den Behälter und eventuelle Schäden prüfen.</Text>
        <TextInput accessibilityLabel="Behältercode an der Rücknahmestelle" placeholder="Code auf Becher oder Schale" value={code} onChangeText={v=>{setCode(v);setLoan(null);setReceipt(null);}} autoCapitalize="characters" style={{padding:14,backgroundColor:C.bg,borderRadius:12,fontSize:16}}/>
        <Button label="Behälter prüfen" color={C.reuse} disabled={busy||!code.trim()} onPress={()=>void run(async()=>{const parsed=parseContainerCode(code);if(!parsed)throw new Error('Kein gültiger Behältercode.');setLoan(await reuseTrust.inspect(parsed.code,store));setReceipt(null);})}/>
      </Card>
      {loan&&<Card style={{gap:12}}><Text style={T.h2}>2. Annahme bestätigen</Text><Text style={T.h3}>{loan.kind==='cup'?'Becher':'Schale'} {loan.code}</Text>{loan.damage?<><Tag label="Schaden gemeldet" color={C.warn}/><Text style={T.body}>{DAMAGE[loan.damage.reason]}{loan.damage.note?` · ${loan.damage.note}`:''}</Text><Text style={T.small}>Beschädigten Behälter getrennt halten und nach euren Rücknahmeregeln behandeln.</Text></>:<Text style={T.small}>Kein Schaden in Mainsam gemeldet.</Text>}
        <Button label="Behälter ist hier · Rückgabe-QR ausstellen" color={C.reuse} disabled={busy} onPress={()=>void run(async()=>setReceipt(await reuseTrust.receipt(loan.id,store)))}/>
      </Card>}
      {receipt&&<><ProofCode proof={receipt.proof} expiresAt={receipt.expiresAt} label={`Rückgabe ${receipt.loan.code} · ${receipt.storeName}`}/><Text style={T.body}>Die abgebende Person scannt diesen Code in ihrer Rückgabe. Er passt nur zu diesem Behälter und verfällt nach drei Minuten.</Text><Button label="Nächster Behälter" variant="soft" color={C.reuse} onPress={()=>{setCode('');setLoan(null);setReceipt(null);}}/></>}
      <Text style={T.small}>Dieser Beleg bestätigt die Rücknahme in Mainsam. Eine Verbindung zum geschützten Vytal-Händlerkonto ist noch nicht eingerichtet.</Text>
    </View>}
  </Screen>;
}
