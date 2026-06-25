import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, Key } from 'lucide-react'
import { verifyResetCode, resetPasswordWithCode } from '@/firebase/auth'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { Spinner } from '@/components/ui/Spinner'
import { toast } from 'react-hot-toast'
import { LogoMark } from '@/components/ui/LogoMark'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const oobCode = searchParams.get('oobCode')

  const [verifying, setVerifying] = useState(true)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isValid, setIsValid] = useState(false)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!oobCode) {
      toast.error('Invalid reset link')
      navigate('/forgot-password')
      return
    }

    async function verify() {
      const result = await verifyResetCode(oobCode!)
      setVerifying(false)
      if (result.valid) {
        setIsValid(true)
        setEmail(result.email || '')
      } else {
        setError(result.error || 'This reset link has expired or is invalid.')
      }
    }

    verify()
  }, [oobCode, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!oobCode || !isValid) return
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match.')
    }

    setLoading(true)
    setError('')

    const result = await resetPasswordWithCode(oobCode, password)
    setLoading(false)

    if (result.success) {
      setSuccess(true)
      toast.success('Password updated successfully!')
      setTimeout(() => navigate('/login?resetSuccess=true'), 2000)
    } else {
      setError(result.error || 'Failed to reset password.')
    }
  }

  if (verifying) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm font-bold text-muted uppercase tracking-widest">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
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
          {!isValid ? (
            <motion.div
              key="invalid"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl border border-cream-2 text-center"
            >
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 mx-auto">
                <AlertCircle size={32} />
              </div>

              <h2 className="text-2xl font-black font-syne text-ink mb-2">Reset link invalid</h2>
              <p className="text-muted text-sm mb-8 leading-relaxed">
                {error}
              </p>

              <Link 
                to="/forgot-password" 
                className="btn-primary w-full h-12 gap-2"
              >
                Request new link
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          ) : success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl border border-cream-2 text-center"
            >
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-500 mb-6 mx-auto">
                <CheckCircle2 size={32} />
              </div>

              <h2 className="text-2xl font-black font-syne text-ink mb-2">Password updated!</h2>
              <p className="text-muted text-sm mb-2 leading-relaxed">
                Your account is now secure.
              </p>
              <p className="text-xs font-bold text-orange uppercase tracking-widest animate-pulse">
                Redirecting to login...
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] p-8 md:p-10 shadow-xl border border-cream-2"
            >
              <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center text-orange mb-6 mx-auto">
                <Key size={32} />
              </div>

              <h2 className="text-2xl font-black font-syne text-ink text-center mb-2">Set new password</h2>
              <p className="text-muted text-xs text-center mb-8 leading-relaxed">
                Setting a new password for:<br/>
                <span className="font-bold text-ink">{email}</span>
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      placeholder="Min 8 characters"
                      className="w-full h-12 bg-cream/50 border-cream-3 border rounded-xl pl-12 pr-12 text-sm focus:border-orange focus:ring-1 focus:ring-orange/20 outline-none transition-all"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Confirm new password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      required
                      placeholder="Repeat password"
                      className="w-full h-12 bg-cream/50 border-cream-3 border rounded-xl pl-12 pr-12 text-sm focus:border-orange focus:ring-1 focus:ring-orange/20 outline-none transition-all"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || password.length < 8}
                  className="btn-primary w-full h-12 gap-2 group"
                >
                  {loading ? 'Updating password...' : (
                    <>
                      Update password
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <AuthAlert message={error} onDismiss={() => setError('')} />
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
