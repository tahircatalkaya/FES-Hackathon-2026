import { useT, useLocalize, useLocale } from '@/i18n/useT';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { C, R, S } from '@/theme';
import { ACTION_TYPES, dayOptions, meetingPointsFor, timeOptions } from '@/data/fes';
import { CLEANUPS } from '@/data/mock';
import { DISTRICTS } from '@/data/mock';
import { useStore } from '@/store';
import { Button, Pill, Sheet, T, haptic } from './ui';

const ROW = 44, VISIBLE = 5;

/** Rad wie auf dem iPhone: Werte rasten mittig ein. */
function Wheel({ items, index, onIndex }: { items: string[]; index: number; onIndex: (i: number) => void }) {
  const ref = useRef<ScrollView>(null);
  useEffect(() => {
    const id = setTimeout(() => ref.current?.scrollTo({ y: index * ROW, animated: false }), 60);
    return () => clearTimeout(id);
  }, []);
  return (
    <View style={{ flex: 1, height: ROW * VISIBLE }}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ROW}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: ROW * 2 }}
        onMomentumScrollEnd={(e) => {
          const i = Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / ROW)));
          if (i !== index) { haptic(); onIndex(i); }
        }}
      >
        {items.map((label, i) => (
          <View key={label} style={{ height: ROW, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: i === index ? C.ink : C.muted, opacity: i === index ? 1 : 0.55 }}>{label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/** Eigene Aktion anlegen: alles über Auswahl, kein Tippen. */
export function NewActionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const localize = useLocalize();
  const locale = useLocale();
  const { district, addCleanup, name } = useStore();
  const [type, setType] = useState(0);
  const [area, setArea] = useState(district);
  const [place, setPlace] = useState(0);
  const [day, setDay] = useState(0);
  const [time, setTime] = useState(4);

  const points = meetingPointsFor(area);
  const days = dayOptions(new Date(), locale);
  const times = timeOptions();

  function save() {
    const typeInfo = ACTION_TYPES[type];
    const d = days[day].date;
    const [h, m] = times[time].split(':').map(Number);
    const start = new Date(d); start.setHours(h, m, 0, 0);
    const ref = CLEANUPS.find((c) => c.district === area) ?? CLEANUPS[0];
    addCleanup({
      id: `own-${Date.now()}`,
      title: `${typeInfo.title} · ${points[place]}`,
      lat: ref.lat, lon: ref.lon,
      district: area,
      start: start.getTime(),
      end: start.getTime() + 2 * 3600e3,
      organizer: name || 'Du',
      participants: 1,
      radiusM: 300,
      material: 'Noch offen. FES-Material anfragen.',
      fesConfirmed: false,
      description: `${typeInfo.title} am Treffpunkt ${points[place]}. Von dir eingetragen, Teilnahme bestätigt die Organisation vor Ort.`,
    });
    haptic('success');
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('components.action.title')}>
      <Text style={T.label}>{t('components.action.type')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: S.sm, marginHorizontal: -4 }}>
        {ACTION_TYPES.map((a, i) => (
          <View key={a.short} style={{ width: '33.33%', padding: 4 }}>
            <Pressable onPress={() => { haptic(); setType(i); }} style={{ minHeight: 84, borderRadius: R.md, borderWidth: 2, borderColor: i === type ? C.clean : C.line, backgroundColor: i === type ? C.clean : '#fff', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 }}>
              <Text style={{ fontSize: 24 }}>{a.icon}</Text>
              <Text style={{ fontSize: 12, fontWeight: '800', color: i === type ? '#fff' : C.ink2, marginTop: 6 }} numberOfLines={1}>{localize(a.short)}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Text style={[T.label, { marginTop: S.lg }]}>{t('components.action.district')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: S.sm }}>
        {DISTRICTS.map((d: any) => {
          const key = typeof d === 'string' ? d : d.name;
          return <Pill key={key} label={key} active={key === area} color={C.clean} onPress={() => { setArea(key); setPlace(0); }} />;
        })}
      </ScrollView>

      <Text style={[T.label, { marginTop: S.lg }]}>{t('components.action.meeting')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: S.sm }}>
        {points.map((p, i) => <Pill key={p} label={localize(p)} active={i === place} color={C.clean} onPress={() => setPlace(i)} />)}
      </View>

      <Text style={[T.label, { marginTop: S.lg }]}>{t('components.action.when')}</Text>
      <View style={{ marginTop: S.sm, borderRadius: R.md, borderWidth: 2, borderColor: C.line, backgroundColor: '#fff', overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 8, right: 8, top: (ROW * VISIBLE) / 2 - ROW / 2, height: ROW, borderRadius: 10, backgroundColor: C.clean + '14' }} />
        <View style={{ flexDirection: 'row' }}>
          <Wheel items={days.map((d) => localize(d.label))} index={day} onIndex={setDay} />
          <Wheel items={times} index={time} onIndex={setTime} />
        </View>
      </View>

      <Button label={t('components.action.save')} onPress={save} color={C.clean} style={{ marginTop: S.lg }} />
      <Text style={[T.small, { marginTop: 8 }]}>{t('components.action.noPoints')}</Text>
    </Sheet>
  );
}
