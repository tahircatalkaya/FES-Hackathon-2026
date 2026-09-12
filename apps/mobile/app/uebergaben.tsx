import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header, Screen } from '@/components/Screen';
import { Button, Card, Divider, Pill, Row, T, Tag } from '@/components/ui';
import FoodsharingLogo from '@/components/FoodsharingLogo';
import { DISTRICTS } from '@/data/mock';
import ProofCode from '@/components/ProofCode';
import Reputation from '@/components/Reputation';
import { FoodActionSheet, type ActionResult } from '@/components/FoodActionSheet';
import { trust, type Handoff, type TrustOffer, type TrustProfile } from '@/api/trust';
import { useStore } from '@/store';
import { C, CONTEXT } from '@/theme';

const col = CONTEXT.food.color;
const field = { backgroundColor: C.bg, borderRadius: 12, padding: 13, fontSize: 16, color: C.ink };
const time = (n: number) => new Date(n).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const STATUS = { pending: 'Zusage ausstehend', accepted: 'Abholung zugesagt', received: 'Empfang bestätigt', completed: 'Beidseitig bestätigt', cancelled: 'Abgesagt', expired: 'Zeitfenster abgelaufen', disputed: 'Abschluss ungeklärt' };
const CONCERNS: Record<string,string> = { no_show: 'Nicht erschienen', early: 'Unangekündigt zu früh erschienen', took_more: 'Mehr als vereinbart mitgenommen', disrespect: 'Respektloses Verhalten' };

export default function Handoffs() {
  const params = useLocalSearchParams<{ create?: string; area?: string; mine?: string }>();
  const sync = useStore(s => s.syncFoodAwards);
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [offers, setOffers] = useState<TrustOffer[]>([]), [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [register, setRegister] = useState(false), [name, setName] = useState(''), [password, setPassword] = useState('');
  const [tab, setTab] = useState<'offers'|'mine'|'create'>(params.create ? 'create' : params.mine ? 'mine' : 'offers');
  const [filterArea,setFilterArea]=useState(params.area||'Alle');
  const [selectedSlots,setSelectedSlots]=useState<Record<string,number>>({});
  const noticed=useRef<Record<string,string>|null>(null);
  const running = useRef(false), mutation = useRef(false);
  const load = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      if (!await trust.hasSession()) { setProfile(null); return; }
      const [me, list, mine] = await Promise.all([trust.me(), trust.offers(), trust.handoffs()]);
      if(noticed.current) for(const h of mine) if(noticed.current[h.id] && noticed.current[h.id]!==h.status) useStore.getState().notify({title:STATUS[h.status],body:`${h.offer.title} · ${h.counterpart.name}`,ctx:'food'});
      noticed.current=Object.fromEntries(mine.map(h=>[h.id,h.status]));
      setProfile(me); setOffers(list); setHandoffs(mine); sync(me.awards); setError('');
    } catch (e: any) { if (e.status === 401) { setProfile(null); sync([]); } setError(e.message); }
    finally { running.current = false; setReady(true); }
  }, [sync]);
  useFocusEffect(useCallback(() => { void load(); const timer = setInterval(() => { if (AppState.currentState === 'active' && !mutation.current) void load(); }, 10_000); return () => clearInterval(timer); }, [load]));
  async function perform(action: () => Promise<unknown>) {
    if (mutation.current) return;
    mutation.current = true; setBusy(true); setError('');
    try { await action(); await load(); }
    catch (e: any) { setError(e.message); if (e.status === 401) { setProfile(null); sync([]); } }
    finally { setBusy(false); mutation.current = false; }
  }
  return <Screen tabBar={false} refreshControl={<RefreshControl refreshing={busy} onRefresh={() => void load()} tintColor={col} />}>
    <Header title="Übergaben" right={<FoodsharingLogo width={76} />} />
    <Card style={{ backgroundColor: '#EAF3E6', marginBottom: 16 }}>
      <Row style={{ gap: 10 }}><Ionicons name="shield-checkmark-outline" size={30} color={col} /><Text style={[T.h2, { flex: 1 }]}>Gutes Essen. Faire Abholung.</Text></Row>
      <Text style={[T.body, { marginTop: 8 }]}>Sieh, was noch da ist. Wähle deine Portion und einen Abholtermin. Vor Ort zeigt die abholende Person ihren QR-Code – die verteilende Person scannt und übergibt.</Text>
    </Card>
    {!!error && <Text accessibilityRole="alert" style={[T.body, { color: C.danger, marginBottom: 12 }]}>{error}</Text>}
    {!ready ? <Text style={T.body}>Lade deine Übergaben…</Text> : !profile ? <Card style={{ gap: 12 }}>
      <Text style={T.h2}>{register ? 'Zugang anlegen' : 'Für Übergaben anmelden'}</Text>
      <Text style={T.body}>Ein eigener Zugang schützt Zusagen und Bewertungen. Dein öffentlicher Name genügt; E-Mail und Telefonnummer sind nicht nötig.</Text>
      <TextInput accessibilityLabel="Benutzername für Übergaben" placeholder="Benutzername" value={name} onChangeText={setName} autoCapitalize="none" autoCorrect={false} maxLength={24} style={field} />
      <TextInput accessibilityLabel="Passwort für Übergaben" placeholder="Passwort · mindestens 10 Zeichen" secureTextEntry value={password} onChangeText={setPassword} autoCapitalize="none" autoCorrect={false} maxLength={128} style={field} />
      <Button label={busy ? 'Verbinde…' : register ? 'Zugang anlegen' : 'Anmelden'} color={col} disabled={busy || name.trim().length < 3 || password.length < 10} onPress={() => void perform(async () => { await trust.login(name.trim(), password, register); setPassword(''); })} />
      <Button label={register ? 'Ich habe schon einen Zugang' : 'Neuen Zugang anlegen'} color={col} variant="ghost" disabled={busy} onPress={() => setRegister(!register)} />
      <Text style={T.small}>Bitte dein Passwort aufbewahren. Eine Wiederherstellung per E-Mail ist nicht eingerichtet.</Text>
    </Card> : <>
      <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}><Text style={T.h3}>{profile.user.name}</Text><Pressable accessibilityRole="button" onPress={() => void perform(async () => { await trust.logout(); setProfile(null); setOffers([]); setHandoffs([]); sync([]); useStore.getState().syncContainers([]); })}><Text style={{ color: col, fontWeight: '700' }}>Abmelden</Text></Pressable></Row>
      <Reputation data={profile.reputation} />
      <Row style={{ gap: 7, marginVertical: 16, flexWrap: 'wrap' }}>{([['offers','Angebote'],['mine','Meine Übergaben'],['create','Anbieten']] as const).map(([id,label]) => <Pill key={id} label={label} color={col} active={tab===id} onPress={() => setTab(id)} />)}</Row>
      {tab === 'create' ? <OfferForm area={params.area} busy={busy} onCreate={draft => perform(async () => { await trust.distribution(draft); setTab('offers'); })} /> : tab === 'offers' ? <View style={{ gap: 12 }}>
        {!offers.length && <Card><Text style={T.body}>Noch keine Angebote. Erfasse die erste Portion per Foto, Audio oder Texteingabe.</Text></Card>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>{['Alle',...Array.from(new Set(offers.map(o=>o.area)))].map(area=><Pill key={area} label={area} active={filterArea===area} color={col} onPress={()=>setFilterArea(area)}/>)}</ScrollView>
        {offers.filter(o=>filterArea==='Alle'||o.area===filterArea).map(o => <Card key={o.id} style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}><Text style={[T.h3,{flex:1}]}>{o.title}</Text><Tag label={o.remaining?`${o.remaining} von ${o.portions} frei`:'Alles vergeben'} color={col} /></Row>
          <Text style={T.small}>{o.area} · {time(o.startsAt)}–{new Date(o.endsAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</Text>
          <Text style={T.body}>{o.items.map(i => `${i.qty} ${i.name}`).join(' · ')}</Text>
          <Text style={T.small}>Eine Portion je Person und Angebot. Reservierte Portionen sind bereits abgezogen.</Text>
          <Divider /><Text style={T.h3}>{o.ownerId === profile.user.id ? 'Dein Angebot' : o.ownerName}</Text><Reputation data={o.reputation} />
          {o.ownerId !== profile.user.id && <>
            {o.remaining>0 && !!o.slots?.length && <><Text style={T.h3}>Dein Abholtermin</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{o.slots.filter(slot=>slot.available).map(slot=><Pill key={slot.startsAt} label={new Date(slot.startsAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} color={col} active={selectedSlots[o.id]===slot.startsAt} onPress={()=>setSelectedSlots({...selectedSlots,[o.id]:slot.startsAt})}/>)}</ScrollView></>}
            <Button label={o.remaining?'Portion & Termin anfragen':'Alles vergeben'} color={col} disabled={busy || o.remaining < 1 || o.endsAt < Date.now() || (!!o.slots?.length&&!o.slots.some(slot=>slot.available&&slot.startsAt===selectedSlots[o.id]))} onPress={() => void perform(async () => { await trust.request(o.id,selectedSlots[o.id]); setTab('mine'); })}/>
            <Text style={T.small}>15 Minuten bis zur Zusage reserviert. Die genaue Adresse erscheint nach Zusage kurz vor deinem Termin.</Text>
          </>}
          {o.ownerId === profile.user.id && <Button label="Anfragen ansehen" color={col} variant="soft" onPress={() => setTab('mine')} />}
        </Card>)}
      </View> : <View style={{ gap: 14 }}>
        {!handoffs.length && <Card><Text style={T.body}>Hier erscheinen deine Anfragen und Zusagen. Niemand wird automatisch angenommen.</Text></Card>}
        {handoffs.map(h => <HandoffCard key={h.id} h={h} busy={busy} perform={perform} />)}
      </View>}
    </>}
  </Screen>;
}

type Draft = Parameters<typeof trust.distribution>[0];
function OfferForm({ area: initialArea, busy, onCreate }: { area?: string; busy: boolean; onCreate: (draft: Draft) => Promise<void> }) {
  const [title,setTitle]=useState(''), [area,setArea]=useState(DISTRICTS.some(d=>d.name===initialArea)?initialArea!:useStore.getState().district), [address,setAddress]=useState('');
  const [portion,setPortion]=useState(1), [delay,setDelay]=useState(30), [sheet,setSheet]=useState(false), [capture,setCapture]=useState<ActionResult|null>(null);
  const [separate,setSeparate]=useState(true),[counts,setCounts]=useState<Record<number,number>>({});
  const requestKey = useRef(`offer-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const requestTime=useRef<number|null>(null);
  return <Card style={{ gap: 12 }}>
    <Text style={T.h2}>Was hast du heute gerettet?</Text>
    <Text style={T.body}>Einmal fotografieren, einsprechen oder eintippen. Gib pro Posten die Menge für eine Abholung an; danach stellst du ein, wie oft sie verfügbar ist.</Text>
    <TextInput accessibilityLabel="Titel des Angebots" placeholder="z. B. Backwaren von heute" value={title} onChangeText={setTitle} maxLength={80} style={field} />
    <Button label={capture ? `${capture.items.length} Posten · Lebensmittel bearbeiten` : 'Foto, Audio oder Texteingabe'} icon="camera" color={col} variant="soft" onPress={() => setSheet(true)} />
    {capture && <>
      <Row style={{flexWrap:'wrap'}}><Pill label="Posten einzeln anbieten" active={separate} color={col} onPress={()=>setSeparate(true)}/><Pill label="Gemischte Tüten" active={!separate} color={col} onPress={()=>setSeparate(false)}/></Row>
      {capture.items.map((item,i)=><View key={i} style={{gap:6,padding:12,backgroundColor:C.bg,borderRadius:12}}><Text style={T.h3}>{item.name}</Text><Text style={T.body}>{item.qty} pro Abholung · Gewicht geschätzt</Text>{separate&&<Row><Text style={[T.small,{flex:1}]}>So viele Portionen verfügbar:</Text><TextInput accessibilityLabel={`Verfügbare Portionen ${item.name}`} value={String(counts[i]??1)} onChangeText={v=>setCounts({...counts,[i]:Math.max(0,Math.min(20,Number(v.replace(/\D/g,''))||0))})} keyboardType="number-pad" maxLength={2} style={[field,{width:65,backgroundColor:'#fff'}]}/></Row>}</View>)}
      {!separate&&<><Text style={T.h3}>Wie viele gleiche Tüten?</Text><Row style={{flexWrap:'wrap'}}>{[1,2,3,4,6,10].map(n=><Pill key={n} label={String(n)} color={col} active={portion===n} onPress={()=>setPortion(n)}/>)}</Row></>}
    </>}
    <Text style={T.h3}>Dein Stadtteil · öffentlich</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{DISTRICTS.map(d=><Pill key={d.name} label={d.name} color={col} active={area===d.name} onPress={()=>setArea(d.name)}/>)}</ScrollView>
    <TextInput accessibilityLabel="Privater Treffpunkt" placeholder="Genauer Treffpunkt · nur nach Zusage" value={address} onChangeText={setAddress} maxLength={200} style={field} />
    <Text style={T.small}>Auf der Karte erscheint nur der Stadtteil. Die Adresse bleibt bis 15 Minuten vor dem zugesagten Termin verborgen.</Text>
    <Text style={T.h3}>Wann verteilst du?</Text><Row style={{ gap: 6, flexWrap:'wrap' }}>{[0,30,60].map(n=><Pill key={n} label={n ? `In ${n} Minuten` : 'Ab jetzt'} color={col} active={delay===n} onPress={()=>setDelay(n)} />)}</Row>
    <Text style={T.body}>Zwei Stunden mit Abholterminen alle fünf Minuten. Pro Termin eine Person, auch über mehrere Lebensmittelposten hinweg.</Text>
    <Button label={busy ? 'Speichere…' : 'Verteilung veröffentlichen'} color={col} disabled={busy || !capture?.items.length || !title.trim() || !address.trim() || (separate&&capture.items.some((_,i)=>(counts[i]??1)<1))} onPress={() => { const startsAt = requestTime.current ?? (requestTime.current=Date.now()+delay*60000); void onCreate({ title, area, address, lots:separate?capture!.items.map((item,i)=>({items:[item],portions:counts[i]??1})):[{items:capture!.items,portions:portion}], startsAt, endsAt:startsAt+7200000, requestKey:requestKey.current }); }} />
    <Text style={T.small}>Punkte erst nach Übergabe. Foto und Audio helfen beim Eintragen. Eine Freigabe für Betriebsabholungen erteilt weiterhin foodsharing.</Text>
    <FoodActionSheet open={sheet} mode="stock" onClose={()=>setSheet(false)} onDone={setCapture} color={col} />
  </Card>;
}
function HandoffCard({h,busy,perform}:{h:Handoff;busy:boolean;perform:(action:()=>Promise<unknown>)=>Promise<void>}) {
  const router=useRouter();
  const [issued,setIssued]=useState<{proof:string;expiresAt:number}|null>(null);
  const [review,setReview]=useState(false), [concern,setConcern]=useState(false);
  const [scores,setScores]=useState<Record<string,number>>({});
  const [clock,setClock]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{setIssued(null);},[h.status]);
  const provider=h.role==='provider';
  const act=(action:Parameters<typeof trust.action>[1],data?:object)=>void perform(()=>trust.action(h.id,action,data));
  return <Card style={{ gap: 10, borderLeftWidth:4,borderLeftColor:h.status==='completed'?col:C.line }}>
    <Tag label={STATUS[h.status]} color={h.status==='completed'?col:C.muted}/>
    <Text style={T.h3}>{h.offer.title}</Text><Text style={T.body}>{provider?'Abholung durch':'Angeboten von'} {h.counterpart.name}</Text>
    <Reputation data={h.counterpart.reputation}/><Divider/>
    <Text style={T.body}>Eine Portion: {h.offer.items.map(i=>`${i.qty} ${i.name}`).join(' · ')}</Text>
    <Text style={T.small}>{time(h.offer.startsAt)}–{new Date(h.offer.endsAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</Text>
    {h.offer.address ? <Text style={[T.body,{fontWeight:'700'}]}>{h.offer.address}</Text> : ['pending','accepted'].includes(h.status) && <Text style={T.small}>Bitte Zusage und Zeitfenster abwarten. Komm nicht unangekündigt und nimm nur deine vereinbarte Portion.</Text>}
    {h.status==='pending' && provider && <Button label="Abholung zusagen" color={col} disabled={busy} onPress={()=>act('accept')}/>}
    {h.status==='pending'&&<Text style={T.small}>Für die Zusage vorgemerkt bis {time(h.reserveExpiresAt||h.offer.endsAt)}. Danach wird die Portion automatisch wieder frei.</Text>}
    {h.status==='accepted' && provider && <>
      <Text style={T.body}>Prüfe die vereinbarte Portion und scanne bei der Übergabe den persönlichen Abholcode.</Text>
      <Button label="Abhol-QR scannen & übergeben" icon="qr-code" color={col} disabled={busy||clock<h.offer.startsAt||clock>h.offer.endsAt} onPress={()=>router.push({pathname:'/scan',params:{mode:'food-handover',id:h.id}})}/>
    </>}
    {h.status==='accepted' && !provider && <>
      <Text style={T.body}>Zeige deinen persönlichen Code erst vor Ort, wenn deine vereinbarte Portion bereitliegt. Nur die anbietende Person kann damit abschließen.</Text>
      {issued&&<ProofCode {...issued} label="Dein persönlicher Abholcode"/>}
      <Button label={issued?'Abholcode erneuern':'Meine Portion ist bereit · Abholcode zeigen'} icon="qr-code" color={col} disabled={busy||clock<h.offer.startsAt||clock>h.offer.endsAt} onPress={()=>void perform(async()=>setIssued(await trust.ticket(h.id)))}/>
    </>}
    {h.status==='received' && (provider ? <><Text style={T.body}>Der Empfang ist bestätigt. Hast du die vereinbarte Portion übergeben?</Text><Button label="Ja, Übergabe abschließen" color={col} disabled={busy} onPress={()=>act('complete')}/></> : <Text style={T.body}>Dein Empfang ist bestätigt. Die anbietende Person bestätigt jetzt die Übergabe. Bis dahin bleiben Punkte ausstehend.</Text>)}
    {['pending','accepted'].includes(h.status) && <Button label={provider?'Anfrage absagen':'Abholung absagen'} variant="ghost" color={C.muted} disabled={busy} onPress={()=>act('cancel')}/>}
    {h.status==='completed' && <>
      <Text style={T.small}>Beide Seiten haben bestätigt. Wiederholungen mit derselben Person werden innerhalb von sieben Tagen nur einmal mit Punkten belohnt.</Text>
      {h.reviewed ? <Text style={[T.body,{color:col}]}>Deine Bewertung ist gespeichert.</Text> : clock <= (h.completedAt||0)+14*86400000 && <Button label="Erfahrung bewerten" variant="soft" color={col} onPress={()=>setReview(!review)}/>}
      {review && !h.reviewed && <View style={{gap:10}}>
        {([['satisfaction','Zufriedenheit'],['reliability','Zuverlässigkeit'],['respect','Respekt & vereinbarte Menge']] as const).map(([key,label])=><View key={key}><Text style={T.h3}>{label}</Text><Row style={{gap:5,marginTop:6}}>{[1,2,3,4,5].map(n=><Pressable key={n} accessibilityRole="button" accessibilityLabel={`${label}: ${n} von 5`} accessibilityState={{selected:scores[key]===n}} onPress={()=>setScores({...scores,[key]:n})} style={{padding:8,backgroundColor:scores[key]===n?col:C.bg,borderRadius:10}}><Text style={{color:scores[key]===n?'#fff':C.ink,fontWeight:'800'}}>{n}</Text></Pressable>)}</Row></View>)}
        <Text style={T.small}>1 = unzufrieden, 5 = sehr zufrieden. Sichtbar erst, wenn beide bewerten oder nach 14 Tagen. Eine Person zählt im Gesamtbild nur einmal.</Text>
        <Button label="Bewertung verbindlich speichern" color={col} disabled={busy||Object.keys(scores).length!==3} onPress={()=>act('review',scores)}/>
      </View>}
    </>}
    <Button label="Problem zur Übergabe vermerken" color={C.muted} variant="ghost" onPress={()=>setConcern(!concern)}/>
    {concern && <View style={{gap:6}}><Text style={T.small}>Der Hinweis ist nur für euch beide sichtbar. Die andere Person kann widersprechen. Daraus entsteht keine automatische Sperre oder öffentliche Beschuldigung.</Text>{Object.entries(CONCERNS).map(([key,label])=><Button key={key} label={label} color={C.muted} variant="soft" disabled={busy||h.concern.some(c=>c.mine)} onPress={()=>act('concern',{reason:key})}/>)}</View>}
    {h.concern.map((c,i)=><View key={i}><Text style={T.small}>{c.mine?'Dein Hinweis':'Hinweis der anderen Person'}: {CONCERNS[c.reason]} · {c.disputed?'widersprochen':'ungeklärt'}</Text>{!c.mine&&!c.disputed&&<Button label="Ich widerspreche diesem Hinweis" color={C.muted} variant="ghost" disabled={busy} onPress={()=>act('dispute')}/>}</View>)}
  </Card>;
}
