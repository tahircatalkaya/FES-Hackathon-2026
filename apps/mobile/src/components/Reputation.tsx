import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Reputation as ReputationData } from '@/api/trust';
import { Row, T } from './ui';
import { C } from '@/theme';
export default function Reputation({ data }: { data: ReputationData }) {
  return <View style={{ gap: 6 }}>
    <Row style={{ gap: 6 }}><Ionicons name="people-outline" size={16} color={C.muted} /><Text style={T.small}>{data.visible ? `Erfahrungen von ${data.count} Personen` : 'Noch nicht genügend Erfahrungen'}</Text></Row>
    {data.visible ? <View style={{ gap: 3 }}>{[['Zufriedenheit', data.satisfaction], ['Zuverlässigkeit', data.reliability], ['Respekt & faire Abholung', data.respect]].map(([label, score]) => <Row key={label} style={{ justifyContent: 'space-between' }}><Text style={T.small}>{label}</Text><Text style={[T.small, { fontWeight: '800', color: C.ink }]}>{score} / 5</Text></Row>)}</View> : <Text style={T.small}>Neue Menschen starten neutral. Ein öffentliches Bild entsteht erst ab drei unterschiedlichen Gegenübern.</Text>}
  </View>;
}
