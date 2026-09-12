import { Platform } from 'react-native';

/**
 * Fingerabdruck eines Fotos fuer den Dublettenschutz.
 *
 * Im Browser wird ein echter Average-Hash gerechnet: Bild auf 8x8 verkleinern,
 * in Graustufen wandeln, jedes Feld gegen den Mittelwert vergleichen. Das ergibt
 * 64 Bit, die auch nach erneutem Komprimieren stabil bleiben.
 *
 * Auf dem Geraet gibt es ohne zusaetzliches Modul keinen Zugriff auf Pixel.
 * Dort steht deshalb ein Digest ueber die Bilddaten. Der erkennt zuverlaessig,
 * wenn dieselbe Datei noch einmal eingereicht wird, aber nicht ein erneut
 * abfotografiertes oder neu komprimiertes Bild. Das ist die bekannte Luecke:
 * Fuer echte Aehnlichkeitserkennung braucht es Pixelzugriff nativ oder serverseitig.
 */

export type HashKind = 'ahash' | 'digest';
export interface PhotoHash { hash: string; kind: HashKind }

/** 64-Bit-Average-Hash ueber ein Canvas. Nur im Browser verfuegbar. */
async function aHash(uri: string): Promise<string | null> {
  if (typeof document === 'undefined') return null;
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const el = new (window as any).Image();
    el.crossOrigin = 'anonymous';
    el.onload = () => res(el);
    el.onerror = rej;
    el.src = uri;
  }).catch(() => null) as any;
  if (!img) return null;

  const n = 8;
  const cv = document.createElement('canvas');
  cv.width = n; cv.height = n;
  const ctx = cv.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, n, n);
  const { data } = ctx.getImageData(0, 0, n, n);

  const grey: number[] = [];
  for (let i = 0; i < data.length; i += 4) {
    grey.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
  }
  const avg = grey.reduce((a, b) => a + b, 0) / grey.length;

  let hex = '';
  for (let i = 0; i < grey.length; i += 4) {
    let nib = 0;
    for (let k = 0; k < 4; k++) nib = (nib << 1) | (grey[i + k] > avg ? 1 : 0);
    hex += nib.toString(16);
  }
  return hex; // 16 Hex-Zeichen = 64 Bit
}

/** FNV-1a ueber die Bilddaten, auf 64 Bit als Hex gebracht. */
function digest(data: string): string {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < data.length; i++) {
    const c = data.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ ((c + i) & 0xff), 0x85ebca6b) >>> 0;
  }
  return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0'));
}

export async function photoFingerprint(uri: string, base64?: string): Promise<PhotoHash> {
  if (Platform.OS === 'web') {
    const h = await aHash(uri);
    if (h) return { hash: h, kind: 'ahash' };
  }
  return { hash: digest(base64 ?? uri), kind: 'digest' };
}
