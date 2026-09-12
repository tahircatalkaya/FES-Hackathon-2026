import { Platform } from 'react-native';
import { useStore } from '@/store';
import { localizeText } from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Lokale Erinnerung (z. B. Vytal-Rückgabe). In Expo Go/Web nur In-App-Postfach; im Build zusätzlich System-Notification. */
export async function remind(title: string, body: string, ctx: string, inSeconds?: number) {
  const s = useStore.getState();
  s.notify({ title, body, ctx });
  if (!s.privacy.notifications || Platform.OS === 'web') return;
  const h = new Date().getHours();
  if (s.privacy.quietHours && (h >= 22 || h < 7) && !inSeconds) return; // Ruhezeit
  try {
    const N = require('expo-notifications');
    await N.requestPermissionsAsync();
    await N.scheduleNotificationAsync({ content: { title: localizeText(s.lang, title), body: localizeText(s.lang, body) }, trigger: inSeconds ? { seconds: inSeconds } : null });
  } catch { /* Expo Go ohne Notification-Modul */ }
}

export async function scheduleReturnReminder(loanId:string,code:string,borrowedAt:number) {
  const key=`mainsam.return-reminder.${loanId}`;
  if(await AsyncStorage.getItem(key))return;
  useStore.getState().notify({title:'Mehrweg-Ausleihe erfasst',body:`${code}: Rückgabe beim Personal bestätigen lassen und den Rückgabe-QR scannen.`,ctx:'reuse'});
  const ids:string[]=[];
  if(Platform.OS!=='web'&&useStore.getState().privacy.notifications) {
    try {
      const N=require('expo-notifications');const permission=await N.requestPermissionsAsync();
      if(permission.granted) for(const [hours,title] of [[36,'Dein Mehrwegbehälter kann zurück'],[13*24,'An deine Mehrweg-Rückgabe denken']] as const) {
        const seconds=Math.ceil((borrowedAt+hours*3600000-Date.now())/1000);
        if(seconds>0)ids.push(await N.scheduleNotificationAsync({content:{title:localizeText(useStore.getState().lang,title),body:localizeText(useStore.getState().lang,`${code}: Behälter beim Personal abgeben und Rückgabe-QR scannen.`),data:{loanId}},trigger:{type:N.SchedulableTriggerInputTypes.TIME_INTERVAL,seconds}}));
      }
    }catch{/* In Expo Go the in-app history remains available. */}
  }
  await AsyncStorage.setItem(key,JSON.stringify(ids));
}
export async function cancelReturnReminder(loanId:string) {
  const key=`mainsam.return-reminder.${loanId}`;
  try{const ids=JSON.parse(await AsyncStorage.getItem(key)||'[]');if(Platform.OS!=='web'){const N=require('expo-notifications');await Promise.all(ids.map((id:string)=>N.cancelScheduledNotificationAsync(id)));}await AsyncStorage.setItem(key,'[]');}catch{}
}
