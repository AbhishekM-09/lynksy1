import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Eye, EyeOff, Loader2, CheckCircle2, XCircle, 
  ShieldCheck, Mail, User as UserIcon,
  Info
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { z } from 'zod'
import { motion, AnimatePresence } from 'motion/react'
import { toast } from 'react-hot-toast'

import { SignupSchema } from '@/utils/validators'
import { 
  signUpWithEmail, signInWithGoogle, isUsernameTaken, 
  validateUsername, getSignInMethods 
} from '@/firebase/auth'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuthStore } from '@/store/authStore'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { AuthDivider } from '@/components/auth/AuthDivider'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { LogoMark } from '@/components/ui/LogoMark'

type SignupFormData = z.infer<typeof SignupSchema>

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid' | 'reserved'>('idle')
  const [emailConflict, setEmailConflict] = useState<'' | 'password' | 'google'>('')
  
  const navigate = useNavigate()
  const setUser = useAuthStore(s => s.setUser)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    mode: 'onBlur'
  })

  // Watch fields
  const usernameValue = watch('username')
  const emailValue = watch('email')
  const passwordValue = watch('password')

  const debouncedUsername = useDebounce(usernameValue, 500)

  // Username validation & availability
  useEffect(() => {
    if (!debouncedUsername || debouncedUsername.length < 3) {
      setUsernameStatus('idle')
      return
    }
    
    const vError = validateUsername(debouncedUsername)
    if (vError) {
      setUsernameStatus(vError.includes('reserved') ? 'reserved' : 'invalid')
      return
    }

    setUsernameStatus('checking')
    isUsernameTaken(debouncedUsername).then(taken => {
      setUsernameStatus(taken ? 'taken' : 'available')
    })
  }, [debouncedUsername])

  // Email conflict check
  async function handleEmailBlur() {
    if (!emailValue || !emailValue.includes('@')) return
    const methods = await getSignInMethods(emailValue)
    if (methods.includes('password')) setEmailConflict('password')
    else if (methods.includes('google.com')) setEmailConflict('google')
    else setEmailConflict('')
  }

  const onSubmit = async (data: SignupFormData) => {
    if (usernameStatus !== 'available') {
      toast.error('Please choose an available username')
      return
    }
    if (emailConflict) return

    setLoading(true)
    setError('')

    const result = await signUpWithEmail(
      data.email, 
      data.password, 
      data.username, 
      data.firstName, 
      data.lastName
    )

    if (!result.success) {
      setError(result.error || 'Signup failed')
      setLoading(false)
      return
    }

    toast.success('Account created! Welcome to Lynksy 🎉')
    navigate('/onboarding')
  }

  const handleGoogle = async () => {
    setError('')
    const result = await signInWithGoogle()

    if (!result.success) {
      if (result.error === 'account-exists-with-different-credential') {
        const email = result.email || ''
        navigate(`/login?link=google&email=${encodeURIComponent(email)}`)
        toast.info('Account exists with a password. Redirecting to link your accounts...', { duration: 5000 })
      } else if (result.error) {
        setError(result.error)
      }
      return
    }

    setUser(result.user!)

    if (result.isNewUser || !result.user!.onboardingDone) {
      navigate('/onboarding')
    } else {
      navigate('/dashboard')
      toast('Welcome back!', { icon: '👋' })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4 sm:p-8">
      <div className="w-full max-w-[440px] bg-white p-8 sm:p-10 rounded-[32px] border border-[#E2DAD0]/60 shadow-xl shadow-orange/2 relative overflow-hidden">
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
            <h3 className="text-3xl font-black text-ink mb-2 font-syne tracking-tight">Create your account</h3>
            <p className="text-muted text-sm font-medium">Free forever. No credit card required.</p>
          </div>

          <GoogleButton label="Sign up with Google" onClick={handleGoogle} />

          <AuthDivider text="or claim your link below" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Your Profile URL 🔗</label>
              <div className="flex items-stretch">
                <div className="flex items-center px-3 bg-cream-2 border-[#E2DAD0] border-[1.5px] border-r-0 rounded-l-xl text-[11px] font-black text-muted/60 uppercase tracking-tight">
                  lynksy.app/u/
                </div>
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    className="w-full h-11 bg-white border-[#E2DAD0] border-[1.5px] rounded-r-xl px-4 text-sm font-bold focus:border-orange focus:ring-1 focus:ring-orange/20 outline-none transition-all" 
                    placeholder="username"
                    {...register('username')}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && <Loader2 className="animate-spin text-orange" size={14} />}
                    {usernameStatus === 'available' && <CheckCircle2 className="text-green-500" size={14} />}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid' || usernameStatus === 'reserved') && <XCircle className="text-red-500" size={14} />}
                  </div>
                </div>
              </div>
              
              <div className="h-4 pl-1">
                <AnimatePresence mode="wait">
                  {usernameStatus === 'available' && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-600 text-[10px] font-black uppercase tracking-widest leading-none">✓ Available!</motion.p>
                  )}
                  {usernameStatus === 'taken' && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] font-black uppercase tracking-widest leading-none">✗ Already taken</motion.p>
                  )}
                  {(usernameStatus === 'invalid' || usernameStatus === 'reserved') && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-[10px] font-black uppercase tracking-widest leading-none">⚠ Invalid format or reserved</motion.p>
                  )}
                </AnimatePresence>
              </div>

              {usernameStatus === 'taken' && (
                 <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[9px] font-bold text-muted uppercase self-center mr-1">Try:</span>
                    {[`${usernameValue}_real`, `${usernameValue}121`, `the_${usernameValue}`].map(suggestion => (
                      <button 
                        key={suggestion}
                        type="button"
                        onClick={() => setValue('username', suggestion)}
                        className="px-2 py-1 bg-white border border-[#E2DAD0] rounded-full text-[10px] font-bold text-muted hover:border-orange hover:text-orange transition-all"
                      >
                        {suggestion}
                      </button>
                    ))}
                 </div>
              )}
            </div>

            {/* Name Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">First Name</label>
                <input className="input-field h-11" placeholder="Alex" {...register('firstName')} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Last Name (Optional)</label>
                <input className="input-field h-11" placeholder="Link" {...register('lastName')} />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                  type="email" 
                  className="w-full h-11 bg-white border-[#E2DAD0] border-[1.5px] rounded-xl pl-12 pr-4 text-sm font-medium focus:border-orange focus:ring-1 focus:ring-orange/20 outline-none transition-all" 
                  placeholder="name@email.com"
                  {...register('email', { onBlur: handleEmailBlur })}
                />
              </div>
              {errors.email && <p className="text-red-500 text-[10px] font-black mt-1 uppercase tracking-widest ml-1">{errors.email.message as string}</p>}
              
              {emailConflict === 'password' && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl mt-2 animate-fade-in">
                  <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-700 font-bold leading-tight uppercase tracking-tight">
                    Account exists. <Link to="/login" className="underline">Sign in instead →</Link>
                  </p>
                </div>
              )}
              {emailConflict === 'google' && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl mt-2 animate-fade-in">
                  <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-blue-700 font-bold leading-tight uppercase tracking-tight">
                    Use 'Sign up with Google' above.
                  </p>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Password</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="w-full h-11 bg-white border-[#E2DAD0] border-[1.5px] rounded-xl pl-12 pr-12 text-sm font-medium focus:border-orange focus:ring-1 focus:ring-orange/20 outline-none transition-all" 
                  placeholder="6 to 12 characters"
                  maxLength={12}
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
              <PasswordStrength password={passwordValue || ''} />
            </div>

            {/* Terms */}
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 rounded border-[#E2DAD0] text-orange focus:ring-orange transition-all cursor-pointer" 
                  {...register('terms')} 
                />
                <span className="text-[10px] font-bold text-muted group-hover:text-ink transition-colors leading-relaxed uppercase tracking-tight">
                  I agree to the <Link to="/terms" className="text-orange underline">Terms of Service</Link> & <Link to="/privacy" className="text-orange underline">Privacy Policy</Link>.
                </span>
              </label>
              {errors.terms && <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{errors.terms.message as string}</p>}
            </div>

            <button 
              disabled={loading || usernameStatus !== 'available' || emailConflict !== ''} 
              className="btn-primary w-full h-12 gap-3 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange to-red-500 opacity-0 group-hover:opacity-10 transition-opacity" />
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Creating account...
                </>
              ) : (
                <>
                  Create free account →
                </>
              )}
            </button>

            <AuthAlert message={error} onDismiss={() => setError('')} />
          </form>

          <div className="mt-8 pt-8 border-t border-[#E2DAD0] flex flex-col items-center gap-4">
             <p className="text-xs font-medium text-muted">
               Already have an account? <Link to="/login" className="text-orange font-bold hover:underline">Log in here →</Link>
             </p>
             <div className="flex items-center gap-2 py-3 px-4 bg-cream-2/50 rounded-xl border border-dashed border-[#E2DAD0]">
                <ShieldCheck className="text-green-600 shrink-0" size={14} />
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">
                   Encrypted by 256-bit bank-grade security
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
