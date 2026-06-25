import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Mail, X, RotateCcw, CheckCircle2, RefreshCw } from 'lucide-react'
import { resendVerificationEmail } from '@/firebase/auth'
import { auth } from '@/firebase/config'
import { updateUser } from '@/firebase/firestore'
import { useAuthStore } from '@/store/authStore'
import { onIdTokenChanged, type User as FirebaseUser } from 'firebase/auth'
import toast from 'react-hot-toast'

export function EmailVerifyBanner() {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [emailVerified, setEmailVerified] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)
  const [checking, setChecking]   = useState(false)

  // Listen to Auth State / Token changes reactively
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        setEmailVerified(firebaseUser.emailVerified)
        // Sync Firestore in case they were verified already
        if (firebaseUser.emailVerified) {
          syncVerificationToFirestore(firebaseUser.uid)
        }
      } else {
        setEmailVerified(false)
      }
    })
    return unsubscribe
  }, [])

  // Sync verification state to Firestore and Zustand store
  async function syncVerificationToFirestore(uid: string) {
    try {
      await updateUser(uid, { isVerified: true })
      const storeState = useAuthStore.getState()
      if (storeState.user && !storeState.user.isVerified) {
        storeState.updateUserField({ isVerified: true })
      }
    } catch (e) {
      console.warn('Silent sync of email verification to Firestore failed:', e)
    }
  }

  // Auto-reload check loop when component is mounted and email is not verified
  useEffect(() => {
    if (!user || emailVerified || dismissed) return

    let active = true

    async function checkStatusQuietly() {
      if (!auth.currentUser || !active) return
      try {
        await auth.currentUser.reload()
        const latestUser = auth.currentUser
        if (latestUser && latestUser.emailVerified) {
          setEmailVerified(true)
          toast.success('Email verified successfully!')
          await syncVerificationToFirestore(latestUser.uid)
        }
      } catch (err) {
        console.warn('Quiet verification check error:', err)
      }
    }

    // Check on tab focus
    window.addEventListener('focus', checkStatusQuietly)
    
    // Check every 6 seconds while they are looking at the page
    const interval = setInterval(checkStatusQuietly, 6000)

    return () => {
      active = false
      window.removeEventListener('focus', checkStatusQuietly)
      clearInterval(interval)
    }
  }, [user, emailVerified, dismissed])

  const providerId = user?.providerData?.[0]?.providerId
  const isSocialUser = providerId === 'google.com' || providerId === 'github.com' || providerId === 'apple.com'

  if (!user || emailVerified || dismissed || isSocialUser) return null

  async function handleResend() {
    setSending(true)
    const result = await resendVerificationEmail(user)
    setSending(false)
    if (result.success) {
      setSent(true)
      toast.success('Verification email sent! Check your inbox.')
    } else {
      toast.error(result.error || 'Failed to send. Try again later.')
    }
  }

  async function handleCheckStatus() {
    setChecking(true)
    try {
      const currentUser = auth.currentUser
      if (currentUser) {
        await currentUser.reload()
        if (currentUser.emailVerified) {
          setEmailVerified(true)
          toast.success('Email successfully verified! You are now a verified creator.')
          await syncVerificationToFirestore(currentUser.uid)
        } else {
          toast.error('Email not verified yet. Please check your inbox and click the verification link.')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to check verification status.'
      toast.error(msg)
    } finally {
      setChecking(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        className="w-full relative z-40 overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, #FFF3EA, #FFF8F0)',
          borderBottom: '1px solid rgba(255,107,0,0.1)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 flex-shrink-0">
              <Mail size={14} />
            </div>
            
            <p className="text-sm text-[#1C1813] leading-tight">
              <span className="font-bold">Verify your email</span>
              <span> — Check </span>
              <span className="font-bold border-b border-orange-200">{user.email}</span>
              <span> for a verification link.</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end md:justify-start">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase font-black tracking-widest">
              {sent ? (
                <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                  <CheckCircle2 size={12} />
                  Sent
                </div>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={sending}
                  className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <RotateCcw size={12} className={sending ? 'animate-spin' : ''} />
                  {sending ? 'Sending...' : 'Resend link'}
                </button>
              )}

              <button
                onClick={handleCheckStatus}
                disabled={checking}
                className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 disabled:opacity-50 transition-colors cursor-pointer border border-orange-200 hover:border-orange-300 px-3 py-1 rounded-full bg-white/60 hover:bg-white"
              >
                <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
                {checking ? 'Checking...' : 'Check Status'}
              </button>
            </div>

            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-[#9A8F84] hover:text-[#1C1813] transition-colors rounded-full hover:bg-black/5"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
