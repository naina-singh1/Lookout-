// services/proximity.ts — 100m pothole proximity alert engine
import { Pothole, Severity } from '../constants/theme';

/** Haversine formula — returns distance in metres between two GPS points */
export function getDistanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => d * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Human-readable distance string */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

export interface ProximityAlert {
  pothole: Pothole;
  distanceMeters: number;
}

const ALERT_THRESHOLD_M = 100;   // fire alert when within this distance
const CLEAR_THRESHOLD_M  = 160;  // remove from "alerted" set once this far away again

/**
 * Given the user's current position, a list of potholes, and a Set of already-alerted
 * pothole IDs, returns:
 *   - `newAlerts`  – potholes that just crossed the 100m threshold (not yet alerted)
 *   - `updatedAlertedIds` – revised Set after clearing potholes the user has passed
 */
export function checkProximity(
  userLat: number,
  userLng: number,
  potholes: Pothole[],
  alertedIds: Set<string>,
): {
  newAlerts: ProximityAlert[];
  updatedAlertedIds: Set<string>;
} {
  const newAlerts: ProximityAlert[] = [];
  const updatedAlertedIds = new Set(alertedIds);

  // 1. Clear IDs for potholes the user has moved away from (>160m)
  for (const id of updatedAlertedIds) {
    const p = potholes.find(x => x.id === id);
    if (!p) { updatedAlertedIds.delete(id); continue; }
    const d = getDistanceMeters(userLat, userLng, p.lat, p.lng);
    if (d > CLEAR_THRESHOLD_M) updatedAlertedIds.delete(id);
  }

  // 2. Find potholes newly within 100m
  for (const p of potholes) {
    if (updatedAlertedIds.has(p.id)) continue;
    const d = getDistanceMeters(userLat, userLng, p.lat, p.lng);
    if (d <= ALERT_THRESHOLD_M) {
      newAlerts.push({ pothole: p, distanceMeters: d });
      updatedAlertedIds.add(p.id);
    }
  }

  // Sort: severe first, then by distance
  newAlerts.sort((a, b) => {
    const sevOrder: Record<Severity, number> = { severe: 0, moderate: 1, minor: 2 };
    const sevDiff = sevOrder[a.pothole.severity] - sevOrder[b.pothole.severity];
    return sevDiff !== 0 ? sevDiff : a.distanceMeters - b.distanceMeters;
  });

  return { newAlerts, updatedAlertedIds };
}
