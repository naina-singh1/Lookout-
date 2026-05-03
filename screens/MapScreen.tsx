// screens/MapScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar, Modal, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { C, R, Pothole, Severity, severityColor } from '../constants/theme';
import { ScreenHeader, PotholeCard, DrivingAlert } from '../components/ui';
import { reportPothole, subscribePotholes } from '../services/potholes';
import { checkProximity, getDistanceMeters, formatDistance, ProximityAlert } from '../services/proximity';
import {
  startBackgroundTracking, stopBackgroundTracking, registerLocationCallback,
  updateBgPotholes, refreshCachedAlertPrefs,
} from '../tasks/locationTask';
import {
  requestNotificationPermission, setupAndroidNotificationChannel,
} from '../services/notifications';
import { getAlertPrefs } from '../services/alertPrefs';
import { playProximityAlert } from '../services/sound';
import { awardPoints, POINTS } from '../services/points';
import { useLanguage } from '../contexts/LanguageContext';

const SEVERITY_OPTIONS: { label: string; value: Severity; color: string }[] = [
  { label: '🔴 Severe',   value: 'severe',   color: C.severe },
  { label: '🟠 Moderate', value: 'moderate', color: C.moderate },
  { label: '🟢 Minor',    value: 'minor',    color: C.minor },
];

const DELHI = { latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.08, longitudeDelta: 0.08 };

export default function MapScreen() {
  const { t } = useLanguage();
  const mapRef = useRef<MapView>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const alertedIdsRef = useRef<Set<string>>(new Set());
  const potholesRef = useRef<Pothole[]>([]);
  const userLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);

  const [potholes, setPotholes]           = useState<Pothole[]>([]);
  const [userLocation, setUserLocation]   = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [reportModal, setReportModal]     = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<Severity>('moderate');
  const [reporting, setReporting]         = useState(false);

  // Alert queue — active (showing) + pending (waiting)
  const [activeAlert, setActiveAlert]     = useState<ProximityAlert | null>(null);
  const [alertQueue, setAlertQueue]       = useState<ProximityAlert[]>([]);

  // Keep refs / background-task state in sync whenever the pothole list changes.
  // Also re-run proximity check so newly logged potholes (by anyone) alert immediately.
  useEffect(() => {
    potholesRef.current = potholes;
    updateBgPotholes(potholes);

    const loc = userLocationRef.current;
    if (!loc || potholes.length === 0) return;

    const { newAlerts, updatedAlertedIds } = checkProximity(
      loc.latitude, loc.longitude,
      potholes,
      alertedIdsRef.current,
    );
    alertedIdsRef.current = updatedAlertedIds;
    if (newAlerts.length > 0) {
      getAlertPrefs().then(({ drivingAlerts }) => {
        if (drivingAlerts) {
          enqueueAlerts(newAlerts);
          playProximityAlert(newAlerts[0].pothole.severity);
        }
      });
    }
  }, [potholes, enqueueAlerts]);

  // Push new alerts into the queue
  const enqueueAlerts = useCallback((alerts: ProximityAlert[]) => {
    if (alerts.length === 0) return;
    setActiveAlert(prev => {
      if (prev) {
        setAlertQueue(q => [...q, ...alerts]);
        return prev;
      }
      // Show the first one immediately, queue the rest
      if (alerts.length > 1) setAlertQueue(alerts.slice(1));
      return alerts[0];
    });
  }, []);

  // Dismiss active alert and pop the next one from queue
  const dismissAlert = useCallback(() => {
    setAlertQueue(q => {
      const [next, ...rest] = q;
      setActiveAlert(next ?? null);
      return rest;
    });
  }, []);

  // Shared handler — called by both foreground watcher and background task
  const handleLocationUpdate = useCallback(async (latitude: number, longitude: number) => {
    const coords = { latitude, longitude };
    setUserLocation(coords);
    userLocationRef.current = coords;
    const { newAlerts, updatedAlertedIds } = checkProximity(
      latitude, longitude,
      potholesRef.current,
      alertedIdsRef.current,
    );
    alertedIdsRef.current = updatedAlertedIds;
    if (newAlerts.length > 0) {
      const { drivingAlerts } = await getAlertPrefs();
      if (drivingAlerts) {
        enqueueAlerts(newAlerts);
        // Play sound + vibration for the most severe alert
        playProximityAlert(newAlerts[0].pothole.severity);
      }
    }
  }, [enqueueAlerts]);

  // Request permissions, start foreground watcher + background task
  useEffect(() => {
    (async () => {
      // 1. Foreground location permission (required first)
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') { setLocationLoading(false); return; }

      // 2. Show map immediately using last known position
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        const coords = { latitude: last.coords.latitude, longitude: last.coords.longitude };
        setUserLocation(coords);
        mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 800);
        setLocationLoading(false);
      }

      // 3. Refine with a fresh GPS fix
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: initial.coords.latitude, longitude: initial.coords.longitude };
      setUserLocation(coords);
      mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 800);
      setLocationLoading(false);

      // 4. Foreground watcher (handles updates while app is open)
      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 3000, distanceInterval: 5 },
        loc => handleLocationUpdate(loc.coords.latitude, loc.coords.longitude),
      );

      // 5. Ask for background + notification permissions after map is loaded
      try {
        await setupAndroidNotificationChannel();
        await requestNotificationPermission();
        // Pre-load alert prefs into the in-memory cache so the background
        // location task never has to hit AsyncStorage in its hot path.
        await refreshCachedAlertPrefs();
      } catch (e) {
        console.warn('[Lookout] Notification setup failed:', e);
      }

      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus === 'granted') {
        registerLocationCallback(handleLocationUpdate);
        await startBackgroundTracking();
      }
    })();

    return () => {
      locationSub.current?.remove();
      registerLocationCallback(null);   // unregister when screen unmounts
      stopBackgroundTracking();
    };
  }, [enqueueAlerts, handleLocationUpdate]);

  // Subscribe to Firestore potholes
  useEffect(() => {
    const unsub = subscribePotholes(setPotholes);
    return unsub;
  }, []);


  async function handleReport() {
    if (!userLocation) {
      Alert.alert(t.locationNeeded, t.locationNeededMsg);
      return;
    }
    setReporting(true);
    try {
      const [place] = await Location.reverseGeocodeAsync(userLocation);
      const location = place
        ? [place.street, place.district || place.subregion].filter(Boolean).join(', ') || place.city || 'Unknown road'
        : 'Unknown road';
      const sublocation = place?.city || place?.region || '';
      const { merged } = await reportPothole(userLocation.latitude, userLocation.longitude, selectedSeverity, location, sublocation);
      await awardPoints('report');
      setReportModal(false);

      if (merged) {
        // An existing nearby pothole was found — confirmed count incremented
        Alert.alert(
          '✅ Report Confirmed',
          `Another user already reported a pothole here. Your confirmation has been counted (+${POINTS.REPORT} pts)`,
        );
      } else {
        // Brand-new pothole document created
        Alert.alert(t.reportedTitle, t.reportedMsg(selectedSeverity, location) + ` (+${POINTS.REPORT} pts)`);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setReporting(false);
    }
  }

  // Compute live distance for each pothole for the tray
  const nearby = potholes
    .map(p => ({
      ...p,
      distance: userLocation
        ? formatDistance(getDistanceMeters(userLocation.latitude, userLocation.longitude, p.lat, p.lng))
        : '—',
    }))
    .sort((a, b) => {
      if (!userLocation) return 0;
      return getDistanceMeters(userLocation.latitude, userLocation.longitude, a.lat, a.lng)
           - getDistanceMeters(userLocation.latitude, userLocation.longitude, b.lat, b.lng);
    })
    .slice(0, 5);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScreenHeader title={t.city} subtitle={t.reports(potholes.length)} />

      {/* Google Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={DELHI}
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
          <Text style={styles.fabText}>{t.reportBtn}</Text>
        </TouchableOpacity>

      </View>

      {/* Proximity alert banner */}
      {activeAlert && (
        <DrivingAlert
          location={activeAlert.pothole.location}
          severity={activeAlert.pothole.severity}
          distanceMeters={activeAlert.distanceMeters}
          onDismiss={dismissAlert}
        />
      )}

      {/* Bottom tray */}
      <View style={styles.tray}>
        <View style={styles.trayHandle} />
        <Text style={styles.trayTitle}>
          {nearby.length > 0 ? t.nearestPotholes(nearby.length) : t.noPotholesNearby}
        </Text>
        {potholes.length === 0 ? (
          <Text style={styles.emptyText}>{t.noPotholesYet}</Text>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {nearby.map(p => <PotholeCard key={p.id} {...p} />)}
          </ScrollView>
        )}
      </View>

      {/* Report modal */}
      <Modal visible={reportModal} transparent animationType="slide" onRequestClose={() => setReportModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.trayHandle} />
            <Text style={styles.modalTitle}>{t.reportModalTitle}</Text>
            <Text style={styles.modalSub}>{t.reportModalSub}</Text>

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
                : <Text style={styles.submitBtnText}>{t.submitReport}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setReportModal(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{t.cancel}</Text>
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
  trayTitle: { fontSize: 13, color: C.textSecondary, marginBottom: 12, letterSpacing: 0.5 },
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
