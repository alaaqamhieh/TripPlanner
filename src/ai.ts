import { getAiProxyUrl, getUserAiKey } from './config'
import { dayLabel, tripDates } from './dateUtils'
import { resolveItem, sortDayItems } from './tripUtils'
import { ALL_INTERESTS, INTEREST_META, type TripState } from './types'
import type { AiAction, AiResponse } from './engine/aiActions'

// ---------------------------------------------------------------------------
// AI assistant client. Talks to the hosted Vercel proxy (VITE_AI_PROXY_URL),
// which holds the Anthropic key server-side. As a fallback for power users, a
// personal key stored in localStorage ('tripplanner/aikey') calls Claude
// directly from the browser. If neither is set, the feature is dormant.
// ---------------------------------------------------------------------------

export function aiAvailable(): boolean {
  return Boolean(getAiProxyUrl()) || Boolean(getUserAiKey())
}

/** A compact, grounded summary of the trip for the model to reason over. */
function tripContext(trip: TripState): string {
  const days = tripDates(trip.meta.startDate, trip.meta.endDate)
  const p = trip.profile
  const loved = ALL_INTERESTS.filter((i) => p.interests[i] === 2).map((i) => INTEREST_META[i].label)
  const liked = ALL_INTERESTS.filter((i) => p.interests[i] === 1).map((i) => INTEREST_META[i].label)

  const itinerary = days
    .map((date, i) => {
      const items = sortDayItems(trip.scheduled.filter((s) => s.date === date))
      const label = `Day ${i + 1} (${dayLabel(date)})`
      if (!items.length) return `${label}: (empty)`
      const list = items.map((it) => resolveItem(it, trip.pool).title + (it.time ? ` @${it.time}` : '')).join('; ')
      return `${label}: ${list}`
    })
    .join('\n')

  return [
    `Destination: ${trip.meta.destination || trip.meta.name}`,
    `Dates: ${dayLabel(trip.meta.startDate)}–${dayLabel(trip.meta.endDate)} (${days.length} days, 1-indexed)`,
    `Travellers: ${p.party}${p.hasKids ? ' (with kids)' : ''} · budget tier ${p.budget}/4 · pace ${p.pace} · ${p.rhythm}`,
    loved.length ? `Loves: ${loved.join(', ')}` : '',
    liked.length ? `Likes: ${liked.join(', ')}` : '',
    p.diet.length ? `Dietary needs: ${p.diet.join(', ')}` : '',
    p.mustHaves.length ? `Must-haves: ${p.mustHaves.join(', ')}` : '',
    '',
    'Current itinerary:',
    itinerary,
  ]
    .filter(Boolean)
    .join('\n')
}

const SYSTEM = `You are a warm, expert travel planner embedded in a trip-planning app.
The user is editing a specific trip. Help them like a knowledgeable friend: suggest real, well-known places for their destination, answer questions, and edit their day-by-day plan on request.

You MUST respond by calling the update_trip tool exactly once. Put your conversational answer in "reply" (concise, friendly, 1-3 sentences) and any concrete changes in "actions".
- Reference days by their 1-based number (Day 1 is the first day).
- Use real, specific place names for the destination when suggesting things (not generic descriptions).
- Respect the traveller's budget, pace, dietary needs, and who is travelling (e.g. no bars/clubs when kids are along).
- Only include actions the user actually asked for or clearly wants. For pure questions, return an empty actions array.
- Keep it grounded in the itinerary you're given.`

const TOOL = {
  name: 'update_trip',
  description: 'Reply to the traveller and optionally edit their trip.',
  input_schema: {
    type: 'object',
    properties: {
      reply: { type: 'string', description: 'A concise, friendly conversational reply to show the user.' },
      actions: {
        type: 'array',
        description: 'Concrete edits to apply to the trip. Empty for pure questions.',
        items: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['add_plan', 'remove_plan', 'move_plan', 'add_idea'] },
            day: { type: 'integer', description: '1-based day number (for add_plan/remove_plan).' },
            toDay: { type: 'integer', description: '1-based destination day (for move_plan).' },
            title: { type: 'string', description: 'Name of the place/activity.' },
            emoji: { type: 'string' },
            category: {
              type: 'string',
              enum: ['nature', 'history', 'food', 'nightlife', 'shopping', 'museums', 'adventure', 'beaches', 'family', 'wellness'],
            },
            description: { type: 'string' },
            note: { type: 'string' },
            time: { type: 'string', description: '24h HH:MM, optional.' },
            meal: { type: 'string', enum: ['breakfast', 'lunch', 'dinner'] },
          },
          required: ['type'],
        },
      },
    },
    required: ['reply', 'actions'],
  },
}

export interface AiTurn {
  role: 'user' | 'assistant'
  text: string
}

function parseResponse(input: unknown): AiResponse {
  const obj = (input ?? {}) as { reply?: unknown; actions?: unknown }
  const reply = typeof obj.reply === 'string' ? obj.reply : "Here's what I found."
  const actions = Array.isArray(obj.actions) ? (obj.actions as AiAction[]) : []
  return { reply, actions }
}

/**
 * Ask the assistant. Sends the trip context + short history + the new message.
 * Throws on network/config errors so the UI can show a friendly message.
 */
export async function askAi(trip: TripState, message: string, history: AiTurn[]): Promise<AiResponse> {
  const proxy = getAiProxyUrl()
  const payload = {
    system: SYSTEM,
    context: tripContext(trip),
    history: history.slice(-6),
    message,
    tool: TOOL,
  }

  if (proxy) {
    const res = await fetch(`${proxy}/api/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`AI request failed (${res.status})`)
    const data = (await res.json()) as { input?: unknown; error?: string }
    if (data.error) throw new Error(data.error)
    return parseResponse(data.input)
  }

  // Bring-your-own-key fallback: call Anthropic directly from the browser.
  const key = getUserAiKey()
  if (!key) throw new Error('AI is not configured')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      max_tokens: 1500,
      system: `${SYSTEM}\n\nTRIP CONTEXT:\n${payload.context}`,
      tools: [TOOL],
      tool_choice: { type: 'tool', name: 'update_trip' },
      messages: [
        ...history.slice(-6).map((h) => ({ role: h.role, content: h.text })),
        { role: 'user', content: message },
      ],
    }),
  })
  if (!res.ok) throw new Error(`AI request failed (${res.status})`)
  const data = (await res.json()) as { content?: { type: string; input?: unknown }[] }
  const toolUse = data.content?.find((b) => b.type === 'tool_use')
  return parseResponse(toolUse?.input)
}
