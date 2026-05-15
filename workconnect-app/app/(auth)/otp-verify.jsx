// app/(auth)/otp-verify.jsx
// OTP verification — 6-digit input, 30-second resend timer

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../../src/lib/firebase';
import Button from '../../src/components/ui/Button';
import { useToast } from '../../src/components/ui/Toast';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../src/constants/theme';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function OTPVerifyScreen() {
  const { phone, verificationId } = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef([]);
  const showToast = useToast();

  useEffect(() => {
    if (resendTimer <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleOtpChange = useCallback((text, index) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
    if (digit && index === OTP_LENGTH - 1) {
      const full = [...newOtp.slice(0, -1), digit].join('');
      if (full.length === OTP_LENGTH) verifyOtp(full);
    }
  }, [otp]);

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  const verifyOtp = async (code) => {
    if (code.length !== OTP_LENGTH) { showToast('Enter the full 6-digit OTP', 'error'); return; }
    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await signInWithCredential(auth, credential);
    } catch (err) {
      const msg = err.code === 'auth/invalid-verification-code' ? 'Incorrect OTP.'
        : err.code === 'auth/code-expired' ? 'OTP expired. Request a new one.'
        : 'Verification failed. Try again.';
      showToast(msg, 'error');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const otpString = otp.join('');

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.header}>
            <Text style={styles.lockEmoji}>🔐</Text>
            <Text style={styles.title}>Verify your number</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to{'\n'}<Text style={styles.phone}>{phone}</Text>
            </Text>
          </View>
          <View style={styles.otpRow}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(r) => (inputs.current[index] = r)}
                style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                value={digit}
                onChangeText={(t) => handleOtpChange(t, index)}
                onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(key, index)}
                keyboardType="number-pad"
                maxLength={2}
                selectTextOnFocus
                autoFocus={index === 0}
              />
            ))}
          </View>
          <Button label="Verify OTP" onPress={() => verifyOtp(otpString)} loading={loading}
            disabled={otpString.length !== OTP_LENGTH} size="lg" />
          <View style={styles.resendRow}>
            {canResend ? (
              <TouchableOpacity onPress={() => router.back()} style={styles.resendBtn}>
                <Text style={styles.resendActive}>Resend OTP</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendTimer}>
                Resend in <Text style={{ color: Colors.primary, fontWeight: FontWeight.bold }}>{resendTimer}s</Text>
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, padding: Spacing.md, gap: Spacing.lg, paddingTop: 12 },
  backBtn: { paddingVertical: 8, alignSelf: 'flex-start' },
  backText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.semibold },
  header: { alignItems: 'center', gap: 10, paddingVertical: Spacing.md },
  lockEmoji: { fontSize: 60 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  phone: { color: Colors.primary, fontWeight: FontWeight.bold },
  otpRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', paddingVertical: 8 },
  otpBox: {
    width: 48, height: 58, borderRadius: BorderRadius.md, borderWidth: 2,
    borderColor: Colors.border, backgroundColor: Colors.surface,
    fontSize: 24, fontWeight: FontWeight.bold, textAlign: 'center', color: Colors.text,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: '#EEF4FF' },
  resendRow: { alignItems: 'center', paddingVertical: 4 },
  resendTimer: { fontSize: FontSize.md, color: Colors.textSecondary },
  resendBtn: { padding: 8 },
  resendActive: { fontSize: FontSize.md, color: Colors.primary, fontWeight: FontWeight.bold },
});
