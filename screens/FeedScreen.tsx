// screens/FeedScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { C, R, Pothole, Severity } from '../constants/theme';
import { ScreenHeader, PotholeCard } from '../components/ui';
import { subscribePotholes } from '../services/potholes';
import { useLanguage } from '../contexts/LanguageContext';

export default function FeedScreen() {
  const { t } = useLanguage();
  const FILTERS: { label: string; value: Severity | 'all' }[] = [
    { label: t.filterAll,      value: 'all' },
    { label: t.filterSevere,   value: 'severe' },
    { label: t.filterModerate, value: 'moderate' },
    { label: t.filterMinor,    value: 'minor' },
  ];
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
      <ScreenHeader title={t.nearbyFeed} subtitle={t.reports(data.length)} />

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
          <Text style={styles.loadingText}>{t.loadingReports}</Text>
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
                {filter === 'all' ? t.noReportsYet : `${t.filterAll === 'All' ? 'No' : 'कोई'} ${filter === 'severe' ? t.filterSevere : filter === 'moderate' ? t.filterModerate : t.filterMinor} ${t.navFeed === 'Feed' ? 'potholes' : 'गड्ढे नहीं'}`}
              </Text>
              <Text style={styles.emptySub}>
                {filter === 'all' ? t.useMapTab : t.tryDifferentFilter}
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
