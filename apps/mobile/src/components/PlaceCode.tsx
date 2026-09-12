import React, { useState } from 'react';
import { Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Button, T } from './ui';
/** Public location/offer link. It selects a destination; it never awards points. */
export default function PlaceCode({value,label}:{value:string;label:string}) {
  const [open,setOpen]=useState(false);
  return <View style={{gap:8}}><Button label={open?'QR ausblenden':label} icon="qr-code" variant="soft" onPress={()=>setOpen(!open)}/>{open&&<View style={{alignItems:'center',gap:10,padding:12,backgroundColor:'#fff',borderRadius:18}}><View accessible accessibilityLabel={label}><QRCode value={value} size={180}/></View><Text selectable style={T.small}>{value}</Text><Text style={[T.small,{textAlign:'center'}]}>In Mainsam unter „Ort scannen“ öffnen. Dieser QR führt zum Ort oder Angebot; Punkte gibt es erst mit einer bestätigten Aktion.</Text></View>}</View>;
}
