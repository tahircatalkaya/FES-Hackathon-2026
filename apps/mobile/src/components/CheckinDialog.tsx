import { useT, useLocalize } from '@/i18n/useT';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { C, CONTEXT, RIDE, shadow } from '@/theme';
import { T, haptic } from './ui';
import { nfcAvailable, readTag, demoTag, type TagInfo } from '@/api/nfc';
import type { Award } from '@/engine/types';
import { CelebrationOverlay } from './ChamiMascot';
import { useUI } from '@/store/ui';
import { BASE } from '@/engine/reward';

const TERMINAL = require('../../assets/checkin/terminal.png');
const PHONE = require('../../assets/checkin/phone.png');
const ACCENT = CONTEXT.mobility.color;
/** Fester Betrag fuer den Check-in. Quelle bleibt die Engine, damit UI und Buchung nie auseinanderlaufen. */
const CHECKIN_POINTS = BASE['ride.checkin'];

/**
 * Terminal-Check-in als Pop-up (portiert aus dem Web-Prototyp).
 * Stufe 1: Handy ans Lesefeld halten, Terminal und Handy animiert.
 * Stufe 2: sofortiger Fahrtenclip und gemeinsames Punktefenster.
 * Gebucht wird ueber onCheckin, das intern award() aufruft. Angezeigt wird, was wirklich gutgeschrieben wurde.
 * Echtes NFC wird im Hintergrund gelesen, wenn das Gerät es kann, sonst Simulation.
 */
export default function CheckinDialog({
  open, onClose, onCheckin, onContinue, demoLine = 'U4', headsign, stopName, continueLabel,
}: {
  open: boolean;
  onClose: () => void;
  /** Bucht den Check-in und gibt die Gutschrift zurueck. Einzige Punktquelle bleibt award(). */
  onCheckin: (t: TagInfo) => Award;
  onContinue: () => void;
  demoLine?: string;
  headsign?: string;
  stopName?: string;
  continueLabel?: string;
}) {
  const t = useT();
  const [stage, setStage] = useState<'terminal' | 'success'>('terminal');
  const [tag, setTag] = useState<TagInfo | null>(null);
  const [award, setAward] = useState<Award | null>(null);
  const [real, setReal] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStage('terminal');
    setTag(null);
    setAward(null);
    let alive = true;
    (async () => {
      const has = await nfcAvailable();
      if (!alive) return;
      setReal(has);
      if (!has) return;
      const t = await readTag();
      if (alive && t) succeed(t);
    })();
    return () => { alive = false; };
  }, [open]);

  function succeed(t: TagInfo) { setTag(t); setAward(onCheckin(t)); setStage('success'); haptic('success'); }

  if (!open) return null;
  if(stage==='success')return <CelebrationOverlay open clip="ride" points={award?.points??0} duplicate={award?.duplicate} headline={t('components.checkin.success')} note={award?.formula} onClose={onClose} onWhy={award?()=>{onClose();useUI.getState().showWhy(award);}:undefined} continueLabel={continueLabel??t('act.ride')} onContinue={()=>{onClose();onContinue();}}/>;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(16,43,84,0.43)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        {/* Klick auf den Hintergrund schliesst, wie beim <dialog>-Backdrop im Web. */}
        <Pressable style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} onPress={onClose} accessibilityLabel={t('components.common.close')} />
        <Appear>
          <View style={[{ backgroundColor: '#fff', borderRadius: 28, borderWidth: 1, borderColor: C.line, padding: 24 }, shadow(3)]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', letterSpacing: 1.4, color: ACCENT }}>
                {t('components.checkin.nfc')}
              </Text>
              <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel={t('components.common.close')}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 26, lineHeight: 30, color: C.ink2 }}>×</Text>
              </Pressable>
            </View>

            <Terminal real={real} demoLine={demoLine} headsign={headsign} stopName={stopName} onSimulate={()=>succeed(demoTag(demoLine))} onCancel={onClose}/>
          </View>
        </Appear>
      </View>
    </Modal>
  );
}

/* ---------- Stufe 1: Terminal ---------- */
function Terminal({ real, demoLine, headsign, stopName, onSimulate, onCancel }: { real: boolean; demoLine: string; headsign?: string; stopName?: string; onSimulate: () => void; onCancel: () => void }) {
  const t = useT();
  return (
    <View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: C.ink, letterSpacing: -0.6, lineHeight: 31, marginBottom: 12 }}>{t('components.checkin.title')}</Text>
      <Text style={{ fontSize: 16, lineHeight: 25, color: C.ink2 }}>
        {real ? t('components.checkin.real') : t('components.checkin.demo')}
      </Text>

      <View style={{ marginTop: 22, marginBottom: 18, borderRadius: 20, backgroundColor: C.bg, overflow: 'hidden', alignItems: 'center' }}>
        <Scene />
        <Text style={{ paddingHorizontal: 12, paddingBottom: 16, fontSize: 14, lineHeight: 20, color: C.ink2, textAlign: 'center' }}>{t('components.checkin.hold')}</Text>
      </View>

      <Text style={{ textAlign: 'center', fontSize: 14, lineHeight: 20, color: C.ink2, marginBottom: 18 }}>
        {t('components.checkin.try')}{'\n'}
        <Text style={{ color: C.muted }}>{t('components.checkin.terminal', { line: demoLine })}{headsign ? ` ${t('components.checkin.direction', { destination: headsign })}` : ''}{stopName ? ` · ${stopName}` : ''}</Text>
      </Text>

      <Pressable onPress={onSimulate} style={({ pressed }) => ({ backgroundColor: ACCENT, borderRadius: 16, paddingVertical: 14, alignItems: 'center', opacity: pressed ? 0.85 : 1 })}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{t('components.checkin.simulate')}</Text>
      </Pressable>
      <Pressable onPress={onCancel} style={{ marginTop: 8, paddingVertical: 12, alignItems: 'center' }}>
        <Text style={{ color: C.muted, fontWeight: '700' }}>{t('common.cancel')}</Text>
      </Pressable>
    </View>
  );
}

/** Terminal steht links, das Handy wandert zum Lesefeld, der Ring pulst im Takt (checkin-phone-tap / checkin-reader-pulse). */
function Scene() {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.quad) }), -1, false); }, []);

  const phone = useAnimatedStyle(() => {
    const k = [0, 0.12, 0.4, 0.65, 1];
    return {
      transform: [
        { translateX: interpolate(p.value, k, [12, 12, -34, -34, 12]) },
        { translateY: interpolate(p.value, k, [14, 14, -12, -12, 14]) },
        { rotate: `${interpolate(p.value, k, [8, 8, -9, -9, 8])}deg` },
      ],
    };
  });
  const signal = useAnimatedStyle(() => {
    const k = [0, 0.3, 0.43, 0.65, 0.8, 1];
    return {
      opacity: interpolate(p.value, k, [0, 0, 0.55, 0, 0, 0]),
      transform: [{ scale: interpolate(p.value, k, [0.65, 0.65, 0.75, 1.35, 0.65, 0.65]) }],
    };
  });

  return (
    <View style={{ width: 280, maxWidth: '100%', height: 210 }}>
      <Image source={TERMINAL} style={{ position: 'absolute', width: 150, height: 190, left: 24, top: 12 }} resizeMode="contain" />
      <Animated.View style={[{ position: 'absolute', width: 72, height: 72, left: 60, top: 64, borderWidth: 2, borderColor: RIDE.grey, borderRadius: 36 }, signal]} />
      <Animated.View style={[{ position: 'absolute', left: 166, top: 44 }, phone]}>
        <Image source={PHONE} style={{ width: 92, height: 146 }} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

/** checkin-appear: 180 ms, leicht von unten. */
function Appear({ children }: { children: React.ReactNode }) {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.quad) }); }, []);
  const st = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: interpolate(p.value, [0, 1], [8, 0]) }] }));
  return <Animated.View style={[{ width: '100%', maxWidth: 392 }, st]}>{children}</Animated.View>;
}
