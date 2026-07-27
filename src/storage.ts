import { INDEX_STORAGE_KEY, INDEX_VERSION, TRIP_STORAGE_PREFIX, TRIP_VERSION } from './config'
import { defaultProfile, type TripState, type TripsIndex } from './types'

// ---------------------------------------------------------------------------
// Multi-trip localStorage persistence.
//   tripplanner/index      → TripsIndex (which trips exist + theme)
//   tripplanner/trip/<id>  → TripState (one blob per trip)
// Defensive on load: corrupt/missing data never crashes the app, and version
// bumps merge field-by-field instead of wiping the user's trips.
// ---------------------------------------------------------------------------

export function createTripId(): string {
  return crypto.randomUUID().slice(0, 8)
}

function defaultIndex(): TripsIndex {
  return { version: INDEX_VERSION, tripIds: [], theme: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' }
}

export function loadIndex(): TripsIndex {
  try {
    const raw = localStorage.getItem(INDEX_STORAGE_KEY)
    if (!raw) return defaultIndex()
    const parsed = JSON.parse(raw) as Partial<TripsIndex>
    return {
      version: INDEX_VERSION,
      tripIds: Array.isArray(parsed.tripIds) ? parsed.tripIds.filter((id) => typeof id === 'string') : [],
      theme: parsed.theme === 'dark' ? 'dark' : 'light',
    }
  } catch {
    return defaultIndex()
  }
}

export function saveIndex(index: TripsIndex): void {
  try {
    localStorage.setItem(INDEX_STORAGE_KEY, JSON.stringify(index))
  } catch {
    // Storage full or unavailable — the app keeps working in-memory.
  }
}

export function loadTrip(id: string): TripState | null {
  try {
    const raw = localStorage.getItem(TRIP_STORAGE_PREFIX + id)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TripState>
    if (!parsed.meta || typeof parsed.meta.id !== 'string') return null
    return {
      version: TRIP_VERSION,
      meta: parsed.meta,
      profile: { ...defaultProfile(), ...parsed.profile },
      pool: Array.isArray(parsed.pool) ? parsed.pool : [],
      dismissed: Array.isArray(parsed.dismissed) ? parsed.dismissed : [],
      shortlist: Array.isArray(parsed.shortlist) ? parsed.shortlist : [],
      swiped: Array.isArray(parsed.swiped) ? parsed.swiped : [],
      scheduled: Array.isArray(parsed.scheduled) ? parsed.scheduled : [],
      scaffolded: parsed.scaffolded === true,
      guide: parsed.guide && Array.isArray(parsed.guide.sections) ? parsed.guide : undefined,
    }
  } catch {
    return null
  }
}

export function saveTrip(trip: TripState): void {
  try {
    localStorage.setItem(TRIP_STORAGE_PREFIX + trip.meta.id, JSON.stringify(trip))
  } catch {
    // Storage full or unavailable — edits survive in memory for this session.
  }
}

export function deleteTrip(id: string): void {
  try {
    localStorage.removeItem(TRIP_STORAGE_PREFIX + id)
  } catch {
    // ignore
  }
}
