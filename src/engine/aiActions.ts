import { tripDates } from '../dateUtils'
import { newItemId } from '../tripUtils'
import { INTEREST_META, type InterestId, type RecommendationItem, type ScheduledItem, type TripState } from '../types'

// ---------------------------------------------------------------------------
// The AI assistant returns a small set of structured "actions". Applying them
// runs through the same shapes the rest of the app edits, so an AI change is
// indistinguishable from one the user made by hand — and just as editable.
// ---------------------------------------------------------------------------

export type AiAction =
  | { type: 'add_plan'; day: number; title: string; emoji?: string; category?: string; note?: string; time?: string; meal?: 'breakfast' | 'lunch' | 'dinner' }
  | { type: 'remove_plan'; day?: number; title: string }
  | { type: 'move_plan'; title: string; toDay: number }
  | { type: 'add_idea'; title: string; emoji?: string; category?: string; description?: string }

export interface AiResponse {
  reply: string
  actions: AiAction[]
}

function normCategory(c?: string): InterestId {
  const key = (c ?? '').toLowerCase() as InterestId
  return key in INTEREST_META ? key : 'history'
}

function fuzzyMatch(haystack: string, needle: string): boolean {
  const h = haystack.toLowerCase()
  const n = needle.toLowerCase().trim()
  return h.includes(n) || n.includes(h)
}

/**
 * Apply AI actions to a trip. Returns the new trip plus a human-readable
 * summary of each change (for the chat + toast). Days are 1-based, mapped to
 * dates via the trip range; out-of-range days are clamped.
 */
export function applyAiActions(trip: TripState, actions: AiAction[]): { trip: TripState; summaries: string[] } {
  const days = tripDates(trip.meta.startDate, trip.meta.endDate)
  const dayToDate = (day: number): string => days[Math.max(0, Math.min(days.length - 1, day - 1))]

  let scheduled = [...trip.scheduled]
  let pool = [...trip.pool]
  let shortlist = [...trip.shortlist]
  const summaries: string[] = []

  const resolveTitle = (item: ScheduledItem): string => {
    if (item.title) return item.title
    const rec = item.refId ? pool.find((r) => r.id === item.refId) : undefined
    return rec?.title ?? ''
  }

  for (const action of actions) {
    switch (action.type) {
      case 'add_plan': {
        const date = dayToDate(action.day)
        scheduled.push({
          id: newItemId(),
          date,
          title: action.title,
          emoji: action.emoji ?? '📍',
          note: action.note,
          time: action.time,
          meal: action.meal,
        })
        summaries.push(`Added “${action.title}” to Day ${action.day}`)
        break
      }
      case 'remove_plan': {
        const before = scheduled.length
        scheduled = scheduled.filter((item) => {
          const matchesTitle = fuzzyMatch(resolveTitle(item), action.title)
          const matchesDay = action.day === undefined || item.date === dayToDate(action.day)
          return !(matchesTitle && matchesDay)
        })
        if (scheduled.length < before) summaries.push(`Removed “${action.title}”`)
        break
      }
      case 'move_plan': {
        const date = dayToDate(action.toDay)
        let moved = false
        scheduled = scheduled.map((item) => {
          if (!moved && fuzzyMatch(resolveTitle(item), action.title)) {
            moved = true
            return { ...item, date }
          }
          return item
        })
        if (moved) summaries.push(`Moved “${action.title}” to Day ${action.toDay}`)
        break
      }
      case 'add_idea': {
        const rec: RecommendationItem = {
          id: `ai-${newItemId()}`,
          source: 'ai',
          title: action.title,
          emoji: action.emoji ?? '✨',
          category: normCategory(action.category),
          description: action.description ?? 'Suggested by your AI trip planner.',
          wikiTitle: action.title,
        }
        pool.push(rec)
        if (!shortlist.includes(rec.id)) shortlist.push(rec.id)
        summaries.push(`Added idea “${action.title}” to your shortlist`)
        break
      }
    }
  }

  return { trip: { ...trip, scheduled, pool, shortlist }, summaries }
}
