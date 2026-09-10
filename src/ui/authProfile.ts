/** The small, presentation-safe subset of identity data supplied by an OAuth provider. */
export type AuthProfile = {
  name: string | null
  avatarUrl: string | null
  initials: string
}

type AuthUser = {
  email?: string | null
  user_metadata?: unknown
}

function text(metadata: unknown, key: string): string | null {
  if (typeof metadata !== 'object' || metadata === null) return null
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function secureUrl(value: string | null): string | null {
  if (value === null) return null
  try {
    return new URL(value).protocol === 'https:' ? value : null
  } catch {
    return null
  }
}

function initialsFor(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  return (parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : parts[0].slice(0, 2)).toUpperCase()
}

/**
 * Google identity fields are provider metadata, not a Reps profile contract. Normalize the
 * optional display fields once at the auth boundary so the UI never depends on provider keys.
 */
export function profileForUser(user: AuthUser | null): AuthProfile | null {
  if (user === null) return null
  const email = user.email?.trim() || null
  const name = text(user.user_metadata, 'full_name') ?? text(user.user_metadata, 'name')
  const label = name ?? email?.split('@')[0] ?? null

  return {
    name,
    avatarUrl: secureUrl(text(user.user_metadata, 'avatar_url') ?? text(user.user_metadata, 'picture')),
    initials: label ? initialsFor(label) : '?',
  }
}
