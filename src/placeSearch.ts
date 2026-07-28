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
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] }
  websiteUri?: string
  nationalPhoneNumber?: string
}

/** Extra details lazily fetched for the place-detail sheet. */
export interface PlaceDetails {
  hours?: string[]
  openNow?: boolean
  website?: string
  phone?: string
  photos?: string[]
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

const PLACE_FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.location,places.types,places.primaryType,places.priceLevel,places.rating,places.userRatingCount,places.googleMapsUri,places.editorialSummary,places.photos'

/**
 * Fetch opening hours / website / phone / extra photos for one place (Places
 * Details, New). Returns null on any failure — the sheet still shows what it has.
 */
export async function placeDetails(placeId: string): Promise<PlaceDetails | null> {
  if (!placeId || !getGoogleKey()) return null
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': getGoogleKey(),
        'X-Goog-FieldMask': 'regularOpeningHours,websiteUri,nationalPhoneNumber,photos',
      },
    })
    if (!res.ok) return null
    const p = (await res.json()) as GooglePlace
    const photos = (p.photos ?? []).slice(0, 6).map((ph) => (ph.name ? placePhotoUrl(ph.name) : '')).filter(Boolean)
    return {
      hours: p.regularOpeningHours?.weekdayDescriptions,
      openNow: p.regularOpeningHours?.openNow,
      website: p.websiteUri,
      phone: p.nationalPhoneNumber,
      photos: photos.length ? photos : undefined,
    }
  } catch {
    return null
  }
}

/** Map one Google place to a pool-ready RecommendationItem. */
function toRec(p: GooglePlace, where: string, category?: InterestId): RecommendationItem {
  const name = p.displayName?.text ?? 'Unknown place'
  const types = p.types ?? (p.primaryType ? [p.primaryType] : [])
  const parts = (p.formattedAddress ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const cat = category ?? guessCategory(types)
  const photoUrls = (p.photos ?? []).slice(0, 5).map((ph) => (ph.name ? placePhotoUrl(ph.name) : '')).filter(Boolean)
  return {
    id: `pl-${p.id ?? name.toLowerCase().replace(/\W+/g, '-')}`,
    source: 'places',
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
    photo: photoUrls[0],
    photos: photoUrls,
    neighborhood: parts[1] ?? undefined,
    placeId: p.id,
    wikiTitle: name,
  }
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
      'X-Goog-FieldMask': PLACE_FIELD_MASK,
    },
    body: JSON.stringify({ textQuery: where ? `${query} in ${where}` : query, maxResultCount: 8 }),
  })
  if (!res.ok) throw new Error(`Search failed (${res.status})`)
  const data = (await res.json()) as { places?: GooglePlace[] }
  return (data.places ?? []).map((p) => toRec(p, where, category))
}

/** Look up the coordinates of a place/destination name. Returns null if none. */
export async function geocode(query: string): Promise<[number, number] | null> {
  const q = query.trim()
  if (!q) return null
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': getGoogleKey(),
        'X-Goog-FieldMask': 'places.location',
      },
      body: JSON.stringify({ textQuery: q, maxResultCount: 1 }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { places?: GooglePlace[] }
    const loc = data.places?.[0]?.location
    if (loc?.latitude === undefined || loc?.longitude === undefined) return null
    return [loc.latitude, loc.longitude]
  } catch {
    return null
  }
}

/** Google Places (New) type strings to include per explore category. */
const EXPLORE_TYPES: Record<InterestId | 'all', string[]> = {
  all: ['tourist_attraction'],
  food: ['restaurant', 'cafe'],
  history: ['tourist_attraction', 'church', 'mosque', 'hindu_temple', 'synagogue'],
  museums: ['museum', 'art_gallery'],
  nature: ['park', 'national_park', 'garden'],
  nightlife: ['bar', 'night_club'],
  shopping: ['shopping_mall', 'market'],
  adventure: ['amusement_park', 'tourist_attraction'],
  beaches: ['tourist_attraction'],
  family: ['amusement_park', 'zoo', 'aquarium', 'park'],
  wellness: ['spa'],
}

/** A biased-text query to fall back on when a type search returns nothing. */
const EXPLORE_TEXT: Record<InterestId | 'all', string> = {
  all: 'top attractions',
  food: 'best restaurants',
  history: 'historic landmarks',
  museums: 'best museums',
  nature: 'best parks and nature',
  nightlife: 'best bars and nightlife',
  shopping: 'best shopping and markets',
  adventure: 'adventure activities',
  beaches: 'best beaches',
  family: 'family attractions',
  wellness: 'best spas',
}

/**
 * Discover the most popular, well-reviewed places around a map point. Uses
 * Places "Nearby Search (New)" ranked by popularity; falls back to a
 * location-biased text search if the type search yields nothing. Results are
 * filtered to "verified" spots (a real rating backed by enough reviews) and
 * sorted by a rating × popularity score — the best-of-the-area, on the map.
 */
export async function exploreArea(
  center: [number, number],
  radiusMeters: number,
  category: InterestId | 'all',
): Promise<RecommendationItem[]> {
  const radius = Math.max(500, Math.min(50000, Math.round(radiusMeters)))
  const [latitude, longitude] = center
  let places: GooglePlace[] = []

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': getGoogleKey(),
        'X-Goog-FieldMask': PLACE_FIELD_MASK,
      },
      body: JSON.stringify({
        includedTypes: EXPLORE_TYPES[category],
        maxResultCount: 20,
        rankPreference: 'POPULARITY',
        locationRestriction: { circle: { center: { latitude, longitude }, radius } },
      }),
    })
    if (res.ok) {
      const data = (await res.json()) as { places?: GooglePlace[] }
      places = data.places ?? []
    }
  } catch {
    // fall through to the text fallback
  }

  if (!places.length) {
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': getGoogleKey(),
          'X-Goog-FieldMask': PLACE_FIELD_MASK,
        },
        body: JSON.stringify({
          textQuery: EXPLORE_TEXT[category],
          maxResultCount: 20,
          rankPreference: 'RELEVANCE',
          locationBias: { circle: { center: { latitude, longitude }, radius } },
        }),
      })
      if (res.ok) {
        const data = (await res.json()) as { places?: GooglePlace[] }
        places = data.places ?? []
      }
    } catch {
      // give up quietly
    }
  }

  const cat = category === 'all' ? undefined : category
  return places
    .map((p) => toRec(p, '', cat))
    // "Verified / most recommended": a real rating backed by a meaningful number of reviews.
    .filter((r) => r.coords && (r.rating ?? 0) >= 4 && (r.ratingCount ?? 0) >= 30)
    .sort((a, b) => (b.rating ?? 0) * Math.log10((b.ratingCount ?? 1) + 10) - (a.rating ?? 0) * Math.log10((a.ratingCount ?? 1) + 10))
    .slice(0, 18)
}
