import { MEAL_META, SLOT_TIMES, type RecommendationItem, type ScheduledItem, type TripState } from './types'

// Small helpers shared by the itinerary, recommendation grid and modals.

export interface ResolvedItem {
  item: ScheduledItem
  title: string
  emoji: string
  /** CSS var reference for the category accent, e.g. 'var(--cat-food)'. */
  accent: string
  rec?: RecommendationItem
}

export function resolveItem(item: ScheduledItem, pool: RecommendationItem[]): ResolvedItem {
  const rec = item.refId ? pool.find((r) => r.id === item.refId) : undefined
  return {
    item,
    rec,
    title: item.title ?? rec?.title ?? 'Untitled plan',
    emoji: item.emoji ?? rec?.emoji ?? '📍',
    accent: rec ? `var(--cat-${rec.category})` : 'var(--accent)',
  }
}

/** Sort a day's items: explicit time → meal defaults → slot order. */
export function sortDayItems(items: ScheduledItem[]): ScheduledItem[] {
  const minutes = (item: ScheduledItem): number => {
    if (item.time) {
      const [h, m] = item.time.split(':').map(Number)
      return h * 60 + m
    }
    if (item.meal) return [8, 13, 19.5][MEAL_META[item.meal].order] * 60 + 1
    if (item.slot) return [10, 14.5, 18][SLOT_TIMES[item.slot].order] * 60
    return 12 * 60
  }
  return [...items].sort((a, b) => minutes(a) - minutes(b))
}

export function scheduledRefIds(trip: TripState): Set<string> {
  const ids = new Set<string>()
  for (const item of trip.scheduled) if (item.refId) ids.add(item.refId)
  return ids
}

// --- Day routes & walking-time estimates ------------------------------------

export interface RouteStop {
  title: string
  emoji: string
  category: string
  coords: [number, number]
}

/** A day's located, scheduled stops in visiting order (only ones with coords). */
export function dayStops(trip: TripState, date: string): RouteStop[] {
  const items = sortDayItems(trip.scheduled.filter((s) => s.date === date))
  const stops: RouteStop[] = []
  for (const item of items) {
    const resolved = resolveItem(item, trip.pool)
    const coords = resolved.rec?.coords
    if (coords) stops.push({ title: resolved.title, emoji: resolved.emoji, category: resolved.rec?.category ?? 'history', coords })
  }
  return stops
}

/** Great-circle distance between two [lat,lng] points, in km. */
export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b[0] - a[0])
  const dLng = toRad(b[1] - a[1])
  const lat1 = toRad(a[0])
  const lat2 = toRad(b[0])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Total straight-line distance along a day's stops + a rough walking time. */
export function walkStats(stops: RouteStop[]): { km: number; minutes: number } | null {
  if (stops.length < 2) return null
  let km = 0
  for (let i = 1; i < stops.length; i++) km += haversineKm(stops[i - 1].coords, stops[i].coords)
  // ~4.5 km/h walking, +25% for real streets vs straight lines.
  const minutes = Math.round(((km * 1.25) / 4.5) * 60)
  return { km: Math.round(km * 10) / 10, minutes }
}

/** "~4.2 km · ~18 min walking" style label for a day. */
export function routeLabel(stats: { km: number; minutes: number }): string {
  const time = stats.minutes >= 60 ? `${Math.floor(stats.minutes / 60)}h ${stats.minutes % 60}m` : `${stats.minutes} min`
  return `~${stats.km} km · ~${time} walking between stops`
}

let seq = 0
export function newItemId(): string {
  seq += 1
  return `it-${Date.now().toString(36)}-${seq}`
}

/** Normalized-title key so a real place dedupes its generic template twin. */
function poolKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/\b(the|a|of|in|at|de|la|le)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * Dedupe a pool by normalized title, keeping the richest source. Priority:
 * research (AI + verified) > places (live, rated) > signature > ai > custom > template.
 */
export function dedupePool(items: RecommendationItem[]): RecommendationItem[] {
  const rank: Record<RecommendationItem['source'], number> = {
    research: 6,
    places: 5,
    signature: 4,
    ai: 3,
    custom: 2,
    template: 1,
  }
  const best = new Map<string, RecommendationItem>()
  for (const item of items) {
    const key = poolKey(item.title)
    const existing = best.get(key)
    if (!existing || rank[item.source] > rank[existing.source]) best.set(key, item)
  }
  // Preserve first-seen order of the winners.
  const winners = new Set(best.values())
  return items.filter((i) => winners.has(i))
}
