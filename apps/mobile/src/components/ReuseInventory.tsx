import { useT, useLocalize, useLocale } from '@/i18n/useT';
import React, { useCallback, useRef, useState } from 'react';
import { AppState, Linking, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { reuseTrust, trust, type ReuseLoan } from '@/api/trust';
import { useStore } from '@/store';
import { cancelReturnReminder } from '@/api/notify';
import { Button, Card, FeeText, Pill, Row, T, Tag } from './ui';
import TrustAccount from './TrustAccount';
import stores from '@/data/vytal-stores.json';
import { C } from '@/theme';
import { fmtDue, fmtFee, loanStatus, settleFee, LOAN_SOURCE, LOAN_TERMS, SETTLE_REASONS, type LoanState, type SettleReason } from '@/engine/loan';

/** Farbe je Leihstatus: gruen zurueck, gelb wird knapp, rot Frist verpasst. */
export const LOAN_COLOR:Record<LoanState,string>={offen:C.reuse,bald:C.warn,ueberfaellig:C.danger,zurueck:C.success,'zurueck-spaet':C.warn};
export const DAMAGE:Record<string,string>={cracked:'Riss oder Bruch',lid:'Deckel beschädigt / fehlt',leaking:'Undicht',other:'Anderer Schaden'};
export async function syncReuse() {
  const [loans,profile]=await Promise.all([reuseTrust.loans(),trust.me()]);
  useStore.getState().syncFoodAwards(profile.awards);
  useStore.getState().syncContainers(loans.map(l=>({code:l.code,kind:l.kind,storeId:l.storeId||'',storeName:l.storeName,borrowedAt:l.borrowedAt,returnedAt:l.returnedAt||undefined,txId:`trust:${l.id}`})));
  return {loans,profile};
}
export default function ReuseInventory({returnOnly=false}:{returnOnly?:boolean}) {
  const t = useT();
  const localize = useLocalize();
  const locale = useLocale();
  const router=useRouter();
  const params=useLocalSearchParams<{store?:string}>();
  const location=stores.find(s=>s.id===params.store);
  const [loans,setLoans]=useState<ReuseLoan[]>([]),[ready,setReady]=useState(false),[signed,setSigned]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[merchant,setMerchant]=useState(false);
  const running=useRef(false);
  const load=useCallback(async()=>{if(running.current)return;running.current=true;try{const has=await trust.hasSession();setSigned(has);if(!has)return;const r=await syncReuse();setLoans(r.loans);setMerchant(!!r.profile.merchantStores.length);setError('');}catch(e:any){setError(e.message);if(e.status===401)setSigned(false);}finally{setReady(true);running.current=false;}},[]);
  useFocusEffect(useCallback(()=>{void load();const timer=setInterval(()=>{if(AppState.currentState==='active')void load();},10000);return()=>clearInterval(timer);},[load]));
  const open=loans.filter(l=>!l.returnedAt&&!l.settlement),returned=loans.filter(l=>l.returnedAt&&!l.settlement),settled=loans.filter(l=>l.settlement);
  const overdue=open.filter(l=>loanStatus(l.borrowedAt).state==='ueberfaellig');
  const fees=overdue.reduce((sum,l)=>sum+loanStatus(l.borrowedAt).fee,0);
  const legacy=useStore(s=>s.containers).filter(c=>!c.txId.startsWith('trust:')&&!c.returnedAt&&!loans.some(l=>l.code===c.code));
  return <View style={{gap:12}}>
    {location&&<Card><Text style={T.h3}>{location.name}</Text><Text style={T.body}>Du hast den Restaurant-QR geöffnet. Gib deinen Behälter beim Personal ab; danach erhältst du den persönlichen Rückgabecode.</Text></Card>}
    <Card style={{backgroundColor:C.reuse,gap:8}}><Text style={[T.h2,{color:'#fff'}]}>{returnOnly?t('components.reuse.return'):t('components.reuse.count', { open: open.length, returned: returned.length })}</Text><Text style={[T.body,{color:'#fff'}]}>{t('components.reuse.hint')}</Text><FeeText text={LOAN_TERMS} style={[T.small,{color:'#fff'}]} color="#fff"/>{!!overdue.length&&<Text style={[T.body,{color:'#fff',fontWeight:'900'}]}>{overdue.length} überfällig · {fmtFee(fees)} Gebühr offen</Text>}</Card>
    {!!error&&<><Text accessibilityRole="alert" style={[T.body,{color:C.danger}]}>{localize(error)}</Text><Button label={t('components.common.reload')} variant="soft" onPress={()=>void load()}/></>}
    {!ready?<Text style={T.body}>{t('components.reuse.loading')}</Text>:!signed?<TrustAccount color={C.reuse} onReady={()=>void load()}/>:<>
      {!open.length&&<Card><Text style={T.body}>{t('components.reuse.empty')}</Text></Card>}
      {open.map(l=><LoanCard key={l.id} loan={l} onSaved={load}/>)}
      {!returnOnly&&<Button label={t('components.reuse.borrow')} icon="scan" color={C.reuse} onPress={()=>router.push('/scan?mode=vytal')}/>}
      {legacy.map(c=><Card key={c.txId} style={{gap:8}}><Text style={T.h3}>{t('components.reuse.legacy', { code: c.code })}</Text><Text style={T.small}>{t('components.reuse.legacyHint')}</Text><Button label={t('components.reuse.link')} color={C.reuse} variant="soft" disabled={busy} onPress={()=>{setBusy(true);void reuseTrust.borrow({code:c.code,kind:c.kind,storeId:c.storeId}).then(load).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}/></Card>)}
      {!!returned.length&&<><Text style={T.h3}>{t('components.reuse.receipts')}</Text>{returned.slice(0,5).map(l=><Card key={l.id} style={{gap:5}}><Text style={T.h3}>{l.code}</Text><Row style={{flexWrap:'wrap'}}><Tag label={l.demo?t('components.reuse.demo'):t('components.reuse.confirmed')} color={C.reuse}/><Tag label={loanStatus(l.borrowedAt,l.returnedAt).label} color={LOAN_COLOR[loanStatus(l.borrowedAt,l.returnedAt).state]}/></Row>{loanStatus(l.borrowedAt,l.returnedAt).fee>0&&<FeeText text={`${fmtFee(loanStatus(l.borrowedAt,l.returnedAt).fee)} Verspätungsgebühr · ${LOAN_SOURCE}`} style={[T.small,{color:C.warn,fontWeight:'800'}]} color={C.warn}/>}<Text style={T.small}>{l.returnStoreName} · {new Date(l.returnedAt!).toLocaleString(locale)}</Text>{l.damage&&<Text style={T.small}>{t('components.reuse.withDamage', { damage: localize(DAMAGE[l.damage.reason] ?? l.damage.reason) })}</Text>}</Card>)}</>}
      {!!settled.length&&<><Text style={T.h3}>Bezahlte Verluste und Schäden</Text>{settled.slice(0,5).map(l=><Card key={l.id} style={{gap:5}}><Text style={T.h3}>{l.kind==='cup'?t('components.common.cup'):t('components.common.bowl')} {l.code}</Text><Tag label={SETTLE_REASONS[l.settlement!.reason]} color={C.warn}/><FeeText text={`${fmtFee(l.settlement!.amount)} bezahlt · ${l.settlement!.method}`} style={T.body}/><Text style={T.small}>{new Date(l.settlement!.at).toLocaleString(locale)} · Beleg {l.settlement!.reference}</Text><Text style={T.small}>Demo-Buchung ohne echten Zahlungsvorgang. Die Abrechnung läuft über dein Vytal-Konto.</Text></Card>)}</>}
      {merchant&&<Button label={t('components.reuse.merchant')} color={C.reuse} variant="soft" onPress={()=>router.push('/ruecknahmestelle')}/>}
    </>}
  </View>;
}
function LoanCard({loan:l,onSaved}:{loan:ReuseLoan;onSaved:()=>Promise<void>}) {
  const t = useT();
  const localize = useLocalize();
  const router=useRouter();const [form,setForm]=useState(false),[reason,setReason]=useState(l.damage?.reason||'cracked'),[note,setNote]=useState(l.damage?.note||''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [pay,setPay]=useState(false),[payReason,setPayReason]=useState<SettleReason>('lost');
  const method=useStore(s=>s.paymentMethod)||'Keine';const fee=settleFee(payReason);
  const st=loanStatus(l.borrowedAt);const col=LOAN_COLOR[st.state];
  return <Card style={{gap:10,borderLeftWidth:4,borderLeftColor:l.damage?C.warn:col}}>
    <Row><Text style={[T.h3,{flex:1}]}>{l.kind==='cup'?t('components.common.cup'):t('components.common.bowl')} {l.code}</Text><Tag label={st.label} color={col}/></Row>
    <Text style={T.small}>{l.storeName} · Rückgabe bis {fmtDue(st.dueAt)}</Text>
    {st.fee>0&&<FeeText text={`${fmtFee(st.fee)} Behältergebühr offen`} style={[T.body,{color:col,fontWeight:'900'}]} color={col}/>}
    <FeeText text={st.hint} style={T.small}/>
    {l.demo&&<Tag label={t('components.reuse.demoContainer')} color={C.muted}/>}
    {l.damage&&<><Tag label={t('components.reuse.damageReported', { damage: localize(DAMAGE[l.damage.reason] ?? l.damage.reason) })} color={C.warn}/><Text style={T.small}>{t('components.reuse.damageHint')}</Text></>}
    <Text style={T.small}>{LOAN_SOURCE}</Text>
    <Button label={t('components.scanner.returnTitle')} icon="qr-code" color={C.reuse} onPress={()=>router.push({pathname:'/scan',params:{mode:'vytal-return',id:l.id}})}/>
    <Button label={pay?'Meldung schließen':'Verloren oder kaputt · Gebühr zahlen'} icon="card" color={C.warn} variant="soft" onPress={()=>{setPay(!pay);setForm(false);setError('');}}/>
    {pay&&<View style={{gap:10}}>
      <Text style={T.body}>Kommt dieser Behälter nicht mehr zurück? Melde ihn und begleiche die Gebühr direkt, dann ist die Ausleihe abgeschlossen.</Text>
      <Row style={{flexWrap:'wrap'}}>{(Object.keys(SETTLE_REASONS) as SettleReason[]).map(id=><Pill key={id} label={SETTLE_REASONS[id]} active={payReason===id} color={C.warn} onPress={()=>setPayReason(id)}/>)}</Row>
      <FeeText text={`${fmtFee(fee)} Behältergebühr · Zahlungsart: ${method==='Keine'?'noch keine hinterlegt':method}`} style={T.body} color={C.warn}/>
      <Text style={T.small}>Demo-Buchung: Mainsam bewegt kein Geld und speichert keine Kartendaten. Der Beleg zeigt, was über dein Vytal-Konto abgerechnet würde. Ist der Behälter noch da, ist die Rückgabe immer günstiger.</Text>
      {method==='Keine'
        ?<Button label="Zahlungsart hinterlegen" color={C.warn} variant="soft" onPress={()=>router.push('/daten')}/>
        :<Button label={busy?'Buche…':`${fmtFee(fee)} jetzt bezahlen`} color={C.warn} disabled={busy} onPress={()=>{setBusy(true);setError('');void reuseTrust.settle(l.id,payReason,method).then(async()=>{await cancelReturnReminder(l.id);await onSaved();setPay(false);}).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}/>}
    </View>}
    <Button label={form?t('components.reuse.damageClose'):l.damage?t('components.reuse.damageView'):t('components.reuse.damageReport')} color={C.muted} variant="ghost" onPress={()=>{setForm(!form);setPay(false);}}/>
    {form&&<View style={{gap:10}}><Button label={t('components.reuse.help')} variant="ghost" color={C.reuse} onPress={()=>void Linking.openURL('https://www.vytal.org/de/faq/return')}/><Text style={T.body}>{t('components.reuse.damageQuestion')}</Text><Row style={{flexWrap:'wrap'}}>{Object.entries(DAMAGE).map(([id,label])=><Pill key={id} label={localize(label)} active={reason===id} color={C.warn} onPress={()=>setReason(id)}/>)}</Row><TextInput accessibilityLabel={t('components.reuse.damageDescription')} placeholder={t('components.reuse.damageOptional')} multiline maxLength={300} value={note} onChangeText={setNote} style={{padding:12,backgroundColor:C.bg,borderRadius:12,fontSize:16}}/>{!!error&&<Text accessibilityRole="alert" style={{color:C.danger}}>{localize(error)}</Text>}<Button label={busy?t('components.common.saving'):t('components.reuse.damageSave')} disabled={busy} color={C.reuse} onPress={()=>{setBusy(true);setError('');void reuseTrust.damage(l.id,reason,note).then(async()=>{await onSaved();setForm(false);}).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}/></View>}
  </Card>;
}
