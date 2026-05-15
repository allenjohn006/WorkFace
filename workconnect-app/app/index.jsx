// app/index.jsx
// App entry — redirects to correct screen based on auth and onboarding state

import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import useAuthStore from '../src/store/authStore';
import { Colors } from '../src/constants/theme';

export default function Index() {
  const { user, profile, isLoading } = useAuthStore();

  // Show spinner while auth state is being determined
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.primary }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  // Not logged in → go to splash/auth flow
  if (!user) {
    return <Redirect href="/(auth)/splash" />;
  }

  // Logged in but no profile → go to role selection
  if (!profile) {
    return <Redirect href="/(auth)/role-select" />;
  }

  // Profile exists but not onboarded → go to onboarding
  if (!profile.name) {
    if (profile.role === 'customer') {
      return <Redirect href="/(auth)/customer-onboarding" />;
    }
    return <Redirect href="/(auth)/worker-onboarding" />;
  }

  // Fully onboarded — go to role-specific home
  if (profile.role === 'worker') {
    return <Redirect href="/(worker)/jobs" />;
  }
  return <Redirect href="/(customer)/home" />;
}
