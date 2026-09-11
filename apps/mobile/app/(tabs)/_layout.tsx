import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, interpolateColor } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { C, CONTEXT, shadow } from '@/theme';
import { useUI } from '@/store/ui';
import { useT } from '@/i18n/useT';
import { haptic } from '@/components/ui';

const TABS = [
  { name: 'index', icon: 'map', key: 'tab.discover' },
  { name: 'handeln', icon: 'flash', key: 'tab.act' },
  { name: 'impact', icon: 'leaf', key: 'tab.impact' },
  { name: 'gemeinsam', icon: 'people', key: 'tab.together' },
  { name: 'profil', icon: 'person', key: 'tab.profile' },
] as const;

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.bg } }} tabBar={(p) => <TabBar {...p} />}>
      {TABS.map((t) => <Tabs.Screen key={t.name} name={t.name} />)}
    </Tabs>
  );
}

function TabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const t = useT();
  const ctx = useUI((s) => s.ctx);
  const color = CONTEXT[ctx].color;
  const pad = 14, w = Math.min(width, 520) - pad * 2, cell = w / TABS.length;
  const x = useSharedValue(state.index * cell);
  const col = useSharedValue(0);
  const prev = React.useRef(color);
  const from = useSharedValue(color), to = useSharedValue(color);
  useEffect(() => { x.value = withSpring(state.index * cell, { damping: 16, stiffness: 160 }); }, [state.index, cell]);
  useEffect(() => { from.value = prev.current; to.value = color; col.value = 0; col.value = withTiming(1, { duration: 700 }); prev.current = color; }, [color]);
  const ind = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }], backgroundColor: interpolateColor(col.value, [0, 1], [from.value, to.value]) }));

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingBottom: Math.max(insets.bottom, 10), pointerEvents: 'box-none' }}>
      <View style={[{ width: w + 8, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 30, padding: 4, height: 66 }, shadow(3)]}>
        <Animated.View style={[{ position: 'absolute', top: 4, left: 4, width: cell, height: 58, borderRadius: 26 }, ind]} />
        {state.routes.map((route: any, i: number) => {
          const focused = state.index === i;
          const def = TABS[i];
          return (
            <Pressable key={route.key} onPress={() => { haptic(); navigation.navigate(route.name); }} style={{ width: cell, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={(focused ? def.icon : `${def.icon}-outline`) as any} size={22} color={focused ? '#fff' : C.muted} />
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: focused ? '#fff' : C.muted, marginTop: 3 }} numberOfLines={1}>{t(def.key)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
