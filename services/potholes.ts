// services/potholes.ts — Firestore pothole read/write
import {
  collection, addDoc, onSnapshot,
  query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Pothole, Severity } from '../constants/theme';

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
    createdAt: serverTimestamp(),
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
    callback(potholes);
  });
}
