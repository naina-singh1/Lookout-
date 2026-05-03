// services/potholes.ts — Firestore pothole read/write
import {
  collection, addDoc, getDocs, onSnapshot,
  query, orderBy, where, doc, updateDoc, serverTimestamp,
  increment, arrayUnion,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from './firebase';
import { Pothole, Severity } from '../constants/theme';
import { getDistanceMeters } from './proximity';

/** Reports within this radius of an existing pothole will increment its
 *  confirmed count instead of creating a brand-new document. */
const DEDUP_RADIUS_M = 50;

const CACHE_KEY = 'lookout_potholes_cache';

/** Persist the latest pothole list to AsyncStorage for cold-start background task use. */
async function cachePotholes(potholes: Pothole[]) {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(potholes));
  } catch (e) {
    console.warn('[Lookout] Failed to cache potholes:', e);
  }
}

/** Mark a pothole as resolved (fixed). */
export async function resolvePothole(id: string): Promise<void> {
  await updateDoc(doc(db, 'potholes', id), {
    resolved: true,
    resolvedAt: serverTimestamp(),
    resolvedBy: auth.currentUser?.uid ?? null,
  });
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

/** Write a new pothole report to Firestore.
 *
 *  Zone-deduplication: if an existing (unresolved) pothole is found within
 *  DEDUP_RADIUS_M of the submitted coordinates, its `confirmed` count is
 *  incremented instead of creating a new document.  The same user cannot
 *  bump the count more than once on the same pothole (tracked via reporterUids).
 *
 *  Returns { merged: true, potholeId } when deduped, or
 *           { merged: false, potholeId } when a new record is created.
 */
export async function reportPothole(
  lat: number,
  lng: number,
  severity: Severity,
  location: string,
  sublocation = '',
): Promise<{ merged: boolean; potholeId: string }> {
  const uid = auth.currentUser?.uid ?? null;

  // ── 1. Fetch all active (unresolved) potholes and look for a nearby one ──
  const snapshot = await getDocs(collection(db, 'potholes'));

  let nearestId: string | null = null;
  let nearestDist = Infinity;

  for (const docSnap of snapshot.docs) {
    const d = docSnap.data();
    // Skip already-resolved potholes
    if (d.resolved === true) continue;
    if (d.lat == null || d.lng == null) continue;

    const dist = getDistanceMeters(lat, lng, d.lat as number, d.lng as number);
    if (dist > DEDUP_RADIUS_M || dist >= nearestDist) continue;

    // Prevent the same user from double-counting on the same pothole
    const reporterUids: string[] = d.reporterUids ?? [];
    if (uid && reporterUids.includes(uid)) continue;

    nearestDist = dist;
    nearestId = docSnap.id;
  }

  // ── 2a. Nearby pothole found — increment its confirmed count ──────────────
  if (nearestId) {
    await updateDoc(doc(db, 'potholes', nearestId), {
      confirmed: increment(1),
      lastReportedAt: serverTimestamp(),
      ...(uid ? { reporterUids: arrayUnion(uid) } : {}),
    });
    return { merged: true, potholeId: nearestId };
  }

  // ── 2b. No nearby pothole — create a fresh report ─────────────────────────
  const newDoc = await addDoc(collection(db, 'potholes'), {
    lat,
    lng,
    severity,
    location,
    sublocation,
    confirmed: 1,
    reportedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'anon',
    uid,
    reporterUids: uid ? [uid] : [],
    createdAt: serverTimestamp(),
    lastReportedAt: serverTimestamp(),
  });
  return { merged: false, potholeId: newDoc.id };
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
    const potholes: Pothole[] = snapshot.docs.filter(doc => !doc.data().resolved).map(doc => {
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
