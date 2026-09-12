import React, { useEffect, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Text as SText } from 'react-native-svg';
import { Screen } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import Globe, { CIRCUMFERENCE } from '@/components/Globe';
import ScopeToggle from '@/components/ScopeToggle';
import { Appear, Card, Counter, Divider, Row, SectionTitle, Stat, T } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore, totalImpact, weekStats, chameleonStage, STAGES } from '@/store';
import { useUI } from '@/store/ui';
import { fmtCo2, FACTORS } from '@/engine/impact';
import { useT } from '@/i18n/useT';
import { FRANKFURT_GOAL } from '@/data/mock';

const MEDALS = [
  { name: 'Bronze', points: 15, color: '#B87333' },
  { name: 'Silber', points: 50, color: '#9DA5AE' },
  { name: 'Gold', points: 100, color: '#D4A017' },
  { name: 'Platin', points: 200, color: '#7A8C93' },
  { name: 'Diamant', points: 350, color: '#52A9C7' },
];

export default function Impact() {
  const router = useRouter();
  const t = useT();
  const { ledger, name, chameleonName } = useStore();
  const { setCtx } = useUI();
  useEffect(() => { setCtx('community'); }, []);
  const total = totalImpact(ledger);
  const wk = weekStats(ledger);
  const st = chameleonStage(ledger);
  const earnedPoints = ledger.reduce((sum, entry) => sum + Math.max(0, entry.points), 0);
  const comp = comparisons(total.co2_g);
  const byMode = useMemo(() => {
    const m: Record<string, { km: number; co2: number; n: number }> = {};
    for (const l of ledger) if (l.type.startsWith('ride') && l.meta?.mode) { const k = String(l.meta.mode); m[k] = m[k] ?? { km: 0, co2: 0, n: 0 }; m[k].km += l.impact.km; m[k].co2 += l.impact.co2_g; m[k].n++; }
    return Object.entries(m).sort((a, b) => b[1].co2 - a[1].co2);
  }, [ledger]);
  const col = CONTEXT.community.color;
  const empty = ledger.length === 0;
  const cityKm = Math.round(FRANKFURT_GOAL.weekSoFarKg * 6.5 + total.km);

  return (
    <Screen>
      <ScopeToggle active="me" color={col} />
      <Text style={[T.h1]}>{t('impact.title')}</Text>

      <SectionTitle title="Rangliste" />
      <Appear delay={20}>
        <Card style={{ paddingVertical: 18 }}>
          <Row style={{ alignItems: 'flex-start', gap: 4 }}>
            {MEDALS.map((medal) => {
              const unlocked = earnedPoints >= medal.points;
              const medalColor = unlocked ? medal.color : '#AEB2AD';
              return (
                <View key={medal.name} style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: unlocked ? medal.color + '1F' : '#E7E8E5', borderWidth: 2, borderColor: medalColor }}>
                    <Ionicons name="medal-outline" size={27} color={medalColor} />
                    {!unlocked && (
                      <View style={{ position: 'absolute', right: -3, bottom: -3, width: 19, height: 19, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.line }}>
                        <Ionicons name="lock-closed" size={10} color={C.muted} />
                      </View>
                    )}
                  </View>
                  <Text style={[T.small, { marginTop: 7, color: unlocked ? C.ink : C.muted, fontWeight: '800', textAlign: 'center' }]}>{medal.name}</Text>
                  <Text style={{ marginTop: 2, color: C.muted, fontSize: 10, fontWeight: '700' }}>{medal.points} Blätter</Text>
                </View>
              );
            })}
          </Row>
          <Text style={[T.small, { marginTop: 14, textAlign: 'center' }]}>{earnedPoints} Blätter gesammelt</Text>
        </Card>
      </Appear>

      <Appear delay={40}>
        <Card style={{ marginTop: S.lg, overflow: 'hidden', backgroundColor: C.ink }}>
          <LinearGradient colors={[col + '66', 'transparent']} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 140 }} />
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={[T.label, { color: '#ffffff99' }]}>{t('impact.co2')}</Text>
              <Row style={{ alignItems: 'flex-end', gap: 6 }}>
                <Counter value={total.co2_g >= 1000 ? total.co2_g / 1000 : total.co2_g} decimals={total.co2_g >= 1000 ? 1 : 0} style={{ fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: -1 }} />
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 8 }}>{total.co2_g >= 1000 ? 'kg' : 'g'}</Text>
              </Row>
            </View>
            <Chameleon pose="globe" size={110} />
          </Row>
          <Divider />
          <Row style={{ gap: 8 }}>
            <Stat label={t('impact.food')} value={`${(total.food_g / 1000).toFixed(1)} kg`} color="#fff" />
            <Stat label={t('impact.packaging')} value={`${total.packaging}×`} color="#fff" />
            <Stat label={t('impact.km')} value={total.km.toFixed(1)} color="#fff" />
          </Row>

          <Divider />
          {/* Die Woche am Stück: welche Tage aktiv waren. Ziel bleiben drei von sieben. */}
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[T.label, { color: '#ffffff99' }]}>Diese Woche</Text>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{wk.activeDays}/{wk.goal} aktive Tage</Text>
          </Row>
          <Row style={{ gap: 6, marginTop: 8 }}>
            {wk.week.map((on, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, fontWeight: '800', color: i === wk.todayIdx ? '#fff' : '#ffffff77' }}>{WEEKDAYS[i]}</Text>
                <View style={{ width: '100%', height: 26, marginTop: 4, borderRadius: 9, backgroundColor: on ? C.leaf : '#ffffff1A', borderWidth: i === wk.todayIdx ? 2 : 0, borderColor: '#ffffffaa', alignItems: 'center', justifyContent: 'center' }}>
                  {on && <Text style={{ color: '#14300F', fontWeight: '900', fontSize: 13 }}>✓</Text>}
                </View>
              </View>
            ))}
          </Row>

          <Divider />
          <Row style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[T.label, { color: '#ffffff99' }]}>{chameleonName} wächst mit dir</Text>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{st.label}</Text>
          </Row>
          <Row style={{ gap: 8, marginTop: 6 }}>
            {STAGES.map((stage, i) => (
              <View key={stage.name} style={{ flex: 1, alignItems: 'center', opacity: i + 1 <= st.stage ? 1 : 0.32 }}>
                <Chameleon pose={stage.pose} size={48} />
                <Text numberOfLines={1} style={{ fontSize: 10, fontWeight: '700', color: i + 1 === st.stage ? '#fff' : '#ffffff88' }}>{stage.name}</Text>
              </View>
            ))}
          </Row>
          <Text style={[T.small, { color: '#ffffff99', marginTop: 8 }]}>Stufen kommen mit aktiven Wochen, nicht mit Punktemengen. {st.next ? `Nächste Stufe: ${st.next}.` : 'Du bist ganz oben.'}</Text>
        </Card>
      </Appear>

      {empty ? (
        <Appear delay={100}>
          <Card style={{ marginTop: 14, alignItems: 'center', paddingVertical: 24 }}>
            <Chameleon pose="calm" size={160} />
            <Text style={[T.h3, { marginTop: 8 }]}>Noch nichts erfasst</Text>
            <Text style={[T.body, { textAlign: 'center' }]}>Starte eine Fahrt, melde ein Regal oder bring einen Behälter zurück. Jede Gutschrift erklärt sich selbst.</Text>
            <Pressable onPress={() => router.push('/handeln')} style={{ marginTop: 12 }}><Text style={{ color: col, fontWeight: '800' }}>Zu den Aktionen ›</Text></Pressable>
          </Card>
        </Appear>
      ) : (
        <>
          <SectionTitle title="Was das bedeutet" />
          <Appear delay={120}>
            <Card style={{ alignItems: 'center', paddingVertical: 18 }}>
              <Globe km={total.km} color={col} size={250} />
            </Card>
          </Appear>
        </>
      )}

      {byMode.length > 0 && (
        <>
          <SectionTitle title="Verkehrsmittel im Vergleich" />
          <Appear delay={200}>
            <Card>
              {byMode.map(([mode, v]) => {
                const label = (FACTORS as any)[mode]?.label ?? mode;
                const max = byMode[0][1].co2 || 1;
                return (
                  <View key={mode} style={{ marginBottom: 10 }}>
                    <Row style={{ justifyContent: 'space-between' }}><Text style={T.body}>{label} · {v.km.toFixed(1)} km</Text><Text style={T.small}>{fmtCo2(v.co2)} vermieden</Text></Row>
                    <View style={{ height: 10, borderRadius: 5, backgroundColor: C.line, marginTop: 4, overflow: 'hidden' }}><View style={{ width: `${Math.round((v.co2 / max) * 100)}%`, height: 10, backgroundColor: CONTEXT.mobility.color }} /></View>
                  </View>
                );
              })}
            </Card>
          </Appear>
        </>
      )}

      <SectionTitle title="Frankfurt diese Woche" action="Mehr ›" onAction={() => router.replace('/gemeinsam')} />
      <Appear delay={280}>
        <Card style={{ alignItems: 'center' }}>
          <Text style={{ fontWeight: '900', fontSize: 34, color: C.ink, letterSpacing: -1 }}>{cityKm.toLocaleString('de-DE')} km</Text>
          <Text style={[T.small, { fontWeight: '700' }]}>{(cityKm / CIRCUMFERENCE).toLocaleString('de-DE', { maximumFractionDigits: 2 })}× um die Erde</Text>
          <Text style={[T.small, { marginTop: 10, textAlign: 'center' }]}>Gemeinsame nachhaltige Strecke aller {FRANKFURT_GOAL.participants.toLocaleString('de-DE')} Teilnehmenden . Dein Anteil: {total.km.toFixed(1)} km.</Text>
        </Card>
      </Appear>

    </Screen>
  );
}
