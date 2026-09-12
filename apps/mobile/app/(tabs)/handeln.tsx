import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { CelebrationOverlay, ChamiMascot } from '@/components/ChamiMascot';
import { FesLogo } from '@/components/FesLogo';
import { Appear, Button, Card, Ring, SectionTitle, T, Tag, haptic } from '@/components/ui';
import { BingoSheet } from '@/components/BingoSheet';
import { BinCheckSheet } from '@/components/BinCheckSheet';
import { NewActionSheet } from '@/components/NewActionSheet';
import { C, R, S } from '@/theme';
import { useStore, chameleonStage, weekStats } from '@/store';
import { useUI } from '@/store/ui';
import { CLEANUPS } from '@/data/mock';
import { BINGO, bingoIndexFor, dayKey } from '@/data/fes';

/** FES-Bereich: drei Tages-Challenges und die Aktionen im eigenen Viertel. */
export default function Act() {
  const router = useRouter();
  const { ledger, chameleonName, district, ownCleanups, joinedCleanups, joinCleanup, addAward } = useStore();
  const { setCtx } = useUI();
  const [sheet, setSheet] = useState<null | 'bingo' | 'bin' | 'new'>(null);
  const [reward, setReward] = useState<null | { points: number; duplicate: boolean; status: string }>(null);
  const [showAll, setShowAll] = useState(false);
  useEffect(() => { setCtx('clean'); }, []);

  const st = chameleonStage(ledger);
  const wk = weekStats(ledger);
  const todayIndex = bingoIndexFor();

  const bingo = useMemo(() => {
    const days = ledger.filter((l) => l.key.startsWith('bingo:')).map((l) => l.key.slice(6));
    return { filled: new Set(days.map((d) => bingoIndexFor(new Date(d)))).size, doneToday: days.includes(dayKey()), days };
  }, [ledger]);

  const binDone = ledger.some((l) => l.key === `bincheck:${dayKey()}`);
  /** Tagesziel statt Streak: drei Challenges, die heute offenstehen. */
  const joinedToday = ledger.some((l) => l.type === 'clean.participate' && new Date(l.at).toDateString() === new Date().toDateString());
  const todayDone = [bingo.doneToday, binDone, joinedToday].filter(Boolean).length;
  const nearby = [...ownCleanups, ...CLEANUPS]
    .filter((c) => c.end > Date.now())
    .sort((a, b) => (a.district === district ? -1 : b.district === district ? 1 : a.start - b.start));
  const shown = showAll ? nearby : nearby.slice(0, 3);

  function join(id: string, title: string) {
    joinCleanup(id);
    const a = addAward({
      type: 'clean.participate',
      partner: 'fes',
      status: 'ausstehend',
      key: `cleanup-join:${id}`,
      at: Date.now(),
      title: `Angemeldet: ${title}`,
      meta: { source: 'user', evidence: ['Anmeldung erfasst. Punkte erst nach bestätigter Teilnahme vor Ort.'] },
    });
    haptic('success');
    setReward({ points: a.points, duplicate: !!a.duplicate, status: a.status });
  }

  return (
    <Screen>
      <FesLogo width={92} />
      <Text style={[T.h1, { marginTop: 10 }]}>Wir machen die Stadt. Sauber.</Text>

      {/* Kopf: Chamäleon, Tagesziel, eigene Aktion anlegen */}
      <Appear delay={60}>
        <Card style={{ marginTop: S.lg, overflow: 'hidden', paddingVertical: 12 }}>
          <LinearGradient colors={[C.clean + '18', '#fff']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ChamiMascot size={140} />
            <View style={{ flex: 1, paddingLeft: 4 }}>
              <Text style={T.h3}>{chameleonName} · {st.label}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
                <Ring progress={todayDone / 3} size={62} stroke={8} color={C.clean}>
                  <Text style={{ fontWeight: '900', fontSize: 14, color: C.ink }}>{todayDone}/3</Text>
                </Ring>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '800', color: C.ink }}>Challenges heute</Text>
                  <Text style={T.small}>{todayDone === 3 ? 'Alle drei geschafft' : `Noch ${3 - todayDone} offen`} · Wochenziel {wk.activeDays}/{wk.goal} Tage</Text>
                </View>
              </View>
            </View>
          </View>
          <Button label="Aktion starten" icon="🤝" onPress={() => setSheet('new')} color={C.clean} style={{ marginTop: S.md }} />
        </Card>
      </Appear>

      {/* Biotonnen-Check zuerst: ganz oben erreichbar */}
      <Appear delay={120}>
        <Card onPress={() => setSheet('bin')} style={{ marginTop: S.md, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 2, borderColor: binDone ? C.leaf : 'transparent' }}>
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: binDone ? C.leaf + '26' : C.clean + '18', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 27 }}>♻️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={T.label}>{binDone ? 'Heute geprüft' : 'Foto reicht'}</Text>
            <Text style={T.h3}>Biotonnen-Check</Text>
          </View>
          <Ionicons name={binDone ? 'checkmark-circle' : 'chevron-forward'} size={binDone ? 26 : 20} color={binDone ? C.success : C.muted} />
        </Card>
      </Appear>

      {/* Bingo kompakt, Karte liegt im Pop-up */}
      <Appear delay={180}>
        <Card onPress={() => setSheet('bingo')} style={{ marginTop: S.md, borderWidth: 2, borderColor: bingo.doneToday ? C.leaf : 'transparent' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: S.md }}>
            <Text style={T.h3}>Mülleimer-Bingo</Text>
            <View style={{ backgroundColor: C.clean + '18', borderRadius: R.pill, paddingHorizontal: 11, paddingVertical: 4 }}>
              <Text style={{ fontWeight: '900', fontSize: 12, color: C.clean }}>{bingo.filled}/{BINGO.length}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: bingo.doneToday ? C.leaf + '26' : '#F3F2EC', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 25 }}>{BINGO[todayIndex].icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={T.label}>{bingo.doneToday ? 'Heute erledigt' : 'Heutige Challenge'}</Text>
              <Text style={T.h3} numberOfLines={2}>{BINGO[todayIndex].title}</Text>
            </View>
            <Ionicons name={bingo.doneToday ? 'checkmark-circle' : 'chevron-forward'} size={bingo.doneToday ? 26 : 20} color={bingo.doneToday ? C.success : C.muted} />
          </View>
          <View style={{ height: 8, borderRadius: 5, backgroundColor: C.line, marginTop: S.md, overflow: 'hidden' }}>
            <View style={{ width: `${(bingo.filled / BINGO.length) * 100}%`, height: '100%', backgroundColor: C.clean }} />
          </View>
        </Card>
      </Appear>

      {/* Aktionen im Viertel */}
      <SectionTitle title="Aktionen in deiner Nähe" action={nearby.length > 3 ? (showAll ? 'Weniger' : `Alle ${nearby.length}`) : undefined} onAction={() => setShowAll((v) => !v)} />
      <View style={{ gap: 10 }}>
        {shown.map((c, i) => {
          const joined = joinedCleanups.includes(c.id);
          return (
            <Appear key={c.id} delay={300 + i * 50}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
                <Pressable onPress={() => router.push(`/cleanup/${c.id}` as any)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Text style={{ fontSize: 24 }}>🤝</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={T.h3} numberOfLines={1}>{c.title}</Text>
                    <Text style={T.small} numberOfLines={1}>
                      {c.district} · {new Date(c.start).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })}, {new Date(c.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · {c.participants} dabei
                    </Text>
                    {c.fesConfirmed ? <Tag label="FES bestätigt" color={C.success} /> : null}
                  </View>
                </Pressable>
                <Pressable onPress={() => (joined ? router.push(`/cleanup/${c.id}` as any) : join(c.id, c.title))} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: R.pill, backgroundColor: joined ? C.leaf + '26' : C.clean }}>
                  <Text style={{ fontWeight: '800', fontSize: 13, color: joined ? '#3F7A25' : '#fff' }}>{joined ? 'Angemeldet' : 'Mitmachen'}</Text>
                </Pressable>
              </Card>
            </Appear>
          );
        })}
      </View>

      <CelebrationOverlay open={!!reward} points={reward?.points} duplicate={reward?.duplicate} pending={reward?.status === 'ausstehend'} onClose={() => setReward(null)} />
      <BingoSheet open={sheet === 'bingo'} onClose={() => setSheet(null)} onDone={setReward} />
      <BinCheckSheet open={sheet === 'bin'} onClose={() => setSheet(null)} onDone={setReward} />
      <NewActionSheet open={sheet === 'new'} onClose={() => setSheet(null)} />
    </Screen>
  );
}
