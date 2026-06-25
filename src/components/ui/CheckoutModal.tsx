import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  X, ShoppingBag, Mail, CheckCircle2, 
  ArrowRight, ShieldCheck, Download, AlertCircle,
  User, Phone
} from 'lucide-react'
import { db } from '@/firebase/config'
import { collection, serverTimestamp, doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore'
import { formatPrice } from '@/utils/currency'
import type { Product } from '@/types'
import { toast } from 'react-hot-toast'

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  accentColor: string
}

export default function CheckoutModal({ isOpen, onClose, product, accentColor }: CheckoutModalProps) {
  const [step, setStep] = useState<'email' | 'paying' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [orderToken, setOrderToken] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  React.useEffect(() => {
    if (!isOpen) {
      setStep('email')
      setEmail('')
      setName('')
      setPhone('')
      setValidationError(null)
    }
  }, [isOpen])

  if (!product) return null

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const cleanPhone = phone.replace(/[\s()-]/g, '')

    if (!trimmedName) {
      setValidationError('Please enter your name')
      return
    }
    if (trimmedName.length < 2) {
      setValidationError('Name must be at least 2 characters long')
      return
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!trimmedEmail) {
      setValidationError('Please enter your email address')
      return
    }
    if (!emailRegex.test(trimmedEmail)) {
      setValidationError('Please enter a valid, real email address')
      return
    }

    if (!cleanPhone) {
      setValidationError('Please enter your mobile number')
      return
    }
    const mobileRegex = /^(\+91|0)?([6-9]\d{9})$/
    if (!mobileRegex.test(cleanPhone)) {
      setValidationError('Please enter a valid 10-digit mobile number')
      return
    }

    setLoading(true)
    setStep('paying')

    // Simulate payment processing
    setTimeout(async () => {
      try {
        const downloadToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        setOrderToken(downloadToken)
        
        let creatorName = 'Creator'
        let creatorEmail = ''
        let creatorPlan = 'FREE'
        try {
          const creatorSnap = await getDoc(doc(db, 'users', product.userId))
          if (creatorSnap.exists()) {
            const data = creatorSnap.data()
            creatorName = data.displayName || data.username || 'Creator'
            creatorEmail = data.email || ''
            creatorPlan = data.plan || 'FREE'
          }
        } catch (e) {
          console.warn('Could not fetch creator details during checkout:', e)
        }

        const isPro = creatorPlan === 'PRO'
        const isProPlus = creatorPlan === 'PRO_PLUS'
        const feePercent = (isPro || isProPlus) ? 0.0 : 0.10
        const platformFee = Math.round(product.price * feePercent)
        const creatorEarnings = product.price - platformFee
        const generatedOrderId = doc(collection(db, 'orders')).id

        // Create top-level Order
        await setDoc(doc(db, 'orders', generatedOrderId), {
          id: generatedOrderId,
          productId: product.id,
          productTitle: product.name,
          productName: product.name,
          productPrice: product.price,
          amount: product.price,
          creatorId: product.userId,
          userId: product.userId,
          creatorName: creatorName,
          buyerEmail: trimmedEmail,
          buyerName: trimmedName,
          buyerPhone: cleanPhone,
          commission: platformFee,
          platformFee: platformFee,
          creatorEarnings: creatorEarnings,
          currency: product.currency || 'INR',
          status: 'paid',
          paymentStatus: 'COMPLETED',
          downloadToken,
          createdAt: serverTimestamp()
        })

        // Create subcollection Order (for creator dashboard visibility)
        await setDoc(doc(db, `users/${product.userId}/orders`, generatedOrderId), {
          id: generatedOrderId,
          productId: product.id,
          productTitle: product.name,
          productName: product.name,
          productPrice: product.price,
          amount: product.price,
          creatorId: product.userId,
          userId: product.userId,
          buyerEmail: trimmedEmail,
          buyerName: trimmedName,
          buyerPhone: cleanPhone,
          commission: platformFee,
          platformFee: platformFee,
          creatorEarnings: creatorEarnings,
          currency: product.currency || 'INR',
          status: 'paid',
          paymentStatus: 'COMPLETED',
          downloadToken,
          createdAt: serverTimestamp()
        })

        // Track and increment top-level payouts
        await setDoc(doc(db, 'payouts', product.userId), {
          id: product.userId,
          creatorId: product.userId,
          creatorName: creatorName,
          creatorEmail: creatorEmail,
          pendingAmount: increment(creatorEarnings),
          paidAmount: increment(0),
          status: 'PENDING',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true })

        // Update Product stats
        const productRef = doc(db, `users/${product.userId}/products`, product.id)
        await updateDoc(productRef, {
          totalSales: increment(1),
          totalRevenue: increment(product.price),
          updatedAt: serverTimestamp()
        })

        setOrderId(generatedOrderId)
        setStep('success')
        toast.success('Purchase successful!')
      } catch (err) {
        console.error('Checkout error:', err)
        toast.error('Something went wrong. Please try again.')
        setStep('email')
      } finally {
        setLoading(false)
      }
    }, 2000)
  }

  const handleDownload = () => {
    // Redirect to download page with secure token
    window.location.href = `/download/${orderId}?token=${orderToken}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/90 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden flex flex-col"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-cream-3 rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            {step === 'email' && (
              <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-cream-3">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-orange/10 flex items-center justify-center text-orange">
                         <ShoppingBag size={24} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-ink truncate leading-tight">{product.name}</h3>
                    <p className="text-orange font-black mt-1">{formatPrice(product.price, product.currency)}</p>
                  </div>
                </div>

                <form onSubmit={handleCheckout} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted">Your Name</label>
                    <div className="relative">
                       <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                       <input 
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={name}
                        onChange={e => {
                          setName(e.target.value)
                          setValidationError(null)
                        }}
                        className="w-full bg-cream p-4 pl-12 rounded-2xl border-2 border-transparent focus:border-orange outline-none transition-all font-bold text-sm"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted">Delivery Email</label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                       <input 
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={email}
                        onChange={e => {
                          setEmail(e.target.value)
                          setValidationError(null)
                        }}
                        className="w-full bg-cream p-4 pl-12 rounded-2xl border-2 border-transparent focus:border-orange outline-none transition-all font-bold text-sm"
                       />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted">Mobile Number</label>
                    <div className="relative">
                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                       <input 
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={e => {
                          setPhone(e.target.value)
                          setValidationError(null)
                        }}
                        className="w-full bg-cream p-4 pl-12 rounded-2xl border-2 border-transparent focus:border-orange outline-none transition-all font-bold text-sm"
                       />
                    </div>
                    <p className="text-[10px] text-muted font-bold flex items-center gap-1">
                      <ShieldCheck size={12} /> Your file will be sent to this email instantly.
                    </p>
                  </div>

                  {validationError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold leading-relaxed shadow-sm"
                    >
                      <AlertCircle size={18} className="shrink-0 text-red-500 animate-pulse" />
                      <span>{validationError}</span>
                    </motion.div>
                  )}

                  <div className="p-4 bg-orange/5 rounded-2xl border border-orange/10 mb-6 font-bold">
                    <div className="flex items-center justify-between font-black text-sm">
                      <span className="text-muted">Subtotal</span>
                      <span className="text-ink">{formatPrice(product.price, product.currency)}</span>
                    </div>
                    <div className="flex items-center justify-between font-black text-xs mt-2 pt-2 border-t border-orange/10">
                      <span className="text-muted">Payment Integration</span>
                      <span className="text-orange">SIMULATED MODE</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email || !name || !phone}
                    className="w-full py-4 text-white font-black rounded-2xl shadow-xl shadow-orange/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    style={{ background: accentColor }}
                  >
                    Test Download (Direct / Free) <ArrowRight size={18} />
                  </button>
                </form>
              </div>
            )}

            {step === 'paying' && (
              <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
                <div className="relative w-24 h-24 mb-6">
                   <div 
                     className="absolute inset-0 border-4 rounded-full opacity-10" 
                     style={{ borderColor: accentColor }}
                   />
                   <motion.div 
                     animate={{ rotate: 360 }}
                     transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                     className="absolute inset-0 border-4 border-t-transparent rounded-full"
                     style={{ borderColor: accentColor, borderTopColor: 'transparent' }}
                   />
                   <div className="absolute inset-0 flex items-center justify-center" style={{ color: accentColor }}>
                      <ShieldCheck size={32} />
                   </div>
                </div>
                <h3 className="text-xl font-black text-ink mb-2">Securing Connection...</h3>
                <p className="text-muted text-sm max-w-[240px]">Processing your simulated payment via our secure vault.</p>
                
                <div className="mt-8 flex items-center gap-2 text-[10px] font-black uppercase text-muted tracking-widest bg-cream-3 px-4 py-2 rounded-full">
                   <AlertCircle size={12} /> Payment Integration Coming Soon
                </div>
              </div>
            )}

            {step === 'success' && (
              <div className="p-12 text-center flex flex-col items-center justify-center flex-1">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-green-500/20"
                >
                  <CheckCircle2 size={40} />
                </motion.div>
                <h3 className="text-2xl font-black text-ink mb-2">Thank You!</h3>
                <p className="text-muted text-sm mb-8">Success! The {product.category} is ready for you. Access the download link below.</p>
                
                <button
                  onClick={handleDownload}
                  className="w-full py-4 text-white font-black rounded-2xl shadow-xl shadow-green-500/20 flex items-center justify-center gap-2 hover:scale-[1.02] transition-all"
                  style={{ background: '#22c55e' }}
                >
                  Access Files <Download size={18} />
                </button>

                <p className="mt-6 text-xs font-bold text-muted">A confirmation has been sent to {email}</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
