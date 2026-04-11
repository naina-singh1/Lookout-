// Lookout UI Components — components/ui.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { C, R, Severity, severityColor, severityBg } from '../constants/theme';

export function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={styles.iconTile}>
        <Text style={{ fontSize: size * 0.8, color: '#fff' }}>⚠</Text>
      </View>
      <Text style={{ fontSize: size, letterSpacing: -1, marginLeft: 8 }}>
        <Text style={{ color: C.textPrimary }}>Look</Text>
        <Text style={{ color: C.accent }}>out</Text>
      </Text>
    </View>
  );
}

export function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.header}>
      <Wordmark />
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

export function SevBadge({ severity }: { severity: Severity }) {
  return (
    <View style={[styles.badge, { backgroundColor: severityBg(severity) }]}>
      <Text style={[styles.badgeText, { color: severityColor(severity) }]}>
        {severity.toUpperCase()}
      </Text>
    </View>
  );
}

export function PotholeCard({
  location, sublocation, severity, confirmed, distance, time, onPress,
}: {
  location: string; sublocation: string; severity: Severity;
  confirmed: number; distance: string; time: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.cardAccent, { backgroundColor: severityColor(severity) }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLocation}>{location}</Text>
            <Text style={styles.cardSub}>{sublocation}</Text>
          </View>
          <Text style={styles.cardDistance}>{distance}</Text>
        </View>
        <View style={styles.cardFooter}>
          <SevBadge severity={severity} />
          <Text style={styles.cardMeta}>{confirmed} confirmed · {time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function DrivingAlert({
  location, severity, distanceMeters, onDismiss,
}: {
  location: string;
  severity: Severity;
  distanceMeters: number;
  onDismiss: () => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  // Pulse border opacity for severe alerts
  useEffect(() => {
    if (severity !== 'severe') return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.2, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [severity]);

  const color = severityColor(severity);
  const distText = distanceMeters < 1000
    ? `${Math.round(distanceMeters)}m`
    : `${(distanceMeters / 1000).toFixed(1)}km`;
  const urgency = distanceMeters <= 30 ? 'SLOW DOWN NOW' : distanceMeters <= 60 ? 'Slow down' : 'Ease off';
  const icon = severity === 'severe' ? '🚨' : severity === 'moderate' ? '⚠️' : '⚡';

  return (
    <Animated.View style={[
      styles.alert,
      { borderColor: color + '55' },
      severity === 'severe' && { borderColor: color, opacity: pulse },
    ]}>
      <View style={[styles.alertAccent, { backgroundColor: color }]} />
      <View style={styles.alertContent}>
        <Text style={styles.alertTitle}>{icon} Pothole ahead — {urgency}</Text>
        <Text style={styles.alertSub}>{location} · {severity}</Text>
      </View>
      <Text style={[styles.alertDistance, { color }]}>{distText}</Text>
      <TouchableOpacity onPress={onDismiss} style={styles.alertDismiss}>
        <Text style={{ color: C.textSecondary, fontSize: 16 }}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconTile: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: C.surface, borderWidth: 0.5,
    borderColor: C.borderSubtle, alignItems: 'center', justifyContent: 'center',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: C.borderSubtle,
  },
  headerTitle: { fontSize: 14, color: C.textPrimary },
  headerSubtitle: { fontSize: 11, color: C.textSecondary },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  card: {
    flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.card,
    borderWidth: 0.5, borderColor: C.borderSubtle, marginBottom: 10, overflow: 'hidden',
  },
  cardAccent: { width: 3 },
  cardContent: { flex: 1, padding: 12 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  cardLocation: { fontSize: 14, color: C.textPrimary, fontWeight: '600' },
  cardSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  cardDistance: { fontSize: 13, color: C.accent, marginLeft: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardMeta: { fontSize: 10, color: C.textMuted },
  alert: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a24',
    borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(232,92,58,0.35)',
    overflow: 'hidden', marginHorizontal: 16, marginBottom: 12,
  },
  alertAccent: { width: 3, alignSelf: 'stretch' },
  alertContent: { flex: 1, padding: 12 },
  alertTitle: { fontSize: 13, color: C.textPrimary, fontWeight: '600' },
  alertSub: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
  alertDistance: { fontSize: 14, color: C.accent, paddingRight: 8 },
  alertDismiss: { padding: 12 },
});
