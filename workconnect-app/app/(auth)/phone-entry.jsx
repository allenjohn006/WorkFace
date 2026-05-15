// app/(auth)/phone-entry.jsx
// Phone number entry screen — +91 prefix fixed, Firebase Phone Auth

import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhoneAuthProvider, signInWithCredential, RecaptchaVerifier } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import Input from '../../src/components/ui/Input';
import Button from '../../src/components/ui/Button';
import { useToast } from '../../src/components/ui/Toast';
import { Colors, FontSize, FontWeight, Spacing } from '../../src/constants/theme';

export default function PhoneEntryScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const showToast = useToast();

  const handleSendOTP = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    setLoading(true);
    try {
      // Firebase Phone Auth — sends OTP via Firebase (free, uses Firebase quota)
      // NOTE: RecaptchaVerifier requires a DOM element on web. 
      // On React Native, use signInWithPhoneNumber directly.
      const { signInWithPhoneNumber } = await import('firebase/auth');
      const fullPhone = `+91${digits}`;
      const confirmation = await signInWithPhoneNumber(auth, fullPhone);

      // Navigate to OTP screen, pass confirmation object via router params
      // We store the verificationId — confirmation object cannot be serialized
      router.push({
        pathname: '/(auth)/otp-verify',
        params: { phone: fullPhone, verificationId: confirmation.verificationId },
      });
    } catch (err) {
      console.error('Phone auth error:', err);
      const msg =
        err.code === 'auth/too-many-requests'
          ? 'Too many attempts. Please try again later.'
          : err.code === 'auth/invalid-phone-number'
          ? 'Invalid phone number format.'
          : 'Failed to send OTP. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoEmoji}>🔗</Text>
            </View>
            <Text style={styles.title}>Welcome to WorkConnect</Text>
            <Text style={styles.subtitle}>
              Connect with trusted local workers near you
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enter your mobile number</Text>
            <Text style={styles.cardSubtitle}>
              We'll send you a verification code via SMS
            </Text>

            <View style={styles.phoneRow}>
              <View style={styles.prefixBox}>
                <Text style={styles.prefixText}>🇮🇳 +91</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  keyboardType="phone-pad"
                  maxLength={10}
                  autoFocus
                />
              </View>
            </View>

            <Button
              label="Send OTP"
              onPress={handleSendOTP}
              loading={loading}
              disabled={phone.length !== 10}
              size="lg"
              style={{ marginTop: 8 }}
            />

            <Text style={styles.disclaimer}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
              Standard SMS charges may apply.
            </Text>
          </View>

          {/* Features */}
          <View style={styles.features}>
            {[
              { icon: '✅', text: 'Verified local workers' },
              { icon: '💰', text: 'Cash payment — no hidden fees' },
              { icon: '📍', text: 'Workers near you in Kerala' },
            ].map((item) => (
              <View key={item.text} style={styles.featureRow}>
                <Text style={styles.featureIcon}>{item.icon}</Text>
                <Text style={styles.featureText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.md, gap: Spacing.lg },
  header: { alignItems: 'center', paddingTop: Spacing.lg, gap: 12 },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: { fontSize: 34 },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: Spacing.lg,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  phoneRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  prefixBox: {
    height: 52,
    paddingHorizontal: 14,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  prefixText: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  disclaimer: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  features: { gap: 12, paddingHorizontal: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: { fontSize: 20 },
  featureText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: FontWeight.medium },
});
