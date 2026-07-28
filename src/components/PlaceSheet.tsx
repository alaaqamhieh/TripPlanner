import { useEffect, useState } from 'react'
import { placeDetails, type PlaceDetails } from '../placeSearch'
import { INTEREST_META, type RecommendationItem } from '../types'
import Modal from './Modal'
import PlacePhoto from './PlacePhoto'
import { StarRating } from './StarRating'

// A rich detail sheet for any place — photo(s), rating & reviews, the "why it's
// loved" blurb with a source link, opening hours / website / phone (lazily
// fetched from Places), and quick actions. Opened from the guide, the map, the
// recommendation cards and the itinerary.

export default function PlaceSheet({
  rec,
  destination,
  planned,
  shortlisted,
  onPlan,
  onShortlist,
  onClose,
}: {
  rec: RecommendationItem
  destination: string
  planned: boolean
  shortlisted: boolean
  onPlan: () => void
  onShortlist: () => void
  onClose: () => void
}) {
  const [details, setDetails] = useState<PlaceDetails | null>(null)
  const [showHours, setShowHours] = useState(false)

  useEffect(() => {
    let live = true
    if (rec.placeId) void placeDetails(rec.placeId).then((d) => live && setDetails(d))
    return () => {
      live = false
    }
  }, [rec.placeId])

  const gallery = [...(rec.photos ?? []), ...(details?.photos ?? [])].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6)
  const openNow = details?.openNow
  const website = rec.website ?? details?.website
  const phone = rec.phone ?? details?.phone
  const hours = rec.hours ?? details?.hours
  const meta = [
    INTEREST_META[rec.category].label,
    rec.neighborhood,
    rec.budgetTier ? '$'.repeat(rec.budgetTier) : '',
  ].filter(Boolean)

  return (
    <Modal onClose={onClose} className="place-sheet modal-tall">
      <button className="place-sheet-close" onClick={onClose} aria-label="Close">
        ✕
      </button>
      <div className="place-sheet-photo">
        {gallery.length > 1 ? (
          <div className="place-gallery">
            {gallery.map((src) => (
              <img key={src} src={src} alt="" loading="lazy" />
            ))}
          </div>
        ) : (
          <PlacePhoto rec={rec} destination={destination} />
        )}
      </div>

      <div className="place-sheet-body">
        <h3 className="place-sheet-title">
          {rec.emoji} {rec.title}
        </h3>
        <div className="place-sheet-meta">
          {meta.join(' · ')}
          {openNow !== undefined && (
            <span className={`place-open${openNow ? ' yes' : ' no'}`}>{openNow ? 'Open now' : 'Closed now'}</span>
          )}
        </div>
        {rec.rating !== undefined && (
          <div className="place-sheet-rating">
            <StarRating value={rec.rating} /> {rec.rating.toFixed(1)}
            {rec.ratingCount ? ` · ${rec.ratingCount.toLocaleString()} reviews` : ''}
          </div>
        )}

        {rec.description && (
          <p className="place-sheet-why">
            {rec.description}
            {rec.sourceUrl && (
              <>
                {' '}
                <a href={rec.sourceUrl} target="_blank" rel="noreferrer" className="place-source">
                  🔗 {rec.sourceLabel || 'source'}
                </a>
              </>
            )}
          </p>
        )}

        {hours && hours.length > 0 && (
          <div className="place-hours">
            <button className="place-hours-toggle" onClick={() => setShowHours((s) => !s)}>
              🕑 Opening hours {showHours ? '▲' : '▼'}
            </button>
            {showHours && (
              <ul>
                {hours.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="place-sheet-actions">
          {planned ? (
            <span className="btn ghost" aria-disabled="true">
              ✓ In your plan
            </span>
          ) : (
            <button
              className="btn"
              onClick={() => {
                onPlan()
                onClose()
              }}
            >
              ＋ Plan it
            </button>
          )}
          <button className={`btn ghost${shortlisted ? ' warm' : ''}`} onClick={onShortlist}>
            {shortlisted ? '❤️ Saved' : '❤️ Shortlist'}
          </button>
          {rec.googleUrl && (
            <a className="btn ghost" href={rec.googleUrl} target="_blank" rel="noreferrer">
              📍 Maps
            </a>
          )}
          {website && (
            <a className="btn ghost" href={website} target="_blank" rel="noreferrer">
              🌐 Website
            </a>
          )}
          {phone && (
            <a className="btn ghost" href={`tel:${phone}`}>
              📞 Call
            </a>
          )}
        </div>
      </div>
    </Modal>
  )
}
