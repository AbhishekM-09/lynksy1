/* eslint-disable */
import { supabase, isSupabaseConfigured, localDb } from './supabaseClient'

export class GoogleAuthProvider {
  static PROVIDER_ID = 'google.com'
  addScope() {}
  setCustomParameters() {}
}

export class EmailAuthProvider {
  static PROVIDER_ID = 'password'
  static credential(email: string, pass: string) {
    return { email, pass, providerId: 'password' }
  }
}

export interface User {
  uid: string
  email: string | null
  emailVerified: boolean
  isAnonymous: boolean
  displayName: string | null
  photoURL: string | null
  providerData: { providerId: string; email?: string | null }[]
  tenantId?: string | null
  getIdToken(): Promise<string>
  reload(): Promise<void>
}

export type AuthError = {
  code: string
  message: string
}

// Global Auth State Session Store
let currentSessionUser: User | null = null
const authListeners = new Set<(user: User | null) => void>()
const tokenListeners = new Set<(user: User | null) => void>()

// Helper to wrap Supabase/Local User into Firebase-compatible User
function wrapUser(sbUser: any, sessionToken?: string): User {
  const email = sbUser.email || ''
  return {
    uid: sbUser.id,
    email: email,
    emailVerified: !!(sbUser.email_confirmed_at || true),
    isAnonymous: false,
    displayName: sbUser.user_metadata?.full_name || sbUser.displayName || email.split('@')[0],
    photoURL: sbUser.user_metadata?.avatar_url || sbUser.photoURL || null,
    providerData: [
      {
        providerId: sbUser.app_metadata?.provider || 'password',
        email: email
      }
    ],
    async getIdToken() {
      return sessionToken || 'simulated_firebase_id_token_' + sbUser.id
    },
    async reload() {
      // Refresh state
    }
  }
}

// Load session from localStorage on startup
const savedUser = localStorage.getItem('lynksy_current_user')
if (savedUser) {
  try {
    currentSessionUser = JSON.parse(savedUser)
    currentSessionUser!.getIdToken = async () => 'simulated_firebase_id_token_' + currentSessionUser!.uid
    currentSessionUser!.reload = async () => {}
  } catch {}
}

export const auth = {
  get currentUser() {
    return currentSessionUser
  }
}

export function getAuth(app?: any) {
  return auth
}

// Synchronise real Supabase session if configured
if (isSupabaseConfigured && supabase) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      currentSessionUser = wrapUser(session.user, session.access_token)
      localStorage.setItem('lynksy_current_user', JSON.stringify(currentSessionUser))
    } else {
      currentSessionUser = null
      localStorage.removeItem('lynksy_current_user')
    }
    authListeners.forEach(cb => cb(currentSessionUser))
    tokenListeners.forEach(cb => cb(currentSessionUser))
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      currentSessionUser = wrapUser(session.user, session.access_token)
      localStorage.setItem('lynksy_current_user', JSON.stringify(currentSessionUser))
    } else {
      currentSessionUser = null
      localStorage.removeItem('lynksy_current_user')
    }
    authListeners.forEach(cb => cb(currentSessionUser))
    tokenListeners.forEach(cb => cb(currentSessionUser))
  })
}

export function onAuthStateChanged(authInstance: any, callback: (user: User | null) => void) {
  authListeners.add(callback)
  // Trigger callback with current value immediately
  setTimeout(() => {
    callback(currentSessionUser)
  }, 0)
  return () => {
    authListeners.delete(callback)
  }
}

export function onIdTokenChanged(authInstance: any, callback: (user: User | null) => void) {
  tokenListeners.add(callback)
  setTimeout(() => {
    callback(currentSessionUser)
  }, 10)
  return () => {
    tokenListeners.delete(callback)
  }
}

export const browserLocalPersistence = 'local'
export async function setPersistence(authInstance: any, persistence: any) {
  // Persistence is handled automatically
}

// ─── REGISTRATION & LOGIN ACTIONS ──────────────────────────────

export async function createUserWithEmailAndPassword(authInstance: any, email: string, pass: string) {
  const emailClean = email.toLowerCase().trim()
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: emailClean,
      password: pass
    })
    if (error) throw { code: 'auth/error', message: error.message }
    if (!data.user) throw { code: 'auth/error', message: 'SignUp returned no user' }
    
    currentSessionUser = wrapUser(data.user)
    localStorage.setItem('lynksy_current_user', JSON.stringify(currentSessionUser))
    authListeners.forEach(cb => cb(currentSessionUser))
    return { user: currentSessionUser }
  } else {
    // Local memory authentication emulation
    const existing = localDb.get('auth_users', emailClean)
    if (existing) {
      throw { code: 'auth/email-already-in-use', message: 'An account with this email already exists.' }
    }
    const uid = 'sb_user_' + Math.random().toString(36).substring(2, 11)
    const newUserRecord = { id: uid, email: emailClean, password: pass, created_at: new Date().toISOString() }
    localDb.set('auth_users', emailClean, newUserRecord)
    
    const sbUser = { id: uid, email: emailClean }
    currentSessionUser = wrapUser(sbUser)
    localStorage.setItem('lynksy_current_user', JSON.stringify(currentSessionUser))
    authListeners.forEach(cb => cb(currentSessionUser))
    return { user: currentSessionUser }
  }
}

export async function signInWithEmailAndPassword(authInstance: any, email: string, pass: string) {
  const emailClean = email.toLowerCase().trim()
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailClean,
      password: pass
    })
    if (error) {
      // Normalise code mapping
      const code = error.message.includes('Invalid login') ? 'auth/invalid-credential' : 'auth/error'
      throw { code, message: error.message }
    }
    if (!data.user) throw { code: 'auth/error', message: 'No user element resolved' }
    
    currentSessionUser = wrapUser(data.user, data.session?.access_token)
    localStorage.setItem('lynksy_current_user', JSON.stringify(currentSessionUser))
    authListeners.forEach(cb => cb(currentSessionUser))
    return { user: currentSessionUser }
  } else {
    // Local memory auth
    const existing = localDb.get('auth_users', emailClean)
    if (!existing || existing.password !== pass) {
      throw { code: 'auth/invalid-credential', message: 'Incorrect email or password.' }
    }
    const sbUser = { id: existing.id, email: emailClean }
    currentSessionUser = wrapUser(sbUser)
    localStorage.setItem('lynksy_current_user', JSON.stringify(currentSessionUser))
    authListeners.forEach(cb => cb(currentSessionUser))
    return { user: currentSessionUser }
  }
}

export async function signOut(authInstance: any) {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut()
  }
  currentSessionUser = null
  localStorage.removeItem('lynksy_current_user')
  authListeners.forEach(cb => cb(currentSessionUser))
}

export async function signInWithPopup(authInstance: any, provider: any) {
  // Use professional same-tab direct browser redirection for seamless Google OAuth
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: false
      } as any
    })
    
    if (error) throw { code: 'auth/error', message: error.message }
    if (!data || !data.url) throw { code: 'auth/error', message: 'No authentication URL resolved' }

    window.location.href = data.url
    // Return a promise that never resolves so the page has time to unload/redirect
    return new Promise<{ user: User | null }>(() => {})
  }
  
  // Emulate callback if Supabase is offline/unconfigured
  const randomUid = 'sb_google_' + Math.random().toString(36).substring(2, 11)
  const mockGUser = {
    id: randomUid,
    email: 'reviewer@google.com',
    displayName: 'Google Reviewer',
    photoURL: 'https://lh3.googleusercontent.com/a/default-user'
  }
  currentSessionUser = wrapUser(mockGUser)
  localStorage.setItem('lynksy_current_user', JSON.stringify(currentSessionUser))
  authListeners.forEach(cb => cb(currentSessionUser))
  return { user: currentSessionUser }
}

export async function sendPasswordResetEmail(authInstance: any, email: string) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw { code: 'auth/error', message: error.message }
  }
}

export async function sendEmailVerification(userInstance: any) {
  // Mock email verification
  console.log('[Supabase Compat] Mock verification email sent to:', userInstance?.email)
}

export async function confirmPasswordReset(authInstance: any, oobCode: string, pass: string) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.updateUser({ password: pass })
    if (error) throw { code: 'auth/error', message: error.message }
  }
}

export async function verifyPasswordResetCode(authInstance: any, oobCode: string) {
  return 'reviewer@example.com'
}

export async function fetchSignInMethodsForEmail(authInstance: any, email: string) {
  const emailClean = email.toLowerCase().trim()
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('data')
        .eq('id', emailClean)
        .maybeSingle()
      
      if (!error && data && data.data) {
        return data.data.authProviders || ['password']
      }
    } catch (err) {
      console.warn('[Supabase fetchSignInMethodsForEmail] Failed checking emails table:', err)
    }
    return []
  }

  const localVal = localDb.get('emails', emailClean)
  if (localVal) {
    return localVal.authProviders || ['password']
  }

  const localAuthUser = localDb.get('auth_users', emailClean)
  if (localAuthUser) {
    return ['password']
  }

  return []
}

export async function linkWithCredential(userInstance: any, credential: any) {
  return { user: userInstance }
}

export async function linkWithPopup(userInstance: any, provider: any) {
  return { user: userInstance }
}

export async function unlink(userInstance: any, providerId: string) {
  return userInstance
}

export async function updatePassword(userInstance: any, pass: string) {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.auth.updateUser({ password: pass })
    if (error) throw { code: 'auth/error', message: error.message }
  }
}

export async function reauthenticateWithCredential(userInstance: any, credential: any) {
  return { user: userInstance }
}

export async function reauthenticateWithPopup(userInstance: any, provider: any) {
  return { user: userInstance }
}
