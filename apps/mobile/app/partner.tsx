import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '@/components/Screen';
import FoodsharingLogo from '@/components/FoodsharingLogo';
import { Row, T, haptic } from '@/components/ui';
import { C, R, shadow } from '@/theme';
import { PARTNERS } from '@/data/partners';

export default function Partners() {
  const [error, setError] = useState<string | null>(null);
  async function visit(url: string) {
    haptic(); setError(null);
    try { await Linking.openURL(url); }
    catch { setError('Die Website konnte nicht geöffnet werden. Bitte deine Internetverbindung prüfen.'); }
  }
  return (
    <Screen tabBar={false}>
      <Header title="Partner" subtitle="FES Hackathon 2026" />
      <Text style={[T.h1, { marginTop: 4, marginBottom: 10 }]}>Gemeinsam für{ '\n' }ein gutes Morgen.</Text>
      <Text style={[T.body, { marginBottom: 22 }]}>Die Projekte hinter Mainsam zeigen, wie viel in Frankfurt möglich ist. Entdecke die Menschen und Ideen dahinter.</Text>
      {error && <Text accessibilityRole="alert" style={[T.body, { color: C.danger, marginBottom: 12 }]}>{error}</Text>}
      <View style={{ gap: 14 }}>
        {PARTNERS.map((p) => (
          <Pressable key={p.id} accessibilityRole="link" accessibilityLabel={`${p.name} – Website öffnen`} onPress={() => void visit(p.url)}
            style={({ pressed }) => [{ backgroundColor: p.bg, borderRadius: R.lg, overflow: 'hidden', opacity: pressed ? 0.8 : 1 }, shadow(1)]}>
            <View style={{ height: 5, backgroundColor: p.color }} />
            <View style={{ padding: 20, gap: 12 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                {p.id === 'foodsharing' ? <FoodsharingLogo width={126} /> : <Text style={{ color: p.color, fontWeight: '900', fontSize: 25, flexShrink: 1 }}>{p.name}</Text>}
                <View style={{ backgroundColor: '#ffffffaa', width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}><Ionicons name={p.icon} size={22} color={p.color} /></View>
              </Row>
              <Text style={{ color: p.color, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>{p.role.toUpperCase()}</Text>
              <Text style={[T.h2, { fontSize: 21 }]}>{p.theme}</Text>
              <Text style={[T.body, { color: C.ink }]}>{p.description}</Text>
              <Row style={{ justifyContent: 'space-between', marginTop: 2 }}>
                <Text style={{ color: p.color, fontWeight: '700', fontSize: 12, flex: 1 }}>{p.category}</Text>
                <Row style={{ gap: 5 }}><Text style={{ color: p.color, fontWeight: '800', fontSize: 13 }}>Entdecken</Text><Ionicons name="open-outline" size={16} color={p.color} /></Row>
              </Row>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
