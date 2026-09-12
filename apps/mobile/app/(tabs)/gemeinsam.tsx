import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear, Card, Divider, Ring, Row, SectionTitle, T, Tag } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore, weekStats } from '@/store';
import { useUI } from '@/store/ui';
import { DISTRICTS, FRANKFURT_GOAL } from '@/data/mock';
import { useLocation } from '@/hooks/useLocation';
import { useT } from '@/i18n/useT';
import ScopeToggle from '@/components/ScopeToggle';

const col = CONTEXT.community.color;

export default function Together() {
  const router = useRouter();
  const t = useT();
  const { loc } = useLocation();
  const { friends, ledger, name, district, lose } = useStore();
  const { setCtx } = useUI();
  useEffect(() => { setCtx('community'); }, []);
  const wk = weekStats(ledger);
  const goalPct = FRANKFURT_GOAL.weekSoFarKg / FRANKFURT_GOAL.weekTargetKg;
  const groupDays = friends.reduce((a, f) => a + f.activeDays, 0) + wk.activeDays, groupGoal = (friends.length + 1) * 3;
  const honor = useMemo(() => [...friends.filter((f) => f.activeDays >= f.goal).map((f) => f.name), ...(wk.activeDays >= 3 ? [name || 'Du'] : [])].sort(), [friends, wk.activeDays]);

  return (
    <Screen>
      <ScopeToggle active="city" color={col} />
      <Text style={[T.h1]}>{t('together.title')}</Text>
          <Appear delay={40}>
            <Card style={{ marginTop: S.lg, backgroundColor: col }}>
              <Text style={[T.label, { color: '#ffffffaa' }]}>Frankfurt-Ziel der Woche</Text>
              <Text style={[T.h2, { color: '#fff', marginTop: 2 }]}>{(FRANKFURT_GOAL.weekSoFarKg / 1000).toFixed(1)} von {FRANKFURT_GOAL.weekTargetKg / 1000} t CO₂ vermieden</Text>
              <View style={{ height: 14, borderRadius: 7, backgroundColor: '#ffffff33', marginTop: 12, overflow: 'hidden' }}><View style={{ width: `${Math.round(goalPct * 100)}%`, height: 14, backgroundColor: '#fff', borderRadius: 7 }} /></View>
              <Row style={{ justifyContent: 'space-between', marginTop: 8 }}><Text style={{ color: '#ffffffcc', fontSize: 12 }}>{FRANKFURT_GOAL.participants.toLocaleString('de-DE')} Menschen · aggregiert, k ≥ 5</Text><Text style={{ color: '#fff', fontWeight: '800' }}>{Math.round(goalPct * 100)} %</Text></Row>
              <Text style={{ color: '#ffffffbb', fontSize: 12, marginTop: 6 }}>Wird das Ziel erreicht, pflanzt die Stadt 50 Bäume. Alle tragen bei, niemand wird gerankt.</Text>
            </Card>
          </Appear>

          <SectionTitle title="Dein Kreis" />
          <Appear delay={80}>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}><Text style={T.h3}>Gemeinsames Wochenziel</Text><Text style={T.small}>{friends.length + 1} Personen · {groupDays} von {groupGoal} aktiven Tagen. Kein Ranking untereinander: Jede Person hat ihr eigenes Ziel, ihr schafft es zusammen.</Text></View>
                <Ring progress={groupDays / groupGoal} size={64} stroke={8} color={col}><Text style={{ fontWeight: '900', fontSize: 13 }}>{Math.round((groupDays / groupGoal) * 100)}%</Text></Ring>
              </Row>
              <Divider />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Row style={{ gap: 14 }}>
                  {[{ id: 'me', name: name || 'Du', emoji: '🦎', activeDays: wk.activeDays, goal: 3, district }, ...friends].map((f) => (
                    <View key={f.id} style={{ alignItems: 'center', width: 64 }}>
                      <Ring progress={f.activeDays / f.goal} size={58} stroke={6} color={f.activeDays >= f.goal ? C.success : col}><Text style={{ fontSize: 20 }}>{f.emoji}</Text></Ring>
                      <Text style={{ fontWeight: '700', fontSize: 12, marginTop: 4 }} numberOfLines={1}>{f.name}</Text>
                      <Text style={T.small}>{f.activeDays}/{f.goal}</Text>
                    </View>
                  ))}
                  <Pressable style={{ alignItems: 'center', width: 64 }}><View style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.muted, fontSize: 22 }}>+</Text></View><Text style={T.small}>einladen</Text></Pressable>
                </Row>
              </ScrollView>
            </Card>
          </Appear>

          <SectionTitle title="Ehrentafel der Woche" />
          <Appear delay={120}>
            <Card>
              <Text style={T.small}>Alle, die ihr Wochenziel geschafft haben, alphabetisch. Keine Plätze, keine Top 100. Jede Person hier hat ein Los für das Deutschlandticket.</Text>
              <Row style={{ marginTop: 10, flexWrap: 'wrap', gap: 6 }}>{honor.length ? honor.map((n) => <Tag key={n} label={`🎟️ ${n}`} color={col} />) : <Text style={T.body}>Diese Woche noch niemand. Drei aktive Tage, dann stehst du hier.</Text>}</Row>
              <Divider />
              <Row style={{ justifyContent: 'space-between' }}><Text style={T.h3}>Deine Lose: {lose}</Text><Pressable onPress={() => router.push('/belohnungen')}><Text style={{ color: col, fontWeight: '800' }}>Verlosung ›</Text></Pressable></Row>
              <Text style={T.small}>Max. 4 Lose im Monat. Wer zehnmal mehr sammelt, hat nicht zehnmal mehr Chancen.</Text>
            </Card>
          </Appear>

          <SectionTitle title="Stadtteile: Fortschritt zur Vorwoche" />
          <Appear delay={160}>
            <Card>
              {DISTRICTS.map((d) => { const delta = (d.thisWeek - d.lastWeek) / d.lastWeek; const perCap = (d.thisWeek / d.pop) * 1000; return (
                <View key={d.name} style={{ marginBottom: 10 }}>
                  <Row style={{ justifyContent: 'space-between' }}><Text style={[T.body, { fontWeight: d.name === district ? '800' : '500', color: d.name === district ? C.ink : C.ink2 }]}>{d.name === district ? '📍 ' : ''}{d.name}</Text><Text style={{ fontWeight: '800', color: delta >= 0 ? C.success : C.danger }}>{delta >= 0 ? '+' : ''}{Math.round(delta * 100)} %</Text></Row>
                  <Row style={{ gap: 8 }}><View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: C.line, overflow: 'hidden' }}><View style={{ width: `${Math.min(100, perCap * 1.2)}%`, height: 8, backgroundColor: col }} /></View><Text style={T.small}>{perCap.toFixed(0)} Aktionen je 1.000 Einw.</Text></Row>
                </View>
              ); })}
              <Text style={T.small}>Verglichen wird jeder Stadtteil mit sich selbst und pro Kopf. Die Innenstadt hat mehr Bahnen, das ist Infrastruktur, kein Verdienst.</Text>
            </Card>
          </Appear>
    </Screen>
  );
}
