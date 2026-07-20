import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { INTEREST_META, type RecommendationItem } from '../types'
import PlacePhoto from './PlacePhoto'
import { StarRating } from './StarRating'

// A full-screen, photo-first swipe deck for discovering places — TikTok/Tinder
// style. Swipe (or tap the buttons): right = shortlist ❤️, left = skip ✕,
// up = plan it now ➕. Buttons are always visible (gesture is the shortcut),
// with LIKE/NOPE/PLAN overlays and a light haptic tap for feedback.

type Verdict = 'shortlist' | 'skip' | 'plan'

function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    // vibration unsupported — no-op
  }
}

export default function PlaceDeck({
  cards,
  destination,
  onShortlist,
  onSkip,
  onPlan,
  onClose,
  onNeedMore,
  loadingMore,
  canLoadMore,
}: {
  cards: RecommendationItem[]
  destination: string
  onShortlist: (id: string) => void
  onSkip: (id: string) => void
  onPlan: (id: string) => void
  onClose: () => void
  onNeedMore: () => void
  loadingMore: boolean
  canLoadMore: boolean
}) {
  const [idx, setIdx] = useState(0)
  const [leaving, setLeaving] = useState<Verdict | null>(null)
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const [shortlisted, setShortlisted] = useState(0)

  const card = cards[idx]
  const remaining = cards.length - idx

  const commit = (verdict: Verdict) => {
    if (leaving || !card) return
    buzz(verdict === 'skip' ? 12 : verdict === 'shortlist' ? [10, 30, 10] : 20)
    setLeaving(verdict)
    setDrag(null)
    if (verdict === 'shortlist') {
      onShortlist(card.id)
      setShortlisted((n) => n + 1)
    } else if (verdict === 'skip') {
      onSkip(card.id)
    } else {
      onPlan(card.id)
    }
    setTimeout(() => {
      setLeaving(null)
      setIdx((i) => i + 1)
    }, 300)
  }

  const onDown = (e: ReactPointerEvent) => {
    if (leaving) return
    start.current = { x: e.clientX, y: e.clientY }
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onMove = (e: ReactPointerEvent) => {
    if (!start.current) return
    setDrag({ dx: e.clientX - start.current.x, dy: e.clientY - start.current.y })
  }
  const onUp = () => {
    if (!drag) {
      start.current = null
      return
    }
    const { dx, dy } = drag
    start.current = null
    if (dy < -110 && Math.abs(dy) > Math.abs(dx)) commit('plan')
    else if (dx > 100) commit('shortlist')
    else if (dx < -100) commit('skip')
    else setDrag(null)
  }

  const dx = drag?.dx ?? 0
  const dy = drag?.dy ?? 0
  const likeOpacity = Math.max(0, Math.min(1, dx / 90))
  const nopeOpacity = Math.max(0, Math.min(1, -dx / 90))
  const planOpacity = Math.max(0, Math.min(1, -dy / 110))
  const transform = drag ? `translate(${dx}px, ${dy}px) rotate(${dx / 22}deg)` : undefined

  return (
    <div className="deck-overlay" role="dialog" aria-modal="true" aria-label="Discover places">
      <div className="deck-top">
        <button className="quiz-back" onClick={onClose}>
          ← Done
        </button>
        <span className="deck-count">
          {remaining > 0 ? `${remaining} to explore` : 'All caught up'}
          {shortlisted > 0 ? ` · ❤️ ${shortlisted}` : ''}
        </span>
      </div>

      <div className="deck-stage">
        {card ? (
          <>
            {/* Peek of the next card for depth */}
            {cards[idx + 1] && (
              <div className="deck-card deck-card--behind" aria-hidden="true">
                <PlacePhoto rec={cards[idx + 1]} destination={destination} className="deck-photo" eager />
              </div>
            )}
            <div
              key={card.id}
              className={`deck-card${leaving ? ` deck-leaving-${leaving}` : ''}`}
              style={transform ? { transform } : undefined}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
            >
              <div className="deck-photo-wrap">
                <PlacePhoto rec={card} destination={destination} className="deck-photo" eager />
                <span className="deck-badge like" style={{ opacity: likeOpacity }}>
                  ❤️ SHORTLIST
                </span>
                <span className="deck-badge nope" style={{ opacity: nopeOpacity }}>
                  ✕ SKIP
                </span>
                <span className="deck-badge plan" style={{ opacity: planOpacity }}>
                  ➕ PLAN IT
                </span>
                <div className="deck-cat">
                  {INTEREST_META[card.category].emoji} {INTEREST_META[card.category].label}
                </div>
              </div>
              <div className="deck-body">
                <h3 className="deck-title">
                  {card.emoji} {card.title}
                </h3>
                {card.rating !== undefined && (
                  <div className="deck-rating">
                    <StarRating value={card.rating} /> {card.rating.toFixed(1)}
                    {card.ratingCount ? ` · ${card.ratingCount.toLocaleString()} reviews` : ' on Google'}
                  </div>
                )}
                <p className="deck-desc">{card.description}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="deck-empty">
            <div className="deck-empty-emoji">🎉</div>
            <h3>That's the lot!</h3>
            <p className="section-sub" style={{ margin: '6px auto 18px' }}>
              You shortlisted <strong>{shortlisted}</strong> place{shortlisted === 1 ? '' : 's'}. Close this to drop
              them onto your days.
            </p>
            {canLoadMore && (
              <button className="btn" onClick={onNeedMore} disabled={loadingMore}>
                {loadingMore ? 'Finding more…' : '✨ Find more places'}
              </button>
            )}
            <button className="btn ghost" style={{ marginLeft: 8 }} onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>

      {card && (
        <div className="deck-actions">
          <button className="deck-btn skip" aria-label="Skip" onClick={() => commit('skip')}>
            ✕
          </button>
          <button className="deck-btn plan" aria-label="Plan it now" onClick={() => commit('plan')}>
            ➕
          </button>
          <button className="deck-btn love" aria-label="Shortlist" onClick={() => commit('shortlist')}>
            ❤️
          </button>
        </div>
      )}
      {card && <p className="deck-hint">Swipe right to shortlist · left to skip · up to plan it now</p>}
    </div>
  )
}
