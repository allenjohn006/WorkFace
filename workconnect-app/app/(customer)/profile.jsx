// app/(customer)/profile.jsx
// Customer profile tab — view/edit profile, logout

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signOut } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import useAuthStore from '../../src/store/authStore';
import Button from '../../src/components/ui/Button';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/constants/theme';
import Constants from 'expo-constants';

export default function CustomerProfileScreen() {
  const { user, profile, clearAuth } = useAuthStore();
  const [signingOut, setSigningOut] = useState(false);

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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {profile?.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.name}>{profile?.name || 'Customer'}</Text>
          <Text style={styles.phone}>{user?.phoneNumber || '—'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>🙋 Customer</Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.infoCard}>
          <InfoRow icon="📍" label="Default Address" value={profile?.address || 'Not set'} />
          <View style={styles.divider} />
          <InfoRow icon="📮" label="Pincode" value={profile?.pincode || 'Not set'} />
          <View style={styles.divider} />
          <InfoRow icon="📱" label="Phone" value={user?.phoneNumber || '—'} />
        </View>

        {/* Quick Links */}
        <View style={styles.linksCard}>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(customer)/bookings')}>
            <Text style={styles.linkIcon}>📋</Text>
            <Text style={styles.linkLabel}>My Bookings</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/(customer)/post-request')}>
            <Text style={styles.linkIcon}>➕</Text>
            <Text style={styles.linkLabel}>Post New Request</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.infoCard}>
          <InfoRow icon="ℹ️" label="App Version" value={Constants.expoConfig?.version || '1.0.0'} />
          <View style={styles.divider} />
          <InfoRow icon="🌴" label="Market" value="Kerala, India" />
        </View>

        <Button
          label="Logout"
          variant="outline"
          onPress={handleLogout}
          loading={signingOut}
          style={{ borderColor: Colors.error }}
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
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  icon: { fontSize: 20, marginTop: 2 },
  content: { flex: 1, gap: 2 },
  label: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  profileHeader: {
    alignItems: 'center', gap: 8, paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: Colors.border,
  },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { fontSize: 36, color: '#fff', fontWeight: FontWeight.extrabold },
  name: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  phone: { fontSize: FontSize.md, color: Colors.textSecondary },
  roleBadge: {
    backgroundColor: '#EEF4FF', borderRadius: BorderRadius.full,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  roleText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },
  infoCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, gap: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  linksCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  divider: { height: 1, backgroundColor: Colors.divider },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  linkIcon: { fontSize: 20 },
  linkLabel: { flex: 1, fontSize: FontSize.md, color: Colors.text, fontWeight: FontWeight.medium },
  linkArrow: { fontSize: 18, color: Colors.textMuted },
});
