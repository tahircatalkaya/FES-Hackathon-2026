import React from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Chameleon from '@/components/Chameleon';
import { Screen } from '@/components/Screen';
import EntryAccount from '@/components/EntryAccount';
import { useStore } from '@/store';
import { C } from '@/theme';
export default function Anmelden(){
  const router=useRouter();const params=useLocalSearchParams<{register?:string}>();
  return <Screen tabBar={false}><View style={{alignItems:'center',marginVertical:20}}><Chameleon pose="hello" size={150}/></View><EntryAccount initialRegister={params.register==='1'} color={C.info} onReady={()=>{useStore.getState().setOnboarded(true);router.replace('/(tabs)');}}/></Screen>;
}
