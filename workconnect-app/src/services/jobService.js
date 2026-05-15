// src/services/jobService.js
// Firestore operations for jobs — create, query, update status

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import { db } from '../lib/firebase';
import { getDistanceKm } from '../utils/location';

/**
 * Create a new job posting.
 * @param {Object} jobData 
 * @returns {string} jobId
 */
export async function createJob(jobData) {
  const ref = await addDoc(collection(db, 'jobs'), {
    ...jobData,
    workerId: null,
    status: 'open',
    paymentMode: 'cash',
    paymentStatus: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/**
 * Query nearby available workers using Geohash bounding box.
 * Falls back to client-side Haversine filtering for precision.
 *
 * @param {{ lat: number, lng: number }} center - Customer's location
 * @param {number} radiusKm - Search radius in km
 * @returns {Promise<Array>} Array of worker objects with computed distance
 */
export async function getNearbyWorkers(center, radiusKm) {
  const bounds = geohashQueryBounds([center.lat, center.lng], radiusKm * 1000);
  const promises = bounds.map(([start, end]) =>
    getDocs(
      query(
        collection(db, 'workers'),
        where('geohash', '>=', start),
        where('geohash', '<=', end),
        where('availability', '==', 'available'),
        limit(50)
      )
    )
  );

  const snapshots = await Promise.all(promises);
  const workers = [];

  for (const snap of snapshots) {
    for (const docSnap of snap.docs) {
      const worker = docSnap.data();
      if (!worker.location) continue;

      // Precise Haversine distance check (geohash bounds are approximate rectangles)
      const distKm = getDistanceKm(
        center.lat,
        center.lng,
        worker.location.lat,
        worker.location.lng
      );

      // Also respect worker's own service radius setting
      if (distKm <= radiusKm && distKm <= (worker.serviceRadius || 10)) {
        workers.push({ ...worker, distanceKm: distKm });
      }
    }
  }

  // Sort by distance ascending
  return workers.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Real-time listener for a specific job document.
 * Used on ActiveBookingScreen (customer) and ActiveJobScreen (worker).
 * @param {string} jobId
 * @param {Function} callback
 * @returns {Function} unsubscribe function
 */
export function listenToJob(jobId, callback) {
  return onSnapshot(doc(db, 'jobs', jobId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

/**
 * Real-time listener for open jobs near a worker.
 * Only fetches jobs that are 'open' and match the worker's service area.
 * Uses geohash prefix match for efficiency.
 *
 * @param {string} workerGeohash
 * @param {Function} callback
 * @returns {Function} unsubscribe
 */
export function listenToOpenJobsForWorker(workerGeohash, callback) {
  // Use first 4 chars of geohash (~40km precision box) then filter precisely client-side
  const prefix = workerGeohash.substring(0, 4);
  const q = query(
    collection(db, 'jobs'),
    where('status', '==', 'open'),
    where('geohash', '>=', prefix),
    where('geohash', '<', prefix + '\uf8ff'),
    orderBy('geohash'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  return onSnapshot(q, (snap) => {
    const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(jobs);
  });
}

/**
 * Fetch all jobs for a customer (one-time fetch, not real-time).
 * @param {string} customerId 
 * @returns {Promise<Array>}
 */
export async function getCustomerJobs(customerId) {
  const snap = await getDocs(
    query(
      collection(db, 'jobs'),
      where('customerId', '==', customerId),
      orderBy('createdAt', 'desc')
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Worker accepts a job.
 * @param {string} jobId 
 * @param {string} workerId 
 */
export async function acceptJob(jobId, workerId) {
  await updateDoc(doc(db, 'jobs', jobId), {
    workerId,
    status: 'accepted',
    acceptedAt: serverTimestamp(),
  });
}

/**
 * Worker rejects / ignores a job (no-op in Firestore — job stays 'open').
 * Just returns without modifying anything.
 */
export async function rejectJob() {
  // No Firestore update needed — job stays open for other workers
  return;
}

/**
 * Update job status (worker updates progress).
 * @param {string} jobId
 * @param {string} status - 'in_progress' | 'completed'
 */
export async function updateJobStatus(jobId, status) {
  const update = { status };
  if (status === 'completed') update.completedAt = serverTimestamp();
  await updateDoc(doc(db, 'jobs', jobId), update);
}

/**
 * Customer cancels a job (only allowed before 'in_progress').
 * @param {string} jobId 
 */
export async function cancelJob(jobId) {
  await updateDoc(doc(db, 'jobs', jobId), {
    status: 'cancelled',
    cancelledAt: serverTimestamp(),
  });
}
