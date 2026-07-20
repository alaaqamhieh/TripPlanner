import { useMemo, useState } from 'react'
import { rankRecommendations, type ScoredRec } from '../engine/recommend'
import { scheduledRefIds } from '../tripUtils'
import { ALL_INTERESTS, INTEREST_META, type InterestId, type TripState } from '../types'
import { DragItem } from './DragItem'
import PlacePhoto from './PlacePhoto'
import { StarRating } from './StarRating'

// "For you": the ranked recommendation pool. Cards are draggable straight
// onto itinerary days (or tap → day picker). Dismiss anything with ✕.

const PAGE = 12

function RecCard({
  scored,
  destination,
  onPlan,
  onDismiss,
}: {
  scored: ScoredRec
  destination: string
  onPlan: (dropZone: string | null) => void
  onDismiss: () => void
}) {
  const { rec, why } = scored
  const accent = `var(${INTEREST_META[rec.category].cssVar})`
  // Real places (curated, live, or AI) get a photo header; generic ideas stay compact.
  const hasReal = rec.source === 'places' || rec.source === 'signature' || rec.source === 'ai' || Boolean(rec.photo)
  return (
    <DragItem ariaLabel={`${rec.title} — drag onto a day or tap to pick a day`} onChoose={onPlan}>
      <div className={`card${hasReal ? ' card--photo' : ''}`} style={{ ['--card-accent' as string]: accent }}>
        {hasReal && (
          <div className="card-photo-wrap">
            <PlacePhoto rec={rec} destination={destination} className="card-photo" />
            <button
              className="slot-x card-photo-x"
              aria-label={`Not interested in ${rec.title}`}
              title="Not interested"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onDismiss()
              }}
            >
              ✕
            </button>
          </div>
        )}
        <div className="card-top">
          {!hasReal && <span className="card-emoji">{rec.emoji}</span>}
          <div>
            <div className="card-title">
              {hasReal ? `${rec.emoji} ` : ''}
              {rec.title}
            </div>
            <div className="card-meta">
              {INTEREST_META[rec.category].label}
              {rec.duration ? ` · ${rec.duration}` : ''}
              {rec.budgetTier ? ` · ${'$'.repeat(rec.budgetTier)}` : ''}
            </div>
          </div>
          {/* stopPropagation on pointer events too — otherwise the DragItem
              wrapper sees the tap and opens the day picker as well. */}
          {!hasReal && (
            <button
              className="slot-x"
              style={{ marginLeft: 'auto' }}
              aria-label={`Not interested in ${rec.title}`}
              title="Not interested"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onDismiss()
              }}
            >
              ✕
            </button>
          )}
        </div>
        <p className="card-desc">{rec.description}</p>
        {rec.rating !== undefined && (
          <div className="card-meta">
            <StarRating value={rec.rating} /> {rec.rating.toFixed(1)} on Google
          </div>
        )}
        <div className="card-actions">
          {why.length > 0 && <span className="why-tag">✨ {why.join(' · ')}</span>}
          <span
            className="mini-btn primary"
            role="button"
            style={{ marginLeft: 'auto' }}
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onPlan(null)
            }}
          >
            ＋ Plan
          </span>
        </div>
      </div>
    </DragItem>
  )
}

export default function Recommendations({
  trip,
  onSchedule,
  onPickDay,
  onDismiss,
  onAddCustom,
  onDiscover,
  onFindPlaces,
  findingPlaces,
  placesAvailable,
}: {
  trip: TripState
  onSchedule: (recId: string, date: string) => void
  onPickDay: (recId: string) => void
  onDismiss: (recId: string) => void
  onAddCustom: () => void
  onDiscover: () => void
  onFindPlaces: () => void
  findingPlaces: boolean
  placesAvailable: boolean
}) {
  const [filter, setFilter] = useState<InterestId | 'all'>('all')
  const [limit, setLimit] = useState(PAGE)

  const ranked = useMemo(
    () => rankRecommendations(trip.pool, trip.profile, trip.dismissed, scheduledRefIds(trip)),
    [trip],
  )
  const filtered = filter === 'all' ? ranked : ranked.filter((s) => s.rec.category === filter)
  const visible = filtered.slice(0, limit)

  const presentCategories = useMemo(() => {
    const set = new Set(ranked.map((s) => s.rec.category))
    return ALL_INTERESTS.filter((i) => set.has(i))
  }, [ranked])

  return (
    <section id="foryou">
      <div className="section-head">
        <p className="section-kicker">Matched to your answers</p>
        <h2 className="section-title">For you</h2>
        <p className="section-sub">
          Ideas ranked by how well they fit how you travel. Drag one onto a day, or tap ＋ Plan. Not you? Dismiss it —
          the list adapts. Prefer swiping? <strong>🔥 Discover</strong> below flips through them with photos.
        </p>
        <button className="btn warm" style={{ marginTop: 12 }} onClick={onDiscover}>
          🔥 Discover places by swiping
        </button>
      </div>

      <div className="chip-row">
        <button className={`chip${filter === 'all' ? ' on' : ''}`} onClick={() => setFilter('all')}>
          ✨ All
        </button>
        {presentCategories.map((cat) => (
          <button key={cat} className={`chip${filter === cat ? ' on' : ''}`} onClick={() => setFilter(cat)}>
            {INTEREST_META[cat].emoji} {INTEREST_META[cat].label}
          </button>
        ))}
      </div>

      <div className="card-grid">
        {visible.map((s) => (
          <RecCard
            key={s.rec.id}
            scored={s}
            destination={trip.meta.destination}
            onPlan={(zone) => (zone ? onSchedule(s.rec.id, zone) : onPickDay(s.rec.id))}
            onDismiss={() => onDismiss(s.rec.id)}
          />
        ))}
      </div>
      {!visible.length && (
        <p className="empty-hint" style={{ padding: '20px 0' }}>
          Nothing here — clear the filter, add your own idea, or find real places below.
        </p>
      )}

      <div className="card-actions" style={{ marginTop: 18, gap: 10 }}>
        {filtered.length > limit && (
          <button className="btn ghost" onClick={() => setLimit(limit + PAGE)}>
            Show more ideas ({filtered.length - limit} left)
          </button>
        )}
        <button className="btn ghost" onClick={onAddCustom}>
          ➕ Add my own idea
        </button>
        {placesAvailable && (
          <button className="btn" onClick={onFindPlaces} disabled={findingPlaces}>
            {findingPlaces ? 'Searching real places…' : `✨ Find real places in ${trip.meta.name}`}
          </button>
        )}
      </div>
      {!placesAvailable && (
        <p className="search-hint">
          💡 Add a Google Places key to fill this list with real rated places in {trip.meta.destination || 'your destination'} —
          the generic ideas above work everywhere in the meantime.
        </p>
      )}
    </section>
  )
}
