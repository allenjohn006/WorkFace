// app/(customer)/booking-confirm.jsx
// Booking confirmation — job summary, worker card, cash payment, confirm button

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../src/lib/firebase';
import useAuthStore from '../../src/store/authStore';
import Button from '../../src/components/ui/Button';
import { useToast } from '../../src/components/ui/Toast';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/constants/theme';

export default function BookingConfirmScreen() {
  const { workerId, jobId } = useLocalSearchParams();
  const { user } = useAuthStore();
  const showToast = useToast();
  const [worker, setWorker] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [wSnap, jSnap] = await Promise.all([
        getDoc(doc(db, 'workers', workerId)),
        getDoc(doc(db, 'jobs', jobId)),
      ]);
      if (wSnap.exists()) setWorker(wSnap.data());
      if (jSnap.exists()) setJob({ id: jSnap.id, ...jSnap.data() });
    } catch (err) {
      showToast('Failed to load booking details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      // Assign worker to the job — worker will see it in their jobs list
      await updateDoc(doc(db, 'jobs', jobId), {
        workerId: worker.uid,
        workerName: worker.name,
        workerPhone: worker.phone,
        workerPhoto: worker.photoURL || null,
        status: 'accepted',
      });
      showToast('Booking confirmed! Waiting for worker.', 'success');
      router.replace({ pathname: '/(customer)/active-booking', params: { jobId } });
    } catch (err) {
      showToast('Failed to confirm booking. Please try again.', 'error');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: 24, color: Colors.textSecondary }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Confirm Booking</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Worker Card */}
        {worker && (
          <View style={styles.workerCard}>
            <Text style={styles.cardLabel}>You're booking</Text>
            <View style={styles.workerRow}>
              {worker.photoURL ? (
                <Image source={{ uri: worker.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={{ fontSize: 30 }}>👷</Text>
                </View>
              )}
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <Text style={styles.workerSkills}>
                  {worker.skills?.slice(0, 2).join(' · ')}
                </Text>
                <Text style={styles.workerExp}>⭐ {worker.rating?.toFixed(1) || '—'} · {worker.experience || 0} years exp</Text>
              </View>
              {worker.verificationStatus === 'verified' && (
                <View style={styles.verifiedPill}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Job Summary */}
        {job && (
          <View style={styles.jobCard}>
            <Text style={styles.cardLabel}>Job Details</Text>
            <View style={styles.detailRows}>
              <DetailRow icon="🔧" label="Service" value={job.categoryLabel} />
              <DetailRow icon="📍" label="Location" value={job.address} />
              <DetailRow icon="📝" label="Description" value={job.description} />
              <DetailRow
                icon="💰"
                label="Budget"
                value={`₹${job.budgetMin?.toLocaleString()} – ₹${job.budgetMax?.toLocaleString()}`}
              />
              <DetailRow
                icon="⚡"
                label="Urgency"
                value={job.urgency === 'urgent' ? '🔴 Urgent' : '🟢 Normal'}
              />
            </View>
          </View>
        )}

        {/* Payment Mode */}
        <View style={styles.paymentCard}>
          <Text style={styles.cardLabel}>Payment</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentIcon}>💵</Text>
            <View>
              <Text style={styles.paymentMode}>Cash on Completion</Text>
              <Text style={styles.paymentNote}>
                Pay directly to the worker after the job is done. No online payment required.
              </Text>
            </View>
          </View>
        </View>

        {/* Notice */}
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            ℹ️ By confirming, you agree to pay the worker the agreed amount in cash after job completion.
            Cancellation is free before the worker is en route.
          </Text>
        </View>

        <Button
          label="Confirm Booking ✓"
          onPress={handleConfirm}
          loading={confirming}
          size="lg"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <View style={drStyles.row}>
      <Text style={drStyles.icon}>{icon}</Text>
      <Text style={drStyles.label}>{label}</Text>
      <Text style={drStyles.value} numberOfLines={3}>{value}</Text>
    </View>
  );
}
const drStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 6 },
  icon: { fontSize: 16, width: 24, textAlign: 'center', marginTop: 1 },
  label: { fontSize: FontSize.sm, color: Colors.textMuted, width: 80, flexShrink: 0 },
  value: { fontSize: FontSize.sm, color: Colors.text, flex: 1, fontWeight: FontWeight.medium },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 8 },
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },
  pageTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  workerCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.8 },
  workerRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center',
  },
  workerInfo: { flex: 1, gap: 3 },
  workerName: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  workerSkills: { fontSize: FontSize.sm, color: Colors.textSecondary },
  workerExp: { fontSize: FontSize.sm, color: Colors.textSecondary },
  verifiedPill: {
    backgroundColor: Colors.successLight, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  verifiedText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.semibold },
  jobCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  detailRows: { gap: 4 },
  paymentCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  paymentRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  paymentIcon: { fontSize: 28 },
  paymentMode: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text },
  paymentNote: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, marginTop: 4 },
  notice: {
    backgroundColor: '#EEF4FF', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#C5D8F5',
  },
  noticeText: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
});
