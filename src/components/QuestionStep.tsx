import { useEffect, type ReactNode } from 'react'
import type { ChoiceOption } from '../questionnaire/steps'

// Shared building blocks for the (Typeform-style) questionnaire: the framed
// step layout, single-choice option rows (letter-key selectable, auto-advance),
// and multi-select rows. Each row shows an A/B/C key you can press to pick it.

const LETTERS = 'ABCDEFGHIJKLMNOP'
const keyOf = (i: number) => LETTERS[i] ?? ''

/** Don't hijack letter keys while the traveler is typing in a field. */
function typingInField(): boolean {
  const el = document.activeElement as HTMLElement | null
  return Boolean(el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable))
}

export function StepFrame({
  number,
  kicker,
  title,
  sub,
  children,
}: {
  number?: number
  kicker?: string
  title: string
  sub?: string
  children: ReactNode
}) {
  return (
    <div className="quiz-step">
      {number !== undefined ? (
        <p className="quiz-num">
          {number}
          <span className="quiz-num-arrow">→</span>
        </p>
      ) : kicker ? (
        <p className="quiz-kicker">{kicker}</p>
      ) : null}
      <h2 className="quiz-title">{title}</h2>
      {sub && <p className="quiz-sub">{sub}</p>}
      {children}
    </div>
  )
}

export function SingleChoice<V extends string | number>({
  options,
  value,
  onPick,
}: {
  options: ChoiceOption<V>[]
  value: V | undefined
  onPick: (value: V) => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typingInField()) return
      const i = LETTERS.indexOf(e.key.toUpperCase())
      if (i >= 0 && i < options.length) {
        e.preventDefault()
        onPick(options[i].value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [options, onPick])

  return (
    <div className="opt-grid">
      {options.map((opt, i) => (
        <button
          key={String(opt.value)}
          className={`opt-card${value === opt.value ? ' on' : ''}`}
          onClick={() => onPick(opt.value)}
        >
          <span className="opt-key" aria-hidden="true">{keyOf(i)}</span>
          <span className="opt-body">
            <span className="opt-label">{opt.label}</span>
            {opt.hint && <span className="opt-hint">{opt.hint}</span>}
          </span>
          <span className="opt-check" aria-hidden="true">
            {value === opt.value ? '✓' : ''}
          </span>
        </button>
      ))}
    </div>
  )
}

export function MultiChoice({
  options,
  values,
  onToggle,
  onEnter,
  compact,
}: {
  options: ChoiceOption[]
  values: string[]
  onToggle: (value: string) => void
  onEnter?: () => void
  compact?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || typingInField()) return
      if (e.key === 'Enter') {
        if (onEnter) {
          e.preventDefault()
          onEnter()
        }
        return
      }
      const i = LETTERS.indexOf(e.key.toUpperCase())
      if (i >= 0 && i < options.length) {
        e.preventDefault()
        onToggle(options[i].value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [options, onToggle, onEnter])

  return (
    <div className={`opt-grid${compact ? ' compact' : ''}`}>
      {options.map((opt, i) => {
        const on = values.includes(opt.value)
        return (
          <button key={opt.value} className={`opt-card${on ? ' on' : ''}`} onClick={() => onToggle(opt.value)}>
            <span className="opt-key" aria-hidden="true">{keyOf(i)}</span>
            <span className="opt-body">
              <span className="opt-label">{opt.label}</span>
              {opt.hint && <span className="opt-hint">{opt.hint}</span>}
            </span>
            <span className="opt-check" aria-hidden="true">{on ? '✓' : ''}</span>
          </button>
        )
      })}
    </div>
  )
}
