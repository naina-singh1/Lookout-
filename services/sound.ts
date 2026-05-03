// services/sound.ts — sound + vibration alerts for Lookout
import { Audio } from 'expo-av';
import { Vibration, Platform } from 'react-native';
import { Severity } from '../constants/theme';

// Vibration patterns per severity (ms: wait, vibrate, wait, vibrate...)
const VIBRATION_PATTERNS: Record<Severity, number[]> = {
  severe:   [0, 300, 100, 300, 100, 300],
  moderate: [0, 200, 100, 200],
  minor:    [0, 150],
};

let soundObject: Audio.Sound | null = null;

/** Load the alert sound once and reuse it. */
async function getSound(): Promise<Audio.Sound | null> {
  try {
    if (soundObject) return soundObject;
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,    // don't lower volume when other audio plays
      playThroughEarpieceAndroid: false, // use speaker, not earpiece
    });
    const { sound } = await Audio.Sound.createAsync(
      require('../assets/alert.mp3'),
      { volume: 1.0 },
    );
    soundObject = sound;
    return sound;
  } catch (e) {
    console.warn('[Lookout] Could not load alert sound:', JSON.stringify(e));
    return null;
  }
}

// Number of beeps per severity
const BEEP_COUNTS: Record<Severity, number> = {
  severe:   3,
  moderate: 2,
  minor:    1,
};

/** Play a single beep. */
async function playBeep(sound: Audio.Sound): Promise<void> {
  await sound.setPositionAsync(0);
  await sound.setVolumeAsync(1.0);
  await sound.playAsync();
  // Each beep lasts ~600ms
  await new Promise(resolve => setTimeout(resolve, 600));
  try { await sound.stopAsync(); } catch {}
}

/** Play alert sound + vibration for a given severity. */
export async function playProximityAlert(severity: Severity): Promise<void> {
  // Vibration (works on both platforms)
  Vibration.vibrate(VIBRATION_PATTERNS[severity]);

  // Sound — play N beeps based on severity
  try {
    const sound = await getSound();
    if (!sound) return;
    const beeps = BEEP_COUNTS[severity];
    for (let i = 0; i < beeps; i++) {
      await playBeep(sound);
      if (i < beeps - 1) {
        // Short gap between beeps
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  } catch (e) {
    console.warn('[Lookout] Could not play alert sound:', JSON.stringify(e));
  }
}

/** Release the sound object (call on app unmount if needed). */
export async function unloadSound(): Promise<void> {
  if (soundObject) {
    await soundObject.unloadAsync();
    soundObject = null;
  }
}
