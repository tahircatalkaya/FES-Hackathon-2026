import React from 'react';
import { Linking, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header } from '@/components/Screen';
import FoodsharingLogo from '@/components/FoodsharingLogo';
import { Button, Card, T } from '@/components/ui';
import { C, CONTEXT } from '@/theme';
import { useStore } from '@/store';
const col = CONTEXT.food.color;

export default function Saver() {
  const router = useRouter();
  const quizDone = useStore(s => s.quizDone.includes('q3'));
  return <Screen tabBar={false}>
    <Header title="Lebensmittel weitergeben" right={<FoodsharingLogo width={76} />} />
    <Card style={{ gap: 12, backgroundColor: '#EAF3E6' }}>
      <Text style={T.h1}>Teilen mit Verlässlichkeit.</Text>
      <Text style={T.body}>Stelle faire Portionen zusammen, vergib ein Zeitfenster und entscheide selbst über Anfragen. Bestätigt wird erst bei der tatsächlichen Übergabe.</Text>
      <Button label="Verteilung anlegen" color={col} onPress={() => router.push({ pathname: '/uebergaben', params: { create: '1' } })} />
      <Button label="Meine Übergaben & Bewertungen" color={col} variant="soft" onPress={() => router.push('/uebergaben')} />
    </Card>
    <View style={{ marginTop: 18, gap: 12 }}>
      <Text style={T.h2}>Bei Betrieben retten</Text>
      <Text style={T.body}>Die Freigabe als Foodsaver erfolgt durch foodsharing. Eine App-Eingabe oder ein bestandenes Quiz allein erteilt keine Berechtigung zur Betriebsabholung.</Text>
      <Card style={{ gap: 10 }}><Text style={T.h3}>1. Lebensmittel sicher teilen</Text><Text style={T.body}>{quizDone ? 'Du hast das Lernkapitel in Mainsam abgeschlossen.' : 'Lerne die Regeln zu Hygiene und Fairteilern kennen.'}</Text><Button label={quizDone ? 'Kapitel wiederholen' : 'Lernkapitel öffnen'} color={col} variant="soft" onPress={() => router.push('/quiz/q3')} /></Card>
      <Card style={{ gap: 8 }}><Text style={T.h3}>2. Einführung & Freigabe</Text><Text style={T.body}>Einführungsabholungen und Freigaben müssen von den zuständigen Personen bestätigt werden. Du kannst sie hier nicht selbst freischalten.</Text></Card>
      <Button label="Bei foodsharing informieren" color={C.ink} variant="ghost" onPress={() => void Linking.openURL('https://foodsharing.de/')} />
    </View>
  </Screen>;
}
