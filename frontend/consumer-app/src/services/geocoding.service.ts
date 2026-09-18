/**
 * Geocoding Service
 * Uses the application's supported OpenStreetMap Nominatim provider
 * for reverse geocoding coordinates (lat, lon) to City + State.
 */

export interface ReverseGeocodeResult {
  city: string
  state: string
  formatted: string
  country?: string
}

export async function reverseGeocode(
  lat: number,
  lon: number,
  timeoutMs = 8000
): Promise<ReverseGeocodeResult | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&format=json&accept-language=en`

    const res = await fetch(url, {
      headers: { 'User-Agent': 'GETSolarEnergy/1.0' },
      signal: controller.signal,
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    const addr = data.address || {}

    const city = (
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.municipality ||
      addr.county ||
      addr.district ||
      ''
    ).trim()

    const state = (
      addr.state ||
      addr.state_district ||
      addr.region ||
      ''
    ).trim()

    if (!city && !state) {
      return null
    }

    const formatted = city && state ? `${city}, ${state}` : city || state

    return {
      city,
      state,
      formatted,
      country: addr.country || '',
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
