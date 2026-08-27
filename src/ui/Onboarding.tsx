import { useState } from 'react'
import { copy } from './copy'

/**
 * The one-time first-run account choice (ADR-0021). Three options of equal weight, an honest
 * symmetric framing, and no default or "recomendado". Shown once, ever: App records the
 * choice on any of these actions and never renders this screen again. Google and "no account"
 * resolve immediately; email swaps to an inline step and then a "check your inbox" note.
 */
export function Onboarding({
  onGoogle,
  onEmail,
  onContinue,
  onSkip,
}: {
  onGoogle: () => void
  onEmail: (email: string) => void
  onContinue: () => void
  onSkip: () => void
}) {
  const [mode, setMode] = useState<'choices' | 'email'>('choices')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const submit = (event: React.FormEvent): void => {
    event.preventDefault()
    if (!email.trim()) return
    onEmail(email.trim())
    setSent(true)
  }

  return (
    <section className="onboarding">
      <h1 className="onboarding-title">{copy.onboardingTitle}</h1>
      <p className="onboarding-body">{copy.onboardingBody}</p>

      {mode === 'choices' && (
        <div className="onboarding-options">
          <button type="button" className="onboarding-option" onClick={onGoogle}>
            {copy.googleSignIn}
          </button>
          <button type="button" className="onboarding-option" onClick={() => setMode('email')}>
            {copy.onboardingEmail}
          </button>
          <button type="button" className="onboarding-option" onClick={onSkip}>
            {copy.onboardingSkip}
          </button>
        </div>
      )}

      {mode === 'email' && !sent && (
        <form className="onboarding-options" onSubmit={submit}>
          <input
            type="email"
            required
            className="path-email"
            placeholder={copy.syncEmailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button type="submit" className="onboarding-option">
            {copy.syncSend}
          </button>
          <button type="button" className="onboarding-back" onClick={() => setMode('choices')}>
            {copy.onboardingBack}
          </button>
        </form>
      )}

      {mode === 'email' && sent && (
        <div className="onboarding-options">
          <p className="onboarding-body">{copy.syncCheckEmail}</p>
          <button type="button" className="onboarding-option" onClick={onContinue}>
            {copy.onboardingStart}
          </button>
        </div>
      )}
    </section>
  )
}
