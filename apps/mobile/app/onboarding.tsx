import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Chameleon from '@/components/Chameleon';
import { Button, Card, Divider, Row, T, haptic } from '@/components/ui';
import { C, CONTEXT, S } from '@/theme';
import { LANGS } from '@/i18n';
import { useT } from '@/i18n/useT';
import { useStore } from '@/store';

const SLIDES: { ctx: keyof typeof CONTEXT; t: 'onb.1.title' | 'onb.2.title' | 'onb.3.title'; b: 'onb.1.body' | 'onb.2.body' | 'onb.3.body' }[] = [
  { ctx: 'home', t: 'onb.1.title', b: 'onb.1.body' },
  { ctx: 'mobility', t: 'onb.2.title', b: 'onb.2.body' },
  { ctx: 'food', t: 'onb.3.title', b: 'onb.3.body' },
];

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const t = useT();
  const { lang, setProfile, setOnboarded, setPrivacy } = useStore();
  const [i, setI] = useState(0);
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(true);
  const [showLanguages, setShowLanguages] = useState(false);
  const last = i === SLIDES.length; // Name-Schritt
  const ctx = last ? 'community' : SLIDES[i].ctx;
  const color = CONTEXT[ctx].color;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <LinearGradient colors={[color + '33', C.bg]} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 420 }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: S.xl, paddingBottom: insets.bottom + 24, flexGrow: 1, maxWidth: 560, width: '100%', alignSelf: 'center' }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'flex-end' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Sprachen" accessibilityState={{ expanded: showLanguages }} onPress={() => setShowLanguages((open) => !open)} style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>🌐</Text>
          </Pressable>
        </View>
        {showLanguages && (
          <Card style={{ marginTop: 8 }}>
            {LANGS.map((language, index, languages) => (
              <View key={language.code}>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: lang === language.code }} onPress={() => { setProfile({ lang: language.code }); setShowLanguages(false); }} style={{ paddingVertical: 10 }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text style={T.body}>{language.flag} {language.label}</Text>
                    {lang === language.code && <Text style={{ color, fontWeight: '900' }}>✓</Text>}
                  </Row>
                </Pressable>
                {index < languages.length - 1 && <Divider />}
              </View>
            ))}
          </Card>
        )}
        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <Chameleon pose={last ? 'cheer' : i % 2 ? 'hello' : 'wave'} size={230} />
        </View>
        <Animated.View key={i} entering={FadeInDown.springify().damping(16)} exiting={FadeOut} style={{ marginTop: 24, minHeight: 190 }}>
          {!last ? (
            <>
              <Text style={T.h1}>{t(SLIDES[i].t)}</Text>
              <Text style={[T.body, { marginTop: 10, fontSize: 17, lineHeight: 25 }]}>{t(SLIDES[i].b)}</Text>
              {i === 2 && (
                <Pressable onPress={() => setConsent(!consent)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, backgroundColor: '#fff', padding: 14, borderRadius: 16 }}>
                  <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: color, backgroundColor: consent ? color : '#fff', alignItems: 'center', justifyContent: 'center' }}>{consent && <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text>}</View>
                  <Text style={[T.body, { flex: 1 }]}>Standort nur während bewusst gestarteter Fahrten.</Text>
                </Pressable>
              )}
            </>
          ) : (
            <>
              <Text style={[T.h1]}>{t('onb.name')}</Text>
              <TextInput value={name} onChangeText={setName} placeholder="Benutzername" placeholderTextColor={C.muted} style={{ marginTop: 14, backgroundColor: '#fff', borderRadius: 16, padding: 16, fontSize: 18, fontWeight: '700', color: C.ink, borderWidth: 2, borderColor: color + '55' }} autoFocus maxLength={24} />
              <Text style={[T.small, { marginTop: 10 }]}>Öffentlich sichtbar ist nur dieser Name.{'\n'}Keine E-Mail, keine Telefonnummer, keine Adresse.</Text>
            </>
          )}
        </Animated.View>
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 18 }}>
          {[...SLIDES, null].map((_, k) => <Animated.View key={k} entering={FadeIn} style={{ width: k === i ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: k === i ? color : C.line }} />)}
        </View>
        <Button color={color} label={last ? t('onb.start') : t('common.next')} disabled={last && name.trim().length < 2} onPress={() => {
          if (!last) { setI(i + 1); return; }
          haptic('success');
          setProfile({ name: name.trim() }); setPrivacy({ shareAggregates: consent }); setOnboarded(true);
        }} />
        {i > 0 && !last && <Pressable onPress={() => setI(i - 1)} style={{ alignSelf: 'center', marginTop: 12 }}><Text style={{ color: C.muted, fontWeight: '700' }}>{t('common.back')}</Text></Pressable>}
      </ScrollView>
    </View>
  );
}
