import { useEffect, useRef, useState } from 'react'
import { EMOJI_GROUPS } from '../emojiOptions'

/**
 * A tap-to-pick emoji grid, standing in for a free-text emoji field — many
 * keyboards (especially physical/desktop ones) don't make typing an emoji
 * easy, so picking from a curated list is the reliable path everywhere.
 */
export function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocPointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDocPointerDown)
    return () => document.removeEventListener('pointerdown', onDocPointerDown)
  }, [open])

  return (
    <div className="emoji-picker" ref={ref}>
      <button
        type="button"
        className="emoji-picker__trigger"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Emoji: ${value}. Tap to change.`}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">{value}</span>
      </button>
      {open && (
        <div className="emoji-picker__panel" role="dialog" aria-label="Choose an emoji">
          {EMOJI_GROUPS.map((g) => (
            <div key={g.label} className="emoji-picker__group">
              <span className="emoji-picker__group-label">{g.label}</span>
              <div className="emoji-picker__grid">
                {g.options.map((e) => (
                  <button
                    key={e}
                    type="button"
                    className={`emoji-picker__option ${e === value ? 'emoji-picker__option--on' : ''}`}
                    aria-label={e}
                    onClick={() => {
                      onChange(e)
                      setOpen(false)
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
