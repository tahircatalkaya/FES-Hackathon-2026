import type { ViewStyle } from 'react-native';

export interface MapMarker { id: string; lat: number; lon: number; color: string; emoji?: string; label?: string; selected?: boolean; onPress?: () => void }
export interface MapPolyline { points: [number, number][]; color: string; width?: number; dashed?: boolean }
export interface MapCircle { lat: number; lon: number; radius: number; color: string }
export interface HeatPoint { lat: number; lon: number; v: number } // v in 0..1

export interface MapProps {
  center: { lat: number; lon: number };
  /** ungefähre Kantenlänge in km */
  spanKm?: number;
  markers?: MapMarker[];
  polylines?: MapPolyline[];
  circles?: MapCircle[];
  heat?: HeatPoint[];
  userLocation?: { lat: number; lon: number } | null;
  style?: ViewStyle;
  interactive?: boolean;
  onPress?: (lat: number, lon: number) => void;
  /** Kamera folgt diesem Punkt (z. B. während einer Fahrt) */
  follow?: { lat: number; lon: number } | null;
}

export const FRANKFURT = { lat: 50.1128, lon: 8.6768 };
