// screens/ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar, Switch, ActivityIndicator,
} from 'react-native';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { subscribeUserPotholes } from '../services/potholes';
import { getAlertPrefs, setAlertPrefs } from '../services/alertPrefs';
import { useLanguage } from '../contexts/LanguageContext';
import { C, F, R, Pothole } from '../constants/theme';
import { ScreenHeader, SevBadge } from '../components/ui';

export default function ProfileScreen() {
  const { t, lang, setLang } = useLanguage();
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const [myReports, setMyReports]       = useState<Pothole[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [drivingAlerts, setDrivingAlerts]   = useState(true);
  const [proximityAlert, setProximityAlert] = useState(true);

  // Load real reports from Firestore
  useEffect(() => {
    const unsub = subscribeUserPotholes(data => {
      setMyReports(data);
      setReportsLoading(false);
    });
    return unsub;
  }, []);

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
  }

  function handleProximityToggle(val: boolean) {
    setProximityAlert(val);
    setAlertPrefs({ proximityAlerts: val });
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
              <SevBadge severity={p.severity} />
            </View>
          ))
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
  reportLocation: { fontSize: 14, color: C.textPrimary, fontWeight: '600' },
  reportSub: { fontSize: 11, color: C.textMuted, marginTop: 2 },
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
