import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Appear, Card, Divider, Ring, Row, SectionTitle, Sheet, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore, weekStats } from '@/store';
import { useUI } from '@/store/ui';
import { DISTRICTS, FRANKFURT_GOAL } from '@/data/mock';
import { useLocation } from '@/hooks/useLocation';
import { useT, useLocale } from '@/i18n/useT';
import type { TKey } from '@/i18n';
import { addImpact, emptyImpact, fmtCo2 } from '@/engine/impact';
import { cityComparisons, cityImpact, fmtCount, fmtKg, periodStart, previousCityImpact, PERIODS, type Period } from '@/engine/city';
import ScopeToggle from '@/components/ScopeToggle';
import Chameleon from '@/components/Chameleon';

const col = CONTEXT.community.color;
const PERIOD_LABEL: Record<Period, TKey> = { day: 'tabs.together.today', week: 'tabs.together.week', month: 'tabs.together.month' };
const PREVIOUS: Record<Period, string> = { day: 'gegenüber gestern', week: 'gegenüber der Vorwoche', month: 'gegenüber dem Vormonat' };

export default function Together() {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const { loc } = useLocation();
  const { friends, ledger, name, district, lose } = useStore();
  const { setCtx } = useUI();
  const [drawInfo, setDrawInfo] = useState(false);
  useEffect(() => { setCtx('community'); }, []);
  const wk = weekStats(ledger);
  const [period, setPeriod] = useState<Period>('week');
  const city = useMemo(() => cityImpact(period), [period]);
  const before = useMemo(() => previousCityImpact(period), [period]);
  // Der eigene Beitrag kommt aus dem echten Journal und wird auf die Demo-Stadtwerte addiert.
  const mine = useMemo(() => ledger.filter((l) => l.at >= periodStart(period)).reduce((a, l) => addImpact(a, l.impact), emptyImpact()), [ledger, period]);
  const total = { co2_g: city.co2_g + mine.co2_g, food_g: city.food_g + mine.food_g, packaging: city.packaging + mine.packaging };
  const delta = before.co2_g ? (total.co2_g - before.co2_g) / before.co2_g : 0;
  const week = useMemo(() => cityImpact('week'), []);
  const goalPct = Math.min(1, week.co2_g / 1000 / FRANKFURT_GOAL.weekTargetKg);
  const groupDays = friends.reduce((a, f) => a + f.activeDays, 0) + wk.activeDays, groupGoal = (friends.length + 1) * 3;
  const honor = useMemo(() => [...friends.filter((f) => f.activeDays >= f.goal).map((f) => f.name), ...(wk.activeDays >= 3 ? [name || t('tabs.you')] : [])].sort((a, b) => a.localeCompare(b, locale)), [friends, wk.activeDays, name, locale, t]);

  return (
    <Screen>
      <ScopeToggle active="city" color={col} />
      <Text style={[T.h1]}>{t('together.title')}</Text>

          <Appear delay={20}>
            <Card style={{ marginTop: S.lg, backgroundColor: col, gap: 10 }}>
              <Row style={{ backgroundColor: '#ffffff26', borderRadius: 999, padding: 4, gap: 0 }}>
                {PERIODS.map((p) => (
                  <Pressable key={p} accessibilityRole="tab" accessibilityState={{ selected: period === p }} onPress={() => { haptic(); setPeriod(p); }} style={{ flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: 'center', backgroundColor: period === p ? '#fff' : 'transparent' }}>
                    <Text style={{ fontWeight: '800', fontSize: 12, color: period === p ? col : '#fff' }}>{t(PERIOD_LABEL[p])}</Text>
                  </Pressable>
                ))}
              </Row>
              <Text style={[T.label, { color: '#ffffffaa', marginTop: 4 }]}>{t('tabs.together.citySaved')}</Text>
              <Text style={[T.h1, { color: '#fff' }]}>{fmtKg(total.co2_g)} CO₂</Text>
              <Text style={{ color: '#ffffffdd', fontSize: 13, fontWeight: '700' }}>{delta >= 0 ? '+' : ''}{Math.round(delta * 100)} % {PREVIOUS[period]}</Text>
              <View style={{ marginTop: 6 }}>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 17 }}>{fmtCount(city.people)}</Text>
                <Text style={{ color: '#ffffffbb', fontSize: 11, fontWeight: '700' }}>{t('tabs.together.cityPeople')}</Text>
              </View>
            </Card>
          </Appear>

          <SectionTitle title={t('tabs.together.cityMeans')} />
          <Appear delay={60}>
            <Card style={{ gap: 12 }}>
              {cityComparisons(total).map((c) => (
                <Row key={c.title} style={{ alignItems: 'flex-start' }}>
                  <Text style={{ fontSize: 26 }}>{c.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={T.h3}>{c.value}</Text>
                    <Text style={[T.body, { fontSize: 14 }]}>{c.title}</Text>
                    <Text style={T.small}>{c.sub}</Text>
                  </View>
                </Row>
              ))}
              <Divider />
              <Text style={T.small}>{t('tabs.together.estimates')}</Text>
            </Card>
          </Appear>

          <SectionTitle title={t('tabs.together.cityYours')} />
          <Appear delay={100}>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={T.h3}>{fmtCo2(mine.co2_g)} CO₂ · {mine.packaging} Einweg · {fmtCount(mine.food_g / 1000)} kg Essen</Text>
                  {/* Bewusst kein Anteil in Prozent: ein Bruchteil eines Stadtwerts entmutigt, die Zahl der Mitmachenden trägt. */}
                  <Text style={T.small}>{mine.co2_g > 0
                    ? `Du bist eine von ${fmtCount(city.people)} Personen, die in diesem Zeitraum mitgemacht haben. Einzeln ist das wenig, zusammen sind es ${fmtKg(total.co2_g)}.`
                    : `In diesem Zeitraum noch nichts von dir. ${fmtCount(city.people)} andere sind schon dabei, eine Fahrt oder eine Rückgabe reicht zum Mitmachen.`}</Text>
                </View>
                <Chameleon pose={mine.co2_g > 0 ? 'heart' : 'wave'} size={78} />
              </Row>
            </Card>
          </Appear>

          <SectionTitle title={t('tabs.together.cityWeekGoal')} />
          <Appear delay={140}>
            <Card style={{ marginTop: S.lg, backgroundColor: col }}>
              <Text style={[T.label, { color: '#ffffffaa' }]}>{t('tabs.together.weekGoal')}</Text>
              <Text style={[T.h2, { color: '#fff', marginTop: 2 }]}>{t('tabs.together.co2Progress', { amount: (week.co2_g / 1000000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), target: (FRANKFURT_GOAL.weekTargetKg / 1000).toLocaleString(locale) })}</Text>
              <View style={{ height: 14, borderRadius: 7, backgroundColor: '#ffffff33', marginTop: 12, overflow: 'hidden' }}><View style={{ width: `${Math.round(goalPct * 100)}%`, height: 14, backgroundColor: '#fff', borderRadius: 7 }} /></View>
              <Row style={{ justifyContent: 'space-between', marginTop: 8 }}><Text style={{ color: '#ffffffcc', fontSize: 12 }}>{t('tabs.together.participants', { count: FRANKFURT_GOAL.participants.toLocaleString(locale) })}</Text><Text style={{ color: '#fff', fontWeight: '800' }}>{Math.round(goalPct * 100)} %</Text></Row>
              <Row style={{ gap: 10, alignItems: 'center', marginTop: 12, backgroundColor: '#ffffff26', borderRadius: 14, padding: 10 }}>
                <Text style={{ fontSize: 24 }}>🌳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{t('tabs.together.treesTitle')}</Text>
                  <Text style={{ color: '#ffffffcc', fontSize: 12, marginTop: 2 }}>{t('tabs.together.treesBody')}</Text>
                </View>
              </Row>
            </Card>
          </Appear>

          <SectionTitle title={t('tabs.together.circle')} />
          <Appear delay={80}>
            <Card>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}><Text style={T.h3}>{t('tabs.together.groupGoal')}</Text><Text style={T.small}>{t('tabs.together.groupProgress', { people: friends.length + 1, days: groupDays, goal: groupGoal })}</Text></View>
                <Ring progress={groupDays / groupGoal} size={64} stroke={8} color={col}><Text style={{ fontWeight: '900', fontSize: 13 }}>{Math.round((groupDays / groupGoal) * 100)}%</Text></Ring>
              </Row>
              <Divider />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Row style={{ gap: 14 }}>
                  {[{ id: 'me', name: name || t('tabs.you'), emoji: '🦎', activeDays: wk.activeDays, goal: 3, district }, ...friends].map((f) => (
                    <View key={f.id} style={{ alignItems: 'center', width: 64 }}>
                      <Ring progress={f.activeDays / f.goal} size={58} stroke={6} color={f.activeDays >= f.goal ? C.success : col}><Text style={{ fontSize: 20 }}>{f.emoji}</Text></Ring>
                      <Text style={{ fontWeight: '700', fontSize: 12, marginTop: 4 }} numberOfLines={1}>{f.name}</Text>
                      <Text style={T.small}>{f.activeDays}/{f.goal}</Text>
                    </View>
                  ))}
                  <Pressable style={{ alignItems: 'center', width: 64 }}><View style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderStyle: 'dashed', borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: C.muted, fontSize: 22 }}>+</Text></View><Text style={T.small}>{t('tabs.together.invite')}</Text></Pressable>
                </Row>
              </ScrollView>
            </Card>
          </Appear>

          <SectionTitle title={t('tabs.together.honors')} />
          <Appear delay={120}>
            <Card>
              <Text style={T.small}>{t('tabs.together.honorsHelp')}</Text>
              <Row style={{ marginTop: 10, flexWrap: 'wrap', gap: 6 }}>{honor.length ? honor.map((n) => <Tag key={n} label={`🎟️ ${n}`} color={col} />) : <Text style={T.body}>{t('tabs.together.honorsEmpty')}</Text>}</Row>
              <Divider />
              <Row style={{ justifyContent: 'space-between' }}>
                <Row style={{ gap: 8, flex: 1 }}>
                  <Text style={T.h3}>{t('tabs.together.tickets', { count: lose })}</Text>
                  {/* Die Regeln der Verlosung stehen im Detail hinter dem i, damit die Karte kurz bleibt. */}
                  <Pressable
                    onPress={() => { haptic(); setDrawInfo(true); }}
                    accessibilityRole="button"
                    accessibilityLabel={t('tabs.together.drawHow')}
                    hitSlop={8}
                    style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: col, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="information" size={13} color={col} />
                  </Pressable>
                </Row>
                <Pressable onPress={() => router.push('/belohnungen')}><Text style={{ color: col, fontWeight: '800' }}>{t('tabs.together.draw')}</Text></Pressable>
              </Row>
              <Text style={T.small}>{t('tabs.together.drawSummary')}</Text>
            </Card>
          </Appear>

          <SectionTitle title={t('tabs.together.districts')} />
          <Appear delay={160}>
            <Card>
              {DISTRICTS.map((d) => { const delta = (d.thisWeek - d.lastWeek) / d.lastWeek; const perCap = (d.thisWeek / d.pop) * 1000; return (
                <View key={d.name} style={{ marginBottom: 10 }}>
                  <Row style={{ justifyContent: 'space-between' }}><Text style={[T.body, { fontWeight: d.name === district ? '800' : '500', color: d.name === district ? C.ink : C.ink2 }]}>{d.name === district ? '📍 ' : ''}{d.name}</Text><Text style={{ fontWeight: '800', color: delta >= 0 ? C.success : C.danger }}>{delta >= 0 ? '+' : ''}{Math.round(delta * 100)} %</Text></Row>
                  <Row style={{ gap: 8 }}><View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: C.line, overflow: 'hidden' }}><View style={{ width: `${Math.min(100, perCap * 1.2)}%`, height: 8, backgroundColor: col }} /></View><Text style={T.small}>{t('tabs.together.actionsPerCapita', { count: perCap.toLocaleString(locale, { maximumFractionDigits: 0 }) })}</Text></Row>
                </View>
              ); })}
              <Text style={T.small}>{t('tabs.together.districtsHelp')}</Text>
            </Card>
          </Appear>
      <Sheet open={drawInfo} onClose={() => setDrawInfo(false)} title={t('tabs.together.drawTitle')}>
        <Text style={T.body}>{t('tabs.together.drawRules')}</Text>
        <Text style={[T.body, { marginTop: 10 }]}>{t('tabs.together.drawFairness')}</Text>
        <Divider />
        <Text style={T.label}>{t('tabs.together.choosePrize')}</Text>
        <Text style={[T.body, { marginTop: 4 }]}>{t('tabs.together.prize')}</Text>
      </Sheet>
    </Screen>
  );
}
