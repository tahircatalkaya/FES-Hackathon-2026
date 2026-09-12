import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import { Appear, Button, Card, Divider, Pill, Row, SectionTitle, Stat, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore, balance, weekStats, chameleonStage } from '@/store';
import { useUI } from '@/store/ui';
import { LANGS } from '@/i18n';
import { useT } from '@/i18n/useT';
import { DISTRICTS } from '@/data/mock';

const col = CONTEXT.home.color;

export default function Profile() {
  const router = useRouter();
  const t = useT();
  const s = useStore();
  const { setCtx } = useUI();
  const [editName, setEditName] = useState(false);
  const [nm, setNm] = useState(s.name);
  useEffect(() => { setCtx('home'); }, []);
  const bal = balance(s), wk = weekStats(s.ledger), st = chameleonStage(s.ledger);
  const unread = s.notices.filter((n) => !n.read).length;

  function reset() {
    const go = () => { s.resetAll(); router.replace('/onboarding'); };
    if (Platform.OS === 'web') { if (confirm('Alle Daten löschen?')) go(); } else Alert.alert('Alle Daten löschen?', 'Journal, Reservierungen, Behälter und Einstellungen werden lokal gelöscht.', [{ text: 'Abbrechen' }, { text: 'Löschen', style: 'destructive', onPress: go }]);
  }

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={T.h1}>{t('tab.profile')}</Text>
        <Pressable onPress={() => { s.markRead(); router.push('/journal?tab=notices'); }} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
          {unread > 0 && <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: C.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{unread}</Text></View>}
        </Pressable>
      </Row>

      <Appear delay={40}>
        <Card style={{ marginTop: S.lg }}>
          <Row>
            <Chameleon color={col} size={110} stage={st.stage as any} />
            <View style={{ flex: 1 }}>
              {editName ? (
                <Row><TextInput value={nm} onChangeText={setNm} style={{ flex: 1, backgroundColor: C.bg, borderRadius: 10, padding: 8, fontWeight: '800', color: C.ink }} maxLength={24} /><Button label="OK" color={col} onPress={() => { s.setProfile({ name: nm.trim() || s.name }); setEditName(false); }} style={{ paddingVertical: 8, paddingHorizontal: 12 }} /></Row>
              ) : (
                <Pressable onPress={() => setEditName(true)}><Text style={T.h2}>{s.name || 'Du'} ✎</Text></Pressable>
              )}
              <Text style={T.small}>{s.district} · mit {s.chameleonName}, {st.label}</Text>
              <Row style={{ gap: 6, marginTop: 6, flexWrap: 'wrap' }}><Tag label="Anzeigename" /><Tag label="keine Adresse" /><Tag label="keine Telefonnummer" /></Row>
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

      <Row style={{ marginTop: 12, gap: 8 }}>
        <Button label="Belohnungen" icon="gift" color={col} onPress={() => router.push('/belohnungen')} style={{ flex: 1, paddingVertical: 12 }} />
        <Button label="Journal" icon="journal" color={col} variant="soft" onPress={() => router.push('/journal')} style={{ flex: 1, paddingVertical: 12 }} />
      </Row>

      <SectionTitle title="Sprache" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>{LANGS.map((l) => <Pill key={l.code} label={`${l.flag} ${l.label}`} active={s.lang === l.code} color={col} onPress={() => s.setProfile({ lang: l.code })} />)}</ScrollView>
      <Text style={[T.small, { marginTop: 8 }]}>Leichte Sprache ist eine eigene Stufe, nicht nur eine Übersetzung. Für eine Stadt-App das stärkere Inklusionsargument.</Text>

      <SectionTitle title="Stadtteil" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>{DISTRICTS.map((d) => <Pill key={d.name} label={d.name} active={s.district === d.name} color={col} onPress={() => s.setProfile({ district: d.name })} />)}</ScrollView>

      <SectionTitle title="Datenschutz" />
      <Appear delay={80}>
        <Card>
          {[
            { k: 'tripOnlyLocation', t: 'Standort nur während bewusst gestarteter Fahrt', s: 'Kein Hintergrund-Tracking. Matching läuft auf dem Gerät.' },
            { k: 'shareAggregates', t: 'Aggregierte Daten ans Frankfurt-Ziel', s: 'Linie, Stunde, Richtung, Anzahl. k ≥ 5, keine Rohspur.' },
            { k: 'notifications', t: 'Mitteilungen', s: 'Angebote in der Nähe, Rückgabe-Erinnerungen, Zusagen.' },
            { k: 'quietHours', t: 'Ruhezeit 22–7 Uhr', s: 'Voreingestellt. Max. 5 Mitteilungen am Tag.' },
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
        <Button label="Meine Daten ansehen (Export)" variant="soft" color={col} onPress={() => router.push('/daten')} style={{ paddingVertical: 12 }} />
        <Button label="Alle Daten löschen" variant="ghost" color={C.danger} onPress={reset} style={{ paddingVertical: 12 }} />
        <Text style={[T.small, { textAlign: 'center' }]}>Löschen funktioniert wirklich, auch in der Demo. Es steht hier und nicht im Support-Formular.</Text>
      </View>

      <SectionTitle title="Foodsharing" />
      <Button label="Übergaben & Zuverlässigkeit" icon="🤝" variant="soft" color={col} onPress={() => router.push('/uebergaben')} style={{ marginBottom: 12 }} />

      <SectionTitle title="Über Mainsam" />
      <Button label="Partner" icon="heart-circle-outline" variant="soft" color={col} onPress={() => router.push('/partner')} style={{ marginBottom: 12 }} />
      <Card>
        <Text style={T.body}>Mainsam bündelt Ride2Impact (Transdev), Smart Mehrweg (Vytal), Save2Share (Frankfurt foodsharing), Sauberes Frankfurt (FES) und den Mobilitätsimpact (traffiQ) in einer Journey. Punkte gibt es für Entscheidungen, nicht für Mengen. Jede Gutschrift erklärt sich selbst.</Text>
        <Row style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}><Tag label="Frankfurt gemeinsam" color={col} /><Tag label="Ressourcen teilen" /></Row>
      </Card>
    </Screen>
  );
}
