import { useState } from 'react'
import { useConfirm } from '../useConfirm'
import type { TripMeta, TripState } from '../types'
import { EmojiPicker } from './EmojiPicker'
import Modal from './Modal'

// Trip settings: rename, re-date, retake the quiz, share/back up, delete.

export default function TripSettingsModal({
  trip,
  onSave,
  onRetake,
  onShare,
  onDelete,
  onClose,
}: {
  trip: TripState
  onSave: (meta: TripMeta) => void
  onRetake: () => void
  onShare: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const [name, setName] = useState(trip.meta.name)
  const [destination, setDestination] = useState(trip.meta.destination)
  const [emoji, setEmoji] = useState(trip.meta.emoji)
  const [startDate, setStartDate] = useState(trip.meta.startDate)
  const [endDate, setEndDate] = useState(trip.meta.endDate)
  const del = useConfirm(onDelete)

  const save = () => {
    const end = endDate < startDate ? startDate : endDate
    onSave({
      ...trip.meta,
      name: name.trim() || trip.meta.name,
      destination: destination.trim(),
      emoji,
      startDate,
      endDate: end,
    })
  }

  return (
    <Modal onClose={onClose}>
      <h3>Trip settings</h3>

      <div className="field">
        <label htmlFor="ts-name">Trip name</label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <EmojiPicker value={emoji} onChange={setEmoji} />
          <input id="ts-name" style={{ flex: 1 }} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label htmlFor="ts-dest">Destination</label>
        <input id="ts-dest" placeholder="e.g. Lisbon, Portugal" value={destination} onChange={(e) => setDestination(e.target.value)} />
      </div>

      <div className="field">
        <label htmlFor="ts-start">Dates</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input id="ts-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input aria-label="Last day" type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <p className="search-hint" style={{ margin: 0 }}>
          Changing dates keeps your plans — anything outside the new range stays saved and comes back if you widen the
          dates again.
        </p>
      </div>

      <div className="field">
        <label>Your answers</label>
        <button className="btn ghost" onClick={onRetake}>
          🎯 Retake the travel quiz
        </button>
      </div>

      <div className="field">
        <label>Take it with you</label>
        <button className="btn ghost" onClick={onShare}>
          🔗 Copy trip link (share / back up)
        </button>
        <p className="search-hint" style={{ margin: 0 }}>
          The link carries your whole trip — open it on any device to import it there.
        </p>
      </div>

      <div className="modal-actions">
        <button className={`mini-btn danger${del.armed ? ' armed' : ''}`} style={{ marginRight: 'auto' }} onClick={del.trigger}>
          {del.armed ? 'Tap again to delete' : '🗑 Delete trip'}
        </button>
        <button className="mini-btn" onClick={onClose}>
          Cancel
        </button>
        <button className="btn" onClick={save}>
          Save
        </button>
      </div>
    </Modal>
  )
}
