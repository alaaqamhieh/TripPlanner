// Deep-research endpoint for TripPlanner. Uses Claude with the Anthropic
// server-side web_search + web_fetch tools to research a destination like a
// careful local would — forums, local blogs, review sites, in the local
// language — and returns a structured guide of real, named, review-backed
// places. The frontend then grounds each place through Google Places
// (rating / reviews / photo / coords). Holds ANTHROPIC_API_KEY server-side;
// degrades to a friendly dormant reply when the key isn't set.

import Anthropic from '@anthropic-ai/sdk'

// Web research can take a while (several searches + fetches). Give the function
// room; without this Vercel would cut it off at the default 10s.
export const config = { maxDuration: 300 }

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const MODEL = 'claude-opus-5'

const CATEGORIES = [
  'nature', 'history', 'food', 'nightlife', 'shopping',
  'museums', 'adventure', 'beaches', 'family', 'wellness',
]

const SUBMIT_GUIDE_TOOL = {
  name: 'submit_guide',
  description:
    'Return the researched destination guide as structured data. Call this exactly once, only after you have finished researching.',
  input_schema: {
    type: 'object',
    properties: {
      intro: {
        type: 'string',
        description: 'One or two sentences on what makes this destination special and what a first-timer must know.',
      },
      sections: {
        type: 'array',
        description: 'Themed groups of real places, best-first within each group.',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              enum: ['mustsee', 'breakfast', 'lunch', 'dinner', 'hiddengems', 'cafes', 'nightlife', 'nature', 'shopping', 'wellness', 'daytrips', 'forkids'],
            },
            label: { type: 'string', description: 'Human title, e.g. "Must-see — you can\'t leave without these".' },
            emoji: { type: 'string' },
            places: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Exact, current, real venue name as it appears on Google Maps.' },
                  localName: { type: 'string', description: 'Name in the local language/script, if different.' },
                  neighborhood: { type: 'string', description: 'Neighbourhood or area within the destination.' },
                  category: { type: 'string', enum: CATEGORIES },
                  why: {
                    type: 'string',
                    description: 'One or two sentences on why locals and travelers rave about it, grounded in what reviews actually say.',
                  },
                  source: { type: 'string', description: 'A URL backing this pick (Reddit thread, local blog, review site, or Google Maps).' },
                  sourceLabel: { type: 'string', description: 'Short label for the source, e.g. "Reddit", "Eater", "Time Out".' },
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

function systemPrompt(destination) {
  return `You are a meticulous local travel researcher building a destination guide for ${destination}.

Do REAL research with the web_search and web_fetch tools before answering. Specifically:
- Search travel forums (Reddit r/travel and city subreddits, TripAdvisor forums), local blogs, and review sites (Google Maps, Eater, Time Out, local-language equivalents).
- Search in the LOCAL language too, and weight what RESIDENTS and locals say over generic tourist listicles. Hidden gems that locals love matter as much as the famous sights.
- Find the genuinely can't-miss sights and the best places to eat breakfast, lunch and dinner that people rave about — plus a few hidden gems tourists usually miss.
- Every place must be a REAL, currently-open, specifically-named venue you could find on Google Maps (not "a nice café near the river"). Prefer places with strong, recent reviews.
- For each place, write one or two sentences on WHY it's loved, grounded in what reviews/locals actually say, and include a source URL.

Tailor the guide to this traveler and only include things that fit them. When done, call submit_guide exactly once with the structured result. Do not write a prose answer instead of calling the tool.`
}

/** Pull the submit_guide tool input out of a response, if present. */
function findGuide(content) {
  for (const block of content || []) {
    if (block.type === 'tool_use' && block.name === 'submit_guide') return block.input
  }
  return null
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    return res.status(200).json({
      dormant: true,
      sections: [],
      message: 'Deep research needs an ANTHROPIC_API_KEY in the Vercel project settings. The curated guide still works in the meantime.',
    })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const destination = String(body.destination || '').trim()
    const profileText = String(body.profileText || '').trim()
    if (!destination) return res.status(400).json({ error: 'Missing destination' })

    const client = new Anthropic({ apiKey: key })
    const tools = [
      { type: 'web_search_20260209', name: 'web_search', max_uses: 8 },
      { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 5 },
      SUBMIT_GUIDE_TOOL,
    ]
    const messages = [
      {
        role: 'user',
        content: `Research a trip guide for ${destination}.\n\nTraveler profile:\n${profileText || '(no strong preferences given — cover the essentials for a first-time visitor)'}\n\nResearch thoroughly, then call submit_guide.`,
      },
    ]

    // Server tools run their own loop; a long run can end with stop_reason
    // "pause_turn" that we resume, or "end_turn"/"tool_use" when finished.
    let guide = null
    for (let i = 0; i < 6 && !guide; i++) {
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        output_config: { effort: 'medium' },
        system: systemPrompt(destination),
        tools,
        messages,
      })
      guide = findGuide(resp.content)
      if (guide) break
      messages.push({ role: 'assistant', content: resp.content })
      if (resp.stop_reason === 'pause_turn') continue // resume server-tool loop
      // Finished researching but didn't call the tool — ask once, forcing it.
      messages.push({ role: 'user', content: 'Now call submit_guide with everything you found.' })
      const forced = await client.messages.create({
        model: MODEL,
        max_tokens: 8000,
        system: systemPrompt(destination),
        tools: [SUBMIT_GUIDE_TOOL],
        tool_choice: { type: 'tool', name: 'submit_guide' },
        messages,
      })
      guide = findGuide(forced.content)
      break
    }

    if (!guide || !Array.isArray(guide.sections)) {
      return res.status(200).json({ sections: [], intro: '' })
    }
    return res.status(200).json({ intro: guide.intro || '', sections: guide.sections })
  } catch (err) {
    const status = err?.status && Number.isInteger(err.status) ? err.status : 500
    return res.status(status).json({ error: err?.message || 'Research failed' })
  }
}
