import { Platform } from 'react-native';

/**
 * NFC-Tap-in in Bus und Bahn. Tags im Fahrzeug (Türbereich) tragen eine URL wie
 * mainsam://tag?line=U4&vehicle=1234&dir=1  oder eine NDEF-Text-Payload "U4|1234".
 * In Expo Go gibt es kein natives NFC-Modul, dann läuft der Demo-Tag. Im Dev-Build/Store-Build ist es echt.
 */
let NfcManager: any = null; let Ndef: any = null; let NfcTech: any = null;
try {
  const m = require('react-native-nfc-manager');
  NfcManager = m.default ?? m; Ndef = m.Ndef; NfcTech = m.NfcTech;
} catch { NfcManager = null; }

export interface TagInfo { line: string; vehicle: string; raw: string; source: 'nfc' | 'demo' | 'qr' }

export async function nfcAvailable(): Promise<boolean> {
  if (Platform.OS === 'web' || !NfcManager) return false;
  try { return !!(await NfcManager.isSupported()); } catch { return false; }
}

export function parseTag(raw: string): TagInfo | null {
  const s = raw.trim();
  let m = s.match(/line=([A-Za-z0-9]+)/); const v = s.match(/vehicle=([A-Za-z0-9-]+)/);
  if (m) return { line: m[1].toUpperCase(), vehicle: v?.[1] ?? '?', raw: s, source: 'qr' };
  m = s.match(/^([USus]?\d{1,2})\|([A-Za-z0-9-]+)$/);
  if (m) return { line: m[1].toUpperCase(), vehicle: m[2], raw: s, source: 'qr' };
  return null;
}

/** Liest einen NDEF-Tag. Timeout 20 s. Gibt null zurück, wenn nichts gelesen wurde. */
export async function readTag(): Promise<TagInfo | null> {
  if (!(await nfcAvailable())) return null;
  try {
    await NfcManager.start();
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    const rec = tag?.ndefMessage?.[0];
    let text = '';
    if (rec) {
      try { text = Ndef.text.decodePayload(rec.payload); } catch { try { text = Ndef.uri.decodePayload(rec.payload); } catch { text = ''; } }
    }
    const parsed = parseTag(text);
    return parsed ? { ...parsed, source: 'nfc' } : { line: '?', vehicle: tag?.id ?? '?', raw: text || tag?.id || '', source: 'nfc' };
  } catch { return null; }
  finally { try { NfcManager.cancelTechnologyRequest(); } catch {} }
}

export function demoTag(line = 'U4'): TagInfo {
  return { line, vehicle: `${line}-${Math.floor(1000 + Math.random() * 9000)}`, raw: `mainsam://tag?line=${line}`, source: 'demo' };
}
