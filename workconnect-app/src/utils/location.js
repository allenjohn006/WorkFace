// src/utils/location.js
// Pure JS location utilities — zero cost, no API key required

/**
 * Haversine formula — calculates straight-line distance between two GPS points.
 * @param {number} lat1 - Origin latitude
 * @param {number} lng1 - Origin longitude
 * @param {number} lat2 - Destination latitude
 * @param {number} lng2 - Destination longitude
 * @returns {number} Distance in kilometers (rounded to 1 decimal)
 */
export function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Format distance for display in UI.
 * @param {number} km 
 * @returns {string} e.g. "2.3 km away" or "500 m away"
 */
export function formatDistance(km) {
  if (km < 1) {
    return `${Math.round(km * 1000)} m away`;
  }
  return `${km.toFixed(1)} km away`;
}

/**
 * Open native Maps app with a location — zero API cost.
 * @param {number} lat 
 * @param {number} lng 
 * @param {string} label - Optional label for the pin
 */
import { Linking, Platform } from 'react-native';

export async function openInMaps(lat, lng, label = '') {
  const encodedLabel = encodeURIComponent(label);
  const url =
    Platform.OS === 'android'
      ? `geo:${lat},${lng}?q=${lat},${lng}(${encodedLabel})`
      : `https://maps.google.com/?q=${lat},${lng}`;

  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    Linking.openURL(url);
  } else {
    // Fallback to browser Google Maps
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
  }
}
