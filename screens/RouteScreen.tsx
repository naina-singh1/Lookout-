// screens/RouteScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, SafeAreaView, StatusBar,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { C, R, Pothole } from '../constants/theme';
import { ScreenHeader, SevBadge } from '../components/ui';
import { subscribePotholes } from '../services/potholes';
import { getDistanceMeters } from '../services/proximity';

const MAPS_API_KEY = 'AIzaSyBvh6kAxCSP_5nU8JEi_f_urI_W4HlcYU4';
const ROUTE_BUFFER_M = 150; // potholes within this distance of the route are included

// ─── Polyline decoder ─────────────────────────────────────────────────────────
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return points;
}

// Check if a pothole is within ROUTE_BUFFER_M of any point on the route
function isPotholeOnRoute(
  pothole: Pothole,
  routePoints: { lat: number; lng: number }[],
): { onRoute: boolean; distanceM: number } {
  let minDist = Infinity;
  for (const pt of routePoints) {
    const d = getDistanceMeters(pothole.lat, pothole.lng, pt.lat, pt.lng);
    if (d < minDist) minDist = d;
  }
  return { onRoute: minDist <= ROUTE_BUFFER_M, distanceM: Math.round(minDist) };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RouteScreen() {
  const [destination, setDestination] = useState('');
  const [loading, setLoading]         = useState(false);
  const [searched, setSearched]       = useState(false);
  const [routeSummary, setRouteSummary] = useState<{
    distance: string; duration: string;
  } | null>(null);
  const [routePotholes, setRoutePotholes] = useState<
    (Pothole & { distanceToRoute: number })[]
  >([]);

  const allPotholesRef = useRef<Pothole[]>([]);

  // Subscribe to live Firestore potholes
  useEffect(() => {
    const unsub = subscribePotholes(data => { allPotholesRef.current = data; });
    return unsub;
  }, []);

  async function handleSearch() {
    if (!destination.trim()) return;
    setLoading(true);
    setSearched(false);

    try {
      // 1. Get user's current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location needed', 'Enable location to use Route Planner.');
        setLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const origin = `${pos.coords.latitude},${pos.coords.longitude}`;

      // 2. Fetch route from Google Directions API
      const url =
        `https://maps.googleapis.com/maps/api/directions/json` +
        `?origin=${origin}` +
        `&destination=${encodeURIComponent(destination)}` +
        `&key=${MAPS_API_KEY}`;

      const res  = await fetch(url);
      const data = await res.json();

      if (data.status !== 'OK') {
        Alert.alert('Route not found', `Could not find a route to "${destination}". Try a more specific address.`);
        setLoading(false);
        return;
      }

      // 3. Decode polyline and extract summary
      const leg      = data.routes[0].legs[0];
      const encoded  = data.routes[0].overview_polyline.points;
      const points   = decodePolyline(encoded);

      setRouteSummary({
        distance: leg.distance.text,
        duration: leg.duration.text,
      });

      // 4. Filter potholes near the route
      const matched = allPotholesRef.current
        .map(p => {
          const { onRoute, distanceM } = isPotholeOnRoute(p, points);
          return onRoute ? { ...p, distanceToRoute: distanceM } : null;
        })
        .filter(Boolean) as (Pothole & { distanceToRoute: number })[];

      // Sort: severe first, then by proximity to route
      matched.sort((a, b) => {
        const order = { severe: 0, moderate: 1, minor: 2 };
        const diff  = order[a.severity] - order[b.severity];
        return diff !== 0 ? diff : a.distanceToRoute - b.distanceToRoute;
      });

      setRoutePotholes(matched);
      setSearched(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  const severeCount   = routePotholes.filter(p => p.severity === 'severe').length;
  const moderateCount = routePotholes.filter(p => p.severity === 'moderate').length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScreenHeader title="Route Planner" />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Search */}
        <View style={styles.searchBox}>
          <Text style={styles.searchLabel}>Destination</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Where to? e.g. Connaught Place"
              placeholderTextColor={C.textFaint}
              value={destination}
              onChangeText={setDestination}
              onSubmitEditing={handleSearch}
              returnKeyType="go"
            />
            <TouchableOpacity
              style={[styles.goBtn, loading && { opacity: 0.6 }]}
              onPress={handleSearch}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.goBtnText}>Go</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {searched && routeSummary && (
          <>
            {/* Route meta */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Route Summary</Text>
              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{routeSummary.distance}</Text>
                  <Text style={styles.statLabel}>Distance</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{routeSummary.duration}</Text>
                  <Text style={styles.statLabel}>Est. time</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statNum, severeCount > 0 && { color: C.severe }]}>
                    {routePotholes.length}
                  </Text>
                  <Text style={styles.statLabel}>Potholes</Text>
                </View>
              </View>
            </View>

            {/* Warning banner */}
            {severeCount > 0 && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.warningTitle}>
                    {severeCount} severe pothole{severeCount > 1 ? 's' : ''} on this route
                  </Text>
                  <Text style={styles.warningSub}>
                    {moderateCount > 0 ? `+ ${moderateCount} moderate · ` : ''}Consider an alternate route
                  </Text>
                </View>
              </View>
            )}

            {/* Potholes on route */}
            <Text style={styles.sectionTitle}>
              {routePotholes.length > 0
                ? `${routePotholes.length} Pothole${routePotholes.length > 1 ? 's' : ''} on Route`
                : 'No potholes on this route 🎉'}
            </Text>
            {routePotholes.map(p => (
              <View key={p.id} style={styles.routeItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeLocation}>{p.location}</Text>
                  <Text style={styles.routeSub}>{p.sublocation}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <SevBadge severity={p.severity} />
                  <Text style={styles.routeDist}>{p.distanceToRoute}m from route</Text>
                </View>
              </View>
            ))}
          </>
        )}

        {!searched && !loading && (
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
    backgroundColor: C.surface, borderRadius: R.card,
    borderWidth: 0.5, borderColor: C.borderSubtle, padding: 14, gap: 8,
  },
  searchLabel: { fontSize: 10, color: C.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
  inputRow: { flexDirection: 'row', gap: 10 },
  input: {
    flex: 1, backgroundColor: C.elevated, borderRadius: R.button,
    borderWidth: 0.5, borderColor: C.borderMuted,
    paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: C.textPrimary,
  },
  goBtn: {
    backgroundColor: C.accent, borderRadius: R.button,
    paddingHorizontal: 20, justifyContent: 'center', minWidth: 52, alignItems: 'center',
  },
  goBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  card: {
    backgroundColor: C.surface, borderRadius: R.card,
    borderWidth: 0.5, borderColor: C.borderSubtle, padding: 14,
  },
  cardTitle: { fontSize: 13, color: C.textSecondary, marginBottom: 12 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center', gap: 4 },
  statNum: { fontSize: 20, color: C.textPrimary, fontWeight: '700' },
  statLabel: { fontSize: 11, color: C.textMuted },
  warningBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: C.severeBg, borderRadius: R.card,
    borderWidth: 0.5, borderColor: C.severe, padding: 14,
  },
  warningIcon: { fontSize: 24 },
  warningTitle: { fontSize: 13, color: C.severe, fontWeight: '600' },
  warningSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  sectionTitle: { fontSize: 13, color: C.textSecondary, marginTop: 4 },
  routeItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface, borderRadius: R.card,
    borderWidth: 0.5, borderColor: C.borderSubtle, padding: 12,
  },
  routeLocation: { fontSize: 14, color: C.textPrimary, fontWeight: '600' },
  routeSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  routeDist: { fontSize: 11, color: C.accent },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, color: C.textSecondary },
  emptySub: { fontSize: 12, color: C.textMuted, textAlign: 'center' },
});
