import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { placesAvailable, searchPlaces } from '../placeSearch'
import { useReveal } from '../useReveal'
import { INTEREST_META, type RecommendationItem, type TripState } from '../types'

// The trip map: every pool idea with coordinates gets an emoji pin (only
// real imported places have coords), plus a free-text place search that can
// pull anything in the destination onto the map and into the pool.

function pinIcon(emoji: string, category: string, search = false): L.DivIcon {
  return L.divIcon({
    className: `map-pin${search ? ' search' : ''}`,
    html: `<span style="--card-accent: var(--cat-${category})">${emoji}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

type Selected = { rec: RecommendationItem; inPool: boolean }

export default function TripMap({
  trip,
  onPlan,
  onImport,
  showToast,
}: {
  trip: TripState
  /** Open the day-picker for a pool item. */
  onPlan: (recId: string) => void
  /** Add a searched place to the pool; returns nothing (map re-pins live). */
  onImport: (rec: RecommendationItem) => void
  showToast: (msg: string) => void
}) {
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const poolLayer = useRef<L.LayerGroup | null>(null)
  const searchLayer = useRef<L.LayerGroup | null>(null)
  const fittedOnce = useRef(false)
  const [selected, setSelected] = useState<Selected | null>(null)
  const ref = useReveal<HTMLElement>()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<RecommendationItem[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const canSearch = placesAvailable()

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current, { scrollWheelZoom: false, center: [20, 0], zoom: 2 })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map)
    map.on('click', () => setSelected(null))
    mapRef.current = map
    poolLayer.current = L.layerGroup().addTo(map)
    searchLayer.current = L.layerGroup().addTo(map)
    return () => {
      map.remove()
      mapRef.current = null
      poolLayer.current = null
      searchLayer.current = null
      fittedOnce.current = false
    }
  }, [])

  // (Re)pin pool items whenever they change, so imports show up live.
  useEffect(() => {
    const map = mapRef.current
    const layer = poolLayer.current
    if (!map || !layer) return
    layer.clearLayers()
    const withCoords = trip.pool.filter((r) => r.coords)
    for (const rec of withCoords) {
      L.marker(rec.coords!, { icon: pinIcon(rec.emoji, rec.category) })
        .on('click', () => setSelected({ rec, inPool: true }))
        .addTo(layer)
    }
    if (withCoords.length && !fittedOnce.current) {
      map.fitBounds(L.latLngBounds(withCoords.map((r) => r.coords!)), { padding: [40, 40], maxZoom: 13 })
      fittedOnce.current = true
    }
  }, [trip.pool])

  const runSearch = async () => {
    const q = query.trim()
    if (!q || searching) return
    setSearching(true)
    setSearchError('')
    try {
      const found = await searchPlaces(q, trip.meta.destination || trip.meta.name)
      setResults(found)
      const layer = searchLayer.current
      const map = mapRef.current
      if (layer && map) {
        layer.clearLayers()
        const withCoords = found.filter((r) => r.coords)
        for (const rec of withCoords) {
          L.marker(rec.coords!, { icon: pinIcon(rec.emoji, rec.category, true) })
            .on('click', () => setSelected({ rec, inPool: false }))
            .addTo(layer)
        }
        if (withCoords.length) {
          map.fitBounds(L.latLngBounds(withCoords.map((r) => r.coords!)), { padding: [40, 40], maxZoom: 14 })
        }
      }
      if (!found.length) setSearchError('No places found — try different words.')
    } catch {
      setSearchError('Search failed — check the connection (or the API key) and try again.')
    } finally {
      setSearching(false)
    }
  }

  const importAndPlan = (rec: RecommendationItem, plan: boolean) => {
    const already = trip.pool.some((r) => r.id === rec.id)
    if (!already) onImport(rec)
    setSelected(null)
    searchLayer.current?.clearLayers()
    setResults(null)
    if (plan) onPlan(rec.id)
    else showToast(`${rec.emoji} Added to your ideas ✓`)
  }

  return (
    <section id="map" ref={ref} className="reveal">
      <div className="section-head">
        <p className="section-kicker">Get your bearings</p>
        <h2 className="section-title">Trip map</h2>
        <p className="section-sub">
          Real places you've found get pins here.{' '}
          {canSearch
            ? 'Search anything — a restaurant someone recommended, a viewpoint, a neighborhood — and add it to your plan.'
            : 'Add a Google Places key to search and pin real spots; ideas without an exact address stay in the list above.'}
        </p>
      </div>

      {canSearch && (
        <div className="map-search">
          <input
            placeholder={`Search places in ${trip.meta.destination.split(',')[0] || 'your destination'}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearch()}
            aria-label="Search for a place"
          />
          <button className="btn" onClick={runSearch} disabled={searching || !query.trim()}>
            {searching ? 'Searching…' : '🔍 Search'}
          </button>
        </div>
      )}
      {searchError && <p className="search-hint error">{searchError}</p>}
      {results && results.length > 0 && (
        <div className="place-results">
          {results.map((rec) => (
            <div key={rec.id} className="place-row">
              <button className="place-pick" onClick={() => setSelected({ rec, inPool: false })}>
                <span className="place-name">
                  {rec.emoji} {rec.title}
                  {rec.rating ? ` · ${rec.rating.toFixed(1)}★` : ''}
                </span>
                <span className="place-meta">{rec.description}</span>
              </button>
              <button className="mini-btn primary" onClick={() => importAndPlan(rec, true)}>
                ＋ Plan
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="map-wrap" style={{ marginTop: 12 }}>
        <div ref={mapEl} className="trip-map" />
        {selected && (
          <div className="map-detail">
            <span className="map-detail-emoji">{selected.rec.emoji}</span>
            <div className="map-detail-body">
              <strong>{selected.rec.title}</strong>
              <span className="map-detail-meta">
                {INTEREST_META[selected.rec.category].label}
                {selected.rec.rating ? ` · ${selected.rec.rating.toFixed(1)}★` : ''}
              </span>
              {!selected.inPool && <span className="map-detail-tag new">New find — not in your ideas yet</span>}
            </div>
            <div className="map-detail-actions">
              <button className="btn" onClick={() => importAndPlan(selected.rec, true)}>
                ＋ Plan it
              </button>
              {!selected.inPool && (
                <button className="btn ghost" onClick={() => importAndPlan(selected.rec, false)}>
                  Save for later
                </button>
              )}
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
