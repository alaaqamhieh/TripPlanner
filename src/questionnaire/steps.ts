import type { IconName } from '../components/Icon'
import type { BudgetTier, DietNeed, FoodAdventure, InterestId, Pace, PartyType, PlanningStyle, Rhythm } from '../types'

// ---------------------------------------------------------------------------
// The questionnaire, phrased like a friend asking about you — not a form.
// Part A (setup) and Part C (closing) are single screens; Part B is the
// rapid-fire preference deck (one vivid question per interest).
// ---------------------------------------------------------------------------

export interface ChoiceOption<V extends string | number = string> {
  value: V
  label: string
  emoji: string
  /** Elegant line-icon id (see components/Icon.tsx) shown on the option row. */
  icon?: IconName
  hint?: string
}

export const DESTINATION_SUGGESTIONS = [
  { emoji: '🗼', label: 'Paris, France' },
  { emoji: '🏝️', label: 'Bali, Indonesia' },
  { emoji: '🗽', label: 'New York, USA' },
  { emoji: '🕌', label: 'Istanbul, Türkiye' },
  { emoji: '🏛️', label: 'Rome, Italy' },
  { emoji: '⛩️', label: 'Tokyo, Japan' },
]

export const PARTY_OPTIONS: ChoiceOption<PartyType>[] = [
  { value: 'solo', emoji: '🧍', icon: 'person', label: 'Just me', hint: 'Solo adventure, my rules' },
  { value: 'couple', emoji: '💑', icon: 'couple', label: 'Me + my person', hint: 'A trip for two' },
  { value: 'family', emoji: '👨‍👩‍👧‍👦', icon: 'family', label: 'The kids too', hint: 'Family trip with children' },
  { value: 'friends', emoji: '👯', icon: 'friends', label: 'A group of friends', hint: 'The more the merrier' },
  { value: 'multigen', emoji: '👴👶', icon: 'people', label: 'The whole family', hint: 'Grandparents to grandkids' },
]

export const BUDGET_OPTIONS: ChoiceOption<BudgetTier>[] = [
  { value: 1, emoji: '🎒', icon: 'backpack', label: 'Keep it cheap', hint: "I'd rather travel longer" },
  { value: 2, emoji: '💵', icon: 'wallet', label: 'Comfortable', hint: 'Nice, but no crazy splurges' },
  { value: 3, emoji: '✨', icon: 'sparkle', label: 'Treat myself', hint: "I'll splurge on the good stuff" },
  { value: 4, emoji: '👑', icon: 'crown', label: "Money's not the point", hint: 'Make it amazing' },
]

export const PACE_OPTIONS: ChoiceOption<Pace>[] = [
  { value: 'relaxed', emoji: '🦥', icon: 'leaf', label: 'One nice thing a day', hint: 'Then I want to do nothing' },
  { value: 'balanced', emoji: '⚖️', icon: 'compass', label: 'A plan or two', hint: 'With room to wander' },
  { value: 'packed', emoji: '⚡', icon: 'bolt', label: 'See EVERYTHING', hint: 'Wake me up early, sleep later' },
]

export const FOOD_OPTIONS: ChoiceOption<FoodAdventure>[] = [
  { value: 'safe', emoji: '🍔', icon: 'bowl', label: 'I stick to what I know', hint: 'Familiar food, happy me' },
  { value: 'mixed', emoji: '🌮', icon: 'forkKnife', label: "I'll try new things", hint: 'If they look good' },
  { value: 'adventurous', emoji: '🐙', icon: 'globe', label: 'Bring me whatever the locals eat', hint: 'The weirder the better' },
]

export const DIET_OPTIONS: ChoiceOption<DietNeed>[] = [
  { value: 'halal', emoji: '☪️', icon: 'crescent', label: 'Halal' },
  { value: 'vegetarian', emoji: '🥗', icon: 'leaf', label: 'Vegetarian' },
  { value: 'vegan', emoji: '🌱', icon: 'sprout', label: 'Vegan' },
  { value: 'glutenfree', emoji: '🌾', icon: 'wheat', label: 'Gluten-free' },
  { value: 'kosher', emoji: '✡️', icon: 'star', label: 'Kosher' },
]

// The non-negotiables people actually travel for. Reworded to what a traveler
// would genuinely be sad to miss; ids are reused by the engine's tag scoring.
export const MUST_HAVE_TAGS: ChoiceOption[] = [
  { value: 'landmark', emoji: '🗿', icon: 'monument', label: 'The famous landmark everyone asks about' },
  { value: 'cafes', emoji: '🍽️', icon: 'forkKnife', label: 'A restaurant or dish everyone swears by' },
  { value: 'hiddengem', emoji: '💎', icon: 'gem', label: 'A hidden gem most tourists miss' },
  { value: 'sunset', emoji: '🌄', icon: 'mountain', label: 'A jaw-dropping view or sunset' },
  { value: 'market', emoji: '🧺', icon: 'basket', label: 'A buzzing local market' },
  { value: 'daytrip', emoji: '🚐', icon: 'car', label: 'A day trip out of town' },
]

export const STYLE_OPTIONS: ChoiceOption<PlanningStyle>[] = [
  { value: 'hourly', emoji: '📋', icon: 'list', label: 'Every hour mapped out', hint: 'I love a schedule' },
  { value: 'rough', emoji: '🗒️', icon: 'map', label: 'A rough plan I can bend', hint: 'Structure, loosely held' },
  { value: 'spontaneous', emoji: '🍃', icon: 'wind', label: 'Plans stress me out', hint: 'I improvise' },
]

export const RHYTHM_OPTIONS: ChoiceOption<Rhythm>[] = [
  { value: 'early', emoji: '🌅', icon: 'sunrise', label: 'Early bird', hint: 'Best hours are before noon' },
  { value: 'flexible', emoji: '🌤️', icon: 'cloudSun', label: 'Depends on the day', hint: "I'll take either" },
  { value: 'night', emoji: '🦉', icon: 'moon', label: 'Night owl', hint: "Don't talk to me before 10" },
]

/** One card in the rapid-fire preference deck. */
export interface RapidFireCard {
  interest: InterestId
  emoji: string
  icon: IconName
  question: string
  /** Only shown when the party includes kids. */
  kidsOnly?: boolean
}

export const RAPID_FIRE_CARDS: RapidFireCard[] = [
  { interest: 'nature', emoji: '🥾', icon: 'mountain', question: 'Does hiking a scenic trail or getting lost in nature sound like your thing?' },
  { interest: 'food', emoji: '🍜', icon: 'forkKnife', question: 'Would you cross the city just to try a dish the locals swear by?' },
  { interest: 'history', emoji: '🏛️', icon: 'monument', question: 'Could you wander an old town or ancient ruins for hours, imagining who lived there?' },
  { interest: 'beaches', emoji: '🏖️', icon: 'beach', question: 'A whole day doing nothing on a beautiful beach — paradise or boring?' },
  { interest: 'nightlife', emoji: '🪩', icon: 'glass', question: 'Are you up for dancing the night away — clubs, bars, the whole scene?' },
  { interest: 'museums', emoji: '🖼️', icon: 'painting', question: 'Do museums and art galleries pull you in, or do you speed-walk past?' },
  { interest: 'adventure', emoji: '🧗', icon: 'bolt', question: 'Ziplining, rafting, cliff jumps… does adrenaline excite you or terrify you?' },
  { interest: 'shopping', emoji: '🛍️', icon: 'bag', question: 'Do you love hunting through markets and shops for that perfect find?' },
  { interest: 'wellness', emoji: '🧖', icon: 'spa', question: 'Is a spa afternoon or a slow pool day your idea of recharging?' },
  { interest: 'family', emoji: '🎡', icon: 'ferris', question: 'Theme parks, aquariums, playgrounds — do the kids need their big day?', kidsOnly: true },
]

/** Step ids in order; 'interests' expands into the rapid-fire deck. */
export const STEP_ORDER = [
  'destination',
  'dates',
  'party',
  'budget',
  'pace',
  'interests',
  'foodAdventure',
  'diet',
  'mustHaves',
  'style',
  'rhythm',
] as const

export type StepId = (typeof STEP_ORDER)[number]
