import { useState } from 'react'
import { dayLabel, tripDates } from '../dateUtils'
import { resolveItem } from '../tripUtils'
import type { MealSlot, ScheduledItem, TripState } from '../types'
import { MEAL_META } from '../types'
import { EmojiPicker } from './EmojiPicker'
import Modal from './Modal'

// One editor for everything on the itinerary. Creating makes a fully custom
// plan; editing works on any scheduled item. Items backed by a library rec
// keep their title/emoji in the pool — everything else is free to change.

export default function ItemModal({
  trip,
  itemId,
  initialDate,
  onSave,
  onDelete,
  onClose,
}: {
  trip: TripState
  /** Editing an existing item when set; otherwise creating a custom one. */
  itemId?: string
  /** Preselected day when creating from a day's ＋ button. */
  initialDate?: string
  onSave: (item: ScheduledItem) => void
  onDelete: (id: string) => void
  onClose: () => void
}) {
  const existing = itemId ? trip.scheduled.find((i) => i.id === itemId) : undefined
  const resolved = existing ? resolveItem(existing, trip.pool) : undefined
  const isLibraryBacked = Boolean(existing?.refId)
  const days = tripDates(trip.meta.startDate, trip.meta.endDate)

  const [title, setTitle] = useState(existing?.title ?? '')
  const [emoji, setEmoji] = useState(existing?.emoji ?? '📍')
  const [date, setDate] = useState(existing?.date ?? initialDate ?? days[0])
  const [time, setTime] = useState(existing?.time ?? '')
  const [meal, setMeal] = useState<MealSlot | ''>(existing?.meal ?? '')
  const [note, setNote] = useState(existing?.note ?? '')
  const [armedDelete, setArmedDelete] = useState(false)

  const heading = existing ? `Edit “${resolved?.title}”` : 'Add your own plan'
  const canSave = isLibraryBacked || title.trim() || existing

  const save = () => {
    const base: ScheduledItem = existing ?? { id: '', date }
    onSave({
      ...base,
      date,
      time: time || undefined,
      meal: meal || undefined,
      note: note.trim() || undefined,
      ...(isLibraryBacked ? {} : { title: title.trim() || resolved?.title || 'My plan', emoji }),
    })
  }

  return (
    <Modal onClose={onClose}>
      <h3>{heading}</h3>
      {isLibraryBacked && <p className="modal-intro">This one comes from your idea list — move it, time it, note it.</p>}

      {!isLibraryBacked && (
        <div className="field">
          <label htmlFor="im-title">What are you doing?</label>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <EmojiPicker value={emoji} onChange={setEmoji} />
            <input
              id="im-title"
              style={{ flex: 1 }}
              placeholder="e.g. Sunset picnic at the citadel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus={!existing}
            />
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="im-day">Which day?</label>
        <select id="im-day" value={date} onChange={(e) => setDate(e.target.value)}>
          {days.map((d, i) => (
            <option key={d} value={d}>
              Day {i + 1} — {dayLabel(d)}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Meal? (optional)</label>
        <div className="chip-row" style={{ margin: 0 }}>
          {(Object.keys(MEAL_META) as MealSlot[]).map((m) => (
            <button key={m} className={`chip${meal === m ? ' on' : ''}`} onClick={() => setMeal(meal === m ? '' : m)}>
              {MEAL_META[m].emoji} {MEAL_META[m].label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="im-time">Time (optional)</label>
        <input id="im-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ maxWidth: 140 }} />
      </div>

      <div className="field">
        <label htmlFor="im-note">Note (optional)</label>
        <textarea
          id="im-note"
          rows={2}
          placeholder="Tickets, addresses, reminders…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="modal-actions">
        {existing && (
          <button
            className={`mini-btn danger${armedDelete ? ' armed' : ''}`}
            style={{ marginRight: 'auto' }}
            onClick={() => {
              if (armedDelete) onDelete(existing.id)
              else {
                setArmedDelete(true)
                setTimeout(() => setArmedDelete(false), 3000)
              }
            }}
          >
            {armedDelete ? 'Tap again to remove' : '🗑 Remove'}
          </button>
        )}
        <button className="mini-btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save} disabled={!canSave}>
          Save
        </button>
      </div>
    </Modal>
  )
}
