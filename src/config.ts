// ---------------------------------------------------------------------------
// App-wide configuration. The app is fully local-first: both keys below are
// optional and everything works with them blank.
// ---------------------------------------------------------------------------

export const SITE_URL = 'https://alaaqamhieh.github.io/TripPlanner/'

export const INDEX_STORAGE_KEY = 'tripplanner/index'
export const TRIP_STORAGE_PREFIX = 'tripplanner/trip/'
export const INDEX_VERSION = 1
export const TRIP_VERSION = 1

/**
 * Google Places API (New) key. Referrer-restricted keys are safe to ship in a
 * static bundle. A localStorage override ('tripplanner/gkey') lets you test a
 * key locally without rebuilding.
 */
export function getGoogleKey(): string {
  try {
    const override = window.localStorage.getItem('tripplanner/gkey')
    if (override) return override
  } catch {
    // storage unavailable (private mode) — fall through to the build-time key
  }
  // Accept either secret name so whichever the user named it works.
  return import.meta.env.VITE_GOOGLE_PLACES_KEY ?? import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''
}

/**
 * URL of the hosted AI proxy (a Vercel serverless function that holds the
 * Anthropic key). Empty = AI features stay dormant; everything else works.
 * localStorage override ('tripplanner/aiurl') for local testing.
 */
export function getAiProxyUrl(): string {
  try {
    const override = window.localStorage.getItem('tripplanner/aiurl')
    if (override) return override.replace(/\/$/, '')
  } catch {
    // storage unavailable — fall through
  }
  return (import.meta.env.VITE_AI_PROXY_URL ?? '').replace(/\/$/, '')
}

/** A user-supplied Anthropic key (bring-your-own-key fallback), if any. */
export function getUserAiKey(): string {
  try {
    return window.localStorage.getItem('tripplanner/aikey') ?? ''
  } catch {
    return ''
  }
}

/**
 * Firebase Realtime Database root URL (e.g. https://x.firebaseio.com).
 * Empty string disables cloud sync — trips stay in localStorage only.
 * localStorage override ('tripplanner/dburl') for local testing.
 */
export function getSharedDbUrl(): string {
  try {
    const override = window.localStorage.getItem('tripplanner/dburl')
    if (override) return override.replace(/\/$/, '')
  } catch {
    // storage unavailable — fall through
  }
  const url = import.meta.env.VITE_FIREBASE_DB_URL ?? import.meta.env.VITE_FIREBASE_DATABASE_URL ?? ''
  return url.replace(/\/$/, '')
}
