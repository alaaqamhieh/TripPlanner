import type { InterestId, RecommendationItem } from '../types'

// ---------------------------------------------------------------------------
// Curated "signature spots" — the real, famous, must-see places for popular
// destinations, the kind a good travel blog or a well-travelled friend would
// name first. Photos are resolved at runtime (Wikipedia REST → src/photos.ts)
// from `wikiTitle`, so this file stays light and keyless. When a Google
// Places key is set, live results join and enrich these.
//
// Matched to a trip by the destination's city token (case-insensitive).
// ---------------------------------------------------------------------------

interface Spot {
  title: string
  emoji: string
  category: InterestId
  blurb: string
  /** Wikipedia article title for the photo; defaults to `title`. */
  wiki?: string
  tags?: string[]
  meal?: 'breakfast' | 'lunch' | 'dinner'
  budgetTier?: 1 | 2 | 3
}

interface Destination {
  /** City tokens that map a trip's destination to this set. */
  match: string[]
  spots: Spot[]
}

const DESTINATIONS: Destination[] = [
  {
    match: ['paris'],
    spots: [
      { title: 'Eiffel Tower', emoji: '🗼', category: 'history', blurb: 'The icon. Go at dusk to catch it sparkle on the hour.', tags: ['landmark', 'photo', 'sunset'] },
      { title: 'Louvre Museum', emoji: '🖼️', category: 'museums', blurb: 'The Mona Lisa and miles of masterpieces — book a timed entry.', tags: ['landmark'] },
      { title: 'Montmartre', emoji: '🎨', category: 'history', blurb: 'Hilltop artists’ quarter crowned by Sacré-Cœur.', wiki: 'Montmartre', tags: ['hiddengem', 'photo'] },
      { title: 'Musée d’Orsay', emoji: '🖼️', category: 'museums', blurb: 'Impressionist heaven in a beautiful old railway station.', tags: [] },
      { title: 'Le Marais', emoji: '🛍️', category: 'shopping', blurb: 'Medieval lanes, falafel, vintage shops and cool cafés.', wiki: 'Le Marais', tags: ['cafes', 'hiddengem'] },
      { title: 'Seine River Cruise', emoji: '🛥️', category: 'nature', blurb: 'See the city glide by — magic after dark.', wiki: 'Seine', tags: ['photo', 'sunset'] },
      { title: 'Latin Quarter Bistro Dinner', emoji: '🍷', category: 'food', blurb: 'Classic French bistro night on the Left Bank.', wiki: 'Latin Quarter, Paris', meal: 'dinner', tags: [] },
      { title: 'Palace of Versailles', emoji: '👑', category: 'history', blurb: 'Day trip to the most extravagant palace in France.', tags: ['daytrip', 'landmark'] },
    ],
  },
  {
    match: ['rome', 'roma'],
    spots: [
      { title: 'Colosseum', emoji: '🏛️', category: 'history', blurb: '2,000-year-old arena — book the arena floor for the full effect.', tags: ['landmark', 'photo'] },
      { title: 'Vatican Museums & Sistine Chapel', emoji: '🖼️', category: 'museums', blurb: 'Michelangelo’s ceiling and endless galleries.', wiki: 'Vatican Museums', tags: ['landmark'] },
      { title: 'Trevi Fountain', emoji: '⛲', category: 'history', blurb: 'Toss a coin at the most theatrical fountain on earth.', tags: ['landmark', 'photo'] },
      { title: 'Pantheon', emoji: '🏛️', category: 'history', blurb: 'A perfect ancient dome, still standing, free to enter.', tags: ['landmark'] },
      { title: 'Trastevere', emoji: '🍝', category: 'food', blurb: 'Cobbled, ivy-draped nightlife and trattoria quarter.', wiki: 'Trastevere', tags: ['hiddengem'], meal: 'dinner' },
      { title: 'Roman Forum & Palatine Hill', emoji: '🏺', category: 'history', blurb: 'Walk the ruins of the ancient city centre.', wiki: 'Roman Forum', tags: [] },
      { title: 'Campo de’ Fiori Market', emoji: '🧺', category: 'food', blurb: 'Morning market, then the best gelato and espresso nearby.', wiki: "Campo de' Fiori", tags: ['market'] },
      { title: 'Borghese Gallery & Gardens', emoji: '🌳', category: 'nature', blurb: 'Bernini sculptures wrapped in Rome’s loveliest park.', wiki: 'Galleria Borghese', tags: ['hiddengem'] },
    ],
  },
  {
    match: ['tokyo', '東京'],
    spots: [
      { title: 'Senso-ji Temple', emoji: '⛩️', category: 'history', blurb: 'Tokyo’s oldest temple in old-town Asakusa.', tags: ['landmark', 'photo'] },
      { title: 'Shibuya Crossing', emoji: '🚦', category: 'history', blurb: 'The world’s busiest scramble — surreal at night.', tags: ['photo', 'landmark'] },
      { title: 'Tsukiji Outer Market', emoji: '🍣', category: 'food', blurb: 'Graze the stalls for the freshest sushi breakfast.', wiki: 'Tsukiji fish market', tags: ['market'], meal: 'breakfast' },
      { title: 'teamLab Planets', emoji: '🌌', category: 'museums', blurb: 'Wade through mind-bending digital art rooms.', wiki: 'teamLab', tags: ['photo'] },
      { title: 'Meiji Shrine', emoji: '🌲', category: 'nature', blurb: 'A forest shrine in the middle of the city.', tags: ['hiddengem'] },
      { title: 'Shinjuku Nightlife (Omoide Yokocho)', emoji: '🏮', category: 'nightlife', blurb: 'Tiny smoky yakitori alleys and neon bars.', wiki: 'Omoide Yokocho', tags: ['nightOwl'], meal: 'dinner' },
      { title: 'Akihabara', emoji: '🎮', category: 'shopping', blurb: 'Electric town of anime, games and gadgets.', wiki: 'Akihabara', tags: [] },
      { title: 'Mt. Fuji / Hakone Day Trip', emoji: '🗻', category: 'adventure', blurb: 'Hot springs and Fuji views a train ride away.', wiki: 'Hakone', tags: ['daytrip', 'photo'] },
    ],
  },
  {
    match: ['london'],
    spots: [
      { title: 'Tower of London', emoji: '🏰', category: 'history', blurb: 'Crown Jewels, ravens and 1,000 years of history.', tags: ['landmark'] },
      { title: 'British Museum', emoji: '🏺', category: 'museums', blurb: 'Rosetta Stone and world treasures — and it’s free.', tags: ['landmark'] },
      { title: 'Borough Market', emoji: '🧺', category: 'food', blurb: 'London’s best food market under railway arches.', tags: ['market'], meal: 'lunch' },
      { title: 'The London Eye', emoji: '🎡', category: 'family', blurb: 'Slow-turning wheel with the whole skyline below.', tags: ['photo', 'kidFriendly'] },
      { title: 'Soho & West End Show', emoji: '🎭', category: 'museums', blurb: 'Dinner then a world-class theatre night.', wiki: 'West End theatre', tags: ['show', 'nightOwl'] },
      { title: 'Camden Market', emoji: '🛍️', category: 'shopping', blurb: 'Punky stalls, street food and canal-side wandering.', tags: ['market', 'hiddengem'] },
      { title: 'Hyde Park', emoji: '🌳', category: 'nature', blurb: 'Row a boat on the Serpentine or just picnic.', tags: ['kidFriendly'] },
      { title: 'Westminster & Big Ben', emoji: '🕰️', category: 'history', blurb: 'Abbey, Parliament and the riverside icons.', wiki: 'Big Ben', tags: ['landmark', 'photo'] },
    ],
  },
  {
    match: ['new york', 'nyc', 'new york city', 'manhattan'],
    spots: [
      { title: 'Central Park', emoji: '🌳', category: 'nature', blurb: 'Rent a bike or just wander the city’s green heart.', tags: ['kidFriendly', 'photo'] },
      { title: 'Statue of Liberty & Ellis Island', emoji: '🗽', category: 'history', blurb: 'Ferry out to the icon and the immigration museum.', tags: ['landmark', 'photo'] },
      { title: 'The Met', emoji: '🖼️', category: 'museums', blurb: 'One of the great museums of the world.', wiki: 'Metropolitan Museum of Art', tags: [] },
      { title: 'Times Square & Broadway', emoji: '🎭', category: 'museums', blurb: 'Neon overload, then a Broadway show.', wiki: 'Broadway theatre', tags: ['show', 'nightOwl'] },
      { title: 'Brooklyn Bridge Walk', emoji: '🌉', category: 'history', blurb: 'Walk it at golden hour for the skyline shot.', tags: ['photo', 'sunset'] },
      { title: 'The High Line', emoji: '🌿', category: 'nature', blurb: 'Elevated park on old rail tracks through Chelsea.', tags: ['hiddengem'] },
      { title: 'Greenwich Village Food Crawl', emoji: '🍕', category: 'food', blurb: 'Pizza, bagels and tucked-away jazz bars.', wiki: 'Greenwich Village', tags: [], meal: 'dinner' },
      { title: 'Top of the Rock', emoji: '🏙️', category: 'adventure', blurb: 'The best skyline view (you can see the Empire State).', wiki: 'Rockefeller Center', tags: ['photo', 'landmark'] },
    ],
  },
  {
    match: ['barcelona'],
    spots: [
      { title: 'Sagrada Família', emoji: '⛪', category: 'history', blurb: 'Gaudí’s unfinished masterpiece — book ahead.', tags: ['landmark', 'photo'] },
      { title: 'Park Güell', emoji: '🦎', category: 'nature', blurb: 'Mosaic dreamscape with city-and-sea views.', tags: ['photo', 'hiddengem'] },
      { title: 'La Boqueria Market', emoji: '🧺', category: 'food', blurb: 'Jamón, juices and tapas off La Rambla.', tags: ['market'], meal: 'lunch' },
      { title: 'Gothic Quarter', emoji: '🏰', category: 'history', blurb: 'Medieval maze of squares, bars and cathedrals.', wiki: 'Gothic Quarter, Barcelona', tags: ['hiddengem'] },
      { title: 'Barceloneta Beach', emoji: '🏖️', category: 'beaches', blurb: 'City beach for a swim and a chiringuito lunch.', tags: ['kidFriendly'] },
      { title: 'Casa Batlló', emoji: '🐉', category: 'museums', blurb: 'Gaudí’s wildest façade, glowing inside.', tags: ['landmark'] },
      { title: 'Tapas & Vermouth Night (El Born)', emoji: '🍷', category: 'nightlife', blurb: 'Hop bodegas in the coolest quarter.', wiki: 'El Born, Barcelona', tags: ['nightOwl'], meal: 'dinner' },
      { title: 'Montjuïc & Magic Fountain', emoji: '⛲', category: 'nature', blurb: 'Hilltop gardens and an evening fountain show.', wiki: 'Montjuïc', tags: ['sunset'] },
    ],
  },
  {
    match: ['istanbul'],
    spots: [
      { title: 'Hagia Sophia', emoji: '🕌', category: 'history', blurb: 'Byzantine-then-Ottoman wonder of the world.', tags: ['landmark', 'photo'] },
      { title: 'Blue Mosque', emoji: '🕌', category: 'history', blurb: 'Six minarets and a sea of blue tiles.', wiki: 'Sultan Ahmed Mosque', tags: ['landmark'] },
      { title: 'Grand Bazaar', emoji: '🛍️', category: 'shopping', blurb: '4,000 shops of lamps, spices and carpets — haggle away.', tags: ['market'] },
      { title: 'Topkapı Palace', emoji: '👑', category: 'history', blurb: 'Sultans’ palace over the Bosphorus.', tags: ['landmark'] },
      { title: 'Bosphorus Cruise', emoji: '⛴️', category: 'nature', blurb: 'Sail between two continents at sunset.', wiki: 'Bosphorus', tags: ['sunset', 'photo'] },
      { title: 'Spice Bazaar & Street Food', emoji: '🌶️', category: 'food', blurb: 'Turkish delight, simit and a fish sandwich by the bridge.', wiki: 'Spice Bazaar, Istanbul', tags: ['market'], meal: 'lunch' },
      { title: 'Turkish Hammam', emoji: '🧖', category: 'wellness', blurb: 'A steam, scrub and soak in a historic bathhouse.', wiki: 'Turkish bath', tags: [] },
      { title: 'Süleymaniye Mosque Terrace', emoji: '🌇', category: 'history', blurb: 'The city’s best free view over the Golden Horn.', wiki: 'Süleymaniye Mosque', tags: ['sunset', 'hiddengem'] },
    ],
  },
  {
    match: ['dubai'],
    spots: [
      { title: 'Burj Khalifa', emoji: '🏙️', category: 'adventure', blurb: 'Up the world’s tallest building at sunset.', tags: ['landmark', 'photo', 'sunset'] },
      { title: 'Dubai Mall & Fountain', emoji: '⛲', category: 'shopping', blurb: 'Aquarium, souks and the nightly fountain show.', wiki: 'Dubai Mall', tags: ['kidFriendly'] },
      { title: 'Desert Safari', emoji: '🐪', category: 'adventure', blurb: 'Dune-bash, camels and a dinner under the stars.', wiki: 'Dubai Desert Conservation Reserve', tags: ['daytrip'], meal: 'dinner' },
      { title: 'Old Dubai & Gold Souk', emoji: '🕌', category: 'history', blurb: 'Abra boat across the creek to the old spice lanes.', wiki: 'Gold Souk, Dubai', tags: ['market', 'hiddengem'] },
      { title: 'Palm Jumeirah', emoji: '🌴', category: 'beaches', blurb: 'Beach clubs on the famous man-made island.', tags: ['kidFriendly'] },
      { title: 'Dubai Marina', emoji: '🛥️', category: 'nightlife', blurb: 'Yacht-lined waterfront dining and lights.', tags: ['nightOwl'], meal: 'dinner' },
    ],
  },
  {
    match: ['bangkok'],
    spots: [
      { title: 'Grand Palace & Wat Phra Kaew', emoji: '🛕', category: 'history', blurb: 'Golden spires and the Emerald Buddha.', tags: ['landmark', 'photo'] },
      { title: 'Wat Arun', emoji: '🌅', category: 'history', blurb: 'Riverside temple, glorious at sunset.', tags: ['photo', 'sunset'] },
      { title: 'Chatuchak Weekend Market', emoji: '🛍️', category: 'shopping', blurb: '15,000 stalls of everything imaginable.', tags: ['market'] },
      { title: 'Street Food on Yaowarat (Chinatown)', emoji: '🍜', category: 'food', blurb: 'The best cheap eats crawl in Asia.', wiki: 'Yaowarat Road', tags: ['market', 'nightOwl'], meal: 'dinner' },
      { title: 'Floating Market Day Trip', emoji: '🛶', category: 'nature', blurb: 'Boats piled with fruit and noodles.', wiki: 'Damnoen Saduak Floating Market', tags: ['daytrip', 'photo'] },
      { title: 'Thai Massage & Wat Pho', emoji: '🧖', category: 'wellness', blurb: 'Reclining Buddha then a proper Thai massage.', wiki: 'Wat Pho', tags: [] },
      { title: 'Rooftop Sky Bar', emoji: '🍸', category: 'nightlife', blurb: 'Cocktails high above the glittering city.', wiki: 'Sky Bar, Bangkok', tags: ['nightOwl', 'sunset'] },
    ],
  },
  {
    match: ['bali', 'ubud', 'denpasar', 'kuta', 'seminyak'],
    spots: [
      { title: 'Tegallalang Rice Terraces', emoji: '🌾', category: 'nature', blurb: 'Emerald stepped paddies near Ubud.', tags: ['photo', 'hiddengem'] },
      { title: 'Uluwatu Temple & Kecak Dance', emoji: '🛕', category: 'history', blurb: 'Cliff temple with a fiery sunset dance.', tags: ['sunset', 'photo', 'show'] },
      { title: 'Sacred Monkey Forest, Ubud', emoji: '🐒', category: 'nature', blurb: 'Jungle temples and cheeky macaques.', wiki: 'Ubud Monkey Forest', tags: ['kidFriendly'] },
      { title: 'Seminyak Beach Club', emoji: '🏖️', category: 'beaches', blurb: 'Sunbeds, surf and sunset cocktails.', wiki: 'Seminyak', tags: ['sunset'] },
      { title: 'Mount Batur Sunrise Trek', emoji: '🌋', category: 'adventure', blurb: 'Dawn hike up a volcano above the clouds.', wiki: 'Mount Batur', tags: ['daytrip', 'photo'] },
      { title: 'Balinese Spa Afternoon', emoji: '🧖', category: 'wellness', blurb: 'Flower baths and massages for a song.', wiki: 'Balinese massage', tags: [] },
      { title: 'Tanah Lot Temple', emoji: '🌊', category: 'history', blurb: 'Sea temple on a rock, best at low tide sunset.', tags: ['sunset', 'landmark'] },
    ],
  },
  {
    match: ['lisbon', 'lisboa'],
    spots: [
      { title: 'Belém Tower & Jerónimos', emoji: '🏰', category: 'history', blurb: 'Age-of-discovery landmarks by the river.', wiki: 'Belém Tower', tags: ['landmark', 'photo'] },
      { title: 'Tram 28 through Alfama', emoji: '🚋', category: 'history', blurb: 'Rattle through the old quarters on a vintage tram.', wiki: 'Alfama', tags: ['photo', 'hiddengem'] },
      { title: 'Time Out Market', emoji: '🍤', category: 'food', blurb: 'Portugal’s best chefs under one roof.', wiki: 'Time Out Market Lisboa', tags: ['market'], meal: 'lunch' },
      { title: 'Pastéis de Belém', emoji: '🥧', category: 'food', blurb: 'The original custard tarts, warm from the oven.', tags: ['cafes'], meal: 'breakfast' },
      { title: 'São Jorge Castle', emoji: '🏰', category: 'history', blurb: 'Hilltop castle with the city at your feet.', wiki: 'São Jorge Castle', tags: ['photo', 'sunset'] },
      { title: 'Fado Night in Alfama', emoji: '🎶', category: 'nightlife', blurb: 'Soulful Portuguese song over dinner.', wiki: 'Fado', tags: ['show', 'nightOwl'], meal: 'dinner' },
      { title: 'Sintra Day Trip', emoji: '🏰', category: 'adventure', blurb: 'Fairy-tale palaces in misty hills.', wiki: 'Sintra', tags: ['daytrip', 'photo'] },
    ],
  },
  {
    match: ['amsterdam'],
    spots: [
      { title: 'Rijksmuseum', emoji: '🖼️', category: 'museums', blurb: 'Rembrandt, Vermeer and the Dutch Golden Age.', tags: ['landmark'] },
      { title: 'Anne Frank House', emoji: '📖', category: 'history', blurb: 'Deeply moving — book weeks ahead.', tags: ['landmark'] },
      { title: 'Canal Cruise', emoji: '🛥️', category: 'nature', blurb: 'See the UNESCO canal ring from the water.', wiki: 'Canals of Amsterdam', tags: ['photo'] },
      { title: 'Van Gogh Museum', emoji: '🌻', category: 'museums', blurb: 'The world’s largest Van Gogh collection.', tags: [] },
      { title: 'Jordaan District', emoji: '🚲', category: 'shopping', blurb: 'Boutiques, brown cafés and hidden courtyards.', wiki: 'Jordaan', tags: ['cafes', 'hiddengem'] },
      { title: 'Vondelpark', emoji: '🌳', category: 'nature', blurb: 'Rent bikes and picnic like a local.', tags: ['kidFriendly'] },
      { title: 'Albert Cuyp Market', emoji: '🧺', category: 'food', blurb: 'Stroopwafels and street food in De Pijp.', wiki: 'Albert Cuyp Market', tags: ['market'], meal: 'lunch' },
    ],
  },
  {
    match: ['singapore'],
    spots: [
      { title: 'Gardens by the Bay', emoji: '🌳', category: 'nature', blurb: 'Supertrees and cooled domes — magic after dark.', tags: ['photo', 'landmark'] },
      { title: 'Marina Bay Sands SkyPark', emoji: '🏙️', category: 'adventure', blurb: 'Infinity views over the bay.', wiki: 'Marina Bay Sands', tags: ['photo', 'sunset'] },
      { title: 'Hawker Centre Feast (Maxwell)', emoji: '🍜', category: 'food', blurb: 'Michelin street food for a few dollars.', wiki: 'Maxwell Food Centre', tags: ['market'], meal: 'dinner' },
      { title: 'Sentosa Island', emoji: '🏖️', category: 'family', blurb: 'Beaches, Universal Studios and cable cars.', wiki: 'Sentosa', tags: ['kidFriendly', 'daytrip'] },
      { title: 'Chinatown & Sri Mariamman', emoji: '🏮', category: 'history', blurb: 'Temples, heritage shops and food streets.', wiki: 'Chinatown, Singapore', tags: ['hiddengem'] },
      { title: 'Singapore Botanic Gardens', emoji: '🌸', category: 'nature', blurb: 'UNESCO gardens with a stunning orchid house.', tags: ['kidFriendly'] },
    ],
  },
  {
    match: ['marrakech', 'marrakesh'],
    spots: [
      { title: 'Jemaa el-Fnaa', emoji: '🎪', category: 'history', blurb: 'The legendary square — snake charmers by day, food stalls by night.', tags: ['landmark', 'market', 'nightOwl'] },
      { title: 'Souks of the Medina', emoji: '🛍️', category: 'shopping', blurb: 'Get lost among lanterns, leather and spices.', wiki: 'Marrakesh', tags: ['market'] },
      { title: 'Jardin Majorelle', emoji: '💙', category: 'nature', blurb: 'YSL’s cobalt-blue garden oasis.', tags: ['photo', 'hiddengem'] },
      { title: 'Bahia Palace', emoji: '🕌', category: 'history', blurb: 'Dazzling tilework and carved cedar.', tags: ['landmark'] },
      { title: 'Traditional Hammam & Spa', emoji: '🧖', category: 'wellness', blurb: 'Black-soap scrub and a mint-tea rest.', wiki: 'Hammam', tags: [] },
      { title: 'Rooftop Tagine Dinner', emoji: '🍲', category: 'food', blurb: 'Slow-cooked tagine over the medina rooftops.', wiki: 'Tajine', tags: ['sunset'], meal: 'dinner' },
      { title: 'Atlas Mountains Day Trip', emoji: '⛰️', category: 'adventure', blurb: 'Berber villages and waterfalls a drive away.', wiki: 'Atlas Mountains', tags: ['daytrip', 'photo'] },
    ],
  },
]

/** Normalize a destination string to its city token for matching. */
function cityToken(destination: string): string {
  return destination.split(',')[0].trim().toLowerCase()
}

/**
 * Real signature places for a destination, as pool-ready RecommendationItems.
 * Returns [] for destinations not in the curated set (the app then leans on
 * Google Places + AI + the generic idea templates).
 */
export function signatureSpotsFor(destination: string): RecommendationItem[] {
  const city = cityToken(destination)
  if (!city) return []
  const dest = DESTINATIONS.find((d) => d.match.some((m) => city.includes(m) || m.includes(city)))
  if (!dest) return []
  return dest.spots.map((s, i) => ({
    id: `sig-${city.replace(/\W+/g, '')}-${i}`,
    source: 'signature' as const,
    title: s.title,
    emoji: s.emoji,
    category: s.category,
    description: s.blurb,
    budgetTier: s.budgetTier,
    meal: s.meal,
    tags: s.tags,
    wikiTitle: s.wiki ?? s.title,
  }))
}

/** True if we have a curated set for this destination. */
export function hasSignatureSpots(destination: string): boolean {
  return signatureSpotsFor(destination).length > 0
}
