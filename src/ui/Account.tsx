import { copy } from './copy'
import { UserAvatar } from './AccountControl'
import type { AuthProfile } from './authProfile'
import repsIcon from './reps-icon.svg'

function GoogleIcon() {
  return (
    <svg className="account-google-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 10.2v3.9h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.5 0-.7-.1-1.4-.2-2.1H12z" />
      <path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.3-2.6c-.9.6-2 1-3.3 1-2.6 0-4.7-1.7-5.5-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
      <path d="M6.5 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.4-2.6z" />
      <path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 12 2a10 10 0 0 0-8.9 5.5l3.4 2.6z" />
    </svg>
  )
}

export function Account({
  email,
  profile,
  notice,
  isSigningIn,
  onGoogleSignIn,
  onSignOut,
  onDeleteAccount,
  onBack,
}: {
  email: string | null
  profile: AuthProfile | null
  notice: string | null
  isSigningIn: boolean
  onGoogleSignIn: () => void
  onSignOut: () => void
  onDeleteAccount: () => void
  onBack: () => void
}) {
  const signedIn = email !== null

  return (
    <section className="account">
      <header className="path-head">
        <button type="button" className="path-home" aria-label={copy.accountBack} onClick={onBack}>
          <img className="path-home-icon" src={repsIcon} alt="" width="30" height="30" />
        </button>
      </header>

      <div className="account-body">
        <p className="account-eyebrow">{copy.accountEyebrow}</p>
        <h1 className="account-title">
          {signedIn ? copy.accountSyncedTitle : copy.accountLocalTitle}
        </h1>
        {signedIn ? (
          <>
            {profile && (
              <div className="account-identity">
                <UserAvatar profile={profile} className="account-avatar" />
                {profile.name && <p className="account-name">{profile.name}</p>}
              </div>
            )}
            <p className="account-status">
              <span className="account-status-dot" aria-hidden="true" />
              {copy.accountSyncedStatus}
            </p>
            <p className="account-email">{email}</p>
          </>
        ) : (
          <>
            <p className="account-body-copy">{copy.accountLocalBody}</p>
            <button
              type="button"
              className="primary account-google"
              disabled={isSigningIn}
              onClick={onGoogleSignIn}
            >
              <GoogleIcon />
              <span>{isSigningIn ? copy.accountSigningIn : copy.googleSignIn}</span>
            </button>
          </>
        )}

        {notice && <p className="account-notice">{notice}</p>}
        <p className="account-privacy">{copy.syncPrivacy}</p>

        {signedIn && (
          <div className="account-actions">
            <button type="button" className="secondary" onClick={onSignOut}>
              {copy.signOut}
            </button>
            <button type="button" className="tertiary account-delete" onClick={onDeleteAccount}>
              {copy.deleteAccount}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
