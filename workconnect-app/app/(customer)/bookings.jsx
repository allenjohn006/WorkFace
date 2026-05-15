// app/(customer)/bookings.jsx
// Customer bookings tab — active jobs at top, history below

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { getCustomerJobs } from '../../src/services/jobService';
import useAuthStore from '../../src/store/authStore';
import Badge from '../../src/components/ui/Badge';
import EmptyState from '../../src/components/ui/EmptyState';
import { SkeletonCard } from '../../src/components/ui/SkeletonLoader';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, JOB_STATUS } from '../../src/constants/theme';

const ACTIVE_STATUSES = ['open', 'accepted', 'in_progress'];

export default function BookingsScreen() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Reload when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadJobs();
    }, [])
  );

  const loadJobs = async (isRefresh = false) => {
    if (!user) return;
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const all = await getCustomerJobs(user.uid);
      setJobs(all);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const activeJobs = jobs.filter((j) => ACTIVE_STATUSES.includes(j.status));
  const pastJobs = jobs.filter((j) => !ACTIVE_STATUSES.includes(j.status));

  const formatDate = (ts) => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderJob = ({ item: job }) => {
    const isActive = ACTIVE_STATUSES.includes(job.status);
    return (
      <TouchableOpacity
        style={[styles.jobCard, isActive && styles.activeCard]}
        activeOpacity={0.85}
        onPress={() => {
          if (isActive) {
            router.push({ pathname: '/(customer)/active-booking', params: { jobId: job.id } });
          }
        }}
      >
        <View style={styles.cardTop}>
          <View style={styles.cardLeft}>
            <Text style={styles.category}>{job.categoryLabel || job.category}</Text>
            <Text style={styles.workerName}>
              {job.workerName ? `👷 ${job.workerName}` : '🔍 Searching for worker...'}
            </Text>
            <Text style={styles.date}>{formatDate(job.createdAt)}</Text>
          </View>
          <View style={styles.cardRight}>
            <Badge type={job.status} />
            <Text style={styles.amount}>₹{job.budgetMax?.toLocaleString()}</Text>
          </View>
        </View>

        {isActive && (
          <View style={styles.tapHint}>
            <Text style={styles.tapHintText}>Tap to track → </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bookings</Text>
      </View>

      {loading ? (
        <View style={{ padding: Spacing.md, gap: 12 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : jobs.length === 0 ? (
        <EmptyState
          emoji="📋"
          title="No bookings yet"
          subtitle="Post a job request from the Home tab to get started"
          actionLabel="Post a Request"
          onAction={() => router.push('/(customer)/post-request')}
        />
      ) : (
        <FlatList
          data={[...activeJobs, ...pastJobs]}
          keyExtractor={(item) => item.id}
          renderItem={renderJob}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadJobs(true)} />
          }
          ListHeaderComponent={
            activeJobs.length > 0 ? (
              <Text style={styles.sectionHeader}>
                🟢 Active ({activeJobs.length})
              </Text>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          stickyHeaderIndices={activeJobs.length > 0 ? [0] : []}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  list: { padding: Spacing.md, paddingBottom: 30 },
  sectionHeader: {
    fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.success,
    backgroundColor: Colors.background, paddingVertical: 8,
  },
  jobCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, gap: 8,
  },
  activeCard: { borderColor: Colors.primary, borderWidth: 2 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flex: 1, gap: 4 },
  category: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  workerName: { fontSize: FontSize.sm, color: Colors.textSecondary },
  date: { fontSize: FontSize.xs, color: Colors.textMuted },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  tapHint: { paddingTop: 4, borderTopWidth: 1, borderTopColor: Colors.divider },
  tapHintText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
});
