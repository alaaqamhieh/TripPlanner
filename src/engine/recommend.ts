import type { RecommendationItem, TravelerProfile } from '../types'

// ---------------------------------------------------------------------------
// Recommendation ranking: a transparent additive score against the traveler
// profile. Pure and deterministic — recomputed instantly when the profile
// changes (e.g. after retaking the quiz).
// ---------------------------------------------------------------------------

/** Why a rec matched — short human-readable hints for the "why this" line. */
export interface ScoredRec {
  rec: RecommendationItem
  score: number
  why: string[]
}

export function scoreRec(rec: RecommendationItem, profile: TravelerProfile): ScoredRec {
  const why: string[] = []
  let score = 0

  // Interests: love=2, like=1, unselected gets a small serendipity floor.
  const weight = profile.interests[rec.category] ?? 0
  score += 3 * (weight === 0 ? 0.3 : weight)
  if (weight === 2) why.push(`you love ${rec.category === 'food' ? 'food' : rec.category}`)
  else if (weight === 1) why.push(`you liked ${rec.category}`)

  // Must-haves are strong signals.
  const tagHits = (rec.tags ?? []).filter((t) => profile.mustHaves.includes(t))
  score += 2 * tagHits.length
  if (tagHits.length) why.push('one of your must-haves')

  // Budget fit: rec tiers run 1–3; treat profile tier 4 (luxury) as 3.
  if (rec.budgetTier) {
    const target = Math.min(profile.budget, 3)
    score += Math.abs(rec.budgetTier - target) <= 1 ? 1 : -1
    if (rec.budgetTier <= target) why.push('fits your budget')
  }

  // Pace: relaxed travelers get fewer all-day epics; packed ones get more.
  const fullDay = rec.duration === 'Full day' || rec.duration === 'Half day'
  if (profile.pace === 'relaxed' && rec.duration === 'Full day') score -= 1
  if (profile.pace === 'packed' && fullDay) score += 0.5

  // Kids change everything.
  if (profile.hasKids) {
    if (rec.tags?.includes('kidFriendly')) {
      score += 1.5
      why.push('great with kids')
    }
    if (rec.category === 'nightlife') score -= 2
  }

  // Match the traveler's clock.
  if (profile.rhythm === 'night' && (rec.timeOfDay === 'evening' || rec.tags?.includes('nightOwl'))) {
    score += 1
    why.push('night-owl approved')
  }
  if (profile.rhythm === 'early' && rec.timeOfDay === 'morning') score += 0.5

  // Real places with good ratings edge out their generic template twins.
  if (rec.source === 'places' || rec.source === 'research') {
    score += 0.5 + (rec.rating ?? 3.5) / 5
    if ((rec.rating ?? 0) >= 4.5) why.push(`rated ${rec.rating}★`)
  }

  return { rec, score, why: why.slice(0, 2) }
}

/** Normalized-title key so a live place dedupes its template twin. */
function titleKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/**
 * Rank the pool for this traveler: filter dismissed + already-scheduled,
 * score, sort, and dedupe near-identical titles (places beat templates).
 */
export function rankRecommendations(
  pool: RecommendationItem[],
  profile: TravelerProfile,
  dismissed: string[],
  scheduledRefIds: Set<string>,
): ScoredRec[] {
  const scored = pool
    .filter((r) => !dismissed.includes(r.id) && !scheduledRefIds.has(r.id))
    .map((r) => scoreRec(r, profile))
    .sort((a, b) => b.score - a.score || a.rec.title.localeCompare(b.rec.title))

  const seen = new Set<string>()
  const out: ScoredRec[] = []
  for (const s of scored) {
    const key = titleKey(s.rec.title)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(s)
  }
  return out
}
