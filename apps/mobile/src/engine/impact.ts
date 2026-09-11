import type { ActionEvent, Impact } from './types';

/**
 * Emissionsfaktoren in g CO2e pro Personenkilometer.
 * Richtwerte, orientiert an UBA/TREMOD (Personenverkehr). Vor Produktivbetrieb gegenprüfen.
 * Jeder Faktor ist im UI antippbar (Quelle + Stand).
 */
export const FACTORS = {
  car: { g: 154, label: 'Pkw (Ø-Besetzung 1,4)', source: 'UBA, TREMOD, Richtwert' },
  bus: { g: 83, label: 'Linienbus', source: 'UBA, Richtwert' },
  U: { g: 55, label: 'U-Bahn', source: 'UBA, Richtwert (Schienennahverkehr)' },
  S: { g: 55, label: 'S-Bahn', source: 'UBA, Richtwert (Schienennahverkehr)' },
  T: { g: 55, label: 'Straßenbahn', source: 'UBA, Richtwert (Schienennahverkehr)' },
  scooter: { g: 95, label: 'E-Scooter (Lebenszyklus)', source: 'Studien-Spanne 70–120 g, Richtwert' },
  pedelec: { g: 5, label: 'Pedelec', source: 'Richtwert' },
  bike: { g: 0, label: 'Fahrrad', source: 'Betrieb emissionsfrei' },
  walk: { g: 0, label: 'zu Fuß', source: 'emissionsfrei' },
} as const;

export const FOOD_CO2_PER_KG = 2000; // g CO2e je kg geretteter Lebensmittel, konservativer Mittelwert (Schätzung)
export const CUP_CO2 = 30; // g CO2e je vermiedenem Einwegbecher (Schätzung)
export const BOWL_CO2 = 60; // g CO2e je vermiedener Einwegschale (Schätzung)

export function emptyImpact(): Impact {
  return { co2_g: 0, food_g: 0, packaging: 0, km: 0, estimated: true };
}

export function impactFor(e: ActionEvent): Impact {
  const m = e.meta ?? {};
  const out = emptyImpact();
  switch (e.type) {
    case 'ride.transit':
    case 'ride.active':
    case 'ride.sharing_feeder':
    case 'ride.scooter_short': {
      const km = m.km ?? 0;
      const mode = (m.mode ?? 'U') as keyof typeof FACTORS;
      const used = FACTORS[mode]?.g ?? 55;
      out.km = km;
      out.co2_g = Math.max(0, Math.round(km * (FACTORS.car.g - used)));
      if (e.type === 'ride.scooter_short') out.co2_g = 0; // ersetzt Gehen, keine Einsparung
      out.estimated = true;
      break;
    }
    case 'reuse.return':
    case 'reuse.return_fast': {
      const n = m.containers ?? 1;
      out.packaging = n;
      out.co2_g = n * BOWL_CO2;
      break;
    }
    case 'food.pickup':
    case 'food.pickup_for_other':
    case 'food.stock':
    case 'food.offer':
    case 'food.distribute': {
      const g = m.food_g ?? 0;
      out.food_g = g;
      out.co2_g = Math.round((g / 1000) * FOOD_CO2_PER_KG);
      break;
    }
    default:
      break;
  }
  return out;
}

export function addImpact(a: Impact, b: Impact): Impact {
  return {
    co2_g: a.co2_g + b.co2_g,
    food_g: a.food_g + b.food_g,
    packaging: a.packaging + b.packaging,
    km: a.km + b.km,
    estimated: a.estimated || b.estimated,
  };
}

/** Greifbare Vergleiche, immer Frankfurt-lokal. */
export function comparisons(co2_g: number) {
  const kg = co2_g / 1000;
  const carKm = co2_g / FACTORS.car.g;
  return [
    { icon: '🚗', text: `${carKm.toFixed(1)} km Autofahrt`, sub: 'z. B. Bockenheim → Offenbach sind 14 km' },
    { icon: '☕', text: `${Math.round(co2_g / CUP_CO2)} Einwegbecher`, sub: 'Coffee-to-go in Pappe' },
    { icon: '🌳', text: `${(kg / 0.03).toFixed(0)} Baum-Tage`, sub: 'eine Stadtbuche bindet ca. 30 g/Tag (Schätzung)' },
    { icon: '📱', text: `${Math.round(kg / 0.008)} Stunden Streaming`, sub: 'ca. 8 g je Stunde (Schätzung)' },
  ];
}

export function fmtCo2(g: number) {
  return g >= 1000 ? `${(g / 1000).toFixed(g >= 10000 ? 0 : 1)} kg` : `${Math.round(g)} g`;
}
