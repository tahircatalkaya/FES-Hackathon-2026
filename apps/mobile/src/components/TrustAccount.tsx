import React, { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { Button, Card, T } from './ui';
import { trust } from '@/api/trust';
import { C } from '@/theme';

/** Same account for reservations, returns and reputation; no second account per partner. */
export default function TrustAccount({onReady,color=C.food}:{onReady:()=>void;color?:string}) {
  const [name,setName]=useState(''),[password,setPassword]=useState(''),[register,setRegister]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const field={backgroundColor:C.bg,borderRadius:12,padding:14,fontSize:16,color:C.ink};
  async function submit() {if(busy)return;setBusy(true);setError('');try{await trust.login(name.trim(),password,register);setPassword('');onReady();}catch(e:any){setError(e.message);}finally{setBusy(false);}}
  return <Card style={{gap:12}}><Text style={T.h2}>{register?'Deinen Zugang anlegen':'Einmal anmelden'}</Text><Text style={T.body}>Ein Zugang für Abholungen, Rückgaben und Bewertungen. Dein Foodsharing-Zugang aus Mainsam funktioniert auch hier.</Text>
    <TextInput accessibilityLabel="Benutzername" placeholder="Benutzername" value={name} onChangeText={setName} autoCapitalize="none" autoCorrect={false} maxLength={24} style={field}/>
    <TextInput accessibilityLabel="Passwort" placeholder="Passwort · mindestens 10 Zeichen" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" maxLength={128} style={field}/>
    {!!error&&<Text accessibilityRole="alert" style={[T.body,{color:C.danger}]}>{error}</Text>}
    <Button label={busy?'Verbinde…':register?'Zugang anlegen':'Anmelden'} color={color} disabled={busy||name.trim().length<3||password.length<10} onPress={()=>void submit()}/>
    <Button label={register?'Ich habe bereits einen Zugang':'Neuen Zugang anlegen'} color={color} variant="ghost" disabled={busy} onPress={()=>setRegister(!register)}/>
    <Text style={T.small}>Ohne E-Mail und Telefonnummer. Bitte dein Passwort aufbewahren; eine Wiederherstellung ist noch nicht eingerichtet.</Text>
  </Card>;
}
