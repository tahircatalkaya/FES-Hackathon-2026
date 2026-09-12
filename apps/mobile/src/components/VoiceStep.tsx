import { useT, useLocalize } from '@/i18n/useT';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Linking, Platform, Pressable, Text, View } from 'react-native';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { C, shadow } from '@/theme';
import { Button, T, haptic } from './ui';

function recordingOptions() {
  if (Platform.OS !== 'web' || typeof MediaRecorder === 'undefined') return RecordingPresets.HIGH_QUALITY;
  // Safari may support MP4 rather than WebM. Preserve the actual container for upload.
  const mimeType = ['audio/webm', 'audio/mp4'].find((mime) => MediaRecorder.isTypeSupported(mime));
  return { ...RecordingPresets.HIGH_QUALITY, web: { bitsPerSecond: 128000, ...(mimeType ? { mimeType } : {}) } };
}

export default function VoiceStep({ color, ai, error, onDone }: {
  color: string; ai: boolean; error: string | null;
  onDone: (uri: string | undefined, mime: string) => void;
}) {
  const t = useT();
  const localize = useLocalize();
  const recorder = useAudioRecorder(recordingOptions());
  const state = useAudioRecorderState(recorder, 200);
  const [phase, setPhase] = useState<'idle' | 'starting' | 'recording' | 'stopping'>('idle');
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [settings, setSettings] = useState(false);
  const alive = useRef(true);
  const busy = useRef(false);
  const started = useRef(false);

  useEffect(() => {
    alive.current = true;
    const sub = AppState.addEventListener('change', (next) => {
      if (next !== 'active' && started.current) {
        started.current = false;
        void recorder.stop().catch(() => {}).finally(() => {
          void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
          if (alive.current) {
            setPhase('idle');
            setLocalErr(t('components.voice.interrupted'));
          }
        });
      }
    });
    return () => {
      alive.current = false;
      sub.remove();
      if (started.current) void recorder.stop().catch(() => {});
      started.current = false;
      // The hook releases the native recorder; also restore the iOS audio session.
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
  }, [recorder]);

  async function start() {
    if (busy.current || started.current) return;
    busy.current = true;
    setPhase('starting'); setLocalErr(null); setSettings(false); haptic();
    try {
      if (Platform.OS === 'web' && (!globalThis.isSecureContext || !navigator.mediaDevices?.getUserMedia)) {
        throw new Error(t('components.voice.secure'));
      }
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!alive.current) return;
      if (!perm.granted) {
        setSettings(!perm.canAskAgain && Platform.OS !== 'web');
        throw new Error(t('components.voice.permission'));
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (!alive.current) { await setAudioModeAsync({ allowsRecording: false }); return; }
      await recorder.prepareToRecordAsync();
      if (!alive.current) { await recorder.stop().catch(() => {}); return; }
      recorder.record(); started.current = true; setPhase('recording');
    } catch (e) {
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
      if (alive.current) {
        setPhase('idle');
        setLocalErr(e instanceof Error ? e.message : t('components.voice.unavailable'));
      }
    } finally { busy.current = false; }
  }

  async function stop() {
    if (busy.current || !started.current) return;
    busy.current = true; started.current = false; setPhase('stopping'); haptic();
    const duration = state.durationMillis;
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      if (!alive.current) return;
      const uri = recorder.uri;
      if (!uri || duration < 600) throw new Error(t('components.voice.short'));
      let mime = 'audio/m4a';
      if (Platform.OS === 'web') {
        const blob = await (await fetch(uri)).blob();
        if (!blob.size) throw new Error(t('components.voice.empty'));
        mime = blob.type.split(';')[0] || 'audio/webm';
      }
      if (alive.current) onDone(uri, mime);
    } catch (e) {
      if (alive.current) setLocalErr(e instanceof Error ? e.message : t('components.voice.saveFailed'));
    } finally {
      busy.current = false;
      if (alive.current) setPhase('idle');
    }
  }

  useEffect(() => { if (state.isRecording && state.durationMillis >= 60000) void stop(); }, [state.durationMillis, state.isRecording]);

  const rec = phase === 'recording';
  const waiting = phase === 'starting' || phase === 'stopping';
  return (
    <View style={{ alignItems: 'center', paddingVertical: 10, gap: 14 }}>
      <Text style={[T.body, { textAlign: 'center' }]}>{rec ? t('components.voice.speak') : t('components.voice.example')}</Text>
      <Text accessibilityLiveRegion="polite" style={[T.h1, { color, fontVariant: ['tabular-nums'] }]}>{Math.floor(state.durationMillis / 60000)}:{String(Math.floor(state.durationMillis / 1000) % 60).padStart(2, '0')}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={rec ? t('components.voice.stop') : t('components.voice.start')} accessibilityState={{ disabled: waiting }} disabled={waiting}
        onPress={() => void (rec ? stop() : start())}
        style={[{ width: 88, height: 88, borderRadius: 44, backgroundColor: rec ? C.danger : color, alignItems: 'center', justifyContent: 'center', opacity: waiting ? 0.6 : 1 }, shadow(2)]}>
        {waiting ? <ActivityIndicator color="#fff" /> : <Ionicons name={rec ? 'stop' : 'mic'} size={36} color="#fff" />}
      </Pressable>
      <Text style={T.h3}>{phase === 'starting' ? t('components.voice.preparing') : phase === 'stopping' ? t('components.voice.saving') : rec ? t('components.voice.stop') : t('components.voice.start')}</Text>
      <Text style={[T.small, { textAlign: 'center' }]}>{ai ? t('components.voice.aiHint') : t('components.voice.manualHint')}</Text>
      {(localErr || error) && <Text accessibilityRole="alert" style={[T.small, { color: C.warn, textAlign: 'center' }]}>{localize(localErr || error || '')}</Text>}
      {settings && <Button label={t('components.voice.settings')} variant="soft" color={color} onPress={() => void Linking.openSettings()} />}
    </View>
  );
}
