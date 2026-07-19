import { useCallback, useEffect, useRef, useState } from 'react'
import { loadIndex, loadTrip, saveIndex, saveTrip, deleteTrip as removeTrip } from './storage'
import type { Screen, Theme, TripState, TripsIndex } from './types'
import HomeScreen from './components/HomeScreen'
import Questionnaire from './components/Questionnaire'
import TripView from './components/TripView'

// ---------------------------------------------------------------------------
// App owns all top-level state: which screen is showing (synced to the URL
// hash so refresh/back/share work), the trips index, and the currently open
// trip. Every trip mutation funnels through updateTrip → saveTrip, so every
// change is persisted the moment it happens.
// ---------------------------------------------------------------------------

function screenFromHash(): Screen {
  const hash = window.location.hash
  const tripMatch = /^#\/trip\/([\w-]+)/.exec(hash)
  if (tripMatch) return { mode: 'trip', tripId: tripMatch[1] }
  if (hash.startsWith('#/new')) return { mode: 'questionnaire' }
  return { mode: 'home' }
}

function hashForScreen(screen: Screen): string {
  if (screen.mode === 'trip') return `#/trip/${screen.tripId}`
  if (screen.mode === 'questionnaire') return '#/new'
  return '#/'
}

export default function App() {
  const [index, setIndex] = useState<TripsIndex>(() => loadIndex())
  const [screen, setScreen] = useState<Screen>(() => screenFromHash())
  const [trip, setTrip] = useState<TripState | null>(() => {
    const s = screenFromHash()
    return s.mode === 'trip' ? loadTrip(s.tripId) : null
  })
  const [toast, setToast] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ---- persistence pipeline -------------------------------------------------
  useEffect(() => saveIndex(index), [index])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  /** The single write path for the open trip: mutate, persist, flash "Saved". */
  const updateTrip = useCallback((mutator: (prev: TripState) => TripState) => {
    setTrip((prev) => {
      if (!prev) return prev
      const next = mutator(prev)
      saveTrip(next)
      setSavedFlash(true)
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSavedFlash(false), 1800)
      return next
    })
  }, [])

  // ---- navigation (hash <-> screen) ----------------------------------------
  const navigate = useCallback((next: Screen) => {
    setScreen(next)
    setTrip(next.mode === 'trip' ? loadTrip(next.tripId) : null)
    const hash = hashForScreen(next)
    if (window.location.hash !== hash) window.history.pushState(null, '', hash)
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      const next = screenFromHash()
      setScreen(next)
      setTrip(next.mode === 'trip' ? loadTrip(next.tripId) : null)
    }
    window.addEventListener('hashchange', onHashChange)
    window.addEventListener('popstate', onHashChange)
    return () => {
      window.removeEventListener('hashchange', onHashChange)
      window.removeEventListener('popstate', onHashChange)
    }
  }, [])

  // ---- theme ----------------------------------------------------------------
  useEffect(() => {
    document.documentElement.dataset.theme = index.theme
  }, [index.theme])

  const toggleTheme = useCallback(() => {
    setIndex((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }))
  }, [])

  // ---- trip lifecycle -------------------------------------------------------
  const adoptTrip = useCallback(
    (newTrip: TripState) => {
      saveTrip(newTrip)
      setIndex((prev) =>
        prev.tripIds.includes(newTrip.meta.id) ? prev : { ...prev, tripIds: [...prev.tripIds, newTrip.meta.id] },
      )
      navigate({ mode: 'trip', tripId: newTrip.meta.id })
    },
    [navigate],
  )

  const deleteTrip = useCallback(
    (id: string) => {
      removeTrip(id)
      setIndex((prev) => ({ ...prev, tripIds: prev.tripIds.filter((t) => t !== id) }))
      showToast('Trip deleted')
    },
    [showToast],
  )

  // ---- render ---------------------------------------------------------------
  let content
  if (screen.mode === 'questionnaire') {
    content = (
      <Questionnaire
        retakeTrip={screen.retakeTripId ? loadTrip(screen.retakeTripId) : null}
        onDone={adoptTrip}
        onQuit={() => navigate({ mode: 'home' })}
      />
    )
  } else if (screen.mode === 'trip' && trip) {
    content = (
      <TripView
        trip={trip}
        theme={index.theme}
        savedFlash={savedFlash}
        updateTrip={updateTrip}
        onToggleTheme={toggleTheme}
        onHome={() => navigate({ mode: 'home' })}
        onRetake={() => navigate({ mode: 'questionnaire', retakeTripId: trip.meta.id })}
        onDelete={() => {
          deleteTrip(trip.meta.id)
          navigate({ mode: 'home' })
        }}
        showToast={showToast}
      />
    )
  } else if (screen.mode === 'trip') {
    content = (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Trip not found</h2>
        <p className="section-sub" style={{ margin: '10px auto 20px' }}>
          This trip isn't on this device. Trips live in your browser — open the share link from the device that
          created it, or start a new one.
        </p>
        <button className="btn" onClick={() => navigate({ mode: 'home' })}>
          ← Back home
        </button>
      </div>
    )
  } else {
    content = (
      <HomeScreen
        tripIds={index.tripIds}
        theme={index.theme}
        onToggleTheme={toggleTheme}
        onOpen={(id) => navigate({ mode: 'trip', tripId: id })}
        onNew={() => navigate({ mode: 'questionnaire' })}
        onDelete={deleteTrip}
      />
    )
  }

  return (
    <>
      {content}
      {toast && <div className="toast">{toast}</div>}
    </>
  )
}

export type UpdateTrip = (mutator: (prev: TripState) => TripState) => void
export type ToastFn = (msg: string) => void
export type ThemeToggle = { theme: Theme; onToggleTheme: () => void }
