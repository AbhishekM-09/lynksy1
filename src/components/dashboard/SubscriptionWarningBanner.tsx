import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, Clock, X, ArrowUpRight } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Link } from 'react-router-dom'

export function SubscriptionWarningBanner() {
  const { user } = useAuthStore()
  const [dismissed, setDismissed] = useState(false)

  if (!user || dismissed) return null

  const now = new Date()
  const expiryDate = user.expiryDate?.toDate() || user.planExpiresAt?.toDate()
  
  let daysLeft = null
  let isExpired = false
  
  if (expiryDate) {
    const diffTime = expiryDate.getTime() - now.getTime()
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    isExpired = diffTime <= 0
  }

  // Determine active states for the banner
  const isExpiringSoon = user.plan !== 'FREE' && daysLeft !== null && daysLeft <= 3 && daysLeft >= 0
  
  // A standard free user who just registered has null planExpiresAt and null planStartedAt.
  // We only show the expired banner if they have a plan that is not FREE, OR if they are currently FREE
  // but previously had a paid plan (indicated by having planExpiresAt or planStartedAt).
  const hasExpired = (user.subscriptionStatus === 'EXPIRED' || isExpired) && (
    user.plan !== 'FREE' || (user.plan === 'FREE' && (user.planExpiresAt || user.planStartedAt))
  )

  if (!isExpiringSoon && !hasExpired) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="w-full relative z-40 border-b border-stone-800 font-sans bg-stone-950 text-stone-100 transition-colors shadow-m"
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-stone-800 text-stone-300">
              {hasExpired ? <AlertTriangle size={13} /> : <Clock size={13} />}
            </div>
            
            <p className="text-xs sm:text-sm font-normal text-stone-300 leading-normal">
              {hasExpired ? (
                <>
                  <span className="font-bold text-stone-100 mr-1.5 bg-stone-800 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">Expired</span>
                  <span>Subscription expired. High-tier features are paused. Please renew to resume.</span>
                </>
              ) : (
                <>
                  <span className="font-bold text-stone-100 mr-1.5 bg-stone-800 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">Renew Soon</span>
                  <span>Plan expires in <span className="font-bold text-white">{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</span>. Renew to preserve uninterrupted service.</span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Link
              to="/dashboard/settings"
              className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-bold bg-white text-stone-950 hover:bg-stone-200 transition-all hover:scale-[1.02] shadow-sm"
            >
              {hasExpired ? 'Renew Now' : 'Renew Plan'} <ArrowUpRight size={12} />
            </Link>

            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-stone-400 hover:text-white transition-colors rounded-full hover:bg-white/5"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
