import { useT, useLocalize, useLocale } from '@/i18n/useT';
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
const time = (n: number, locale: string) => new Date(n).toLocaleString(locale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const STATUS = { pending: 'Zusage ausstehend', accepted: 'Abholung zugesagt', received: 'Empfang bestätigt', completed: 'Beidseitig bestätigt', cancelled: 'Abgesagt', expired: 'Zeitfenster abgelaufen', disputed: 'Abschluss ungeklärt' };
const CONCERNS: Record<string,string> = { no_show: 'Nicht erschienen', early: 'Unangekündigt zu früh erschienen', took_more: 'Mehr als vereinbart mitgenommen', disrespect: 'Respektloses Verhalten' };

export default function Handoffs() {
  const rt = useT();
  const localize = useLocalize();
  const locale = useLocale();
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
    <Header title={rt('routes.handoffs')} right={<FoodsharingLogo width={76} />} />
    <Card style={{ backgroundColor: '#EAF3E6', marginBottom: 16 }}>
      <Row style={{ gap: 10 }}><Ionicons name="shield-checkmark-outline" size={30} color={col} /><Text style={[T.h2, { flex: 1 }]}>{rt('routes.good_food_fair_collection')}</Text></Row>
      <Text style={[T.body, { marginTop: 8 }]}>{rt('routes.see_what_remains_choose_your_portion_and_a_collection_time_on_sit')}</Text>
    </Card>
    {!!error && <Text accessibilityRole="alert" style={[T.body, { color: C.danger, marginBottom: 12 }]}>{localize(error)}</Text>}
    {!ready ? <Text style={T.body}>{rt('routes.loading_your_handoffs')}</Text> : !profile ? <Card style={{ gap: 12 }}>
      <Text style={T.h2}>{register ? rt('routes.create_account') : rt('routes.sign_in_for_handoffs')}</Text>
      <Text style={T.body}>{rt('routes.your_own_account_protects_acceptances_and_reviews_your_public_nam')}</Text>
      <TextInput accessibilityLabel={rt('routes.username_for_handoffs')} placeholder={rt('routes.username')} value={name} onChangeText={setName} autoCapitalize="none" autoCorrect={false} maxLength={24} style={field} />
      <TextInput accessibilityLabel={rt('routes.password_for_handoffs')} placeholder={rt('routes.password_at_least_10_characters')} secureTextEntry value={password} onChangeText={setPassword} autoCapitalize="none" autoCorrect={false} maxLength={128} style={field} />
      <Button label={busy ? rt('routes.connecting') : register ? rt('routes.create_account') : rt('routes.sign_in')} color={col} disabled={busy || name.trim().length < 3 || password.length < 10} onPress={() => void perform(async () => { await trust.login(name.trim(), password, register); setPassword(''); })} />
      <Button label={register ? rt('routes.i_already_have_an_account') : rt('routes.create_a_new_account')} color={col} variant="ghost" disabled={busy} onPress={() => setRegister(!register)} />
      <Text style={T.small}>{rt('routes.keep_your_password_safe_email_recovery_is_not_available')}</Text>
    </Card> : <>
      <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}><Text style={T.h3}>{profile.user.name}</Text><Pressable accessibilityRole="button" onPress={() => void perform(async () => { await trust.logout(); setProfile(null); setOffers([]); setHandoffs([]); sync([]); useStore.getState().syncContainers([]); })}><Text style={{ color: col, fontWeight: '700' }}>{rt('routes.sign_out')}</Text></Pressable></Row>
      <Reputation data={profile.reputation} />
      <Row style={{ gap: 7, marginVertical: 16, flexWrap: 'wrap' }}>{([['offers',rt('routes.offers')],['mine',rt('routes.my_handoffs')],['create',rt('routes.offer_food')]] as const).map(([id,label]) => <Pill key={id} label={label} color={col} active={tab===id} onPress={() => setTab(id)} />)}</Row>
      {tab === 'create' ? <OfferForm area={params.area} busy={busy} onCreate={draft => perform(async () => { await trust.distribution(draft); setTab('offers'); })} /> : tab === 'offers' ? <View style={{ gap: 12 }}>
        {!offers.length && <Card><Text style={T.body}>{rt('routes.no_offers_yet_record_the_first_portion_using_photo_audio_or_text')}</Text></Card>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>{['Alle',...Array.from(new Set(offers.map(o=>o.area)))].map(area=><Pill key={area} label={area === 'Alle' ? rt('routes.all') : area} active={filterArea===area} color={col} onPress={()=>setFilterArea(area)}/>)}</ScrollView>
        {offers.filter(o=>filterArea==='Alle'||o.area===filterArea).map(o => <Card key={o.id} style={{ gap: 10 }}>
          <Row style={{ justifyContent: 'space-between' }}><Text style={[T.h3,{flex:1}]}>{o.title}</Text><Tag label={o.remaining?rt('routes.value_of_value_available', { p1: o.remaining, p2: o.portions }):rt('routes.all_taken')} color={col} /></Row>
          <Text style={T.small}>{o.area} · {time(o.startsAt, locale)}–{new Date(o.endsAt).toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'})}</Text>
          <Text style={T.body}>{o.items.map(i => `${i.qty} ${i.name}`).join(' · ')}</Text>
          <Text style={T.small}>{rt('routes.one_portion_per_person_per_offer_reserved_portions_have_already_b')}</Text>
          <Divider /><Text style={T.h3}>{o.ownerId === profile.user.id ? rt('routes.your_offer') : o.ownerName}</Text><Reputation data={o.reputation} />
          {o.ownerId !== profile.user.id && <>
            {o.remaining>0 && !!o.slots?.length && <><Text style={T.h3}>{rt('routes.your_collection_time')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{o.slots.filter(slot=>slot.available).map(slot=><Pill key={slot.startsAt} label={new Date(slot.startsAt).toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'})} color={col} active={selectedSlots[o.id]===slot.startsAt} onPress={()=>setSelectedSlots({...selectedSlots,[o.id]:slot.startsAt})}/>)}</ScrollView></>}
            <Button label={o.remaining?rt('routes.request_portion_time'):rt('routes.all_taken')} color={col} disabled={busy || o.remaining < 1 || o.endsAt < Date.now() || (!!o.slots?.length&&!o.slots.some(slot=>slot.available&&slot.startsAt===selectedSlots[o.id]))} onPress={() => void perform(async () => { await trust.request(o.id,selectedSlots[o.id]); setTab('mine'); })}/>
            <Text style={T.small}>{rt('routes.reserved_for_15_minutes_pending_acceptance_the_exact_address_appe')}</Text>
          </>}
          {o.ownerId === profile.user.id && <Button label={rt('routes.view_requests')} color={col} variant="soft" onPress={() => setTab('mine')} />}
        </Card>)}
      </View> : <View style={{ gap: 14 }}>
        {!handoffs.length && <Card><Text style={T.body}>{rt('routes.your_requests_and_acceptances_appear_here_nobody_is_accepted_auto')}</Text></Card>}
        {handoffs.map(h => <HandoffCard key={h.id} h={h} busy={busy} perform={perform} />)}
      </View>}
    </>}
  </Screen>;
}

type Draft = Parameters<typeof trust.distribution>[0];
function OfferForm({ area: initialArea, busy, onCreate }: { area?: string; busy: boolean; onCreate: (draft: Draft) => Promise<void> }) {
  const rt = useT();
  const [title,setTitle]=useState(''), [area,setArea]=useState(DISTRICTS.some(d=>d.name===initialArea)?initialArea!:useStore.getState().district), [address,setAddress]=useState('');
  const [portion,setPortion]=useState(1), [delay,setDelay]=useState(30), [sheet,setSheet]=useState(false), [capture,setCapture]=useState<ActionResult|null>(null);
  const [separate,setSeparate]=useState(true),[counts,setCounts]=useState<Record<number,number>>({});
  const requestKey = useRef(`offer-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const requestTime=useRef<number|null>(null);
  return <Card style={{ gap: 12 }}>
    <Text style={T.h2}>{rt('routes.what_did_you_rescue_today')}</Text>
    <Text style={T.body}>{rt('routes.take_a_photo_speak_or_type_for_each_item_enter_the_amount_for_one')}</Text>
    <TextInput accessibilityLabel={rt('routes.offer_title')} placeholder={rt('routes.eg_todays_baked_goods')} value={title} onChangeText={setTitle} maxLength={80} style={field} />
    <Button label={capture ? rt('routes.value_items_edit_food', { p1: capture.items.length }) : rt('routes.photo_audio_or_text_entry')} icon="camera" color={col} variant="soft" onPress={() => setSheet(true)} />
    {capture && <>
      <Row style={{flexWrap:'wrap'}}><Pill label={rt('routes.offer_items_separately')} active={separate} color={col} onPress={()=>setSeparate(true)}/><Pill label={rt('routes.mixed_bags')} active={!separate} color={col} onPress={()=>setSeparate(false)}/></Row>
      {capture.items.map((item,i)=><View key={i} style={{gap:6,padding:12,backgroundColor:C.bg,borderRadius:12}}><Text style={T.h3}>{item.name}</Text><Text style={T.body}>{rt('routes.value_per_collection_estimated_weight', { p1: item.qty })}</Text>{separate&&<Row><Text style={[T.small,{flex:1}]}>{rt('routes.number_of_portions_available')}</Text><TextInput accessibilityLabel={rt('routes.available_portions_of_value', { p1: item.name })} value={String(counts[i]??1)} onChangeText={v=>setCounts({...counts,[i]:Math.max(0,Math.min(20,Number(v.replace(/\D/g,''))||0))})} keyboardType="number-pad" maxLength={2} style={[field,{width:65,backgroundColor:'#fff'}]}/></Row>}</View>)}
      {!separate&&<><Text style={T.h3}>{rt('routes.how_many_identical_bags')}</Text><Row style={{flexWrap:'wrap'}}>{[1,2,3,4,6,10].map(n=><Pill key={n} label={String(n)} color={col} active={portion===n} onPress={()=>setPortion(n)}/>)}</Row></>}
    </>}
    <Text style={T.h3}>{rt('routes.your_district_public')}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{DISTRICTS.map(d=><Pill key={d.name} label={d.name} color={col} active={area===d.name} onPress={()=>setArea(d.name)}/>)}</ScrollView>
    <TextInput accessibilityLabel={rt('routes.private_meeting_point')} placeholder={rt('routes.exact_meeting_point_only_after_acceptance')} value={address} onChangeText={setAddress} maxLength={200} style={field} />
    <Text style={T.small}>{rt('routes.only_the_district_appears_on_the_map_the_address_stays_hidden_unt')}</Text>
    <Text style={T.h3}>{rt('routes.when_will_you_distribute')}</Text><Row style={{ gap: 6, flexWrap:'wrap' }}>{[0,30,60].map(n=><Pill key={n} label={n ? rt('routes.in_value_minutes_2', { p1: n }) : rt('routes.starting_now')} color={col} active={delay===n} onPress={()=>setDelay(n)} />)}</Row>
    <Text style={T.body}>{rt('routes.two_hours_with_collection_slots_every_five_minutes_one_person_per')}</Text>
    <Button label={busy ? rt('routes.saving') : rt('routes.publish_distribution')} color={col} disabled={busy || !capture?.items.length || !title.trim() || !address.trim() || (separate&&capture.items.some((_,i)=>(counts[i]??1)<1))} onPress={() => { const startsAt = requestTime.current ?? (requestTime.current=Date.now()+delay*60000); void onCreate({ title, area, address, lots:separate?capture!.items.map((item,i)=>({items:[item],portions:counts[i]??1})):[{items:capture!.items,portions:portion}], startsAt, endsAt:startsAt+7200000, requestKey:requestKey.current }); }} />
    <Text style={T.small}>{rt('routes.points_only_after_handoff_photo_and_audio_help_with_entry_authori')}</Text>
    <FoodActionSheet open={sheet} mode="stock" onClose={()=>setSheet(false)} onDone={setCapture} color={col} />
  </Card>;
}
function HandoffCard({h,busy,perform}:{h:Handoff;busy:boolean;perform:(action:()=>Promise<unknown>)=>Promise<void>}) {
  const rt = useT();
  const localize = useLocalize();
  const locale = useLocale();
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
    <Tag label={localize(STATUS[h.status])} color={h.status==='completed'?col:C.muted}/>
    <Text style={T.h3}>{h.offer.title}</Text><Text style={T.body}>{provider?rt('routes.collected_by'):rt('routes.offered_by')} {h.counterpart.name}</Text>
    <Reputation data={h.counterpart.reputation}/><Divider/>
    <Text style={T.body}>{rt('routes.one_portion_value', { p1: h.offer.items.map(i=>`${i.qty} ${i.name}`).join(' · ') })}</Text>
    <Text style={T.small}>{time(h.offer.startsAt, locale)}–{new Date(h.offer.endsAt).toLocaleTimeString(locale,{hour:'2-digit',minute:'2-digit'})}</Text>
    {h.offer.address ? <Text style={[T.body,{fontWeight:'700'}]}>{h.offer.address}</Text> : ['pending','accepted'].includes(h.status) && <Text style={T.small}>{rt('routes.wait_for_acceptance_and_the_time_window_do_not_arrive_unannounced')}</Text>}
    {h.status==='pending' && provider && <Button label={rt('routes.accept_collection')} color={col} disabled={busy} onPress={()=>act('accept')}/>}
    {h.status==='pending'&&<Text style={T.small}>{rt('routes.held_pending_acceptance_until_value_the_portion_becomes_available', { p1: time(h.reserveExpiresAt||h.offer.endsAt, locale) })}</Text>}
    {h.status==='accepted' && provider && <>
      <Text style={T.body}>{rt('routes.check_the_agreed_portion_and_scan_the_personal_collection_code_at')}</Text>
      <Button label={rt('routes.scan_collection_qr_hand_over')} icon="qr-code" color={col} disabled={busy||clock<h.offer.startsAt||clock>h.offer.endsAt} onPress={()=>router.push({pathname:'/scan',params:{mode:'food-handover',id:h.id}})}/>
    </>}
    {h.status==='accepted' && !provider && <>
      <Text style={T.body}>{rt('routes.show_your_personal_code_only_on_site_when_your_agreed_portion_is_')}</Text>
      {issued&&<ProofCode {...issued} label={rt('routes.your_personal_collection_code')}/>}
      <Button label={issued?rt('routes.renew_collection_code'):rt('routes.my_portion_is_ready_show_code')} icon="qr-code" color={col} disabled={busy||clock<h.offer.startsAt||clock>h.offer.endsAt} onPress={()=>void perform(async()=>setIssued(await trust.ticket(h.id)))}/>
    </>}
    {h.status==='received' && (provider ? <><Text style={T.body}>{rt('routes.receipt_is_confirmed_have_you_handed_over_the_agreed_portion')}</Text><Button label={rt('routes.yes_complete_handoff')} color={col} disabled={busy} onPress={()=>act('complete')}/></> : <Text style={T.body}>{rt('routes.your_receipt_is_confirmed_the_provider_now_confirms_the_handoff_p')}</Text>)}
    {['pending','accepted'].includes(h.status) && <Button label={provider?rt('routes.decline_request'):rt('routes.cancel_collection')} variant="ghost" color={C.muted} disabled={busy} onPress={()=>act('cancel')}/>}
    {h.status==='completed' && <>
      <Text style={T.small}>{rt('routes.both_people_confirmed_repeat_handoffs_with_the_same_person_earn_p')}</Text>
      {h.reviewed ? <Text style={[T.body,{color:col}]}>{rt('routes.your_review_is_saved')}</Text> : clock <= (h.completedAt||0)+14*86400000 && <Button label={rt('routes.review_experience')} variant="soft" color={col} onPress={()=>setReview(!review)}/>}
      {review && !h.reviewed && <View style={{gap:10}}>
        {([['satisfaction',rt('routes.satisfaction')],['reliability',rt('routes.reliability')],['respect',rt('routes.respect_agreed_quantity')]] as const).map(([key,label])=><View key={key}><Text style={T.h3}>{label}</Text><Row style={{gap:5,marginTop:6}}>{[1,2,3,4,5].map(n=><Pressable key={n} accessibilityRole="button" accessibilityLabel={rt('routes.value_value_out_of_5', { p1: label, p2: n })} accessibilityState={{selected:scores[key]===n}} onPress={()=>setScores({...scores,[key]:n})} style={{padding:8,backgroundColor:scores[key]===n?col:C.bg,borderRadius:10}}><Text style={{color:scores[key]===n?'#fff':C.ink,fontWeight:'800'}}>{n}</Text></Pressable>)}</Row></View>)}
        <Text style={T.small}>{rt('routes.1_dissatisfied_5_very_satisfied_visible_when_both_review_or_after')}</Text>
        <Button label={rt('routes.submit_final_review')} color={col} disabled={busy||Object.keys(scores).length!==3} onPress={()=>act('review',scores)}/>
      </View>}
    </>}
    <Button label={rt('routes.record_a_handoff_problem')} color={C.muted} variant="ghost" onPress={()=>setConcern(!concern)}/>
    {concern && <View style={{gap:6}}><Text style={T.small}>{rt('routes.only_the_two_of_you_can_see_this_note_the_other_person_can_disput')}</Text>{Object.entries(CONCERNS).map(([key,label])=><Button key={key} label={localize(label)} color={C.muted} variant="soft" disabled={busy||h.concern.some(c=>c.mine)} onPress={()=>act('concern',{reason:key})}/>)}</View>}
    {h.concern.map((c,i)=><View key={i}><Text style={T.small}>{c.mine?rt('routes.your_note'):rt('routes.other_persons_note')}: {localize(CONCERNS[c.reason])} · {c.disputed?rt('routes.disputed'):rt('routes.unresolved')}</Text>{!c.mine&&!c.disputed&&<Button label={rt('routes.i_dispute_this_note')} color={C.muted} variant="ghost" disabled={busy} onPress={()=>act('dispute')}/>}</View>)}
  </Card>;
}
