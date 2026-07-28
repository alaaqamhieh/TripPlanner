import { useState } from 'react'
import { dayLabel, dayOfMonth, formatTime12h, tripDates, tripWeeks, WEEKDAY_LABELS } from '../dateUtils'
import { dayStops, resolveItem, routeLabel, sortDayItems, walkStats } from '../tripUtils'
import type { ScheduledItem, TripState } from '../types'
import { DragItem } from './DragItem'

type View = 'days' | 'calendar' | 'timeline'

function defaultView(): View {
  try {
    return window.matchMedia('(max-width: 640px)').matches ? 'calendar' : 'days'
  } catch {
    return 'days'
  }
}

// The day-by-day plan. Every day card is a [data-dropzone]; recommendation
// cards and existing plans can both be dragged onto any day. Tapping a plan
// opens its editor — total freedom, nothing is locked.

function SlotRow({
  item,
  trip,
  onEdit,
  onRemove,
  onMove,
}: {
  item: ScheduledItem
  trip: TripState
  onEdit: () => void
  onRemove: () => void
  onMove: (date: string) => void
}) {
  const { title, emoji, accent } = resolveItem(item, trip.pool)
  return (
    <DragItem ariaLabel={`${title} — drag to another day or tap to edit`} onChoose={(zone) => (zone ? onMove(zone) : onEdit())}>
      <div className="slot landed" style={{ ['--slot-accent' as string]: accent }}>
        <span aria-hidden="true">{emoji}</span>
        <span className="slot-title">
          {title}
          {item.note && <span className="slot-note"> · {item.note}</span>}
        </span>
        {item.meal && <span className="slot-meal">{item.meal}</span>}
        {item.time && <span className="slot-time">{formatTime12h(item.time)}</span>}
        {/* stopPropagation on pointer events too — otherwise the DragItem
            wrapper sees the tap and opens its own fallback modal. */}
        <button
          className="slot-x slot-edit"
          aria-label={`Edit ${title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          ✎
        </button>
        <button
          className="slot-x"
          aria-label={`Remove ${title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
        >
          ✕
        </button>
      </div>
    </DragItem>
  )
}

export default function Itinerary({
  trip,
  onEditItem,
  onRemoveItem,
  onMoveItem,
  onAddToDay,
}: {
  trip: TripState
  onEditItem: (id: string) => void
  onRemoveItem: (id: string) => void
  onMoveItem: (id: string, date: string) => void
  onAddToDay: (date: string) => void
}) {
  const [view, setView] = useState<View>(defaultView)
  const days = tripDates(trip.meta.startDate, trip.meta.endDate)
  const weeks = tripWeeks(trip.meta.startDate, trip.meta.endDate)

  const itemsFor = (date: string) => sortDayItems(trip.scheduled.filter((i) => i.date === date))

  const dayBody = (date: string) => {
    const items = itemsFor(date)
    return (
      <>
        {items.map((item) => (
          <SlotRow
            key={item.id}
            item={item}
            trip={trip}
            onEdit={() => onEditItem(item.id)}
            onRemove={() => onRemoveItem(item.id)}
            onMove={(d) => onMoveItem(item.id, d)}
          />
        ))}
        {!items.length && <p className="empty-hint">Drop an idea here — or tap ＋</p>}
      </>
    )
  }

  return (
    <section id="itinerary">
      <div className="section-head">
        <p className="section-kicker">Day by day</p>
        <h2 className="section-title">Your plan</h2>
        <p className="section-sub">
          Drag ideas onto a day, drag plans between days, tap anything to edit it. It's your trip — everything is
          changeable.
        </p>
      </div>

      <div className="itinerary-bar">
        <div className="view-toggle" role="tablist" aria-label="Itinerary view">
          <button role="tab" aria-selected={view === 'calendar'} className={view === 'calendar' ? 'on' : ''} onClick={() => setView('calendar')}>
            📅 Calendar
          </button>
          <button role="tab" aria-selected={view === 'days'} className={view === 'days' ? 'on' : ''} onClick={() => setView('days')}>
            🗓️ Days
          </button>
          <button
            role="tab"
            aria-selected={view === 'timeline'}
            className={view === 'timeline' ? 'on' : ''}
            onClick={() => setView('timeline')}
          >
            📜 Timeline
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <div className="cal">
          <div className="cal-head">
            {WEEKDAY_LABELS.map((wd) => (
              <span key={wd} className="cal-wd">
                {wd}
              </span>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="cal-week">
              {week.map((date, di) =>
                date ? (
                  <div key={date} className="cal-cell" data-dropzone={date}>
                    <div className="cal-cell-head">
                      <span className="cal-daynum">{dayOfMonth(date)}</span>
                      <button
                        className="cal-add"
                        aria-label={`Add a plan to ${dayLabel(date)}`}
                        onClick={() => onAddToDay(date)}
                      >
                        ＋
                      </button>
                    </div>
                    <div className="cal-chips">
                      {itemsFor(date).map((item) => {
                        const r = resolveItem(item, trip.pool)
                        return (
                          <button
                            key={item.id}
                            className="cal-chip"
                            style={{ ['--slot-accent' as string]: r.accent }}
                            title={r.title}
                            onClick={() => onEditItem(item.id)}
                          >
                            <span aria-hidden="true">{r.emoji}</span>
                            <span className="cal-chip-title">{r.title}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div key={`x-${wi}-${di}`} className="cal-cell off" aria-hidden="true" />
                ),
              )}
            </div>
          ))}
          <p className="search-hint">Tap ＋ to add a plan to a day, or tap a plan to edit it. Switch to 🗓️ Days to drag things around.</p>
        </div>
      ) : view === 'days' ? (
        <div className="day-grid">
          {days.map((date, i) => (
            <div key={date} className="day-cell" data-dropzone={date}>
              <div className="day-head">
                <span className="day-num">Day {i + 1}</span>
                <span className="day-date">{dayLabel(date)}</span>
                <button className="day-add" aria-label={`Add a plan to ${dayLabel(date)}`} onClick={() => onAddToDay(date)}>
                  ＋
                </button>
              </div>
              {(() => {
                const stats = walkStats(dayStops(trip, date))
                return stats ? <p className="day-route">🚶 {routeLabel(stats)}</p> : null
              })()}
              {dayBody(date)}
            </div>
          ))}
        </div>
      ) : (
        <div className="timeline">
          {days.map((date, i) => (
            <div key={date} className="tl-day">
              <span className="tl-dot" aria-hidden="true" />
              <div className="tl-date">
                <span className="day-num">Day {i + 1}</span>
                {dayLabel(date)}
                <button className="day-add" aria-label={`Add a plan to ${dayLabel(date)}`} onClick={() => onAddToDay(date)}>
                  ＋
                </button>
              </div>
              <div className="tl-items" data-dropzone={date}>
                {dayBody(date)}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
