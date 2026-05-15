// app/(auth)/customer-onboarding.jsx
// Customer profile setup — name + default address

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { upsertUserProfile } from '../../src/services/userService';
import useAuthStore from '../../src/store/authStore';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { useToast } from '../../src/components/ui/Toast';
import { Colors, FontSize, FontWeight, Spacing } from '../../src/constants/theme';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  address: z.string().min(5, 'Please enter your full address').max(200),
  pincode: z.string().length(6, 'Pincode must be 6 digits').regex(/^\d+$/, 'Only digits allowed'),
});

export default function CustomerOnboardingScreen() {
  const { user, setProfile, profile } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', address: '', pincode: '' },
  });

  const onSubmit = async (data) => {
    if (!user) return;
    setLoading(true);
    try {
      const updatedProfile = {
        ...profile,
        name: data.name.trim(),
        address: data.address.trim(),
        pincode: data.pincode,
        role: 'customer',
      };
      await upsertUserProfile(user.uid, updatedProfile);
      setProfile(updatedProfile);
      showToast('Profile saved!', 'success');
      router.replace('/(customer)/home');
    } catch (err) {
      showToast('Failed to save profile. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Progress indicator */}
          <View style={styles.progressRow}>
            {[1, 2, 3].map((step) => (
              <View key={step} style={[styles.progressDot, step === 1 && styles.progressActive]} />
            ))}
          </View>

          <View style={styles.header}>
            <Text style={styles.emoji}>👤</Text>
            <Text style={styles.title}>Set up your profile</Text>
            <Text style={styles.subtitle}>Help workers know who they're serving</Text>
          </View>

          <View style={styles.form}>
            <Controller
              control={control} name="name"
              render={({ field: { onChange, value } }) => (
                <Input label="Full Name" value={value} onChangeText={onChange}
                  placeholder="e.g. Rahul Kumar" error={errors.name?.message} autoFocus />
              )}
            />
            <Controller
              control={control} name="address"
              render={({ field: { onChange, value } }) => (
                <Input label="Default Address" value={value} onChangeText={onChange}
                  placeholder="House no., Street, Area, City"
                  error={errors.address?.message} multiline numberOfLines={3} />
              )}
            />
            <Controller
              control={control} name="pincode"
              render={({ field: { onChange, value } }) => (
                <Input label="Pincode" value={value} onChangeText={onChange}
                  placeholder="682001" keyboardType="number-pad" maxLength={6}
                  error={errors.pincode?.message} />
              )}
            />
          </View>

          <Button label="Get Started →" onPress={handleSubmit(onSubmit)} loading={loading} size="lg" />

          <Text style={styles.note}>
            📍 You'll be asked for GPS location when posting a job — this helps find the nearest workers
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 40 },
  progressRow: { flexDirection: 'row', gap: 8, justifyContent: 'center', paddingTop: 8 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  progressActive: { backgroundColor: Colors.primary, width: 24 },
  header: { alignItems: 'center', gap: 10 },
  emoji: { fontSize: 56 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text, textAlign: 'center' },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  form: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: Spacing.lg, gap: Spacing.md,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  note: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
