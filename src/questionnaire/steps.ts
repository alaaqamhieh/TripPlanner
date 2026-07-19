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
  { value: 'solo', emoji: '🧍', label: 'Just me', hint: 'Solo adventure, my rules' },
  { value: 'couple', emoji: '💑', label: 'Me + my person', hint: 'A trip for two' },
  { value: 'family', emoji: '👨‍👩‍👧‍👦', label: 'The kids too', hint: 'Family trip with children' },
  { value: 'friends', emoji: '👯', label: 'A group of friends', hint: 'The more the merrier' },
  { value: 'multigen', emoji: '👴👶', label: 'The whole family', hint: 'Grandparents to grandkids' },
]

export const BUDGET_OPTIONS: ChoiceOption<BudgetTier>[] = [
  { value: 1, emoji: '🎒', label: 'Keep it cheap', hint: "I'd rather travel longer" },
  { value: 2, emoji: '💵', label: 'Comfortable', hint: 'Nice, but no crazy splurges' },
  { value: 3, emoji: '✨', label: 'Treat myself', hint: "I'll splurge on the good stuff" },
  { value: 4, emoji: '👑', label: "Money's not the point", hint: 'Make it amazing' },
]

export const PACE_OPTIONS: ChoiceOption<Pace>[] = [
  { value: 'relaxed', emoji: '🦥', label: 'One nice thing a day', hint: 'Then I want to do nothing' },
  { value: 'balanced', emoji: '⚖️', label: 'A plan or two', hint: 'With room to wander' },
  { value: 'packed', emoji: '⚡', label: 'See EVERYTHING', hint: 'Wake me up early, sleep later' },
]

export const FOOD_OPTIONS: ChoiceOption<FoodAdventure>[] = [
  { value: 'safe', emoji: '🍔', label: 'I stick to what I know', hint: 'Familiar food, happy me' },
  { value: 'mixed', emoji: '🌮', label: "I'll try new things", hint: 'If they look good' },
  { value: 'adventurous', emoji: '🐙', label: 'Bring me whatever the locals eat', hint: 'The weirder the better' },
]

export const DIET_OPTIONS: ChoiceOption<DietNeed>[] = [
  { value: 'halal', emoji: '☪️', label: 'Halal' },
  { value: 'vegetarian', emoji: '🥗', label: 'Vegetarian' },
  { value: 'vegan', emoji: '🌱', label: 'Vegan' },
  { value: 'glutenfree', emoji: '🌾', label: 'Gluten-free' },
  { value: 'kosher', emoji: '✡️', label: 'Kosher' },
]

export const MUST_HAVE_TAGS: ChoiceOption[] = [
  { value: 'sunset', emoji: '🌅', label: 'A perfect sunset' },
  { value: 'market', emoji: '🧺', label: 'A real local market' },
  { value: 'landmark', emoji: '🗿', label: 'The famous landmark' },
  { value: 'hiddengem', emoji: '💎', label: 'A hidden gem' },
  { value: 'daytrip', emoji: '🚐', label: 'A day trip out of town' },
  { value: 'photo', emoji: '📸', label: 'That one epic photo' },
  { value: 'show', emoji: '🎭', label: 'A night out at a show' },
  { value: 'cafes', emoji: '☕', label: 'A café worth lingering in' },
]

export const STYLE_OPTIONS: ChoiceOption<PlanningStyle>[] = [
  { value: 'hourly', emoji: '📋', label: 'Every hour mapped out', hint: 'I love a schedule' },
  { value: 'rough', emoji: '🗒️', label: 'A rough plan I can bend', hint: 'Structure, loosely held' },
  { value: 'spontaneous', emoji: '🍃', label: 'Plans stress me out', hint: 'I improvise' },
]

export const RHYTHM_OPTIONS: ChoiceOption<Rhythm>[] = [
  { value: 'early', emoji: '🌅', label: 'Early bird', hint: 'Best hours are before noon' },
  { value: 'flexible', emoji: '🌤️', label: 'Depends on the day', hint: "I'll take either" },
  { value: 'night', emoji: '🦉', label: 'Night owl', hint: "Don't talk to me before 10" },
]

/** One card in the rapid-fire preference deck. */
export interface RapidFireCard {
  interest: InterestId
  emoji: string
  question: string
  /** Only shown when the party includes kids. */
  kidsOnly?: boolean
}

export const RAPID_FIRE_CARDS: RapidFireCard[] = [
  { interest: 'nature', emoji: '🥾', question: 'Does hiking a scenic trail or getting lost in nature sound like your thing?' },
  { interest: 'food', emoji: '🍜', question: 'Would you cross the city just to try a dish the locals swear by?' },
  { interest: 'history', emoji: '🏛️', question: 'Could you wander an old town or ancient ruins for hours, imagining who lived there?' },
  { interest: 'beaches', emoji: '🏖️', question: 'A whole day doing nothing on a beautiful beach — paradise or boring?' },
  { interest: 'nightlife', emoji: '🪩', question: 'Are you up for dancing the night away — clubs, bars, the whole scene?' },
  { interest: 'museums', emoji: '🖼️', question: 'Do museums and art galleries pull you in, or do you speed-walk past?' },
  { interest: 'adventure', emoji: '🧗', question: 'Ziplining, rafting, cliff jumps… does adrenaline excite you or terrify you?' },
  { interest: 'shopping', emoji: '🛍️', question: 'Do you love hunting through markets and shops for that perfect find?' },
  { interest: 'wellness', emoji: '🧖', question: 'Is a spa afternoon or a slow pool day your idea of recharging?' },
  { interest: 'family', emoji: '🎡', question: 'Theme parks, aquariums, playgrounds — do the kids need their big day?', kidsOnly: true },
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
