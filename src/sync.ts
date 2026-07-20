import { getSharedDbUrl } from './config'
import type { TripState } from './types'

// Optional per-trip cloud sync over Firebase RTDB REST (no SDK). Last-write-
// wins with a device id to ignore our own echoes. Off unless a DB URL is
// configured — the app is fully local-first without it.

function asArray<T>(v: unknown): T[] {
  if (Array.isArray(v)) return v as T[]
  if (v && typeof v === 'object') return Object.values(v) as T[]
  return []
}

/** Fill in any array fields Firebase stripped, so adopted state is always safe. */
function normalize(raw: Record<string, unknown>): SharedTrip | null {
  const meta = raw.meta as TripState['meta'] | undefined
  if (!meta?.id) return null
  return {
    version: (raw.version as number) ?? 1,
    meta,
    profile: raw.profile as TripState['profile'],
    pool: asArray(raw.pool),
    dismissed: asArray(raw.dismissed),
    shortlist: asArray(raw.shortlist),
    swiped: asArray(raw.swiped),
    scheduled: asArray(raw.scheduled),
    scaffolded: raw.scaffolded === true,
    _meta: raw._meta as SharedTrip['_meta'],
  }
}

/** Stable per-device id so we can ignore our own echoes when polling. */
export function deviceId(): string {
  try {
    let id = localStorage.getItem('tripplanner/device')
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36)
      localStorage.setItem('tripplanner/device', id)
    }
    return id
  } catch {
    return 'anon'
  }
}

export interface SharedTrip extends TripState {
  _meta?: { deviceId: string; updatedAt: number }
}

function tripUrl(tripId: string): string | null {
  const base = getSharedDbUrl()
  if (!base) return null
  return `${base}/trips/${tripId}.json`
}

export function isSyncOn(): boolean {
  return Boolean(getSharedDbUrl())
}

/** Read a trip's shared copy, or null if sync is off / nothing there / failed. */
export async function fetchShared(tripId: string): Promise<SharedTrip | null> {
  const url = tripUrl(tripId)
  if (!url) return null
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as Record<string, unknown> | null
    return data ? normalize(data) : null
  } catch {
    return null
  }
}

/** Overwrite the shared copy (last-write-wins). Returns the timestamp written. */
export async function pushShared(trip: TripState): Promise<number | null> {
  const url = tripUrl(trip.meta.id)
  if (!url) return null
  const updatedAt = Date.now()
  const snapshot: SharedTrip = { ...trip, _meta: { deviceId: deviceId(), updatedAt } }
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    })
    return res.ok ? updatedAt : null
  } catch {
    return null
  }
}
