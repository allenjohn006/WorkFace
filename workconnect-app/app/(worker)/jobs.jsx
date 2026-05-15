// app/(worker)/jobs.jsx
// Worker Home — availability toggle + incoming job requests with 60s countdown

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { geohashForLocation } from 'geofire-common';
import { listenToOpenJobsForWorker, acceptJob } from '../../src/services/jobService';
import { updateWorkerAvailability, getWorkerProfile } from '../../src/services/userService';
import useAuthStore from '../../src/store/authStore';
import Badge from '../../src/components/ui/Badge';
import EmptyState from '../../src/components/ui/EmptyState';
import { useToast } from '../../src/components/ui/Toast';
import { SkeletonCard } from '../../src/components/ui/SkeletonLoader';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, AVAILABILITY_STATUS } from '../../src/constants/theme';

const COUNTDOWN_SECONDS = 60;

// Individual job card with its own countdown timer
function JobRequestCard({ job, onAccept, onReject, workerLocation }) {
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_SECONDS);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          onReject(job.id); // Auto-reject on timeout
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const urgencyColor = job.urgency === 'urgent' ? Colors.error : Colors.primary;
  const timerColor = timeLeft <= 15 ? Colors.error : timeLeft <= 30 ? Colors.warning : Colors.success;

  return (
    <View style={[styles.jobCard, job.urgency === 'urgent' && styles.urgentCard]}>
      {/* Countdown timer */}
      <View style={styles.timerRow}>
        <View style={[styles.timerBadge, { borderColor: timerColor }]}>
          <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}s</Text>
        </View>
        <Badge type={job.urgency} />
        {job.urgency === 'urgent' && <Text style={styles.urgentLabel}>🔴 URGENT</Text>}
      </View>

      {/* Job info */}
      <View style={styles.jobHeader}>
        <Text style={styles.categoryIcon}>
          {getCategoryIcon(job.category)}
        </Text>
        <View style={styles.jobTitleArea}>
          <Text style={styles.categoryLabel}>{job.categoryLabel}</Text>
          {workerLocation && job.location && (
            <Text style={styles.distance}>
              📍 ~{estimateDistance(workerLocation, job.location)} away
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>{job.description}</Text>

      {/* Budget */}
      <View style={styles.budgetRow}>
        <Text style={styles.budgetLabel}>Budget:</Text>
        <Text style={styles.budgetValue}>
          ₹{job.budgetMin?.toLocaleString()} – ₹{job.budgetMax?.toLocaleString()}
        </Text>
      </View>

      {/* Address preview */}
      <Text style={styles.address} numberOfLines={1}>📍 {job.address}</Text>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.rejectBtn}
          onPress={() => onReject(job.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.rejectText}>✕ Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptBtn}
          onPress={() => onAccept(job)}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptText}>✓ Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getCategoryIcon(cat) {
  const map = { electrician: '⚡', plumber: '🔧', carpenter: '🪵', painter: '🎨', cleaner: '🧹', ac_technician: '❄️', mason: '🧱', welder: '🔩' };
  return map[cat] || '🔧';
}

function estimateDistance(wLoc, jLoc) {
  if (!wLoc || !jLoc) return '?';
  const R = 6371;
  const dLat = (jLoc.lat - wLoc.lat) * Math.PI / 180;
  const dLng = (jLoc.lng - wLoc.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(wLoc.lat * Math.PI / 180) * Math.cos(jLoc.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

export default function WorkerJobsScreen() {
  const { user, profile } = useAuthStore();
  const showToast = useToast();

  const [availability, setAvailability] = useState('offline');
  const [jobs, setJobs] = useState([]);
  const [rejectedIds, setRejectedIds] = useState(new Set());
  const [workerData, setWorkerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    loadWorkerData();
    return () => unsubscribeRef.current?.();
  }, []);

  const loadWorkerData = async () => {
    if (!user) return;
    try {
      const data = await getWorkerProfile(user.uid);
      if (data) {
        setWorkerData(data);
        setAvailability(data.availability || 'offline');
        // Start listening for jobs if worker is available
        if (data.availability === 'available' && data.geohash) {
          startListening(data.geohash);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startListening = (geohash) => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = listenToOpenJobsForWorker(geohash, (newJobs) => {
      setJobs(newJobs);
    });
  };

  const handleAvailabilityToggle = async (newStatus) => {
    setToggling(true);
    try {
      let locationData = null;
      if (newStatus === 'available') {
        // Get fresh GPS when going online
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const geohash = geohashForLocation([loc.coords.latitude, loc.coords.longitude]);
          locationData = { lat: loc.coords.latitude, lng: loc.coords.longitude, geohash };
          startListening(geohash);
        } else {
          showToast('Location permission needed to go online', 'error');
          setToggling(false);
          return;
        }
      } else {
        unsubscribeRef.current?.();
        setJobs([]);
      }

      await updateWorkerAvailability(user.uid, newStatus, locationData);
      setAvailability(newStatus);
      showToast(
        newStatus === 'available' ? '🟢 You are now available for jobs!' :
        newStatus === 'busy' ? '🟡 Set to busy' : '🔴 You are offline',
        'success'
      );
    } catch (err) {
      showToast('Failed to update availability', 'error');
    } finally {
      setToggling(false);
    }
  };

  const handleAccept = async (job) => {
    try {
      await acceptJob(job.id, user.uid);
      await updateWorkerAvailability(user.uid, 'busy');
      setAvailability('busy');
      setJobs([]);
      showToast('Job accepted! Head to the Active tab.', 'success');
      router.push({ pathname: '/(worker)/active', params: { jobId: job.id } });
    } catch (err) {
      showToast('Failed to accept job. Please try again.', 'error');
    }
  };

  const handleReject = (jobId) => {
    setRejectedIds((prev) => new Set([...prev, jobId]));
  };

  const visibleJobs = jobs.filter((j) => !rejectedIds.has(j.id));

  const availabilityOptions = [
    { key: 'available', label: 'Available', color: Colors.success, emoji: '🟢' },
    { key: 'busy', label: 'Busy', color: Colors.warning, emoji: '🟡' },
    { key: 'offline', label: 'Offline', color: Colors.textMuted, emoji: '🔴' },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.name?.split(' ')[0] || 'Worker'} 👋</Text>
          <Text style={styles.subtitle}>Manage your availability below</Text>
        </View>
      </View>

      {/* Availability Toggle */}
      <View style={styles.availCard}>
        <Text style={styles.availTitle}>Your Status</Text>
        <View style={styles.availOptions}>
          {availabilityOptions.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => handleAvailabilityToggle(opt.key)}
              disabled={toggling || availability === opt.key}
              style={[
                styles.availBtn,
                availability === opt.key && { backgroundColor: opt.color, borderColor: opt.color },
              ]}
              activeOpacity={0.8}
            >
              <Text style={styles.availEmoji}>{opt.emoji}</Text>
              <Text style={[styles.availLabel, availability === opt.key && { color: '#fff' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {workerData?.verificationStatus !== 'verified' && (
          <Text style={styles.verifyNote}>
            ⚠️ Your profile is pending verification. You can still receive jobs but customers see an unverified badge.
          </Text>
        )}
      </View>

      {/* Jobs List */}
      {availability !== 'available' ? (
        <View style={styles.offlineState}>
          <Text style={styles.offlineEmoji}>💤</Text>
          <Text style={styles.offlineTitle}>You're {availability}</Text>
          <Text style={styles.offlineSubtitle}>
            Set yourself to "Available" to start receiving job requests in your area
          </Text>
        </View>
      ) : loading ? (
        <View style={{ padding: Spacing.md, gap: 12 }}>
          {[1, 2].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={visibleJobs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JobRequestCard
              job={item}
              onAccept={handleAccept}
              onReject={handleReject}
              workerLocation={workerData?.location}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            visibleJobs.length > 0 ? (
              <Text style={styles.jobsHeader}>
                📨 {visibleJobs.length} job{visibleJobs.length > 1 ? 's' : ''} near you
              </Text>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              emoji="⏳"
              title="Waiting for job requests"
              subtitle="New jobs in your area will appear here automatically. Stay available!"
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
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  greeting: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.text },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  availCard: {
    margin: Spacing.md, backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  availTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  availOptions: { flexDirection: 'row', gap: 8 },
  availBtn: {
    flex: 1, alignItems: 'center', gap: 4, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  availEmoji: { fontSize: 18 },
  availLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.text },
  verifyNote: { fontSize: FontSize.xs, color: Colors.warning, lineHeight: 18 },
  offlineState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  offlineEmoji: { fontSize: 64 },
  offlineTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, textTransform: 'capitalize' },
  offlineSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  list: { padding: Spacing.md, gap: 12, paddingBottom: 30 },
  jobsHeader: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary, marginBottom: 4 },
  jobCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1.5, borderColor: Colors.border,
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08,
  },
  urgentCard: { borderColor: Colors.error, borderWidth: 2 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: BorderRadius.full, borderWidth: 2,
  },
  timerText: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold },
  urgentLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.error },
  jobHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  categoryIcon: { fontSize: 36 },
  jobTitleArea: { flex: 1, gap: 3 },
  categoryLabel: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  distance: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },
  description: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetLabel: { fontSize: FontSize.sm, color: Colors.textMuted },
  budgetValue: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.success },
  address: { fontSize: FontSize.sm, color: Colors.textMuted },
  actionRow: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, height: 50, borderRadius: 12, borderWidth: 1.5,
    borderColor: Colors.error, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.errorLight,
  },
  rejectText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.error },
  acceptBtn: {
    flex: 2, height: 50, borderRadius: 12,
    backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center',
  },
  acceptText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#fff' },
});
