import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { trust, reuseTrust, type ReuseLoan } from '@/api/trust';
import { parseContainerCode } from '@/api/vytal';
import { scheduleReturnReminder } from '@/api/notify';
import { syncReuse } from './ReuseInventory';
import { Screen, Header } from './Screen';
import { Button, Card, T } from './ui';
import { C } from '@/theme';
import { useT, useLocalize } from '@/i18n/useT';
import QrCamera from './QrCamera';

export default function BorrowScanner(){
  const t=useT(),l=useLocalize(),router=useRouter(),params=useLocalSearchParams<{store?:string}>();
  const camera=useCameraPermissions();
  const [manual,setManual]=useState(Platform.OS==='web'),[code,setCode]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loan,setLoan]=useState<ReuseLoan|null>(null);
  const locked=useRef(false);
  useEffect(()=>{void trust.hasSession().catch(()=>{});},[]);
  async function scan(raw:string){
    if(locked.current)return;locked.current=true;setBusy(true);setError('');
    try{
      const parsed=parseContainerCode(raw);if(!parsed)throw new Error(t('updates.invalidContainer'));
      if(!await trust.hasSession())return;
      const result=await reuseTrust.borrow({...parsed,storeId:params.store});setLoan(result);
      // The loan is already saved even when a reminder or subsequent refresh fails.
      await Promise.allSettled([syncReuse(),scheduleReturnReminder(result.id,result.code,result.borrowedAt)]);
    }catch(e:any){setError(l(e.message));}finally{setBusy(false);}
  }
  function retry(){locked.current=false;setError('');setCode('');setLoan(null);}
  return <Screen tabBar={false}><Header title={t('updates.borrowTitle')} color={C.reuse}/>
    {loan?<Card style={{gap:14}}><Text style={T.h2}>{t('updates.borrowed')}</Text><Text style={T.body}>{loan.code} · {loan.storeName}</Text><Button label={t('updates.nextContainer')} color={C.reuse} onPress={retry}/><Button label={t('components.common.close')} variant="soft" color={C.reuse} onPress={()=>router.replace('/mehrweg')}/></Card>:<View style={{gap:14}}>
      <Text style={T.body}>{t('updates.borrowHint')}</Text>
      {!error&&<QrCamera camera={camera} label={t('updates.camera')} color={C.reuse} onScan={value=>void scan(value)}/>}
      {!!error&&<Card style={{gap:12}}><Text accessibilityRole="alert" style={[T.body,{color:C.danger}]}>{error}</Text><Button label={t('updates.nextContainer')} color={C.reuse} onPress={retry}/></Card>}
      {!manual&&!error&&<Button label={t('updates.typeCode')} color={C.reuse} variant="soft" onPress={()=>setManual(true)}/>}
      {manual&&!error&&<Card style={{gap:12}}><TextInput accessibilityLabel={t('components.scan.code')} placeholder={t('routes.eg_b7k2m9qx')} value={code} onChangeText={setCode} autoCapitalize="characters" autoCorrect={false} maxLength={200} onSubmitEditing={()=>{if(code.trim())void scan(code);}} style={{padding:14,backgroundColor:C.bg,borderRadius:12,fontSize:17,color:C.ink}}/><Button label={busy?t('components.common.saving'):t('updates.borrowTitle')} color={C.reuse} disabled={busy||!code.trim()} onPress={()=>void scan(code)}/></Card>}
    </View>}
  </Screen>;
}
