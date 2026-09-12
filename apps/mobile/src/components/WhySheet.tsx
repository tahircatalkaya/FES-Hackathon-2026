import { useT, useLocalize, useLocale } from '@/i18n/useT';
import React from 'react';
import { Text, View } from 'react-native';
import type { Award } from '@/engine/types';
import { Sheet, StatusBadge, T, Divider, Row, Tag } from './ui';
import { C, S } from '@/theme';
import { fmtCo2 } from '@/engine/impact';
import { FACTORS } from '@/engine/impact';

/** Ein Screen, ein Bewertungskriterium: Nachvollziehbarkeit der Impact- und Reward-Logik. */
export default function WhySheet({ award, onClose }: { award: Award | null; onClose: () => void }) {
  const t = useT();
  const localize = useLocalize();
  const locale = useLocale();
  const a = award;
  // Fester Betrag oder Basis 0: Multiplikator und Degression sagen nichts aus.
  const plain = !!a && (a.flat || a.base === 0);
  const mode = a?.meta?.mode as keyof typeof FACTORS | undefined;
  return (
    <Sheet open={!!a} onClose={onClose} title={t('why.title')}>
      {a && (
        <View>
          <Text style={T.h3}>{localize(a.title)}</Text>
          <Row style={{ marginTop: 8, flexWrap: 'wrap', gap: 6 }}>
            <StatusBadge status={a.status} />
            <Tag label={t('components.why.source', { source: localize(String(a.meta?.source ?? a.partner)) })} />
            {a.impact.estimated && <Tag label={t('components.why.estimate')} color={C.community} />}
          </Row>
          <Divider />
          <Text style={T.label}>{t('components.why.calculation')}</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.ink, marginTop: 4 }}>{localize(a.formula)}</Text>
          <Text style={T.small}>{a.flat ? t('components.why.flat') : plain ? t('components.why.noPoints') : t('components.why.formula')}</Text>
          <View style={{ flexDirection: 'row', marginTop: S.md, gap: 8 }}>
            <Cell k={t('components.why.base')} v={String(a.base)} />
            {!plain && <Cell k={t('components.why.multiplier')} v={`×${a.multiplier.toFixed(1)}`} />}
            {!plain && <Cell k={t('components.why.reduction')} v={`×${a.degression}`} />}
            <Cell k={t('components.why.points')} v={String(a.points)} strong />
          </View>
          <Divider />
          <Text style={T.label}>{t('components.why.reason')}</Text>
          {a.reasons.map((r, i) => (
            <Row key={i} style={{ alignItems: 'flex-start', marginTop: 8 }}>
              <Text style={{ color: C.success, fontWeight: '800' }}>•</Text>
              <Text style={[T.body, { flex: 1 }]}>{localize(r)}</Text>
            </Row>
          ))}
          <Divider />
          <Text style={T.label}>{t('components.why.impact')}</Text>
          <Row style={{ marginTop: 6, flexWrap: 'wrap', gap: 10 }}>
            {a.impact.co2_g > 0 && <Text style={T.body}>🌍 {t('components.why.co2', { amount: fmtCo2(a.impact.co2_g, locale) })}</Text>}
            {a.impact.food_g > 0 && <Text style={T.body}>🥕 {t('components.why.food', { amount: (a.impact.food_g / 1000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) })}</Text>}
            {a.impact.packaging > 0 && <Text style={T.body}>🥡 {t('components.why.packaging', { count: a.impact.packaging })}</Text>}
            {a.impact.km > 0 && <Text style={T.body}>📍 {a.impact.km.toFixed(1)} km</Text>}
            {a.impact.co2_g === 0 && a.impact.food_g === 0 && a.impact.packaging === 0 && <Text style={T.small}>{t('components.why.noImpact')}</Text>}
          </Row>
          {mode && FACTORS[mode] && (
            <Text style={[T.small, { marginTop: 8 }]}>
              {t('components.why.factor', { mode: localize(FACTORS[mode].label), grams: FACTORS[mode].g, car: FACTORS.car.g, source: localize(FACTORS[mode].source) })}
            </Text>
          )}
          <Text style={[T.small, { marginTop: S.md }]}>{t('components.why.key', { key: a.key, date: new Date(a.at).toLocaleString(locale) })}</Text>
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
