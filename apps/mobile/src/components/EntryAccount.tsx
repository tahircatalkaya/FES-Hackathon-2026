import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, T } from './ui';
import { trust } from '@/api/trust';
import { useStore } from '@/store';
import { C } from '@/theme';

/** The only credential form: shown at app entry, never inside partner flows. */
export default function EntryAccount({initialRegister=false,onReady,color=C.ink}:{initialRegister?:boolean;onReady:()=>void;color?:string}) {
  const [register,setRegister]=useState(initialRegister),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const field={backgroundColor:'#fff',borderRadius:14,padding:15,fontSize:16,color:C.ink,borderWidth:1,borderColor:C.line};
  const valid=password.length>=10&&(register?/^[a-z0-9._-]{3,24}$/i.test(name)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email):name.trim().length>=3);
  async function submit(){if(busy||!valid)return;setBusy(true);setError('');try{await trust.login(name.trim(),password,register,email.trim());setPassword('');onReady();}catch(e:any){setError(e.message);}finally{setBusy(false);}}
  return <View style={{gap:12}}>
    <Text style={T.h1}>{register?'Dein Mainsam-Zugang':'Willkommen zurück'}</Text>
    <Text style={T.body}>Einmal anmelden, überall mitmachen. Öffentlich sichtbar sind nur Benutzername und ID.</Text>
    <TextInput accessibilityLabel={register?'Benutzername':'E-Mail oder Benutzername'} placeholder={register?'Benutzername':'E-Mail oder Benutzername'} value={name} onChangeText={setName} autoCapitalize="none" autoCorrect={false} autoComplete="username" maxLength={register?24:254} style={field}/>
    {register&&<TextInput accessibilityLabel="E-Mail" placeholder="E-Mail" value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" maxLength={254} style={field}/>}
    <TextInput accessibilityLabel="Passwort" placeholder="Passwort · mindestens 10 Zeichen" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete={register?'new-password':'current-password'} maxLength={128} onSubmitEditing={()=>void submit()} style={field}/>
    {!!error&&<Text accessibilityRole="alert" style={[T.body,{color:C.danger}]}>{error}</Text>}
    <Button label={busy?'Verbinde…':register?'Los geht’s':'Anmelden'} color={color} disabled={busy||!valid} onPress={()=>void submit()}/>
    <Button label={register?'Ich habe bereits einen Zugang':'Neuen Zugang anlegen'} color={color} variant="ghost" disabled={busy} onPress={()=>{setRegister(!register);setError('');}}/>
    <Button label="Ohne Anmeldung weiter" color={color} variant="soft" disabled={busy} onPress={()=>{setBusy(true);void trust.guest().then(()=>{useStore.getState().syncFoodAwards([]);useStore.getState().syncContainers([]);onReady();}).catch(e=>setError(e.message)).finally(()=>setBusy(false));}}/>
    <Text style={T.small}>Als Gast kannst du Essen teilen und abholen, Regale melden und Rückgabebelege nutzen. Ohne Registrierung gibt es keine einlösbaren Übergabepunkte. Ein Gastzugang bleibt nur auf diesem Gerät verfügbar.</Text>
    {register&&<Text style={T.small}>E-Mail und Passwort bleiben privat. Die E-Mail wird noch nicht verifiziert; Passwort-Wiederherstellung ist noch nicht eingerichtet.</Text>}
  </View>;
}
