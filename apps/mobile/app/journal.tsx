import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen, Header } from '@/components/Screen';
import { Card, Pill, Row, StatusBadge, T, Tag } from '@/components/ui';
import { C, CONTEXT } from '@/theme';
import { useStore } from '@/store';
import { useUI } from '@/store/ui';
import { fmtCo2 } from '@/engine/impact';

export default function Journal() {
  const p = useLocalSearchParams<{ tab?: string }>();
  const { ledger, notices, markRead } = useStore();
  const { showWhy, setCtx } = useUI();
  const [tab, setTab] = useState<'ledger' | 'notices'>(p.tab === 'notices' ? 'notices' : 'ledger');
  useEffect(() => { setCtx('home'); markRead(); }, []);
  return (
    <Screen tabBar={false}>
      <Header title="Journal" subtitle="Jede Gutschrift, jede Mitteilung, nachvollziehbar" />
      <Row><Pill label={`Gutschriften (${ledger.length})`} active={tab === 'ledger'} color={C.home} onPress={() => setTab('ledger')} /><Pill label={`Mitteilungen (${notices.length})`} active={tab === 'notices'} color={C.home} onPress={() => setTab('notices')} /></Row>
      <View style={{ marginTop: 14, gap: 8 }}>
        {tab === 'ledger' ? (ledger.length ? ledger.map((l) => (
          <Card key={l.key} onPress={() => showWhy(l)} style={{ paddingVertical: 12 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={T.h3} numberOfLines={1}>{l.title}</Text>
                <Row style={{ gap: 6, marginTop: 4, flexWrap: 'wrap' }}><StatusBadge status={l.status} small /><Tag label={l.partner} /><Text style={T.small}>{new Date(l.at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text></Row>
                <Text style={[T.small, { marginTop: 2 }]}>{l.formula}{l.impact.co2_g ? ` · ${fmtCo2(l.impact.co2_g)} CO₂e` : ''}{l.impact.food_g ? ` · ${(l.impact.food_g / 1000).toFixed(1)} kg` : ''}</Text>
              </View>
              <Text style={{ fontWeight: '900', fontSize: 18, color: l.points > 0 ? C.success : C.muted }}>{l.points > 0 ? `+${l.points}` : '0'}</Text>
            </Row>
          </Card>
        )) : <Text style={T.body}>Noch keine Gutschriften.</Text>) : (notices.length ? notices.map((n) => (
          <Card key={n.id} style={{ paddingVertical: 12, borderLeftWidth: 4, borderLeftColor: (CONTEXT as any)[n.ctx]?.color ?? C.home }}>
            <Text style={T.h3}>{n.title}</Text><Text style={T.body}>{n.body}</Text><Text style={T.small}>{new Date(n.at).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</Text>
          </Card>
        )) : <Text style={T.body}>Keine Mitteilungen. Ruhezeit 22–7 Uhr, max. 5 am Tag.</Text>)}
      </View>
    </Screen>
  );
}
