// app/(customer)/nearby-workers.jsx
// List of available workers sorted by distance using geohash query + Haversine

import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { getNearbyWorkers } from '../../src/services/jobService';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { formatDistance } from '../../src/utils/location';
import StarRating from '../../src/components/ui/StarRating';
import Badge from '../../src/components/ui/Badge';
import Button from '../../src/components/ui/Button';
import EmptyState from '../../src/components/ui/EmptyState';
import { SkeletonCard } from '../../src/components/ui/SkeletonLoader';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/constants/theme';

export default function NearbyWorkersScreen() {
  const { jobId } = useLocalSearchParams();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobData, setJobData] = useState(null);

  useEffect(() => {
    loadWorkersAndJob();
  }, []);

  const loadWorkersAndJob = async () => {
    setLoading(true);
    try {
      // Fetch job details for category filter display
      if (jobId) {
        const snap = await getDoc(doc(db, 'jobs', jobId));
        if (snap.exists()) setJobData(snap.data());
      }

      // Get customer's current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      let center = { lat: 10.8505, lng: 76.2711 }; // Kerala center fallback
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        center = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      }

      const nearby = await getNearbyWorkers(center, 20); // 20km radius
      setWorkers(nearby);
    } catch (err) {
      console.error('Failed to load workers:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderWorker = ({ item: worker }) => (
    <View style={styles.workerCard}>
      {/* Avatar */}
      <View style={styles.cardTop}>
        {worker.photoURL ? (
          <Image source={{ uri: worker.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarEmoji}>👷</Text>
          </View>
        )}
        <View style={styles.workerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.workerName}>{worker.name}</Text>
            {worker.verificationStatus === 'verified' && (
              <Text style={styles.verifiedBadge}>✓</Text>
            )}
          </View>
          <Text style={styles.skills} numberOfLines={1}>
            {worker.skills?.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' · ')}
          </Text>
          <View style={styles.ratingRow}>
            <StarRating rating={worker.rating || 0} size={14} />
            <Text style={styles.ratingText}>
              {worker.rating?.toFixed(1) || '—'} ({worker.totalRatings || 0})
            </Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.distance}>{formatDistance(worker.distanceKm)}</Text>
          <Badge type={worker.availability} size="sm" />
          <Text style={styles.experience}>{worker.experience || 0}yr exp</Text>
        </View>
      </View>

      {/* Job count */}
      <View style={styles.statsRow}>
        <Text style={styles.statText}>🛠 {worker.totalJobs || 0} jobs done</Text>
        <Text style={styles.statText}>📍 {worker.serviceRadius || 10}km radius</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Button
          label="View Profile"
          variant="outline"
          size="sm"
          fullWidth={false}
          style={{ flex: 1 }}
          onPress={() =>
            router.push({
              pathname: '/(customer)/worker-profile',
              params: { workerId: worker.uid, jobId },
            })
          }
        />
        <Button
          label="Book Now"
          variant="primary"
          size="sm"
          fullWidth={false}
          style={{ flex: 1 }}
          onPress={() =>
            router.push({
              pathname: '/(customer)/booking-confirm',
              params: { workerId: worker.uid, jobId },
            })
          }
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Nearby Workers</Text>
          {jobData && (
            <Text style={styles.subtitle}>
              Showing workers for: {jobData.categoryLabel}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={loadWorkersAndJob} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ padding: Spacing.md, gap: 12 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => item.uid}
          renderItem={renderWorker}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            workers.length > 0 ? (
              <Text style={styles.resultCount}>{workers.length} workers found near you</Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              emoji="😔"
              title="No workers nearby"
              subtitle="No available workers found within 20km. Try again later or expand your search."
              actionLabel="Try Again"
              onAction={loadWorkersAndJob}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 8 },
  backText: { fontSize: 22, color: Colors.primary, fontWeight: FontWeight.bold },
  title: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  refreshBtn: { padding: 8 },
  refreshText: { fontSize: 22, color: Colors.primary },
  list: { padding: Spacing.md, gap: 12, paddingBottom: 30 },
  resultCount: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  workerCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6,
  },
  cardTop: { flexDirection: 'row', gap: 12 },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center',
  },
  avatarEmoji: { fontSize: 28 },
  workerInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  workerName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  verifiedBadge: {
    fontSize: 11, color: '#fff', backgroundColor: Colors.success,
    borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, fontWeight: FontWeight.bold,
  },
  skills: { fontSize: FontSize.sm, color: Colors.textSecondary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  distance: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
  experience: { fontSize: FontSize.xs, color: Colors.textMuted },
  statsRow: { flexDirection: 'row', gap: 16 },
  statText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  actionRow: { flexDirection: 'row', gap: 10 },
});
