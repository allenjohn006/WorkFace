// app/(customer)/worker-profile.jsx
// Worker public profile — full details, reviews, Book Now CTA

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDoc, doc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import StarRating from '../../src/components/ui/StarRating';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import { SkeletonBlock } from '../../src/components/ui/SkeletonLoader';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, SERVICE_CATEGORIES } from '../../src/constants/theme';

export default function WorkerProfileScreen() {
  const { workerId, jobId } = useLocalSearchParams();
  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [workerId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [workerSnap, reviewsSnap] = await Promise.all([
        getDoc(doc(db, 'workers', workerId)),
        getDocs(
          query(
            collection(db, 'reviews'),
            where('toUid', '==', workerId),
            orderBy('createdAt', 'desc'),
            limit(10)
          )
        ),
      ]);
      if (workerSnap.exists()) setWorker(workerSnap.data());
      setReviews(reviewsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Failed to load worker profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSkillLabel = (skillId) =>
    SERVICE_CATEGORIES.find((c) => c.id === skillId)?.label || skillId;

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ padding: Spacing.md, gap: 16 }}>
          <SkeletonBlock height={200} borderRadius={0} />
          <SkeletonBlock width="60%" height={20} />
          <SkeletonBlock width="40%" height={16} />
          <SkeletonBlock height={100} />
        </View>
      </SafeAreaView>
    );
  }

  if (!worker) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 24, color: Colors.textSecondary }}>Worker not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backOverlay}>
            <Text style={styles.backOverlayText}>←</Text>
          </TouchableOpacity>
          {worker.photoURL ? (
            <Image source={{ uri: worker.photoURL }} style={styles.heroAvatar} />
          ) : (
            <View style={styles.heroAvatarPlaceholder}>
              <Text style={{ fontSize: 56 }}>👷</Text>
            </View>
          )}
          <Text style={styles.heroName}>{worker.name}</Text>
          <View style={styles.heroBadges}>
            <Badge type={worker.verificationStatus} />
            <Badge type={worker.availability} />
          </View>
        </View>

        <View style={styles.body}>
          {/* Stats Row */}
          <View style={styles.statsRow}>
            {[
              { label: 'Rating', value: worker.rating?.toFixed(1) || '—', icon: '⭐' },
              { label: 'Jobs Done', value: worker.totalJobs || 0, icon: '🛠' },
              { label: 'Experience', value: `${worker.experience || 0}yr`, icon: '📅' },
              { label: 'Radius', value: `${worker.serviceRadius || 10}km`, icon: '📍' },
            ].map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statIcon}>{stat.icon}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Rating breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Rating</Text>
            <View style={styles.ratingBig}>
              <Text style={styles.ratingNumber}>{worker.rating?.toFixed(1) || '0.0'}</Text>
              <View>
                <StarRating rating={worker.rating || 0} size={22} />
                <Text style={styles.ratingCount}>Based on {worker.totalRatings || 0} reviews</Text>
              </View>
            </View>
          </View>

          {/* Skills */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills & Services</Text>
            <View style={styles.skillsWrap}>
              {worker.skills?.map((skillId) => {
                const cat = SERVICE_CATEGORIES.find((c) => c.id === skillId);
                return (
                  <View key={skillId} style={styles.skillChip}>
                    <Text style={styles.skillEmoji}>{cat?.icon || '🔧'}</Text>
                    <Text style={styles.skillLabel}>{getSkillLabel(skillId)}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Reviews</Text>
            {reviews.length === 0 ? (
              <Text style={styles.noReviews}>No reviews yet — be the first!</Text>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewCard}>
                  <View style={styles.reviewTop}>
                    <StarRating rating={review.rating} size={14} />
                    <Text style={styles.reviewDate}>
                      {review.createdAt?.toDate
                        ? review.createdAt.toDate().toLocaleDateString('en-IN')
                        : '—'}
                    </Text>
                  </View>
                  {review.text ? (
                    <Text style={styles.reviewText}>{review.text}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Book Now CTA */}
      <View style={styles.ctaBar}>
        <Button
          label="Book This Worker"
          onPress={() =>
            router.push({
              pathname: '/(customer)/booking-confirm',
              params: { workerId: worker.uid, jobId },
            })
          }
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  hero: {
    backgroundColor: Colors.primary, alignItems: 'center',
    paddingVertical: 40, paddingHorizontal: 20, gap: 12,
  },
  backOverlay: {
    position: 'absolute', top: 16, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  backOverlayText: { color: '#fff', fontSize: 20, fontWeight: FontWeight.bold },
  heroAvatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#fff' },
  heroAvatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center',
  },
  heroName: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: '#fff' },
  heroBadges: { flexDirection: 'row', gap: 8 },
  body: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 100 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 14,
    alignItems: 'center', padding: 12, gap: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.primary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  section: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  ratingBig: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ratingNumber: { fontSize: 48, fontWeight: FontWeight.extrabold, color: Colors.primary },
  ratingCount: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: Colors.background, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border,
  },
  skillEmoji: { fontSize: 16 },
  skillLabel: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
  noReviews: { fontSize: FontSize.sm, color: Colors.textMuted, fontStyle: 'italic' },
  reviewCard: {
    paddingBottom: 12, borderBottomWidth: 1,
    borderBottomColor: Colors.divider, gap: 6,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  reviewText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  ctaBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
});
