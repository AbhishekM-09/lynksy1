import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  Lock, Eye, EyeOff, Loader2, 
  Mail, Info
} from 'lucide-react'
import { z } from 'zod'
import { toast } from 'react-hot-toast'

import { LoginSchema } from '@/utils/validators'
import { signInWithEmail, signInWithGoogle, getSignInMethods } from '@/firebase/auth'
import { useAuthStore } from '@/store/authStore'
import { checkRateLimit, recordFailedAttempt, clearAttempts } from '@/utils/authHelpers'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { AuthDivider } from '@/components/auth/AuthDivider'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { LogoMark } from '@/components/ui/LogoMark'

type LoginFormData = z.infer<typeof LoginSchema>

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleOnlyHint, setGoogleOnlyHint] = useState(false)
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0)
  
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useAuthStore(s => s.setUser)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema)
  })

  const emailValue = watch('email')
  
  // URL params
  const searchParams = new URLSearchParams(location.search)
  const redirectParam = searchParams.get('redirect')
  const resetSuccess = searchParams.get('resetSuccess')

  useEffect(() => {
    if (resetSuccess) {
      toast.success('Password reset successfully! Please sign in.')
    }
  }, [resetSuccess])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const emailParam = params.get('email')
    if (emailParam) {
      setValue('email', emailParam)
    }
    if (params.get('link') === 'google') {
      sessionStorage.setItem('pending_google_link', 'true')
      setError('An account with this email already exists with a password. Please sign in to link your Google account.')
    }
  }, [location.search, setValue])

  // Rate limit countdown
  useEffect(() => {
    if (rateLimitSeconds <= 0) return
    const timer = setInterval(() => {
      setRateLimitSeconds(s => {
        if (s <= 1) { clearInterval(timer); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [rateLimitSeconds])

  async function handleEmailBlur() {
    if (!emailValue || !emailValue.includes('@')) return
    const methods = await getSignInMethods(emailValue)
    if (methods.length > 0 && !methods.includes('password') && methods.includes('google.com')) {
      setGoogleOnlyHint(true)
    } else {
      setGoogleOnlyHint(false)
    }
  }

  const onSubmit = async (data: LoginFormData) => {
    const { locked, remainingSeconds } = checkRateLimit(data.email)
    if (locked) {
      setRateLimitSeconds(remainingSeconds)
      setError(`Too many failed attempts. Try again in ${remainingSeconds} seconds.`)
      return
    }

    setLoading(true)
    setError('')

    const result = await signInWithEmail(data.email, data.password)

    if (!result.success) {
      const stats = recordFailedAttempt(data.email)
      if (stats.locked) {
         setRateLimitSeconds(stats.remainingSeconds)
      }
      setError(result.error || 'Login failed')
      setLoading(false)
      return
    }

    clearAttempts()

    let finalUser = result.user!
    const isPendingLink = searchParams.get('link') === 'google' || sessionStorage.getItem('pending_google_link') === 'true'
    if (isPendingLink) {
      toast.loading('Linking Google account...', { id: 'link-google' })
      const linkRes = await linkGoogleToAccount()
      toast.dismiss('link-google')
      if (linkRes.success) {
        toast.success('Successfully linked Google account! You can now use Google or password to sign in.', { icon: '🔗', duration: 5000 })
        sessionStorage.removeItem('pending_google_link')
        
        try {
          const { doc, getDoc } = await import('firebase/firestore')
          const { db } = await import('@/firebase/config')
          const freshDoc = await getDoc(doc(db, 'users', finalUser.uid))
          if (freshDoc.exists()) {
            finalUser = freshDoc.data() as typeof finalUser
          }
        } catch (e) {
          console.error('Failed to reload fresh linked user doc:', e)
        }
      } else {
        toast.error(linkRes.error || 'Failed to automatically link Google. You can link it later in Settings.')
      }
    }

    setUser(finalUser)

    if (!finalUser.onboardingDone) {
      navigate('/onboarding')
    } else {
      for (const key of Array.from(searchParams.keys())) {
        if (key !== 'redirect' && key !== 'email' && key !== 'link') {
          // preserve custom params
        }
      }
      navigate(redirectParam || '/dashboard')
    }
  }

  async function handleGoogleLogin() {
    setError('')
    const result = await signInWithGoogle()

    if (!result.success) {
      if (result.error === 'account-exists-with-different-credential') {
        setError('An account with this email already exists using Email & Password. Please enter your password below to associate Google sign-in.')
        if (result.email) {
          setValue('email', result.email)
          sessionStorage.setItem('pending_google_link', 'true')
        }
      } else if (result.error) {
        setError(result.error)
      }
      return
    }

    if (result.linkedAccounts) {
      toast.success('Accounts linked! You can now use Google or email to sign in.', { icon: '🔗' })
    }

    setUser(result.user!)

    if (result.isNewUser || !result.user!.onboardingDone) {
      navigate('/onboarding')
    } else {
      navigate(redirectParam || '/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4 sm:p-8">
      <div className="w-full max-w-[420px] bg-white p-8 sm:p-10 rounded-[32px] border border-[#E2DAD0]/60 shadow-xl shadow-orange/2 relative overflow-hidden">
        {/* Subtle orange glow */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top,rgba(255,107,0,0.04),transparent_50%)] pointer-events-none" />

        <div className="relative z-10">
          <div className="mb-8 text-center flex flex-col items-center">
            <Link to="/" className="inline-flex items-center gap-1.5 px-3 py-1 bg-cream-2 border border-[#E2DAD0]/60 rounded-full mb-4 group hover:scale-[1.02] transition-all">
              <div className="w-4 h-4 flex items-center justify-center group-hover:scale-[1.08] transition-transform shrink-0">
                <LogoMark size="100%" />
              </div>
              <span className="text-xs font-black font-syne tracking-tight text-ink">Lynksy<span className="text-orange">.</span></span>
            </Link>
            <h3 className="text-3xl font-black text-ink mb-2 font-syne tracking-tight">Sign In</h3>
            <p className="text-muted text-sm font-medium">to your creator account</p>
          </div>

          {/* Social login */}
          <GoogleButton onClick={handleGoogleLogin} />

          <AuthDivider text="or sign in with email" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Email or Username</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                  type="text" 
                  autoComplete="email"
                  className="w-full h-12 bg-white border-[#E2DAD0] border-[1.5px] rounded-xl pl-12 pr-4 text-sm font-medium focus:border-orange focus:ring-1 focus:ring-orange/20 outline-none transition-all placeholder:text-muted/60" 
                  placeholder="Enter email or username"
                  {...register('email', { onBlur: handleEmailBlur })}
                />
              </div>
              {errors.email && <p className="text-red-500 text-[10px] font-black mt-1 uppercase tracking-widest ml-1">{errors.email.message as string}</p>}
              
              {googleOnlyHint && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl mt-2 animate-fade-in">
                  <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700 font-bold leading-tight uppercase tracking-tight">
                    This account uses Google sign-in. Click the Google button above.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Password</label>
                <Link 
                  to="/forgot-password" 
                  className="text-[10px] font-black text-orange hover:text-orange-600 uppercase tracking-widest transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  autoComplete="current-password"
                  className="w-full h-12 bg-white border-[#E2DAD0] border-[1.5px] rounded-xl pl-12 pr-12 text-sm font-medium focus:border-orange focus:ring-1 focus:ring-orange/20 outline-none transition-all" 
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-[10px] font-black mt-1 uppercase tracking-widest ml-1">{errors.password.message as string}</p>}
            </div>

            {rateLimitSeconds > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-center">
                 <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-[10px]">
                   {rateLimitSeconds}s
                 </div>
                 <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider">
                   Too many attempts. Lockout active.
                 </p>
              </div>
            )}

            <button 
              disabled={loading || rateLimitSeconds > 0} 
              className="btn-primary w-full h-12 gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange to-red-500 opacity-0 group-hover:opacity-10 transition-opacity" />
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in →
                </>
              )}
            </button>

            <AuthAlert message={error} onDismiss={() => setError('')} />
          </form>

          <div className="mt-8 pt-8 border-t border-[#E2DAD0] flex flex-col items-center gap-4">
             <p className="text-xs font-medium text-muted">
               New here? <Link to="/signup" className="text-orange font-bold hover:underline">Create account for free →</Link>
             </p>
             <div className="flex items-center gap-6">
                <Link to="/privacy-policy" className="text-[10px] font-black text-muted/60 hover:text-ink uppercase tracking-widest transition-colors">Privacy</Link>
                <Link to="/terms-conditions" className="text-[10px] font-black text-muted/60 hover:text-ink uppercase tracking-widest transition-colors">Terms</Link>
                <Link to="/legal" className="text-[10px] font-black text-muted/60 hover:text-ink uppercase tracking-widest transition-colors">Legal</Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
