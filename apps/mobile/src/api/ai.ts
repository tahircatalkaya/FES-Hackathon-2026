import { Platform } from 'react-native';
import { File } from 'expo-file-system';

/**
 * Echte Bild- und Spracherkennung für Foodsharing.
 * Anbieter: Gemini (Bild + Audio in einem Aufruf) oder OpenAI (Vision + Whisper).
 * Der Schlüssel kommt aus apps/mobile/.env als EXPO_PUBLIC_GEMINI_KEY oder EXPO_PUBLIC_OPENAI_KEY
 * und wird beim Bundlen eingesetzt. Ohne Schlüssel liefert aiProvider() null und die
 * App bietet nur die manuelle Eingabe an. Es wird nichts vorgetäuscht.
 */

export interface FoodItem { name: string; qty: string; cat: string; grams: number }
export type Fill = 'leer' | 'wenig' | 'mittel' | 'voll';
export interface FoodAnalysis { items: FoodItem[]; fill: Fill; foodVisible: boolean; note?: string }
export type AiMode = 'shelf' | 'stock' | 'pickup';

export const CATS = ['Backwaren', 'Obst & Gemüse', 'Milchprodukte', 'Konserven', 'Gekochtes', 'Getränke', 'Sonstiges'];

const GEMINI_KEY = (process.env.EXPO_PUBLIC_GEMINI_KEY ?? '').trim();
const OPENAI_KEY = (process.env.EXPO_PUBLIC_OPENAI_KEY ?? '').trim();
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.6-flash';
const OPENAI_MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL || 'gpt-4o-mini';

export type AiProvider = 'gemini' | 'openai' | null;
export function aiProvider(): AiProvider {
  if (GEMINI_KEY.length > 10) return 'gemini';
  if (OPENAI_KEY.length > 10) return 'openai';
  return null;
}

const SCHEMA_TEXT = `Antworte ausschließlich mit JSON in genau dieser Form:
{"items":[{"name":"<Lebensmittel, deutsch, kurz>","qty":"<Menge als Text, z. B. '6 Stück', 'ca. 1 kg', '2 Dosen'>","cat":"<eine von: ${CATS.join(' | ')}>","grams":<geschätztes Gesamtgewicht in Gramm als Zahl>}],
"fill":"<leer | wenig | mittel | voll>","food_visible":<true|false>,"note":"<ein kurzer Hinweis, falls etwas unklar oder nicht mehr genießbar wirkt, sonst leer>"}`;

function promptFor(mode: AiMode, kind: 'photo' | 'audio' | 'text') {
  const what = mode === 'shelf'
    ? 'Das Bild zeigt das Regal oder den Kühlschrank eines öffentlichen Fairteilers (foodsharing). Liste alle erkennbaren Lebensmittel mit geschätzten Mengen auf und schätze, wie voll das Regal ist.'
    : mode === 'stock'
      ? 'Die Person hat gerade Lebensmittel in einen öffentlichen Fairteiler gelegt. Liste auf, was eingestellt wurde, mit Mengen.'
      : 'Die Person nimmt gerade Lebensmittel aus einem öffentlichen Fairteiler mit. Liste auf, was mitgenommen wird, mit Mengen.';
  const src = kind === 'photo' ? 'Analysiere das Foto.' : kind === 'audio' ? 'Höre die Sprachnotiz (Deutsch, kann Dialekt oder Umgangssprache enthalten) und extrahiere die genannten Lebensmittel.' : 'Extrahiere die Lebensmittel aus dem Text.';
  return `${what} ${src} Sei konkret (z. B. "Laugenstangen" statt "Backwaren"). Wenn keine Lebensmittel erkennbar sind, gib eine leere Liste und food_visible=false zurück. Bei "fill" für Einstellen/Abholen einfach "mittel" nehmen. ${SCHEMA_TEXT}`;
}

function parse(text: string): FoodAnalysis {
  const m = text.match(/\{[\s\S]*\}/);
  const j = JSON.parse(m ? m[0] : text);
  const items: FoodItem[] = (Array.isArray(j.items) ? j.items : []).map((i: any) => ({
    name: String(i.name ?? '').trim() || 'Unbekannt',
    qty: String(i.qty ?? '').trim() || '1 Stück',
    cat: CATS.includes(i.cat) ? i.cat : 'Sonstiges',
    grams: Math.max(0, Math.round(Number(i.grams) || 0)) || estimateGrams(String(i.qty ?? ''), CATS.includes(i.cat) ? i.cat : 'Sonstiges'),
  })).filter((i: FoodItem) => i.name && i.name !== 'Unbekannt');
  const fill: Fill = (['leer', 'wenig', 'mittel', 'voll'] as Fill[]).includes(j.fill) ? j.fill : 'mittel';
  return { items, fill, foodVisible: j.food_visible !== false, note: typeof j.note === 'string' && j.note.trim() ? j.note.trim() : undefined };
}

/** Grobe Gewichtsschätzung aus Mengentext und Kategorie, für die manuelle Eingabe. */
export function estimateGrams(qty: string, cat: string): number {
  const s = qty.toLowerCase().replace(',', '.');
  const num = parseFloat(s.match(/(\d+(\.\d+)?)/)?.[1] ?? '1') || 1;
  if (/\bkg\b/.test(s)) return Math.round(num * 1000);
  if (/\b(g|gramm)\b/.test(s)) return Math.round(num);
  if (/\b(l|liter)\b/.test(s)) return Math.round(num * 1000);
  const per: Record<string, number> = { Backwaren: 90, 'Obst & Gemüse': 180, Milchprodukte: 400, Konserven: 400, Gekochtes: 450, Getränke: 1000, Sonstiges: 300 };
  return Math.round(num * (per[cat] ?? 300));
}

/** Keine Schlüssel oder rohen Serverantworten in Fehlermeldungen anzeigen. */
async function aiRequest(provider: string, url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const r = await fetch(url, { ...init, signal: controller.signal });
    if (r.ok) return r;
    if (r.status === 429) throw new Error(`${provider}: API-Limit erreicht. Später erneut versuchen oder kostenlos selbst eintragen. Kontingent in AI Studio prüfen.`);
    if (r.status === 401 || r.status === 403) throw new Error(`${provider}: API-Schlüssel oder Berechtigung ungültig. Den Schlüssel im Anbieter-Konto prüfen.`);
    if (r.status === 404) throw new Error(`${provider}: Das eingestellte KI-Modell ist nicht verfügbar. Modellkonfiguration aktualisieren.`);
    if (r.status === 400 || r.status === 413) throw new Error(`${provider}: Datei oder Anfrage nicht unterstützt. Eine kurze neue Aufnahme oder ein kleineres Foto versuchen.`);
    throw new Error(`${provider} ist gerade nicht verfügbar (HTTP ${r.status}). Bitte später erneut versuchen.`);
  } catch (e) {
    if (controller.signal.aborted) throw new Error('Die KI hat nach 45 Sekunden nicht geantwortet. Erneut versuchen oder selbst eintragen.');
    if (e instanceof TypeError) throw new Error('Keine Verbindung zur KI. Internetverbindung prüfen oder selbst eintragen.');
    throw e;
  } finally { clearTimeout(timeout); }
}

async function gemini(parts: any[]): Promise<string> {
  const r = await aiRequest('Gemini', `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY },
    body: JSON.stringify({ contents: [{ role: 'user', parts }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } }),
  });
  const j = await r.json();
  const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text ?? '').join('') ?? '';
  if (!text) throw new Error('Gemini: leere Antwort');
  return text;
}

async function openaiChat(content: any[]): Promise<string> {
  const r = await aiRequest('OpenAI', 'https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({ model: OPENAI_MODEL, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'user', content }] }),
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content ?? '';
}

/** Foto (base64, ohne data:-Präfix) → erkannte Lebensmittel. */
export async function analyzePhoto(base64: string, mime: string, mode: AiMode): Promise<FoodAnalysis> {
  const p = aiProvider();
  if (!p) throw new Error('Keine KI eingerichtet');
  const prompt = promptFor(mode, 'photo');
  const text = p === 'gemini'
    ? await gemini([{ text: prompt }, { inlineData: { mimeType: mime, data: base64 } }])
    : await openaiChat([{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}`, detail: 'low' } }]);
  return parse(text);
}

/** Freitext (z. B. Transkript) → Lebensmittel. */
export async function analyzeText(text: string, mode: AiMode): Promise<FoodAnalysis> {
  const p = aiProvider();
  if (!p) throw new Error('Keine KI eingerichtet');
  const prompt = `${promptFor(mode, 'text')}\n\nText: """${text}"""`;
  const out = p === 'gemini' ? await gemini([{ text: prompt }]) : await openaiChat([{ type: 'text', text: prompt }]);
  return parse(out);
}

/** Sprachnotiz → Transkript + Lebensmittel. Gemini hört direkt zu, OpenAI transkribiert mit Whisper und wertet dann den Text aus. */
export async function analyzeAudio(uri: string, mime: string, mode: AiMode): Promise<FoodAnalysis & { transcript: string }> {
  const p = aiProvider();
  if (!p) throw new Error('Keine KI eingerichtet');
  if (p === 'gemini') {
    const b64 = await fileToBase64(uri);
    const prompt = `${promptFor(mode, 'audio')} Gib zusätzlich das wörtliche Transkript im Feld "transcript" zurück.`;
    const text = await gemini([{ text: prompt }, { inlineData: { mimeType: mime, data: b64 } }]);
    const res = parse(text);
    let transcript = '';
    try { transcript = String(JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{}').transcript ?? ''); } catch {}
    return { ...res, transcript };
  }
  const transcript = await whisper(uri, mime);
  const res = await analyzeText(transcript, mode);
  return { ...res, transcript };
}

async function whisper(uri: string, mime: string): Promise<string> {
  const fd = new FormData();
  const ext = mime.includes('wav') ? 'wav' : mime.includes('aac') ? 'aac' : mime.includes('webm') ? 'webm' : 'm4a';
  if (Platform.OS === 'web') { const blob = await (await fetch(uri)).blob(); fd.append('file', blob, `note.${ext}`); }
  else fd.append('file', { uri, name: `note.${ext}`, type: mime } as any);
  fd.append('model', 'whisper-1'); fd.append('language', 'de');
  const r = await aiRequest('Whisper', 'https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${OPENAI_KEY}` }, body: fd });
  return (await r.json()).text ?? '';
}

/** Liest eine lokale Datei (file://, blob:, content://) als base64 ohne data:-Präfix. */
export async function fileToBase64(uri: string): Promise<string> {
  if (Platform.OS !== 'web') {
    const file = new File(uri);
    if (!file.exists || file.size === 0) throw new Error('Die Aufnahme ist leer. Bitte erneut aufnehmen.');
    if (file.size > 14 * 1024 * 1024) throw new Error('Die Datei ist zu groß. Bitte eine kürzere Aufnahme verwenden.');
    return file.base64();
  }
  const blob = await (await fetch(uri)).blob();
  return await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    fr.onload = () => resolve(String(fr.result).split(',')[1] ?? '');
    fr.readAsDataURL(blob);
  });
}
