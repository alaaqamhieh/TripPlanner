import { getAiProxyUrl, getUserAiKey } from './config'
import { ALL_INTERESTS, INTEREST_META, type InterestId, type TravelerProfile } from './types'

// ---------------------------------------------------------------------------
// Deep-research client. Talks to the hosted proxy's /api/research endpoint,
// where Claude runs live web search across forums / blogs / review sites (in
// the local language too) and returns real, named, review-backed places. A
// personal Anthropic key (localStorage) can drive it directly from the browser
// as a fallback. When neither is set, the caller falls back to Places research.
// ---------------------------------------------------------------------------

export function researchAvailable(): boolean {
  return Boolean(getAiProxyUrl()) || Boolean(getUserAiKey())
}

export interface ResearchPlace {
  name: string
  localName?: string
  neighborhood?: string
  category: InterestId
  why: string
  source?: string
  sourceLabel?: string
}
export interface ResearchSection {
  key: string
  label: string
  emoji: string
  places: ResearchPlace[]
}
export interface ResearchResult {
  intro?: string
  sections: ResearchSection[]
}

const MUST_HAVE_PHRASE: Record<string, string> = {
  landmark: 'the famous landmarks everyone asks about',
  cafes: 'a restaurant or dish everyone swears by',
  hiddengem: 'hidden gems most tourists miss',
  sunset: 'a jaw-dropping viewpoint or sunset spot',
  market: 'a lively local market',
  daytrip: 'a day trip out of town',
}

/** A short, readable brief of who's travelling for the researcher. */
export function profileBrief(profile: TravelerProfile): string {
  const loved = ALL_INTERESTS.filter((i) => profile.interests[i] === 2).map((i) => INTEREST_META[i].label)
  const liked = ALL_INTERESTS.filter((i) => profile.interests[i] === 1).map((i) => INTEREST_META[i].label)
  const budget = ['', 'budget / cheap', 'comfortable mid-range', 'treat-myself', 'luxury no-limit'][profile.budget] || 'mid-range'
  const pace = { relaxed: 'relaxed (one thing a day)', balanced: 'balanced', packed: 'packed — wants to see everything' }[profile.pace]
  const food = { safe: 'sticks to familiar food', mixed: 'will try new things', adventurous: 'wants whatever the locals eat' }[profile.foodAdventure]
  const lines = [
    `Party: ${profile.party}${profile.hasKids ? ' (travelling with kids)' : ''}`,
    `Budget: ${budget}. Pace: ${pace}. ${profile.rhythm === 'night' ? 'Night owl.' : profile.rhythm === 'early' ? 'Early riser.' : ''}`.trim(),
    `Food: ${food}.${profile.diet.length ? ` Dietary needs: ${profile.diet.join(', ')}.` : ''}`,
    loved.length ? `Loves: ${loved.join(', ')}.` : '',
    liked.length ? `Also likes: ${liked.join(', ')}.` : '',
    profile.mustHaves.length
      ? `Won't leave without: ${profile.mustHaves.map((m) => MUST_HAVE_PHRASE[m] ?? m).join('; ')}.`
      : '',
  ]
  return lines.filter(Boolean).join('\n')
}

function normalize(data: unknown): ResearchResult {
  const obj = (data ?? {}) as { intro?: unknown; sections?: unknown }
  const sections = Array.isArray(obj.sections) ? (obj.sections as ResearchSection[]) : []
  return { intro: typeof obj.intro === 'string' ? obj.intro : undefined, sections }
}

const SYSTEM = (destination: string) =>
  `You are a meticulous local travel researcher building a guide for ${destination}. Research with web_search / web_fetch first: travel forums (Reddit, TripAdvisor), local blogs and review sites, in the LOCAL language too, weighting what residents say. Find real, currently-open, specifically-named can't-miss sights and the best breakfast/lunch/dinner spots locals rave about, plus hidden gems. For each, say why it's loved (grounded in reviews) with a source URL. Then call submit_guide exactly once. Do not answer in prose instead of the tool.`

const SUBMIT_GUIDE_TOOL = {
  name: 'submit_guide',
  description: 'Return the researched destination guide. Call exactly once when research is complete.',
  input_schema: {
    type: 'object',
    properties: {
      intro: { type: 'string' },
      sections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            key: { type: 'string' },
            label: { type: 'string' },
            emoji: { type: 'string' },
            places: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  localName: { type: 'string' },
                  neighborhood: { type: 'string' },
                  category: { type: 'string' },
                  why: { type: 'string' },
                  source: { type: 'string' },
                  sourceLabel: { type: 'string' },
                },
                required: ['name', 'category', 'why'],
              },
            },
          },
          required: ['key', 'label', 'emoji', 'places'],
        },
      },
    },
    required: ['sections'],
  },
}

/**
 * Research a destination into grouped, real, review-backed places. Prefers the
 * hosted proxy; falls back to a personal browser key. Throws on failure so the
 * caller can fall back to the Places-only guide.
 */
export async function researchGuide(profile: TravelerProfile, destination: string): Promise<ResearchResult> {
  const where = destination.trim()
  if (!where) return { sections: [] }
  const profileText = profileBrief(profile)
  const proxy = getAiProxyUrl()

  if (proxy) {
    const res = await fetch(`${proxy}/api/research`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination: where, profileText }),
    })
    if (!res.ok) throw new Error(`Research failed (${res.status})`)
    const data = (await res.json()) as { error?: string }
    if (data.error) throw new Error(data.error)
    return normalize(data)
  }

  // Bring-your-own-key: run the web-search research loop directly from the browser.
  const key = getUserAiKey()
  if (!key) throw new Error('Research is not configured')
  const tools = [
    { type: 'web_search_20260209', name: 'web_search', max_uses: 8 },
    { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 5 },
    SUBMIT_GUIDE_TOOL,
  ]
  const messages: { role: string; content: unknown }[] = [
    { role: 'user', content: `Research a trip guide for ${where}.\n\nTraveler profile:\n${profileText}\n\nResearch thoroughly, then call submit_guide.` },
  ]
  for (let i = 0; i < 6; i++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model: 'claude-opus-5', max_tokens: 8000, system: SYSTEM(where), tools, messages }),
    })
    if (!res.ok) throw new Error(`Research failed (${res.status})`)
    const data = (await res.json()) as { content?: { type: string; name?: string; input?: unknown }[]; stop_reason?: string }
    const guide = data.content?.find((b) => b.type === 'tool_use' && b.name === 'submit_guide')?.input
    if (guide) return normalize(guide)
    if (data.stop_reason === 'pause_turn' && data.content) {
      messages.push({ role: 'assistant', content: data.content })
      continue
    }
    break
  }
  return { sections: [] }
}
