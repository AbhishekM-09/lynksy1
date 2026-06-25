import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react'
import { sendForgotPasswordEmail } from '@/firebase/auth'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { LogoMark } from '@/components/ui/LogoMark'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [hint, setHint] = useState<'use_google' | 'account_not_found' | null>(null)
  
  const [resendCooldown, setResendCooldown] = useState(0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setInterval(() => {
      setResendCooldown(s => s - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    
    setLoading(true)
    setError('')
    setHint(null)

    const result = await sendForgotPasswordEmail(email)
    setLoading(false)

    if (result.success) {
      setSent(true)
      setResendCooldown(30)
    } else {
      setError(result.error || 'Failed to send reset email')
      setHint(result.hint || null)
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
      <Link 
        to="/login" 
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft size={14} />
        Back to login
      </Link>

      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link to="/" className="flex items-center gap-2 group">
             <div className="w-8 h-8 flex items-center justify-center group-hover:scale-[1.08] transition-transform shrink-0">
               <LogoMark size="100%" />
             </div>
             <h1 className="text-xl font-bold font-syne tracking-tight">Lynksy<span className="text-orange">.</span></h1>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {!sent ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl border border-cream-2"
            >
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange mb-6 mx-auto">
                <Mail size={32} />
              </div>

              <h2 className="text-2xl font-black font-syne text-ink text-center mb-2">Forgot your password?</h2>
              <p className="text-muted text-sm text-center mb-8 leading-relaxed">
                Enter your email address and we'll send you a secure link to reset your password.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input 
                      type="email" 
                      required
                      placeholder="alex@example.com"
                      className="w-full h-12 bg-cream/50 border-cream-3 border rounded-xl pl-12 pr-4 text-sm focus:border-orange focus:ring-1 focus:ring-orange/20 outline-none transition-all"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {hint === 'use_google' && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                    <AlertCircle size={18} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                      This account uses <span className="font-bold">Google sign-in</span> and has no password. 
                      Go back to login and click 'Continue with Google'.
                    </p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full h-12 gap-2 group"
                >
                  {loading ? 'Sending link...' : (
                    <>
                      Send reset link
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <AuthAlert message={error} onDismiss={() => setError('')} />

                {hint === 'account_not_found' && (
                  <p className="text-center text-xs text-muted">
                    New to Lynksy? <Link to="/signup" className="text-orange font-bold hover:underline">Create free account</Link>
                  </p>
                )}
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl border border-cream-2 text-center"
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 mx-auto">
                <CheckCircle2 size={32} />
              </div>

              <h2 className="text-2xl font-black font-syne text-ink mb-2">Check your email!</h2>
              <p className="text-muted text-sm mb-8 leading-relaxed">
                We've sent a secure password reset link to:<br/>
                <span className="font-bold text-ink">{email}</span>
              </p>

              <div className="space-y-4 text-left bg-cream-2/50 rounded-2xl p-5 mb-8">
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-muted border border-cream-2">1</div>
                  <p className="text-xs text-muted">Open the email from Lynksy</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-muted border border-cream-2">2</div>
                  <p className="text-xs text-muted">Click the secure reset link</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[10px] font-bold text-muted border border-cream-2">3</div>
                  <p className="text-xs text-muted">Set your new strong password</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">
                  Didn't receive it? Check spam folder.
                </p>
                
                <button 
                  onClick={handleSubmit}
                  disabled={resendCooldown > 0 || loading}
                  className="flex items-center gap-2 text-sm font-bold text-orange hover:text-orange-600 disabled:opacity-50 transition-colors mx-auto"
                >
                  <RotateCcw size={14} className={loading ? 'animate-spin' : ''} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend link'}
                </button>
              </div>

              <Link to="/login" className="block mt-10 text-xs font-black uppercase tracking-widest text-muted hover:text-ink transition-colors">
                Back to login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
