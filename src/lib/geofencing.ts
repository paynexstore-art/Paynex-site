/**
 * Geofencing & GPS Utilities — PayNex
 *
 * Uses browser's Geolocation API + Haversine formula for distance.
 * Mock-location detection is done server-side in production (here: heuristic checks).
 */

import type { GpsCoords } from '@/types';

const EARTH_RADIUS_M = 6371000; // meters

/**
 * Haversine formula — returns distance in meters between two GPS points.
 */
export function haversineDistance(a: GpsCoords, b: GpsCoords): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Egyptian governorate bounding boxes (approximate center + radius).
 * Used to verify supervisor is within their assigned province.
 */
export const PROVINCE_BOUNDS: Record<string, { lat: number; lng: number; radiusKm: number }> = {
  cairo:         { lat: 30.0444, lng: 31.2357, radiusKm: 30 },
  giza:          { lat: 29.9870, lng: 31.2118, radiusKm: 40 },
  alexandria:    { lat: 31.2001, lng: 29.9187, radiusKm: 40 },
  luxor:         { lat: 25.6872, lng: 32.6396, radiusKm: 30 },
  aswan:         { lat: 24.0889, lng: 32.8998, radiusKm: 35 },
  asyut:         { lat: 27.1809, lng: 31.1837, radiusKm: 40 },
  beheira:       { lat: 30.8480, lng: 30.3442, radiusKm: 60 },
  'beni-suef':   { lat: 29.0744, lng: 31.0988, radiusKm: 35 },
  dakahlia:      { lat: 31.0364, lng: 31.3807, radiusKm: 40 },
  damietta:      { lat: 31.4165, lng: 31.8133, radiusKm: 25 },
  fayoum:        { lat: 29.3084, lng: 30.8428, radiusKm: 35 },
  gharbia:       { lat: 30.8754, lng: 31.0367, radiusKm: 35 },
  ismailia:      { lat: 30.5965, lng: 32.2715, radiusKm: 35 },
  'kafr-el-sheikh': { lat: 31.1107, lng: 30.9388, radiusKm: 40 },
  matruh:        { lat: 31.3543, lng: 27.2373, radiusKm: 200 },
  minya:         { lat: 28.1099, lng: 30.7503, radiusKm: 50 },
  monufia:       { lat: 30.5973, lng: 30.9876, radiusKm: 30 },
  'new-valley':  { lat: 25.4425, lng: 30.5562, radiusKm: 300 },
  'north-sinai': { lat: 30.2843, lng: 33.6186, radiusKm: 100 },
  'port-said':   { lat: 31.2652, lng: 32.3018, radiusKm: 20 },
  qalyubia:      { lat: 30.3292, lng: 31.2168, radiusKm: 35 },
  qena:          { lat: 26.1551, lng: 32.7160, radiusKm: 40 },
  'red-sea':     { lat: 27.2574, lng: 33.8129, radiusKm: 200 },
  sharqia:       { lat: 30.7333, lng: 31.7167, radiusKm: 50 },
  sohag:         { lat: 26.5591, lng: 31.6956, radiusKm: 45 },
  'south-sinai': { lat: 29.3100, lng: 34.1520, radiusKm: 150 },
  suez:          { lat: 29.9668, lng: 32.5498, radiusKm: 25 },
};

/**
 * Get current GPS position via browser API.
 * Returns null if denied or unavailable.
 */
export function getCurrentGps(): Promise<GpsCoords | null> {
  return new Promise(resolve => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: new Date().toISOString(),
        });
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

/**
 * Check if GPS coordinates fall within a province boundary.
 * Returns true (pass) in development/demo when GPS is unavailable (coords null).
 */
export function isWithinProvince(gps: GpsCoords | null, provinceId: string): boolean {
  if (!gps) return true; // Demo: allow when no GPS
  const bounds = PROVINCE_BOUNDS[provinceId];
  if (!bounds) return true;
  const center: GpsCoords = { lat: bounds.lat, lng: bounds.lng, timestamp: '' };
  const dist = haversineDistance(gps, center);
  return dist <= bounds.radiusKm * 1000;
}

/**
 * Check if supervisor is within required meters of customer address.
 * Pass radiusMeters explicitly (read from getSiteSettings().geofenceRadiusMeters at the call site).
 * Defaults to 50m when not provided.
 * customerGps can be null in demo mode → always passes.
 */
export function isWithinRadius(
  supervisorGps: GpsCoords | null,
  targetGps: GpsCoords | null,
  radiusMeters: number = 50,
): boolean {
  if (!supervisorGps || !targetGps) return true; // Demo: pass when no GPS data
  return haversineDistance(supervisorGps, targetGps) <= radiusMeters;
}

/**
 * Heuristic mock-location detection.
 * Flags suspiciously "perfect" GPS (0 accuracy, round numbers).
 */
export function isMockLocation(gps: GpsCoords): boolean {
  if (!gps.accuracy) return false;
  if (gps.accuracy === 0) return true;
  // Suspiciously round lat/lng (4+ decimal zeros)
  const latStr = String(gps.lat);
  const lngStr = String(gps.lng);
  const trailingZeros = (s: string) => (s.split('.')[1] ?? '').match(/0{4,}$/) !== null;
  return trailingZeros(latStr) || trailingZeros(lngStr);
}

/**
 * Stamp GPS metadata as a text watermark on an image (canvas).
 * Returns new base64 data URL with watermark.
 */
export async function addGpsWatermark(
  imageDataUrl: string,
  gps: GpsCoords,
  supervisorName: string
): Promise<string> {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      // Watermark text
      const ts = new Date(gps.timestamp).toLocaleString('ar-EG');
      const text = `📍 ${gps.lat.toFixed(5)}, ${gps.lng.toFixed(5)}  |  ${ts}  |  ${supervisorName}`;

      // Background stripe
      const padding = 6;
      const fontSize = Math.max(12, Math.floor(canvas.height * 0.025));
      ctx.font = `bold ${fontSize}px Arial`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillStyle = 'rgba(15, 36, 96, 0.75)';
      ctx.fillRect(0, canvas.height - fontSize - padding * 2, textWidth + padding * 2, fontSize + padding * 2);

      // Text
      ctx.fillStyle = '#d4a339';
      ctx.fillText(text, padding, canvas.height - padding);

      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(imageDataUrl); // Fallback without watermark
    img.src = imageDataUrl;
  });
}
