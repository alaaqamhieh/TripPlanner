import { useRef, useState } from 'react'

/**
 * Two-step "click to arm, click again to confirm" pattern for destructive
 * actions. First click arms it (auto-disarms after `timeoutMs` so it doesn't
 * stay dangerous forever); a second click within that window fires `action`.
 */
export function useConfirm(action: () => void, timeoutMs = 3000) {
  const [armed, setArmed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trigger = () => {
    if (armed) {
      if (timer.current) clearTimeout(timer.current)
      setArmed(false)
      action()
      return
    }
    setArmed(true)
    timer.current = setTimeout(() => setArmed(false), timeoutMs)
  }

  return { armed, trigger }
}
