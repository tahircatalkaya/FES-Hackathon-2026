import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button, T } from './ui';
import { C } from '@/theme';
export default function ProofCode({proof,code,expiresAt,label}:{proof:string;code?:string;expiresAt:number;label:string}) {
  const [now,setNow]=useState(Date.now()),[manual,setManual]=useState(false);
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  if(now>=expiresAt)return <Text accessibilityRole="alert" style={[T.body,{color:C.warn}]}>Code abgelaufen. Bitte einen neuen anzeigen lassen.</Text>;
  return <View style={{alignItems:'center',gap:10,padding:14,backgroundColor:'#fff',borderRadius:18}}>
    <Text style={[T.h3,{textAlign:'center'}]}>{label}</Text>
    <View accessible accessibilityLabel={label} style={{padding:12,backgroundColor:'#fff'}}><QRCode value={proof} size={190}/></View>
    {code&&<><Text style={T.small}>Ohne Kamera: diese vier Ziffern nennen</Text><Text selectable accessibilityLabel={`Übergabecode ${code}`} style={{fontSize:36,fontWeight:'900',letterSpacing:10,color:C.ink}}>{code}</Text></>}
    <Text style={T.small}>Noch {Math.ceil((expiresAt-now)/1000)} Sekunden gültig · nur einmal nutzbar</Text>
    <Button label={manual?'Textcode ausblenden':'Ohne Kamera: Textcode anzeigen'} variant="ghost" onPress={()=>setManual(!manual)} style={{paddingHorizontal:8}}/>
    {manual&&<Text selectable style={[T.small,{width:'100%'}]}>{proof}</Text>}
  </View>;
}
