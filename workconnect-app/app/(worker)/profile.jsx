// app/(worker)/profile.jsx
// Worker profile tab — view worker profile, check verification status, logout

import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import { getWorkerProfile } from '../../src/services/userService';
import useAuthStore from '../../src/store/authStore';
import Button from '../../src/components/ui/Button';
import Badge from '../../src/components/ui/Badge';
import StarRating from '../../src/components/ui/StarRating';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, SERVICE_CATEGORIES } from '../../src/constants/theme';
import Constants from 'expo-constants';

export default function WorkerProfileScreen() {
  const { user, profile, clearAuth } = useAuthStore();
  const [workerData, setWorkerData] = useState(null);
  const [signingOut, setSigningOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        getWorkerProfile(user.uid).then((data) => setWorkerData(data));
      }
    }, [user])
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await signOut(auth);
          clearAuth();
          router.replace('/(auth)/splash');
        },
      },
    ]);
  };

  const getSkillLabel = (skillId) => SERVICE_CATEGORIES.find((c) => c.id === skillId)?.label || skillId;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          {workerData?.photoURL ? (
            <Image source={{ uri: workerData.photoURL }} style={styles.avatarCircle} />
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 36, color: '#fff' }}>👷</Text>
            </View>
          )}
          <Text style={styles.name}>{profile?.name || 'Worker'}</Text>
          <Text style={styles.phone}>{user?.phoneNumber || '—'}</Text>

          <View style={styles.badgesRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>🔧 Worker</Text>
            </View>
            {workerData && <Badge type={workerData.verificationStatus} />}
          </View>
        </View>

        {/* Verification Alert */}
        {workerData?.verificationStatus === 'pending' && (
          <View style={styles.alertCard}>
            <Text style={styles.alertTitle}>Verification Pending</Text>
            <Text style={styles.alertText}>
              Your profile is currently under review by our admin team. Once verified, a green badge will appear on your public profile.
            </Text>
          </View>
        )}

        {workerData?.verificationStatus === 'rejected' && (
          <View style={[styles.alertCard, { backgroundColor: Colors.errorLight, borderColor: Colors.error }]}>
            <Text style={[styles.alertTitle, { color: Colors.error }]}>Verification Rejected</Text>
            <Text style={[styles.alertText, { color: Colors.error }]}>
              Please contact support to resolve the issue with your profile.
            </Text>
          </View>
        )}

        {/* Worker Stats & Settings */}
        {workerData && (
          <View style={styles.infoCard}>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Rating</Text>
                <View style={styles.ratingRow}>
                  <Text style={styles.statValue}>{workerData.rating?.toFixed(1) || '0.0'}</Text>
                  <StarRating rating={workerData.rating || 0} size={14} />
                </View>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Jobs Done</Text>
                <Text style={styles.statValue}>{workerData.totalJobs || 0}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <InfoRow icon="📍" label="Service Radius" value={`${workerData.serviceRadius || 10} km`} />
            <View style={styles.divider} />
            <InfoRow icon="📅" label="Experience" value={`${workerData.experience || 0} years`} />
            <View style={styles.divider} />
            <View style={{ paddingVertical: 8 }}>
              <Text style={styles.skillsLabel}>SKILLS</Text>
              <View style={styles.skillsWrap}>
                {workerData.skills?.map((s) => (
                  <View key={s} style={styles.skillChip}>
                    <Text style={styles.skillText}>{getSkillLabel(s)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* App Info */}
        <View style={styles.infoCard}>
          <InfoRow icon="ℹ️" label="App Version" value={Constants.expoConfig?.version || '1.0.0'} />
        </View>

        <Button
          label="Logout"
          variant="outline"
          onPress={handleLogout}
          loading={signingOut}
          style={{ borderColor: Colors.error, marginTop: 10 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={irStyles.row}>
      <Text style={irStyles.icon}>{icon}</Text>
      <View style={irStyles.content}>
        <Text style={irStyles.label}>{label}</Text>
        <Text style={irStyles.value}>{value}</Text>
      </View>
    </View>
  );
}

const irStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  icon: { fontSize: 20 },
  content: { flex: 1 },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium, marginTop: 2 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  profileHeader: {
    alignItems: 'center', gap: 8, paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: Colors.primary },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  phone: { fontSize: FontSize.md, color: Colors.textSecondary },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  roleBadge: {
    backgroundColor: '#FFF3EE', borderRadius: BorderRadius.full,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  roleText: { fontSize: FontSize.sm, color: Colors.accent, fontWeight: FontWeight.semibold },
  alertCard: {
    backgroundColor: '#FFF9C4', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F9A825', gap: 6,
  },
  alertTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: '#F57F17' },
  alertText: { fontSize: FontSize.sm, color: '#5D4037', lineHeight: 20 },
  infoCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  divider: { height: 1, backgroundColor: Colors.divider, marginVertical: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.divider },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  skillsLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    backgroundColor: Colors.background, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
  },
  skillText: { fontSize: FontSize.sm, color: Colors.text, fontWeight: FontWeight.medium },
});
