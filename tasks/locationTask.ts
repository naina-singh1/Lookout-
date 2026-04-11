// tasks/locationTask.ts
// Must be imported at app root (index.ts) BEFORE registerRootComponent so the
// task is registered with TaskManager before the OS can call it.
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { Pothole } from '../constants/theme';
import { checkProximity } from '../services/proximity';
import { sendPotholeNotification } from '../services/notifications';

export const BACKGROUND_LOCATION_TASK = 'lookout-bg-location';

// ─── Foreground callback ──────────────────────────────────────────────────────
// MapScreen registers this so background updates flow into the same proximity
// engine as foreground updates (for the in-app DrivingAlert banner).
type LocationCallback = (latitude: number, longitude: number) => void;
let _callback: LocationCallback | null = null;

export function registerLocationCallback(cb: LocationCallback | null) {
  _callback = cb;
}

// ─── Background-task state ────────────────────────────────────────────────────
// Kept at module level so the background task can run the proximity engine
// even when the React UI is not mounted (app minimised or fully closed).
let _bgPotholes: Pothole[] = [];
let _bgAlertedIds: Set<string> = new Set();

/**
 * Call this from MapScreen whenever the Firestore pothole list updates,
 * so the background task always has a fresh copy to work with.
 */
export function updateBgPotholes(potholes: Pothole[]) {
  _bgPotholes = potholes;
}

// ─── Background task definition ───────────────────────────────────────────────
// Runs even when the app is minimised; on iOS it can run for ~30 s after the
// app is fully killed if the OS wakes it for a location event.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
  if (error) {
    console.warn('[Lookout BG]', error.message);
    return;
  }

  const locations: Location.LocationObject[] = data?.locations ?? [];
  const latest = locations[locations.length - 1];
  if (!latest) return;

  const { latitude, longitude } = latest.coords;

  // 1. Update the in-app DrivingAlert banner (only works when app is foregrounded)
  if (_callback) {
    _callback(latitude, longitude);
  }

  // 2. Run proximity check independently for push notifications.
  //    This fires whether the app is foregrounded, backgrounded, or closed.
  if (_bgPotholes.length === 0) return;

  const { newAlerts, updatedAlertedIds } = checkProximity(
    latitude, longitude,
    _bgPotholes,
    _bgAlertedIds,
  );
  _bgAlertedIds = updatedAlertedIds;

  // Send one OS push notification per new proximity alert
  for (const alert of newAlerts) {
    await sendPotholeNotification(
      alert.pothole.location,
      alert.pothole.severity,
      alert.distanceMeters,
    );
  }
});

// ─── Tracking lifecycle ───────────────────────────────────────────────────────

/** Start background location updates (safe to call multiple times) */
export async function startBackgroundTracking() {
  try {
    const already = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (already) return;
    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 3000,      // ms between updates
      distanceInterval: 5,     // metres of movement between updates
      showsBackgroundLocationIndicator: true,  // iOS blue status-bar pill
      foregroundService: {
        // Android persistent notification while tracking is active
        notificationTitle: 'Lookout is watching',
        notificationBody: 'Alerting you 100m before every pothole.',
        notificationColor: '#e85c3a',
      },
    });
  } catch (e) {
    console.warn('[Lookout BG] Could not start background tracking:', e);
  }
}

/** Stop background location updates */
export async function stopBackgroundTracking() {
  try {
    const running = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (running) await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  } catch (e) {
    console.warn('[Lookout BG] Could not stop background tracking:', e);
  }
}
