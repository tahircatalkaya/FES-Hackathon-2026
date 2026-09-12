import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Map from '@/components/Map';
import FoodsharingLogo from '@/components/FoodsharingLogo';
import Chameleon from '@/components/Chameleon';
import { Pill, T, haptic } from '@/components/ui';
import { C, CONTEXT, S, shadow, type ContextKey } from '@/theme';
import { shade } from '@/components/Chameleon';
import { useLocation } from '@/hooks/useLocation';
import { getOpportunities, fmtDist, walkMin, type Layer, type Opportunity } from '@/api/opportunities';
import { useStore, weekStats } from '@/store';
import { useUI } from '@/store/ui';
import { useT } from '@/i18n/useT';

const LAYERS: { key: Layer | 'all'; label: string; ctx: ContextKey; icon: string }[] = [
  { key: 'all', label: 'Alles', ctx: 'home', icon: 'apps' },
  { key: 'mobility', label: 'Bus & Bahn', ctx: 'mobility', icon: 'train' },
  { key: 'food', label: 'Essen', ctx: 'food', icon: 'nutrition' },
  { key: 'reuse', label: 'Mehrweg', ctx: 'reuse', icon: 'cafe' },
  { key: 'clean', label: 'Sauber', ctx: 'clean', icon: 'sparkles' },
  { key: 'lastenrad', label: 'Lastenrad', ctx: 'mobility', icon: 'bicycle' },
];
const AVAIL: Record<string, { l: string; c: string }> = { offen: { l: 'offen', c: C.success }, reserviert: { l: 'reserviert', c: C.warn }, voll: { l: 'voll', c: C.danger }, jetzt: { l: 'jetzt', c: C.success }, bald: { l: 'bald', c: C.mobility }, unbekannt: { l: '', c: C.muted } };

export default function Discover() {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const router = useRouter();
  const t = useT();
  const { loc, isDemo } = useLocation();
  const qp = useLocalSearchParams<{ layer?: string }>();
  const [layer, setLayer] = useState<Layer | 'all'>((qp.layer as Layer) ?? 'all');
  useEffect(() => { if (qp.layer) setLayer(qp.layer as Layer); }, [qp.layer]);
  const [data, setData] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const name = useStore((s) => s.name);
  const ledger = useStore((s) => s.ledger);
  const { setCtx, mood } = useUI();
  const listRef = useRef<FlatList<Opportunity>>(null);
  const wk = weekStats(ledger);

  useEffect(() => { setCtx(LAYERS.find((l) => l.key === layer)!.ctx); }, [layer]);
  useEffect(() => {
    let alive = true; setLoading(true);
    getOpportunities(loc.lat, loc.lon, 3).then((r) => { if (alive) { setData(r.items); setLoading(false); } });
    return () => { alive = false; };
  }, [loc.lat, loc.lon]);

  const shown = useMemo(() => {
    const f = layer === 'all' ? data.filter((o) => o.layer !== 'mobility' || o.distance_m < 900) : data.filter((o) => o.layer === layer);
    return f.slice(0, 60);
  }, [data, layer]);
  const ctxColor = CONTEXT[LAYERS.find((l) => l.key === layer)!.ctx].color;
  const selected = shown.find((o) => o.id === sel) ?? null;

  // Liste als verschiebbares Sheet über der Karte: drei Rastpunkte (nur Karte, geteilt, nur Liste)
  const fullTop = insets.top + 128;
  const halfTop = Math.round(height * 0.52);
  const peekTop = height - (100 + insets.bottom) - 64;
  const snaps = [fullTop, halfTop, peekTop];
  const top = useSharedValue(halfTop);
  const startY = useSharedValue(halfTop);
  const [snapIdx, setSnapIdx] = useState(1);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: top.value - fullTop }] }));
  function snapTo(i: number) { setSnapIdx(i); top.value = withSpring(snaps[i], { damping: 19, stiffness: 170, mass: 0.8 }); }
  const pan = Gesture.Pan()
    .onBegin(() => { startY.value = top.value; })
    .onUpdate((e) => { top.value = Math.min(peekTop, Math.max(fullTop, startY.value + e.translationY)); })
    .onEnd((e) => {
      const proj = top.value + e.velocityY * 0.12;
      let best = 0; for (let i = 1; i < snaps.length; i++) if (Math.abs(snaps[i] - proj) < Math.abs(snaps[best] - proj)) best = i;
      top.value = withSpring(snaps[best], { damping: 19, stiffness: 170, mass: 0.8 });
      runOnJS(setSnapIdx)(best);
    });
  const cycle = () => { haptic(); snapTo(snapIdx === 2 ? 1 : snapIdx === 1 ? 0 : 2); };

  const markers = shown.map((o) => ({ id: o.id, lat: o.lat, lon: o.lon, color: CONTEXT[o.ctx].color, emoji: o.emoji, selected: o.id === sel, onPress: () => { haptic(); setSel(o.id); if (snapIdx === 2) snapTo(1); const i = shown.findIndex((x) => x.id === o.id); if (i >= 0) setTimeout(() => listRef.current?.scrollToIndex({ index: i, animated: true, viewPosition: 0.1 }), 80); } }));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}>
        <Map center={selected ? { lat: selected.lat, lon: selected.lon } : loc} spanKm={selected ? 1.6 : 3.2} markers={markers} userLocation={loc} style={{ flex: 1 }} />
        <LinearGradient colors={['rgba(246,245,239,0.96)', 'rgba(246,245,239,0)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 100 }} pointerEvents="none" />
        <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 6, left: S.lg, right: S.lg }}>
          <View pointerEvents="box-none" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable onPress={() => router.push('/handeln')}><Chameleon color={ctxColor} size={64} mood={mood} lookX={0.7} /></Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[T.h2]} numberOfLines={1}>{t('home.greeting')} {name || 'du'} 👋</Text>
              <Text style={T.small}>{t('home.nearby')}{isDemo ? ' · Bockenheimer Warte' : ''}</Text>
            </View>
            {layer === 'food' ? <FoodsharingLogo width={88} /> : <Pressable onPress={() => router.push('/handeln')} style={[{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' }, shadow(1)]}>
              <Text style={{ fontWeight: '900', color: ctxColor, fontSize: 16 }}>{wk.activeDays}/{wk.goal}</Text>
              <Text style={{ fontSize: 10, color: C.muted, fontWeight: '700' }}>{t('week.days')}</Text>
            </Pressable>}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingRight: 20 }}>
            {LAYERS.map((l) => (
              <Pressable key={l.key} onPress={() => { haptic(); setLayer(l.key); setSel(null); }} style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, marginRight: 8, backgroundColor: layer === l.key ? CONTEXT[l.ctx].color : '#fff' }, shadow(1)]}>
                <Ionicons name={l.icon as any} size={15} color={layer === l.key ? '#fff' : CONTEXT[l.ctx].color} />
                <Text style={{ fontWeight: '800', fontSize: 13, color: layer === l.key ? '#fff' : C.ink }}>{l.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        {loading && <View style={{ position: 'absolute', right: 16, top: insets.top + 130, backgroundColor: '#fff', borderRadius: 20, padding: 8 }}><ActivityIndicator color={ctxColor} /></View>}
      </View>

      <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: fullTop, height: height - fullTop, backgroundColor: C.bg, borderTopLeftRadius: 26, borderTopRightRadius: 26 }, Platform.OS === 'web' ? ({ userSelect: 'none' } as any) : null, shadow(3), sheetStyle]}>
        <GestureDetector gesture={pan}>
          <Pressable onPress={cycle} style={{ paddingTop: 8, paddingBottom: 6, paddingHorizontal: S.lg, alignItems: 'center' }}>
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: C.line }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 8 }}>
              <Text style={T.h3}>{shown.length} in deiner Nähe</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={snapIdx === 0 ? 'map' : 'list'} size={15} color={C.muted} />
                <Text style={{ color: C.muted, fontWeight: '700', fontSize: 12 }}>{snapIdx === 0 ? 'Karte zeigen' : snapIdx === 1 ? 'Ziehen' : 'Liste zeigen'}</Text>
              </View>
            </View>
          </Pressable>
        </GestureDetector>
      <FlatList
        ref={listRef}
        data={shown}
        keyExtractor={(o) => o.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: S.lg, paddingTop: 4, paddingBottom: 120 + insets.bottom, gap: 10 }}
        getItemLayout={(_, i) => ({ length: 96, offset: 96 * i, index: i })}
        onScrollToIndexFailed={() => {}}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={loading ? null : <Text style={[T.body, { padding: 20 }]}>Hier ist gerade nichts. Probier eine andere Kategorie.</Text>}
        renderItem={({ item: o, index }) => {
          const c = CONTEXT[o.ctx].color; const av = AVAIL[o.availability];
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 10) * 35).springify().damping(16)}>
              <Pressable onPress={() => { haptic(); router.push(o.href as any); }} style={[{ height: 86, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, padding: 10, borderWidth: 2, borderColor: o.id === sel ? c : 'transparent' }, shadow(1)]}>
                <LinearGradient colors={[shade(c, 0.15), shade(c, -0.25)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 66, height: 66, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={o.icon as any} size={30} color="#fff" />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={[T.h3, { fontSize: 15 }]} numberOfLines={1}>{o.title}</Text>
                  <Text style={T.small} numberOfLines={1}>{o.sub}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={{ fontWeight: '800', color: c, fontSize: 13 }}>{fmtDist(o.distance_m)} · {walkMin(o.distance_m)} min</Text>
                    {av.l ? <View style={{ backgroundColor: av.c + '1A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}><Text style={{ color: av.c, fontWeight: '800', fontSize: 11 }}>{av.l}</Text></View> : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.muted} />
              </Pressable>
            </Animated.View>
          );
        }}
      />
      </Animated.View>
    </View>
  );
}
