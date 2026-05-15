// app/(auth)/role-select.jsx
// Role selection — two large cards: Customer or Worker

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../src/lib/firebase';
import useAuthStore from '../../src/store/authStore';
import Button from '../../src/components/ui/Button';
import { useToast } from '../../src/components/ui/Toast';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/constants/theme';

const ROLES = [
  {
    id: 'customer',
    emoji: '🙋',
    title: 'I need help',
    subtitle: 'Find skilled workers near you for home repairs, cleaning, and more',
    color: Colors.primary,
    lightColor: '#EEF4FF',
    bullets: ['Post job requests', 'Browse nearby workers', 'Track jobs in real-time'],
  },
  {
    id: 'worker',
    emoji: '🔧',
    title: 'I offer services',
    subtitle: 'Get hired for jobs in your area and grow your income',
    color: Colors.accent,
    lightColor: '#FFF3EE',
    bullets: ['Receive job requests', 'Set your availability', 'Track your earnings'],
  },
];

export default function RoleSelectScreen() {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, setProfile } = useAuthStore();
  const showToast = useToast();

  const handleContinue = async () => {
    if (!selected || !user) return;
    setLoading(true);
    try {
      const profileData = {
        uid: user.uid,
        phone: user.phoneNumber,
        role: selected,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
      setProfile(profileData);

      if (selected === 'customer') {
        router.replace('/(auth)/customer-onboarding');
      } else {
        router.replace('/(auth)/worker-onboarding');
      }
    } catch (err) {
      showToast('Failed to save role. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>How will you use WorkConnect?</Text>
          <Text style={styles.subtitle}>Choose your role — you can always use both later</Text>
        </View>

        {ROLES.map((role) => {
          const isSelected = selected === role.id;
          return (
            <TouchableOpacity
              key={role.id}
              onPress={() => setSelected(role.id)}
              activeOpacity={0.85}
              style={[
                styles.card,
                isSelected && { borderColor: role.color, borderWidth: 2.5, backgroundColor: role.lightColor },
              ]}
            >
              {/* Check mark */}
              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: role.color }]}>
                  <Text style={styles.checkMark}>✓</Text>
                </View>
              )}

              <View style={[styles.iconCircle, { backgroundColor: isSelected ? role.color : Colors.background }]}>
                <Text style={styles.emoji}>{role.emoji}</Text>
              </View>

              <Text style={[styles.roleTitle, isSelected && { color: role.color }]}>{role.title}</Text>
              <Text style={styles.roleSubtitle}>{role.subtitle}</Text>

              <View style={styles.bullets}>
                {role.bullets.map((b) => (
                  <View key={b} style={styles.bulletRow}>
                    <Text style={[styles.bulletDot, { color: role.color }]}>●</Text>
                    <Text style={styles.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          );
        })}

        <Button
          label="Continue →"
          onPress={handleContinue}
          loading={loading}
          disabled={!selected}
          size="lg"
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.md, paddingBottom: 40 },
  header: { alignItems: 'center', paddingVertical: Spacing.md, gap: 8 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 24,
    borderWidth: 1.5, borderColor: Colors.border, gap: 10,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, position: 'relative',
  },
  checkBadge: {
    position: 'absolute', top: 16, right: 16,
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: FontWeight.bold },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  emoji: { fontSize: 32 },
  roleTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.text },
  roleSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20 },
  bullets: { gap: 6, marginTop: 4 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletDot: { fontSize: 8 },
  bulletText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});
