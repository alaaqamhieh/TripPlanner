import { searchPlaces } from '../placeSearch'
import type { GuideSection, InterestId, MealSlot, RecommendationItem, TravelerProfile } from '../types'

// Researches a destination into a "must-see & must-eat" guide of REAL, named,
// verified places — the spots travelers can't stop talking about. Google Places
// is the research engine: its ranking and review counts aggregate exactly the
// forums / reviews / word-of-mouth we'd otherwise read by hand, so every entry
// is an actual place you can walk into, never a generic "breakfast by the sea".

export interface GuideResult {
  sections: GuideSection[]
  /** All deduped real places across the guide, to merge into the trip pool. */
  recs: RecommendationItem[]
}

interface SectionPlan {
  key: string
  label: string
  emoji: string
  category: InterestId
  meal?: MealSlot
  queries: string[]
  take: number
}

// Always researched: the essentials + a real named spot for each meal.
const BASE_PLANS: SectionPlan[] = [
  {
    key: 'mustsee',
    label: "Must-see — you can't leave without these",
    emoji: '🗺️',
    category: 'history',
    queries: ['top must-see attractions', 'most iconic landmarks', 'best things to do'],
    take: 6,
  },
  {
    key: 'breakfast',
    label: 'Breakfast everyone raves about',
    emoji: '🌅',
    category: 'food',
    meal: 'breakfast',
    queries: ['best breakfast', 'famous brunch spot'],
    take: 4,
  },
  {
    key: 'lunch',
    label: 'Lunch worth the detour',
    emoji: '☀️',
    category: 'food',
    meal: 'lunch',
    queries: ['best lunch restaurant', 'most popular local restaurant'],
    take: 4,
  },
  {
    key: 'dinner',
    label: 'Dinner you should book',
    emoji: '🌙',
    category: 'food',
    meal: 'dinner',
    queries: ['best dinner restaurant', 'iconic restaurant for dinner'],
    take: 4,
  },
]

// Extra sections added for the traveler's loved interests (history & food are
// already covered by the essentials + meals above).
const BONUS_PLANS: Partial<Record<InterestId, { label: string; emoji: string; queries: string[] }>> = {
  nightlife: { label: 'Nightlife everyone talks about', emoji: '🍸', queries: ['best rooftop bar', 'famous cocktail bar'] },
  museums: { label: 'Museums & galleries to see', emoji: '🖼️', queries: ['best museum', 'must-see art gallery'] },
  nature: { label: 'Nature & the best views', emoji: '🌳', queries: ['most scenic viewpoint', 'best park or garden'] },
  shopping: { label: 'Shopping & markets to hit', emoji: '🛍️', queries: ['famous market', 'best shopping street'] },
  beaches: { label: 'Beaches not to miss', emoji: '🏖️', queries: ['best beach', 'best beach club'] },
  wellness: { label: 'Where to recharge', emoji: '🧖', queries: ['best spa', 'traditional hammam or bathhouse'] },
  adventure: { label: 'Adventure worth doing', emoji: '🧗', queries: ['top outdoor adventure activity', 'best day trip'] },
  family: { label: 'For the kids', emoji: '🎡', queries: ['best family attraction for kids', 'aquarium or zoo'] },
}

/** Rating weighted by how many reviews back it — "how much everyone talks about it". */
function buzzScore(r: RecommendationItem): number {
  return (r.rating ?? 0) * Math.log10((r.ratingCount ?? 1) + 10)
}

/**
 * Research a destination into grouped, real, verified places. Runs each
 * section's Places searches sequentially (gentle on quota), keeps only spots
 * with a genuine rating backed by real reviews, dedupes across sections, and
 * orders each group by buzz. Individual query failures are skipped silently.
 */
export async function buildGuide(profile: TravelerProfile, destination: string): Promise<GuideResult> {
  const where = destination.trim()
  if (!where) return { sections: [], recs: [] }

  const loved = (Object.entries(profile.interests) as [InterestId, 1 | 2][])
    .filter(([, weight]) => weight === 2)
    .map(([interest]) => interest)
    .filter((interest) => interest !== 'history' && interest !== 'food' && BONUS_PLANS[interest])
  const bonusPlans: SectionPlan[] = loved.slice(0, 2).map((interest) => ({
    key: interest,
    label: BONUS_PLANS[interest]!.label,
    emoji: BONUS_PLANS[interest]!.emoji,
    category: interest,
    queries: BONUS_PLANS[interest]!.queries,
    take: 4,
  }))

  const plans = [...BASE_PLANS, ...bonusPlans]
  const chosen = new Map<string, RecommendationItem>() // id → rec, deduped across all sections
  const usedTitles = new Set<string>()
  const sections: GuideSection[] = []

  for (const plan of plans) {
    const bucket: RecommendationItem[] = []
    const seenHere = new Set<string>()
    for (const query of plan.queries) {
      let results: RecommendationItem[] = []
      try {
        results = await searchPlaces(query, where, plan.category)
      } catch {
        results = []
      }
      for (const rec of results) {
        if (chosen.has(rec.id) || usedTitles.has(rec.title.toLowerCase()) || seenHere.has(rec.id)) continue
        seenHere.add(rec.id)
        bucket.push(plan.meal ? { ...rec, meal: plan.meal } : rec)
      }
    }

    // "Verified / everyone talks about it": a real rating backed by enough
    // reviews. Relax the bar only if the strict cut leaves too few.
    const strong = bucket.filter((r) => (r.rating ?? 0) >= 4.2 && (r.ratingCount ?? 0) >= 100)
    const pool = strong.length >= 3 ? strong : bucket.filter((r) => (r.rating ?? 0) >= 4 && (r.ratingCount ?? 0) >= 20)
    const pick = pool.sort((a, b) => buzzScore(b) - buzzScore(a)).slice(0, plan.take)
    if (!pick.length) continue

    for (const rec of pick) {
      chosen.set(rec.id, rec)
      usedTitles.add(rec.title.toLowerCase())
    }
    sections.push({ key: plan.key, label: plan.label, emoji: plan.emoji, recIds: pick.map((r) => r.id) })
  }

  return { sections, recs: [...chosen.values()] }
}
