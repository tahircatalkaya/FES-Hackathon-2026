import React, { useEffect, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { trust, reuseTrust, type Handoff, type ReuseLoan } from '@/api/trust';
import { cancelReturnReminder } from '@/api/notify';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { C } from '@/theme';
import { Header, Screen } from './Screen';
import { Button, Card, T, haptic } from './ui';
import { syncReuse } from './ReuseInventory';
import TrustAccount from './TrustAccount';

/** Dedicated, single-purpose scanner. Codes are data; only the server can accept a receipt. */
export default function ProofScanner({kind,id}:{kind:'food'|'return';id:string}) {
  const router=useRouter(),color=kind==='food'?C.food:C.reuse;
  const [signed,setSigned]=useState<boolean|null>(null),[handoff,setHandoff]=useState<Handoff|null>(null),[loan,setLoan]=useState<ReuseLoan|null>(null);
  const [raw,setRaw]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState('');
  const [permission,requestPermission]=useCameraPermissions();
  const proof=raw.trim();
  const valid=new RegExp(`^mainsam:${kind}:[a-f0-9-]{36}:[a-f0-9]{48}$`).test(proof);
  async function load(){setError('');try{const has=await trust.hasSession();setSigned(has);if(!has)return;
    if(kind==='food'){const h=(await trust.handoffs()).find(h=>h.id===id&&h.role==='provider');if(!h)throw new Error('Bitte die passende Abholung öffnen.');setHandoff(h);}
    else {const l=(await reuseTrust.loans()).find(l=>l.id===id);if(!l)throw new Error('Bitte deinen offenen Behälter auswählen.');setLoan(l);}
  }catch(e:any){setError(e.message);if(e.status===401)setSigned(false);}}
  useEffect(()=>{useUI.getState().setCtx(kind==='food'?'food':'reuse');void load();},[kind,id]);
  async function complete(){if(busy||!valid)return;setBusy(true);setError('');try{
    if(kind==='food'){
      const result=await trust.confirmTicket(id,proof);
      const me=await trust.me();useStore.getState().syncFoodAwards(me.awards);
      setDone(`Übergabe an ${result.counterpart.name} bestätigt. Ihr könnt jetzt eure Erfahrung bewerten.`);
      const a=me.awards.find(a=>a.key===`trust:${id}:${me.user.id}`);if(a)useUI.getState().showToast(a);
    }else{
      const result=await reuseTrust.complete(id,proof);await syncReuse();await cancelReturnReminder(id);
      setDone(`${result.loan.code}: Rücknahme bei ${result.loan.returnStoreName} bestätigt.${result.loan.demo?' Demo ohne Punkte.':''}`);
      const a=result.awards.find(a=>a.key===`trust:reuse:${id}:reuse.return`);if(a&&!result.duplicate)useUI.getState().showToast(a);
    }
    haptic('success');
  }catch(e:any){setError(e.message);}finally{setBusy(false);}}
  return <Screen tabBar={false}><Header title={kind==='food'?'Abholcode scannen':'Rückgabe-QR scannen'} subtitle={kind==='food'?'Vom Handy der abholenden Person':'Frischer Code vom Personal'} color={color}/>
    {!!error&&<View style={{gap:8,marginBottom:12}}><Text accessibilityRole="alert" style={[T.body,{color:C.danger}]}>{error}</Text>{!(kind==='food'?handoff:loan)&&<Button label="Erneut laden" variant="soft" onPress={()=>void load()}/>}</View>}
    {signed===null?<Text style={T.body}>Lade Zugang…</Text>:!signed?<TrustAccount color={color} onReady={()=>void load()}/>:done?<Card style={{gap:12}}><Text style={T.h2}>Bestätigt</Text><Text style={T.body}>{done}</Text><Button label="Fertig" color={color} onPress={()=>router.replace(kind==='food'?'/uebergaben?mine=1':'/mehrweg')}/></Card>:<View style={{gap:14}}>
      <Card style={{gap:8}}><Text style={T.h2}>{kind==='food'?`Abholung: ${handoff?.counterpart.name||'Lade…'}`:`${loan?.kind==='cup'?'Becher':'Schale'} ${loan?.code||'…'}`}</Text><Text style={T.body}>{kind==='food'?handoff?.offer.items.map(i=>`${i.qty} ${i.name}`).join(' · '):'Gib den Behälter beim Personal ab. Scanne danach den persönlichen QR-Beleg, nicht den Aufkleber auf dem Behälter.'}</Text></Card>
      {valid?<Card style={{gap:12}}><Text style={T.h3}>Code gelesen</Text><Text style={T.body}>{kind==='food'?'Hast du die vereinbarte Portion übergeben?':'Hast du diesen Behälter beim Personal abgegeben?'}</Text><Button label={busy?'Prüfe Beleg…':kind==='food'?'Portion übergeben · abschließen':'Abgegeben · Beleg prüfen'} color={color} disabled={busy||(kind==='food'?!handoff:!loan)} onPress={()=>void complete()}/><Button label="Anderen Code scannen" variant="ghost" disabled={busy} onPress={()=>{setRaw('');setError('');}}/></Card>:<>
        {Platform.OS!=='web'&&(permission?.granted?<View style={{height:280,borderRadius:22,overflow:'hidden'}}><CameraView style={{flex:1}} facing="back" barcodeScannerSettings={{barcodeTypes:['qr']}} onBarcodeScanned={e=>setRaw(e.data)}/></View>:<Button label="Kamera zum Scannen freigeben" color={color} onPress={()=>void requestPermission()}/>)}
        <Card style={{gap:10}}><Text style={T.h3}>Ohne Kamera: Textcode eingeben</Text><Text style={T.small}>Die andere Person kann denselben Code als Text anzeigen. Ein vollständiger Code wird direkt erkannt.</Text><TextInput accessibilityLabel="QR- oder Textcode" placeholder="mainsam:…" value={raw} onChangeText={setRaw} autoCapitalize="none" autoCorrect={false} maxLength={200} style={{padding:14,backgroundColor:C.bg,borderRadius:12,fontSize:16,color:C.ink}}/>{!!raw&&<Text style={[T.small,{color:C.warn}]}>Bitte den vollständigen persönlichen {kind==='food'?'Abholcode':'Rückgabebeleg'} verwenden.</Text>}</Card>
      </>}
    </View>}
  </Screen>;
}
