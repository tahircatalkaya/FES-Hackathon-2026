import { useT } from '@/i18n/useT';
import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Reputation as ReputationData } from '@/api/trust';
import { Row, T } from './ui';
import { C } from '@/theme';
export default function Reputation({ data }: { data: ReputationData }) {
  const t = useT();
  return <View style={{ gap: 6 }}>
    <Row style={{ gap: 6 }}><Ionicons name="people-outline" size={16} color={C.muted} /><Text style={T.small}>{data.visible ? t('components.reputation.count', { count: data.count }) : t('components.reputation.few')}</Text></Row>
    {data.visible ? <View style={{ gap: 3 }}>{[[t('components.reputation.satisfaction'), data.satisfaction], [t('components.reputation.reliability'), data.reliability], [t('components.reputation.respect'), data.respect]].map(([label, score]) => <Row key={label} style={{ justifyContent: 'space-between' }}><Text style={T.small}>{label}</Text><Text style={[T.small, { fontWeight: '800', color: C.ink }]}>{score} / 5</Text></Row>)}</View> : <Text style={T.small}>{t('components.reputation.neutral')}</Text>}
  </View>;
}
