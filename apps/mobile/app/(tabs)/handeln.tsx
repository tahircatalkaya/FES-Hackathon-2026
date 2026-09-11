import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import { Appear, Card, Ring, SectionTitle, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S, shadow } from '@/theme';
import { useStore, weekStats, chameleonStage, balance } from '@/store';
import { useUI } from '@/store/ui';
import { useT } from '@/i18n/useT';
import { CHAPTERS } from '@/data/mock';

export default function Act() {
  const router = useRouter();
  const t = useT();
  const { ledger, name, chameleonName, quizDone, containers, reservations, spent } = useStore();
  const { setCtx, mood } = useUI();
  const wk = weekStats(ledger);
  const st = chameleonStage(ledger);
  useEffect(() => { setCtx('home'); }, []);
  const openContainers = containers.filter((c) => !c.returnedAt);
  const openRes = reservations.filter((r) => r.status === 'pending' || r.status === 'accepted');
  const nextQuiz = CHAPTERS.find((c) => !quizDone.includes(c.id));
  const todayPts = ledger.filter((l) => new Date(l.at).toDateString() === new Date().toDateString()).reduce((a, l) => a + l.points, 0);

  const actions = [
    { key: 'mobility', title: t('act.ride'), sub: t('act.ride.sub'), emoji: '🚇', href: '/fahrt', partner: 'Transdev' },
    { key: 'food', title: t('act.food'), sub: t('act.food.sub'), emoji: '🥕', href: '/(tabs)?layer=food', partner: 'foodsharing' },
    { key: 'reuse', title: t('act.reuse'), sub: t('act.reuse.sub'), emoji: '🥡', href: '/mehrweg', partner: 'Vytal' },
    { key: 'clean', title: t('act.clean'), sub: t('act.clean.sub'), emoji: '🧹', href: '/cleanup/list', partner: 'FES' },
  ] as const;

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={T.label}>{new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}</Text>
          <Text style={[T.h1, { marginTop: 4 }]}>{t('act.title')}</Text>
        </View>
      </View>

      {/* Wochenziel + Chamäleon */}
      <Appear delay={60}>
        <Card style={{ marginTop: S.lg, overflow: 'hidden', paddingVertical: 12 }}>
          <LinearGradient colors={[C.home + '14', '#fff']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => haptic()}><Chameleon color={C.home} size={150} stage={st.stage as any} mood={mood} lookX={0.4} /></Pressable>
            <View style={{ flex: 1, paddingLeft: 4 }}>
              <Text style={T.h3}>{chameleonName} · {st.label}</Text>
              <Text style={[T.small, { marginBottom: 10 }]}>{st.next ? `Nächste Stufe: ${st.next}` : 'Höchste Stufe erreicht'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ring progress={wk.activeDays / wk.goal} size={70} stroke={9} color={C.leaf}>
                  <Text style={{ fontWeight: '900', fontSize: 16, color: C.ink }}>{wk.activeDays}/{wk.goal}</Text>
                </Ring>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: C.ink }}>{t('week.goal')}</Text>
                  <Text style={T.small}>{wk.activeDays >= wk.goal ? 'Geschafft, Los gesichert 🎟️' : `${wk.goal - wk.activeDays} ${t('week.days')} fehlen`}</Text>
                  <Text style={T.small}>Heute {todayPts}/150 Punkte</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>
      </Appear>

      {/* Offene Dinge */}
      {(openContainers.length > 0 || openRes.length > 0) && (
        <Appear delay={120}>
          <View style={{ marginTop: S.md, gap: 8 }}>
            {openContainers.map((c) => {
              const left = Math.max(0, 14 * 24 - (Date.now() - c.borrowedAt) / 3600e3);
              return (
                <Card key={c.code} onPress={() => router.push('/mehrweg')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderLeftWidth: 5, borderLeftColor: C.reuse }}>
                  <Text style={{ fontSize: 24 }}>🥡</Text>
                  <View style={{ flex: 1 }}><Text style={T.h3}>Vytal-{c.kind === 'cup' ? 'Becher' : 'Schale'} unterwegs</Text><Text style={T.small}>{c.storeName} · noch {Math.floor(left / 24)} Tage, {left < 48 ? '+10 Punkte bei schneller Rückgabe' : 'zurückbringen für 30 Punkte'}</Text></View>
                  <Text style={{ color: C.reuse, fontWeight: '800' }}>›</Text>
                </Card>
              );
            })}
            {openRes.map((r) => (
              <Card key={r.basketId} onPress={() => router.push(`/korb/${r.basketId}` as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderLeftWidth: 5, borderLeftColor: C.food }}>
                <Text style={{ fontSize: 24 }}>🧺</Text>
                <View style={{ flex: 1 }}><Text style={T.h3} numberOfLines={1}>{r.title}</Text><Text style={T.small}>Reserviert bis {new Date(r.expiresAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · {r.status}</Text></View>
                <Text style={{ color: C.food, fontWeight: '800' }}>›</Text>
              </Card>
            ))}
          </View>
        </Appear>
      )}

      <SectionTitle title="Kernaktionen" />
      <View style={{ gap: 12 }}>
        {actions.map((a, i) => (
          <Appear key={a.key} delay={160 + i * 60}>
            <Card onPress={() => router.push(a.href as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: CONTEXT[a.key].color + '22' }}>
              <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: CONTEXT[a.key].soft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 28 }}>{a.emoji}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={T.h3}>{a.title}</Text>
                <Text style={T.small}>{a.sub}</Text>
                <Tag label={`mit ${a.partner}`} color={CONTEXT[a.key].color} />
              </View>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: CONTEXT[a.key].color, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '900' }}>›</Text></View>
            </Card>
          </Appear>
        ))}
      </View>

      <SectionTitle title="Heute für dich" />
      <View style={{ gap: 12 }}>
        {nextQuiz && (
          <Appear delay={420}>
            <Card onPress={() => router.push(`/quiz/${nextQuiz.id}` as any)} style={{ backgroundColor: C.ink }}>
              <Text style={[T.label, { color: '#ffffff99' }]}>Tagesmission · Lernen mit {chameleonName}</Text>
              <Text style={[T.h3, { color: '#fff', marginTop: 4 }]}>{nextQuiz.title}</Text>
              <Text style={[T.small, { color: '#ffffffbb', marginTop: 4 }]} numberOfLines={2}>{nextQuiz.intro}</Text>
              <Text style={{ color: C.leaf, fontWeight: '800', marginTop: 10 }}>+{nextQuiz.questions.length * 5} Punkte · 2 Minuten</Text>
            </Card>
          </Appear>
        )}
        <Appear delay={480}>
          <Card onPress={() => router.push('/melden')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 26 }}>📸</Text>
            <View style={{ flex: 1 }}><Text style={T.h3}>Volle Tonne oder wilde Kippe melden</Text><Text style={T.small}>Wird zu einem FES-Ticket. 25 Punkte, wenn es bearbeitet wird.</Text></View>
          </Card>
        </Appear>
        <Appear delay={540}>
          <Card onPress={() => router.push('/scan?mode=litter')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 26 }}>🫶</Text>
            <View style={{ flex: 1 }}><Text style={T.h3}>Müll aufgehoben?</Text><Text style={T.small}>Gibt keine Punkte, weil das nicht prüfbar ist. {chameleonName} freut sich trotzdem.</Text></View>
          </Card>
        </Appear>
      </View>
    </Screen>
  );
}
