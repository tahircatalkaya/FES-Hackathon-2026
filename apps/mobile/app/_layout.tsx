import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Platform, Text as RNText, ScrollView, Pressable } from 'react-native';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import AwardToast from '@/components/AwardToast';
import WhySheet from '@/components/WhySheet';
import { C, CONTEXT } from '@/theme';

export default function RootLayout() {
  const onboarded = useStore((s) => s.onboarded);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const segments = useSegments();
  const { toast, showToast, why, showWhy, ctx } = useUI();

  useEffect(() => {
    // Wait for persisted state and React hydration before deciding on a redirect.
    const unsubscribe = useStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useStore.persist.hasHydrated());
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const inOnb = segments[0] === 'onboarding';
    const inAuth = inOnb || segments[0] === 'anmelden';
    if (!onboarded && !inAuth) router.replace('/onboarding');
    if (onboarded && inOnb) router.replace('/(tabs)');
  }, [onboarded, segments[0], hydrated]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const s = document.createElement('style');
      s.innerHTML = 'html,body,#root{height:100%;background:#F6F5EF} body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif} ::-webkit-scrollbar{display:none} *{-webkit-tap-highlight-color:transparent}';
      document.head.appendChild(s);
    }
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'slide_from_right' }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
            <Stack.Screen name="anmelden" options={{ animation: 'fade' }} />
            <Stack.Screen name="fahrt" options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="mehrweg" />
            <Stack.Screen name="fairteiler/[id]" />
            <Stack.Screen name="korb/[id]" />
            <Stack.Screen name="verteilung/[id]" />
            <Stack.Screen name="saver" />
            <Stack.Screen name="cleanup/[id]" />
            <Stack.Screen name="melden" />
            <Stack.Screen name="quiz/[id]" />
            <Stack.Screen name="belohnungen" />
            <Stack.Screen name="journal" />
            <Stack.Screen name="daten" />
            <Stack.Screen name="partner" />
            <Stack.Screen name="uebergaben" />
            <Stack.Screen name="scan" options={{ animation: 'slide_from_bottom' }} />
          </Stack>
          <AwardToast award={toast} onWhy={(a) => showWhy(a)} onDone={() => showToast(null)} color={CONTEXT[ctx].color} />
          <WhySheet award={why} onClose={() => showWhy(null)} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** Fängt Render-Fehler ab, damit statt eines Absturzes eine lesbare Meldung erscheint. */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#0F2A5C', padding: 24, justifyContent: 'center' }}>
      <RNText style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 10 }}>Da ist etwas schiefgelaufen</RNText>
      <RNText selectable style={{ color: '#fff', fontSize: 13, marginBottom: 6 }}>{String(error?.message ?? error)}</RNText>
      <ScrollView style={{ maxHeight: 320 }}><RNText selectable style={{ color: '#ffffffaa', fontSize: 11 }}>{String(error?.stack ?? '')}</RNText></ScrollView>
      <Pressable onPress={() => retry()} style={{ marginTop: 16, backgroundColor: '#fff', borderRadius: 999, paddingVertical: 12, alignItems: 'center' }}>
        <RNText style={{ color: '#0F2A5C', fontWeight: '800' }}>Nochmal versuchen</RNText>
      </Pressable>
    </View>
  );
}
