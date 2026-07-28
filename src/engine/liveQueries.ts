import { searchPlaces } from '../placeSearch'
import type { InterestId, RecommendationItem, TravelerProfile } from '../types'

// Turns a traveler profile into a handful of Places searches that fill the
// recommendation pool with real, rated spots in the destination.

const INTEREST_QUERIES: Record<InterestId, string[]> = {
  nature: ['best parks and nature spots', 'most scenic viewpoint'],
  history: ['top historic landmarks', 'old town highlights'],
  food: ['best local restaurants', 'famous food market'],
  nightlife: ['best rooftop bars', 'live music venues'],
  shopping: ['best local markets and shops', 'famous bazaar'],
  museums: ['best museums', 'notable art galleries'],
  adventure: ['best outdoor adventure activities', 'top day trips'],
  beaches: ['best beaches', 'best beach clubs'],
  family: ['best family attractions for kids', 'aquarium or zoo'],
  wellness: ['best spa and wellness', 'thermal baths or hammam'],
}

/** Ordered query list for this profile: loved interests get 2, liked get 1. */
export function buildQueries(profile: TravelerProfile): { query: string; category: InterestId }[] {
  const out: { query: string; category: InterestId }[] = []
  const entries = Object.entries(profile.interests) as [InterestId, 1 | 2][]
  const loved = entries.filter(([, w]) => w === 2).map(([i]) => i)
  const liked = entries.filter(([, w]) => w === 1).map(([i]) => i)

  for (const interest of loved) for (const q of INTEREST_QUERIES[interest]) out.push({ query: q, category: interest })
  for (const interest of liked) out.push({ query: INTEREST_QUERIES[interest][0], category: interest })

  // Nothing selected in the quiz? Fall back to crowd-pleasers.
  if (!out.length) {
    out.push(
      { query: 'top attractions', category: 'history' },
      { query: 'best local restaurants', category: 'food' },
      { query: 'best parks and nature spots', category: 'nature' },
    )
  }

  // Dietary needs get their own restaurant search.
  if (profile.diet.length) {
    const dietWord = { halal: 'halal', vegetarian: 'vegetarian', vegan: 'vegan', glutenfree: 'gluten-free', kosher: 'kosher' }[
      profile.diet[0]
    ]
    out.push({ query: `best ${dietWord} restaurants`, category: 'food' })
  }
  if (profile.mustHaves.includes('sunset')) out.push({ query: 'best scenic viewpoint or sunset spot', category: 'nature' })
  if (profile.mustHaves.includes('cafes')) out.push({ query: 'most famous local restaurant or iconic dish', category: 'food' })
  if (profile.mustHaves.includes('landmark')) out.push({ query: 'most famous landmark', category: 'history' })
  if (profile.mustHaves.includes('market')) out.push({ query: 'best local market', category: 'shopping' })

  return out.slice(0, 10)
}

/**
 * Run the profile's searches sequentially (gentle on quota) and return new,
 * deduped pool items. Individual query failures are skipped silently.
 */
export async function findLivePlaces(
  profile: TravelerProfile,
  destination: string,
  existing: RecommendationItem[],
): Promise<RecommendationItem[]> {
  const seen = new Set(existing.map((r) => r.id))
  const seenTitles = new Set(existing.map((r) => r.title.toLowerCase()))
  const found: RecommendationItem[] = []
  for (const { query, category } of buildQueries(profile)) {
    try {
      const results = await searchPlaces(query, destination, category)
      for (const rec of results) {
        if (seen.has(rec.id) || seenTitles.has(rec.title.toLowerCase())) continue
        seen.add(rec.id)
        seenTitles.add(rec.title.toLowerCase())
        found.push(rec)
      }
    } catch {
      // One bad query shouldn't sink the rest.
    }
  }
  return found
}
