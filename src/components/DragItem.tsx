import { useEffect, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'

function clearDropzoneHighlight(zone: HTMLElement | null) {
  zone?.classList.remove('day-cell--drag-over')
}

/**
 * A draggable-or-tappable surface. Dragging past an 8px threshold and
 * releasing over an element with [data-dropzone] resolves that zone's id.
 * A plain tap (no movement) calls onChoose(null) — callers use that as the
 * "open a picker instead" fallback, so the interaction is forgiving on
 * touch devices where dragging can be fiddly.
 */
export function DragItem({
  children,
  onChoose,
  ariaLabel,
  className = '',
}: {
  children: ReactNode
  onChoose: (dropZone: string | null) => void
  ariaLabel: string
  className?: string
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const moved = useRef(false)
  const activeZone = useRef<HTMLElement | null>(null)
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)

  // Defense in depth: if this card unmounts mid-drag, don't leave a stuck highlight.
  useEffect(() => () => clearDropzoneHighlight(activeZone.current), [])

  // The card is translated to follow the cursor, so it always sits directly under
  // the pointer — a plain elementFromPoint would just hit the card itself. Hide it
  // from hit-testing for the query so we find whatever's actually underneath.
  const elementUnderCursor = (x: number, y: number): HTMLElement | null => {
    const el = ref.current
    const prevPointerEvents = el?.style.pointerEvents
    if (el) el.style.pointerEvents = 'none'
    const found = document.elementFromPoint(x, y) as HTMLElement | null
    if (el) el.style.pointerEvents = prevPointerEvents ?? ''
    return found
  }

  const onDown = (e: ReactPointerEvent) => {
    // Touch: don't capture at all — fingers are for scrolling the page, and a
    // grazed card must never hijack the gesture or pop a picker. Scheduling on
    // touch happens through the card's explicit "Pick a day" button instead.
    if (e.pointerType === 'touch') return
    start.current = { x: e.clientX, y: e.clientY }
    moved.current = false
    ref.current?.setPointerCapture(e.pointerId)
  }

  const onMove = (e: ReactPointerEvent) => {
    if (!start.current) return
    const dx = e.clientX - start.current.x
    const dy = e.clientY - start.current.y
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved.current = true
    if (moved.current) {
      setDrag({ x: dx, y: dy })
      const el = elementUnderCursor(e.clientX, e.clientY)
      const zone = el?.closest<HTMLElement>('[data-dropzone]') ?? null
      if (zone !== activeZone.current) {
        clearDropzoneHighlight(activeZone.current)
        zone?.classList.add('day-cell--drag-over')
        activeZone.current = zone
      }
    }
  }

  const onUp = (e: ReactPointerEvent) => {
    if (!start.current) return
    let zone: string | null = null
    if (moved.current) {
      const el = elementUnderCursor(e.clientX, e.clientY)
      zone = el?.closest<HTMLElement>('[data-dropzone]')?.dataset.dropzone ?? null
    }
    clearDropzoneHighlight(activeZone.current)
    activeZone.current = null
    start.current = null
    setDrag(null)
    onChoose(zone)
  }

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      className={`drag-item ${drag ? 'drag-item--dragging' : ''} ${className}`}
      style={drag ? { transform: `translate(${drag.x}px, ${drag.y}px)` } : undefined}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => {
        clearDropzoneHighlight(activeZone.current)
        activeZone.current = null
        start.current = null
        setDrag(null)
      }}
    >
      {children}
    </button>
  )
}
