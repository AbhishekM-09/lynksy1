import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  X, CheckCircle2, ShoppingBag, Loader2, Download, 
  Mail, Phone, User, ShieldCheck, ArrowRight, AlertCircle
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { Product } from '@/types/store'
import { formatPrice, CATEGORY_INFO } from '@/utils/storeUtils'
import { createOrder, confirmOrderPayment } from '@/firebase/store'
import toast from 'react-hot-toast'

interface RazorpayInstance {
  open: () => void
}

interface WindowWithRazorpay {
  Razorpay?: new (options: unknown) => RazorpayInstance
}

// Dynamic script loader for Razorpay Checkout
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const win = window as unknown as WindowWithRazorpay
    if (win.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  creatorUid: string
}

export function CheckoutModal({ isOpen, onClose, product, creatorUid }: CheckoutModalProps) {
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'success'>('details')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [emailConsent, setEmailConsent] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [downloadToken, setDownloadToken] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  
  useEffect(() => {
    if (!isOpen) {
      // Reset state when closing
      setTimeout(() => {
        setStep('details')
        setFormData({ name: '', email: '', phone: '' })
        setEmailConsent(true)
        setIsSubmitting(false)
        setDownloadToken('')
        setValidationError(null)
      }, 300)
    }
  }, [isOpen])

  if (!product) return null

  const handleProceed = async () => {
    setValidationError(null)
    const trimmedName = formData.name.trim()
    const trimmedEmail = formData.email.trim()
    const cleanPhone = formData.phone.replace(/[\s()-]/g, '')

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
      setValidationError('Please enter a valid, real email address (e.g., mail@domain.com)')
      return
    }

    if (!cleanPhone) {
      setValidationError('Please enter your mobile number')
      return
    }
    // Match exactly 10 digits, or optionally with +91 or + prefix
    const mobileRegex = /^(\+91|0)?([6-9]\d{9})$/
    if (!mobileRegex.test(cleanPhone)) {
      setValidationError('Please enter a valid 10-digit mobile number')
      return
    }

    setIsSubmitting(true)
    try {
      // Create pending order with 'pending' status
      const id = await createOrder(creatorUid, {
        productId: product.id,
        productTitle: product.title,
        productPrice: product.price,
        buyerName: trimmedName,
        buyerEmail: trimmedEmail,
        buyerPhone: cleanPhone,
        razorpayOrderId: 'PENDING',
        emailConsent: emailConsent
      })

      // If product is free (price === 0), bypass Razorpay and auto-confirm order payment
      if (product.price === 0) {
        const token = await confirmOrderPayment(creatorUid, id, product.id, {
          razorpayPaymentId: 'FREE',
          razorpaySignature: 'FREE',
          fileStoragePath: product.fileUrl,
          fileName: product.fileName,
          fileSize: product.fileSize,
          buyerEmail: trimmedEmail
        })

        setDownloadToken(token)
        setStep('success')
        fireConfetti()
        return
      }

      // Load Razorpay Checkout SDK script dynamically
      const loaded = await loadRazorpayScript()
      if (!loaded) {
        throw new Error('Failed to load Razorpay payment SDK. Please check your network connection.')
      }

      // Call our secure backend to create a Razorpay order under admin account
      const orderRes = await fetch('/api/store/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: product.price,
          productId: product.id,
          creatorId: creatorUid
        })
      })

      const orderData = await orderRes.json()
      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to create platform checkout session')
      }

      // Initialize and open Razorpay Checkout modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Lynksy Checkout',
        description: `${product.title}`,
        order_id: orderData.orderId,
        handler: async function (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
          setStep('processing')
          try {
            // Verify payment securely on our platform server
            const verifyRes = await fetch('/api/store/verify-razorpay-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            })

            const verifyData = await verifyRes.json()
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed')
            }

            // Successfully paid, confirm the order on client side
            const token = await confirmOrderPayment(creatorUid, id, product.id, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              fileStoragePath: product.fileUrl,
              fileName: product.fileName,
              fileSize: product.fileSize,
              buyerEmail: trimmedEmail
            })

            setDownloadToken(token)
            setStep('success')
            fireConfetti()
          } catch (verifyErr) {
            console.error('Store payment confirmation error:', verifyErr)
            toast.error(verifyErr instanceof Error ? verifyErr.message : 'Failed to finalize purchase')
            setStep('details')
            setIsSubmitting(false)
          }
        },
        prefill: {
          name: trimmedName,
          email: trimmedEmail,
          contact: cleanPhone
        },
        theme: {
          color: '#FF6B00'
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false)
            setStep('details')
          }
        }
      }

      const win = window as unknown as WindowWithRazorpay
      if (!win.Razorpay) {
        throw new Error('Razorpay SDK failed to initialize correctly.')
      }
      const rzpInstance = new win.Razorpay(options)
      rzpInstance.open()

    } catch (e) {
      console.error(e)
      const message = e instanceof Error ? e.message : 'Failed to process order'
      toast.error(message)
      setIsSubmitting(false)
    }
  }

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FF6B00', '#FFFFFF', '#000000']
    })
  }

  const category = CATEGORY_INFO[product.category] || CATEGORY_INFO.other

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-cream-1 p-6 flex items-center justify-between border-b border-cream-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-cream-3 overflow-hidden shrink-0">
                  {product.coverImageUrl ? (
                    <img src={product.coverImageUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">{category.icon}</div>
                  )}
                </div>
                <div>
                  <h2 className="font-syne font-black text-ink text-sm uppercase tracking-tight line-clamp-1">{product.title}</h2>
                  <p className="text-xs font-bold text-orange uppercase tracking-widest">{formatPrice(product.price)}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white border border-cream-3 flex items-center justify-center text-muted hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8">
              {step === 'details' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Your Name</label>
                        <div className="relative">
                          <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                          <input 
                            type="text"
                            placeholder="e.g. Rahul Sharma"
                            value={formData.name}
                            onChange={e => {
                              setFormData({ ...formData, name: e.target.value })
                              setValidationError(null)
                            }}
                            className="w-full pl-12 pr-4 py-4 bg-cream-1 border-2 border-transparent rounded-[1.25rem] text-sm font-bold focus:border-orange focus:bg-white focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Email Address</label>
                        <div className="relative">
                          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                          <input 
                            type="email"
                            placeholder="e.g. rahul@example.com"
                            value={formData.email}
                            onChange={e => {
                              setFormData({ ...formData, email: e.target.value })
                              setValidationError(null)
                            }}
                            className="w-full pl-12 pr-4 py-4 bg-cream-1 border-2 border-transparent rounded-[1.25rem] text-sm font-bold focus:border-orange focus:bg-white focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Mobile Number</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                          <input 
                            type="tel"
                            placeholder="10-digit mobile number"
                            required
                            value={formData.phone}
                            onChange={e => {
                              setFormData({ ...formData, phone: e.target.value })
                              setValidationError(null)
                            }}
                            className="w-full pl-12 pr-4 py-4 bg-cream-1 border-2 border-transparent rounded-[1.25rem] text-sm font-bold focus:border-orange focus:bg-white focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-3 mt-2 px-1">
                        <input
                          id="email-consent"
                          type="checkbox"
                          checked={emailConsent}
                          onChange={e => setEmailConsent(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded text-orange focus:ring-orange border-cream-3 bg-cream-1 Accent-orange cursor-pointer"
                        />
                        <label htmlFor="email-consent" className="text-[11px] text-muted font-bold cursor-pointer select-none leading-relaxed">
                          Subscribe to creator's newsletter & updates. You can opt out at any time.
                        </label>
                      </div>
                    </div>

                    {validationError && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold leading-relaxed shadow-sm"
                      >
                        <AlertCircle size={18} className="shrink-0 text-red-500" />
                        <span>{validationError}</span>
                      </motion.div>
                    )}

                    {product.price === 0 ? (
                      <>
                        <div className="bg-cream-1 p-5 rounded-3xl border border-cream-3 text-left">
                            <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck className="text-green-500" size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Free Digital Access</span>
                            </div>
                            <p className="text-[10px] text-muted leading-relaxed uppercase tracking-wider">
                                No payment is required. You can download this digital product directly.
                            </p>
                        </div>

                        <button
                          onClick={handleProceed}
                          disabled={isSubmitting}
                          className="w-full py-5 bg-ink text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-orange hover:shadow-xl hover:shadow-orange/20 transition-all disabled:opacity-50 group"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="animate-spin" size={18} />
                              Preparing instant delivery...
                            </>
                          ) : (
                            <>
                              <span>Download for Free</span>
                              <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="bg-green-50 text-green-700 border border-green-200 rounded-3xl p-5 space-y-2 text-left">
                            <div className="flex items-center gap-2 font-black text-[10px] uppercase tracking-widest text-green-700">
                                 <ShieldCheck size={16} className="text-green-500" />
                                 <span>Platform Secured Checkout</span>
                            </div>
                            <p className="text-[11px] text-green-600 font-bold leading-relaxed uppercase tracking-wider text-[10px]">
                                Your payment is processed securely via <strong>Lynksy Platform Gateway</strong>. All purchases are protected and instantly unlocked.
                            </p>
                        </div>

                        <button
                          onClick={handleProceed}
                          disabled={isSubmitting}
                          className="w-full py-5 bg-ink text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-orange hover:shadow-xl hover:shadow-orange/20 transition-all disabled:opacity-50 group"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="animate-spin" size={18} />
                              Settle direct checkout capture...
                            </>
                          ) : (
                            <>
                              <span>Secure Checkout ({formatPrice(product.price)})</span>
                              <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 'processing' && (
                <div className="py-20 text-center space-y-6">
                  <div className="relative inline-block">
                    <Loader2 className="w-16 h-16 text-orange animate-spin" />
                    <ShoppingBag className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-ink" size={24} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-syne font-black text-2xl uppercase tracking-tighter">Verifying Payment</h3>
                    <p className="text-muted text-sm px-10">Please don't close this window or refresh the page while we confirm your order.</p>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6"
                >
                  <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/20">
                    <CheckCircle2 size={40} />
                  </div>
                  
                  <h3 className="font-syne font-black text-3xl text-ink uppercase tracking-tighter mb-2">Order Confirmed! 🎊</h3>
                  <p className="text-muted text-sm mb-8">Thank you, {formData.name}. Your product is ready for download.</p>

                  <div className="bg-cream-1 p-8 rounded-[2.5rem] border border-cream-3 mb-8">
                    <div className="flex items-center justify-center gap-3 mb-6">
                        {category.icon}
                        <span className="text-xs font-black uppercase tracking-widest">{product.fileName}</span>
                    </div>
                    
                    <button
                      onClick={() => window.open(`/download/${downloadToken}`, '_blank')}
                      className="w-full py-4 bg-orange text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-orange/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <Download size={18} />
                      Download Now
                    </button>
                    
                    <p className="mt-4 text-[10px] text-muted uppercase font-black tracking-widest">
                      3 downloads • Valid for 48 hours
                    </p>
                  </div>

                  <p className="text-xs text-muted">
                    We've emailed a receipt and download link to <br/>
                    <span className="font-bold text-ink">{formData.email}</span>
                  </p>

                  <button 
                    onClick={onClose}
                    className="mt-8 text-[11px] font-black uppercase tracking-[0.2em] text-muted hover:text-orange transition-colors"
                  >
                    Continue Shopping
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
