// screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar, Switch, ActivityIndicator, Alert,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { subscribeUserPotholes, resolvePothole } from '../services/potholes';
import { awardPoints, getUserPoints, fetchLeaderboard, rankLabel, LeaderboardEntry, POINTS } from '../services/points';
import { getAlertPrefs, setAlertPrefs } from '../services/alertPrefs';
import { setCachedAlertPrefs } from '../tasks/locationTask';
import { useLanguage } from '../contexts/LanguageContext';
import { C, F, R, Pothole } from '../constants/theme';
import { ScreenHeader, SevBadge } from '../components/ui';

export default function ProfileScreen() {
  const { t, lang, setLang } = useLanguage();
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const [myReports, setMyReports]           = useState<Pothole[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [drivingAlerts, setDrivingAlerts]   = useState(true);
  const [proximityAlert, setProximityAlert] = useState(true);
  const [points, setPoints]                 = useState(0);
  const [leaderboard, setLeaderboard]       = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading]           = useState(true);

  // Load real reports from Firestore
  useEffect(() => {
    const unsub = subscribeUserPotholes(data => {
      setMyReports(data);
      setReportsLoading(false);
    });
    return unsub;
  }, []);

  // Load points + leaderboard
  useEffect(() => {
    getUserPoints().then(setPoints);
    fetchLeaderboard().then(data => {
      setLeaderboard(data);
      setLbLoading(false);
    });
  }, [myReports]); // refresh when reports change

  // Load saved alert prefs
  useEffect(() => {
    getAlertPrefs().then(prefs => {
      setDrivingAlerts(prefs.drivingAlerts);
      setProximityAlert(prefs.proximityAlerts);
    });
  }, []);

  function handleDrivingToggle(val: boolean) {
    setDrivingAlerts(val);
    setAlertPrefs({ drivingAlerts: val });
    setCachedAlertPrefs({ drivingAlerts: val }); // keep in-memory cache in sync
  }

  function handleProximityToggle(val: boolean) {
    setProximityAlert(val);
    setAlertPrefs({ proximityAlerts: val });
    setCachedAlertPrefs({ proximityAlerts: val }); // keep in-memory cache in sync
  }

  function handleResolve(id: string, location: string) {
    Alert.alert(t.markFixed, t.fixedConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.confirmBtn,
        style: 'destructive',
        onPress: async () => {
          await resolvePothole(id);
          await awardPoints('resolve');
          const newPts = await getUserPoints();
          setPoints(newPts);
          Alert.alert(t.fixedTitle, t.fixedMsg(location) + ` (+${POINTS.RESOLVE} pts)`);
        },
      },
    ]);
  }

  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (e: any) {
      console.warn('[Lookout] Sign out error:', e.message);
    }
  }

  // Derived stats from real reports
  const totalReported = myReports.length;
  const totalConfirmed = myReports.reduce((sum, p) => sum + (p.confirmed ?? 1), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScreenHeader title={t.profile} />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Avatar + name */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarLetter}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>{displayName}</Text>
            <Text style={styles.location}>📍 {t.city}</Text>
          </View>
        </View>

        {/* Points card */}
        <View style={styles.pointsCard}>
          <View>
            <Text style={styles.pointsNum}>{points} pts</Text>
            <Text style={styles.pointsRank}>{rankLabel(points)}</Text>
          </View>
          <View style={styles.pointsHints}>
            <Text style={styles.pointsHint}>+{POINTS.REPORT} {t.perReport}</Text>
            <Text style={styles.pointsHint}>+{POINTS.RESOLVE} {t.perResolve}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { num: String(totalReported), label: t.reported },
            { num: String(totalConfirmed), label: t.confirmed },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Alert settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.alertSettings}</Text>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>{t.drivingAlerts}</Text>
              <Text style={styles.settingSub}>{t.drivingAlertsSub}</Text>
            </View>
            <Switch
              value={drivingAlerts}
              onValueChange={handleDrivingToggle}
              trackColor={{ false: C.borderMuted, true: C.accent }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.settingRow, { borderTopWidth: 0.5, borderTopColor: C.borderSubtle, paddingTop: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>{t.proximityNotifs}</Text>
              <Text style={styles.settingSub}>{t.proximityNotifsSub}</Text>
            </View>
            <Switch
              value={proximityAlert}
              onValueChange={handleProximityToggle}
              trackColor={{ false: C.borderMuted, true: C.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* My reports */}
        <Text style={styles.sectionTitle}>{t.myReports}</Text>
        {reportsLoading ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 20 }} />
        ) : myReports.length === 0 ? (
          <Text style={styles.emptyText}>{t.noReportsProfile}</Text>
        ) : (
          myReports.map(p => (
            <View key={p.id} style={styles.reportItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.reportLocation}>{p.location}</Text>
                <Text style={styles.reportSub}>{p.time}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <SevBadge severity={p.severity} />
                <TouchableOpacity
                  style={styles.fixedBtn}
                  onPress={() => handleResolve(p.id, p.location)}
                >
                  <Text style={styles.fixedBtnText}>✓ {t.markFixed}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Leaderboard */}
        <Text style={styles.sectionTitle}>{t.leaderboard}</Text>
        {lbLoading ? (
          <ActivityIndicator color={C.accent} style={{ marginTop: 12 }} />
        ) : (
          leaderboard.map((entry, i) => {
            const isMe = entry.uid === user?.uid;
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            return (
              <View key={entry.uid} style={[styles.lbItem, isMe && styles.lbItemMe]}>
                <Text style={styles.lbMedal}>{medal}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.lbName, isMe && { color: C.accent }]}>
                    {entry.displayName}{isMe ? ' (you)' : ''}
                  </Text>
                  <Text style={styles.lbSub}>{entry.reportsCount} reports · {entry.resolvedCount} resolved</Text>
                </View>
                <Text style={[styles.lbPoints, isMe && { color: C.accent }]}>{entry.points} pts</Text>
              </View>
            );
          })
        )}

        {/* Language toggle */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.language}</Text>
          <View style={styles.langRow}>
            {(['en', 'hi'] as const).map(l => (
              <TouchableOpacity
                key={l}
                style={[styles.langBtn, lang === l && styles.langBtnActive]}
                onPress={() => setLang(l)}
              >
                <Text style={[styles.langBtnText, lang === l && styles.langBtnTextActive]}>
                  {l === 'en' ? 'English' : 'हिंदी'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>{t.signOut}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 14 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: R.card,
    borderWidth: 0.5,
    borderColor: C.borderSubtle,
    padding: 16,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, color: '#fff', fontWeight: '700' },
  username: { fontSize: 16, color: C.textPrimary, fontWeight: '600' },
  location: { fontSize: 11, color: C.textSecondary, marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: C.surface,
    borderRadius: R.card, borderWidth: 0.5,
    borderColor: C.borderSubtle, padding: 14,
    alignItems: 'center', gap: 4,
  },
  statNum: { fontSize: 26, color: C.textPrimary, fontWeight: '700' },
  statLabel: { fontSize: 10, color: C.textMuted },
  card: {
    backgroundColor: C.surface, borderRadius: R.card,
    borderWidth: 0.5, borderColor: C.borderSubtle,
    padding: 14, gap: 12,
  },
  cardTitle: { fontSize: 13, color: C.textSecondary },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 13, color: C.textPrimary },
  settingSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 13, color: C.textSecondary, marginTop: 4 },
  emptyText: { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 20 },
  reportItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: R.card,
    borderWidth: 0.5, borderColor: C.borderSubtle, padding: 12,
  },
  fixedBtn: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, borderWidth: 0.5,
    borderColor: C.minor, backgroundColor: C.minorBg,
  },
  fixedBtnText: { fontSize: 10, color: C.minor, fontWeight: '600' },
  reportLocation: { fontSize: 14, color: C.textPrimary, fontWeight: '600' },
  reportSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  pointsCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: R.card,
    borderWidth: 0.5, borderColor: C.accent + '55', padding: 16,
  },
  pointsNum: { fontSize: 28, fontWeight: '800', color: C.accent },
  pointsRank: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
  pointsHints: { alignItems: 'flex-end', gap: 4 },
  pointsHint: { fontSize: 11, color: C.textMuted },
  lbItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderRadius: R.card,
    borderWidth: 0.5, borderColor: C.borderSubtle, padding: 12,
  },
  lbItemMe: { borderColor: C.accent + '88', backgroundColor: C.elevated },
  lbMedal: { fontSize: 18, width: 28, textAlign: 'center' },
  lbName: { fontSize: 13, color: C.textPrimary, fontWeight: '600' },
  lbSub: { fontSize: 10, color: C.textMuted, marginTop: 2 },
  lbPoints: { fontSize: 14, fontWeight: '700', color: C.textSecondary },
  langRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  langBtn: {
    flex: 1, paddingVertical: 10, borderRadius: R.button,
    borderWidth: 1, borderColor: C.borderMuted,
    alignItems: 'center', backgroundColor: C.elevated,
  },
  langBtnActive: { backgroundColor: C.accent, borderColor: C.accent },
  langBtnText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  langBtnTextActive: { color: '#fff' },
  signOutBtn: {
    borderRadius: R.button, borderWidth: 0.5,
    borderColor: C.borderMuted, padding: 14,
    alignItems: 'center', marginTop: 8,
  },
  signOutText: { fontSize: 14, color: C.textSecondary },
});
