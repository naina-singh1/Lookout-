// screens/ProfileScreen.tsx
import React from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar, Switch,
} from 'react-native';
import { C, F, R, MOCK_POTHOLES } from '../constants/theme';
import { ScreenHeader, SevBadge } from '../components/ui';

const MY_REPORTS = MOCK_POTHOLES.slice(0, 2);

export default function ProfileScreen() {
  const [drivingAlerts, setDrivingAlerts] = React.useState(true);
  const [proximityAlert, setProximityAlert] = React.useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScreenHeader title="Profile" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar + name */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>N</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.username}>naina_s</Text>
            <Text style={styles.location}>📍 Delhi</Text>
          </View>
          <View style={styles.rankBadge}>
            <Text style={styles.rankNum}>#12</Text>
            <Text style={styles.rankLabel}>City rank</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { num: '8', label: 'Reported' },
            { num: '34', label: 'Confirmed' },
            { num: '2', label: 'Fixed' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statNum}>{s.num}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Alert settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Alert Settings</Text>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Driving alerts</Text>
              <Text style={styles.settingSub}>Warn me about potholes while driving</Text>
            </View>
            <Switch
              value={drivingAlerts}
              onValueChange={setDrivingAlerts}
              trackColor={{ false: C.borderMuted, true: C.accent }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.settingRow, { borderTopWidth: 0.5, borderTopColor: C.borderSubtle, paddingTop: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Proximity warning</Text>
              <Text style={styles.settingSub}>Alert within 200m of a pothole</Text>
            </View>
            <Switch
              value={proximityAlert}
              onValueChange={setProximityAlert}
              trackColor={{ false: C.borderMuted, true: C.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* My reports */}
        <Text style={styles.sectionTitle}>My Reports</Text>
        {MY_REPORTS.map(p => (
          <View key={p.id} style={styles.reportItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.reportLocation}>{p.location}</Text>
              <Text style={styles.reportSub}>{p.time}</Text>
            </View>
            <SevBadge severity={p.severity} />
          </View>
        ))}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign Out</Text>
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
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: F.display, fontSize: 22, color: '#fff' },
  username: { fontFamily: F.display, fontSize: 16, color: C.textPrimary },
  location: { fontFamily: F.mono, fontSize: 11, color: C.textSecondary, marginTop: 3 },
  rankBadge: { alignItems: 'center' },
  rankNum: { fontFamily: F.display, fontSize: 22, color: C.accent },
  rankLabel: { fontFamily: F.mono, fontSize: 10, color: C.textMuted },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: R.card,
    borderWidth: 0.5,
    borderColor: C.borderSubtle,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statNum: { fontFamily: F.display, fontSize: 26, color: C.textPrimary },
  statLabel: { fontFamily: F.mono, fontSize: 10, color: C.textMuted },
  card: {
    backgroundColor: C.surface,
    borderRadius: R.card,
    borderWidth: 0.5,
    borderColor: C.borderSubtle,
    padding: 14,
    gap: 12,
  },
  cardTitle: { fontFamily: F.display, fontSize: 13, color: C.textSecondary },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontFamily: F.display, fontSize: 13, color: C.textPrimary },
  settingSub: { fontFamily: F.mono, fontSize: 11, color: C.textMuted, marginTop: 2 },
  sectionTitle: { fontFamily: F.display, fontSize: 13, color: C.textSecondary, marginTop: 4 },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: R.card,
    borderWidth: 0.5,
    borderColor: C.borderSubtle,
    padding: 12,
  },
  reportLocation: { fontFamily: F.display, fontSize: 14, color: C.textPrimary },
  reportSub: { fontFamily: F.mono, fontSize: 11, color: C.textMuted, marginTop: 2 },
  signOutBtn: {
    borderRadius: R.button,
    borderWidth: 0.5,
    borderColor: C.borderMuted,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  signOutText: { fontFamily: F.display, fontSize: 14, color: C.textSecondary },
});
