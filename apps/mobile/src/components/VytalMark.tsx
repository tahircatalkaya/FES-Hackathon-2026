import React from 'react';
import { Platform, Text, View } from 'react-native';
import { CONTEXT } from '@/theme';

/**
 * Bildmarke von Vytal: das "Vy" als Wortmarke.
 *
 * Die Kachel traegt bewusst nicht das Originalgruen (#22C58B), sondern die Mehrwegfarbe
 * der App, damit sie in der Scan-Auswahl neben den anderen Kacheln steht wie die anderen:
 * volle Flaeche in der Kontextfarbe, Zeichen in Weiss.
 *
 * Die offizielle Logodatei liegt nicht im Repo. Bis sie da ist, steht hier eine
 * Nachbildung mit Serifenschrift. Kommt die Datei, ist zu entscheiden, ob sie mit
 * ihrem eigenen Gruen erscheint oder die Wortmarke weiter eingefaerbt wird.
 */

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, Times New Roman, serif' });

export default function VytalMark({ size = 52, radius, color = CONTEXT.reuse.color }: { size?: number; radius?: number; color?: string }) {
  return (
    <View
      accessibilityLabel="Vytal"
      style={{ width: size, height: size, borderRadius: radius ?? size * 0.3, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: SERIF, fontWeight: '900', fontSize: size * 0.56, lineHeight: size * 0.72, color: '#fff' }}>Vy</Text>
    </View>
  );
}
