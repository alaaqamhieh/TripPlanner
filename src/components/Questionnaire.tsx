import { useMemo, useState } from 'react'
import { addDaysIso, todayIso } from '../dateUtils'
import { burstConfetti } from '../confetti'
import { buildTemplatePool } from '../engine/ideaTemplates'
import { rankRecommendations } from '../engine/recommend'
import { scaffoldItinerary } from '../engine/scaffold'
import { signatureSpotsFor } from '../engine/signatureSpots'
import { placesAvailable } from '../placeSearch'
import { createTripId } from '../storage'
import { dedupePool } from '../tripUtils'
import {
  BUDGET_OPTIONS,
  DESTINATION_SUGGESTIONS,
  DIET_OPTIONS,
  FOOD_OPTIONS,
  MUST_HAVE_TAGS,
  PACE_OPTIONS,
  PARTY_OPTIONS,
  RAPID_FIRE_CARDS,
  RHYTHM_OPTIONS,
  STEP_ORDER,
  STYLE_OPTIONS,
  type StepId,
} from '../questionnaire/steps'
import {
  defaultProfile,
  type InterestId,
  type InterestLevel,
  type TravelerProfile,
  type TripState,
} from '../types'
import { MultiChoice, SingleChoice, StepFrame } from './QuestionStep'
import RapidFire from './RapidFire'

// ---------------------------------------------------------------------------
// The trip questionnaire: a short, personal conversation — every step
// skippable, answers compiled into a TravelerProfile that drives the
// recommendation pool and the starter itinerary.
// ---------------------------------------------------------------------------

type Draft = Partial<TravelerProfile> & { startDate?: string; endDate?: string }

function guessEmoji(destination: string): string {
  const d = destination.toLowerCase()
  const suggestion = DESTINATION_SUGGESTIONS.find((s) => d && s.label.toLowerCase().includes(d.split(',')[0].trim()))
  if (suggestion) return suggestion.emoji
  if (/beach|island|bali|maldiv|hawaii|coast/.test(d)) return '🏝️'
  if (/mountain|alps|swiss|nepal/.test(d)) return '🏔️'
  if (/paris|london|rome|york|tokyo|city/.test(d)) return '🌆'
  return '🌍'
}

const BUILD_LINES = [
  'Reading your answers…',
  'Matching ideas to your style…',
  'Sketching your days…',
  'Packing your suggestions',
]

export default function Questionnaire({
  retakeTrip,
  onDone,
  onQuit,
}: {
  retakeTrip: TripState | null
  onDone: (trip: TripState) => void
  onQuit: () => void
}) {
  const [stepIdx, setStepIdx] = useState(0)
  const [draft, setDraft] = useState<Draft>(() =>
    retakeTrip
      ? { ...retakeTrip.profile, startDate: retakeTrip.meta.startDate, endDate: retakeTrip.meta.endDate }
      : {},
  )
  const [rfAnswered, setRfAnswered] = useState(0)
  const [building, setBuilding] = useState(false)
  const [retakeChoice, setRetakeChoice] = useState(false)

  const stepId: StepId = STEP_ORDER[stepIdx]
  const hasKids = draft.hasKids ?? (draft.party === 'family' || draft.party === 'multigen')
  const rfCards = useMemo(() => RAPID_FIRE_CARDS.filter((c) => !c.kidsOnly || hasKids), [hasKids])

  const progress =
    ((stepIdx + (stepId === 'interests' && rfCards.length ? rfAnswered / rfCards.length : 0)) / STEP_ORDER.length) * 100

  const set = (patch: Draft) => setDraft((prev) => ({ ...prev, ...patch }))

  const advance = () => {
    if (stepIdx + 1 >= STEP_ORDER.length) {
      if (retakeTrip) setRetakeChoice(true)
      else finish(true)
    } else {
      setStepIdx(stepIdx + 1)
    }
  }

  /** Single-choice steps pop, then advance after a beat so the selection reads. */
  const pickAndAdvance = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    set({ [key]: value } as Draft)
    setTimeout(advance, 280)
  }

  const back = () => {
    if (retakeChoice) setRetakeChoice(false)
    else if (stepIdx > 0) setStepIdx(stepIdx - 1)
    else onQuit()
  }

  const buildTrip = (scaffold: boolean, completed: boolean): TripState => {
    const start = draft.startDate || addDaysIso(todayIso(), 30)
    let end = draft.endDate || addDaysIso(start, 4)
    if (end < start) end = start

    const profile: TravelerProfile = {
      ...defaultProfile(),
      ...draft,
      destination: (draft.destination ?? '').trim(),
      hasKids,
      completedAt: completed ? new Date().toISOString() : undefined,
    }

    const city = profile.destination.split(',')[0].trim()
    const signature = signatureSpotsFor(profile.destination)
    // With a Places key we research real, named spots for the trip (see App's
    // guide + live-places), so we don't seed generic "idea" templates at all.
    // Without a key, templates are the offline fallback so the list isn't empty.
    const templates = placesAvailable() ? [] : buildTemplatePool(profile.destination, profile.foodAdventure)
    // Retakes keep everything the traveler added or imported (places, ai,
    // custom); only the curated signature + generic template ideas are rebuilt
    // for the (possibly new) destination/preferences.
    const kept = retakeTrip ? retakeTrip.pool.filter((r) => r.source !== 'template' && r.source !== 'signature') : []
    const pool = dedupePool([...signature, ...kept, ...templates])

    const meta = retakeTrip
      ? {
          ...retakeTrip.meta,
          destination: profile.destination || retakeTrip.meta.destination,
          name: city || retakeTrip.meta.name,
          emoji: profile.destination ? guessEmoji(profile.destination) : retakeTrip.meta.emoji,
          startDate: start,
          endDate: end,
        }
      : {
          id: createTripId(),
          name: city || 'My trip',
          destination: profile.destination,
          emoji: guessEmoji(profile.destination),
          startDate: start,
          endDate: end,
          createdAt: new Date().toISOString(),
        }

    const ranked = rankRecommendations(pool, profile, [], new Set())
    const scheduled = scaffold ? scaffoldItinerary(profile, meta, ranked) : (retakeTrip?.scheduled ?? [])

    return {
      version: retakeTrip?.version ?? 1,
      meta,
      profile,
      pool,
      dismissed: retakeTrip?.dismissed ?? [],
      shortlist: retakeTrip?.shortlist ?? [],
      swiped: retakeTrip?.swiped ?? [],
      scheduled,
      scaffolded: scaffold || (retakeTrip?.scaffolded ?? false),
    }
  }

  const finish = (scaffold: boolean, completed = true) => {
    const trip = buildTrip(scaffold, completed)
    setBuilding(true)
    setTimeout(() => {
      burstConfetti(window.innerWidth / 2, window.innerHeight / 3, 36)
      onDone(trip)
    }, 1900)
  }

  if (building) {
    return (
      <div className="quiz">
        <div className="quiz-build">
          <div className="quiz-build-spinner" aria-hidden="true" />
          <h2 className="quiz-title">Building your trip</h2>
          <div className="quiz-build-lines">
            {BUILD_LINES.map((line, i) => (
              <span key={line} style={{ animationDelay: `${i * 0.42}s` }}>
                {line}
              </span>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (retakeChoice) {
    return (
      <div className="quiz">
        <QuizTop progress={100} onBack={back} onQuit={onQuit} />
        <StepFrame kicker="One last thing" title="Your plan — rebuild it or keep it?" sub="Your suggestions will refresh either way. Your custom additions are always kept.">
          <div className="opt-grid">
            <button className="opt-card" onClick={() => finish(true)}>
              <span className="opt-key" aria-hidden="true">A</span>
              <span className="opt-body">
                <span className="opt-label">Rebuild my day-by-day plan</span>
                <span className="opt-hint">Start fresh from my new answers (replaces the current plan)</span>
              </span>
            </button>
            <button className="opt-card" onClick={() => finish(false)}>
              <span className="opt-key" aria-hidden="true">B</span>
              <span className="opt-body">
                <span className="opt-label">Keep my itinerary</span>
                <span className="opt-hint">Just refresh the suggestions to match my new answers</span>
              </span>
            </button>
          </div>
        </StepFrame>
      </div>
    )
  }

  return (
    <div className="quiz">
      <QuizTop progress={progress} onBack={back} onQuit={onQuit} />

      {stepId === 'destination' && (
        <StepFrame number={stepIdx + 1} title="Where are you dreaming of going?" sub="City, country, island — anywhere.">
          <input
            className="quiz-input"
            autoFocus
            placeholder="e.g. Lisbon, Portugal"
            value={draft.destination ?? ''}
            onChange={(e) => set({ destination: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && advance()}
          />
          <div className="chip-row">
            {DESTINATION_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                className={`chip${draft.destination === s.label ? ' on' : ''}`}
                onClick={() => set({ destination: s.label })}
              >
                {s.label.split(',')[0]}
              </button>
            ))}
          </div>
          <StepNav onSkip={advance} nextLabel="Next →" onNext={advance} nextDisabled={!(draft.destination ?? '').trim()} />
        </StepFrame>
      )}

      {stepId === 'dates' && (
        <StepFrame number={stepIdx + 1} title="When's the getaway?" sub="Not sure yet? Skip it — we'll pencil in a 5-day trip next month you can change anytime.">
          <div className="quiz-dates">
            <div className="field">
              <label htmlFor="q-start">First day</label>
              <input
                id="q-start"
                type="date"
                value={draft.startDate ?? ''}
                onChange={(e) => set({ startDate: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="q-end">Last day</label>
              <input
                id="q-end"
                type="date"
                min={draft.startDate}
                value={draft.endDate ?? ''}
                onChange={(e) => set({ endDate: e.target.value })}
              />
            </div>
          </div>
          <StepNav onSkip={advance} nextLabel="Next →" onNext={advance} nextDisabled={!draft.startDate || !draft.endDate} />
        </StepFrame>
      )}

      {stepId === 'party' && (
        <StepFrame number={stepIdx + 1} title="Who's coming with you?">
          <SingleChoice
            options={PARTY_OPTIONS}
            value={draft.party}
            onPick={(v) => {
              set({ party: v, hasKids: v === 'family' || v === 'multigen' })
              setTimeout(advance, 280)
            }}
          />
          <StepNav onSkip={advance} />
        </StepFrame>
      )}

      {stepId === 'budget' && (
        <StepFrame number={stepIdx + 1} title="How do you feel about spending on this trip?">
          <SingleChoice options={BUDGET_OPTIONS} value={draft.budget} onPick={(v) => pickAndAdvance('budget', v)} />
          <StepNav onSkip={advance} />
        </StepFrame>
      )}

      {stepId === 'pace' && (
        <StepFrame number={stepIdx + 1} title="Be honest — what does your perfect trip day look like?">
          <SingleChoice options={PACE_OPTIONS} value={draft.pace} onPick={(v) => pickAndAdvance('pace', v)} />
          <StepNav onSkip={advance} />
        </StepFrame>
      )}

      {stepId === 'interests' && (
        <StepFrame
          kicker="Quick round"
          title="Is this you?"
          sub="Gut answers only — the deck below counts itself. This is how we learn what your trip should feel like."
        >
          <RapidFire
            cards={rfCards}
            initial={draft.interests ?? {}}
            onProgress={setRfAnswered}
            onDone={(interests: Partial<Record<InterestId, InterestLevel>>) => {
              set({ interests })
              setTimeout(advance, 250)
            }}
          />
          <StepNav onSkip={advance} skipLabel="Skip the rest of this round →" />
        </StepFrame>
      )}

      {stepId === 'foodAdventure' && (
        <StepFrame number={stepIdx + 1} title="At dinner abroad — who are you?">
          <SingleChoice options={FOOD_OPTIONS} value={draft.foodAdventure} onPick={(v) => pickAndAdvance('foodAdventure', v)} />
          <StepNav onSkip={advance} />
        </StepFrame>
      )}

      {stepId === 'diet' && (
        <StepFrame number={stepIdx + 1} title="Anything the food plans must respect?" sub="Pick all that apply — or skip if you eat everything.">
          <MultiChoice
            compact
            options={DIET_OPTIONS}
            values={draft.diet ?? []}
            onEnter={advance}
            onToggle={(v) => {
              const need = v as (typeof DIET_OPTIONS)[number]['value']
              const current = draft.diet ?? []
              set({ diet: current.includes(need) ? current.filter((d) => d !== need) : [...current, need] })
            }}
          />
          <StepNav onSkip={advance} nextLabel="Next →" onNext={advance} />
        </StepFrame>
      )}

      {stepId === 'mustHaves' && (
        <StepFrame
          number={stepIdx + 1}
          title="What would you be sad to fly home without doing?"
          sub="Pick your non-negotiables — they get priority in your plan."
        >
          <MultiChoice
            compact
            options={MUST_HAVE_TAGS}
            values={draft.mustHaves ?? []}
            onEnter={advance}
            onToggle={(v) =>
              set({
                mustHaves: (draft.mustHaves ?? []).includes(v)
                  ? (draft.mustHaves ?? []).filter((m) => m !== v)
                  : [...(draft.mustHaves ?? []), v],
              })
            }
          />
          <StepNav onSkip={advance} nextLabel="Next →" onNext={advance} />
        </StepFrame>
      )}

      {stepId === 'style' && (
        <StepFrame number={stepIdx + 1} title="How do you like your plans?">
          <SingleChoice options={STYLE_OPTIONS} value={draft.style} onPick={(v) => pickAndAdvance('style', v)} />
          <StepNav onSkip={advance} />
        </StepFrame>
      )}

      {stepId === 'rhythm' && (
        <StepFrame number={stepIdx + 1} title="Sunrise or 2am — when are you at your best?">
          <SingleChoice options={RHYTHM_OPTIONS} value={draft.rhythm} onPick={(v) => pickAndAdvance('rhythm', v)} />
          <StepNav onSkip={advance} skipLabel="Skip →" />
        </StepFrame>
      )}

      {!retakeTrip && (
        <p className="search-hint" style={{ textAlign: 'center' }}>
          In a hurry?{' '}
          <button className="quiz-skip" style={{ padding: '2px 6px', textDecoration: 'underline' }} onClick={() => finish(false, false)}>
            Skip the quiz and plan manually
          </button>
        </p>
      )}
    </div>
  )
}

function QuizTop({ progress, onBack, onQuit }: { progress: number; onBack: () => void; onQuit: () => void }) {
  return (
    <>
      <div className="quiz-top">
        <button className="quiz-back" onClick={onBack}>
          ← Back
        </button>
        <button className="quiz-back quiz-quit" onClick={onQuit} aria-label="Exit questionnaire">
          ✕
        </button>
      </div>
      <div
        className="quiz-progress"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </>
  )
}

function StepNav({
  onSkip,
  skipLabel = 'Skip this one →',
  nextLabel,
  onNext,
  nextDisabled,
}: {
  onSkip: () => void
  skipLabel?: string
  nextLabel?: string
  onNext?: () => void
  nextDisabled?: boolean
}) {
  return (
    <div className="quiz-nav">
      {nextLabel && onNext && (
        <span className="quiz-next">
          <button className="btn quiz-ok" onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
          </button>
          {!nextDisabled && (
            <span className="quiz-enter-hint">
              press <kbd>Enter ↵</kbd>
            </span>
          )}
        </span>
      )}
      <button className="quiz-skip" onClick={onSkip}>
        {skipLabel}
      </button>
    </div>
  )
}
