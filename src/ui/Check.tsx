import { useMemo } from 'react'
import type { Check as CheckData } from '../content/schema'
import { orderedOptions } from '../core/checks'
import { copy } from './copy'

/**
 * The generated multiple-choice check (ADR-0017). Options are shown in a seeded order from
 * core (stored order never matters). After answering, all four stay visible — the chosen
 * one and the correct one both marked — so the comparison stays on screen, which is where
 * the learning is. The explanation teaches on both outcomes; a wrong answer is not scolded.
 */
export function Check({
  check,
  reviewCount,
  picked,
  onPick,
}: {
  check: CheckData
  reviewCount: number
  picked: number | null
  onPick: (index: number) => void
}) {
  const options = useMemo(() => orderedOptions(check, reviewCount), [check, reviewCount])
  const answered = picked !== null
  const gotItRight = answered && options[picked].correct

  return (
    <section className="check">
      <p className="check-stem">{check.stem}</p>

      <ul className="options">
        {options.map((option, i) => {
          const state = !answered
            ? 'idle'
            : option.correct
              ? 'correct'
              : i === picked
                ? 'chosen'
                : 'other'
          return (
            <li key={i}>
              <button
                type="button"
                className={`option option-${state}`}
                disabled={answered}
                onClick={() => onPick(i)}
              >
                <span className="option-text">{option.text}</span>
                {answered && option.correct && (
                  <span className="option-mark option-mark-correct">{copy.correctMark}</span>
                )}
                {state === 'chosen' && <span className="option-mark">{copy.yourAnswer}</span>}
              </button>
            </li>
          )
        })}
      </ul>

      {answered && (
        <div className="feedback">
          <p className={`verdict verdict-${gotItRight ? 'right' : 'wrong'}`}>
            {gotItRight ? copy.verdictRight : copy.verdictWrong}
          </p>
          <p className="feedback-explanation">{check.explanation}</p>
        </div>
      )}
    </section>
  )
}
