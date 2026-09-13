import React, { useCallback, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { trust } from '@/api/trust';
import { CLEANUPS } from '@/data/mock';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { Button, Card, T, Tag } from './ui';
import { Screen, Header } from './Screen';
import ProofCode from './ProofCode';
import QrCamera from './QrCamera';
import { useFocusRefresh } from '@/hooks/useFocusRefresh';
import { C } from '@/theme';
import { useT, useLocalize } from '@/i18n/useT';
export default function CleanupProof({id,embedded=false,initialProof=''}:{id:string;embedded?:boolean;initialProof?:string}) {
  const t=useT(),l=useLocalize(),own=useStore(s=>s.ownCleanups),activity=[...own,...CLEANUPS].find(c=>c.id===id);
  const [eventId,setEventId]=useState(''),[ticket,setTicket]=useState<{proof:string;expiresAt:number}|null>(null),[confirmed,setConfirmed]=useState(false),[scanning,setScanning]=useState(!id),[raw,setRaw]=useState(initialProof),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const camera=useCameraPermissions();
  const currentId=useRef(''),lastConfirmed=useRef<boolean|null>(null),loading=useRef(false);
  const [title,setTitle]=useState('');
  function applyState(state:{id:string;event:any;confirmed:boolean}){currentId.current=state.id;setEventId(state.id);setConfirmed(state.confirmed);setTitle(state.event.title);}
  async function syncAward(notify=false){const me=await trust.me();useStore.getState().syncFoodAwards(me.awards);const a=me.awards.find(a=>a.key===`trust:cleanup:${currentId.current}:${me.user.id}`);if(a&&notify)useUI.getState().showToast(a);}
  const load=useCallback(async()=>{
    if(loading.current||(!activity&&!initialProof&&!currentId.current))return;loading.current=true;
    try{
      if(!await trust.hasSession())return;
      const state=currentId.current?await trust.cleanup(currentId.current):activity?await trust.cleanupJoin(activity):await trust.cleanupResolve(initialProof);
      applyState(state);await syncAward(lastConfirmed.current===false&&state.confirmed);lastConfirmed.current=state.confirmed;setError('');
    }catch(e:any){setError(e.message);}finally{loading.current=false;}
  },[id,initialProof]);
  useFocusRefresh(load);
  async function position(){const p=await Location.requestForegroundPermissionsAsync();if(p.status!=='granted')throw new Error(t('updates.locationNeeded'));const at=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});return {lat:at.coords.latitude,lon:at.coords.longitude,accuracy:at.coords.accuracy??999,at:at.timestamp};}
  async function run(scan=false){
    if(busy)return;setBusy(true);setError('');
    try{
      if(!await trust.hasSession())return;
      if(scan&&!currentId.current){const state=await trust.cleanupResolve(raw.trim());applyState(state);lastConfirmed.current=state.confirmed;await syncAward();return;}
      const pos=await position();
      if(!scan)setTicket(await trust.cleanupTicket(currentId.current,pos));
      else{await trust.cleanupConfirm(currentId.current,raw.trim(),pos);setConfirmed(true);setScanning(false);lastConfirmed.current=true;await syncAward(true);}
    }catch(e:any){setError(e.message);}finally{setBusy(false);}
  }
  const body=<View style={{gap:12}}>
    <Card style={{gap:12}}><Tag label={confirmed?t('updates.participationConfirmed'):t('updates.registeredNoPoints')} color={confirmed?C.success:C.clean}/><Text style={T.body}>{t('updates.cleanupHow')}</Text>
      {!!title&&<Text style={T.h3}>{l(title)}</Text>}
      {eventId&&<Button label={t('updates.showMyQr')} color={C.clean} disabled={busy||!eventId} onPress={()=>void run()}/>}
      {ticket&&<ProofCode {...ticket} label={t('updates.showMyQr')}/>}
      {!!eventId&&!confirmed&&<Button label={t('updates.scanPeer')} color={C.clean} variant="soft" disabled={!eventId} onPress={()=>setScanning(!scanning)}/>}
      {scanning&&!confirmed&&<View style={{gap:12}}><QrCamera camera={camera} label={t('updates.camera')} height={230} radius={18} onScan={value=>{if(!raw)setRaw(value);}}/><TextInput accessibilityLabel={t('components.scan.code')} value={raw} onChangeText={setRaw} placeholder="mainsam:cleanup:…" autoCapitalize="none" maxLength={200} style={{padding:12,borderRadius:12,backgroundColor:C.bg,color:C.ink}}/><Button label={eventId?t('updates.confirmHere'):t('routes.check')} color={C.clean} disabled={busy||!raw.trim()} onPress={()=>void run(true)}/></View>}
      {!!error&&<><Text accessibilityRole="alert" style={[T.body,{color:C.danger}]}>{l(error)}</Text>{!eventId&&<Button label={t('components.common.reload')} onPress={()=>void load()}/>}</>}
    </Card>
  </View>;
  return embedded?body:<Screen tabBar={false}><Header title={activity?l(activity.title):t('updates.scanPeer')}/>{body}</Screen>;
}
