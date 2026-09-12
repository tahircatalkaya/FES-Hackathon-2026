import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import { Appear, Button, Card, Divider, Row, SectionTitle, Stat, T, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore, balance, weekStats, chameleonStage } from '@/store';
import { useUI } from '@/store/ui';
import { LANGS } from '@/i18n';
import { useT } from '@/i18n/useT';
import { CHAPTERS } from '@/data/mock';

const col = CONTEXT.home.color;

export default function Profile() {
  const router = useRouter();
  const t = useT();
  const s = useStore();
  const { setCtx } = useUI();
  const [editName, setEditName] = useState(false);
  const [nm, setNm] = useState(s.name);
  const [showLanguages, setShowLanguages] = useState(false);
  useEffect(() => { setCtx('home'); }, []);
  const bal = balance(s), wk = weekStats(s.ledger), st = chameleonStage(s.ledger);
  const unread = s.notices.filter((n) => !n.read).length;
  const nextQuiz = CHAPTERS.find((c) => !s.quizDone.includes(c.id));

  function reset() {
    const go = () => { s.resetAll(); router.replace('/onboarding'); };
    if (Platform.OS === 'web') { if (confirm('Alle Daten löschen?')) go(); } else Alert.alert('Alle Daten löschen?', 'Journal, Reservierungen, Behälter und Einstellungen werden lokal gelöscht.', [{ text: 'Abbrechen' }, { text: 'Löschen', style: 'destructive', onPress: go }]);
  }

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={T.h1}>{t('tab.profile')}</Text>
        <Row style={{ gap: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Sprachen" accessibilityState={{ expanded: showLanguages }} onPress={() => setShowLanguages((open) => !open)} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>🌐</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Mitteilungen" onPress={() => { s.markRead(); router.push('/journal?tab=notices'); }} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {unread > 0 && <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: C.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{unread}</Text></View>}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Ausloggen" onPress={() => router.replace('/anmelden')} style={{ height: 42, borderRadius: 21, backgroundColor: '#fff', paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.ink, fontSize: 14, fontWeight: '800' }}>Ausloggen</Text>
          </Pressable>
        </Row>
      </Row>

      {showLanguages && (
        <Card style={{ marginTop: 8 }}>
          {LANGS.filter((language) => language.code !== 'leicht').map((language, index, languages) => (
            <View key={language.code}>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: s.lang === language.code }} onPress={() => { s.setProfile({ lang: language.code }); setShowLanguages(false); }} style={{ paddingVertical: 10 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text style={T.body}>{language.flag} {language.label}</Text>
                  {s.lang === language.code && <Text style={{ color: col, fontWeight: '900' }}>✓</Text>}
                </Row>
              </Pressable>
              {index < languages.length - 1 && <Divider />}
            </View>
          ))}
        </Card>
      )}

      <Appear delay={40}>
        <Card style={{ marginTop: S.lg }}>
          <Row>
            <Chameleon pose="cool" size={110} />
            <View style={{ flex: 1 }}>
              {editName ? (
                <Row><TextInput value={nm} onChangeText={setNm} style={{ flex: 1, backgroundColor: C.bg, borderRadius: 10, padding: 8, fontWeight: '800', color: C.ink }} maxLength={24} /><Button label="OK" color={col} onPress={() => { s.setProfile({ name: nm.trim() || s.name }); setEditName(false); }} style={{ paddingVertical: 8, paddingHorizontal: 12 }} /></Row>
              ) : (
                <Pressable onPress={() => setEditName(true)}><Text style={T.h2}>{s.name || 'Du'} ✎</Text></Pressable>
              )}
              <Text style={T.small}>{s.district} · mit {s.chameleonName}, {st.label}</Text>
              <Button label="Meine Daten" variant="soft" color={col} onPress={() => router.push('/daten')} style={{ marginTop: 10, paddingVertical: 9, paddingHorizontal: 12 }} />
            </View>
          </Row>
          <Divider />
          <Row style={{ gap: 8 }}>
            <Stat label={t('profile.points')} value={String(bal)} color={C.success} sub="einlösbar" />
            <Stat label={t('profile.lose')} value={String(s.lose)} color={col} sub="Deutschlandticket" />
            <Stat label="Aktionen" value={String(s.ledger.filter((l) => l.points > 0).length)} />
          </Row>
        </Card>
      </Appear>

      <View style={{ marginTop: 12 }}>
        <Button label="Belohnungen" icon="🎁" color={col} onPress={() => router.push('/belohnungen')} style={{ width: '100%', paddingVertical: 14 }} />
      </View>

      <SectionTitle title="Lernen" />
      <Appear delay={60}>
        {nextQuiz ? (
          <Card onPress={() => router.push(('/quiz/' + nextQuiz.id) as any)} style={{ backgroundColor: C.ink }}>
            <Text style={[T.label, { color: '#ffffff99' }]}>FES-Wissen · mit {s.chameleonName}</Text>
            <Text style={[T.h3, { color: '#fff', marginTop: 4 }]}>{nextQuiz.title}</Text>
            <Text style={[T.small, { color: '#ffffffbb', marginTop: 4 }]} numberOfLines={2}>{nextQuiz.intro}</Text>
            <Text style={{ color: C.leaf, fontWeight: '800', marginTop: 10 }}>{nextQuiz.questions.length} Fragen · +{nextQuiz.questions.length * 5} Punkte</Text>
          </Card>
        ) : (
          <Card>
            <Text style={T.h3}>Alle Kapitel geschafft</Text>
            <Text style={T.small}>Neue Lerninhalte kommen mit dem nächsten Update.</Text>
          </Card>
        )}
      </Appear>

      <SectionTitle title="Datenschutz" />
      <Appear delay={80}>
        <Card>
          {[
            { k: 'tripOnlyLocation', t: 'Standort während einer Fahrt', s: 'Die App nutzt deinen Standort nur, wenn du eine Fahrt startest.' },
            { k: 'shareAggregates', t: 'Daten für das Frankfurt-Ziel', s: 'Zusammengefasste Daten. Dein Name und deine Route werden nicht geteilt.' },
            { k: 'notifications', t: 'Mitteilungen', s: 'Erinnerungen und wichtige Hinweise aus der App.' },
            { k: 'quietHours', t: 'Ruhezeit von 22 bis 7 Uhr', s: 'In dieser Zeit bleiben Mitteilungen aus.' },
          ].map((row, i) => (
            <View key={row.k}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}><Text style={T.h3}>{row.t}</Text><Text style={T.small}>{row.s}</Text></View>
                <Switch value={(s.privacy as any)[row.k]} onValueChange={(v) => { haptic(); s.setPrivacy({ [row.k]: v } as any); }} trackColor={{ true: col, false: C.line }} thumbColor="#fff" />
              </Row>
              {i < 3 && <Divider />}
            </View>
          ))}
        </Card>
      </Appear>
      <View style={{ marginTop: 10, gap: 8 }}>
        <Button label="Alle Daten löschen" variant="ghost" color={C.danger} onPress={reset} style={{ paddingVertical: 12 }} />
      </View>

    </Screen>
  );
}
