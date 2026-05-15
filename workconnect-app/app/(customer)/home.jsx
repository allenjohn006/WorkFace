// app/(customer)/home.jsx
// CustomerHome — greeting + 8-category service grid

import { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import useAuthStore from '../../src/store/authStore';
import useJobStore from '../../src/store/jobStore';
import {
  Colors, FontSize, FontWeight, Spacing, BorderRadius, SERVICE_CATEGORIES,
} from '../../src/constants/theme';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - Spacing.md * 2 - Spacing.sm * 3) / 4;

export default function CustomerHomeScreen() {
  const { profile } = useAuthStore();
  const { setSelectedCategory } = useJobStore();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleCategoryTap = useCallback((category) => {
    setSelectedCategory(category);
    router.push('/(customer)/post-request');
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.name} numberOfLines={1}>
              {profile?.name?.split(' ')[0] || 'there'} 👋
            </Text>
          </View>
          <View style={styles.locationBadge}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText}>Kerala</Text>
          </View>
        </View>

        {/* Search CTA Banner */}
        <TouchableOpacity
          style={styles.searchBanner}
          onPress={() => router.push('/(customer)/post-request')}
          activeOpacity={0.9}
        >
          <View>
            <Text style={styles.bannerTitle}>Need a worker today?</Text>
            <Text style={styles.bannerSub}>Post a request — get matched in minutes</Text>
          </View>
          <Text style={styles.bannerArrow}>→</Text>
        </TouchableOpacity>

        {/* Category Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>What do you need?</Text>
        </View>

        <View style={styles.grid}>
          {SERVICE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => handleCategoryTap(cat)}
              activeOpacity={0.8}
              style={styles.categoryCard}
            >
              <View style={[styles.iconCircle, { backgroundColor: cat.color + '20' }]}>
                <Text style={styles.categoryEmoji}>{cat.icon}</Text>
              </View>
              <Text style={styles.categoryLabel} numberOfLines={2}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* How it works */}
        <View style={styles.howCard}>
          <Text style={styles.howTitle}>How WorkConnect works</Text>
          {[
            { step: '1', icon: '📝', text: 'Post your job request' },
            { step: '2', icon: '🔍', text: 'We find workers near you' },
            { step: '3', icon: '✅', text: 'Worker accepts & arrives' },
            { step: '4', icon: '💰', text: 'Pay cash after job done' },
          ].map((item) => (
            <View key={item.step} style={styles.howRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{item.step}</Text>
              </View>
              <Text style={styles.stepIcon}>{item.icon}</Text>
              <Text style={styles.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Trust badges */}
        <View style={styles.trustRow}>
          {[
            { icon: '✅', label: 'Verified Workers' },
            { icon: '💰', label: 'Cash Payment' },
            { icon: '📍', label: 'Nearby Only' },
          ].map((t) => (
            <View key={t.label} style={styles.trustBadge}>
              <Text style={styles.trustIcon}>{t.icon}</Text>
              <Text style={styles.trustLabel}>{t.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerLeft: { gap: 2 },
  greeting: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text, maxWidth: 220 },
  locationBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
  },
  locationIcon: { fontSize: 14 },
  locationText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  searchBanner: {
    backgroundColor: Colors.primary, borderRadius: 18, padding: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  bannerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: '#fff' },
  bannerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  bannerArrow: { fontSize: 28, color: '#fff' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryCard: {
    width: CARD_SIZE, alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: 16, paddingVertical: 14,
    paddingHorizontal: 8, borderWidth: 1, borderColor: Colors.border,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4,
  },
  iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  categoryEmoji: { fontSize: 24 },
  categoryLabel: { fontSize: FontSize.xs, color: Colors.text, fontWeight: FontWeight.semibold, textAlign: 'center' },
  howCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 18, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  howTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 4 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  stepNum: { fontSize: FontSize.xs, color: '#fff', fontWeight: FontWeight.bold },
  stepIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  stepText: { fontSize: FontSize.sm, color: Colors.textSecondary, flex: 1 },
  trustRow: { flexDirection: 'row', gap: 8 },
  trustBadge: {
    flex: 1, alignItems: 'center', gap: 6, backgroundColor: Colors.surface,
    borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: Colors.border,
  },
  trustIcon: { fontSize: 22 },
  trustLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.semibold, textAlign: 'center' },
});
