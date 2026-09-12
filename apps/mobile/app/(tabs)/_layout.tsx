import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { C, NAVY, shadow } from '@/theme';
import { useT } from '@/i18n/useT';
import { haptic } from '@/components/ui';

/** Vier Tabs plus ein erhobener Scan-Knopf in der Mitte: NFC und QR sind von überall in einem Tipp erreichbar. */
const TABS = [
  { name: 'index', icon: 'map', key: 'tab.discover' },
  { name: 'handeln', icon: 'flash', key: 'tab.act' },
  { name: 'impact', icon: 'leaf', key: 'tab.impact' },
  { name: 'profil', icon: 'person', key: 'tab.profile' },
] as const;

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg } }} tabBar={(p) => <TabBar {...p} />}>
      {TABS.map((t) => <Tabs.Screen key={t.name} name={t.name} />)}
      <Tabs.Screen name="gemeinsam" options={{ href: null }} />
    </Tabs>
  );
}

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const t = useT();
  const router = useRouter();
  const pad = 14, w = Math.min(width, 520) - pad * 2;
  const slots = 5, cell = w / slots; // 2 Tabs, Scan, 2 Tabs
  const activeName = state.routes[state.index].name === 'gemeinsam' ? 'impact' : state.routes[state.index].name;
  const activeIdx = TABS.findIndex((x) => x.name === activeName);
  const slotOf = (i: number) => (i < 2 ? i : i + 1);
  const x = useSharedValue(slotOf(Math.max(0, activeIdx)) * cell);
  // Nahe an der kritischen Daempfung (2*sqrt(stiffness*mass) ≈ 21): Der Indikator gleitet,
  // statt am Ziel nachzuschwingen. Bewegung bleibt, das Federn ist raus.
  useEffect(() => { x.value = withSpring(slotOf(Math.max(0, activeIdx)) * cell, { damping: 20, stiffness: 130, mass: 0.9 }); }, [activeIdx, cell]);
  const ind = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingBottom: Math.max(insets.bottom, 10), pointerEvents: 'box-none' }}>
      <View style={[{ width: w + 8, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 30, padding: 4, height: 66, alignItems: 'center' }, shadow(3)]}>
        <Animated.View style={[{ position: 'absolute', top: 4, left: 4, width: cell, height: 58, borderRadius: 26, backgroundColor: NAVY }, ind]} />
        {TABS.map((def, i) => {
          const focused = activeName === def.name;
          const tab = (
            <Pressable key={def.name} onPress={() => { haptic(); navigation.navigate(def.name); }} style={{ width: cell, alignItems: 'center', justifyContent: 'center', height: 58 }}>
              <Ionicons name={(focused ? def.icon : `${def.icon}-outline`) as any} size={22} color={focused ? '#fff' : C.muted} />
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: focused ? '#fff' : C.muted, marginTop: 3 }} numberOfLines={1}>{t(def.key)}</Text>
            </Pressable>
          );
          if (i === 2) {
            return (
              <React.Fragment key="scan-slot">
                <Pressable onPress={() => { haptic(); router.push('/scan'); }} style={{ width: cell, alignItems: 'center', justifyContent: 'center', height: 58 }}>
                  <View style={[{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: -26, borderWidth: 4, borderColor: '#fff', backgroundColor: NAVY }, shadow(2)]}>
                    <Ionicons name="scan" size={26} color="#fff" />
                  </View>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: C.muted, marginTop: 2 }}>Scan</Text>
                </Pressable>
                {tab}
              </React.Fragment>
            );
          }
          return tab;
        })}
      </View>
    </View>
  );
}
