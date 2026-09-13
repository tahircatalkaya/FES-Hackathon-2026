import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '@/store';
import { CLEANUPS } from '@/data/mock';
import { Screen, Header } from '@/components/Screen';
import { Button, Card, T } from '@/components/ui';
import CleanupProof from '@/components/CleanupProof';
import { C } from '@/theme';
import { useLocation } from '@/hooks/useLocation';
import { useT, useLocalize, useLocale } from '@/i18n/useT';
import Map from '@/components/Map';
import { openRoute } from '@/api/route';
export default function CleanupScreen(){
  const {id}=useLocalSearchParams<{id:string}>(),router=useRouter(),t=useT(),l=useLocalize(),locale=useLocale(),{loc}=useLocation();
  const {ownCleanups,joinedCleanups,joinCleanup}=useStore();const activities=[...ownCleanups,...CLEANUPS],event=activities.find(c=>c.id===id);
  if(id==='list')return <Screen tabBar={false}><Header title={t('routes.clean_frankfurt')}/><View style={{gap:12}}>{activities.map(c=><Card key={c.id} onPress={()=>router.push(`/cleanup/${c.id}`)}><Text style={T.h3}>{l(c.title)}</Text><Text style={T.body}>{c.district} · {new Date(c.start).toLocaleString(locale)}</Text></Card>)}</View><Button label={t('routes.create_your_own_event')} color={C.clean} onPress={()=>router.replace('/handeln')}/></Screen>;
  if(!event)return <Screen tabBar={false}><Header title={t('routes.clean_frankfurt')}/><Text style={T.body}>{t('updates.eventMissing')}</Text></Screen>;
  return <Screen tabBar={false}><Header title={l(event.title)} subtitle={event.district} color={C.clean}/><View style={{height:200,borderRadius:22,overflow:'hidden',marginBottom:14}}><Map center={event} userLocation={loc} spanKm={1.6} circles={[{...event,radius:event.radiusM,color:C.clean}]} markers={[{...event,color:C.clean,emoji:'🤝'}]}/></View>
    <Card style={{gap:12,marginBottom:14}}><Text style={T.h3}>{new Date(event.start).toLocaleString(locale)}</Text><Text style={T.body}>{l(event.description)}</Text><Text style={T.small}>{l(event.material)}</Text><Button label={t('routes.directions')} color={C.clean} variant="soft" onPress={()=>openRoute(event.lat,event.lon,event.title)}/></Card>
    {!joinedCleanups.includes(event.id)?<><Text style={[T.body,{marginBottom:12}]}>{t('updates.joinHint')}</Text><Button label={t('routes.join')} color={C.clean} onPress={()=>joinCleanup(event.id)}/></>:<CleanupProof key={event.id} id={event.id} embedded/>}
  </Screen>;
}
