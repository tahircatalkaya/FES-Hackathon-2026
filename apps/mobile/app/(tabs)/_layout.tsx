import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming, Easing, ReduceMotion } from 'react-native-reanimated';
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
  // Animate slot units so a resize cannot leave a stale pixel position outside the bar.
  const position = useSharedValue(slotOf(Math.max(0, activeIdx)));
  useEffect(() => {
    // Keep the current position, but discard momentum from an interrupted tab change.
    cancelAnimation(position);
    position.value = withTiming(slotOf(Math.max(0, activeIdx)), {
      duration: 210, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System,
    });
    return () => cancelAnimation(position);
  }, [activeIdx, position]);
  const ind = useAnimatedStyle(() => ({
    transform: [{ translateX: Math.min(slots - 1, Math.max(0, position.value)) * cell }],
    backgroundColor: NAVY,
  }));

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingBottom: Math.max(insets.bottom, 10), pointerEvents: 'box-none' }}>
      <View testID="main-tab-bar" style={[{ width: w + 8, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 30, padding: 4, height: 66, alignItems: 'center' }, shadow(3)]}>
        {/* Clip only the moving highlight; the raised scan button and shadow stay visible. */}
        <View pointerEvents="none" style={{ position: 'absolute', top: 4, left: 4, width: w, height: 58, borderRadius: 26, overflow: 'hidden' }}>
          <Animated.View testID="tab-indicator" style={[{ width: cell, height: 58, borderRadius: 26 }, ind]} />
        </View>
        {TABS.map((def, i) => {
          const focused = activeName === def.name;
          const tab = (
            <NavigationTab key={def.name} label={t(def.key)} selected={focused} onPress={() => { haptic(); navigation.navigate(def.name); }} width={cell}>
              <Ionicons name={(focused ? def.icon : `${def.icon}-outline`) as any} size={22} color={focused ? '#fff' : C.muted} />
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: focused ? '#fff' : C.muted, marginTop: 3 }} numberOfLines={1}>{t(def.key)}</Text>
            </NavigationTab>
          );
          if (i === 2) {
            return (
              <React.Fragment key="scan-slot">
                <NavigationTab role="button" label="Scannen" width={cell} onPress={() => { haptic(); router.push('/scan'); }}>
                  <View style={[{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: -26, borderWidth: 4, borderColor: '#fff', backgroundColor: NAVY }, shadow(2)]}>
                    <Ionicons name="scan" size={26} color="#fff" />
                  </View>
                  <Text style={{ fontSize: 10.5, fontWeight: '800', color: C.muted, marginTop: 2 }}>Scan</Text>
                </NavigationTab>
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
/** Native buttons on web keep keyboard and pointer navigation independent of the map responder. */
function NavigationTab({label,selected,onPress,width,children,role='tab'}:{label:string;selected?:boolean;onPress:()=>void;width:number;children:React.ReactNode;role?:'tab'|'button'}) {
  if(Platform.OS==='web')return <button type="button" role={role} aria-label={label} aria-selected={selected} onClick={onPress} style={{width,height:58,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:0,border:0,background:'transparent',cursor:'pointer',font:'inherit'}}>{children}</button>;
  return <Pressable accessibilityRole={role} accessibilityLabel={label} accessibilityState={{selected}} onPress={onPress} style={{width,height:58,alignItems:'center',justifyContent:'center'}}>{children}</Pressable>;
}
