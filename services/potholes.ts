// services/potholes.ts — Firestore pothole read/write
import {
  collection, addDoc, onSnapshot,
  query, orderBy, where, serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from './firebase';
import { Pothole, Severity } from '../constants/theme';

const CACHE_KEY = 'lookout_potholes_cache';

/** Persist the latest pothole list to AsyncStorage for cold-start background task use. */
async function cachePotholes(potholes: Pothole[]) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(potholes));
  } catch (e) {
    console.warn('[Lookout] Failed to cache potholes:', e);
  }
}

/** Load the last cached pothole list (used by background task on cold start). */
export async function loadCachedPotholes(): Promise<Pothole[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/** Write a new pothole report to Firestore */
export async function reportPothole(
  lat: number,
  lng: number,
  severity: Severity,
  location: string,
  sublocation = '',
) {
  return addDoc(collection(db, 'potholes'), {
    lat,
    lng,
    severity,
    location,
    sublocation,
    confirmed: 1,
    reportedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'anon',
    uid: auth.currentUser?.uid ?? null,
    createdAt: serverTimestamp(),
  });
}

/** Subscribe to potholes reported by the current user, newest first.
 *  Matches on uid (new reports) OR reportedBy name (older reports without uid).
 *  Sorting is done client-side to avoid needing a Firestore composite index.
 */
export function subscribeUserPotholes(callback: (potholes: Pothole[]) => void) {
  const uid = auth.currentUser?.uid;
  const reportedBy = auth.currentUser?.displayName || auth.currentUser?.email || null;
  if (!uid) { callback([]); return () => {}; }

  // Query all potholes and filter client-side — avoids composite index requirement
  const q = query(collection(db, 'potholes'));
  return onSnapshot(q, snapshot => {
    const now = new Date();
    const potholes: Pothole[] = snapshot.docs
      .map(doc => ({ _data: doc.data(), id: doc.id }))
      .filter(({ _data: d }) =>
        d.uid === uid || (reportedBy && d.reportedBy === reportedBy)
      )
      .map(({ _data: d, id }) => {
        const createdAt: Date = d.createdAt?.toDate?.() ?? now;
        const diffMins = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
        const time =
          diffMins < 1  ? 'just now' :
          diffMins < 60 ? `${diffMins}m ago` :
          `${Math.floor(diffMins / 60)}h ago`;
        return {
          id,
          lat: d.lat ?? 0,
          lng: d.lng ?? 0,
          severity: (d.severity ?? 'minor') as Severity,
          location: d.location ?? 'Unknown location',
          sublocation: d.sublocation ?? '',
          confirmed: d.confirmed ?? 1,
          distance: '—',
          reportedBy: d.reportedBy ?? 'anon',
          time,
          _createdAt: d.createdAt?.toDate?.() ?? now,
        };
      })
      .sort((a: any, b: any) => b._createdAt - a._createdAt)
      .map(({ _createdAt, ...p }: any) => p);

    callback(potholes);
  });
}

/** Subscribe to all potholes, newest first. Returns an unsubscribe function. */
export function subscribePotholes(callback: (potholes: Pothole[]) => void) {
  const q = query(collection(db, 'potholes'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, snapshot => {
    const now = new Date();
    const potholes: Pothole[] = snapshot.docs.map(doc => {
      const d = doc.data();
      const createdAt: Date = d.createdAt?.toDate?.() ?? now;
      const diffMins = Math.floor((now.getTime() - createdAt.getTime()) / 60000);
      const time =
        diffMins < 1 ? 'just now' :
        diffMins < 60 ? `${diffMins}m ago` :
        `${Math.floor(diffMins / 60)}h ago`;
      return {
        id: doc.id,
        lat: d.lat ?? 0,
        lng: d.lng ?? 0,
        severity: (d.severity ?? 'minor') as Severity,
        location: d.location ?? 'Unknown location',
        sublocation: d.sublocation ?? '',
        confirmed: d.confirmed ?? 1,
        distance: '—',
        reportedBy: d.reportedBy ?? 'anon',
        time,
      };
    });
    cachePotholes(potholes); // keep cache fresh for cold-start background task
    callback(potholes);
  });
}
