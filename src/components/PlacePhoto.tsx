import { useEffect, useState } from 'react'
import { resolvePhoto } from '../photos'
import type { RecommendationItem } from '../types'

// Shows a real photo for a place: uses an explicit `photo` (Google Places)
// when present, else lazily resolves one from Wikipedia via `wikiTitle`/title.
// Falls back to an emoji-on-gradient tile so a card is never broken/empty.

const gradients = [
  'linear-gradient(135deg, #0f6b66, #58a7a1)',
  'linear-gradient(135deg, #e2694a, #eb9077)',
  'linear-gradient(135deg, #8a4b6b, #b06f92)',
  'linear-gradient(135deg, #d9a441, #e0b64f)',
  'linear-gradient(135deg, #3e7f8a, #62b3c9)',
]

function gradientFor(id: string): string {
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return gradients[h % gradients.length]
}

export default function PlacePhoto({
  rec,
  destination,
  className,
  eager,
}: {
  rec: RecommendationItem
  destination?: string
  className?: string
  /** Resolve immediately (deck cards) rather than only when a photo exists. */
  eager?: boolean
}) {
  const [src, setSrc] = useState<string>(rec.photo ?? '')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    if (rec.photo) {
      setSrc(rec.photo)
      return
    }
    if (!eager && !rec.wikiTitle) return
    const query = rec.wikiTitle ?? rec.title
    void resolvePhoto(query, destination).then((url) => {
      if (alive && url) setSrc(url)
    })
    return () => {
      alive = false
    }
  }, [rec.photo, rec.wikiTitle, rec.title, destination, eager])

  const showImg = src && !failed
  return (
    <div className={`place-photo${className ? ` ${className}` : ''}`} style={{ background: gradientFor(rec.id) }}>
      {showImg ? (
        <img src={src} alt={rec.title} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="place-photo-emoji" aria-hidden="true">
          {rec.emoji}
        </span>
      )}
    </div>
  )
}
