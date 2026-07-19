import { resolveItem } from './tripUtils'
import type { TripState } from './types'

// Hand-rolled RFC 5545 calendar export — no dependencies. Adapted from the
// reference sites, parametrized by trip instead of a hard-coded one.

function icsDate(iso: string): string {
  return iso.replaceAll('-', '')
}

function nextDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d + 1)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}`
}

/** Floating local date-time stamp; `plusHours` shifts the clock (+1h default end). */
function icsDateTime(iso: string, hhmm: string, plusHours = 0): string {
  const [y, m, d] = iso.split('-').map(Number)
  const [h, min] = hhmm.split(':').map(Number)
  const dt = new Date(y, m - 1, d, h + plusHours, min)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}${p(dt.getMonth() + 1)}${p(dt.getDate())}T${p(dt.getHours())}${p(dt.getMinutes())}00`
}

function escapeText(text: string): string {
  return text.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n')
}

/** Fold lines at ~75 octets per RFC 5545. */
function fold(line: string): string {
  const out: string[] = []
  let rest = line
  while (rest.length > 73) {
    out.push(rest.slice(0, 73))
    rest = ' ' + rest.slice(73)
  }
  out.push(rest)
  return out.join('\r\n')
}

export function buildICS(trip: TripState): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z')
  const calName = `${trip.meta.emoji} ${trip.meta.name}`
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TripPlanner//EN',
    'CALSCALE:GREGORIAN',
    fold(`X-WR-CALNAME:${escapeText(calName)}`),
  ]

  for (const item of trip.scheduled) {
    const { title, emoji } = resolveItem(item, trip.pool)
    const rec = item.refId ? trip.pool.find((r) => r.id === item.refId) : undefined
    const summary = item.meal && rec?.meal ? `${title}` : title
    const description = item.note || rec?.description || ''
    const timed = item.time && /^\d{1,2}:\d{2}$/.test(item.time)
    lines.push(
      'BEGIN:VEVENT',
      fold(`UID:${item.id}@tripplanner-${trip.meta.id}`),
      `DTSTAMP:${stamp}`,
      ...(timed
        ? [`DTSTART:${icsDateTime(item.date, item.time!)}`, `DTEND:${icsDateTime(item.date, item.time!, 1)}`]
        : [`DTSTART;VALUE=DATE:${icsDate(item.date)}`, `DTEND;VALUE=DATE:${nextDay(item.date)}`]),
      fold(`SUMMARY:${escapeText(`${emoji} ${summary}`)}`),
    )
    if (description) lines.push(fold(`DESCRIPTION:${escapeText(description)}`))
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}

export function downloadICS(trip: TripState): void {
  const blob = new Blob([buildICS(trip)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${trip.meta.name.toLowerCase().replace(/\W+/g, '-')}-itinerary.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
