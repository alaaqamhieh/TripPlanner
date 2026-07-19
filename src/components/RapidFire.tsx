import { useState } from 'react'
import { INTEREST_META, type InterestId, type InterestLevel } from '../types'
import type { RapidFireCard } from '../questionnaire/steps'

// The rapid-fire preference deck: one vivid, personal question per card.
// Love it ❤️ / Could be nice 🙂 / Not for me 🙅 → interest weights 2 / 1 / 0.

type Verdict = 'love' | 'like' | 'nah'

export default function RapidFire({
  cards,
  initial,
  onProgress,
  onDone,
}: {
  cards: RapidFireCard[]
  initial: Partial<Record<InterestId, InterestLevel>>
  onProgress: (answered: number) => void
  onDone: (interests: Partial<Record<InterestId, InterestLevel>>) => void
}) {
  const [idx, setIdx] = useState(0)
  const [leaving, setLeaving] = useState<Verdict | null>(null)
  const [picks, setPicks] = useState<Partial<Record<InterestId, InterestLevel>>>(initial)

  const card = cards[idx]
  if (!card) return null

  const answer = (verdict: Verdict) => {
    if (leaving) return
    setLeaving(verdict)
    const next = { ...picks }
    if (verdict === 'love') next[card.interest] = 2
    else if (verdict === 'like') next[card.interest] = 1
    else delete next[card.interest]
    setPicks(next)
    setTimeout(() => {
      setLeaving(null)
      onProgress(idx + 1)
      if (idx + 1 >= cards.length) onDone(next)
      else setIdx(idx + 1)
    }, 300)
  }

  const accent = `var(${INTEREST_META[card.interest].cssVar})`

  return (
    <div className="rf-wrap">
      <span className="rf-count">
        {idx + 1} of {cards.length}
      </span>
      <div
        key={card.interest}
        className={`rf-card${leaving ? ` out-${leaving}` : ''}`}
        style={{ ['--rf-accent' as string]: accent }}
      >
        <span className="rf-emoji">{card.emoji}</span>
        <p className="rf-q">{card.question}</p>
      </div>
      <div className="rf-actions">
        <button className="rf-btn nah" onClick={() => answer('nah')}>
          🙅 Not for me
        </button>
        <button className="rf-btn like" onClick={() => answer('like')}>
          🙂 Could be nice
        </button>
        <button className="rf-btn love" onClick={() => answer('love')}>
          ❤️ Love it
        </button>
      </div>
    </div>
  )
}
