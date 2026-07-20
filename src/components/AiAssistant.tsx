import { useEffect, useRef, useState } from 'react'
import type { UpdateTrip, ToastFn } from '../App'
import { aiAvailable, askAi, type AiTurn } from '../ai'
import { applyAiActions } from '../engine/aiActions'
import { burstConfetti } from '../confetti'
import type { TripState } from '../types'

// A conversational AI planner: the user types anything ("add a sunset dinner
// on day 2", "make day 3 more relaxed", "I'm vegetarian, fix my food"), Claude
// replies and applies structured edits through the same updateTrip pipeline —
// so every AI change stays fully editable by hand.

interface ChatMsg {
  role: 'user' | 'assistant'
  text: string
  applied?: string[]
}

const SUGGESTIONS = [
  'Plan a great first day',
  'Add a romantic dinner spot',
  'Suggest 3 hidden gems',
  'Make my trip more relaxed',
]

export default function AiAssistant({
  trip,
  updateTrip,
  showToast,
}: {
  trip: TripState
  updateTrip: UpdateTrip
  showToast: ToastFn
}) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const configured = aiAvailable()

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open, busy])

  const send = async (text: string) => {
    const q = text.trim()
    if (!q || busy) return
    setInput('')
    const history: AiTurn[] = messages.map((m) => ({ role: m.role, text: m.text }))
    setMessages((m) => [...m, { role: 'user', text: q }])
    setBusy(true)
    try {
      const res = await askAi(trip, q, history)
      let applied: string[] = []
      if (res.actions.length) {
        // Apply against the freshest trip state inside the pipeline.
        updateTrip((prev) => {
          const out = applyAiActions(prev, res.actions)
          applied = out.summaries
          return out.trip
        })
        if (applied.length) {
          burstConfetti(window.innerWidth - 60, window.innerHeight - 80, 16)
          showToast(`✨ ${applied[0]}${applied.length > 1 ? ` (+${applied.length - 1} more)` : ''}`)
        }
      }
      setMessages((m) => [...m, { role: 'assistant', text: res.reply, applied }])
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: "Sorry — I couldn't reach the AI just now. Try again in a moment." },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button className="ai-fab" onClick={() => setOpen(true)} aria-label="Open AI trip planner">
        ✨ Ask AI
      </button>

      {open && (
        <div className="ai-sheet-backdrop" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <aside className="ai-sheet" role="dialog" aria-label="AI trip planner">
            <div className="ai-head">
              <strong>✨ AI trip planner</strong>
              <button className="ai-close" onClick={() => setOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>

            <div className="ai-body" ref={scrollRef}>
              {!configured ? (
                <div className="ai-dormant">
                  <div style={{ fontSize: '2.4rem' }}>🔌</div>
                  <p>
                    The AI planner isn't switched on yet. Once a Claude API key is connected, you'll be able to plan and
                    edit this trip just by chatting — "add a food tour on day 2", "make it more relaxed", "I'm
                    vegetarian".
                  </p>
                </div>
              ) : messages.length === 0 ? (
                <div className="ai-intro">
                  <p>
                    Hi! I'm your trip planner for <strong>{trip.meta.name}</strong>. Ask me to add places, rework a
                    day, respect a diet, or just get ideas — I'll update your plan as we chat.
                  </p>
                  <div className="ai-suggests">
                    {SUGGESTIONS.map((s) => (
                      <button key={s} className="chip" onClick={() => send(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`ai-msg ${m.role}`}>
                    <div className="ai-bubble">{m.text}</div>
                    {m.applied && m.applied.length > 0 && (
                      <ul className="ai-applied">
                        {m.applied.map((a, j) => (
                          <li key={j}>✓ {a}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
              {busy && (
                <div className="ai-msg assistant">
                  <div className="ai-bubble ai-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              )}
            </div>

            <form
              className="ai-input-row"
              onSubmit={(e) => {
                e.preventDefault()
                send(input)
              }}
            >
              <input
                className="ai-input"
                placeholder={configured ? 'Ask anything about your trip…' : 'AI not connected yet'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!configured || busy}
                autoFocus
              />
              <button className="btn" type="submit" disabled={!configured || busy || !input.trim()}>
                Send
              </button>
            </form>
          </aside>
        </div>
      )}
    </>
  )
}
