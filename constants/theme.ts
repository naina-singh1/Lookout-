// Lookout Design System — constants/theme.ts

export const C = {
  bg: '#0e0e12',
  surface: '#1c1c28',
  elevated: '#252538',
  tray: '#13131c',
  borderSubtle: '#222232',
  borderMuted: '#2a2a3c',
  accent: '#e85c3a',
  severe: '#e85c3a',
  severeBg: '#2a1010',
  moderate: '#c97b30',
  moderateBg: '#2a1e0a',
  minor: '#6abf40',
  minorBg: '#1a2a14',
  textPrimary: '#ffffff',
  textSecondary: '#888888',
  textMuted: '#444444',
  textFaint: '#333333',
};

export const F = {
  display: undefined,
  body: undefined,
  mono: undefined,
};

export const R = {
  card: 12,
  button: 8,
  pill: 20,
  phone: 30,
};

export type Severity = 'severe' | 'moderate' | 'minor';

export function severityColor(s: Severity) {
  return s === 'severe' ? C.severe : s === 'moderate' ? C.moderate : C.minor;
}

export function severityBg(s: Severity) {
  return s === 'severe' ? C.severeBg : s === 'moderate' ? C.moderateBg : C.minorBg;
}

export interface Pothole {
  id: string;
  location: string;
  sublocation: string;
  severity: Severity;
  confirmed: number;
  distance: string;
  reportedBy: string;
  time: string;
  lat: number;
  lng: number;
}

export const MOCK_POTHOLES: Pothole[] = [
  { id: '1', location: 'MG Road', sublocation: 'Signal 4', severity: 'severe', confirmed: 14, distance: '120m', reportedBy: 'rahul_k', time: '2m ago', lat: 12.9716, lng: 77.5946 },
  { id: '2', location: 'Indiranagar 12th Main', sublocation: 'Near CMH Rd junction', severity: 'moderate', confirmed: 7, distance: '340m', reportedBy: 'priya_m', time: '18m ago', lat: 12.9784, lng: 77.6408 },
  { id: '3', location: 'Old Airport Rd', sublocation: 'Domlur flyover', severity: 'minor', confirmed: 3, distance: '1.2km', reportedBy: 'anon', time: '1h ago', lat: 12.9599, lng: 77.6387 },
  { id: '4', location: 'Koramangala 80ft Rd', sublocation: 'Near Forum Mall', severity: 'severe', confirmed: 21, distance: '2.1km', reportedBy: 'vikram_s', time: '3h ago', lat: 12.9352, lng: 77.6245 },
  { id: '5', location: 'Hosur Road', sublocation: 'Electronic City flyover', severity: 'moderate', confirmed: 9, distance: '4.5km', reportedBy: 'deepa_r', time: '5h ago', lat: 12.8458, lng: 77.6603 },
];