// app/_layout.jsx
// Root layout — initializes Firebase Auth listener, handles navigation routing based on auth state

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/lib/firebase';
import { getUserProfile } from '../src/services/userService';
import useAuthStore from '../src/store/authStore';
import { ToastContainer } from '../src/components/ui/Toast';
import '../global.css';

export default function RootLayout() {
  const { setUser, setProfile, setLoading, clearAuth } = useAuthStore();

  useEffect(() => {
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Fetch Firestore profile to get role, name, etc.
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          setProfile(profile);
        } catch (err) {
          console.error('Failed to fetch profile:', err);
          setProfile(null);
        }
      } else {
        clearAuth();
      }
      setLoading(false);
    });

    return unsubscribe; // cleanup listener on unmount
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(customer)" />
          <Stack.Screen name="(worker)" />
        </Stack>
        {/* Global toast overlay — rendered on top of everything */}
        <ToastContainer />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
