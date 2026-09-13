import React, { useState } from 'react';
import { Text } from 'react-native';
import { Button, Card, T } from './ui';
import { trust } from '@/api/trust';
import { C } from '@/theme';
/** Connection recovery only. Credentials are requested exclusively at app entry. */
export default function TrustAccount({onReady,color=C.food}:{onReady:()=>void;color?:string}) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  return <Card style={{gap:12}}><Text style={T.h2}>Verbindung wiederherstellen</Text><Text style={T.body}>Dein Zugang gilt für die ganze App. Prüfe, ob Handy und Server verbunden sind.</Text>{!!error&&<Text accessibilityRole="alert" style={{color:C.danger}}>{error}</Text>}<Button label={busy?'Verbinde…':'Erneut verbinden'} color={color} disabled={busy} onPress={()=>{setBusy(true);void trust.hasSession().then(async ok=>{if(ok){await trust.me();onReady();}}).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}/></Card>;
}
