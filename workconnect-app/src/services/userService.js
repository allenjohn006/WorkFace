// src/services/userService.js
// Firestore operations for user and worker profiles

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Fetch a user profile from Firestore.
 * @param {string} uid 
 * @returns {Object|null}
 */
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Create or update a user profile in Firestore.
 * Uses merge so it doesn't overwrite existing fields.
 * @param {string} uid 
 * @param {Object} data 
 */
export async function upsertUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    uid,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Fetch a worker profile from Firestore.
 * @param {string} uid 
 * @returns {Object|null}
 */
export async function getWorkerProfile(uid) {
  const snap = await getDoc(doc(db, 'workers', uid));
  return snap.exists() ? snap.data() : null;
}

/**
 * Create or update a worker profile in Firestore.
 * @param {string} uid 
 * @param {Object} data 
 */
export async function upsertWorkerProfile(uid, data) {
  await setDoc(doc(db, 'workers', uid), {
    ...data,
    uid,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/**
 * Update worker availability and location.
 * Called when worker toggles their availability status.
 * @param {string} uid 
 * @param {string} availability - 'available' | 'busy' | 'offline'
 * @param {{ lat: number, lng: number, geohash: string }|null} location
 */
export async function updateWorkerAvailability(uid, availability, location = null) {
  const data = { availability, isOnline: availability !== 'offline' };
  if (location) {
    data.location = { lat: location.lat, lng: location.lng };
    data.geohash = location.geohash;
  }
  await updateDoc(doc(db, 'workers', uid), data);
}
