import { useT, useLocalize } from '@/i18n/useT';
import React, { useEffect, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { trust, reuseTrust, type Handoff, type ReuseLoan, type ShelfAction } from '@/api/trust';
import { cancelReturnReminder } from '@/api/notify';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { C } from '@/theme';
import { FEE_LATE, fmtDue, fmtFee, loanStatus } from '@/engine/loan';
import { Header, Screen } from './Screen';
import { Button, Card, FeeText, T, haptic } from './ui';
import { syncReuse } from './ReuseInventory';
import TrustAccount from './TrustAccount';

/** Dedicated, single-purpose scanner. Codes are data; only the server can accept a receipt. */
export default function ProofScanner({kind,id}:{kind:'food'|'return'|'shelf';id:string}) {
  const t = useT();
  const localize = useLocalize();
  const router=useRouter(),color=kind==='return'?C.reuse:C.food;
  const [signed,setSigned]=useState<boolean|null>(null),[handoff,setHandoff]=useState<Handoff|null>(null),[loan,setLoan]=useState<ReuseLoan|null>(null);
  const [shelf,setShelf]=useState<ShelfAction|null>(null);
  const [raw,setRaw]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState('');
  const [permission,requestPermission]=useCameraPermissions();
  const proof=raw.trim();
  const valid=/^\d{4}$/.test(proof)||new RegExp(`^mainsam:${kind}:[a-f0-9-]{36}:[a-f0-9]{48}$`).test(proof);
  async function load(){setError('');try{const has=await trust.hasSession();setSigned(has);if(!has)return;
    if(kind==='food'){const h=(await trust.handoffs()).find(h=>h.id===id&&h.role==='receiver');if(!h)throw new Error(t('components.scanner.pickupMissing'));setHandoff(h);}
    else if(kind==='shelf'){const r=(await trust.shelfActions()).find(r=>r.id===id&&!r.mine);if(!r)throw new Error('Bitte die passende Regalmeldung öffnen.');setShelf(r);}
    else {const l=(await reuseTrust.loans()).find(l=>l.id===id);if(!l)throw new Error(t('components.scanner.loanMissing'));setLoan(l);}
  }catch(e:any){setError(e.message);if(e.status===401)setSigned(false);}}
  useEffect(()=>{useUI.getState().setCtx(kind==='return'?'reuse':'food');void load();},[kind,id]);
  async function complete(){if(busy||!valid)return;setBusy(true);setError('');try{
    if(kind==='food'){
      const result=await trust.confirmTicket(id,proof);
      const me=await trust.me();useStore.getState().syncFoodAwards(me.awards);
      setDone(t('updates.foodSuccess'));
      const a=me.awards.find(a=>a.key===`trust:${id}:${me.user.id}`);if(a)useUI.getState().showToast(a);
    }else if(kind==='shelf'){const result=await trust.confirmShelf(id,proof);setDone(`${result.pointName}: Aktion bestätigt. Die meldende Person sieht ihren Beleg.`);
    }else{
      const result=await reuseTrust.complete(id,proof);await syncReuse();await cancelReturnReminder(id);
      const st=loanStatus(result.loan.borrowedAt,result.loan.returnedAt);
      setDone(`${t('components.scanner.returnDone', { code: result.loan.code, store: result.loan.returnStoreName ?? '' })} ${st.hint}${result.loan.demo ? ` ${t('components.scanner.demo')}` : ''}`);
      const a=result.awards.find(a=>a.key===`trust:reuse:${id}:reuse.return`);if(a&&!result.duplicate)useUI.getState().showToast(a);
    }
    haptic('success');
  }catch(e:any){setError(e.message);}finally{setBusy(false);}}
  return <Screen tabBar={false}><Header title={kind==='food'?t('components.scanner.pickupTitle'):kind==='shelf'?'Regalmeldung bestätigen':t('components.scanner.returnTitle')} subtitle={kind==='food'?t('updates.foodScanHint'):kind==='shelf'?'QR scannen oder vier Ziffern eingeben':t('components.scanner.returnSub')} color={color}/>
    {!!error&&<View style={{gap:8,marginBottom:12}}><Text accessibilityRole="alert" style={[T.body,{color:C.danger}]}>{localize(error)}</Text>{!(kind==='food'?handoff:kind==='shelf'?shelf:loan)&&<Button label={t('components.common.reload')} variant="soft" onPress={()=>void load()}/>}</View>}
    {signed===null?<Text style={T.body}>{t('components.scanner.loading')}</Text>:!signed?<TrustAccount color={color} onReady={()=>void load()}/>:done?<Card style={{gap:12}}><Text style={T.h2}>{t('components.common.confirmed')}</Text><Text style={T.body}>{done}</Text><Button label={t('common.done')} color={color} onPress={()=>router.replace(kind==='food'?'/uebergaben?mine=1':kind==='shelf'?'/uebergaben':'/mehrweg')}/></Card>:<View style={{gap:14}}>
      <Card style={{gap:8}}><Text style={T.h2}>{kind==='food'?t('components.scanner.pickup', { name: handoff?.counterpart.name || t('components.common.loading') }):kind==='shelf'?`${shelf?.pointName||'…'} · ${shelf?.name||''}`:`${loan?.kind==='cup'?t('components.common.cup'):t('components.common.bowl')} ${loan?.code||'…'}`}</Text><Text style={T.body}>{kind==='food'?handoff?.offer.items.map(i=>`${i.qty} ${i.name}`).join(' · '):kind==='shelf'?`${shelf?.kind==='stock'?'Eingestellt':shelf?.kind==='pickup'?'Mitgenommen':'Regal gemeldet'}: ${shelf?.items.map(i=>`${i.qty} ${i.name}`).join(' · ')||'Regalstand'}`:t('components.scanner.instructions')}</Text>{kind==='return'&&!!loan&&<FeeText text={`${loanStatus(loan.borrowedAt).label} · Frist ${fmtDue(loanStatus(loan.borrowedAt).dueAt)}${loanStatus(loan.borrowedAt).fee>0?` · ${fmtFee(loanStatus(loan.borrowedAt).fee)} offen, bei Rückgabe jetzt ${fmtFee(FEE_LATE)}`:''}`} style={[T.small,{color:loanStatus(loan.borrowedAt).fee>0?C.danger:C.muted}]} color={loanStatus(loan.borrowedAt).fee>0?C.danger:C.muted}/>}</Card>
      {valid?<Card style={{gap:12}}><Text style={T.h3}>{t('components.scanner.read')}</Text><Text style={T.body}>{kind==='food'?t('updates.foodReceived'):kind==='shelf'?'Hast du diese Aktion vor Ort tatsächlich beobachtet?':t('components.scanner.returnQuestion')}</Text><Button label={busy?t('components.scanner.checking'):kind==='food'?t('updates.foodReceived'):kind==='shelf'?'Vor Ort gesehen · bestätigen':t('components.scanner.returnFinish')} color={color} disabled={busy||(kind==='food'?!handoff:kind==='shelf'?!shelf:!loan)} onPress={()=>void complete()}/><Button label={t('components.scanner.other')} variant="ghost" disabled={busy} onPress={()=>{setRaw('');setError('');}}/></Card>:<>
        {Platform.OS!=='web'&&(permission?.granted?<View style={{height:280,borderRadius:22,overflow:'hidden'}}><CameraView style={{flex:1}} facing="back" barcodeScannerSettings={{barcodeTypes:['qr']}} onBarcodeScanned={e=>setRaw(e.data)}/></View>:<Button label={t('components.scanner.camera')} color={color} onPress={()=>void requestPermission()}/>)}
        <Card style={{gap:10}}><Text style={T.h3}>{t('components.scanner.manual')}</Text><Text style={T.small}>{t('components.scanner.manualHint')}</Text><TextInput accessibilityLabel={t('components.scanner.codeLabel')} placeholder="1234 oder mainsam:…" value={raw} onChangeText={setRaw} autoCapitalize="none" autoCorrect={false} maxLength={200} style={{padding:14,backgroundColor:C.bg,borderRadius:12,fontSize:16,color:C.ink}}/>{!!raw&&<Text style={[T.small,{color:C.warn}]}>{kind==='shelf'?'Bitte vier Ziffern oder den vollständigen persönlichen Meldecode verwenden.':t(kind === 'food' ? 'components.scanner.fullPickup' : 'components.scanner.fullReturn')}</Text>}</Card>
      </>}
    </View>}
  </Screen>;
}
