import React, { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import Chameleon from '@/components/Chameleon';
import { Appear, Button, Card, Divider, Row, SectionTitle, Stat, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { useStore, balance, weekStats, chameleonStage, STAGES } from '@/store';
import { useUI } from '@/store/ui';
import { LANGS } from '@/i18n';
import { useT, useLocalize } from '@/i18n/useT';
import { CHAPTERS } from '@/data/mock';
import { trust } from '@/api/trust';

const col = CONTEXT.home.color;

export default function Profile() {
  const router = useRouter();
  const t = useT();
  const l = useLocalize();
  const s = useStore();
  const { setCtx } = useUI();
  const [editName, setEditName] = useState(false);
  const [nm, setNm] = useState(s.name);
  const [showLanguages, setShowLanguages] = useState(false);
  useEffect(() => { setCtx('home'); }, []);
  const bal = balance(s), wk = weekStats(s.ledger), st = chameleonStage(s.ledger);
  const unread = s.notices.filter((n) => !n.read).length;
  const nextQuiz = CHAPTERS.find((c) => !s.quizDone.includes(c.id));

  const [leaving, setLeaving] = useState(false);
  async function leave(resetLocal = false) {
    if (leaving) return;
    setLeaving(true);
    try { await trust.logout(); } catch { /* Local credentials are cleared even when offline. */ }
    finally {
      if (resetLocal) s.resetAll();
      else { s.syncFoodAwards([]); s.syncContainers([]); }
      router.replace(resetLocal ? '/onboarding' : '/anmelden');
      setLeaving(false);
    }
  }

  function reset() {
    const go = () => { void leave(true); };
    if (Platform.OS === 'web') { if (confirm(t('tabs.profile.resetTitle'))) go(); } else Alert.alert(t('tabs.profile.resetTitle'), t('tabs.profile.resetBody'), [{ text: t('common.cancel') }, { text: t('tabs.profile.delete'), style: 'destructive', onPress: go }]);
  }

  return (
    <Screen>
      <Row style={{ justifyContent: 'space-between' }}>
        <Text style={T.h1}>{t('tab.profile')}</Text>
        <Row style={{ gap: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('tabs.languages')} accessibilityState={{ expanded: showLanguages }} onPress={() => setShowLanguages((open) => !open)} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>🌐</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('tabs.notifications')} onPress={() => { s.markRead(); router.push('/mitteilungen'); }} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            {unread > 0 && <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: C.danger, borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 10, fontWeight: '900' }}>{unread}</Text></View>}
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={t('tabs.logout')} accessibilityState={{ disabled: leaving }} disabled={leaving} onPress={() => void leave()} style={{ height: 42, borderRadius: 21, backgroundColor: '#fff', paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: C.ink, fontSize: 14, fontWeight: '800' }}>{t('tabs.logout')}</Text>
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
            <Chameleon pose={STAGES[Math.max(0, st.stage - 1)].pose} size={110} />
            <View style={{ flex: 1 }}>
              {editName ? (
                <Row><TextInput value={nm} onChangeText={setNm} style={{ flex: 1, backgroundColor: C.bg, borderRadius: 10, padding: 8, fontWeight: '800', color: C.ink }} maxLength={24} /><Button label={t('tabs.ok')} color={col} onPress={() => { s.setProfile({ name: nm.trim() || s.name }); setEditName(false); }} style={{ paddingVertical: 8, paddingHorizontal: 12 }} /></Row>
              ) : (
                <Pressable onPress={() => setEditName(true)}><Text style={T.h2}>{s.name || t('tabs.you')} ✎</Text></Pressable>
              )}
              <Text style={T.small}>{t('tabs.profile.companion', { district: s.district, name: s.chameleonName, stage: l(st.label) })}</Text>
              <Button label={t('tabs.profile.data')} variant="soft" color={col} onPress={() => router.push('/daten')} style={{ marginTop: 10, paddingVertical: 9, paddingHorizontal: 12 }} />
            </View>
          </Row>
          <Divider />
          <Row style={{ gap: 8 }}>
            <Stat label={t('profile.points')} value={String(bal)} color={C.success} sub={t('tabs.profile.redeemable')} />
            <Stat label={t('profile.lose')} value={String(s.lose)} color={col} sub="Deutschlandticket" />
            <Stat label={t('tabs.profile.actions')} value={String(s.ledger.filter((l) => l.points > 0).length)} />
          </Row>
        </Card>
      </Appear>

      <View style={{ marginTop: 12, gap: 8 }}>
        <Button label={t('profile.rewards')} icon="gift" color={col} onPress={() => router.push('/belohnungen')} style={{ width: '100%', paddingVertical: 14 }} />
      </View>

      <SectionTitle title={t('act.learn')} />
      <Appear delay={60}>
        {nextQuiz ? (
          <Card onPress={() => router.push(('/quiz/' + nextQuiz.id) as any)} style={{ backgroundColor: C.ink }}>
            <Text style={[T.label, { color: '#ffffff99' }]}>{t('tabs.profile.fesLearning', { name: s.chameleonName })}</Text>
            <Text style={[T.h3, { color: '#fff', marginTop: 4 }]}>{l(nextQuiz.title)}</Text>
            <Text style={[T.small, { color: '#ffffffbb', marginTop: 4 }]} numberOfLines={2}>{l(nextQuiz.intro)}</Text>
            <Text style={{ color: C.leaf, fontWeight: '800', marginTop: 10 }}>{t('tabs.profile.quizReward', { questions: nextQuiz.questions.length, points: nextQuiz.questions.length * 2 })}</Text>
          </Card>
        ) : (
          <Card>
            <Text style={T.h3}>{t('tabs.profile.chaptersDone')}</Text>
            <Text style={T.small}>{t('tabs.profile.moreLearning')}</Text>
          </Card>
        )}
      </Appear>

      <SectionTitle title={t('tabs.profile.privacy')} />
      <Text style={[T.body,{marginBottom:12}]}>{t('updates.location')}</Text>
      <Appear delay={80}>
        <Card>
          {[
            { k: 'shareAggregates', t: t('tabs.profile.aggregates'), s: t('tabs.profile.aggregatesHelp') },
            { k: 'notifications', t: t('tabs.notifications'), s: t('tabs.profile.notificationsHelp') },
            { k: 'quietHours', t: t('tabs.profile.quietHours'), s: t('tabs.profile.quietHoursHelp') },
          ].map((row, i) => (
            <View key={row.k}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}><Text style={T.h3}>{row.t}</Text><Text style={T.small}>{row.s}</Text></View>
                <Switch value={(s.privacy as any)[row.k]} onValueChange={(v) => { haptic(); s.setPrivacy({ [row.k]: v } as any); }} trackColor={{ true: col, false: C.line }} thumbColor="#fff" />
              </Row>
              {i < 2 && <Divider />}
            </View>
          ))}
        </Card>
      </Appear>
      <View style={{ marginTop: 10, gap: 8 }}>
        <Button label={t('tabs.profile.deleteLocal')} variant="ghost" color={C.danger} onPress={reset} style={{ paddingVertical: 12 }} />
        <Text style={T.small}>{t('tabs.profile.serverDataRetained')}</Text>
      </View>

      <SectionTitle title="Dein Zugang" />
      <Text style={T.body}>{s.accessMode==='guest'?'Du nutzt Mainsam als Gast. Essen bleibt ohne Registrierung zugänglich.':'Ein Zugang gilt für alle Bereiche der App. Deine E-Mail bleibt privat.'}</Text>
      {s.accessMode==='guest'&&<Button label="Zugang einrichten" variant="soft" color={col} onPress={()=>router.push('/anmelden?register=1')} style={{ marginBottom: 12 }}/>}

      <SectionTitle title={t('tabs.profile.foodsharing')} />
      <Button label={t('tabs.profile.handovers')} icon="🤝" variant="soft" color={col} onPress={() => router.push('/uebergaben')} style={{ marginBottom: 12 }} />

      <SectionTitle title={t('tabs.profile.about')} />
      <Button label={t('tabs.profile.partners')} icon="heart-circle-outline" variant="soft" color={col} onPress={() => router.push('/partner')} style={{ marginBottom: 12 }} />
      <Card>
        <Text style={T.body}>{t('tabs.profile.aboutBody')}</Text>
        <Row style={{ gap: 6, marginTop: 8, flexWrap: 'wrap' }}><Tag label={t('together.title')} color={col} /><Tag label={t('tabs.profile.shareResources')} /></Row>
      </Card>
    </Screen>
  );
}
