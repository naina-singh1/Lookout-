// screens/RouteScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { C, F, R, MOCK_POTHOLES } from '../constants/theme';
import { ScreenHeader, SevBadge } from '../components/ui';

export default function RouteScreen() {
  const [destination, setDestination] = useState('');
  const [searched, setSearched] = useState(false);

  const severeCount = MOCK_POTHOLES.filter(p => p.severity === 'severe').length;
  const moderateCount = MOCK_POTHOLES.filter(p => p.severity === 'moderate').length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScreenHeader title="Route Planner" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchLabel}>Destination</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Where to?"
              placeholderTextColor={C.textFaint}
              value={destination}
              onChangeText={setDestination}
            />
            <TouchableOpacity
              style={styles.goBtn}
              onPress={() => destination && setSearched(true)}
            >
              <Text style={styles.goBtnText}>Go</Text>
            </TouchableOpacity>
          </View>
        </View>

        {searched ? (
          <>
            {/* Warning banner */}
            {severeCount > 0 && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.warningTitle}>
                    {severeCount} severe pothole{severeCount > 1 ? 's' : ''} on this route
                  </Text>
                  <Text style={styles.warningSub}>Consider an alternate route</Text>
                </View>
              </View>
            )}

            {/* Route summary */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Route Summary</Text>
              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{MOCK_POTHOLES.length}</Text>
                  <Text style={styles.statLabel}>Total potholes</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statNum, { color: C.severe }]}>{severeCount}</Text>
                  <Text style={styles.statLabel}>Severe</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statNum, { color: C.moderate }]}>{moderateCount}</Text>
                  <Text style={styles.statLabel}>Moderate</Text>
                </View>
              </View>
            </View>

            {/* Potholes on route */}
            <Text style={styles.sectionTitle}>Potholes on Route</Text>
            {MOCK_POTHOLES.map(p => (
              <View key={p.id} style={styles.routeItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLocation}>{p.location}</Text>
                  <Text style={styles.routeSub}>{p.sublocation}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <SevBadge severity={p.severity} />
                  <Text style={styles.routeDist}>{p.distance}</Text>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🛣</Text>
            <Text style={styles.emptyText}>Enter a destination</Text>
            <Text style={styles.emptySub}>We'll warn you about potholes on the way</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 14 },
  searchBox: {
    backgroundColor: C.surface,
    borderRadius: R.card,
    borderWidth: 0.5,
    borderColor: C.borderSubtle,
    padding: 14,
    gap: 8,
  },
  searchLabel: {
    fontFamily: F.mono,
    fontSize: 10,
    color: C.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1,
    backgroundColor: C.elevated,
    borderRadius: R.button,
    borderWidth: 0.5,
    borderColor: C.borderMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: F.body,
    fontSize: 14,
    color: C.textPrimary,
  },
  goBtn: {
    backgroundColor: C.accent,
    borderRadius: R.button,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  goBtnText: { fontFamily: F.display, color: '#fff', fontSize: 14 },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.severeBg,
    borderRadius: R.card,
    borderWidth: 0.5,
    borderColor: C.severe,
    padding: 14,
  },
  warningIcon: { fontSize: 24 },
  warningTitle: { fontFamily: F.display, fontSize: 13, color: C.severe },
  warningSub: { fontFamily: F.mono, fontSize: 11, color: C.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: C.surface,
    borderRadius: R.card,
    borderWidth: 0.5,
    borderColor: C.borderSubtle,
    padding: 14,
  },
  cardTitle: { fontFamily: F.display, fontSize: 13, color: C.textSecondary, marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 4 },
  statNum: { fontFamily: F.display, fontSize: 28, color: C.textPrimary },
  statLabel: { fontFamily: F.mono, fontSize: 11, color: C.textMuted },
  sectionTitle: { fontFamily: F.display, fontSize: 13, color: C.textSecondary, marginTop: 4 },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: R.card,
    borderWidth: 0.5,
    borderColor: C.borderSubtle,
    padding: 12,
  },
  routeLocation: { fontFamily: F.display, fontSize: 14, color: C.textPrimary },
  routeSub: { fontFamily: F.mono, fontSize: 11, color: C.textSecondary, marginTop: 2 },
  routeDist: { fontFamily: F.mono, fontSize: 11, color: C.accent },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontFamily: F.display, fontSize: 16, color: C.textSecondary },
  emptySub: { fontFamily: F.mono, fontSize: 12, color: C.textMuted, textAlign: 'center' },
});
