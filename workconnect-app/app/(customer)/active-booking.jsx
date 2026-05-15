// app/(customer)/active-booking.jsx
// Real-time job status tracker + worker call button + cancel option

import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listenToJob, cancelJob } from '../../src/services/jobService';
import Button from '../../src/components/ui/Button';
import { useToast } from '../../src/components/ui/Toast';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/constants/theme';

const STATUS_STEPS = [
  { key: 'accepted', label: 'Booking Confirmed', icon: '✅', desc: 'Worker has accepted your request' },
  { key: 'in_progress', label: 'Worker Arrived', icon: '🚗', desc: 'Worker is at your location' },
  { key: 'completed', label: 'Job Completed', icon: '🎉', desc: 'Great! Job has been completed' },
];

function getStepIndex(status) {
  if (status === 'accepted') return 0;
  if (status === 'in_progress') return 1;
  if (status === 'completed') return 2;
  return -1;
}

export default function ActiveBookingScreen() {
  const { jobId } = useLocalSearchParams();
  const [job, setJob] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const unsubscribeRef = useRef(null);
  const showToast = useToast();

  useEffect(() => {
    if (!jobId) return;
    // Real-time listener — stays in sync with worker updates
    unsubscribeRef.current = listenToJob(jobId, (updatedJob) => {
      setJob(updatedJob);
      // Navigate to review screen when job is completed
      if (updatedJob.status === 'completed') {
        setTimeout(() => {
          router.replace({ pathname: '/(customer)/review', params: { jobId, workerId: updatedJob.workerId } });
        }, 1500);
      }
    });
    return () => unsubscribeRef.current?.();
  }, [jobId]);

  const handleCall = () => {
    if (!job?.workerPhone) return;
    Linking.openURL(`tel:${job.workerPhone}`);
  };

  const handleCancel = () => {
    if (job?.status === 'in_progress') {
      showToast('Cannot cancel — worker has already arrived.', 'error');
      return;
    }
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this job?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelJob(jobId);
              showToast('Booking cancelled.', 'info');
              router.replace('/(customer)/bookings');
            } catch {
              showToast('Failed to cancel. Please try again.', 'error');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (!job) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 24, color: Colors.textSecondary }}>Loading booking...</Text>
      </SafeAreaView>
    );
  }

  const currentStep = getStepIndex(job.status);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Active Booking</Text>
          <Text style={styles.jobId}>#{jobId?.slice(-6).toUpperCase()}</Text>
        </View>

        {/* Status Tracker */}
        <View style={styles.trackerCard}>
          <Text style={styles.trackerTitle}>Job Progress</Text>
          {STATUS_STEPS.map((step, idx) => {
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;
            const isPending = idx > currentStep;
            return (
              <View key={step.key} style={styles.stepRow}>
                {/* Connector line */}
                <View style={styles.stepLeft}>
                  <View style={[
                    styles.stepCircle,
                    isDone && styles.stepDone,
                    isActive && styles.stepActive,
                    isPending && styles.stepPending,
                  ]}>
                    <Text style={styles.stepIcon}>{isDone ? '✓' : step.icon}</Text>
                  </View>
                  {idx < STATUS_STEPS.length - 1 && (
                    <View style={[styles.connector, isDone && styles.connectorDone]} />
                  )}
                </View>
                <View style={styles.stepContent}>
                  <Text style={[styles.stepLabel, isActive && { color: Colors.primary }]}>
                    {step.label}
                  </Text>
                  {isActive && <Text style={styles.stepDesc}>{step.desc}</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Worker Info */}
        <View style={styles.workerCard}>
          <Text style={styles.sectionLabel}>Your Worker</Text>
          <Text style={styles.workerName}>{job.workerName || 'Worker'}</Text>
          <TouchableOpacity onPress={handleCall} style={styles.callBtn} activeOpacity={0.8}>
            <Text style={styles.callIcon}>📞</Text>
            <Text style={styles.callText}>Call Worker</Text>
          </TouchableOpacity>
        </View>

        {/* Job Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>Job Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Service</Text>
            <Text style={styles.summaryVal}>{job.categoryLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Location</Text>
            <Text style={styles.summaryVal}>{job.address}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Budget</Text>
            <Text style={styles.summaryVal}>₹{job.budgetMin} – ₹{job.budgetMax}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>Payment</Text>
            <Text style={styles.summaryVal}>💵 Cash</Text>
          </View>
        </View>

        {/* Cancel Button — only before in_progress */}
        {job.status === 'accepted' && (
          <Button
            label="Cancel Booking"
            variant="outline"
            onPress={handleCancel}
            loading={cancelling}
            style={{ borderColor: Colors.error }}
          />
        )}

        {job.status === 'completed' && (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>🎉 Job Completed! Redirecting to review...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  jobId: { fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: FontWeight.medium },
  trackerCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 20, gap: 0,
    borderWidth: 1, borderColor: Colors.border,
  },
  trackerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 16 },
  stepRow: { flexDirection: 'row', gap: 16, minHeight: 70 },
  stepLeft: { alignItems: 'center', gap: 0 },
  stepCircle: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2,
  },
  stepDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  stepActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  stepPending: { backgroundColor: Colors.background, borderColor: Colors.border },
  stepIcon: { fontSize: 16, color: '#fff' },
  connector: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4 },
  connectorDone: { backgroundColor: Colors.success },
  stepContent: { flex: 1, paddingTop: 8, gap: 4 },
  stepLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  stepDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  workerCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  workerName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.successLight, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  callIcon: { fontSize: 22 },
  callText: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.success },
  summaryCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 3 },
  summaryKey: { fontSize: FontSize.sm, color: Colors.textMuted, width: 80 },
  summaryVal: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium, flex: 1, textAlign: 'right' },
  completedBanner: {
    backgroundColor: Colors.successLight, borderRadius: 12, padding: 16, alignItems: 'center',
  },
  completedText: { fontSize: FontSize.md, color: Colors.success, fontWeight: FontWeight.bold },
});
