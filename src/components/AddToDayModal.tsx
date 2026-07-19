import { useState } from 'react'
import { dayLabel, tripDates } from '../dateUtils'
import type { MealSlot, TripState } from '../types'
import { MEAL_META } from '../types'
import Modal from './Modal'

// "＋ Plan" day picker: choose a day (and optionally a meal + time) for a
// recommendation. The tap-fallback for people who don't want to drag.

export default function AddToDayModal({
  trip,
  recId,
  onAdd,
  onClose,
}: {
  trip: TripState
  recId: string
  onAdd: (recId: string, date: string, meal?: MealSlot, time?: string) => void
  onClose: () => void
}) {
  const rec = trip.pool.find((r) => r.id === recId)
  const [meal, setMeal] = useState<MealSlot | ''>(rec?.meal ?? '')
  const [time, setTime] = useState('')
  const days = tripDates(trip.meta.startDate, trip.meta.endDate)

  return (
    <Modal onClose={onClose}>
      <h3>
        {rec?.emoji} Plan “{rec?.title}”
      </h3>
      <p className="modal-intro">Pick a day — you can drag it somewhere else anytime.</p>

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
        <label htmlFor="atd-time">Time (optional)</label>
        <input id="atd-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ maxWidth: 140 }} />
      </div>

      <div className="field">
        <label>Which day?</label>
        <div className="day-pick-grid">
          {days.map((date, i) => (
            <button key={date} className="day-pick" onClick={() => onAdd(recId, date, meal || undefined, time || undefined)}>
              <span className="wk">Day {i + 1}</span>
              {dayLabel(date)}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
