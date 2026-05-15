// app/(auth)/splash.jsx
// SplashScreen — WorkConnect logo with auto-redirect after 2.5s

import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import useAuthStore from '../../src/store/authStore';
import { Colors, FontSize, FontWeight } from '../../src/constants/theme';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const { user, profile, isLoading } = useAuthStore();

  // Animation values
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Redirect after 2.5 seconds — only after auth state is resolved
    const timer = setTimeout(() => {
      if (isLoading) return; // Wait for auth to resolve
      navigate();
    }, 2500);

    return () => clearTimeout(timer);
  }, [isLoading]);

  function navigate() {
    if (!user) {
      router.replace('/(auth)/phone-entry');
    } else if (!profile?.name) {
      router.replace('/(auth)/role-select');
    } else if (profile.role === 'worker') {
      router.replace('/(worker)/jobs');
    } else {
      router.replace('/(customer)/home');
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Decorative circles */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      {/* Logo */}
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoEmoji}>🔗</Text>
        </View>
      </Animated.View>

      {/* Brand name */}
      <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
        <Text style={styles.brandName}>WorkConnect</Text>
        <View style={styles.accentBar} />
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Your neighbourhood workforce, on demand
      </Animated.Text>

      {/* Kerala badge */}
      <Animated.View style={[styles.keralaBadge, { opacity: taglineOpacity }]}>
        <Text style={styles.keralaText}>🌴 Serving Kerala first</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  circleTopRight: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  circleBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  logoContainer: { marginBottom: 8 },
  logoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoEmoji: { fontSize: 52 },
  brandName: {
    fontSize: 38,
    fontWeight: FontWeight.extrabold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  accentBar: {
    width: 60,
    height: 4,
    backgroundColor: Colors.accent,
    borderRadius: 2,
    marginTop: 8,
  },
  tagline: {
    fontSize: FontSize.md,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
    fontWeight: FontWeight.medium,
  },
  keralaBadge: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  keralaText: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: FontWeight.medium,
  },
});
