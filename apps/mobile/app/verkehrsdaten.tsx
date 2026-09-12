import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Screen, Header } from '@/components/Screen';
import { Button, Card, Pill, Row, T, Tag } from '@/components/ui';
import PartnerLogo from '@/components/PartnerLogo';
import { C } from '@/theme';
import { useT, useLocale } from '@/i18n/useT';
import planning from '@/data/planning.json';
import demand from '@/data/tagesgang.json';
import stations from '@/data/haltestellen.json';
import { useStore } from '@/store';
const col=C.mobility;
export default function TrafficData(){
  const t=useT(),locale=useLocale(),[demo,setDemo]=useState(false),[line,setLine]=useState('Alle'),[chosen,setChosen]=useState('');
  const ledger=useStore(s=>s.ledger);
  const trips=planning.trips.filter(r=>r.original!==demo),lines=[...new Set(trips.map(r=>r.line))];
  const selected=trips.filter(r=>line==='Alle'||r.line===line),detail=selected.find(r=>r.id===chosen)||selected[0];
  const low=selected.filter(r=>r.peak<25).length,peak=Math.max(0,...selected.map(r=>r.peak));
  const sum=demand.hours.reduce((a,b)=>a+b,0),peakHour=demand.hours.indexOf(Math.max(...demand.hours));
  const own=useMemo(()=>ledger.filter(r=>r.type==='ride.transit'&&r.status!=='nicht zuordenbar'),[ledger]);
  return <Screen tabBar={false}><Header title="traffiQ" subtitle={t('updates.planning')} color={col}/>
    <Card style={{gap:10,marginBottom:14}}><PartnerLogo id="traffiq" name="traffiQ"/><Text style={T.h2}>{t('updates.planningTitle')}</Text><Text style={T.body}>{t('updates.planningHint')}</Text></Card>
    <Row style={{gap:8,marginBottom:12}}><Pill label={t('updates.original')} active={!demo} color={col} onPress={()=>{setDemo(false);setLine('Alle');setChosen('');}}/><Pill label={t('updates.simulated')} active={demo} color={col} onPress={()=>{setDemo(true);setLine('Alle');setChosen('');}}/></Row>
    <Text style={[T.small,{marginBottom:12}]}>{demo?t('updates.demoSource'):t('updates.originalSource')}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:14}}>{['Alle',...lines].map(v=><Pill key={v} label={v==='Alle'?t('routes.all'):v} color={col} active={line===v} onPress={()=>{setLine(v);setChosen('');}}/>)}</ScrollView>
    <View style={{gap:12}}>
      <Card style={{gap:8}}><Row style={{alignItems:'flex-start'}}><Metric value={String(selected.length)} label={t('updates.trips')}/><Metric value={`${peak}%`} label={t('updates.peak')}/><Metric value={String(low)} label={t('updates.lowTrips')}/></Row><Text style={T.small}>{t('updates.lowDefinition')}</Text></Card>
      <Text style={T.h3}>{t('updates.chooseTrip')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>{selected.map(r=><Pill key={r.id} label={`${r.line} · ${r.start}`} color={col} active={detail?.id===r.id} onPress={()=>setChosen(r.id)}/>)}</ScrollView>
      {detail&&<Card style={{gap:12}}><Text style={T.h2}>{detail.line} · {detail.start}</Text><Text style={T.body}>{detail.origin} → {detail.destination}</Text><Text style={T.small}>{t('updates.boardings')}: {detail.boardings} · {t('updates.peak')}: {detail.peak}%</Text><Text style={T.h3}>{t('updates.efficiency')}</Text><Row style={{alignItems:'flex-start'}}><Metric value={detail.utilization===null?'—':`${detail.utilization}%`} label={t('updates.capacityUse')}/><Metric value={`${detail.duration} min`} label={t('updates.duration')}/></Row><Text style={T.small}>{t('updates.efficiencyHint',{valid:detail.validSegments,total:detail.totalSegments})}</Text><Text style={T.small}>{t('updates.delay')}: {detail.delayMedian} min</Text><Text style={T.h3}>{t('updates.loadByStop')}</Text>{detail.stops.map((s,i)=><View key={i} style={{gap:4}}><Row><Text style={[T.small,{flex:1}]}>{s.name}</Text><Text style={T.small}>{s.load}%</Text></Row><Bar value={s.load}/></View>)}<Text style={[T.body,{fontWeight:'700'}]}>{detail.peak<25?t('updates.lowAdvice'):detail.peak>=80?t('updates.highAdvice'):t('updates.mediumAdvice')}</Text></Card>}
      <Card style={{gap:12}}><Text style={T.h2}>{t('updates.demand')}</Text><Text style={T.body}>{sum.toLocaleString(locale)} · {t('updates.peakHour')}: {peakHour}:00</Text><View style={{height:115,flexDirection:'row',gap:3,alignItems:'flex-end'}}>{demand.hours.map((v,h)=><View key={h} style={{flex:1,alignItems:'center',height:'100%',justifyContent:'flex-end'}}><View style={{height:Math.max(2,v/Math.max(...demand.hours)*87),width:'100%',borderRadius:3,backgroundColor:col}}/>{h%6===0&&<Text style={{fontSize:9,color:C.muted}}>{h}</Text>}</View>)}</View><Text style={T.small}>{t('updates.demandSource')}</Text><Text style={T.h3}>{t('updates.topStops')}</Text>{stations.items.slice(0,5).map(s=><Row key={s.n}><Text style={[T.body,{flex:1}]}>{s.n}</Text><Text style={T.small}>{s.v.toLocaleString(locale)}</Text></Row>)}<Text style={T.small}>{t('updates.stopsSource')}</Text></Card>
      <Card style={{gap:10}}><Text style={T.h2}>{t('updates.ownTrips')}</Text><Text style={T.body}>{t('updates.ownTripsHint',{count:own.length})}</Text><Text style={T.small}>{t('updates.coverage')}</Text></Card>
    </View>
  </Screen>;
}
function Metric({value,label}:{value:string;label:string}){return <View style={{flex:1,gap:4}}><Text style={[T.h2,{color:col}]}>{value}</Text><Text style={T.small}>{label}</Text></View>;}
function Bar({value}:{value:number}){return <View style={{height:9,borderRadius:5,backgroundColor:C.line,overflow:'hidden'}}><View style={{height:9,width:`${Math.max(0,Math.min(100,value))}%`,backgroundColor:col,borderRadius:5}}/></View>;}
