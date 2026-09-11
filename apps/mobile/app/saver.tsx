import React, { useEffect, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import { Appear, Button, Card, Divider, Pill, Row, StatusBadge, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { fs, type FsUser, type Verification } from '@/api/foodsharing';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';

const col = CONTEXT.food.color;

/** Digitales Saver-Onboarding über die Verifikations-Endpunkte der foodsharing-API (Quiz → 3 Einführungsabholungen → Freigabe). */
export default function Saver() {
  const router = useRouter();
  const [user, setUser] = useState<FsUser | null>(null);
  const [ver, setVer] = useState<Verification | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [title, setTitle] = useState('');
  const [items, setItems] = useState('');
  const [slots, setSlots] = useState(8);
  const { quizDone, addAward } = useStore();
  const { setCtx, showToast } = useUI();

  async function load() {
    try {
      const users = await fs.users();
      const u = users.find((x) => !x.is_default) ?? users[0];
      setUser(u); setVer(await fs.verification(u.id)); setOffline(false);
    } catch (e: any) { setOffline(true); setLog((l) => [`API nicht erreichbar: ${e.message}`, ...l]); }
  }
  useEffect(() => { setCtx('food'); load(); }, []);

  async function step(patch: Partial<Verification>, label: string) {
    if (!user) return; setBusy(true); haptic();
    try { const v = await fs.patchVerification(user.id, patch); setVer(v); setLog((l) => [`✓ ${label} → PATCH /users/${user.id}/verification`, ...l]); }
    catch (e: any) { setLog((l) => [`✗ ${label}: ${e.message}`, ...l]); }
    setBusy(false);
  }
  async function approve() {
    if (!user) return; setBusy(true);
    try { await fs.approve(user.id); const v = await fs.verification(user.id); setVer(v); setLog((l) => [`✓ Freigabe → POST /users/me/approve`, ...l]); haptic('success'); }
    catch (e: any) { setLog((l) => [`✗ Freigabe: ${e.message}`, ...l]); }
    setBusy(false);
  }
  const quizOk = quizDone.includes('q3');
  const isVerified = !!ver?.is_verified;
  const trials = ver?.trial_pickups_completed ?? 0, need = ver?.trial_pickups_required ?? 3;

  function createDistribution() {
    if (!title.trim()) return;
    showToast(addAward({ type: 'food.distribute', partner: 'foodsharing', status: isVerified ? 'bestätigt' : 'selbst angegeben', key: `dist:new:${Date.now()}`, at: Date.now(), title: `Verteilung: ${title}`, meta: { food_g: 6000, source: isVerified ? 'api (verifizierter Saver)' : 'user', evidence: [isVerified ? 'Saver-Status in der foodsharing-API verifiziert' : 'Saver-Status noch nicht verifiziert', `${slots} Slots à 5 min, Posten: ${items || 'nicht angegeben'}`] } }));
    router.replace('/(tabs)/handeln');
  }

  const steps = [
    { n: 1, t: 'Hygiene-Quiz', done: (ver?.quiz_passed ?? false) || quizOk, sub: quizOk ? 'Kapitel 3 bestanden' : 'Kapitel 3 „Der Fairteiler“ in der App', action: quizOk && !ver?.quiz_passed ? () => step({ quiz_passed: true }, 'Quiz bestanden') : () => router.push('/quiz/q3'), label: quizOk && !ver?.quiz_passed ? 'In API eintragen' : 'Quiz starten' },
    { n: 2, t: `Einführungsabholungen ${Math.min(trials, need)}/${need}`, done: trials >= need, sub: 'Dreimal mit einem erfahrenen Saver mitgehen', action: () => step({ trial_pickups_completed: Math.min(need, trials + 1) }, `Einführungsabholung ${trials + 1}`), label: 'Abholung bestätigen' },
    { n: 3, t: 'Freigabe durch Mentor:in', done: !!ver?.mentor_approved, sub: 'Bestätigt durch erfahrene Foodsaver', action: () => step({ mentor_approved: true }, 'Mentor-Freigabe'), label: 'Freigabe simulieren' },
    { n: 4, t: 'Verifikation berechnen', done: isVerified, sub: 'is_verified = true → Geschäftsrettungen erlaubt', action: approve, label: 'Berechnen' },
  ];

  return (
    <Screen tabBar={false}>
      <Header title="Saver werden" subtitle="Onboarding über die foodsharing-API" color={col} />
      <Appear>
        <Card style={{ backgroundColor: isVerified ? C.success : col }}>
          <Row>
            <View style={{ flex: 1 }}>
              <Text style={[T.label, { color: '#ffffffaa' }]}>{user ? `${user.display_name} · Team ${user.team_id}` : offline ? 'Offline-Demo' : 'Lade Nutzer…'}</Text>
              <Text style={[T.h2, { color: '#fff' }]}>{isVerified ? 'Verifizierter Saver' : 'Noch nicht verifiziert'}</Text>
              <Text style={[T.small, { color: '#ffffffcc' }]}>Nicht jede Person ist automatisch Saver. Der echte Prozess: Quiz, drei Einführungsabholungen, Freigabe. Die API bildet genau das ab.</Text>
            </View>
            <Chameleon color="#fff" size={90} branch={false} mood={isVerified ? 'excited' : 'thinking'} />
          </Row>
        </Card>
      </Appear>
      <View style={{ marginTop: 14, gap: 10 }}>
        {steps.map((s, i) => (
          <Appear key={s.n} delay={80 + i * 60}>
            <Card style={{ borderLeftWidth: 5, borderLeftColor: s.done ? C.success : C.line }}>
              <Row>
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: s.done ? C.success : C.line, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: s.done ? '#fff' : C.muted, fontWeight: '900' }}>{s.done ? '✓' : s.n}</Text></View>
                <View style={{ flex: 1 }}><Text style={T.h3}>{s.t}</Text><Text style={T.small}>{s.sub}</Text></View>
                {!s.done && <Button label={s.label} color={col} variant="soft" disabled={busy || (offline && s.n > 1)} onPress={s.action} style={{ paddingVertical: 8, paddingHorizontal: 12 }} />}
              </Row>
            </Card>
          </Appear>
        ))}
      </View>
      <Card style={{ marginTop: 14 }}>
        <Text style={T.label}>API-Protokoll</Text>
        {log.length === 0 ? <Text style={[T.small, { marginTop: 4 }]}>Noch keine Aufrufe.</Text> : log.slice(0, 6).map((l, i) => <Text key={i} style={[T.small, { marginTop: 4, color: l.startsWith('✓') ? C.success : C.danger }]}>{l}</Text>)}
        <Row style={{ marginTop: 8, gap: 6 }}><Tag label={`may_pick_up_from_business: ${String(ver?.may_pick_up_from_business ?? false)}`} /><Tag label={`may_earn_rewards: ${String(ver?.may_earn_rewards ?? false)}`} /></Row>
      </Card>

      <Text style={[T.h2, { marginTop: S.xl }]}>Verteilung anlegen</Text>
      <Text style={T.small}>Ersetzt die WhatsApp-Gruppe: Zeitfenster, Posten, Slots. Leute im Umkreis bekommen eine Nachricht (Ruhezeit 22–7 Uhr).</Text>
      <Card style={{ marginTop: 10, gap: 10 }}>
        <TextInput value={title} onChangeText={setTitle} placeholder="z. B. REWE Oeder Weg, Backwaren & Obst" placeholderTextColor={C.muted} style={{ backgroundColor: C.bg, borderRadius: 12, padding: 12, fontWeight: '700', color: C.ink }} />
        <TextInput value={items} onChangeText={setItems} placeholder="Posten, z. B. 2 Tüten Laugenstangen, 6× Joghurt" placeholderTextColor={C.muted} style={{ backgroundColor: C.bg, borderRadius: 12, padding: 12, color: C.ink }} />
        <Row style={{ gap: 6 }}><Text style={T.small}>Slots</Text>{[6, 8, 12].map((n) => <Pill key={n} label={String(n)} active={slots === n} color={col} onPress={() => setSlots(n)} />)}</Row>
        <Button label={`Veröffentlichen · 60 P ${isVerified ? '(bestätigt)' : '(×0,3 bis zur Verifikation)'}`} color={col} onPress={createDistribution} disabled={!title.trim()} />
        <Row style={{ gap: 6 }}><StatusBadge status={isVerified ? 'bestätigt' : 'selbst angegeben'} small /><Text style={T.small}>Adresse wird nie öffentlich. Kreis 300 m, exakt erst 15 min vor Slot.</Text></Row>
      </Card>
    </Screen>
  );
}
