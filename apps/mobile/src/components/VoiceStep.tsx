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
            setLocalErr('Aufnahme unterbrochen. Bitte die App offen lassen und erneut aufnehmen.');
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
        throw new Error('Mikrofonzugriff im Browser benötigt HTTPS oder localhost. Öffne die App auf dem Handy in Expo Go.');
      }
      const perm = await AudioModule.requestRecordingPermissionsAsync();
      if (!alive.current) return;
      if (!perm.granted) {
        setSettings(!perm.canAskAgain && Platform.OS !== 'web');
        throw new Error('Bitte den Mikrofonzugriff erlauben. Auf dem iPhone: Einstellungen → Apps → Expo Go → Mikrofon.');
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
        setLocalErr(e instanceof Error ? e.message : 'Das Mikrofon ist gerade nicht verfügbar. Bitte erneut versuchen.');
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
      if (!uri || duration < 600) throw new Error('Die Aufnahme war zu kurz. Bitte mindestens eine Sekunde sprechen.');
      let mime = 'audio/m4a';
      if (Platform.OS === 'web') {
        const blob = await (await fetch(uri)).blob();
        if (!blob.size) throw new Error('Die Aufnahme ist leer. Bitte erneut versuchen.');
        mime = blob.type.split(';')[0] || 'audio/webm';
      }
      if (alive.current) onDone(uri, mime);
    } catch (e) {
      if (alive.current) setLocalErr(e instanceof Error ? e.message : 'Aufnahme konnte nicht gespeichert werden.');
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
      <Text style={[T.body, { textAlign: 'center' }]}>{rec ? 'Sprich jetzt. Zum Beenden auf Stopp tippen.' : 'Zum Beispiel: „Zwei Tüten Brötchen und drei Joghurt.“'}</Text>
      <Text accessibilityLiveRegion="polite" style={[T.h1, { color, fontVariant: ['tabular-nums'] }]}>{Math.floor(state.durationMillis / 60000)}:{String(Math.floor(state.durationMillis / 1000) % 60).padStart(2, '0')}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={rec ? 'Aufnahme stoppen' : 'Aufnahme starten'} accessibilityState={{ disabled: waiting }} disabled={waiting}
        onPress={() => void (rec ? stop() : start())}
        style={[{ width: 88, height: 88, borderRadius: 44, backgroundColor: rec ? C.danger : color, alignItems: 'center', justifyContent: 'center', opacity: waiting ? 0.6 : 1 }, shadow(2)]}>
        {waiting ? <ActivityIndicator color="#fff" /> : <Ionicons name={rec ? 'stop' : 'mic'} size={36} color="#fff" />}
      </Pressable>
      <Text style={T.h3}>{phase === 'starting' ? 'Mikrofon wird vorbereitet…' : phase === 'stopping' ? 'Aufnahme wird gespeichert…' : rec ? 'Aufnahme stoppen' : 'Aufnahme starten'}</Text>
      <Text style={[T.small, { textAlign: 'center' }]}>{ai ? 'Nach dem Stoppen wird die Aufnahme zur KI-Auswertung gesendet. Maximal 60 Sekunden.' : 'Aufnehmen ist kostenlos. Ohne KI-Schlüssel trägst du den Inhalt danach selbst ein.'}</Text>
      {(localErr || error) && <Text accessibilityRole="alert" style={[T.small, { color: C.warn, textAlign: 'center' }]}>{localErr || error}</Text>}
      {settings && <Button label="Einstellungen öffnen" variant="soft" color={color} onPress={() => void Linking.openSettings()} />}
    </View>
  );
}
