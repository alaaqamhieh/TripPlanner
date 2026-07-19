import type { ReactNode } from 'react'
import type { ChoiceOption } from '../questionnaire/steps'

// Shared building blocks for questionnaire screens: the framed step layout,
// single-choice option cards (auto-advance), and multi-select option cards.

export function StepFrame({
  kicker,
  title,
  sub,
  children,
}: {
  kicker: string
  title: string
  sub?: string
  children: ReactNode
}) {
  return (
    <div className="quiz-step">
      <p className="quiz-kicker">{kicker}</p>
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
  return (
    <div className="opt-grid">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          className={`opt-card${value === opt.value ? ' on' : ''}`}
          onClick={() => onPick(opt.value)}
        >
          <span className="opt-emoji">{opt.emoji}</span>
          <span className="opt-body">
            <span className="opt-label">{opt.label}</span>
            {opt.hint && <span className="opt-hint">{opt.hint}</span>}
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
  compact,
}: {
  options: ChoiceOption[]
  values: string[]
  onToggle: (value: string) => void
  compact?: boolean
}) {
  return (
    <div className={`opt-grid${compact ? ' compact' : ''}`}>
      {options.map((opt) => {
        const on = values.includes(opt.value)
        return (
          <button key={opt.value} className={`opt-card${on ? ' on' : ''}`} onClick={() => onToggle(opt.value)}>
            <span className="opt-emoji">{opt.emoji}</span>
            <span className="opt-body">
              <span className="opt-label">{opt.label}</span>
              {opt.hint && <span className="opt-hint">{opt.hint}</span>}
            </span>
            <span className="opt-level">{on ? '✓' : ''}</span>
          </button>
        )
      })}
    </div>
  )
}
