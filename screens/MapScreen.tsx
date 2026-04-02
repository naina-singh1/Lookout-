// screens/MapScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native';
import { C, F, R, MOCK_POTHOLES } from '../constants/theme';
import { ScreenHeader, PotholeCard, DrivingAlert } from '../components/ui';

export default function MapScreen() {
  const [alertVisible, setAlertVisible] = useState(true);
  const [driving, setDriving] = useState(true);
  const nearby = MOCK_POTHOLES.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScreenHeader title="Bengaluru" subtitle="48 km/h · 3 nearby" />

      {/* Map placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapEmoji}>🗺</Text>
        <Text style={styles.mapLabel}>Map View</Text>
        <Text style={styles.mapSub}>react-native-maps goes here</Text>

        {/* Fake pins */}
        {nearby.map((p, i) => (
          <View key={p.id} style={[styles.pin, {
            top: 60 + i * 55,
            left: 80 + i * 70,
            backgroundColor: p.severity === 'severe' ? C.severe : p.severity === 'moderate' ? C.moderate : C.minor,
          }]}>
            <Text style={styles.pinText}>!</Text>
          </View>
        ))}

        {/* FAB */}
        <TouchableOpacity style={styles.fab}>
          <Text style={styles.fabText}>+ Report</Text>
        </TouchableOpacity>
      </View>

      {/* Driving alert */}
      {driving && alertVisible && (
        <DrivingAlert
          location="MG Road · Signal 4"
          severity="severe"
          distance="120m"
          onDismiss={() => setAlertVisible(false)}
        />
      )}

      {/* Bottom tray */}
      <View style={styles.tray}>
        <View style={styles.trayHandle} />
        <Text style={styles.trayTitle}>Nearby Potholes</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {nearby.map(p => (
            <PotholeCard key={p.id} {...p} />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#111118',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mapEmoji: { fontSize: 48, opacity: 0.15 },
  mapLabel: { fontFamily: F.display, fontSize: 16, color: C.textMuted, marginTop: 8 },
  mapSub: { fontFamily: F.mono, fontSize: 11, color: C.textFaint, marginTop: 4 },
  pin: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.bg,
  },
  pinText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: C.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: R.pill,
  },
  fabText: { fontFamily: F.display, color: '#fff', fontSize: 14 },
  tray: {
    backgroundColor: C.tray,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 0.5,
    borderColor: C.borderSubtle,
    padding: 16,
    maxHeight: 280,
  },
  trayHandle: {
    width: 36,
    height: 4,
    backgroundColor: C.borderMuted,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 14,
  },
  trayTitle: {
    fontFamily: F.display,
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
});
