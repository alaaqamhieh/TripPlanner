// ---------------------------------------------------------------------------
// Shared types — traveler profile, recommendation pool, itinerary, trips.
// ---------------------------------------------------------------------------

/** The interest categories the questionnaire probes and recs are tagged with. */
export type InterestId =
  | 'nature'
  | 'history'
  | 'food'
  | 'nightlife'
  | 'shopping'
  | 'museums'
  | 'adventure'
  | 'beaches'
  | 'family'
  | 'wellness'

export const INTEREST_META: Record<InterestId, { label: string; emoji: string; cssVar: string }> = {
  nature: { label: 'Nature', emoji: '🌲', cssVar: '--cat-nature' },
  history: { label: 'History', emoji: '🏛️', cssVar: '--cat-history' },
  food: { label: 'Food & drink', emoji: '🍜', cssVar: '--cat-food' },
  nightlife: { label: 'Nightlife', emoji: '🪩', cssVar: '--cat-nightlife' },
  shopping: { label: 'Shopping', emoji: '🛍️', cssVar: '--cat-shopping' },
  museums: { label: 'Museums & art', emoji: '🖼️', cssVar: '--cat-museums' },
  adventure: { label: 'Adventure', emoji: '🧗', cssVar: '--cat-adventure' },
  beaches: { label: 'Beaches', emoji: '🏖️', cssVar: '--cat-beaches' },
  family: { label: 'Family fun', emoji: '🎡', cssVar: '--cat-family' },
  wellness: { label: 'Wellness', emoji: '🧖', cssVar: '--cat-wellness' },
}

export const ALL_INTERESTS = Object.keys(INTEREST_META) as InterestId[]

export type BudgetTier = 1 | 2 | 3 | 4
export type Pace = 'relaxed' | 'balanced' | 'packed'
export type PartyType = 'solo' | 'couple' | 'family' | 'friends' | 'multigen'
export type PlanningStyle = 'hourly' | 'rough' | 'spontaneous'
export type Rhythm = 'early' | 'flexible' | 'night'
export type DietNeed = 'halal' | 'vegetarian' | 'vegan' | 'glutenfree' | 'kosher'
export type FoodAdventure = 'safe' | 'mixed' | 'adventurous'

/** 1 = like, 2 = love. Missing key = not their thing. */
export type InterestLevel = 1 | 2

/** Everything the questionnaire learns about how this traveler travels. */
export interface TravelerProfile {
  destination: string
  party: PartyType
  hasKids: boolean
  budget: BudgetTier
  pace: Pace
  interests: Partial<Record<InterestId, InterestLevel>>
  foodAdventure: FoodAdventure
  diet: DietNeed[]
  /** Must-have tag ids (see MUST_HAVE_TAGS) plus any free-text extras. */
  mustHaves: string[]
  style: PlanningStyle
  rhythm: Rhythm
  /** Set when the questionnaire was actually finished (vs skipped). */
  completedAt?: string
}

/** Sensible middle-of-the-road defaults for every skipped answer. */
export function defaultProfile(): TravelerProfile {
  return {
    destination: '',
    party: 'couple',
    hasKids: false,
    budget: 2,
    pace: 'balanced',
    interests: {},
    foodAdventure: 'mixed',
    diet: [],
    mustHaves: [],
    style: 'rough',
    rhythm: 'flexible',
  }
}

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'any'
export type MealSlot = 'breakfast' | 'lunch' | 'dinner'

export const MEAL_META: Record<MealSlot, { label: string; emoji: string; order: number }> = {
  breakfast: { label: 'Breakfast', emoji: '🌅', order: 0 },
  lunch: { label: 'Lunch', emoji: '☀️', order: 1 },
  dinner: { label: 'Dinner', emoji: '🌙', order: 2 },
}

/** One idea in a trip's recommendation pool. */
export interface RecommendationItem {
  id: string
  source: 'template' | 'places' | 'signature' | 'ai' | 'custom'
  title: string
  emoji: string
  category: InterestId
  description: string
  /** Suggested time commitment, e.g. "2–3 hrs", "Full day". */
  duration?: string
  budgetTier?: 1 | 2 | 3
  timeOfDay?: TimeOfDay
  /** Set for restaurant/food-stop style recs. */
  meal?: MealSlot
  /** Matched against profile.mustHaves plus 'kidFriendly' / 'nightOwl'. */
  tags?: string[]
  /** [lat, lng] — real places have coordinates. */
  coords?: [number, number]
  /** Google rating 1–5 when imported from Places. */
  rating?: number
  /** How many Google reviews back the rating (popularity signal). */
  ratingCount?: number
  googleUrl?: string
  /** A real photo URL for the swipe deck / cards (Places or Wikipedia). */
  photo?: string
  /** Wikipedia page title used to lazily resolve a photo when none is set. */
  wikiTitle?: string
}

/** Something placed on a specific day of the itinerary. */
export interface ScheduledItem {
  id: string
  /** ISO date this item is scheduled on. */
  date: string
  /** Points at a RecommendationItem in the trip pool; customs store fields inline. */
  refId?: string
  title?: string
  emoji?: string
  note?: string
  /** Optional 24-hour time, "HH:MM". */
  time?: string
  meal?: MealSlot
  /** Loose placement hint used when no explicit time is set. */
  slot?: Exclude<TimeOfDay, 'any'>
}

export interface TripMeta {
  id: string
  name: string
  destination: string
  emoji: string
  startDate: string
  endDate: string
  createdAt: string
}

/** The full persisted state of one trip. */
export interface TripState {
  version: number
  meta: TripMeta
  profile: TravelerProfile
  pool: RecommendationItem[]
  /** Rec ids hidden from "For you". */
  dismissed: string[]
  /** Rec ids the traveler swiped right / hearted in the discovery deck. */
  shortlist: string[]
  /** Rec ids already seen in the swipe deck (so they don't reappear). */
  swiped: string[]
  scheduled: ScheduledItem[]
  /** True once the starter itinerary has been generated. */
  scaffolded: boolean
}

export type Theme = 'light' | 'dark'

export interface TripsIndex {
  version: number
  tripIds: string[]
  theme: Theme
}

/** Which screen the app is showing (synced with location.hash). */
export type Screen =
  | { mode: 'home' }
  | { mode: 'questionnaire'; retakeTripId?: string }
  | { mode: 'trip'; tripId: string }

export const SLOT_TIMES: Record<Exclude<TimeOfDay, 'any'>, { label: string; emoji: string; order: number }> = {
  morning: { label: 'Morning', emoji: '🌅', order: 0 },
  afternoon: { label: 'Afternoon', emoji: '🌤️', order: 1 },
  evening: { label: 'Evening', emoji: '🌙', order: 2 },
}
