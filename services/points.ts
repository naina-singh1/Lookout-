// services/points.ts — points + leaderboard for Lookout
import {
  doc, getDoc, setDoc, updateDoc, increment,
  collection, query, orderBy, limit, getDocs,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export const POINTS = {
  REPORT:  10,
  RESOLVE: 15,
};

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  points: number;
  reportsCount: number;
  resolvedCount: number;
}

/** Ensure a user document exists, then add points. */
export async function awardPoints(
  type: 'report' | 'resolve',
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const pts = type === 'report' ? POINTS.REPORT : POINTS.RESOLVE;

  if (!snap.exists()) {
    // First time — create the document
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      points: pts,
      reportsCount:  type === 'report'  ? 1 : 0,
      resolvedCount: type === 'resolve' ? 1 : 0,
    });
  } else {
    await updateDoc(ref, {
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      points:        increment(pts),
      reportsCount:  type === 'report'  ? increment(1) : increment(0),
      resolvedCount: type === 'resolve' ? increment(1) : increment(0),
    });
  }
}

/** Get the current user's points (0 if no document yet). */
export async function getUserPoints(): Promise<number> {
  const user = auth.currentUser;
  if (!user) return 0;
  const snap = await getDoc(doc(db, 'users', user.uid));
  return snap.exists() ? (snap.data().points ?? 0) : 0;
}

/** Fetch the top 10 users by points. */
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, 'users'),
    orderBy('points', 'desc'),
    limit(10),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    uid:           d.id,
    displayName:   d.data().displayName ?? 'User',
    points:        d.data().points ?? 0,
    reportsCount:  d.data().reportsCount ?? 0,
    resolvedCount: d.data().resolvedCount ?? 0,
  }));
}

/** Rank label based on points. */
export function rankLabel(points: number): string {
  if (points >= 500) return '🏆 Asphalt Hero';
  if (points >= 300) return '⚡ Road Warrior';
  if (points >= 150) return '🛡 Street Guardian';
  if (points >= 50)  return '🔍 Pothole Spotter';
  return '🌱 Road Rookie';
}
