// Small date helpers for the trip's bounded, known date range.
// All dates are ISO 'YYYY-MM-DD' strings, parsed as UTC to avoid local
// timezone day-shift surprises (we only ever care about the calendar date).

export function parseIso(date: string): { year: number; month: number; day: number } {
  const [year, month, day] = date.split('-').map(Number)
  return { year, month, day }
}

export function toIso(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

/** 0 = Sunday .. 6 = Saturday */
export function weekdayOf(date: string): number {
  const { year, month, day } = parseIso(date)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export function monthLabel(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month - 1, 1))
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export function dayLabel(date: string): string {
  const { year, month, day } = parseIso(date)
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

/** Formats a stored 24h 'HH:mm' time as 12h with AM/PM, e.g. '14:00' -> '2:00 PM'. */
export function formatTime12h(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

/** All ISO dates from start to end, inclusive. */
export function tripDates(start: string, end: string): string[] {
  const dates: string[] = []
  let cur = parseIso(start)
  const endIso = end
  while (true) {
    const iso = toIso(cur.year, cur.month, cur.day)
    dates.push(iso)
    if (iso === endIso) break
    const next = new Date(Date.UTC(cur.year, cur.month - 1, cur.day + 1))
    cur = { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() }
    if (dates.length > 400) break // safety valve, should never trigger for this trip
  }
  return dates
}

export interface MonthGroup {
  year: number
  month: number
  /** ISO dates within this month that fall in the trip range. */
  dates: string[]
}

/** Groups trip dates by calendar month, in order. */
export function groupByMonth(dates: string[]): MonthGroup[] {
  const groups: MonthGroup[] = []
  for (const date of dates) {
    const { year, month } = parseIso(date)
    const last = groups[groups.length - 1]
    if (last && last.year === year && last.month === month) {
      last.dates.push(date)
    } else {
      groups.push({ year, month, dates: [date] })
    }
  }
  return groups
}

/** True if `date` falls within [start, end], inclusive. ISO strings sort chronologically. */
export function isWithinRange(date: string, start: string, end: string): boolean {
  return date >= start && date <= end
}

/** Row-wrap-aware rounding for a bar spanning [start, end] on a Monday-first
 *  7-column grid: the left edge only rounds at the true start (or a row's
 *  Monday), and the right edge only at the true end (or a row's Sunday) —
 *  so a multi-day bar reads as one continuous shape across the grid. */
export function spanEdges(date: string, start: string, end: string): { roundLeft: boolean; roundRight: boolean } {
  const mondayFirst = (weekdayOf(date) + 6) % 7
  return {
    roundLeft: date === start || mondayFirst === 0,
    roundRight: date === end || mondayFirst === 6,
  }
}

/** Whole days between two ISO dates (b - a), using UTC midnight to avoid DST/timezone drift. */
export function daysBetween(a: string, b: string): number {
  const { year: ay, month: am, day: ad } = parseIso(a)
  const { year: by, month: bm, day: bd } = parseIso(b)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / msPerDay)
}

export type TripPhase =
  | { kind: 'before'; daysUntil: number }
  | { kind: 'during'; dayNumber: number; totalDays: number }
  | { kind: 'after' }

/** Where `today` falls relative to the trip, for the hero's arrival countdown. */
export function tripPhase(today: string, tripStart: string, tripEnd: string): TripPhase {
  if (today < tripStart) return { kind: 'before', daysUntil: daysBetween(today, tripStart) }
  if (today > tripEnd) return { kind: 'after' }
  return {
    kind: 'during',
    dayNumber: daysBetween(tripStart, today) + 1,
    totalDays: daysBetween(tripStart, tripEnd) + 1,
  }
}
