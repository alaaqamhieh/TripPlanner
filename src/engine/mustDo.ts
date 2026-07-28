import { searchPlaces, smartEmoji } from '../placeSearch'
import { researchGuide } from '../research'
import { ALL_INTERESTS, type GuideSection, type InterestId, type MealSlot, type RecommendationItem, type TravelerProfile } from '../types'

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

// --- AI + web-search deep research (grounded through Google Places) ----------

const SECTION_MEAL: Record<string, MealSlot | undefined> = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'dinner',
}

function asCategory(value: string, fallback: InterestId): InterestId {
  return (ALL_INTERESTS as readonly string[]).includes(value) ? (value as InterestId) : fallback
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * Research a destination with Claude + live web search (forums, blogs, reviews,
 * local-language), then ground each named place through Google Places for a
 * rating, review count, photo and coordinates. Every card is a real, review-
 * backed place with a "why" and a source link. Throws if research yields
 * nothing so the caller can fall back to the Places-only guide.
 */
export async function buildGuideAI(profile: TravelerProfile, destination: string): Promise<GuideResult> {
  const where = destination.trim()
  const research = await researchGuide(profile, where)
  if (!research.sections.length) return { sections: [], recs: [] }

  // Enrich every named place through Places in parallel (bounded by section size).
  const seen = new Set<string>()
  const sections: GuideSection[] = []
  const recs: RecommendationItem[] = []

  for (const section of research.sections) {
    const meal = SECTION_MEAL[section.key]
    const fallbackCat: InterestId = meal ? 'food' : 'history'
    const enriched = await Promise.all(
      section.places.slice(0, 8).map(async (place) => {
        const category = asCategory(place.category, fallbackCat)
        const query = [place.name, place.neighborhood].filter(Boolean).join(' ')
        let match: RecommendationItem | undefined
        try {
          const results = await searchPlaces(query, where, category)
          match = results.find((r) => r.coords) ?? results[0]
        } catch {
          match = undefined
        }
        const rec: RecommendationItem = {
          id: match?.id ?? `re-${slug(place.name)}`,
          source: 'research',
          title: place.name,
          emoji: match?.emoji ?? smartEmoji([category]),
          category,
          description: place.why,
          neighborhood: place.neighborhood ?? match?.neighborhood,
          sourceUrl: place.source,
          sourceLabel: place.sourceLabel,
          meal: meal ?? match?.meal,
          coords: match?.coords,
          rating: match?.rating,
          ratingCount: match?.ratingCount,
          budgetTier: match?.budgetTier,
          googleUrl:
            match?.googleUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name}, ${where}`)}`,
          photo: match?.photo,
          photos: match?.photos,
          placeId: match?.placeId,
          wikiTitle: place.name,
        }
        return rec
      }),
    )

    const recIds: string[] = []
    for (const rec of enriched) {
      const dupKey = rec.title.toLowerCase()
      if (seen.has(dupKey)) continue
      seen.add(dupKey)
      recs.push(rec)
      recIds.push(rec.id)
    }
    if (recIds.length) sections.push({ key: section.key, label: section.label, emoji: section.emoji, recIds })
  }

  return { sections, recs }
}
