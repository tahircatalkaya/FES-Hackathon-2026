import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Map from '@/components/Map';
import Chameleon from '@/components/Chameleon';
import { Card, Pill, T, Tag, haptic } from '@/components/ui';
import { C, CONTEXT, S, shadow, type ContextKey } from '@/theme';
import { useLocation } from '@/hooks/useLocation';
import { getOpportunities, fmtDist, walkMin, type Layer, type Opportunity } from '@/api/opportunities';
import { useStore, weekStats } from '@/store';
import { useUI } from '@/store/ui';
import { useT } from '@/i18n/useT';

const LAYERS: { key: Layer | 'all'; label: string; ctx: ContextKey; emoji: string }[] = [
  { key: 'all', label: 'Alles', ctx: 'home', emoji: '✨' },
  { key: 'mobility', label: 'Bus & Bahn', ctx: 'mobility', emoji: '🚇' },
  { key: 'food', label: 'Lebensmittel', ctx: 'food', emoji: '🥕' },
  { key: 'reuse', label: 'Mehrweg', ctx: 'reuse', emoji: '🥡' },
  { key: 'clean', label: 'Sauber', ctx: 'clean', emoji: '🧹' },
  { key: 'lastenrad', label: 'Lastenrad', ctx: 'mobility', emoji: '🚲' },
];

export default function Discover() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const t = useT();
  const { loc, isDemo } = useLocation();
  const qp = useLocalSearchParams<{ layer?: string }>();
  const [layer, setLayer] = useState<Layer | 'all'>((qp.layer as Layer) ?? 'all');
  useEffect(() => { if (qp.layer) setLayer(qp.layer as Layer); }, [qp.layer]);
  const [data, setData] = useState<Opportunity[]>([]);
  const [sources, setSources] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<string | null>(null);
  const name = useStore((s) => s.name);
  const ledger = useStore((s) => s.ledger);
  const { setCtx, mood } = useUI();
  const listRef = useRef<FlatList<Opportunity>>(null);
  const wk = weekStats(ledger);

  useEffect(() => { setCtx(LAYERS.find((l) => l.key === layer)!.ctx as ContextKey); }, [layer]);
  useEffect(() => {
    let alive = true; setLoading(true);
    getOpportunities(loc.lat, loc.lon, 3).then((r) => { if (alive) { setData(r.items); setSources(r.sources); setLoading(false); } });
    return () => { alive = false; };
  }, [loc.lat, loc.lon]);

  const shown = useMemo(() => {
    const f = layer === 'all' ? data.filter((o) => o.layer !== 'mobility' || o.distance_m < 900) : data.filter((o) => o.layer === layer);
    return f.slice(0, 60);
  }, [data, layer]);
  const ctxColor = CONTEXT[LAYERS.find((l) => l.key === layer)!.ctx].color;
  const selected = shown.find((o) => o.id === sel) ?? null;
  const mapH = Math.max(300, height - 330);

  const markers = shown.map((o) => ({ id: o.id, lat: o.lat, lon: o.lon, color: CONTEXT[o.ctx].color, emoji: o.emoji, selected: o.id === sel, onPress: () => { haptic(); setSel(o.id); const i = shown.findIndex((x) => x.id === o.id); if (i >= 0) listRef.current?.scrollToIndex({ index: i, animated: true, viewPosition: 0.5 }); } }));

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ height: mapH + insets.top }}>
        <Map center={selected ? { lat: selected.lat, lon: selected.lon } : loc} spanKm={selected ? 1.6 : 3.2} markers={markers} userLocation={loc} style={{ flex: 1 }} />
        <LinearGradient colors={['rgba(246,245,239,0.95)', 'rgba(246,245,239,0)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top + 96 }} pointerEvents="none" />
        <View style={{ position: 'absolute', top: insets.top + 6, left: S.lg, right: S.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable onPress={() => router.push('/handeln')}><Chameleon color={ctxColor} size={64} mood={mood} lookX={0.7} /></Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[T.h2]} numberOfLines={1}>{t('home.greeting')} {name || 'du'} 👋</Text>
              <Text style={T.small}>{t('home.nearby')} · {isDemo ? 'Demo-Standort Bockenheimer Warte' : 'dein Standort'}</Text>
            </View>
            <Pressable onPress={() => router.push('/handeln')} style={[{ backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center' }, shadow(1)]}>
              <Text style={{ fontWeight: '900', color: ctxColor, fontSize: 16 }}>{wk.activeDays}/{wk.goal}</Text>
              <Text style={{ fontSize: 10, color: C.muted, fontWeight: '700' }}>{t('week.days')}</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ paddingRight: 20 }}>
            {LAYERS.map((l) => <Pill key={l.key} label={l.label} icon={l.emoji} active={layer === l.key} color={CONTEXT[l.ctx].color} onPress={() => { setLayer(l.key); setSel(null); }} />)}
          </ScrollView>
        </View>
        {loading && <View style={{ position: 'absolute', right: 16, bottom: 16, backgroundColor: '#fff', borderRadius: 20, padding: 8 }}><ActivityIndicator color={ctxColor} /></View>}
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: S.lg, paddingTop: 14, paddingBottom: 6 }}>
          <Text style={T.h3}>{shown.length} Möglichkeiten in 3 km</Text>
          <Pressable onPress={() => router.push('/daten')}><Text style={{ color: C.muted, fontWeight: '700', fontSize: 12 }}>Quellen: {Object.values(sources).includes('api') ? 'Live-API' : 'Snapshot'} ›</Text></Pressable>
        </View>
        <FlatList
          ref={listRef}
          data={shown}
          keyExtractor={(o) => o.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingHorizontal: S.lg, gap: 12, paddingBottom: 8 }}
          getItemLayout={(_, i) => ({ length: 272, offset: 272 * i, index: i })}
          onScrollToIndexFailed={() => {}}
          renderItem={({ item: o, index }) => (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).springify().damping(16)}>
              <Card onPress={() => router.push(o.href as any)} style={{ width: 260, borderWidth: 2, borderColor: o.id === sel ? CONTEXT[o.ctx].color : 'transparent', padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: CONTEXT[o.ctx].soft, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 22 }}>{o.emoji}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[T.h3, { fontSize: 15 }]} numberOfLines={1}>{o.title}</Text>
                    <Text style={T.small} numberOfLines={1}>{o.sub}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
                  <Text style={{ fontWeight: '800', color: CONTEXT[o.ctx].color }}>{fmtDist(o.distance_m)} · {walkMin(o.distance_m)} min 🚶</Text>
                  <View style={{ flex: 1 }} />
                  <Tag label={o.verification} color={o.verification === 'Simuliert' ? C.community : o.verification === 'API' ? C.success : C.mobility} />
                </View>
              </Card>
            </Animated.View>
          )}
          ListEmptyComponent={loading ? null : <View style={{ padding: 30 }}><Text style={T.body}>Nichts in dieser Ebene in der Nähe.</Text></View>}
        />
        <Animated.View entering={FadeIn.delay(300)} style={{ paddingHorizontal: S.lg, paddingTop: 4 }}>
          <Text style={T.small}>Karte: OpenStreetMap · Fairteiler, Körbe: foodsharing-API · Vytal: Store-Suche · Haltestellen: GTFS RMV · Clean-ups, Behälter, Lastenrad: simuliert</Text>
        </Animated.View>
      </View>
    </View>
  );
}
