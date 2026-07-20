import { getGoogleKey } from './config'
import type { InterestId, MealSlot, RecommendationItem } from './types'

// Google Places API (New) text search, SDK-less. Destination-scoped: every
// query is biased with "in <destination>". Optional — no key, no calls.

export function placesAvailable(): boolean {
  return Boolean(getGoogleKey())
}

function titleCase(text: string): string {
  return text.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Guess a fitting emoji from Google place types. */
export function smartEmoji(types: string[]): string {
  const hay = types.join(' ').toLowerCase()
  if (/(cafe|coffee)/.test(hay)) return '☕'
  if (/(bakery|dessert|sweet|pastr|ice_cream|patisserie)/.test(hay)) return '🍰'
  if (/(seafood|fish)/.test(hay)) return '🐟'
  if (/(vegetarian|vegan)/.test(hay)) return '🥗'
  if (/(barbecue|grill|steak|kebab|meat)/.test(hay)) return '🍢'
  if (/(pizza|italian)/.test(hay)) return '🍕'
  if (/(bar|pub|night_club|wine)/.test(hay)) return '🍸'
  if (/(breakfast|brunch)/.test(hay)) return '🍳'
  if (/(museum|art_gallery)/.test(hay)) return '🖼️'
  if (/(historic|monument|archaeolog|castle|tourist_attraction)/.test(hay)) return '🏛️'
  if (/(mosque|church|temple|place_of_worship)/.test(hay)) return '🕌'
  if (/(beach)/.test(hay)) return '🏖️'
  if (/(park|natural|hiking|campground|garden)/.test(hay)) return '🌳'
  if (/(zoo|aquarium|amusement)/.test(hay)) return '🎡'
  if (/(shopping|store|market|mall)/.test(hay)) return '🛍️'
  if (/(spa|hot_spring|wellness)/.test(hay)) return '🧖'
  if (/(lodging|hotel|resort)/.test(hay)) return '🏨'
  if (/(restaurant|food|meal)/.test(hay)) return '🍽️'
  return '📍'
}

/** Rough Google-types → interest category. */
export function guessCategory(types: string[]): InterestId {
  const hay = types.join(' ').toLowerCase()
  if (/(museum|art_gallery)/.test(hay)) return 'museums'
  if (/(historic|monument|archaeolog|castle|place_of_worship|tourist_attraction)/.test(hay)) return 'history'
  if (/(beach)/.test(hay)) return 'beaches'
  if (/(zoo|aquarium|amusement|playground)/.test(hay)) return 'family'
  if (/(spa|hot_spring|wellness|yoga)/.test(hay)) return 'wellness'
  if (/(bar|pub|night_club)/.test(hay)) return 'nightlife'
  if (/(park|natural|hiking|campground|garden)/.test(hay)) return 'nature'
  if (/(shopping|store|market|mall)/.test(hay)) return 'shopping'
  if (/(restaurant|cafe|bakery|food|meal)/.test(hay)) return 'food'
  if (/(climbing|rafting|diving|adventure|bicycle)/.test(hay)) return 'adventure'
  return 'history'
}

function guessMeal(types: string[]): MealSlot | undefined {
  const hay = types.join(' ').toLowerCase()
  if (/(breakfast|brunch|cafe|bakery)/.test(hay)) return 'breakfast'
  if (/(restaurant|food)/.test(hay)) return 'dinner'
  return undefined
}

interface GooglePlace {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  location?: { latitude?: number; longitude?: number }
  types?: string[]
  primaryType?: string
  priceLevel?: string
  rating?: number
  userRatingCount?: number
  googleMapsUri?: string
  editorialSummary?: { text?: string }
  photos?: { name?: string }[]
}

const GOOGLE_PRICE: Record<string, 1 | 2 | 3> = {
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 3,
}

/** Build a hotlinkable Places Photo URL (v1 media endpoint) from a photo name. */
export function placePhotoUrl(photoName: string, maxPx = 800): string {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxPx}&key=${getGoogleKey()}`
}

/**
 * Search Google Places for `query` in `destination` and map results straight
 * into pool-ready RecommendationItems. Throws on a non-OK response.
 */
export async function searchPlaces(query: string, destination: string, category?: InterestId): Promise<RecommendationItem[]> {
  const where = destination.trim()
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getGoogleKey(),
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.priceLevel,places.rating,places.userRatingCount,places.googleMapsUri,places.editorialSummary,places.photos',
    },
    body: JSON.stringify({ textQuery: where ? `${query} in ${where}` : query, maxResultCount: 8 }),
  })
  if (!res.ok) throw new Error(`Search failed (${res.status})`)
  const data = (await res.json()) as { places?: GooglePlace[] }
  return (data.places ?? []).map((p) => {
    const name = p.displayName?.text ?? 'Unknown place'
    const types = p.types ?? (p.primaryType ? [p.primaryType] : [])
    const parts = (p.formattedAddress ?? '').split(',').map((s) => s.trim()).filter(Boolean)
    const cat = category ?? guessCategory(types)
    const photoName = p.photos?.[0]?.name
    return {
      id: `pl-${p.id ?? name.toLowerCase().replace(/\W+/g, '-')}`,
      source: 'places' as const,
      title: name,
      emoji: smartEmoji(types),
      category: cat,
      description:
        p.editorialSummary?.text ??
        [titleCase(p.primaryType ?? types[0] ?? 'Place'), parts[1] ?? parts[0]].filter(Boolean).join(' · '),
      budgetTier: p.priceLevel ? GOOGLE_PRICE[p.priceLevel] : undefined,
      meal: cat === 'food' ? guessMeal(types) : undefined,
      coords:
        p.location?.latitude !== undefined && p.location?.longitude !== undefined
          ? ([p.location.latitude, p.location.longitude] as [number, number])
          : undefined,
      rating: p.rating,
      ratingCount: p.userRatingCount,
      googleUrl:
        p.googleMapsUri ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name}, ${where}`)}`,
      photo: photoName ? placePhotoUrl(photoName) : undefined,
      wikiTitle: name,
    }
  })
}
