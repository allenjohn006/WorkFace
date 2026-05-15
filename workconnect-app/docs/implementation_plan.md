# WorkConnect Implementation Plan

This document outlines the architecture, constraints, and step-by-step development plan for WorkConnect, a local workforce matching platform for semi-urban/rural India.

## Tech Stack
- **App**: React Native + Expo SDK 51, Expo Router, NativeWind (Tailwind), Zustand, React Hook Form + Zod.
- **Backend**: Firebase FREE Spark Plan (Auth, Firestore, Storage).
- **Admin**: React + Vite + Tailwind CSS.

## Location Strategy (Zero Cost)
- Get coordinates using `expo-location` (one-time fetch).
- Convert to geohash using `geofire-common` and query Firestore for nearby workers.
- Calculate distance using a custom pure JS **Haversine formula** utility function to display text distances (e.g., "2.3 km away").
- Provide an "Open in Maps" button utilizing `Linking.openURL('https://maps.google.com/?q=LAT,LNG')` to open the native map app without using any API keys.

## Phased Development Plan

### Phase 1: Project Setup & Architecture
- [x] Initialize `/workconnect-app` (Expo SDK 54 - updated from 51 due to dependencies, Expo Router, NativeWind, Zustand, Firebase SDKs).
- [x] Initialize `/workconnect-admin` (React, Vite, Tailwind CSS).
- [x] Set up directory structure, environment variables (`.env`), and theme constants (Colors, Typography).
- [x] Set up Firebase initialization (`src/lib/firebase.js`).
- [x] Set up Zustand stores (`src/store/authStore.js`, `src/store/jobStore.js`).
- [x] Set up Firestore services (`src/services/userService.js`, `src/services/jobService.js`).
- [x] Create reusable UI components (Button, Input, Badge, SkeletonLoader, Toast, EmptyState, StarRating).

### Phase 2: Authentication Flow (Shared)
- [x] `app/index.jsx` & `app/_layout.jsx`: Root routing and auth state listener.
- [x] `SplashScreen` (`app/(auth)/splash.jsx`): Auto-redirect logic.
- [x] `PhoneEntryScreen` (`app/(auth)/phone-entry.jsx`): Firebase Phone Auth.
- [x] `OTPVerifyScreen` (`app/(auth)/otp-verify.jsx`): OTP input and verification.
- [x] `RoleSelectScreen` (`app/(auth)/role-select.jsx`): Choose Customer or Worker.
- [x] Onboarding: `CustomerProfileSetup` & `WorkerProfileSetup` (with Image upload to Firebase Storage).

### Phase 3: Customer Flow
- [x] `CustomerLayout` (`app/(customer)/_layout.jsx`): Bottom tabs.
- [x] `CustomerHome` (`app/(customer)/home.jsx`): Category grid.
- [x] `PostRequestScreen` (`app/(customer)/post-request.jsx`): Form with Zod validation, urgency, budget.
- [x] `NearbyWorkersScreen` (`app/(customer)/nearby-workers.jsx`): Geohash querying to find available workers.
- [x] `WorkerPublicProfile` (`app/(customer)/worker-profile.jsx`): Full worker details and reviews.
- [x] `BookingConfirmScreen` (`app/(customer)/booking-confirm.jsx`): Job summary and confirmation.
- [x] `ActiveBookingScreen` (`app/(customer)/active-booking.jsx`): Real-time status tracking.
- [x] `CustomerBookingsTab` (`app/(customer)/bookings.jsx`): History of jobs.
- [x] `ReviewScreen` (`app/(customer)/review.jsx`): Post-job rating and review.

### Phase 4: Worker Flow (Complete)
- [x] `WorkerLayout` (`app/(worker)/_layout.jsx`): Bottom tabs.
- [x] `WorkerHome` (`app/(worker)/jobs.jsx`): Availability toggle, incoming job requests (real-time listener), countdown logic.
- [x] `ActiveJobScreen` (`app/(worker)/active.jsx`): Status updates (On way -> Arrived -> Complete).
- [x] `EarningsScreen` (`app/(worker)/earnings.jsx`): Aggregated earnings data.
- [x] `WorkerProfileTab` (`app/(worker)/profile.jsx`): Manage skills, schedule, and documents.

### Phase 5: Admin Dashboard (Complete)
- [x] Dashboard Home (`src/pages/Dashboard.jsx`): Live 6-stat overview.
- [x] Worker Verification Queue (`src/pages/Workers.jsx`): Tab filter, search, approve/reject, detail panel.
- [x] Jobs Monitor (`src/pages/Jobs.jsx`): Status tabs, admin cancel, detail panel.
- [x] All Users Table (`src/pages/Users.jsx`): Combined customer + worker table with role filter.

### Phase 6: Polish, Offline & Notifications (Complete)
- [x] Implement Firestore offline persistence (`enableIndexedDbPersistence` configured in firebase init).
- [x] *Skipped for MVP:* Firebase Cloud Messaging (FCM) to maintain 100% free/zero-cost setup. Relies on Firestore real-time listeners instead.
