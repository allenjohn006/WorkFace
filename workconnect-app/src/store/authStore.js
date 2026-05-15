// src/store/authStore.js
// Zustand global auth state — single source of truth for user session

import { create } from 'zustand';

const useAuthStore = create((set) => ({
  user: null,           // Firebase Auth user object
  profile: null,        // Firestore user profile {uid, name, phone, role}
  isLoading: true,      // True during initial auth state check
  isOnboarded: false,   // True once user has completed profile setup

  setUser: (user) => set({ user }),
  setProfile: (profile) =>
    set({ profile, isOnboarded: !!profile?.name }),
  setLoading: (isLoading) => set({ isLoading }),
  
  clearAuth: () =>
    set({ user: null, profile: null, isOnboarded: false, isLoading: false }),
}));

export default useAuthStore;
