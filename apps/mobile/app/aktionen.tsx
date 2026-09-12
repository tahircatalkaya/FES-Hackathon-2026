import { useT, useLocalize, useLocale } from '@/i18n/useT';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import { Appear, Button, Card, Ring, Row, SectionTitle, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S, shadow } from '@/theme';
import { useStore, weekStats, chameleonStage, balance } from '@/store';
import { useUI } from '@/store/ui';
import { CHAPTERS } from '@/data/mock';

export default function Act() {
  const rt = useT();
  const localize = useLocalize();
  const locale = useLocale();
  const router = useRouter();
  const t = useT();
  const { ledger, name, chameleonName, quizDone, containers, reservations, itemReservations } = useStore();
  const { setCtx, mood } = useUI();
  const wk = weekStats(ledger);
  const st = chameleonStage(ledger);
  const [poke, setPoke] = useState(0);
  useEffect(() => { setCtx('home'); }, []);
  const openContainers = containers.filter((c) => !c.returnedAt);
  const openRes = reservations.filter((r) => r.status === 'pending' || r.status === 'accepted');
  const openItems = itemReservations.filter((r) => r.expiresAt > Date.now());
  const nextQuiz = CHAPTERS.find((c) => !quizDone.includes(c.id));
  const todayPts = ledger.filter((l) => new Date(l.at).toDateString() === new Date().toDateString()).reduce((a, l) => a + l.points, 0);

  const usage: Record<string, number> = { mobility: 0, food: 0, reuse: 0, clean: 0 };
  for (const l of ledger) { const k = l.type.startsWith('ride') ? 'mobility' : l.type.startsWith('food') ? 'food' : l.type.startsWith('reuse') ? 'reuse' : l.type.startsWith('clean') ? 'clean' : ''; if (k) usage[k]++; }
  const actions = ([
    { key: 'mobility', title: t('act.ride'), sub: t('act.ride.sub'), emoji: '🚇', href: '/fahrt', partner: 'Transdev' },
    { key: 'food', title: t('act.food'), sub: t('act.food.sub'), emoji: '🥕', href: '/(tabs)?layer=food', partner: 'foodsharing' },
    { key: 'reuse', title: t('act.reuse'), sub: t('act.reuse.sub'), emoji: '🥡', href: '/mehrweg', partner: 'Vytal' },
    { key: 'clean', title: t('act.clean'), sub: t('act.clean.sub'), emoji: '🧹', href: '/cleanup/list', partner: 'FES' },
  ] as const).slice().sort((a, b) => usage[b.key] - usage[a.key]);
  const favorite = ledger.length >= 3 && usage[actions[0].key] > 0 ? actions[0].key : null;

  return (
    <Screen tabBar={false}>
      <Header title={rt('routes.all_options')} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={T.label}>{new Date().toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: 'long' })}</Text>
          <Text style={[T.h1, { marginTop: 4 }]}>{t('act.title')}</Text>
        </View>
      </View>

      {/* Wochenziel + Chamäleon */}
      <Appear delay={60}>
        <Card style={{ marginTop: S.lg, overflow: 'hidden', paddingVertical: 12 }}>
          <LinearGradient colors={[C.home + '14', '#fff']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable onPress={() => { haptic(); setPoke((p) => p + 1); }}><Chameleon color={C.home} size={150} stage={st.stage as any} mood={mood} lookX={0.4} poke={poke} /></Pressable>
            <View style={{ flex: 1, paddingLeft: 4 }}>
              <Text style={T.h3}>{chameleonName} · {localize(st.label)}</Text>
              <Text style={[T.small, { marginBottom: 10 }]}>{st.next ? rt('routes.value_to_go', { p1: localize(st.next) }) : rt('routes.diamond_reached')}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Ring progress={wk.activeDays / wk.goal} size={70} stroke={9} color={C.leaf}>
                  <Text style={{ fontWeight: '900', fontSize: 16, color: C.ink }}>{wk.activeDays}/{wk.goal}</Text>
                </Ring>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: C.ink }}>{t('week.goal')}</Text>
                  <Text style={T.small}>{wk.activeDays >= wk.goal ? rt('routes.done_raffle_ticket_secured') : rt('routes.value_value_remaining', { p1: wk.goal - wk.activeDays, p2: t('week.days') })}</Text>
                  <Text style={T.small}>{rt('routes.today_value50_points', { p1: todayPts })}</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>
      </Appear>

      {/* Offene Dinge */}
      {(openContainers.length > 0 || openRes.length > 0 || openItems.length > 0) && (
        <Appear delay={120}>
          <View style={{ marginTop: S.md, gap: 8 }}>
            {openContainers.map((c) => {
              const left = Math.max(0, 14 * 24 - (Date.now() - c.borrowedAt) / 3600e3);
              return (
                <Card key={c.code} onPress={() => router.push('/mehrweg')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderLeftWidth: 5, borderLeftColor: C.reuse }}>
                  <Text style={{ fontSize: 24 }}>🥡</Text>
                  <View style={{ flex: 1 }}><Text style={T.h3}>{rt('routes.vytal_value_on_loan', { p1: c.kind === 'cup' ? rt('routes.cup') : rt('routes.bowl') })}</Text><Text style={T.small}>{rt('routes.value_value_days_left_value', { p1: c.storeName, p2: Math.floor(left / 24), p3: left < 48 ? rt('routes.10_points_for_a_quick_return') : rt('routes.return_for_30_points') })}</Text></View>
                  <Text style={{ color: C.reuse, fontWeight: '800' }}>›</Text>
                </Card>
              );
            })}
            {openItems.map((r) => (
              <Card key={r.id} onPress={() => router.push(r.href as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderLeftWidth: 5, borderLeftColor: C.food }}>
                <Ionicons name="bookmark" size={24} color={C.food} />
                <View style={{ flex: 1 }}><Text style={T.h3} numberOfLines={1}>{r.item} · {r.placeTitle}</Text><Text style={T.small}>{rt('routes.reserved_until_value', { p1: new Date(r.expiresAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) })}</Text></View>
                <Text style={{ color: C.food, fontWeight: '800' }}>›</Text>
              </Card>
            ))}
            {openRes.map((r) => (
              <Card key={r.basketId} onPress={() => router.push(`/korb/${r.basketId}` as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderLeftWidth: 5, borderLeftColor: C.food }}>
                <Text style={{ fontSize: 24 }}>🧺</Text>
                <View style={{ flex: 1 }}><Text style={T.h3} numberOfLines={1}>{r.title}</Text><Text style={T.small}>{rt('routes.reserved_until_value_value', { p1: new Date(r.expiresAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }), p2: localize(({ pending: 'Anfrage läuft', accepted: 'Zusage erhalten', cancelled: 'Abgesagt', picked_up: 'Abholung gemeldet', expired: 'abgelaufen' } as const)[r.status]) })}</Text></View>
                <Text style={{ color: C.food, fontWeight: '800' }}>›</Text>
              </Card>
            ))}
          </View>
        </Appear>
      )}

      <View style={{ flexDirection: 'row', gap: 10, marginTop: S.md }}>
        {[{ e: 'radio', l: rt('routes.nfc_tap'), h: '/fahrt?nfc=1', c: C.mobility }, { e: 'scan', l: rt('routes.scan'), h: '/scan', c: C.ink }, { e: 'map', l: rt('routes.map'), h: '/(tabs)', c: C.food }].map((q, i) => (
          <Appear key={q.l} delay={100 + i * 40} style={{ flex: 1 }}>
            <Card onPress={() => router.push(q.h as any)} style={{ alignItems: 'center', paddingVertical: 14, backgroundColor: q.c }}>
              <Ionicons name={q.e as any} size={26} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '800', marginTop: 6 }}>{localize(q.l)}</Text>
            </Card>
          </Appear>
        ))}
      </View>

      <Button label={rt('routes.foodsharing_handoffs_reviews')} color={CONTEXT.food.color} onPress={() => router.push('/uebergaben')} style={{ marginTop: 14 }} />
      <SectionTitle title={rt('routes.main_actions')} />
      <View style={{ gap: 12 }}>
        {actions.map((a, i) => (
          <Appear key={a.key} delay={160 + i * 60}>
            <Card onPress={() => router.push(a.href as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: CONTEXT[a.key].color + '22' }}>
              <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: CONTEXT[a.key].soft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 28 }}>{a.emoji}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={T.h3}>{a.title}</Text>
                <Text style={T.small}>{a.sub}</Text>
                <Row style={{ gap: 6 }}><Tag label={rt('routes.with_value', { p1: a.partner })} color={CONTEXT[a.key].color} />{favorite === a.key && <Tag label={rt('routes.your_favourite')} color={C.gold} />}</Row>
              </View>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: CONTEXT[a.key].color, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '900' }}>›</Text></View>
            </Card>
          </Appear>
        ))}
      </View>

      <SectionTitle title={rt('routes.for_you_today')} />
      <View style={{ gap: 12 }}>
        {nextQuiz && (
          <Appear delay={420}>
            <Card onPress={() => router.push(`/quiz/${nextQuiz.id}` as any)} style={{ backgroundColor: C.ink }}>
              <Text style={[T.label, { color: '#ffffff99' }]}>{rt('routes.daily_mission_learn_with_value', { p1: chameleonName })}</Text>
              <Text style={[T.h3, { color: '#fff', marginTop: 4 }]}>{localize(nextQuiz.title)}</Text>
              <Text style={[T.small, { color: '#ffffffbb', marginTop: 4 }]} numberOfLines={2}>{localize(nextQuiz.intro)}</Text>
              <Text style={{ color: C.leaf, fontWeight: '800', marginTop: 10 }}>{rt('routes.value_points_2_minutes', { p1: nextQuiz.questions.length * 5 })}</Text>
            </Card>
          </Appear>
        )}
        <Appear delay={480}>
          <Card onPress={() => router.push('/melden')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 26 }}>📸</Text>
            <View style={{ flex: 1 }}><Text style={T.h3}>{rt('routes.report_a_full_bin_or_illegal_dumping')}</Text><Text style={T.small}>{rt('routes.photo_location_done_10_points')}</Text></View>
          </Card>
        </Appear>
        <Appear delay={540}>
          <Card onPress={() => router.push('/scan?mode=litter')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Text style={{ fontSize: 26 }}>🫶</Text>
            <View style={{ flex: 1 }}><Text style={T.h3}>{rt('routes.picked_up_litter')}</Text><Text style={T.small}>{rt('routes.no_points_but_value_is_happy', { p1: chameleonName })}</Text></View>
          </Card>
        </Appear>
      </View>
    </Screen>
  );
}
