import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { auth, db } from '@/firebase/config'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { incrementAiUsage, handleFirestoreError, OperationType } from '@/firebase/firestore'
import { generateBioOptions } from '@/services/aiService'
import { THEMES } from '@/constants/themes'
import { PhonePreview } from '@/components/links/PhonePreview'
import { getUserUrls } from '@/utils/planUtils'
import { User } from '@/types'
import { 
  Loader2, Sparkles, Check, ChevronRight, ChevronLeft, 
  Target, PenTool, Palette, Stars, PartyPopper, Link as LinkIcon,
  User as UserIcon
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import confetti from 'canvas-confetti'

const CATEGORIES = [
  'Instagram Creator', 'YouTuber', 'Podcaster', 
  'Freelancer', 'Small Business', 'Artist',
  'Gamer', 'Edu-creator', 'Other'
]

export default function Onboarding() {
  const { user, firebaseUid, updateUserField } = useAuthStore()
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    displayName: user?.displayName || auth.currentUser?.displayName || '',
    email: user?.email || auth.currentUser?.email || '',
    category: '',
    bio: '',
    themeId: 'saffron',
    accentColor: '#FF6B00',
    buttonStyle: 'filled' as 'filled' | 'outline' | 'soft'
  })
  const [aiBios, setAiBios] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (user && formData.displayName === '' && formData.email === '') {
      setFormData(prev => ({
        ...prev,
        displayName: user.displayName || '',
        email: user.email || ''
      }))
    }
  }, [user, formData.displayName, formData.email])

  const { display: displayUrl } = getUserUrls(user)

  useEffect(() => {
    if (user?.onboardingDone && step !== 6) navigate('/dashboard')
  }, [user, navigate, step])

  const nextStep = () => setStep(s => s + 1)
  const prevStep = () => setStep(s => s - 1)

  const handleAiBio = async () => {
    const uid = user?.uid || firebaseUid
    if (!uid) {
      toast.error('Authentication error. Please sign in again.')
      return
    }
    
    setIsGenerating(true)
    try {
      const bios = await generateBioOptions(formData.category || 'Creator', user?.displayName || 'Creator')
      setAiBios(bios)
      
      // Track AI usage if user doc exists
      if (user) {
        await incrementAiUsage(user.uid, user, 'bio')
      }
    } catch (e: unknown) {
      console.error('Bio gen error:', e)
      toast.error('Could not generate bios. Try again later.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleFinish = async () => {
    const uid = user?.uid || firebaseUid || auth.currentUser?.uid
    if (!uid) {
      console.error('No UID found during onboarding finish')
      toast.error('Authentication error. Please sign in again.')
      return
    }

    setIsSaving(true)
    console.log('Completing onboarding for:', uid)
    try {
      const userRef = doc(db, 'users', uid)
      
      // We ensure all required fields for isValidUser are present
      // even if the document doesn't exist yet (setDoc with merge: true)
      const updateData: Record<string, unknown> = {
        uid: uid,
        username: user?.username || formData.displayName.toLowerCase().replace(/\s/g, '') || uid.slice(0, 8),
        plan: user?.plan || 'FREE',
        ...formData,
        onboardingDone: true,
        updatedAt: serverTimestamp(),
        isActive: true
      }

      if (!user?.createdAt) {
        updateData.createdAt = serverTimestamp()
      }

      try {
        await setDoc(userRef, updateData, { merge: true })
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`)
      }

      // Ensure the username index document is claimed and pointing to this user
      if (updateData.username) {
        const usernameLower = updateData.username.toLowerCase()
        try {
          await setDoc(doc(db, 'usernames', usernameLower), {
            uid: uid,
            email: user?.email || formData.email || '',
            createdAt: serverTimestamp()
          }, { merge: true })
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `usernames/${usernameLower}`)
        }
      }
      
      // Update local store
      updateUserField(updateData as Partial<User>)
      
      console.log('Onboarding saved successfully')
      
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B00', '#1C1813', '#F5F0EA']
      })

      setStep(6) // Success screen
    } catch (e: unknown) {
      console.error('Onboarding save error:', e)
      const error = e as Error
      toast.error(error.message || 'Failed to save onboarding')
    } finally {
      setIsSaving(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <span className="section-label mb-2 block">STEP 1 / 5</span>
            <h2 className="text-3xl font-bold font-syne text-ink mb-1 flex items-center gap-2">Basic Info <UserIcon className="text-orange" /></h2>
            <p className="text-sm text-muted mb-6">Let's start with the basics.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Display Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Your Name"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="hello@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <button 
                onClick={nextStep} 
                disabled={!formData.displayName || !formData.email}
                className="btn-primary w-full mt-4"
              >
                Continue <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <span className="section-label mb-2 block">STEP 2 / 5</span>
            <h2 className="text-3xl font-bold font-syne text-ink mb-6 flex items-center gap-2">What's your niche? <Target className="text-orange" /></h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map(c => (
                <button
                  key={c}
                  onClick={() => { setFormData({ ...formData, category: c }); nextStep() }}
                  className={`p-4 rounded-2xl border-2 transition-all text-sm font-bold text-left ${
                    formData.category === c ? 'border-orange bg-orange/5 text-orange' : 'border-cream-3 hover:border-muted-2'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </motion.div>
        )
      case 3:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <span className="section-label mb-2 block">STEP 3 / 5</span>
            <h2 className="text-3xl font-bold font-syne text-ink mb-1 flex items-center gap-2">Tell us your story <PenTool className="text-orange" size={24} /></h2>
            <p className="text-sm text-muted mb-6">Write a short bio for your page or let AI handle it.</p>
            
            <textarea
              className="textarea-field h-32 mb-4"
              placeholder="Ex: Fitness enthusiast sharing daily home workout routines and healthy recipes."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            />

            <div className="flex flex-col gap-4">
              <button 
                onClick={handleAiBio}
                disabled={isGenerating || !formData.category}
                className="btn-ghost"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <><Sparkles size={18} /> Generate with AI</>}
              </button>

              {aiBios.length > 0 && (
                <div className="grid gap-3">
                  {aiBios.map((b, i) => (
                    <button
                      key={i}
                      onClick={() => setFormData({ ...formData, bio: b })}
                      className={`p-3 rounded-xl border-2 text-xs text-left transition-all ${
                        formData.bio === b ? 'border-orange bg-orange/5' : 'border-cream-3'
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              )}

              <button 
                onClick={nextStep} 
                disabled={!formData.bio}
                className="btn-primary"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        )
      case 4:
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <span className="section-label mb-2 block">STEP 4 / 5</span>
            <h2 className="text-3xl font-bold font-syne text-ink mb-1 flex items-center gap-2">Pick a theme <Palette className="text-orange" size={24} /></h2>
            <p className="text-sm text-muted mb-6">You can change this later at any time.</p>
            
            <div className="grid grid-cols-2 gap-4 h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {THEMES.filter(t => t.requiredPlan === 'FREE').map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    const theme = THEMES.find(th => th.id === t.id);
                    setFormData({ 
                      ...formData, 
                      themeId: t.id,
                      accentColor: theme?.accentColor || formData.accentColor,
                      buttonStyle: theme?.buttonStyle || formData.buttonStyle
                    })
                  }}
                  className={`relative p-1 rounded-xl border-2 transition-all group overflow-hidden ${
                    formData.themeId === t.id ? 'border-orange' : 'border-cream-3'
                  }`}
                >
                  <div className="w-full h-20 rounded-lg mb-2" style={{ background: t.preview }} />
                  <span className="text-[10px] font-bold uppercase">{t.name}</span>
                  {formData.themeId === t.id && (
                    <div className="absolute top-2 right-2 bg-orange text-white p-1 rounded-full">
                      <Check size={10} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button onClick={nextStep} className="btn-primary w-full mt-6">
              Finalizing details <ChevronRight size={18} />
            </button>
          </motion.div>
        )
      case 5: 
        return (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <span className="section-label mb-2 block">STEP 5 / 5</span>
            <h2 className="text-3xl font-bold font-syne text-ink mb-1 flex items-center gap-2">Looks perfect! <Stars className="text-orange" size={24} /></h2>
            <p className="text-sm text-muted mb-8">Review your page before we take you to the dashboard.</p>
            
            <div className="card border-2 border-orange/20 bg-orange/5 mb-8">
              <p className="text-sm font-bold text-ink mb-2">You're joining as:</p>
              <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-orange flex items-center justify-center text-white">
                  <UserIcon size={24} />
                </div>
                <div>
                  <p className="font-bold text-ink">{formData.displayName || 'Creator'}</p>
                  <p className="text-xs text-muted">{formData.email}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleFinish} 
              disabled={isSaving}
              className="btn-primary w-full h-14 text-lg"
            >
              {isSaving ? <Loader2 className="animate-spin" size={24} /> : "Launch my page!"}
            </button>
          </motion.div>
        )
      case 6:
        return (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center flex flex-col items-center">
            <PartyPopper size={48} className="text-orange mb-6" />
            <h2 className="text-4xl font-extrabold font-syne text-ink mb-2">You're live!</h2>
            <p className="text-muted mb-8">Your Lynksy page is ready to be shared with the world.</p>
            <div className="bg-white border-2 border-cream-3 rounded-2xl p-4 mb-8 font-mono text-xs text-orange font-bold">
              {displayUrl}
            </div>
            <button onClick={() => navigate('/dashboard')} className="btn-primary btn-lg w-full">
              Go to Dashboard →
            </button>
          </motion.div>
        )
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6">
      <nav className="fixed top-0 left-0 right-0 p-6 flex justify-center">
        <div className="flex items-center gap-2">
          <LinkIcon className="text-orange" size={24} />
          <h1 className="text-xl font-bold font-syne">Lynksy<span className="text-orange">.</span></h1>
        </div>
      </nav>

      <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_300px] gap-12 items-start mt-12">
        <div className="w-full max-w-md mx-auto h-full flex flex-col justify-center">
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-orange/5 blur-3xl -z-10 rounded-full" />
            <AnimatePresence mode="wait">
              {renderStep()}
            </AnimatePresence>
          </div>

          {step > 1 && step < 6 && (
            <button 
              onClick={prevStep} 
              className="flex items-center gap-2 text-muted hover:text-ink font-bold text-sm transition-colors"
            >
              <ChevronLeft size={16} /> Back
            </button>
          )}
        </div>

        <div className="hidden lg:block">
          <PhonePreview 
            user={{ ...user, ...formData } as unknown as User} 
            links={[]} 
          />
        </div>
      </div>
    </div>
  )
}
