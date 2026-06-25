// Client-side rate limiting for auth attempts
// Uses localStorage — NOT a substitute for server-side rate limiting
// Firebase has its own server-side rate limiting too

const ATTEMPT_KEY = 'lk_auth_attempts'
const LOCKOUT_KEY = 'lk_auth_lockout'
const MAX_ATTEMPTS   = 5
const LOCKOUT_MS     = 30 * 1000  // 30 seconds

interface AttemptState {
  count: number
  firstAttemptAt: number
  email: string
}

export function recordFailedAttempt(email: string): {
  locked: boolean
  remainingSeconds: number
  attemptsLeft: number
} {
  const now = Date.now()
  const stored = localStorage.getItem(ATTEMPT_KEY)
  let state: AttemptState = stored
    ? JSON.parse(stored)
    : { count: 0, firstAttemptAt: now, email }

  // Reset if different email or window expired (5 min)
  if (state.email !== email || now - state.firstAttemptAt > 5 * 60 * 1000) {
    state = { count: 0, firstAttemptAt: now, email }
  }

  state.count++
  localStorage.setItem(ATTEMPT_KEY, JSON.stringify(state))

  if (state.count >= MAX_ATTEMPTS) {
    const lockoutUntil = now + LOCKOUT_MS
    localStorage.setItem(LOCKOUT_KEY, String(lockoutUntil))
    return { locked: true, remainingSeconds: LOCKOUT_MS / 1000, attemptsLeft: 0 }
  }

  return {
    locked:           false,
    remainingSeconds: 0,
    attemptsLeft:     MAX_ATTEMPTS - state.count,
  }
}

export function checkRateLimit(email: string): {
  locked: boolean
  remainingSeconds: number
} {
  // Avoid unused parameter warning
  if (email) {
    // future expand: rate limit by email
  }
  const lockoutUntil = localStorage.getItem(LOCKOUT_KEY)
  if (!lockoutUntil) return { locked: false, remainingSeconds: 0 }

  const until = parseInt(lockoutUntil)
  const now   = Date.now()

  if (now < until) {
    return { locked: true, remainingSeconds: Math.ceil((until - now) / 1000) }
  }

  // Lockout expired
  localStorage.removeItem(LOCKOUT_KEY)
  localStorage.removeItem(ATTEMPT_KEY)
  return { locked: false, remainingSeconds: 0 }
}

export function clearAttempts() {
  localStorage.removeItem(ATTEMPT_KEY)
  localStorage.removeItem(LOCKOUT_KEY)
}

// Password strength checker
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  label: 'Too weak' | 'Weak' | 'Fair' | 'Good' | 'Strong'
  color: string
  suggestions: string[]
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = []
  let score = 0

  if (password.length >= 6)  score++
  else suggestions.push('Use at least 6 characters')

  if (/[A-Z]/.test(password)) score++
  else suggestions.push('Add an uppercase letter')

  if (/[0-9]/.test(password)) score++
  else suggestions.push('Add a number')

  if (password.length >= 12 && /[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) score++
  else if (score === 3) suggestions.push('Add a special character for maximum strength')

  const levels = [
    { label: 'Too weak', color: '#EF4444' },
    { label: 'Weak',     color: '#F97316' },
    { label: 'Fair',     color: '#EAB308' },
    { label: 'Good',     color: '#22C55E' },
    { label: 'Strong',   color: '#16A34A' },
  ]

  return {
    score: score as 0|1|2|3|4,
    label: levels[score].label as PasswordStrength['label'],
    color: levels[score].color,
    suggestions,
  }
}
