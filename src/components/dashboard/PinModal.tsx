import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Lock, Delete, ShieldCheck, ShieldAlert } from 'lucide-react'

interface PinModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'set' | 'verify'
  onComplete: (pin: string) => void
  userName?: string
}

export function PinModal({ isOpen, onClose, mode, onComplete, userName }: PinModalProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [step, setStep] = useState<'entry' | 'confirm'>(mode === 'set' ? 'entry' : 'entry')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setPin('')
      setConfirmPin('')
      setStep('entry')
      setError(false)
    }
  }, [isOpen])

  const handleKeyPress = (num: string) => {
    if (error) setError(false)
    
    if (step === 'entry') {
      if (pin.length < 6) {
        const newPin = pin + num
        setPin(newPin)
        if (newPin.length === 6) {
          if (mode === 'set') {
            setStep('confirm')
          } else {
            onComplete(newPin)
          }
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newPin = confirmPin + num
        setConfirmPin(newPin)
        if (newPin.length === 6) {
          if (newPin === pin) {
            onComplete(newPin)
          } else {
            setError(true)
            setConfirmPin('')
            setTimeout(() => setError(false), 1000)
          }
        }
      }
    }
  }

  const handleDelete = () => {
    if (step === 'entry') {
      setPin(pin.slice(0, -1))
    } else {
      setConfirmPin(confirmPin.slice(0, -1))
    }
  }

  if (!isOpen) return null

  const currentVal = step === 'entry' ? pin : confirmPin

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-ink/80 backdrop-blur-md" 
          onClick={onClose}
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-4 transition-colors ${error ? 'bg-red-50 text-red-500' : 'bg-orange/10 text-orange'}`}>
              {error ? <ShieldAlert size={32} /> : mode === 'set' ? <ShieldCheck size={32} /> : <Lock size={32} />}
            </div>
            <h3 className="text-xl font-bold font-syne text-ink">
              {mode === 'set' 
                ? (step === 'entry' ? 'Set Login PIN' : 'Confirm PIN') 
                : `Welcome back, ${userName || 'User'}`}
            </h3>
            <p className="text-muted text-sm mt-1">
              {mode === 'set' 
                ? 'Create a 6-digit PIN for extra security' 
                : 'Enter your PIN to unlock your dashboard'}
            </p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-4 mb-10">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                animate={error ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  i < currentVal.length 
                    ? 'bg-orange border-orange scale-110' 
                    : 'bg-transparent border-cream-3'
                }`}
              />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="h-16 rounded-2xl bg-cream-1 text-2xl font-bold text-ink hover:bg-orange hover:text-white transition-all active:scale-95"
              >
                {num}
              </button>
            ))}
            <button className="h-14" /> {/* Spacer */}
            <button
              onClick={() => handleKeyPress('0')}
              className="h-16 rounded-2xl bg-cream-1 text-2xl font-bold text-ink hover:bg-orange hover:text-white transition-all active:scale-95"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="h-16 rounded-2xl bg-cream-1 flex items-center justify-center text-muted hover:text-red-500 transition-colors active:scale-95"
            >
              <Delete size={24} />
            </button>
          </div>

          {mode === 'set' && (
             <button 
               onClick={onClose}
               className="w-full mt-8 py-3 text-muted font-bold text-sm hover:text-ink transition-colors"
             >
               Cancel
             </button>
          )}

          {error && (
            <p className="absolute bottom-4 left-0 right-0 text-center text-red-500 text-xs font-bold uppercase tracking-widest">
              PINs do not match
            </p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
