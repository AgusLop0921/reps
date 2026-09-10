import { useState } from 'react'
import { copy } from './copy'
import type { AuthProfile } from './authProfile'

/** A quiet account affordance for the app's top-level screens. */
export function AccountControl({
  profile,
  onOpen,
}: {
  profile: AuthProfile | null
  onOpen: () => void
}) {
  return (
    <button type="button" className="account-control" aria-label={copy.accountOpen} onClick={onOpen}>
      {profile ? <UserAvatar profile={profile} /> : <AccountIcon />}
    </button>
  )
}

export function UserAvatar({
  profile,
  className = '',
}: {
  profile: AuthProfile
  className?: string
}) {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <span className={`user-avatar ${className}`.trim()} aria-hidden="true">
      {profile.avatarUrl && !imageFailed ? (
        <img src={profile.avatarUrl} alt="" onError={() => setImageFailed(true)} />
      ) : (
        <span className="user-avatar-initials">{profile.initials}</span>
      )}
    </span>
  )
}

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 21c.8-3.4 3.1-5.1 7-5.1s6.2 1.7 7 5.1" strokeLinecap="round" />
    </svg>
  )
}
