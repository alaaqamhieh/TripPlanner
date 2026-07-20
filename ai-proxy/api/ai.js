// Serverless AI proxy for TripPlanner. Holds the Anthropic key server-side so
// the static site (GitHub Pages) can offer AI without exposing a key. If
// ANTHROPIC_API_KEY isn't set yet, it degrades gracefully to a friendly
// "not switched on" reply, so the app keeps working until the key is added.

import Anthropic from '@anthropic-ai/sdk'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export default async function handler(req, res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v))
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    // Dormant: no key configured yet. The app shows this as a gentle nudge.
    return res.status(200).json({
      input: {
        reply:
          "The AI planner is deployed but not switched on yet — add an ANTHROPIC_API_KEY in the Vercel project settings and I'll come to life. Everything else in your trip works in the meantime!",
        actions: [],
      },
    })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const { system, context, history = [], message, tool } = body
    if (!message || !tool) return res.status(400).json({ error: 'Missing message or tool' })

    const client = new Anthropic({ apiKey: key })
    const messages = [
      ...history.slice(-6).map((h) => ({ role: h.role, content: String(h.text ?? '') })),
      { role: 'user', content: String(message) },
    ]

    const resp = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1500,
      system: `${system}\n\nTRIP CONTEXT:\n${context}`,
      tools: [tool],
      tool_choice: { type: 'tool', name: tool.name },
      messages,
    })

    const toolUse = (resp.content || []).find((b) => b.type === 'tool_use')
    return res.status(200).json({ input: toolUse ? toolUse.input : { reply: 'Sorry, I had trouble with that.', actions: [] } })
  } catch (err) {
    const status = err?.status && Number.isInteger(err.status) ? err.status : 500
    return res.status(status).json({ error: err?.message || 'AI request failed' })
  }
}
