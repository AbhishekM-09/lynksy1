import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { motion } from 'motion/react'

export default function PaymentSuccess() {
  const location = useLocation()
  const state = location.state || {}
  const planId = state.planId || 'PRO'
  const paymentId = state.paymentId || 'PAY-N/A'

  return (
    <div id="payment-success-screen" className="min-h-screen bg-cream flex flex-col justify-center items-center p-6 text-center select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-white border border-cream-3 rounded-[32px] p-8 shadow-xl shadow-orange/5 space-y-6 flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <CheckCircle size={40} className="stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black uppercase tracking-tight text-ink">Payment Successful!</h1>
          <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
            Your premium {planId === 'PRO' ? 'Pro' : 'Pro+'} features have been successfully unlocked on your Lynksy profile.
          </p>
        </div>

        <div className="w-full bg-cream rounded-2xl p-4.5 space-y-2.5 text-left text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-muted">Subscription:</span>
            <span className="font-bold text-ink">{planId === 'PRO' ? 'Lynksy Pro' : 'Lynksy Pro+'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Price:</span>
            <span className="font-bold text-ink">₹{planId === 'PRO' ? '199' : '399'}/month</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Payment ID:</span>
            <span className="font-bold text-ink text-right break-all max-w-[180px]">{paymentId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Cycle:</span>
            <span className="font-bold text-ink">30 Days (Auto-Expires)</span>
          </div>
        </div>

        <div className="w-full">
          <Link
            to="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-orange text-white font-black text-xs uppercase tracking-widest py-3 rounded-2xl hover:bg-orange-600 transition-all active:scale-[0.98]"
          >
            Go to Dashboard
            <ArrowRight size={14} />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
