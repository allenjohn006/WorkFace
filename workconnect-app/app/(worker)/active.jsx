// app/(worker)/active.jsx
// Worker's active job screen — status update buttons + customer call + open maps

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import { listenToJob, updateJobStatus } from '../../src/services/jobService';
import { updateWorkerAvailability } from '../../src/services/userService';
import useAuthStore from '../../src/store/authStore';
import Button from '../../src/components/ui/Button';
import { useToast } from '../../src/components/ui/Toast';
import { openInMaps } from '../../src/utils/location';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/constants/theme';

const STATUS_FLOW = [
  { from: 'accepted', action: "I'm On My Way", nextStatus: 'in_progress', icon: '🚗', color: Colors.primary },
  { from: 'in_progress', action: 'Mark Job Complete', nextStatus: 'completed', icon: '✅', color: Colors.success },
];

export default function WorkerActiveScreen() {
  const { jobId: paramJobId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const showToast = useToast();

  const [job, setJob] = useState(null);
  const [activeJobId, setActiveJobId] = useState(paramJobId || null);
  const [updating, setUpdating] = useState(false);
  const unsubRef = useRef(null);

  // On focus: find worker's current active job if no jobId param
  useFocusEffect(
    useCallback(() => {
      if (activeJobId) {
        subscribeToJob(activeJobId);
      } else {
        findActiveJob();
      }
      return () => unsubRef.current?.();
    }, [activeJobId])
  );

  const findActiveJob = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(
        query(
          collection(db, 'jobs'),
          where('workerId', '==', user.uid),
          where('status', 'in', ['accepted', 'in_progress']),
          orderBy('acceptedAt', 'desc'),
          limit(1)
        )
      );
      if (!snap.empty) {
        const found = snap.docs[0];
        setActiveJobId(found.id);
        subscribeToJob(found.id);
      }
    } catch (err) {
      console.error('findActiveJob:', err);
    }
  };

  const subscribeToJob = (jId) => {
    unsubRef.current?.();
    unsubRef.current = listenToJob(jId, (updatedJob) => {
      setJob(updatedJob);
      // If job was completed/cancelled externally, clear state
      if (updatedJob.status === 'completed' || updatedJob.status === 'cancelled') {
        setTimeout(() => setJob(null), 3000);
      }
    });
  };

  const handleStatusUpdate = async () => {
    if (!job) return;
    const step = STATUS_FLOW.find((s) => s.from === job.status);
    if (!step) return;

    if (step.nextStatus === 'completed') {
      Alert.alert(
        'Complete Job?',
        'Confirm that the job is fully completed and payment received.',
        [
          { text: 'Not yet', style: 'cancel' },
          { text: 'Yes, Complete', onPress: () => doStatusUpdate(step) },
        ]
      );
    } else {
      doStatusUpdate(step);
    }
  };

  const doStatusUpdate = async (step) => {
    setUpdating(true);
    try {
      await updateJobStatus(activeJobId, step.nextStatus);
      showToast(
        step.nextStatus === 'in_progress' ? '🚗 Customer notified — heading to location!' :
        '🎉 Job completed! Great work.',
        'success'
      );
      if (step.nextStatus === 'completed') {
        // Worker goes back to available after completing
        await updateWorkerAvailability(user.uid, 'available');
        setActiveJobId(null);
        setJob(null);
      }
    } catch (err) {
      showToast('Failed to update status. Try again.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleCall = () => {
    if (!job?.customerPhone) {
      showToast('Customer phone not available', 'error');
      return;
    }
    Linking.openURL(`tel:${job.customerPhone}`);
  };

  const handleOpenMaps = () => {
    if (!job?.location) return;
    openInMaps(job.location.lat, job.location.lng, job.address);
  };

  const currentStep = STATUS_FLOW.find((s) => s.from === job?.status);

  if (!job && !activeJobId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.noJobContainer}>
          <Text style={styles.noJobEmoji}>🏖️</Text>
          <Text style={styles.noJobTitle}>No active job</Text>
          <Text style={styles.noJobSubtitle}>
            Accept a job from the Jobs tab to see it here
          </Text>
          <Button
            label="Go to Jobs"
            onPress={() => router.push('/(worker)/jobs')}
            style={{ marginTop: 20 }}
            fullWidth={false}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 24, color: Colors.textSecondary }}>Loading job...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Active Job</Text>
          <View style={[styles.statusPill, { backgroundColor: job.status === 'accepted' ? '#EEF4FF' : Colors.successLight }]}>
            <Text style={[styles.statusText, { color: job.status === 'accepted' ? Colors.primary : Colors.success }]}>
              {job.status === 'accepted' ? '✅ Accepted' : '🚗 In Progress'}
            </Text>
          </View>
        </View>

        {/* Customer Info */}
        <View style={styles.customerCard}>
          <Text style={styles.cardLabel}>Customer</Text>
          <Text style={styles.customerName}>{job.customerName || 'Customer'}</Text>
          <TouchableOpacity onPress={handleCall} style={styles.callBtn} activeOpacity={0.85}>
            <Text style={styles.callIcon}>📞</Text>
            <Text style={styles.callText}>Call Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Location Card */}
        <View style={styles.locationCard}>
          <Text style={styles.cardLabel}>Job Location</Text>
          <Text style={styles.address}>{job.address}</Text>
          <TouchableOpacity onPress={handleOpenMaps} style={styles.mapsBtn} activeOpacity={0.85}>
            <Text style={styles.mapsIcon}>🗺️</Text>
            <Text style={styles.mapsText}>Open in Google Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Job Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardLabel}>Job Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Service</Text>
            <Text style={styles.detailVal}>{job.categoryLabel}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Description</Text>
            <Text style={styles.detailVal}>{job.description}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Budget</Text>
            <Text style={[styles.detailVal, { color: Colors.success, fontWeight: FontWeight.bold }]}>
              ₹{job.budgetMin?.toLocaleString()} – ₹{job.budgetMax?.toLocaleString()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Payment</Text>
            <Text style={styles.detailVal}>💵 Cash on completion</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailKey}>Job ID</Text>
            <Text style={styles.detailVal}>#{activeJobId?.slice(-6).toUpperCase()}</Text>
          </View>
        </View>

        {/* Payment reminder */}
        <View style={styles.paymentReminder}>
          <Text style={styles.reminderText}>
            💡 Collect cash payment from the customer before or right after completing the job.
          </Text>
        </View>

        {/* Status Update Button */}
        {currentStep && (
          <Button
            label={`${currentStep.icon} ${currentStep.action}`}
            onPress={handleStatusUpdate}
            loading={updating}
            size="lg"
            style={{ backgroundColor: currentStep.color }}
          />
        )}

        {job.status === 'completed' && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>🎉 Job Completed! Well done.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  noJobContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  noJobEmoji: { fontSize: 64 },
  noJobTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  noJobSubtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  statusPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full },
  statusText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  cardLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  customerCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  customerName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.successLight, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  callIcon: { fontSize: 22 },
  callText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.success },
  locationCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  address: { fontSize: FontSize.md, color: Colors.text, lineHeight: 22 },
  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#EEF4FF', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  mapsIcon: { fontSize: 22 },
  mapsText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.primary },
  detailsCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  detailRow: { flexDirection: 'row', gap: 12, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  detailKey: { fontSize: FontSize.sm, color: Colors.textMuted, width: 90, flexShrink: 0 },
  detailVal: { fontSize: FontSize.sm, color: Colors.text, flex: 1 },
  paymentReminder: { backgroundColor: '#FFF9C4', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#F9A825' },
  reminderText: { fontSize: FontSize.sm, color: '#5D4037', lineHeight: 20 },
  completedBanner: { backgroundColor: Colors.successLight, borderRadius: 12, padding: 16, alignItems: 'center' },
  completedText: { fontSize: FontSize.md, color: Colors.success, fontWeight: FontWeight.bold },
});
