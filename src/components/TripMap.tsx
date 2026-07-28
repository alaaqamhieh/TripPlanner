import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { exploreArea, geocode, placesAvailable, searchPlaces } from '../placeSearch'
import { dayStops, routeLabel, walkStats } from '../tripUtils'
import { tripDates, dayLabel } from '../dateUtils'
import { useReveal } from '../useReveal'
import { ALL_INTERESTS, INTEREST_META, type InterestId, type RecommendationItem, type TripState } from '../types'

// Day route colours cycle through the palette so each day's line/pins stand apart.
const DAY_COLORS = ['#0f6b66', '#e2694a', '#d9a441', '#6a5acd', '#2e8b57', '#c2569a', '#3a7bd5']

// The trip map, now an "explore this area" map: pan anywhere, pick a category,
// and pull the most popular, well-reviewed verified places nearby (Google
// Places, ranked by popularity + rating) as pins you can add to your plan or
// shortlist. Pool items with coordinates are always pinned too.

function pinIcon(emoji: string, category: string, kind: 'pool' | 'find'): L.DivIcon {
  return L.divIcon({
    className: `map-pin${kind === 'find' ? ' search' : ''}`,
    html: `<span style="--card-accent: var(--cat-${category})">${emoji}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

type Selected = { rec: RecommendationItem; inPool: boolean }
type Cat = InterestId | 'all'

export default function TripMap({
  trip,
  onPlan,
  onShortlist,
  onImport,
  onOpen,
  showToast,
}: {
  trip: TripState
  onPlan: (recId: string) => void
  onShortlist: (recId: string) => void
  onImport: (rec: RecommendationItem) => void
  onOpen: (recId: string) => void
  showToast: (msg: string) => void
}) {
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const poolLayer = useRef<L.LayerGroup | null>(null)
  const findLayer = useRef<L.LayerGroup | null>(null)
  const routeLayer = useRef<L.LayerGroup | null>(null)
  const fittedOnce = useRef(false)
  const ref = useReveal<HTMLElement>()

  const [selected, setSelected] = useState<Selected | null>(null)
  const [category, setCategory] = useState<Cat>('all')
  const [exploring, setExploring] = useState(false)
  const [findCount, setFindCount] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [routeDay, setRouteDay] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const canSearch = placesAvailable()

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current, { scrollWheelZoom: false, center: [20, 0], zoom: 2 })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map)
    map.on('click', () => setSelected(null))
    mapRef.current = map
    poolLayer.current = L.layerGroup().addTo(map)
    routeLayer.current = L.layerGroup().addTo(map)
    findLayer.current = L.layerGroup().addTo(map)
    return () => {
      map.remove()
      mapRef.current = null
      poolLayer.current = null
      routeLayer.current = null
      findLayer.current = null
      fittedOnce.current = false
    }
  }, [])

  // Pin pool items with coordinates; fit to them once, else centre on the
  // destination so "explore this area" starts where the trip is.
  useEffect(() => {
    const map = mapRef.current
    const layer = poolLayer.current
    if (!map || !layer) return
    layer.clearLayers()
    const withCoords = trip.pool.filter((r) => r.coords)
    for (const rec of withCoords) {
      L.marker(rec.coords!, { icon: pinIcon(rec.emoji, rec.category, 'pool') })
        .on('click', () => setSelected({ rec, inPool: true }))
        .addTo(layer)
    }
    if (fittedOnce.current) return
    if (withCoords.length) {
      map.fitBounds(L.latLngBounds(withCoords.map((r) => r.coords!)), { padding: [40, 40], maxZoom: 14 })
      fittedOnce.current = true
    } else if (canSearch && trip.meta.destination) {
      fittedOnce.current = true
      void geocode(trip.meta.destination).then((c) => {
        if (c && mapRef.current) mapRef.current.setView(c, 13)
      })
    }
  }, [trip.pool, trip.meta.destination, canSearch])

  // Days that have at least two located, scheduled stops — the ones worth routing.
  const routableDays = tripDates(trip.meta.startDate, trip.meta.endDate)
    .map((date, i) => ({ date, dayNum: i + 1, stops: dayStops(trip, date) }))
    .filter((d) => d.stops.length >= 2)

  const activeDay = routeDay && routableDays.some((d) => d.date === routeDay) ? routeDay : null
  const activeStats = activeDay ? walkStats(dayStops(trip, activeDay)) : null

  // Draw the selected day's route: a dashed line through the day's stops in
  // visiting order with numbered markers, fitted to the route.
  useEffect(() => {
    const map = mapRef.current
    const layer = routeLayer.current
    if (!map || !layer) return
    layer.clearLayers()
    if (!activeDay) return
    const stops = dayStops(trip, activeDay)
    if (stops.length < 2) return
    const dayIdx = routableDays.findIndex((d) => d.date === activeDay)
    const color = DAY_COLORS[Math.max(0, dayIdx) % DAY_COLORS.length]
    const path = stops.map((s) => s.coords)
    L.polyline(path, { color, weight: 3, opacity: 0.85, dashArray: '2 8', lineCap: 'round' }).addTo(layer)
    stops.forEach((stop, i) => {
      const marker = L.marker(stop.coords, {
        icon: L.divIcon({
          className: 'map-pin route',
          html: `<span style="--route-color: ${color}">${i + 1}</span>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        }),
        zIndexOffset: 500,
      })
      marker.bindTooltip(`${i + 1}. ${stop.title}`, { direction: 'top', offset: [0, -12] })
      marker.addTo(layer)
    })
    map.fitBounds(L.latLngBounds(path), { padding: [60, 60], maxZoom: 15 })
  }, [activeDay, trip.scheduled, trip.pool])

  const searchThisArea = async () => {
    const map = mapRef.current
    if (!map || exploring) return
    setExploring(true)
    setNote('')
    setSelected(null)
    try {
      const center = map.getCenter()
      const ne = map.getBounds().getNorthEast()
      const radius = map.distance(center, ne) // metres, centre → corner ≈ visible area
      const found = await exploreArea([center.lat, center.lng], radius, category)
      const layer = findLayer.current
      layer?.clearLayers()
      for (const rec of found) {
        L.marker(rec.coords!, { icon: pinIcon(rec.emoji, rec.category, 'find') })
          .on('click', () => setSelected({ rec, inPool: trip.pool.some((r) => r.id === rec.id) }))
          .addTo(layer!)
      }
      setFindCount(found.length)
      if (!found.length) setNote('No highly-rated spots here — try zooming out or another category.')
    } catch {
      setNote('Couldn’t search here just now — check the connection (or the API key) and try again.')
    } finally {
      setExploring(false)
    }
  }

  const runTextSearch = async () => {
    const q = query.trim()
    if (!q || searching) return
    setSearching(true)
    setNote('')
    try {
      const found = await searchPlaces(q, trip.meta.destination || trip.meta.name)
      const layer = findLayer.current
      const map = mapRef.current
      layer?.clearLayers()
      const withCoords = found.filter((r) => r.coords)
      for (const rec of withCoords) {
        L.marker(rec.coords!, { icon: pinIcon(rec.emoji, rec.category, 'find') })
          .on('click', () => setSelected({ rec, inPool: trip.pool.some((r) => r.id === rec.id) }))
          .addTo(layer!)
      }
      setFindCount(withCoords.length)
      if (withCoords.length && map) map.fitBounds(L.latLngBounds(withCoords.map((r) => r.coords!)), { padding: [40, 40], maxZoom: 15 })
      if (!found.length) setNote('No places found — try different words.')
    } catch {
      setNote('Search failed — try again.')
    } finally {
      setSearching(false)
    }
  }

  const act = (rec: RecommendationItem, how: 'plan' | 'shortlist' | 'open') => {
    if (!trip.pool.some((r) => r.id === rec.id)) onImport(rec)
    if (how === 'open') {
      setSelected(null)
      onOpen(rec.id)
      return
    }
    setSelected(null)
    if (how === 'plan') onPlan(rec.id)
    else {
      onShortlist(rec.id)
      showToast(`❤️ Shortlisted ${rec.title}`)
    }
  }

  return (
    <section id="map" ref={ref} className="reveal">
      <div className="section-head">
        <p className="section-kicker">Explore on the map</p>
        <h2 className="section-title">Find the best places near you</h2>
        <p className="section-sub">
          {canSearch
            ? 'Move the map to any area, pick a vibe, and pull the most popular, best-reviewed spots there — then add them to a day or your shortlist.'
            : 'Add a Google Places key to explore top-rated verified places on the map. Curated ideas above work everywhere in the meantime.'}
        </p>
      </div>

      {canSearch && (
        <>
          <div className="chip-row" style={{ marginBottom: 8 }}>
            <button className={`chip${category === 'all' ? ' on' : ''}`} onClick={() => setCategory('all')}>
              ⭐ Top spots
            </button>
            {ALL_INTERESTS.map((c) => (
              <button key={c} className={`chip${category === c ? ' on' : ''}`} onClick={() => setCategory(c)}>
                {INTEREST_META[c].emoji} {INTEREST_META[c].label}
              </button>
            ))}
          </div>
          <div className="map-search">
            <input
              placeholder={`Or search a place by name in ${trip.meta.destination.split(',')[0] || 'your destination'}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runTextSearch()}
              aria-label="Search for a place by name"
            />
            <button className="btn ghost" onClick={runTextSearch} disabled={searching || !query.trim()}>
              {searching ? '…' : '🔍'}
            </button>
          </div>
        </>
      )}
      {note && <p className="search-hint error">{note}</p>}
      {findCount !== null && !note && (
        <p className="search-hint">
          Showing {findCount} top-rated {category === 'all' ? 'spot' : INTEREST_META[category as InterestId].label.toLowerCase()}
          {findCount === 1 ? '' : 's'} — tap a pin to add it.
        </p>
      )}

      {routableDays.length > 0 && (
        <div className="map-routes">
          <div className="chip-row">
            <button className={`chip${!activeDay ? ' on' : ''}`} onClick={() => setRouteDay(null)}>
              Hide routes
            </button>
            {routableDays.map((d, i) => (
              <button
                key={d.date}
                className={`chip route-chip${activeDay === d.date ? ' on' : ''}`}
                style={{ ['--route-color' as string]: DAY_COLORS[i % DAY_COLORS.length] }}
                onClick={() => setRouteDay(d.date)}
              >
                Day {d.dayNum} route
              </button>
            ))}
          </div>
          {activeDay && activeStats && (
            <p className="search-hint route-summary">
              🚶 {dayLabel(activeDay)} · {routeLabel(activeStats)}
            </p>
          )}
        </div>
      )}

      <div className="map-wrap" style={{ marginTop: 10 }}>
        <div ref={mapEl} className="trip-map" />

        {canSearch && !selected && (
          <button className="map-explore-btn" onClick={searchThisArea} disabled={exploring}>
            {exploring ? 'Searching…' : '🔎 Search this area'}
          </button>
        )}

        {selected && (
          <div className="map-detail">
            <span className="map-detail-emoji">{selected.rec.emoji}</span>
            <div className="map-detail-body">
              <strong>{selected.rec.title}</strong>
              <span className="map-detail-meta">
                {INTEREST_META[selected.rec.category].label}
                {selected.rec.rating ? ` · ⭐ ${selected.rec.rating.toFixed(1)}` : ''}
                {selected.rec.ratingCount ? ` (${selected.rec.ratingCount.toLocaleString()})` : ''}
                {selected.rec.budgetTier ? ` · ${'$'.repeat(selected.rec.budgetTier)}` : ''}
              </span>
              {!selected.inPool && <span className="map-detail-tag new">Found on the map — not in your trip yet</span>}
            </div>
            <div className="map-detail-actions">
              <button className="btn" onClick={() => act(selected.rec, 'plan')}>
                ＋ Plan it
              </button>
              <button className="btn ghost" onClick={() => act(selected.rec, 'open')}>
                ℹ️ Details
              </button>
              <button className="btn ghost" onClick={() => act(selected.rec, 'shortlist')}>
                ❤️ Shortlist
              </button>
              {selected.rec.googleUrl && (
                <a className="btn ghost" href={selected.rec.googleUrl} target="_blank" rel="noreferrer">
                  📍 Maps
                </a>
              )}
            </div>
            <button className="map-detail-close" onClick={() => setSelected(null)} aria-label="Close details">
              ✕
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
