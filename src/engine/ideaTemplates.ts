import type { FoodAdventure, InterestId, MealSlot, RecommendationItem, TimeOfDay } from '../types'

// ---------------------------------------------------------------------------
// The offline idea catalog: destination-agnostic activity templates that work
// for any city on earth with zero network. "{d}" is replaced with the trip's
// destination. When a Google Places key is configured, live results join
// these in the pool and outrank their generic twins.
// ---------------------------------------------------------------------------

interface IdeaTemplate {
  id: string
  title: string
  emoji: string
  category: InterestId
  description: string
  duration?: string
  budgetTier?: 1 | 2 | 3
  timeOfDay?: TimeOfDay
  meal?: MealSlot
  tags?: string[]
  /** Restrict to a foodAdventure level (meal templates). */
  foodLevel?: FoodAdventure[]
}

const TEMPLATES: IdeaTemplate[] = [
  // ---- nature ----
  { id: 'nat-sunset', title: 'Sunset viewpoint over {d}', emoji: '🌅', category: 'nature', description: 'Find the spot locals climb to when the light turns golden.', duration: '1–2 hrs', budgetTier: 1, timeOfDay: 'evening', tags: ['sunset', 'photo'] },
  { id: 'nat-garden', title: 'Botanical garden or city park stroll', emoji: '🌷', category: 'nature', description: 'A slow green morning — coffee in hand, no agenda.', duration: '1–2 hrs', budgetTier: 1, timeOfDay: 'morning', tags: ['kidFriendly'] },
  { id: 'nat-hike', title: 'Scenic hike near {d}', emoji: '🥾', category: 'nature', description: 'The trail everyone recommends, with the views to match.', duration: 'Half day', budgetTier: 1, timeOfDay: 'morning', tags: ['daytrip', 'photo'] },
  { id: 'nat-water', title: 'Lake, river or waterfront walk', emoji: '🌊', category: 'nature', description: 'Wherever {d} meets the water — walk it at golden hour.', duration: '1–2 hrs', budgetTier: 1, timeOfDay: 'any', tags: ['photo', 'kidFriendly'] },
  { id: 'nat-picnic', title: 'Picnic with a view', emoji: '🧺', category: 'nature', description: 'Grab local snacks and claim a bench with the best panorama.', duration: '2 hrs', budgetTier: 1, timeOfDay: 'afternoon', tags: ['hiddengem', 'kidFriendly'] },

  // ---- history ----
  { id: 'his-oldtown', title: 'Old town walking tour', emoji: '🚶', category: 'history', description: 'Wander the oldest streets of {d} and read the walls.', duration: '2–3 hrs', budgetTier: 1, timeOfDay: 'morning', tags: ['landmark'] },
  { id: 'his-landmark', title: 'The landmark everyone asks about', emoji: '🗿', category: 'history', description: "The famous one. Yes, it's touristy. Yes, it's worth it.", duration: '2–3 hrs', budgetTier: 2, timeOfDay: 'morning', tags: ['landmark', 'photo'] },
  { id: 'his-castle', title: 'Castle, fort or palace visit', emoji: '🏰', category: 'history', description: 'Where the rulers of {d} watched over the city.', duration: '2–3 hrs', budgetTier: 2, timeOfDay: 'afternoon', tags: ['landmark', 'kidFriendly'] },
  { id: 'his-quarter', title: 'Historic quarter at dusk', emoji: '🏮', category: 'history', description: 'Old lanes are at their most atmospheric as the lights come on.', duration: '1–2 hrs', budgetTier: 1, timeOfDay: 'evening', tags: ['hiddengem', 'photo'] },
  { id: 'his-tour', title: 'Free walking tour with a local guide', emoji: '🧑‍🏫', category: 'history', description: 'The fastest way to get the story of {d} — tip what it was worth.', duration: '2–3 hrs', budgetTier: 1, timeOfDay: 'morning', tags: [] },

  // ---- food ----
  { id: 'food-market', title: 'The local food market', emoji: '🧺', category: 'food', description: 'Eat your way stall to stall where {d} actually shops.', duration: '2 hrs', budgetTier: 1, timeOfDay: 'morning', tags: ['market', 'kidFriendly'] },
  { id: 'food-dish', title: 'Hunt the signature dish of {d}', emoji: '🍜', category: 'food', description: 'Ask three locals where to eat it. Go where two of them agree.', duration: '1–2 hrs', budgetTier: 1, timeOfDay: 'any', tags: ['hiddengem'] },
  { id: 'food-class', title: 'Cooking class: take {d} home', emoji: '👩‍🍳', category: 'food', description: 'Learn the dish, keep the recipe, retell the story forever.', duration: 'Half day', budgetTier: 2, timeOfDay: 'afternoon', tags: [] },
  { id: 'food-cafe', title: 'A café worth lingering in', emoji: '☕', category: 'food', description: 'Order the local coffee ritual and watch {d} go by.', duration: '1 hr', budgetTier: 1, timeOfDay: 'morning', tags: ['cafes'] },
  { id: 'food-street', title: 'Street food crawl', emoji: '🌮', category: 'food', description: 'Follow the queues — the best stand is the one with locals in line.', duration: '2 hrs', budgetTier: 1, timeOfDay: 'evening', tags: ['market', 'nightOwl'] },
  { id: 'food-sweet', title: 'The famous dessert stop', emoji: '🍨', category: 'food', description: 'Every city has one legendary sweet. Find the one in {d}.', duration: '1 hr', budgetTier: 1, timeOfDay: 'afternoon', tags: ['kidFriendly'] },

  // ---- nightlife ----
  { id: 'night-rooftop', title: 'Rooftop bar at sunset', emoji: '🍸', category: 'nightlife', description: 'Golden hour over {d} with a drink in hand.', duration: '2 hrs', budgetTier: 2, timeOfDay: 'evening', tags: ['sunset', 'nightOwl'] },
  { id: 'night-music', title: 'Live music night', emoji: '🎶', category: 'nightlife', description: 'Find the bar where the local scene actually plays.', duration: '3 hrs', budgetTier: 2, timeOfDay: 'evening', tags: ['show', 'nightOwl'] },
  { id: 'night-club', title: 'Dance until late', emoji: '🪩', category: 'nightlife', description: "The night {d} doesn't tell tourists about. Sleep in tomorrow.", duration: '4+ hrs', budgetTier: 2, timeOfDay: 'evening', tags: ['nightOwl'] },
  { id: 'night-stroll', title: 'Night stroll through the lit-up streets', emoji: '🌃', category: 'nightlife', description: 'The city glows after dark — bring your camera.', duration: '1–2 hrs', budgetTier: 1, timeOfDay: 'evening', tags: ['photo', 'nightOwl'] },

  // ---- shopping ----
  { id: 'shop-bazaar', title: 'Bazaar, souk or flea market morning', emoji: '🛍️', category: 'shopping', description: 'Haggle a little. The story is worth more than the discount.', duration: '2–3 hrs', budgetTier: 2, timeOfDay: 'morning', tags: ['market'] },
  { id: 'shop-design', title: 'Local designers & concept stores', emoji: '🧵', category: 'shopping', description: 'Skip the mall — find what you can only buy in {d}.', duration: '2 hrs', budgetTier: 2, timeOfDay: 'afternoon', tags: ['hiddengem'] },
  { id: 'shop-souvenir', title: 'The souvenir that isn’t a fridge magnet', emoji: '🎁', category: 'shopping', description: 'One real thing, made here, that you’ll actually keep.', duration: '1–2 hrs', budgetTier: 1, timeOfDay: 'any', tags: [] },

  // ---- museums ----
  { id: 'mus-flagship', title: 'The museum {d} is proud of', emoji: '🖼️', category: 'museums', description: 'The big one — go early, beat the crowds, take it slow.', duration: '2–3 hrs', budgetTier: 2, timeOfDay: 'morning', tags: ['landmark'] },
  { id: 'mus-quirky', title: 'A small, strange museum', emoji: '🔍', category: 'museums', description: 'Every city hides one delightfully odd collection. Find it.', duration: '1–2 hrs', budgetTier: 1, timeOfDay: 'afternoon', tags: ['hiddengem'] },
  { id: 'mus-gallery', title: 'Contemporary art gallery hop', emoji: '🎨', category: 'museums', description: 'See what artists in {d} are making right now.', duration: '2 hrs', budgetTier: 1, timeOfDay: 'afternoon', tags: [] },
  { id: 'mus-show', title: 'A show, concert or performance', emoji: '🎭', category: 'museums', description: 'Theatre, opera, or whatever {d} does best after dark.', duration: '3 hrs', budgetTier: 3, timeOfDay: 'evening', tags: ['show'] },

  // ---- adventure ----
  { id: 'adv-thrill', title: 'The local adrenaline hit', emoji: '🧗', category: 'adventure', description: 'Ziplining, rafting, paragliding — whatever {d} is known for.', duration: 'Half day', budgetTier: 3, timeOfDay: 'morning', tags: ['daytrip'] },
  { id: 'adv-bike', title: 'Bike or kayak the city from a new angle', emoji: '🚲', category: 'adventure', description: 'Cover more ground and earn your dinner.', duration: '2–3 hrs', budgetTier: 2, timeOfDay: 'morning', tags: ['kidFriendly'] },
  { id: 'adv-daytrip', title: 'Day trip out of {d}', emoji: '🚐', category: 'adventure', description: "The place locals say 'you have to leave the city for'.", duration: 'Full day', budgetTier: 2, timeOfDay: 'morning', tags: ['daytrip'] },
  { id: 'adv-viewpoint', title: 'Climb the highest lookout', emoji: '🗼', category: 'adventure', description: 'Tower, hill or dome — earn the best view in {d}.', duration: '1–2 hrs', budgetTier: 2, timeOfDay: 'afternoon', tags: ['photo', 'landmark'] },

  // ---- beaches ----
  { id: 'bea-classic', title: 'The classic beach day', emoji: '🏖️', category: 'beaches', description: 'Towel down, book out, nowhere to be.', duration: 'Half day', budgetTier: 1, timeOfDay: 'any', tags: ['kidFriendly'] },
  { id: 'bea-hidden', title: 'The quieter cove locals keep to themselves', emoji: '🐚', category: 'beaches', description: 'A short ride past the crowds is usually all it takes.', duration: 'Half day', budgetTier: 1, timeOfDay: 'any', tags: ['hiddengem'] },
  { id: 'bea-sunset', title: 'Beach sunset with snacks', emoji: '🌇', category: 'beaches', description: 'End a day with sand underfoot and the sky on fire.', duration: '2 hrs', budgetTier: 1, timeOfDay: 'evening', tags: ['sunset', 'photo'] },
  { id: 'bea-water', title: 'Snorkel, surf or paddle', emoji: '🤿', category: 'beaches', description: 'Get in the water, not just next to it.', duration: 'Half day', budgetTier: 2, timeOfDay: 'morning', tags: [] },

  // ---- family ----
  { id: 'fam-zoo', title: 'Aquarium or zoo morning', emoji: '🐧', category: 'family', description: 'A guaranteed hit before nap time.', duration: 'Half day', budgetTier: 2, timeOfDay: 'morning', tags: ['kidFriendly'] },
  { id: 'fam-park', title: 'Playground + ice cream circuit', emoji: '🍦', category: 'family', description: "Kids burn energy, adults get coffee. Everyone's happy.", duration: '2 hrs', budgetTier: 1, timeOfDay: 'afternoon', tags: ['kidFriendly'] },
  { id: 'fam-fun', title: 'Theme park or big family attraction', emoji: '🎡', category: 'family', description: 'The one the kids will talk about the whole way home.', duration: 'Full day', budgetTier: 3, timeOfDay: 'morning', tags: ['kidFriendly'] },
  { id: 'fam-train', title: 'A boat, tram or funicular ride', emoji: '🚋', category: 'family', description: 'Transport that is the attraction — little kids love it.', duration: '1–2 hrs', budgetTier: 1, timeOfDay: 'afternoon', tags: ['kidFriendly'] },

  // ---- wellness ----
  { id: 'wel-spa', title: 'Spa or bathhouse afternoon', emoji: '🧖', category: 'wellness', description: 'Do it the local way — hammam, onsen, sauna, thermal bath.', duration: 'Half day', budgetTier: 3, timeOfDay: 'afternoon', tags: [] },
  { id: 'wel-slow', title: 'Slow morning: long breakfast, no plans', emoji: '🥐', category: 'wellness', description: 'A holiday within the holiday. Protect it.', duration: '2 hrs', budgetTier: 1, timeOfDay: 'morning', tags: ['cafes'] },
  { id: 'wel-yoga', title: 'Sunrise yoga or a quiet swim', emoji: '🧘', category: 'wellness', description: 'Start one day the way your body wants to.', duration: '1–2 hrs', budgetTier: 2, timeOfDay: 'morning', tags: [] },

  // ---- meals (fill breakfast/lunch/dinner slots; matched to food adventurousness) ----
  { id: 'meal-local-dinner', title: 'Dinner where the locals eat', emoji: '🍲', category: 'food', description: 'Off the main square, handwritten menu, full tables.', duration: '2 hrs', budgetTier: 2, timeOfDay: 'evening', meal: 'dinner', tags: ['hiddengem'], foodLevel: ['mixed', 'adventurous'] },
  { id: 'meal-famous-dinner', title: 'The famous restaurant of {d}', emoji: '🍽️', category: 'food', description: 'Book ahead — the one every guide agrees on.', duration: '2 hrs', budgetTier: 3, timeOfDay: 'evening', meal: 'dinner', tags: ['landmark'] },
  { id: 'meal-comfort-dinner', title: 'A cozy, familiar dinner', emoji: '🍕', category: 'food', description: 'Sometimes you just want a good pizza. That’s allowed.', duration: '1–2 hrs', budgetTier: 2, timeOfDay: 'evening', meal: 'dinner', tags: ['kidFriendly'], foodLevel: ['safe', 'mixed'] },
  { id: 'meal-brunch', title: 'Slow local brunch', emoji: '🍳', category: 'food', description: 'The neighborhood spot with the weekend queue.', duration: '1–2 hrs', budgetTier: 2, timeOfDay: 'morning', meal: 'breakfast', tags: ['cafes'] },
  { id: 'meal-lunch-market', title: 'Lunch at the market stalls', emoji: '🥙', category: 'food', description: 'Point at what looks good. Repeat.', duration: '1 hr', budgetTier: 1, timeOfDay: 'afternoon', meal: 'lunch', tags: ['market'], foodLevel: ['mixed', 'adventurous'] },
  { id: 'meal-street-night', title: 'Late-night street eats', emoji: '🌭', category: 'food', description: 'The after-midnight institution every city has.', duration: '1 hr', budgetTier: 1, timeOfDay: 'evening', meal: 'dinner', tags: ['nightOwl'], foodLevel: ['adventurous'] },
]

/**
 * Instantiate the catalog for a destination: substitute "{d}", filter meal
 * templates by food adventurousness, and return fresh RecommendationItems.
 */
export function buildTemplatePool(destination: string, foodAdventure: FoodAdventure): RecommendationItem[] {
  const d = destination.trim() || 'the city'
  // "Sunset viewpoint over Paris, France" reads clunky — use the city part only.
  const city = d.split(',')[0].trim() || d
  return TEMPLATES.filter((t) => !t.foodLevel || t.foodLevel.includes(foodAdventure)).map((t) => ({
    id: t.id,
    source: 'template',
    title: t.title.replaceAll('{d}', city),
    emoji: t.emoji,
    category: t.category,
    description: t.description.replaceAll('{d}', city),
    duration: t.duration,
    budgetTier: t.budgetTier,
    timeOfDay: t.timeOfDay,
    meal: t.meal,
    tags: t.tags,
  }))
}
