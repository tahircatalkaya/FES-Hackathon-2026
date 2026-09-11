import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, Header } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import { Appear, Button, Card, Divider, Row, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore, balance } from '@/store';
import { useUI } from '@/store/ui';
import { REWARDS } from '@/data/mock';

const col = CONTEXT.home.color;

export default function Rewards() {
  const s = useStore();
  const { setCtx } = useUI();
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => { setCtx('home'); }, []);
  const bal = balance(s);
  const nextDraw = new Date(); nextDraw.setMonth(nextDraw.getMonth() + 1, 1); nextDraw.setHours(12, 0, 0, 0);

  return (
    <Screen tabBar={false}>
      <Header title="Belohnungen" subtitle="Schwellen für alle, Lose statt Rang" color={col} />
      <Appear>
        <Card style={{ backgroundColor: col }}>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={[T.label, { color: '#ffffffaa' }]}>Guthaben</Text>
              <Text style={{ fontSize: 40, fontWeight: '900', color: '#fff' }}>{bal} 🍃</Text>
              <Text style={[T.small, { color: '#ffffffcc' }]}>Punkte verfallen nicht. Wochenziele resetten.</Text>
            </View>
            <Chameleon color="#fff" size={96} branch={false} mood="excited" />
          </Row>
        </Card>
      </Appear>

      <Appear delay={60}>
        <Card style={{ marginTop: 14, borderWidth: 2, borderColor: C.gold }}>
          <Row style={{ justifyContent: 'space-between' }}><Text style={T.h3}>🎟️ Deutschlandticket-Verlosung</Text><Tag label={`${s.lose} Lose`} color={C.gold} /></Row>
          <Text style={[T.body, { marginTop: 6 }]}>Jede Woche mit erreichtem Wochenziel gibt ein Los, maximal vier im Monat. Verlost wird ein Deutschlandticket am {nextDraw.toLocaleDateString('de-DE', { day: '2-digit', month: 'long' })}.</Text>
          <Text style={[T.small, { marginTop: 6 }]}>Warum Lose: Die Aufgabe verlangt, nicht nur die Besten zu belohnen. Wer zehnmal mehr Punkte sammelt, hat trotzdem maximal vier Lose. Verlässlichkeit zählt, Menge nicht.</Text>
        </Card>
      </Appear>

      <Text style={[T.h2, { marginTop: S.xl }]}>Einlösen</Text>
      <Text style={T.small}>Alles hier ist für alle erreichbar, unabhängig vom Platz. Einlösung ist Demo.</Text>
      <View style={{ marginTop: 10, gap: 10 }}>
        {REWARDS.map((r, i) => {
          const ok = bal >= r.cost;
          return (
            <Appear key={r.id} delay={100 + i * 50}>
              <Card style={{ opacity: ok ? 1 : 0.7 }}>
                <Row>
                  <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 26 }}>{r.emoji}</Text></View>
                  <View style={{ flex: 1 }}><Text style={T.h3}>{r.title}</Text><Text style={T.small}>{r.desc}</Text><Tag label={r.partner} color={col} /></View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: '900', fontSize: 18, color: ok ? C.success : C.muted }}>{r.cost}</Text>
                    <Button label={ok ? 'Einlösen' : `noch ${r.cost - bal}`} color={col} variant={ok ? 'solid' : 'soft'} disabled={!ok} onPress={() => { if (s.redeem({ title: r.title, cost: r.cost })) { haptic('success'); setMsg(`${r.title} eingelöst. Code kommt ins Postfach.`); s.notify({ title: 'Eingelöst', body: `${r.title}: Dein Code MAIN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`, ctx: 'home' }); } }} style={{ paddingVertical: 8, paddingHorizontal: 12, marginTop: 4 }} />
                  </View>
                </Row>
              </Card>
            </Appear>
          );
        })}
      </View>
      {msg && <Card style={{ marginTop: 12, backgroundColor: C.success + '15' }}><Text style={[T.body, { color: C.success, fontWeight: '700' }]}>{msg}</Text></Card>}
      {s.redemptions.length > 0 && (<><Divider /><Text style={T.label}>Bereits eingelöst</Text>{s.redemptions.map((r) => <Text key={r.id} style={[T.small, { marginTop: 4 }]}>{new Date(r.at).toLocaleDateString('de-DE')} · {r.title} · −{r.cost}</Text>)}</>)}
    </Screen>
  );
}
