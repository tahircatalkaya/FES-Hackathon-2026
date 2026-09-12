export type VerificationStatus =
  | 'bestätigt'
  | 'plausibel'
  | 'schwach plausibel'
  | 'selbst angegeben'
  | 'nicht zuordenbar'
  | 'ausstehend';

export type ActionType =
  // Mobilität
  | 'ride.checkin' // Terminal-Check-in, fester Betrag
  | 'ride.transit'
  | 'ride.active' // Fuß/Rad statt Auto
  | 'ride.sharing_feeder'
  | 'ride.scooter_short'
  | 'ride.correction'
  // Mehrweg
  | 'reuse.return'
  | 'reuse.return_fast'
  // Foodsharing
  | 'food.stock' // einstellen
  | 'food.report' // Regal-Status melden
  | 'food.offer' // Korb anbieten
  | 'food.distribute' // Verteilung als Saver
  | 'food.pickup' // abholen: 0 Punkte, voller Impact
  | 'food.pickup_for_other'
  | 'food.reservation_kept'
  // FES
  | 'clean.signup' // Anmeldung zu einer Aktion, noch keine Punkte
  | 'clean.participate'
  | 'clean.organize'
  | 'clean.report'
  | 'clean.bin_checkin'
  | 'clean.bin_quality' // Biotonnen-Check per Foto
  | 'clean.quiz'
  | 'clean.litter_solo' // 0 Punkte, nur Anerkennung
  // Rhythmus
  | 'rhythm.weekly_goal'
  | 'rhythm.four_weeks';

export type Partner = 'transdev' | 'vytal' | 'foodsharing' | 'fes' | 'traffiq' | 'mainsam';

export interface Impact {
  co2_g: number; // vermiedene Emissionen in Gramm CO2e
  food_g: number; // gerettete Lebensmittel in Gramm
  packaging: number; // vermiedene Einwegverpackungen
  km: number; // nachhaltig zurückgelegte Kilometer
  estimated: boolean;
}

export interface ActionEvent {
  type: ActionType;
  partner: Partner;
  status: VerificationStatus;
  /** Fachlicher Schlüssel: partner + externe ID. Verhindert Doppelbelohnung. */
  key: string;
  at: number; // epoch ms
  title: string;
  /** Rohwerte für Impact-Berechnung */
  meta?: {
    km?: number;
    mode?: 'U' | 'S' | 'T' | 'bus' | 'bike' | 'walk' | 'scooter' | 'pedelec';
    food_g?: number;
    containers?: number;
    confidence?: number;
    source?: string; // 'api' | 'gps+gtfs' | 'nfc' | 'user' | 'peer' | 'fes'
    evidence?: string[]; // Begründungssätze aus dem Nachweis
    [k: string]: unknown;
  };
}

export interface Award {
  key: string;
  type: ActionType;
  partner: Partner;
  title: string;
  at: number;
  status: VerificationStatus;
  base: number;
  multiplier: number;
  degression: number; // 1, 0.6, 0.3, 0
  capped: number; // Punkte, die am Tagesdeckel verloren gingen
  points: number;
  impact: Impact;
  reasons: string[];
  formula: string;
  duplicate?: boolean;
  /** Fester Betrag: ohne Nachweis-Multiplikator und ohne Degression gewertet. */
  flat?: boolean;
  meta?: ActionEvent['meta'];
}
