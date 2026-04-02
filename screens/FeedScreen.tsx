// screens/FeedScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native';
import { C, F, R, MOCK_POTHOLES, Severity } from '../constants/theme';
import { ScreenHeader, PotholeCard } from '../components/ui';

const FILTERS: { label: string; value: Severity | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Severe', value: 'severe' },
  { label: 'Moderate', value: 'moderate' },
  { label: 'Minor', value: 'minor' },
];

export default function FeedScreen() {
  const [filter, setFilter] = useState<Severity | 'all'>('all');
  const data = filter === 'all' ? MOCK_POTHOLES : MOCK_POTHOLES.filter(p => p.severity === filter);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <ScreenHeader title="Nearby Feed" subtitle={`${data.length} reports`} />

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

      <FlatList
        data={data}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <PotholeCard {...item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🕳</Text>
            <Text style={styles.emptyText}>No potholes found</Text>
            <Text style={styles.emptySub}>Try a different filter</Text>
          </View>
        }
      />
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
  chipText: {
    fontFamily: F.body,
    fontSize: 12,
    color: C.textMuted,
  },
  chipTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontFamily: F.display, fontSize: 16, color: C.textSecondary },
  emptySub: { fontFamily: F.mono, fontSize: 12, color: C.textMuted },
});
