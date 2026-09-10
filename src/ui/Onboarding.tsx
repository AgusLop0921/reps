import { copy } from './copy'

/** Monochrome inline icons for the account choices — no icon library, all in currentColor. */
function GoogleIcon() {
  return (
    <svg className="onboarding-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 10.2v3.9h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5 0-.7-.1-1.4-.2-2.1H12z" />
      <path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.3-2.6c-.9.6-2 1-3.3 1-2.6 0-4.7-1.7-5.5-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
      <path d="M6.5 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.4-2.6z" />
      <path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 12 2a10 10 0 0 0-8.9 5.5l3.4 2.6c.8-2.4 2.9-4.2 5.5-4.2z" />
    </svg>
  )
}

function DeviceIcon() {
  return (
    <svg
      className="onboarding-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  )
}

/**
 * The one-time first-run account choice. It makes Google the clear sync action while retaining
 * a straightforward local-only path. App records the choice on either action and never renders
 * this screen again.
 */
export function Onboarding({
  onGoogle,
  onSkip,
  isSigningIn,
  notice,
}: {
  onGoogle: () => void
  onSkip: () => void
  isSigningIn: boolean
  notice: string | null
}) {
  return (
    <section className="onboarding">
      <h1 className="onboarding-title">{copy.onboardingTitle}</h1>
      <p className="onboarding-body">{copy.onboardingBody}</p>

      <div className="onboarding-options">
        <button
          type="button"
          className="primary onboarding-google"
          disabled={isSigningIn}
          onClick={onGoogle}
        >
          <GoogleIcon />
          <span>{isSigningIn ? copy.accountSigningIn : copy.googleSignIn}</span>
        </button>
        <button type="button" className="secondary onboarding-option" onClick={onSkip}>
          <DeviceIcon />
          <span>{copy.onboardingSkip}</span>
        </button>
      </div>
      <p className="onboarding-note">{copy.onboardingLater}</p>
      {notice && <p className="onboarding-notice">{notice}</p>}
    </section>
  )
}
