import { useMemo, useState } from 'react'
import { loadTrip } from '../storage'
import { dayLabel, daysBetween, todayIso } from '../dateUtils'
import type { Theme } from '../types'

// The trip dashboard: every trip on this device, plus the big "plan a new
// trip" card that kicks off the questionnaire.

function TripCard({ id, onOpen, onDelete }: { id: string; onOpen: () => void; onDelete: () => void }) {
  const trip = useMemo(() => loadTrip(id), [id])
  const [armed, setArmed] = useState(false)

  if (!trip) return null
  const until = daysBetween(todayIso(), trip.meta.startDate)
  const countdown =
    until > 0 ? `${until} day${until === 1 ? '' : 's'} to go` : until >= -daysBetween(trip.meta.startDate, trip.meta.endDate) ? 'Happening now!' : 'Trip complete'

  return (
    <div className="trip-card" role="button" tabIndex={0} onClick={onOpen} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <span className="trip-card-emoji">{trip.meta.emoji}</span>
      <span className="trip-card-name">{trip.meta.name}</span>
      <span className="trip-card-dates">
        {dayLabel(trip.meta.startDate)} – {dayLabel(trip.meta.endDate)}
      </span>
      <span className="trip-card-count">
        {countdown} · {trip.scheduled.length} plan{trip.scheduled.length === 1 ? '' : 's'}
      </span>
      <button
        className={`trip-card-x${armed ? ' armed' : ''}`}
        aria-label={armed ? 'Tap again to delete this trip' : 'Delete this trip'}
        title={armed ? 'Tap again to confirm' : 'Delete trip'}
        onClick={(e) => {
          e.stopPropagation()
          if (armed) onDelete()
          else {
            setArmed(true)
            setTimeout(() => setArmed(false), 3000)
          }
        }}
      >
        {armed ? 'Sure?' : '✕'}
      </button>
    </div>
  )
}

export default function HomeScreen({
  tripIds,
  theme,
  onToggleTheme,
  onOpen,
  onNew,
  onDelete,
}: {
  tripIds: string[]
  theme: Theme
  onToggleTheme: () => void
  onOpen: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}) {
  return (
    <>
      <header className="hero">
        <div className="hero-pattern" aria-hidden="true" />
        <div className="topbar">
          <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle dark mode">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="container hero-inner hero-stagger">
          <p className="hero-kicker">🧭 TripPlanner</p>
          <h1 className="hero-title">Where to next?</h1>
          <p className="hero-sub">
            Tell us how you like to travel, get a plan made for you — then shape it however you want.
          </p>
          <div>
            <button className="btn warm hero-chip" style={{ border: 'none' }} onClick={onNew}>
              ✨ Plan a new trip
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <section>
          <div className="section-head">
            <p className="section-kicker">Your adventures</p>
            <h2 className="section-title">{tripIds.length ? 'Your trips' : 'No trips yet'}</h2>
            {!tripIds.length && (
              <p className="section-sub">
                Start with the two-minute travel quiz — it learns what you love and builds a day-by-day plan you can
                edit with total freedom. Everything saves automatically on this device.
              </p>
            )}
          </div>
          <div className="home-grid">
            {tripIds.map((id) => (
              <TripCard key={id} id={id} onOpen={() => onOpen(id)} onDelete={() => onDelete(id)} />
            ))}
            <button className="trip-card new" onClick={onNew}>
              <span className="trip-card-emoji">🧳</span>
              <span>＋ Plan a new trip</span>
            </button>
          </div>
        </section>
      </main>

      <footer>Made with 🧡 — your trips live in your browser and save automatically.</footer>
    </>
  )
}
