// src/components/ui/SkeletonLoader.jsx
// Skeleton placeholder shown during data loading — prevents blank screens

import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';

/**
 * Animated shimmer skeleton block.
 * @param {number} width - Width of skeleton (number or '100%')
 * @param {number} height - Height in dp
 * @param {number} borderRadius 
 */
export function SkeletonBlock({ width = '100%', height = 16, borderRadius = BorderRadius.sm, style }) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.85] });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: Colors.border, opacity },
        style,
      ]}
    />
  );
}

/** Pre-built skeleton card for worker/job list items */
export function SkeletonCard({ style }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <SkeletonBlock width={56} height={56} borderRadius={28} />
        <View style={styles.info}>
          <SkeletonBlock width="60%" height={14} />
          <SkeletonBlock width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <SkeletonBlock width="90%" height={12} style={{ marginTop: 12 }} />
      <SkeletonBlock width="70%" height={12} style={{ marginTop: 6 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  row: { flexDirection: 'row', gap: 12 },
  info: { flex: 1, gap: 6, justifyContent: 'center' },
});
