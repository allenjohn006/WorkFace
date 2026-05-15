// src/components/ui/Toast.jsx
// Global toast notification system using Zustand + animated overlay

import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, SafeAreaView } from 'react-native';
import { create } from 'zustand';
import { Colors, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

// Zustand store for toast state
export const useToastStore = create((set) => ({
  toast: null,
  showToast: (message, type = 'success', duration = 3000) => {
    set({ toast: { message, type, id: Date.now() } });
    setTimeout(() => set({ toast: null }), duration);
  },
}));

// Hook for easy toast usage anywhere in the app
export const useToast = () => useToastStore((s) => s.showToast);

const TYPE_STYLES = {
  success: { bg: Colors.success, icon: '✓' },
  error: { bg: Colors.error, icon: '✕' },
  info: { bg: Colors.primary, icon: 'ℹ' },
  warning: { bg: Colors.warning, icon: '⚠' },
};

/** Render this once in the root layout */
export function ToastContainer() {
  const toast = useToastStore((s) => s.toast);
  const slideY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY, { toValue: -100, duration: 250, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [toast]);

  if (!toast) return null;
  const variant = TYPE_STYLES[toast.type] || TYPE_STYLES.info;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: variant.bg, transform: [{ translateY: slideY }], opacity },
      ]}
    >
      <Text style={styles.icon}>{variant.icon}</Text>
      <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  icon: { fontSize: 16, color: '#fff', fontWeight: FontWeight.bold },
  message: {
    flex: 1,
    fontSize: FontSize.sm,
    color: '#fff',
    fontWeight: FontWeight.medium,
  },
});
