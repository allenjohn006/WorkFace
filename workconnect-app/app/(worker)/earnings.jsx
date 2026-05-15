// app/(worker)/earnings.jsx
// Worker Earnings Screen — aggregates income from completed jobs

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import useAuthStore from '../../src/store/authStore';
import { SkeletonCard, SkeletonBlock } from '../../src/components/ui/SkeletonLoader';
import EmptyState from '../../src/components/ui/EmptyState';
import Badge from '../../src/components/ui/Badge';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/constants/theme';

export default function WorkerEarningsScreen() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ thisWeek: 0, thisMonth: 0, allTime: 0 });

  useFocusEffect(
    useCallback(() => {
      loadEarnings();
    }, [])
  );

  const loadEarnings = async (isRefresh = false) => {
    if (!user) return;
    isRefresh ? setRefreshing(true) : setLoading(true);

    try {
      const q = query(
        collection(db, 'jobs'),
        where('workerId', '==', user.uid),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc')
      );
      const snap = await getDocs(q);
      const fetchedJobs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setJobs(fetchedJobs);
      calculateStats(fetchedJobs);
    } catch (err) {
      console.error('Failed to load earnings:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (completedJobs) => {
    const now = new Date();
    let thisWeek = 0;
    let thisMonth = 0;
    let allTime = 0;

    // Simple week calculation (last 7 days)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

    completedJobs.forEach((job) => {
      // Assuming customer pays the average of the budget range, or just use max budget as a proxy for this MVP
      const amount = job.budgetMax || 0;
      allTime += amount;

      if (job.completedAt) {
        const completedDate = job.completedAt.toDate();
        if (completedDate >= weekAgo) thisWeek += amount;
        if (completedDate >= monthAgo) thisMonth += amount;
      }
    });

    setStats({ thisWeek, thisMonth, allTime });
  };

  const renderJob = ({ item: job }) => {
    const date = job.completedAt?.toDate
      ? job.completedAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';

    return (
      <View style={styles.jobCard}>
        <View style={styles.jobHeader}>
          <Text style={styles.jobCategory}>{job.categoryLabel}</Text>
          <Text style={styles.jobAmount}>+₹{job.budgetMax?.toLocaleString()}</Text>
        </View>
        <Text style={styles.customerName}>Customer: {job.customerName}</Text>
        <View style={styles.jobFooter}>
          <Text style={styles.dateText}>{date}</Text>
          <Badge type="completed" size="sm" />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <SkeletonBlock height={140} borderRadius={16} />
          <View style={styles.loadingRow}>
            <SkeletonBlock height={100} style={{ flex: 1 }} borderRadius={16} />
            <SkeletonBlock height={100} style={{ flex: 1 }} borderRadius={16} />
          </View>
          <SkeletonBlock height={20} width={150} style={{ marginTop: 20, marginBottom: 10 }} />
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadEarnings(true)} />}
        >
          {/* Summary Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.mainStatCard}>
              <Text style={styles.statLabel}>All Time Earnings</Text>
              <Text style={styles.mainStatValue}>₹{stats.allTime.toLocaleString()}</Text>
              <Text style={styles.statSub}>From {jobs.length} completed jobs</Text>
            </View>
            <View style={styles.rowStats}>
              <View style={styles.smallStatCard}>
                <Text style={styles.statLabel}>This Week</Text>
                <Text style={styles.smallStatValue}>₹{stats.thisWeek.toLocaleString()}</Text>
              </View>
              <View style={styles.smallStatCard}>
                <Text style={styles.statLabel}>This Month</Text>
                <Text style={styles.smallStatValue}>₹{stats.thisMonth.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Jobs List */}
          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Completed Jobs</Text>
            {jobs.length === 0 ? (
              <EmptyState
                emoji="💸"
                title="No earnings yet"
                subtitle="Complete your first job to see it here."
              />
            ) : (
              jobs.map((job) => <View key={job.id}>{renderJob({ item: job })}</View>)
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md, paddingVertical: 16,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  loadingContainer: { padding: Spacing.md, gap: Spacing.md },
  loadingRow: { flexDirection: 'row', gap: Spacing.md },
  statsContainer: { padding: Spacing.md, gap: Spacing.md },
  mainStatCard: {
    backgroundColor: Colors.primary, borderRadius: 20, padding: 24,
    alignItems: 'center', gap: 6, elevation: 4, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  statLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', fontWeight: FontWeight.semibold, textTransform: 'uppercase' },
  mainStatValue: { fontSize: 40, fontWeight: FontWeight.extrabold, color: '#fff' },
  statSub: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)' },
  rowStats: { flexDirection: 'row', gap: Spacing.md },
  smallStatCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center', gap: 4,
  },
  smallStatValue: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.success },
  listContainer: { paddingHorizontal: Spacing.md, paddingBottom: 40, gap: 12 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 4 },
  jobCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  jobHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  jobCategory: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  jobAmount: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.success },
  customerName: { fontSize: FontSize.sm, color: Colors.textSecondary },
  jobFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.divider },
  dateText: { fontSize: FontSize.xs, color: Colors.textMuted },
});
