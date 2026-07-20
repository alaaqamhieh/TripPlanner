import { useEffect, useMemo, useState } from 'react'
import type { ToastFn, UpdateTrip } from '../App'
import { dayLabel, daysBetween, todayIso } from '../dateUtils'
import { burstFromElement } from '../confetti'
import { rankRecommendations } from '../engine/recommend'
import { newItemId, scheduledRefIds } from '../tripUtils'
import type { MealSlot, RecommendationItem, ScheduledItem, Theme, TripMeta, TripState } from '../types'
import AddToDayModal from './AddToDayModal'
import ItemModal from './ItemModal'
import Itinerary from './Itinerary'
import PlaceDeck from './PlaceDeck'
import PlacePhoto from './PlacePhoto'
import Recommendations from './Recommendations'
import TripMap from './TripMap'
import TripSettingsModal from './TripSettingsModal'

// The per-trip screen: hero + sticky nav + itinerary + recommendations
// (+ map & export, wired in below as they land). All mutations funnel
// through updateTrip so every change is saved the moment it happens.

type ModalState =
  | { kind: 'none' }
  | { kind: 'addToDay'; recId: string }
  | { kind: 'newItem'; date?: string }
  | { kind: 'editItem'; itemId: string }
  | { kind: 'settings' }

export default function TripView({
  trip,
  theme,
  savedFlash,
  updateTrip,
  onToggleTheme,
  onHome,
  onRetake,
  onDelete,
  showToast,
  onShare,
  onExport,
  onFindPlaces,
  findingPlaces,
  placesAvailable,
}: {
  trip: TripState
  theme: Theme
  savedFlash: boolean
  updateTrip: UpdateTrip
  onToggleTheme: () => void
  onHome: () => void
  onRetake: () => void
  onDelete: () => void
  showToast: ToastFn
  onShare?: () => void
  onExport?: () => void
  onFindPlaces?: () => void
  findingPlaces?: boolean
  placesAvailable?: boolean
}) {
  const [modal, setModal] = useState<ModalState>({ kind: 'none' })
  const [navShown, setNavShown] = useState(false)
  const [deckOpen, setDeckOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setNavShown(window.scrollY > 280)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const close = () => setModal({ kind: 'none' })

  // ---- itinerary actions ----------------------------------------------------
  const schedule = (recId: string, date: string, meal?: MealSlot, time?: string) => {
    const rec = trip.pool.find((r) => r.id === recId)
    updateTrip((prev) => ({
      ...prev,
      scheduled: [
        ...prev.scheduled,
        { id: newItemId(), date, refId: recId, meal: meal ?? rec?.meal, time },
      ],
    }))
    showToast(`Added to ${dayLabel(date)} ✓`)
    close()
  }

  const moveItem = (itemId: string, date: string) => {
    updateTrip((prev) => ({
      ...prev,
      scheduled: prev.scheduled.map((i) => (i.id === itemId ? { ...i, date } : i)),
    }))
    showToast(`Moved to ${dayLabel(date)} ✓`)
  }

  const removeItem = (itemId: string) => {
    updateTrip((prev) => ({ ...prev, scheduled: prev.scheduled.filter((i) => i.id !== itemId) }))
    close()
  }

  const saveItem = (item: ScheduledItem) => {
    updateTrip((prev) =>
      item.id
        ? { ...prev, scheduled: prev.scheduled.map((i) => (i.id === item.id ? item : i)) }
        : { ...prev, scheduled: [...prev.scheduled, { ...item, id: newItemId() }] },
    )
    close()
  }

  const dismissRec = (recId: string) => {
    updateTrip((prev) => ({ ...prev, dismissed: [...prev.dismissed, recId] }))
  }

  // ---- swipe-deck discovery + shortlist ------------------------------------
  const scheduledRefs = useMemo(() => scheduledRefIds(trip), [trip])

  // Real places worth swiping: curated / live / AI (or anything with a photo),
  // minus what's already been decided, ranked to the traveller's taste.
  const deckCards = useMemo(() => {
    const seen = new Set([...trip.swiped, ...trip.shortlist, ...trip.dismissed])
    const real = trip.pool.filter(
      (r) =>
        !seen.has(r.id) &&
        !scheduledRefs.has(r.id) &&
        (r.source === 'signature' || r.source === 'places' || r.source === 'ai' || Boolean(r.photo)),
    )
    const ranked = rankRecommendations(real, trip.profile, [], new Set())
    return ranked.map((s) => s.rec)
  }, [trip, scheduledRefs])

  const shortlistRecs = useMemo(
    () =>
      trip.shortlist
        .map((id) => trip.pool.find((r) => r.id === id))
        .filter((r): r is RecommendationItem => Boolean(r) && !scheduledRefs.has(r!.id)),
    [trip.shortlist, trip.pool, scheduledRefs],
  )

  const shortlistPlace = (recId: string) => {
    updateTrip((prev) => ({
      ...prev,
      shortlist: prev.shortlist.includes(recId) ? prev.shortlist : [...prev.shortlist, recId],
      swiped: prev.swiped.includes(recId) ? prev.swiped : [...prev.swiped, recId],
    }))
  }
  const skipPlace = (recId: string) => {
    updateTrip((prev) => ({ ...prev, swiped: prev.swiped.includes(recId) ? prev.swiped : [...prev.swiped, recId] }))
  }
  const removeFromShortlist = (recId: string) => {
    updateTrip((prev) => ({ ...prev, shortlist: prev.shortlist.filter((id) => id !== recId) }))
  }

  const saveMeta = (meta: TripMeta) => {
    updateTrip((prev) => ({ ...prev, meta }))
    close()
    showToast('Trip updated ✓')
  }

  // ---- hero numbers ---------------------------------------------------------
  const until = useMemo(() => daysBetween(todayIso(), trip.meta.startDate), [trip.meta.startDate])
  const tripLen = daysBetween(trip.meta.startDate, trip.meta.endDate) + 1
  const countdown =
    until > 0 ? `${until} day${until === 1 ? '' : 's'} to go` : until >= 1 - tripLen ? '🎉 Happening now' : 'Trip complete'

  return (
    <>
      <nav className={`stickynav${navShown ? ' shown' : ''}`} aria-label="Trip navigation">
        <div className="stickynav-inner">
          <button className="stickynav-brand" onClick={onHome}>
            🧭 TripPlanner
          </button>
          <div className="stickynav-links">
            <a href="#itinerary">🗓️ Plan</a>
            <a href="#foryou">✨ For you</a>
            <button className="stickynav-link-btn" onClick={() => setDeckOpen(true)}>
              🔥 Discover
            </button>
            <a href="#map">🗺️ Map</a>
          </div>
          <div className="stickynav-right">
            {savedFlash && <span className="saved-dot">Saved ✓</span>}
            <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle dark mode">
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-pattern" aria-hidden="true" />
        <div className="topbar">
          <button className="icon-btn" onClick={onHome} aria-label="Back to all trips" title="All trips">
            🏠
          </button>
          <button className="icon-btn" onClick={() => setModal({ kind: 'settings' })} aria-label="Trip settings" title="Trip settings">
            ⚙️
          </button>
          <button className="icon-btn" onClick={onToggleTheme} aria-label="Toggle dark mode">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
        <div className="container hero-inner hero-stagger">
          <p className="hero-kicker">{countdown}</p>
          <h1 className="hero-title">
            {trip.meta.emoji} {trip.meta.name}
          </h1>
          <p className="hero-sub">
            {dayLabel(trip.meta.startDate)} – {dayLabel(trip.meta.endDate)} · {tripLen} day{tripLen === 1 ? '' : 's'}
          </p>
          <div className="countdown">
            <div className="count-cell">
              <span className="count-num">{trip.scheduled.length}</span>
              <span className="count-label">plans</span>
            </div>
            <div className="count-cell">
              <span className="count-num">{Math.max(until, 0)}</span>
              <span className="count-label">days to go</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 26 }}>
            <button className="btn warm" onClick={() => setDeckOpen(true)}>
              🔥 Discover places
            </button>
            <button className="btn ghost" style={{ borderColor: 'rgba(244,239,230,0.5)', color: '#f4efe6' }} onClick={onRetake}>
              🎯 Retune my trip
            </button>
            {onExport && (
              <button className="btn ghost" style={{ borderColor: 'rgba(244,239,230,0.5)', color: '#f4efe6' }} onClick={onExport}>
                📅 Calendar
              </button>
            )}
            {onShare && (
              <button className="btn ghost" style={{ borderColor: 'rgba(244,239,230,0.5)', color: '#f4efe6' }} onClick={onShare}>
                🔗 Share
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        <Itinerary
          trip={trip}
          onEditItem={(id) => setModal({ kind: 'editItem', itemId: id })}
          onRemoveItem={removeItem}
          onMoveItem={moveItem}
          onAddToDay={(date) => setModal({ kind: 'newItem', date })}
        />

        {shortlistRecs.length > 0 && (
          <section id="shortlist">
            <div className="section-head">
              <p className="section-kicker">Swiped right</p>
              <h2 className="section-title">Your shortlist</h2>
              <p className="section-sub">Places you loved in the deck. Drop one onto a day when you're ready.</p>
            </div>
            <div className="shortlist-row">
              {shortlistRecs.map((rec) => (
                <div key={rec.id} className="shortlist-card">
                  <PlacePhoto rec={rec} destination={trip.meta.destination} />
                  <div className="shortlist-card-body">
                    <span className="shortlist-card-title">
                      {rec.emoji} {rec.title}
                    </span>
                    <div className="shortlist-card-actions">
                      <button className="mini-btn primary" onClick={() => setModal({ kind: 'addToDay', recId: rec.id })}>
                        ＋ Plan
                      </button>
                      <button className="mini-btn" onClick={() => removeFromShortlist(rec.id)} aria-label="Remove from shortlist">
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <Recommendations
          trip={trip}
          onSchedule={(recId, date) => {
            schedule(recId, date)
            burstFromElement(document.querySelector(`[data-dropzone="${date}"]`))
          }}
          onPickDay={(recId) => setModal({ kind: 'addToDay', recId })}
          onDismiss={dismissRec}
          onAddCustom={() => setModal({ kind: 'newItem' })}
          onDiscover={() => setDeckOpen(true)}
          onFindPlaces={onFindPlaces ?? (() => {})}
          findingPlaces={findingPlaces ?? false}
          placesAvailable={placesAvailable ?? false}
        />

        <TripMap
          trip={trip}
          showToast={showToast}
          onImport={(rec) => updateTrip((prev) => ({ ...prev, pool: [...prev.pool, rec] }))}
          onPlan={(recId) => setModal({ kind: 'addToDay', recId })}
        />
      </main>

      <footer>
        {trip.meta.emoji} {trip.meta.name} — every change saves automatically on this device. Use Share to take it to
        another one.
      </footer>

      {deckOpen && (
        <PlaceDeck
          cards={deckCards}
          destination={trip.meta.destination}
          onShortlist={shortlistPlace}
          onSkip={skipPlace}
          onPlan={(recId) => {
            skipPlace(recId)
            setDeckOpen(false)
            setModal({ kind: 'addToDay', recId })
          }}
          onClose={() => setDeckOpen(false)}
          onNeedMore={() => onFindPlaces?.()}
          loadingMore={findingPlaces ?? false}
          canLoadMore={Boolean(placesAvailable)}
        />
      )}

      {modal.kind === 'addToDay' && <AddToDayModal trip={trip} recId={modal.recId} onAdd={schedule} onClose={close} />}
      {(modal.kind === 'newItem' || modal.kind === 'editItem') && (
        <ItemModal
          trip={trip}
          itemId={modal.kind === 'editItem' ? modal.itemId : undefined}
          initialDate={modal.kind === 'newItem' ? modal.date : undefined}
          onSave={saveItem}
          onDelete={removeItem}
          onClose={close}
        />
      )}
      {modal.kind === 'settings' && (
        <TripSettingsModal
          trip={trip}
          onSave={saveMeta}
          onRetake={() => {
            close()
            onRetake()
          }}
          onShare={() => {
            close()
            onShare?.()
          }}
          onDelete={onDelete}
          onClose={close}
        />
      )}
    </>
  )
}
