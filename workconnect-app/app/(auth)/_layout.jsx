// app/(auth)/_layout.jsx
// Auth group layout — no header, light status bar

import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="phone-entry" />
      <Stack.Screen name="otp-verify" />
      <Stack.Screen name="role-select" />
      <Stack.Screen name="customer-onboarding" />
      <Stack.Screen name="worker-onboarding" />
    </Stack>
  );
}
