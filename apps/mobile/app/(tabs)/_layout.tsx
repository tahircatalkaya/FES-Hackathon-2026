import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolateColor, withRepeat, withSequence, Easing, cancelAnimation, ReduceMotion } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { C, CONTEXT, shadow } from '@/theme';
import { useUI } from '@/store/ui';
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
  const ctx = useUI((s) => s.ctx);
  const color = CONTEXT[ctx].color;
  const pad = 14, w = Math.min(width, 520) - pad * 2;
  const slots = 5, cell = w / slots; // 2 Tabs, Scan, 2 Tabs
  const visible = state.routes.filter((r: any) => TABS.some((x) => x.name === r.name));
  const activeName = state.routes[state.index].name === 'gemeinsam' ? 'impact' : state.routes[state.index].name;
  const activeIdx = TABS.findIndex((x) => x.name === activeName);
  const slotOf = (i: number) => (i < 2 ? i : i + 1);
  const x = useSharedValue(slotOf(Math.max(0, activeIdx)) * cell);
  const col = useSharedValue(0);
  const prev = React.useRef(color);
  const from = useSharedValue(color), to = useSharedValue(color);
  const glow = useSharedValue(1);
  useEffect(() => { cancelAnimation(x); x.value = withTiming(slotOf(Math.max(0, activeIdx)) * cell, { duration: 210, easing: Easing.out(Easing.cubic), reduceMotion: ReduceMotion.System }); }, [activeIdx, cell]);
  useEffect(() => { from.value = prev.current; to.value = color; col.value = 0; col.value = withTiming(1, { duration: 700 }); prev.current = color; }, [color]);
  useEffect(() => { glow.value = withRepeat(withSequence(withTiming(1.025, { duration: 1400, reduceMotion: ReduceMotion.System }), withTiming(1, { duration: 1400, reduceMotion: ReduceMotion.System })), -1, true); }, []);
  const ind = useAnimatedStyle(() => ({ transform: [{ translateX: Math.min(w - cell, Math.max(0, x.value)) }], backgroundColor: interpolateColor(col.value, [0, 1], [from.value, to.value]) }));
  const scanSt = useAnimatedStyle(() => ({ transform: [{ scale: glow.value }], backgroundColor: interpolateColor(col.value, [0, 1], [from.value, to.value]) }));

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingBottom: Math.max(insets.bottom, 10), pointerEvents: 'box-none' }}>
      <View style={[{ width: w + 8, flexDirection: 'row', backgroundColor: '#fff', borderRadius: 30, padding: 4, height: 66, alignItems: 'center' }, shadow(3)]}>
        <View pointerEvents="none" style={{position:'absolute',top:4,left:4,width:w,height:58,borderRadius:26,overflow:'hidden'}}><Animated.View testID="tab-indicator" style={[{width:cell,height:58,borderRadius:26},ind]} /></View>
        {TABS.map((def, i) => {
          const route = visible.find((r: any) => r.name === def.name);
          const focused = activeName === def.name;
          const tab = (
            <NavigationTab label={t(def.key)} selected={focused} key={def.name} onPress={() => { haptic(); navigation.navigate(def.name); }} width={cell}>
              <Ionicons name={(focused ? def.icon : `${def.icon}-outline`) as any} size={22} color={focused ? '#fff' : C.muted} />
              <Text style={{ fontSize: 10.5, fontWeight: '800', color: focused ? '#fff' : C.muted, marginTop: 3 }} numberOfLines={1}>{t(def.key)}</Text>
            </NavigationTab>
          );
          if (i === 2) {
            return (
              <React.Fragment key="scan-slot">
                <NavigationTab role="button" label="Scannen" width={cell} onPress={() => { haptic(); router.push('/scan'); }}>
                  <Animated.View style={[{ width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginTop: -26, borderWidth: 4, borderColor: '#fff' }, shadow(2), scanSt]}>
                    <Ionicons name="scan" size={26} color="#fff" />
                  </Animated.View>
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
