# WorkConnect

WorkConnect is a local workforce matching platform designed for semi-urban and rural areas (initially targeting Kerala, India). It connects customers needing services (electricians, plumbers, cleaners, etc.) with verified, skilled local workers. 

The platform consists of a **React Native mobile app** for both customers and workers, and a **React Vite admin dashboard**.

## Features

### For Customers
*   **Easy Booking**: Post a job request in seconds with GPS location or manual address.
*   **Nearby Matching**: Instantly find available workers within a specific radius.
*   **Real-time Tracking**: Track job progress from acceptance to completion.
*   **Cash Payments**: Simple cash-on-completion model, no online payment gateways required.
*   **Reviews & Ratings**: Rate workers after job completion to ensure quality.

### For Workers
*   **Flexible Availability**: Toggle status between Available, Busy, or Offline.
*   **Instant Requests**: Receive job requests from nearby customers in real-time.
*   **Job Management**: Update job status, get directions via Google Maps, and call customers directly.
*   **Earnings Tracking**: Keep track of completed jobs and total earnings.

## Tech Stack

*   **Mobile App**: React Native, Expo SDK 54, Expo Router.
*   **Styling**: NativeWind v4 (Tailwind CSS).
*   **State Management**: Zustand.
*   **Forms & Validation**: React Hook Form, Zod.
*   **Backend**: Firebase (Auth, Firestore, Storage).
*   **Location**: `expo-location`, `geofire-common` (Zero-cost location strategy using Haversine formula and native maps).

## Setup & Installation

### Prerequisites
*   Node.js (v18+)
*   npm or yarn
*   Expo CLI
*   A Firebase project with Phone Auth, Firestore, and Storage enabled.

### App Setup
1. Navigate to the app directory:
   ```bash
   cd workconnect-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your Firebase configuration keys.
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npx expo start
   ```

### Admin Dashboard Setup
1. Navigate to the admin directory:
   ```bash
   cd workconnect-admin
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Architecture Notes
*   **Zero-Cost Map Integration**: To keep costs strictly on the free tier, the app uses device GPS for coordinates, Geohashing for nearby queries, and deep links to the native Google Maps app for navigation, avoiding paid Google Maps SDKs.
*   **Single App, Two Roles**: The app uses Expo Router to seamlessly switch between the Customer and Worker tabs based on the user's Firestore profile role.

## License
MIT
