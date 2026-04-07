// screens/FeedScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { C, R, Pothole, Severity } from '../constants/theme';
import { ScreenHeader, PotholeCard } from '../components/ui';
import { subscribePotholes } from '../services/potholes';

const FILTERS: { label: string; value: Severity | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Severe', value: 'severe' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Minor', value: 'minor' },
];

export default function FeedScreen() {
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const [potholes, setPotholes] = useState<Pothole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribePotholes(data => {
      setPotholes(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const data = filter === 'all' ? potholes : potholes.filter(p => p.severity === filter);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScreenHeader title="Nearby Feed" subtitle={`${data.length} report${data.length !== 1 ? 's' : ''}`} />

      {/* Filter chips */}
      <View style={styles.chips}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[styles.chip, filter === f.value && styles.chipActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.chipText, filter === f.value && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={C.accent} size="large" />
          <Text style={styles.loadingText}>Loading reports…</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PotholeCard {...item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🕳</Text>
              <Text style={styles.emptyText}>
                {filter === 'all' ? 'No potholes reported yet' : `No ${filter} potholes`}
              </Text>
              <Text style={styles.emptySub}>
                {filter === 'all' ? 'Use the Map tab to report one!' : 'Try a different filter'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  chips: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: R.pill,
    backgroundColor: C.surface,
    borderWidth: 0.5,
    borderColor: C.borderSubtle,
  },
  chipActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  chipText: { fontSize: 12, color: C.textMuted },
  chipTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: C.textMuted, fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 16, color: C.textSecondary },
  emptySub: { fontSize: 12, color: C.textMuted },
});
