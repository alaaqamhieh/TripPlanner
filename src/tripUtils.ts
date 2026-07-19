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

let seq = 0
export function newItemId(): string {
  seq += 1
  return `it-${Date.now().toString(36)}-${seq}`
}
