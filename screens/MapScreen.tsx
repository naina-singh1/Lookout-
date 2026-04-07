// screens/MapScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Modal, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { C, F, R, Pothole, Severity, severityColor } from '../constants/theme';
import { ScreenHeader, PotholeCard, DrivingAlert } from '../components/ui';
import { reportPothole, subscribePotholes } from '../services/potholes';

const SEVERITY_OPTIONS: { label: string; value: Severity; color: string }[] = [
  { label: '🔴 Severe', value: 'severe', color: C.severe },
  { label: '🟠 Moderate', value: 'moderate', color: C.moderate },
  { label: '🟢 Minor', value: 'minor', color: C.minor },
];

const BENGALURU = { latitude: 12.9716, longitude: 77.5946, latitudeDelta: 0.08, longitudeDelta: 0.08 };

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [potholes, setPotholes] = useState<Pothole[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [reportModal, setReportModal] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<Severity>('moderate');
  const [reporting, setReporting] = useState(false);
  const [alertVisible, setAlertVisible] = useState(true);
  const nearby = potholes.slice(0, 5);

  // Get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 800);
      setLocationLoading(false);
    })();
  }, []);

  // Subscribe to Firestore potholes
  useEffect(() => {
    const unsub = subscribePotholes(setPotholes);
    return unsub;
  }, []);

  async function handleReport() {
    if (!userLocation) {
      Alert.alert('Location needed', 'Enable location access to report a pothole at your position.');
      return;
    }
    setReporting(true);
    try {
      // Reverse geocode for a human-readable location name
      const [place] = await Location.reverseGeocodeAsync(userLocation);
      const location = place
        ? [place.street, place.district || place.subregion].filter(Boolean).join(', ') || place.city || 'Unknown road'
        : 'Unknown road';
      const sublocation = place?.city || place?.region || '';
      await reportPothole(userLocation.latitude, userLocation.longitude, selectedSeverity, location, sublocation);
      setReportModal(false);
      Alert.alert('Reported!', `${selectedSeverity.charAt(0).toUpperCase() + selectedSeverity.slice(1)} pothole logged at ${location}.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setReporting(false);
    }
  }

  const severePothole = nearby.find(p => p.severity === 'severe');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScreenHeader title="Bengaluru" subtitle={`${nearby.length} nearby`} />

      {/* Google Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={BENGALURU}
          showsUserLocation
          showsMyLocationButton={false}
          customMapStyle={darkMapStyle}
        >
          {potholes.map(p => (
            <Marker
              key={p.id}
              coordinate={{ latitude: p.lat, longitude: p.lng }}
              title={p.location}
              description={`${p.severity} · ${p.confirmed} confirmed`}
              pinColor={severityColor(p.severity)}
            />
          ))}
        </MapView>

        {locationLoading && (
          <View style={styles.locLoading}>
            <ActivityIndicator color={C.accent} />
          </View>
        )}

        {/* My location button */}
        <TouchableOpacity
          style={styles.myLocBtn}
          onPress={() => {
            if (userLocation) {
              mapRef.current?.animateToRegion({ ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
            }
          }}
        >
          <Text style={{ fontSize: 18 }}>📍</Text>
        </TouchableOpacity>

        {/* Report FAB */}
        <TouchableOpacity style={styles.fab} onPress={() => setReportModal(true)}>
          <Text style={styles.fabText}>+ Report</Text>
        </TouchableOpacity>
      </View>

      {/* Driving alert for nearest severe pothole */}
      {severePothole && alertVisible && (
        <DrivingAlert
          location={severePothole.location}
          severity="severe"
          distance={severePothole.distance}
          onDismiss={() => setAlertVisible(false)}
        />
      )}

      {/* Bottom tray */}
      <View style={styles.tray}>
        <View style={styles.trayHandle} />
        <Text style={styles.trayTitle}>Nearby Potholes</Text>
        {potholes.length === 0 ? (
          <Text style={styles.emptyText}>No potholes reported yet — be the first!</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {nearby.map(p => <PotholeCard key={p.id} {...p} />)}
          </ScrollView>
        )}
      </View>

      {/* Report severity modal */}
      <Modal visible={reportModal} transparent animationType="slide" onRequestClose={() => setReportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.trayHandle} />
            <Text style={styles.modalTitle}>Report a Pothole</Text>
            <Text style={styles.modalSub}>at your current location</Text>

            <View style={styles.severityRow}>
              {SEVERITY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.sevBtn, selectedSeverity === opt.value && { borderColor: opt.color, backgroundColor: opt.color + '22' }]}
                  onPress={() => setSelectedSeverity(opt.value)}
                >
                  <Text style={[styles.sevBtnText, selectedSeverity === opt.value && { color: opt.color }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, reporting && { opacity: 0.6 }]}
              onPress={handleReport}
              disabled={reporting}
            >
              {reporting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitBtnText}>Submit Report</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setReportModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  mapContainer: { flex: 1, position: 'relative' },
  locLoading: {
    position: 'absolute', top: 16, alignSelf: 'center',
    backgroundColor: C.surface, borderRadius: R.pill,
    padding: 10, borderWidth: 0.5, borderColor: C.borderSubtle,
  },
  myLocBtn: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: C.surface, borderRadius: R.card,
    padding: 10, borderWidth: 0.5, borderColor: C.borderSubtle,
  },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    backgroundColor: C.accent, paddingHorizontal: 20,
    paddingVertical: 12, borderRadius: R.pill,
    shadowColor: C.accent, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tray: {
    backgroundColor: C.tray, borderTopLeftRadius: 20,
    borderTopRightRadius: 20, borderTopWidth: 0.5,
    borderColor: C.borderSubtle, padding: 16, maxHeight: 280,
  },
  trayHandle: {
    width: 36, height: 4, backgroundColor: C.borderMuted,
    borderRadius: 2, alignSelf: 'center', marginBottom: 14,
  },
  trayTitle: {
    fontSize: 13, color: C.textSecondary,
    marginBottom: 12, letterSpacing: 0.5,
  },
  emptyText: { color: C.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: C.surface, borderTopLeftRadius: 24,
    borderTopRightRadius: 24, padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: C.textPrimary, textAlign: 'center', marginBottom: 4 },
  modalSub: { fontSize: 13, color: C.textSecondary, textAlign: 'center', marginBottom: 24 },
  severityRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  sevBtn: {
    flex: 1, paddingVertical: 12, borderRadius: R.card,
    borderWidth: 1.5, borderColor: C.borderMuted,
    alignItems: 'center', backgroundColor: C.elevated,
  },
  sevBtnText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
  submitBtn: {
    backgroundColor: C.accent, borderRadius: R.button,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  cancelText: { color: C.textMuted, fontSize: 14 },
});

// Dark map style matching app theme
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2c2c3e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3a55' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#57698a' }] },
];
