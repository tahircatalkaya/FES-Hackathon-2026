import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Header, Screen } from '@/components/Screen';
import { Button, Card, Divider, Pill, Row, T, Tag } from '@/components/ui';
import FoodsharingLogo from '@/components/FoodsharingLogo';
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
  const params = useLocalSearchParams<{ create?: string; area?: string }>();
  const sync = useStore(s => s.syncFoodAwards);
  const [profile, setProfile] = useState<TrustProfile | null>(null);
  const [offers, setOffers] = useState<TrustOffer[]>([]), [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [register, setRegister] = useState(false), [name, setName] = useState(''), [password, setPassword] = useState('');
  const [tab, setTab] = useState<'offers'|'mine'|'create'>(params.create ? 'create' : 'offers');
  const running = useRef(false), mutation = useRef(false);
  const load = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    try {
      if (!await trust.hasSession()) { setProfile(null); return; }
      const [me, list, mine] = await Promise.all([trust.me(), trust.offers(), trust.handoffs()]);
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
      <Text style={[T.body, { marginTop: 8 }]}>Eine vereinbarte Portion, ein Zeitfenster und die Bestätigung von euch beiden. So bleibt für alle etwas übrig.</Text>
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
      <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}><Text style={T.h3}>{profile.user.name}</Text><Pressable accessibilityRole="button" onPress={() => void perform(async () => { await trust.logout(); setProfile(null); setOffers([]); setHandoffs([]); sync([]); })}><Text style={{ color: col, fontWeight: '700' }}>Abmelden</Text></Pressable></Row>
      <Reputation data={profile.reputation} />
      <Row style={{ gap: 7, marginVertical: 16, flexWrap: 'wrap' }}>{([['offers','Angebote'],['mine','Meine Übergaben'],['create','Anbieten']] as const).map(([id,label]) => <Pill key={id} label={label} color={col} active={tab===id} onPress={() => setTab(id)} />)}</Row>
      {tab === 'create' ? <OfferForm area={params.area} busy={busy} onCreate={draft => perform(async () => { await trust.create(draft); setTab('offers'); })} /> : tab === 'offers' ? <View style={{ gap: 12 }}>
        {!offers.length && <Card><Text style={T.body}>Noch keine Angebote. Erfasse die erste Portion per Foto, Audio oder Texteingabe.</Text></Card>}
        {offers.map(o => <Card key={o.id} style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}><Text style={[T.h3,{flex:1}]}>{o.title}</Text><Tag label={`${o.remaining} frei`} color={col} /></Row>
          <Text style={T.small}>{o.area} · {time(o.startsAt)}–{new Date(o.endsAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</Text>
          <Text style={T.body}>{o.items.map(i => `${i.qty} ${i.name}`).join(' · ')}</Text>
          <Text style={T.small}>Je Person eine der {o.portions} gleich zusammengestellten Portionen.</Text>
          <Divider /><Text style={T.h3}>{o.ownerId === profile.user.id ? 'Dein Angebot' : o.ownerName}</Text><Reputation data={o.reputation} />
          {o.ownerId !== profile.user.id && <Button label="Eine Portion anfragen" color={col} disabled={busy || o.remaining < 1 || o.endsAt < Date.now()} onPress={() => void perform(async () => { await trust.request(o.id); setTab('mine'); })} />}
          {o.ownerId === profile.user.id && <Button label="Anfragen ansehen" color={col} variant="soft" onPress={() => setTab('mine')} />}
        </Card>)}
      </View> : <View style={{ gap: 14 }}>
        {!handoffs.length && <Card><Text style={T.body}>Hier erscheinen deine Anfragen und Zusagen. Niemand wird automatisch angenommen.</Text></Card>}
        {handoffs.map(h => <HandoffCard key={h.id} h={h} busy={busy} perform={perform} />)}
      </View>}
    </>}
  </Screen>;
}

type Draft = Parameters<typeof trust.create>[0];
function OfferForm({ area: initialArea, busy, onCreate }: { area?: string; busy: boolean; onCreate: (draft: Draft) => Promise<void> }) {
  const [title,setTitle]=useState(''), [area,setArea]=useState(initialArea || ''), [address,setAddress]=useState('');
  const [portion,setPortion]=useState(1), [delay,setDelay]=useState(0), [sheet,setSheet]=useState(false), [capture,setCapture]=useState<ActionResult|null>(null);
  const requestKey = useRef(`offer-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return <Card style={{ gap: 12 }}>
    <Text style={T.h2}>Eine faire Portion zusammenstellen</Text>
    <Text style={T.body}>Erfasse den Inhalt einer Portion. Bietest du mehrere an, bekommt jede Person dieselbe Zusammenstellung.</Text>
    <TextInput accessibilityLabel="Titel des Angebots" placeholder="Titel, z. B. Obst und Brot" value={title} onChangeText={setTitle} maxLength={160} style={field} />
    <Button label={capture ? `${capture.items.length} Posten · Inhalt bearbeiten` : 'Lebensmittel erfassen'} icon="📷" color={col} variant="soft" onPress={() => setSheet(true)} />
    {capture && <Text style={T.body}>{capture.items.map(i=>`${i.qty} ${i.name}`).join('\n')}</Text>}
    <TextInput accessibilityLabel="Öffentlicher Stadtteil" placeholder="Stadtteil · öffentlich, ohne Hausnummer" value={area} onChangeText={setArea} maxLength={80} style={field} />
    <TextInput accessibilityLabel="Privater Treffpunkt" placeholder="Genauer Treffpunkt · nur nach Zusage" value={address} onChangeText={setAddress} maxLength={200} style={field} />
    <Text style={T.small}>Der Treffpunkt erscheint nur nach Zusage, ab 15 Minuten vor dem Termin und nur für die abholende Person.</Text>
    <Text style={T.h3}>Wie viele gleiche Portionen?</Text><Row style={{ gap: 6 }}>{[1,2,3,4,6].map(n=><Pill key={n} label={String(n)} color={col} active={portion===n} onPress={()=>setPortion(n)} />)}</Row>
    <Text style={T.h3}>Abholung für eine Stunde</Text><Row style={{ gap: 6, flexWrap:'wrap' }}>{[0,30,60].map(n=><Pill key={n} label={n ? `In ${n} Minuten` : 'Ab jetzt'} color={col} active={delay===n} onPress={()=>setDelay(n)} />)}</Row>
    <Button label={busy ? 'Speichere…' : 'Angebot veröffentlichen'} color={col} disabled={busy || !capture?.items.length || !title.trim() || !area.trim() || !address.trim()} onPress={() => { const startsAt = Date.now() + delay*60000; void onCreate({ title, area, address, items: capture!.items, portions: portion, startsAt, endsAt: startsAt+3600000, requestKey: requestKey.current }); }} />
    <Text style={T.small}>Punkte entstehen erst nach bestätigter Übergabe. Bilder und Audio helfen beim Eintragen; sie ersetzen keine Bestätigung.</Text>
    <FoodActionSheet open={sheet} mode="stock" onClose={()=>setSheet(false)} onDone={setCapture} color={col} />
  </Card>;
}
function HandoffCard({h,busy,perform}:{h:Handoff;busy:boolean;perform:(action:()=>Promise<unknown>)=>Promise<void>}) {
  const [code,setCode]=useState(''), [issued,setIssued]=useState<{code:string;expiresAt:number}|null>(null);
  const [review,setReview]=useState(false), [concern,setConcern]=useState(false);
  const [scores,setScores]=useState<Record<string,number>>({});
  const [clock,setClock]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setClock(Date.now()),1000);return()=>clearInterval(timer);},[]);
  useEffect(()=>{setIssued(null);setCode('');},[h.status]);
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
    {h.status==='accepted' && provider && <>
      <Text style={T.body}>Gib den Code erst bei der tatsächlichen Übergabe weiter.</Text>
      {issued && issued.expiresAt>clock && <View style={{backgroundColor:col+'18',padding:16,borderRadius:16,alignItems:'center'}}><Text selectable style={{fontSize:32,fontWeight:'900',letterSpacing:6,color:col}}>{issued.code}</Text><Text style={T.small}>Noch {Math.ceil((issued.expiresAt-clock)/1000)} Sekunden gültig</Text></View>}
      <Button label="Übergabecode anzeigen" color={col} disabled={busy||clock<h.offer.startsAt||clock>h.offer.endsAt} onPress={()=>void perform(async()=>setIssued(await trust.code(h.id)))}/>
    </>}
    {h.status==='accepted' && !provider && <>
      <Text style={T.body}>Prüfe deine Portion. Gib den Code erst ein, wenn du die Lebensmittel erhalten hast.</Text>
      <TextInput accessibilityLabel="Sechsstelliger Übergabecode" placeholder="6-stelliger Übergabecode" value={code} onChangeText={v=>setCode(v.replace(/\D/g,'').slice(0,6))} keyboardType="number-pad" maxLength={6} style={field}/>
      <Button label="Portion erhalten · Code bestätigen" color={col} disabled={busy||code.length!==6} onPress={()=>act('receive',{code})}/>
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
