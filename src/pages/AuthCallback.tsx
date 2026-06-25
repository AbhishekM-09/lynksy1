import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/firebase/compat/supabaseClient'
import { syncGoogleUserToFirestore } from '@/firebase/auth'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        console.log('[AuthCallback] Running token sync...')
        
        // Let Supabase process the hash tokens if present and load the session
        const { error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[AuthCallback] Supabase session error:', error)
          setStatus('error')
          setErrorMessage(error.message || 'Failed to sync authentication session.')
          return
        }

        // Wait a slight moment for Supabase internal Auth storage sync
        await new Promise(resolve => setTimeout(resolve, 800))

        // Check if session successfully resolved
        const freshSession = await supabase.auth.getSession()
        const user = freshSession.data.session?.user

        if (user) {
          console.log('[AuthCallback] Session sync successful! User UID:', user.id)
          
          const syncRes = await syncGoogleUserToFirestore(
            user.id,
            user.email || '',
            user.user_metadata?.full_name || user.email?.split('@')[0],
            user.user_metadata?.avatar_url || ''
          )

          const dbUser = syncRes.user
          const isNewUser = syncRes.isNewUser

          // Structure compatible session user
          const compatUser = {
            ...dbUser,
            uid: dbUser.uid,
            email: dbUser.email,
            emailVerified: dbUser.emailVerified,
            displayName: dbUser.displayName,
            photoURL: dbUser.avatarUrl,
            providerData: [{ providerId: 'google.com', uid: dbUser.uid }]
          }

          localStorage.setItem('lynksy_current_user', JSON.stringify(compatUser))
          
          // Dispatch a custom storage event to notify other tabs instantly
          window.dispatchEvent(new Event('storage'))

          const path = (isNewUser || !dbUser.onboardingDone) ? '/onboarding' : '/dashboard'

          // Send message to parent tab/opener with user and session details
          if (window.opener) {
            try {
              window.opener.postMessage({ 
                type: 'oauth_complete',
                user: user,
                session: freshSession.data.session
              }, '*')
              console.log('[AuthCallback] Posted message to opener successfully with user payload')
            } catch (postErr) {
              console.warn('[AuthCallback] PostMessage to opener blocked/failed:', postErr)
            }
          }

          // Immediately redirect or close popup
          if (window.opener) {
            try {
              window.close()
            } catch {
              navigate(path)
            }
          } else {
            navigate(path)
          }
          return
        } else {
          // If no user found, maybe it takes a little longer, let's poll once
          let attempt = 0
          const poll = setInterval(async () => {
            attempt++
            const current = await supabase.auth.getSession()
            const u = current.data.session?.user
            if (u) {
              clearInterval(poll)
              
              const syncRes = await syncGoogleUserToFirestore(
                u.id,
                u.email || '',
                u.user_metadata?.full_name || u.email?.split('@')[0],
                u.user_metadata?.avatar_url || ''
              )

              const dbUser = syncRes.user
              const isNewUser = syncRes.isNewUser

              const compatUser = {
                ...dbUser,
                uid: dbUser.uid,
                email: dbUser.email,
                emailVerified: dbUser.emailVerified,
                displayName: dbUser.displayName,
                photoURL: dbUser.avatarUrl,
                providerData: [{ providerId: 'google.com', uid: dbUser.uid }]
              }

              localStorage.setItem('lynksy_current_user', JSON.stringify(compatUser))
              window.dispatchEvent(new Event('storage'))

              const path = (isNewUser || !dbUser.onboardingDone) ? '/onboarding' : '/dashboard'

              if (window.opener) {
                try {
                  window.opener.postMessage({ 
                    type: 'oauth_complete',
                    user: u,
                    session: current.data.session
                  }, '*')
                } catch {}
              }
              
              // Immediately redirect or close popup
              if (window.opener) {
                try {
                  window.close()
                } catch {
                  navigate(path)
                }
              } else {
                navigate(path)
              }
              return
            } else if (attempt >= 5) {
              clearInterval(poll)
              console.error('[AuthCallback] No session resolved after polling.')
              setStatus('error')
              setErrorMessage('No valid session was established. Please log in again.')
            }
          }, 500)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        console.error('[AuthCallback] Exception during callback:', err)
        setStatus('error')
        setErrorMessage(errorMsg || 'An unexpected error occurred during token extraction.')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4 sm:p-8 text-center font-sans">
      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-orange animate-spin" />
          <p className="text-sm font-medium text-muted">Securing connection...</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-ink">Redirecting...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="w-full max-w-md bg-white border border-[#E2DAD0]/60 rounded-[32px] p-8 sm:p-10 shadow-xl shadow-orange/2 text-center relative overflow-hidden">
          {/* Subtle orange glow */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.04),transparent_50%)] pointer-events-none" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                <span className="text-2xl font-bold">!</span>
              </div>
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-ink">Sign-in Failed</h2>
              <p className="text-sm text-ink/70 max-w-sm mx-auto">
                {errorMessage || 'There was an issue linking your Google identity securely.'}
              </p>
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full py-3.5 px-6 bg-ink hover:bg-orange text-white hover:text-white transition-colors rounded-xl font-bold text-sm cursor-pointer"
              >
                Back to Sign-in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
