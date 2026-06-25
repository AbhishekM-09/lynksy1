import { Link, useLocation } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { motion } from 'motion/react'

export default function PaymentFailed() {
  const location = useLocation()
  const state = location.state || {}
  const planId = state.planId || 'PRO'
  const error = state.error || 'Payment was dismissed or declined.'

  return (
    <div id="payment-failed-screen" className="min-h-screen bg-cream flex flex-col justify-center items-center p-6 text-center select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-white border border-cream-3 rounded-[32px] p-8 shadow-xl shadow-orange/5 space-y-6 flex flex-col items-center"
      >
        <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
          <AlertCircle size={40} className="stroke-[1.5]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-black uppercase tracking-tight text-ink">Payment Failed</h1>
          <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto">
            We encountered an issue while processing your {planId === 'PRO' ? 'Pro' : 'Pro+'} plan subscription. No money was charged.
          </p>
        </div>

        <div className="w-full bg-cream rounded-2xl p-4.5 text-left text-xs font-mono space-y-2">
          <p className="font-bold text-rose-600 uppercase tracking-wider text-[10px]">Failure Reason:</p>
          <p className="text-muted leading-relaxed">{error}</p>
        </div>

        <div className="w-full flex">
          <Link
            to="/pricing"
            className="w-full flex items-center justify-center gap-2 bg-black text-white font-black text-xs uppercase tracking-widest py-3 rounded-2xl hover:bg-zinc-900 transition-all active:scale-[0.98]"
          >
            <ArrowLeft size={14} />
            Back to Pricing
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
