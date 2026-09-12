import { useT, useLocalize } from '@/i18n/useT';
import React, { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { Button, Card, T } from './ui';
import { trust } from '@/api/trust';
import { C } from '@/theme';

/** Same account for reservations, returns and reputation; no second account per partner. */
export default function TrustAccount({onReady,color=C.food}:{onReady:()=>void;color?:string}) {
  const t = useT();
  const localize = useLocalize();
  const [name,setName]=useState(''),[password,setPassword]=useState(''),[register,setRegister]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const field={backgroundColor:C.bg,borderRadius:12,padding:14,fontSize:16,color:C.ink};
  async function submit() {if(busy)return;setBusy(true);setError('');try{await trust.login(name.trim(),password,register);setPassword('');onReady();}catch(e:any){setError(e.message);}finally{setBusy(false);}}
  return <Card style={{gap:12}}><Text style={T.h2}>{register?t('components.account.createTitle'):t('components.account.once')}</Text><Text style={T.body}>{t('components.account.explainer')}</Text>
    <TextInput accessibilityLabel={t('components.account.username')} placeholder={t('components.account.username')} value={name} onChangeText={setName} autoCapitalize="none" autoCorrect={false} maxLength={24} style={field}/>
    <TextInput accessibilityLabel={t('components.account.password')} placeholder={t('components.account.passwordHint')} value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" maxLength={128} style={field}/>
    {!!error&&<Text accessibilityRole="alert" style={[T.body,{color:C.danger}]}>{localize(error)}</Text>}
    <Button label={busy?t('components.account.connecting'):register?t('components.account.create'):t('components.account.signIn')} color={color} disabled={busy||name.trim().length<3||password.length<10} onPress={()=>void submit()}/>
    <Button label={register?t('components.account.have'):t('components.account.new')} color={color} variant="ghost" disabled={busy} onPress={()=>setRegister(!register)}/>
    <Text style={T.small}>{t('components.account.passwordNotice')}</Text>
  </Card>;
}
