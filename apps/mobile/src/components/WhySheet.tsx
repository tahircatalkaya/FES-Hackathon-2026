import React from 'react';
import { Text, View } from 'react-native';
import type { Award } from '@/engine/types';
import { Sheet, StatusBadge, T, Divider, Row, Tag } from './ui';
import { C, S } from '@/theme';
import { fmtCo2 } from '@/engine/impact';
import { FACTORS } from '@/engine/impact';

/** Ein Screen, ein Bewertungskriterium: Nachvollziehbarkeit der Impact- und Reward-Logik. */
export default function WhySheet({ award, onClose }: { award: Award | null; onClose: () => void }) {
  const a = award;
  const mode = a?.meta?.mode as keyof typeof FACTORS | undefined;
  return (
    <Sheet open={!!a} onClose={onClose} title="Warum diese Punkte?">
      {a && (
        <View>
          <Text style={T.h3}>{a.title}</Text>
          <Row style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
            <StatusBadge status={a.status} />
            <Tag label={`Quelle: ${a.meta?.source ?? a.partner}`} />
            {a.impact.estimated && <Tag label="Impact: Schätzung" color={C.community} />}
          </Row>
          <Divider />
          <Text style={T.label}>Rechnung</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 4 }}>{a.formula}</Text>
          <Text style={T.small}>Basis × Nachweis-Multiplikator × Degression (1./2./3. Aktion heute)</Text>
          <View style={{ flexDirection: 'row', marginTop: S.md, gap: 8 }}>
            <Cell k="Basis" v={String(a.base)} />
            <Cell k="Multiplikator" v={`×${a.multiplier.toFixed(1)}`} />
            <Cell k="Degression" v={`×${a.degression}`} />
            <Cell k="Punkte" v={String(a.points)} strong />
          </View>
          <Divider />
          <Text style={T.label}>Begründung</Text>
          {a.reasons.map((r, i) => (
            <Row key={i} style={{ alignItems: 'flex-start', marginTop: 8 }}>
              <Text style={{ color: C.success, fontWeight: '800' }}>•</Text>
              <Text style={[T.body, { flex: 1 }]}>{r}</Text>
            </Row>
          ))}
          <Divider />
          <Text style={T.label}>Impact</Text>
          <Row style={{ marginTop: 6, flexWrap: 'wrap', gap: 10 }}>
            {a.impact.co2_g > 0 && <Text style={T.body}>🌍 {fmtCo2(a.impact.co2_g)} CO₂e vermieden</Text>}
            {a.impact.food_g > 0 && <Text style={T.body}>🥕 {(a.impact.food_g / 1000).toFixed(1)} kg Lebensmittel</Text>}
            {a.impact.packaging > 0 && <Text style={T.body}>🥡 {a.impact.packaging}× Einweg vermieden</Text>}
            {a.impact.km > 0 && <Text style={T.body}>📍 {a.impact.km.toFixed(1)} km</Text>}
            {a.impact.co2_g === 0 && a.impact.food_g === 0 && a.impact.packaging === 0 && <Text style={T.small}>Kein direkter Impact-Wert für diese Aktion.</Text>}
          </Row>
          {mode && FACTORS[mode] && (
            <Text style={[T.small, { marginTop: 8 }]}>
              Faktor: {FACTORS[mode].label} {FACTORS[mode].g} g/Pkm vs. Pkw {FACTORS.car.g} g/Pkm. Quelle: {FACTORS[mode].source}. Formel: km × (Pkw − genutzt).
            </Text>
          )}
          <Text style={[T.small, { marginTop: S.md }]}>Schlüssel {a.key} · {new Date(a.at).toLocaleString('de-DE')}</Text>
        </View>
      )}
    </Sheet>
  );
}

function Cell({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: strong ? C.ink : '#fff', borderRadius: 14, padding: 10 }}>
      <Text style={[T.label, { fontSize: 10, color: strong ? '#ffffffaa' : C.muted }]}>{k}</Text>
      <Text style={{ fontSize: 18, fontWeight: '800', color: strong ? '#fff' : C.ink }}>{v}</Text>
    </View>
  );
}
