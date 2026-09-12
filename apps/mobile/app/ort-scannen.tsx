import React, { useRef, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Screen, Header } from '@/components/Screen';
import { Button, Card, T } from '@/components/ui';
import { C } from '@/theme';
import points from '@/data/fairteiler.json';
import stores from '@/data/vytal-stores.json';
export default function PlaceScanner(){
  const router=useRouter();const [permission,request]=useCameraPermissions();const [raw,setRaw]=useState(''),[error,setError]=useState('');const lock=useRef(false);
  function scan(value:string){if(lock.current)return;setRaw(value);setError('');
    const m=value.trim().match(/^mainsam:(shelf|offer|provider|store):([a-zA-Z0-9_-]+)$/);
    if(!m){setError('Bitte den Mainsam-QR am Regal, Verteiler oder Restaurant scannen. Persönliche Übergabecodes öffnest du in deiner Übergabe.');return;}
    if(m[1]==='shelf'&&!points.some(p=>String(p.id)===m[2])||m[1]==='store'&&!stores.some(s=>s.id===m[2])){setError('Dieser Ort ist nicht bekannt.');return;}
    if(['offer','provider'].includes(m[1])&&!/^[a-f0-9-]{36}$/.test(m[2])){setError('Ungültiger Angebotscode.');return;}
    lock.current=true;
    if(m[1]==='shelf')router.replace({pathname:'/fairteiler/[id]',params:{id:m[2],scanned:'1'}});
    else if(m[1]==='store')router.replace({pathname:'/rueckgabe',params:{store:m[2]}});
    else router.replace({pathname:'/uebergaben',params:{[m[1]]:m[2]}});
  }
  return <Screen tabBar={false}><Header title="Ort scannen" subtitle="Regal · Verteiler · Restaurant"/><Text style={[T.body,{marginBottom:14}]}>Scanne den QR vor Ort und wähle, was du machen möchtest.</Text>
    {Platform.OS!=='web'&&(permission?.granted?<View style={{height:280,borderRadius:20,overflow:'hidden'}}><CameraView style={{flex:1}} barcodeScannerSettings={{barcodeTypes:['qr']}} onBarcodeScanned={e=>scan(e.data)}/></View>:<Button label="Kamera zum Scannen freigeben" onPress={()=>void request()}/>)}
    <Card style={{gap:12,marginTop:14}}><Text style={T.h3}>Oder den QR-Text eingeben</Text><TextInput accessibilityLabel="Ort-Code" placeholder="mainsam:shelf:…" value={raw} onChangeText={setRaw} autoCapitalize="none" autoCorrect={false} maxLength={200} style={{padding:14,backgroundColor:C.bg,borderRadius:12}}/><Button label="Ort öffnen" disabled={!raw.trim()} onPress={()=>scan(raw)}/>{!!error&&<Text accessibilityRole="alert" style={{color:C.danger}}>{error}</Text>}<Text style={T.small}>Ein erneuter Scan öffnet denselben Ort. Er erzeugt keine Punkte.</Text></Card>
  </Screen>;
}
