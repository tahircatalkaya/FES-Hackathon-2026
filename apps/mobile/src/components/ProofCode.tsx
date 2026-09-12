import { useT, useLocalize } from '@/i18n/useT';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button, T } from './ui';
import { C } from '@/theme';
export default function ProofCode({proof,code,expiresAt,label}:{proof:string;code?:string;expiresAt:number;label:string}) {
  const t = useT();
  const localize = useLocalize();
  const [now,setNow]=useState(Date.now()),[manual,setManual]=useState(false);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  if(now>=expiresAt)return <Text accessibilityRole="alert" style={[T.body,{color:C.warn}]}>{t('components.proof.expired')}</Text>;
  return <View style={{alignItems:'center',gap:10,padding:14,backgroundColor:'#fff',borderRadius:18}}>
    <Text style={[T.h3,{textAlign:'center'}]}>{localize(label)}</Text>
    <View accessible accessibilityLabel={localize(label)} style={{padding:12,backgroundColor:'#fff'}}><QRCode value={proof} size={190}/></View>
    {code&&<><Text style={T.small}>Ohne Kamera: diese vier Ziffern nennen</Text><Text selectable accessibilityLabel={`Übergabecode ${code}`} style={{fontSize:36,fontWeight:'900',letterSpacing:10,color:C.ink}}>{code}</Text></>}
    <Text style={T.small}>{t('components.proof.valid', { seconds: Math.ceil((expiresAt-now)/1000) })}</Text>
    <Button label={manual?t('components.proof.hide'):t('components.proof.show')} variant="ghost" onPress={()=>setManual(!manual)} style={{paddingHorizontal:8}}/>
    {manual&&<Text selectable style={[T.small,{width:'100%'}]}>{proof}</Text>}
  </View>;
}
