import { useMemo } from 'react'
import { scheduledRefIds } from '../tripUtils'
import { INTEREST_META, type RecommendationItem, type TripState } from '../types'
import PlacePhoto from './PlacePhoto'

// The researched "essentials" for a destination: real, named, verified places
// grouped into must-see + breakfast / lunch / dinner (+ the traveler's loved
// interests). Every card is an actual place you can add to a day or shortlist —
// never a generic idea. Powered by App's buildGuide (Google Places research).

function buzzLine(rec: RecommendationItem): string | null {
  if (rec.rating === undefined) return null
  const count = rec.ratingCount
  if (count && count >= 1000) return `⭐ ${rec.rating.toFixed(1)} · ${Math.round(count / 1000)}k reviews`
  if (count) return `⭐ ${rec.rating.toFixed(1)} · ${count.toLocaleString()} reviews`
  return `⭐ ${rec.rating.toFixed(1)} on Google`
}

function GuideCard({
  rec,
  destination,
  planned,
  shortlisted,
  onPlan,
  onShortlist,
  onOpen,
}: {
  rec: RecommendationItem
  destination: string
  planned: boolean
  shortlisted: boolean
  onPlan: () => void
  onShortlist: () => void
  onOpen: () => void
}) {
  const accent = `var(${INTEREST_META[rec.category].cssVar})`
  const buzz = buzzLine(rec)
  return (
    <article className="guide-card" style={{ ['--card-accent' as string]: accent }}>
      <button className="guide-card-photo" onClick={onOpen} aria-label={`More about ${rec.title}`}>
        <PlacePhoto rec={rec} destination={destination} />
        {buzz && <span className="guide-card-buzz">{buzz}</span>}
      </button>
      <div className="guide-card-body">
        <h4 className="guide-card-title">
          <button className="guide-card-titlebtn" onClick={onOpen}>
            {rec.emoji} {rec.title}
          </button>
        </h4>
        <p className="guide-card-desc">{rec.description}</p>
        {rec.sourceUrl && (
          <a className="guide-card-source" href={rec.sourceUrl} target="_blank" rel="noreferrer">
            🔗 {rec.sourceLabel || 'Why locals love it'}
          </a>
        )}
        <div className="guide-card-actions">
          {planned ? (
            <span className="mini-btn is-planned" aria-disabled="true">
              ✓ In your plan
            </span>
          ) : (
            <button className="mini-btn primary" onClick={onPlan}>
              ＋ Plan it
            </button>
          )}
          <button
            className={`mini-btn${shortlisted ? ' is-on' : ''}`}
            onClick={onShortlist}
            aria-pressed={shortlisted}
            title={shortlisted ? 'On your shortlist' : 'Add to shortlist'}
          >
            {shortlisted ? '❤️ Saved' : '❤️ Shortlist'}
          </button>
          {rec.googleUrl && (
            <a className="mini-btn" href={rec.googleUrl} target="_blank" rel="noreferrer" title="Open in Google Maps">
              📍 Maps
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export default function MustDoGuide({
  trip,
  onPlan,
  onShortlist,
  onOpen,
  onResearch,
  researching,
  placesAvailable,
}: {
  trip: TripState
  onPlan: (recId: string) => void
  onShortlist: (recId: string) => void
  onOpen: (recId: string) => void
  onResearch: () => void
  researching: boolean
  placesAvailable: boolean
}) {
  const city = trip.meta.name || trip.meta.destination.split(',')[0] || 'your destination'
  const byId = useMemo(() => new Map(trip.pool.map((r) => [r.id, r] as const)), [trip.pool])
  const plannedIds = useMemo(() => scheduledRefIds(trip), [trip])
  const shortlistIds = useMemo(() => new Set(trip.shortlist), [trip.shortlist])

  const guide = trip.guide
  const fresh = guide?.generatedFor === trip.meta.destination
  const sections = fresh
    ? guide!.sections
        .map((s) => ({ ...s, recs: s.recIds.map((id) => byId.get(id)).filter((r): r is RecommendationItem => Boolean(r)) }))
        .filter((s) => s.recs.length > 0)
    : []

  // No key: honest note — the guide needs Places to research real spots.
  if (!placesAvailable && !sections.length) {
    return (
      <section id="essentials">
        <div className="section-head">
          <p className="section-kicker">Researched for you</p>
          <h2 className="section-title">The essentials in {city}</h2>
          <p className="section-sub">
            Add a Google Places key and I’ll research {trip.meta.destination || 'your destination'} into the real
            must-see sights and the breakfast, lunch and dinner spots everyone talks about — actual named places, ready
            to drop onto a day.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section id="essentials">
      <div className="section-head">
        <p className="section-kicker">Researched for you</p>
        <h2 className="section-title">The essentials in {city}</h2>
        <p className="section-sub">
          The real must-see sights and the breakfast, lunch &amp; dinner spots travelers rave about — pulled from the
          highest-rated, most-reviewed places on Google. Every one is an actual named place: tap{' '}
          <strong>＋ Plan it</strong> to drop it onto a day, or <strong>❤️ Shortlist</strong> to save it for later.
        </p>
        {(!sections.length || researching) && (
          <button className="btn" style={{ marginTop: 12 }} onClick={onResearch} disabled={researching}>
            {researching ? `Researching ${city}…` : sections.length ? '🔄 Refresh the research' : `🔎 Research ${city}`}
          </button>
        )}
        {sections.length > 0 && !researching && (
          <button className="btn ghost" style={{ marginTop: 12 }} onClick={onResearch}>
            🔄 Re-research {city}
          </button>
        )}
      </div>

      {researching && !sections.length && (
        <div className="guide-loading">
          <span className="guide-spinner" aria-hidden="true" />
          Digging through reviews, ratings and the spots everyone recommends…
        </div>
      )}

      {sections.map((section) => (
        <div key={section.key} className="guide-section">
          <h3 className="guide-section-title">
            <span className="guide-section-emoji">{section.emoji}</span>
            {section.label}
          </h3>
          <div className="guide-row">
            {section.recs.map((rec) => (
              <GuideCard
                key={rec.id}
                rec={rec}
                destination={trip.meta.destination}
                planned={plannedIds.has(rec.id)}
                shortlisted={shortlistIds.has(rec.id)}
                onPlan={() => onPlan(rec.id)}
                onShortlist={() => onShortlist(rec.id)}
                onOpen={() => onOpen(rec.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
