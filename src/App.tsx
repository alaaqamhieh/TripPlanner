import { useCallback, useEffect, useRef, useState } from 'react'
import { findLivePlaces } from './engine/liveQueries'
import { buildGuide, buildGuideAI } from './engine/mustDo'
import { researchAvailable } from './research'
import { rankRecommendations } from './engine/recommend'
import { scaffoldItinerary } from './engine/scaffold'
import { scheduledRefIds } from './tripUtils'
import { downloadICS } from './ics'
import { placesAvailable } from './placeSearch'
import { decodeTrip, shareUrl, tripFromLocation } from './shareTrip'
import { loadIndex, loadTrip, saveIndex, saveTrip, deleteTrip as removeTrip } from './storage'
import { deviceId, fetchShared, isSyncOn, pushShared } from './sync'
import type { RecommendationItem, Screen, Theme, TripState, TripsIndex } from './types'
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
  const [findingPlaces, setFindingPlaces] = useState(false)
  const [researching, setResearching] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editedRef = useRef(false)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Destination we've already kicked off auto-research for this session.
  const researchedRef = useRef<string>('')

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
      editedRef.current = true
      setSavedFlash(true)
      if (savedTimer.current) clearTimeout(savedTimer.current)
      savedTimer.current = setTimeout(() => setSavedFlash(false), 1800)
      // Debounced cloud push — a no-op unless a sync DB is configured.
      if (isSyncOn()) {
        if (pushTimer.current) clearTimeout(pushTimer.current)
        pushTimer.current = setTimeout(() => void pushShared(next), 1200)
      }
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

  // ---- share-link import ----------------------------------------------------
  // A #trip=<encoded> hash carries a whole trip from another device.
  useEffect(() => {
    const encoded = tripFromLocation()
    if (!encoded) return
    void decodeTrip(encoded).then((shared) => {
      window.history.replaceState(null, '', '#/')
      if (!shared) {
        showToast('That trip link could not be read')
        return
      }
      const exists = loadTrip(shared.meta.id)
      const ok = window.confirm(
        exists
          ? `Update "${shared.meta.name}" on this device with the shared version?`
          : `Import the trip "${shared.meta.name}" (${shared.meta.destination || 'no destination'}) to this device?`,
      )
      if (!ok) return
      saveTrip(shared)
      setIndex((prev) =>
        prev.tripIds.includes(shared.meta.id) ? prev : { ...prev, tripIds: [...prev.tripIds, shared.meta.id] },
      )
      setScreen({ mode: 'trip', tripId: shared.meta.id })
      setTrip(shared)
      window.history.replaceState(null, '', `#/trip/${shared.meta.id}`)
      showToast(`${shared.meta.emoji} Trip imported ✓`)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- optional cloud sync (adopt on open + gentle poll) --------------------
  const openTripId = trip?.meta.id ?? null
  useEffect(() => {
    if (!openTripId || !isSyncOn()) return
    editedRef.current = false
    let cancelled = false
    let lastRemote = 0

    const adopt = (shared: TripState & { _meta?: { deviceId: string; updatedAt: number } }) => {
      const { _meta, ...clean } = shared
      void _meta
      saveTrip(clean)
      setTrip(clean)
    }

    void fetchShared(openTripId).then((shared) => {
      if (cancelled || !shared?._meta) return
      // Local paints instantly; the shared copy takes over unless this device
      // already edited since opening (their edit would win the next push).
      if (shared._meta.deviceId !== deviceId() && !editedRef.current) {
        lastRemote = shared._meta.updatedAt
        adopt(shared)
      }
    })

    const poll = setInterval(() => {
      void fetchShared(openTripId).then((shared) => {
        if (cancelled || !shared?._meta) return
        if (shared._meta.deviceId !== deviceId() && shared._meta.updatedAt > lastRemote) {
          lastRemote = shared._meta.updatedAt
          adopt(shared)
        }
      })
    }, 10000)

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [openTripId])

  // ---- per-trip actions (share, export, live places) ------------------------
  const handleShare = useCallback(() => {
    if (!trip) return
    void shareUrl(trip).then((url) => {
      void navigator.clipboard
        .writeText(url)
        .then(() => showToast('🔗 Trip link copied — open it anywhere to import'))
        .catch(() => window.prompt('Copy your trip link:', url))
    })
  }, [trip, showToast])

  const handleExport = useCallback(() => {
    if (!trip) return
    downloadICS(trip)
    showToast('📅 Calendar file downloaded')
  }, [trip, showToast])

  const handleFindPlaces = useCallback(() => {
    if (!trip || findingPlaces) return
    if (!trip.meta.destination) {
      showToast('Set a destination in trip settings first')
      return
    }
    setFindingPlaces(true)
    void findLivePlaces(trip.profile, trip.meta.destination, trip.pool)
      .then((found: RecommendationItem[]) => {
        if (!found.length) {
          showToast('No new places found — try the map search below')
          return
        }
        updateTrip((prev) => ({ ...prev, pool: [...prev.pool, ...found] }))
        showToast(`✨ Added ${found.length} real place${found.length === 1 ? '' : 's'} for you`)
      })
      .finally(() => setFindingPlaces(false))
  }, [trip, findingPlaces, showToast, updateTrip])

  // Research the destination into a "must-see & must-eat" guide of real, named,
  // verified places. Merges the finds into the pool (remapping any that match a
  // place already there) and — for a fresh, still-empty starter plan — seeds the
  // itinerary from those real spots instead of leaving it blank.
  const handleResearch = useCallback(
    (opts?: { manual?: boolean }) => {
      if (!trip || researching) return
      const dest = trip.meta.destination.trim()
      if (!dest) {
        if (opts?.manual) showToast('Set a destination in trip settings first')
        return
      }
      const profile = trip.profile
      setResearching(true)
      // Prefer the AI + web-search deep research when it's switched on; fall
      // back to the Google-Places-only guide (and again if research yields nothing).
      const run = researchAvailable()
        ? buildGuideAI(profile, dest).then((r) => (r.sections.length ? r : buildGuide(profile, dest)))
        : buildGuide(profile, dest)
      void run
        .catch(() => buildGuide(profile, dest))
        .then((result) => {
          if (!result.sections.length) {
            if (opts?.manual) showToast('Couldn’t find enough top spots — try the map search below')
            return
          }
          updateTrip((prev) => {
            const byId = new Map(prev.pool.map((r) => [r.id, r] as const))
            const byTitle = new Map(prev.pool.map((r) => [r.title.toLowerCase(), r.id] as const))
            const additions: RecommendationItem[] = []
            const remap = new Map<string, string>()
            for (const rec of result.recs) {
              if (byId.has(rec.id)) {
                remap.set(rec.id, rec.id)
                continue
              }
              const title = rec.title.toLowerCase()
              const twin = byTitle.get(title)
              if (twin) {
                remap.set(rec.id, twin)
                continue
              }
              additions.push(rec)
              remap.set(rec.id, rec.id)
              byId.set(rec.id, rec)
              byTitle.set(title, rec.id)
            }
            const sections = result.sections.map((s) => ({
              ...s,
              recIds: s.recIds.map((id) => remap.get(id) ?? id),
            }))
            const pool = [...prev.pool, ...additions]
            const guide = { generatedFor: dest, at: new Date().toISOString(), sections }
            // Seed a real-place starter plan only when the traveler asked to
            // scaffold but nothing's on the calendar yet (e.g. no key at quiz time).
            let scheduled = prev.scheduled
            if (prev.scaffolded && prev.scheduled.length === 0) {
              const ranked = rankRecommendations(pool, profile, prev.dismissed, scheduledRefIds(prev))
              scheduled = scaffoldItinerary(profile, prev.meta, ranked)
            }
            return { ...prev, pool, guide, scheduled }
          })
          if (opts?.manual) {
            showToast(`✨ Researched ${dest.split(',')[0]} — real must-see & must-eat spots below`)
          }
        })
        .finally(() => setResearching(false))
    },
    [trip, researching, showToast, updateTrip],
  )

  // Auto-research a trip's destination once (per session, and once it's been
  // saved with a matching guide it won't re-run across sessions either).
  useEffect(() => {
    if (!trip || researching) return
    const dest = trip.meta.destination.trim()
    if (!dest || !placesAvailable()) return
    if (trip.guide?.generatedFor === dest) return
    if (researchedRef.current === dest) return
    researchedRef.current = dest
    handleResearch()
  }, [trip, researching, handleResearch])

  // ---- trip lifecycle -------------------------------------------------------
  const adoptTrip = useCallback(
    (newTrip: TripState) => {
      saveTrip(newTrip)
      if (isSyncOn()) void pushShared(newTrip)
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
        onShare={handleShare}
        onExport={handleExport}
        onFindPlaces={handleFindPlaces}
        findingPlaces={findingPlaces}
        placesAvailable={placesAvailable()}
        onResearch={() => handleResearch({ manual: true })}
        researching={researching}
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
