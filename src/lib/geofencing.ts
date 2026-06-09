// src/lib/geofencing.ts
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export interface LocationVerificationResult {
  isValid: boolean
  distance: number
  isMockLocation: boolean
  error?: string
}

export async function verifyLocation(params: {
  supervisorLat: number
  supervisorLng: number
  customerLat: number
  customerLng: number
  maxDistanceMeters?: number
  requestTimestamp: number
}): Promise<LocationVerificationResult> {
  const maxDistance = params.maxDistanceMeters || 100
  const distance = calculateDistance(
    params.supervisorLat, params.supervisorLng,
    params.customerLat, params.customerLng
  )

  // كشف التزييف - فحص الـ Timestamp
  const now = Date.now()
  const timeDiff = Math.abs(now - params.requestTimestamp)
  const isMockLocation = timeDiff > 30000 // أكثر من 30 ثانية = مشبوه

  if (isMockLocation) {
    return {
      isValid: false,
      distance: Math.round(distance),
      isMockLocation: true,
      error: 'تم اكتشاف محاولة تزييف الموقع. تم تسجيل المحاولة.',
    }
  }

  return {
    isValid: distance <= maxDistance,
    distance: Math.round(distance),
    isMockLocation: false,
    error:
      distance > maxDistance
        ? `أنت على بُعد ${Math.round(distance)} متر. يجب أن تكون على بُعد أقل من ${maxDistance} متر.`
        : undefined,
  }
}
