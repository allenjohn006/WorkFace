# Project Handover & Setup Action Plan

This document outlines the final manual steps **you** need to take to get the WorkConnect platform fully running on your machine, as well as details on the one feature we intentionally left "half-finished" to protect your zero-cost goal.

---

## Part 1: The "Half-Finished" Feature (FCM Push Notifications)
We intentionally skipped the implementation of **Firebase Cloud Messaging (FCM) Push Notifications**. 

**Why it was skipped:**
To send automated push notifications (e.g., waking up a worker's phone when a customer posts a job nearby), the backend needs to trigger a script. In Firebase, this is done using **Cloud Functions**. However, Google recently restricted Cloud Functions exclusively to their **Blaze (Pay-as-you-go) Plan**, which requires you to input a credit card. Because your primary requirement was a strict **zero-cost** infrastructure, we skipped this.

**How it works right now instead:**
We used highly efficient **Firestore Real-time Listeners**. As long as the worker has the app open on the "Jobs" screen, new jobs will pop up instantly.

**If you want to finish this later:**
1. Upgrade your Firebase project to the Blaze plan.
2. Install `firebase-tools` on your PC.
3. Write a Cloud Function (`onCreate` trigger for the `jobs` collection) to send an FCM payload to the targeted worker's device token.
4. Install `expo-notifications` in the mobile app to request permissions and capture the device token.

---

## Part 2: Setup Action Plan (Your To-Do List)

The codebase is fully written, but it lacks the backend credentials to actually save data. You must complete these steps to link the code to your personal Firebase backend.

### Step 1: Create the Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **"Add Project"** and name it `WorkConnect`. (You can disable Google Analytics for now).

### Step 2: Enable Backend Services
Inside your new Firebase project dashboard, enable these three core services:

1. **Authentication:**
   * Go to Build > Authentication > Get Started.
   * Click **Sign-in method**, add **Phone**, and enable it.
   * *Tip: In the Phone settings, add a test phone number (e.g., `+91 1234567890`) and a static OTP (e.g., `123456`) so you don't burn through SMS limits while testing.*

2. **Firestore Database:**
   * Go to Build > Firestore Database > Create Database.
   * Start in **Test Mode** (this allows read/write access without writing complex security rules immediately).
   * Choose a location closest to you (e.g., `asia-south1` for Mumbai).

3. **Storage (For Profile Photos):**
   * Go to Build > Storage > Get Started.
   * Start in **Test Mode**.

### Step 3: Get Your Configuration Keys
1. Go to the Project Overview page (click the gear icon > Project Settings).
2. Under the "Your apps" section, click the Web icon (`</>`) to add a web app. Name it `WorkConnect Web`.
3. Firebase will generate a `firebaseConfig` object containing keys (`apiKey`, `authDomain`, `projectId`, etc.). **Keep this window open.**

### Step 4: Populate the `.env` Files
You need to copy these keys into the two separate parts of the project.

**For the Mobile App:**
1. Go to `C:\Users\allen\workface\workconnect-app`.
2. Rename `.env.example` to `.env`.
3. Paste the values from Firebase into the respective variables:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=your_copied_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_copied_auth_domain
   ...
   ```

**For the Admin Dashboard:**
1. Go to `C:\Users\allen\workface\workconnect-admin`.
2. Rename `.env.example` to `.env`.
3. Paste the same values, but using the Vite variables:
   ```env
   VITE_FIREBASE_API_KEY=your_copied_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_copied_auth_domain
   ...
   ```

### Step 5: Run the Applications
Now you are ready to test the entire system! Open two separate terminal windows.

**Terminal 1 (Mobile App):**
```bash
cd C:\Users\allen\workface\workconnect-app
npx expo start
```
*Press `a` to open on Android Emulator, or scan the QR code with the Expo Go app on your physical phone.*

**Terminal 2 (Admin Dashboard):**
```bash
cd C:\Users\allen\workface\workconnect-admin
npm run dev
```
*Open `http://localhost:5173` in your browser.*

### Testing Workflow Suggestion:
1. Open the mobile app and log in using Phone Auth. Select **Worker** and complete onboarding.
2. Open the Admin dashboard in your browser. Go to the "Worker Verification" tab. You will see your newly created profile. Click **Verify**.
3. Go back to the mobile app (Worker). Go to the Profile tab to see your verified badge, then go to the Jobs tab and set yourself to **Available**.
4. Log out of the mobile app, and log back in with a *different* phone number. Select **Customer**.
5. Post a new job request as the customer.
6. If testing on two devices (or one emulator and one physical phone), you will see the job pop up on the Worker's screen instantly!
