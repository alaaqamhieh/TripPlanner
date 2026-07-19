import { tripDates } from '../dateUtils'
import type { ScheduledItem, TimeOfDay, TravelerProfile, TripMeta } from '../types'
import type { ScoredRec } from './recommend'

// ---------------------------------------------------------------------------
// The starter itinerary: turns the ranked recommendation pool into a paced
// day-by-day scaffold. Everything it emits is an ordinary editable
// ScheduledItem — nothing is protected, the traveler owns the plan.
// ---------------------------------------------------------------------------

type Slot = Exclude<TimeOfDay, 'any'>

const SLOT_ORDER: Slot[] = ['morning', 'afternoon', 'evening']

/** Clock times used only when the traveler asked for an hour-by-hour plan. */
const SLOT_CLOCK: Record<Slot, string> = { morning: '09:30', afternoon: '14:00', evening: '19:00' }
const SLOT_CLOCK_LATE: Record<Slot, string> = { morning: '11:00', afternoon: '15:30', evening: '20:30' }

let scaffoldSeq = 0
function nextId(): string {
  scaffoldSeq += 1
  return `sc-${Date.now().toString(36)}-${scaffoldSeq}`
}

/**
 * Build the starter plan. Fills at most the first 7 days of long trips —
 * the rest stays an open canvas.
 */
export function scaffoldItinerary(profile: TravelerProfile, meta: TripMeta, ranked: ScoredRec[]): ScheduledItem[] {
  const days = tripDates(meta.startDate, meta.endDate).slice(0, 7)
  if (!days.length) return []

  const perDay = profile.pace === 'relaxed' ? 1 : profile.pace === 'packed' ? 3 : 2
  const clock = profile.rhythm === 'night' ? SLOT_CLOCK_LATE : SLOT_CLOCK
  const withTimes = profile.style === 'hourly'
  // Night owls skip mornings; early birds fill from the top.
  const slotsForDay = profile.rhythm === 'night' ? SLOT_ORDER.slice(1) : SLOT_ORDER

  const activities = ranked.filter((s) => !s.rec.meal)
  const dinners = ranked.filter((s) => s.rec.meal === 'dinner')
  const breakfasts = ranked.filter((s) => s.rec.meal === 'breakfast')

  const used = new Set<string>()
  const out: ScheduledItem[] = []

  days.forEach((date, dayIdx) => {
    const isFirst = dayIdx === 0
    const isLast = dayIdx === days.length - 1
    // Arrival/departure days stay light: one gentle thing, no epics.
    const slotsToday = isFirst || isLast ? 1 : perDay
    const usedCategoriesToday = new Set<string>()
    let filled = 0

    for (const slot of slotsForDay) {
      if (filled >= slotsToday) break
      const pick = activities.find((s) => {
        if (used.has(s.rec.id)) return false
        if (usedCategoriesToday.has(s.rec.category)) return false
        const tod = s.rec.timeOfDay ?? 'any'
        if (tod !== 'any' && tod !== slot) return false
        if ((isFirst || isLast) && (s.rec.duration === 'Full day' || s.rec.duration === 'Half day')) return false
        return true
      })
      if (!pick) continue
      used.add(pick.rec.id)
      usedCategoriesToday.add(pick.rec.category)
      filled += 1
      out.push({
        id: nextId(),
        date,
        refId: pick.rec.id,
        slot,
        time: withTimes ? clock[slot] : undefined,
      })
    }

    if (isFirst && filled === 0) {
      out.push({
        id: nextId(),
        date,
        title: 'Arrive & first wander',
        emoji: '🧳',
        note: 'Drop the bags, stretch the legs, get the lay of the land.',
        slot: 'afternoon',
        time: withTimes ? clock.afternoon : undefined,
      })
    }

    // A dinner idea every day; breakfasts only for planners and food lovers.
    const dinner = dinners.find((s) => !used.has(s.rec.id)) ?? dinners[0]
    if (dinner) {
      if (!used.has(dinner.rec.id)) used.add(dinner.rec.id)
      out.push({
        id: nextId(),
        date,
        refId: dinner.rec.id,
        meal: 'dinner',
        time: withTimes ? (profile.rhythm === 'night' ? '20:30' : '19:30') : undefined,
      })
    }
    const wantsBreakfast = profile.style === 'hourly' || profile.interests.food === 2
    if (wantsBreakfast && !isFirst) {
      const breakfast = breakfasts.find((s) => !used.has(s.rec.id)) ?? breakfasts[0]
      if (breakfast) {
        if (!used.has(breakfast.rec.id)) used.add(breakfast.rec.id)
        out.push({
          id: nextId(),
          date,
          refId: breakfast.rec.id,
          meal: 'breakfast',
          time: withTimes ? (profile.rhythm === 'night' ? '10:00' : '08:30') : undefined,
        })
      }
    }
  })

  return out
}
