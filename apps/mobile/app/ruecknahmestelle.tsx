import { useT, useLocalize } from '@/i18n/useT';
import React, { useCallback, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen, Header } from '@/components/Screen';
import { Button, Card, Pill, Row, T, Tag } from '@/components/ui';
import TrustAccount from '@/components/TrustAccount';
import ProofCode from '@/components/ProofCode';
import { DAMAGE } from '@/components/ReuseInventory';
import { trust, reuseTrust, type TrustProfile, type ReuseLoan } from '@/api/trust';
import { parseContainerCode } from '@/api/vytal';
import { C } from '@/theme';
export default function ReturnDesk() {
  const rt = useT();
  const localize = useLocalize();
  const [profile,setProfile]=useState<TrustProfile|null>(null),[ready,setReady]=useState(false),[store,setStore]=useState(''),[code,setCode]=useState(''),[loan,setLoan]=useState<ReuseLoan|null>(null),[receipt,setReceipt]=useState<Awaited<ReturnType<typeof reuseTrust.receipt>>|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const load=useCallback(async()=>{try{if(await trust.hasSession()){const me=await trust.me();setProfile(me);setStore(me.merchantStores[0]?.id||'');}}catch(e:any){setError(e.message);}finally{setReady(true);}},[]);
  useFocusEffect(useCallback(()=>{void load();},[load]));
  async function run(action:()=>Promise<void>){if(busy)return;setBusy(true);setError('');try{await action();}catch(e:any){setError(e.message);}finally{setBusy(false);}}
  return <Screen tabBar={false}><Header title={rt('routes.return_station')} subtitle={rt('routes.for_authorised_staff')} color={C.reuse}/>
    {!!error&&<Text accessibilityRole="alert" style={[T.body,{color:C.danger,marginBottom:12}]}>{localize(error)}</Text>}
    {!ready?<Text>{rt('routes.loading')}</Text>:!profile?<TrustAccount color={C.reuse} onReady={()=>void load()}/>:!profile.merchantStores.length?<Card><Text style={T.h2}>{rt('routes.no_return_station_authorised_yet')}</Text><Text style={T.body}>{rt('routes.the_operators_must_assign_this_account_to_a_return_station_users_')}</Text></Card>:<View style={{gap:12}}>
      <Row style={{flexWrap:'wrap'}}>{profile.merchantStores.map(s=><Pill key={s.id} label={s.name} color={C.reuse} active={s.id===store} onPress={()=>{setStore(s.id);setLoan(null);setReceipt(null);}}/>)}</Row>
      <Card style={{gap:12}}><Text style={T.h2}>{rt('routes.1_receive_container')}</Text><Text style={T.body}>{rt('routes.enter_the_code_on_the_container_or_read_it_with_a_connected_scann')}</Text>
        <TextInput accessibilityLabel={rt('routes.container_code_at_return_station')} placeholder={rt('routes.code_on_cup_or_bowl')} value={code} onChangeText={v=>{setCode(v);setLoan(null);setReceipt(null);}} autoCapitalize="characters" style={{padding:14,backgroundColor:C.bg,borderRadius:12,fontSize:16}}/>
        <Button label={rt('routes.check_container')} color={C.reuse} disabled={busy||!code.trim()} onPress={()=>void run(async()=>{const parsed=parseContainerCode(code);if(!parsed)throw new Error('Kein gültiger Behältercode.');setLoan(await reuseTrust.inspect(parsed.code,store));setReceipt(null);})}/>
      </Card>
      {loan&&<Card style={{gap:12}}><Text style={T.h2}>{rt('routes.2_confirm_receipt')}</Text><Text style={T.h3}>{loan.kind==='cup'?rt('routes.cup'):rt('routes.bowl')} {loan.code}</Text>{loan.damage?<><Tag label={rt('routes.damage_reported')} color={C.warn}/><Text style={T.body}>{localize(DAMAGE[loan.damage.reason])}{loan.damage.note?` · ${loan.damage.note}`:''}</Text><Text style={T.small}>{rt('routes.keep_damaged_containers_separate_and_follow_your_return_rules')}</Text></>:<Text style={T.small}>{rt('routes.no_damage_reported_in_mainsam')}</Text>}
        <Button label={rt('routes.container_received_issue_return_qr')} color={C.reuse} disabled={busy} onPress={()=>void run(async()=>setReceipt(await reuseTrust.receipt(loan.id,store)))}/>
      </Card>}
      {receipt&&<><ProofCode proof={receipt.proof} expiresAt={receipt.expiresAt} label={rt('routes.return_value_value', { p1: receipt.loan.code, p2: receipt.storeName })}/><Text style={T.body}>{rt('routes.the_person_returning_the_container_scans_this_code_in_their_retur')}</Text><Button label={rt('routes.next_container')} variant="soft" color={C.reuse} onPress={()=>{setCode('');setLoan(null);setReceipt(null);}}/></>}
      <Text style={T.small}>{rt('routes.this_receipt_confirms_the_return_in_mainsam_a_connection_to_the_p')}</Text>
    </View>}
  </Screen>;
}
