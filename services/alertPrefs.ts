// services/alertPrefs.ts — persist driving/proximity alert preferences
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_DRIVING   = 'lookout_driving_alerts';
const KEY_PROXIMITY = 'lookout_proximity_alerts';

export interface AlertPrefs {
  drivingAlerts: boolean;   // show in-app DrivingAlert banner
  proximityAlerts: boolean; // fire OS push notification
}

/** Load prefs from AsyncStorage (defaults to both on). */
export async function getAlertPrefs(): Promise<AlertPrefs> {
  const [driving, proximity] = await Promise.all([
    AsyncStorage.getItem(KEY_DRIVING),
    AsyncStorage.getItem(KEY_PROXIMITY),
  ]);
  return {
    drivingAlerts:   driving   !== 'false',
    proximityAlerts: proximity !== 'false',
  };
}

/** Persist one or both prefs. */
export async function setAlertPrefs(prefs: Partial<AlertPrefs>): Promise<void> {
  const ops: Promise<void>[] = [];
  if (prefs.drivingAlerts   !== undefined) ops.push(AsyncStorage.setItem(KEY_DRIVING,   String(prefs.drivingAlerts)));
  if (prefs.proximityAlerts !== undefined) ops.push(AsyncStorage.setItem(KEY_PROXIMITY, String(prefs.proximityAlerts)));
  await Promise.all(ops);
}
