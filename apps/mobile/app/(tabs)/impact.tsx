import React, { useEffect, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Text as SText } from 'react-native-svg';
import { Screen } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import Globe from '@/components/Globe';
import ScopeToggle from '@/components/ScopeToggle';
import { Appear, Card, Counter, Divider, Ring, Row, SectionTitle, Stat, StatusBadge, T, Tag } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore, totalImpact, weekStats, chameleonStage } from '@/store';
import { useUI } from '@/store/ui';
import { comparisons, fmtCo2, FACTORS } from '@/engine/impact';
import { useT } from '@/i18n/useT';
import { FRANKFURT_GOAL } from '@/data/mock';

export default function Impact() {
  const router = useRouter();
  const t = useT();
  const { ledger, name, chameleonName } = useStore();
  const { setCtx, showWhy, mood } = useUI();
  useEffect(() => { setCtx('community'); }, []);
  const total = totalImpact(ledger);
  const wk = weekStats(ledger);
  const st = chameleonStage(ledger);
  const comp = comparisons(total.co2_g);
  const byMode = useMemo(() => {
    const m: Record<string, { km: number; co2: number; n: number }> = {};
    for (const l of ledger) if (l.type.startsWith('ride') && l.meta?.mode) { const k = String(l.meta.mode); m[k] = m[k] ?? { km: 0, co2: 0, n: 0 }; m[k].km += l.impact.km; m[k].co2 += l.impact.co2_g; m[k].n++; }
    return Object.entries(m).sort((a, b) => b[1].co2 - a[1].co2);
  }, [ledger]);
  const confirmed = ledger.filter((l) => l.status === 'bestätigt').length, plausible = ledger.filter((l) => l.status === 'plausibel' || l.status === 'schwach plausibel').length, selfR = ledger.length - confirmed - plausible;
  const col = CONTEXT.community.color;
  const empty = ledger.length === 0;

  return (
    <Screen>
      <ScopeToggle active="me" color={col} />
      <Text style={[T.h1]}>{t('impact.title')}</Text>

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
              <Row style={{ gap: 6 }}><Tag label={t('impact.estimated')} color="#fff" /><Tag label="Formel antippbar" color="#fff" /></Row>
            </View>
            <Chameleon pose="globe" size={110} />
          </Row>
          <Divider />
          <Row style={{ gap: 8 }}>
            <Stat label={t('impact.food')} value={`${(total.food_g / 1000).toFixed(1)} kg`} color="#fff" />
            <Stat label={t('impact.packaging')} value={`${total.packaging}×`} color="#fff" />
            <Stat label={t('impact.km')} value={total.km.toFixed(1)} color="#fff" />
          </Row>
        </Card>
      </Appear>

      {empty ? (
        <Appear delay={100}>
          <Card style={{ marginTop: 14, alignItems: 'center', paddingVertical: 24 }}>
            <Chameleon pose="calm" size={160} />
            <Text style={[T.h3, { marginTop: 8 }]}>Noch nichts erfasst</Text>
            <Text style={[T.body, { textAlign: 'center' }]}>Starte eine Fahrt, melde ein Regal oder bring eine Schale zurück. Jede Gutschrift erklärt sich selbst.</Text>
            <Pressable onPress={() => router.push('/handeln')} style={{ marginTop: 12 }}><Text style={{ color: col, fontWeight: '800' }}>Zu den Aktionen ›</Text></Pressable>
          </Card>
        </Appear>
      ) : (
        <>
          <SectionTitle title="Was das bedeutet" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {comp.map((c, i) => (
              <Appear key={c.text} delay={120 + i * 50} style={{ width: '48%', flexGrow: 1 }}>
                <Card style={{ paddingVertical: 14 }}>
                  <Text style={{ fontSize: 26 }}>{c.icon}</Text>
                  <Text style={[T.h3, { marginTop: 6 }]}>{c.text}</Text>
                  <Text style={T.small}>{c.sub}</Text>
                </Card>
              </Appear>
            ))}
          </View>
          <Text style={[T.small, { marginTop: 8 }]}>Vergleiche sind Schätzungen mit dokumentierten Faktoren. Pkw {FACTORS.car.g} g/Pkm, U-Bahn {FACTORS.U.g} g/Pkm (UBA-Richtwerte).</Text>
        </>
      )}

      <SectionTitle title="Deine Woche" />
      <Appear delay={160}>
        <Card>
          <Row style={{ gap: 16 }}>
            <Ring progress={wk.activeDays / wk.goal} size={96} stroke={12} color={C.leaf}><Text style={{ fontWeight: '900', fontSize: 20 }}>{wk.activeDays}/{wk.goal}</Text></Ring>
            <View style={{ flex: 1 }}>
              <Text style={T.h3}>{t('week.goal')}: 3 aktive Tage</Text>
              <Text style={T.small}>Kein Tagesstreak. Drei Tage von sieben reichen, ein Freeze im Monat. Wer regelmäßig ist, gewinnt, nicht wer am meisten farmt.</Text>
              <Text style={[T.small, { marginTop: 6, fontWeight: '700', color: C.ink }]}>{wk.points} Punkte diese Woche</Text>
            </View>
          </Row>
          <Divider />
          <Row style={{ gap: 8 }}>
            <Stat label="bestätigt" value={String(confirmed)} color={C.success} />
            <Stat label="plausibel" value={String(plausible)} color={C.mobility} />
            <Stat label="eigenangabe" value={String(selfR)} color={C.muted} />
          </Row>
          <Text style={[T.small, { marginTop: 8 }]}>Bestätigte Daten, Nutzereingaben und Schätzwerte bleiben getrennt.</Text>
        </Card>
      </Appear>

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
                    <Row style={{ justifyContent: 'space-between' }}><Text style={T.body}>{label} · {v.n}×</Text><Text style={T.small}>{v.km.toFixed(1)} km · {fmtCo2(v.co2)} vermieden</Text></Row>
                    <View style={{ height: 10, borderRadius: 5, backgroundColor: C.line, marginTop: 4, overflow: 'hidden' }}><View style={{ width: `${Math.round((v.co2 / max) * 100)}%`, height: 10, backgroundColor: CONTEXT.mobility.color }} /></View>
                  </View>
                );
              })}
              <Text style={T.small}>Je Fahrt: km × (Pkw-Faktor − Faktor des Verkehrsmittels). Rad und zu Fuß sparen am meisten, E-Scooter unter 1,5 km nichts.</Text>
            </Card>
          </Appear>
        </>
      )}

      <SectionTitle title={`${chameleonName} wächst mit dir`} />
      <Appear delay={240}>
        <Card>
          <Row style={{ gap: 12 }}>
            {[1, 2, 3, 4].map((s) => (
              <View key={s} style={{ flex: 1, alignItems: 'center', opacity: s <= st.stage ? 1 : 0.35 }}>
                <Chameleon pose="stand" size={64} style={{ opacity: s <= st.stage ? 1 : 0.35 }} />
                <Text style={[T.small, { fontWeight: '700', color: s === st.stage ? C.ink : C.muted }]}>{['Schlüpfling', 'Entdecker', 'Kletterer', 'Stadt'][s - 1]}</Text>
              </View>
            ))}
          </Row>
          <Text style={[T.small, { marginTop: 8 }]}>Stufen kommen mit aktiven Wochen, nicht mit Punktemengen. {st.next ? `Nächste Stufe: ${st.next}.` : 'Du bist ganz oben.'}</Text>
        </Card>
      </Appear>

      <SectionTitle title="Frankfurt diese Woche" action="Mehr ›" onAction={() => router.replace('/gemeinsam')} />
      <Appear delay={280}>
        <Card style={{ alignItems: 'center' }}>
          <Globe km={Math.round(FRANKFURT_GOAL.weekSoFarKg * 6.5 + total.km)} color={col} />
          <Text style={[T.small, { marginTop: 10, textAlign: 'center' }]}>Gemeinsame nachhaltige Strecke aller {FRANKFURT_GOAL.participants.toLocaleString('de-DE')} Teilnehmenden . Dein Anteil: {total.km.toFixed(1)} km.</Text>
        </Card>
      </Appear>

      <SectionTitle title="Letzte Gutschriften" action="Journal ›" onAction={() => router.push('/journal')} />
      <View style={{ gap: 8 }}>
        {ledger.slice(0, 4).map((l) => (
          <Card key={l.key} onPress={() => showWhy(l)} style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}><Text style={T.h3} numberOfLines={1}>{l.title}</Text><Row style={{ gap: 6, marginTop: 4 }}><StatusBadge status={l.status} small /><Text style={T.small}>{new Date(l.at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text></Row></View>
              <Text style={{ fontWeight: '900', fontSize: 18, color: l.points > 0 ? C.success : C.muted }}>{l.points > 0 ? `+${l.points}` : '0'}</Text>
            </Row>
          </Card>
        ))}
        {ledger.length === 0 && <Text style={T.small}>Noch keine Einträge.</Text>}
      </View>
    </Screen>
  );
}
