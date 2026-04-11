// services/notifications.ts — push notification helpers for Lookout
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Severity } from '../constants/theme';

// Configure how notifications appear when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Request OS permission for local notifications. Returns true if granted. */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Fire a test notification to verify the system is working. */
export async function sendTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '✅ Lookout notifications working!',
      body: 'You will be alerted 100m before every pothole.',
      sound: true,
      ...(Platform.OS === 'android' && { channelId: 'pothole-alerts' }),
    },
    trigger: null,
  });
}

/** Fire an immediate local notification for a pothole proximity alert. */
export async function sendPotholeNotification(
  location: string,
  severity: Severity,
  distanceMeters: number,
): Promise<void> {
  const distText = distanceMeters < 1000
    ? `${Math.round(distanceMeters)}m`
    : `${(distanceMeters / 1000).toFixed(1)}km`;

  const icon =
    severity === 'severe'   ? '🚨' :
    severity === 'moderate' ? '⚠️' : '⚡';

  const urgency =
    distanceMeters <= 30  ? 'SLOW DOWN NOW' :
    distanceMeters <= 60  ? 'Slow down ahead' :
                            'Pothole ahead';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${icon} ${urgency}`,
      body: `${severity.charAt(0).toUpperCase() + severity.slice(1)} pothole — ${location} · ${distText} away`,
      sound: true,
      // Android channel (must match the channel registered below)
      ...(Platform.OS === 'android' && { channelId: 'pothole-alerts' }),
    },
    trigger: null, // fire immediately
  });
}

/** Create the Android notification channel (call once at app startup). */
export async function setupAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('pothole-alerts', {
    name: 'Pothole Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 150, 250],
    lightColor: '#e85c3a',
  });
}
