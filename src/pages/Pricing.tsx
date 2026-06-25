import { useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, Heart, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { SEO } from '@/components/common/SEO'
import { useState } from 'react'
import { motion } from 'motion/react'
import { useAuthStore } from '@/store/authStore'
import { updateUser, addPaymentHistory } from '@/firebase/firestore'
import { auth } from '@/firebase/config'
import { Timestamp } from 'firebase/firestore'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/formatters'
import { PlanType } from '@/types'

export default function Pricing() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const { user, updateUserField } = useAuthStore()
  const navigate = useNavigate()

  const handleUpgrade = async (planId: PlanType) => {
    if (!user) {
      navigate(`/signup?plan=${planId}`)
      return
    }

    if (user.plan === planId) {
      toast.success(`You are already on the ${planId} plan!`)
      return
    }

    if (planId === 'FREE') {
      setLoadingPlan(planId)
      try {
        await updateUser(user.uid, {
          plan: 'FREE',
          themeId: 'snow-white',
          planExpiresAt: null,
          planStartedAt: null,
          subscriptionStatus: 'EXPIRED'
        })
        updateUserField({
          plan: 'FREE',
          themeId: 'snow-white',
          planExpiresAt: null,
          planStartedAt: null,
          subscriptionStatus: 'EXPIRED'
        })
        toast.success("You've successfully switched to the Free plan.")
        navigate('/dashboard')
      } catch (error) {
        console.error('Update error:', error)
        toast.error('Something went wrong. Please try again.')
      } finally {
        setLoadingPlan(null)
      }
      return
    }

    // Direct instant upgrade for testing
    setLoadingPlan(planId)
    const loadingToast = toast.loading(`Upgrading your plan to ${planId} (Test Mode)...`)
    
    try {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) {
        toast.dismiss(loadingToast)
        toast.error('You must be signed in to upgrade your plan.')
        return
      }

      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      
      await updateUser(firebaseUser.uid, {
        plan: planId,
        planType: 'Monthly',
        planStartedAt: Timestamp.fromDate(new Date()),
        planExpiresAt: Timestamp.fromDate(expires),
        purchaseDate: Timestamp.fromDate(new Date()),
        expiryDate: Timestamp.fromDate(expires),
        subscriptionStatus: 'ACTIVE'
      })

      await addPaymentHistory({
        userId: firebaseUser.uid,
        email: firebaseUser.email || '',
        planPurchased: planId,
        amountPaid: planId === 'PRO' ? 199 : 399,
        date: Timestamp.fromDate(new Date()),
        createdAt: Timestamp.fromDate(new Date()),
        paymentId: 'TEST_' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        status: 'SUCCESS'
      })

      updateUserField({
        plan: planId,
        planType: 'Monthly',
        planStartedAt: Timestamp.fromDate(new Date()),
        planExpiresAt: Timestamp.fromDate(expires),
        purchaseDate: Timestamp.fromDate(new Date()),
        expiryDate: Timestamp.fromDate(expires),
        subscriptionStatus: 'ACTIVE'
      })

      toast.dismiss(loadingToast)
      toast.success(`Success! testing upgrade to ${planId}!`)
      navigate('/payment-success', {
        state: {
          planId,
          paymentId: 'TEST_PLAN'
        }
      })
    } catch (e: unknown) {
      toast.dismiss(loadingToast)
      console.error(e)
      toast.error('Failed to execute test upgrade.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const plans = [
    {
      id: 'FREE' as const,
      name: 'Free',
      price: 0,
      desc: 'Everything you need to get started.',
      features: [
        { text: 'Up to 5 active links', included: true },
        { text: '2 basic theme templates', included: true },
        { text: 'Standard Indian fonts', included: true },
        { text: 'Basic analytics (7 days)', included: true },
        { text: 'WhatsApp button integration', included: true },
        { text: 'Limited AI tool usage', included: true },
        { text: 'Lynksy branding tag', included: true },
        { text: 'Remove Lynksy branding', included: false },
        { text: 'Accept UPI tips (Tip Jar)', included: false },
        { text: 'Lead collection (Email list)', included: false },
        { text: 'Sell digital products (Shop)', included: false },
      ],
      btn: 'Get Started Free',
      path: '/signup'
    },
    {
      id: 'PRO' as const,
      name: 'Pro',
      price: 199,
      desc: 'Build a powerful professional brand.',
      featured: true,
      features: [
        { text: 'Unlimited active links', included: true },
        { text: '8 premium theme templates', included: true },
        { text: 'Advanced analytics (30 days)', included: true },
        { text: 'Remove Lynksy branding', included: true },
        { text: 'Accept UPI tips (0% fee)', included: true },
        { text: 'Lead collection (Email list)', included: true },
        { text: '50 AI generations / mo', included: true },
        { text: 'Custom link thumbnails', included: true },
        { text: 'Priority email support', included: true },
        { text: 'Sell digital products (Up to 10)', included: true },
        { text: 'Digital Store Platform Fee: 0%', included: true },
        { text: 'Custom branded domain', included: false },
        { text: 'URL shortener feature', included: false },
      ],
      btn: 'Go Pro',
      path: '/signup?plan=PRO'
    },
    {
      id: 'PRO_PLUS' as const,
      name: 'Pro+',
      price: 399,
      desc: 'Scale your creator business for real.',
      features: [
        { text: 'Everything in Pro plan', included: true },
        { text: '20+ luxury & animated themes', included: true },
        { text: 'Full lifetime analytics', included: true },
        { text: 'Unlimited AI tool usage', included: true },
        { text: 'Accept UPI tips (0% fee)', included: true },
        { text: 'Sell digital products (Unlimited)', included: true },
        { text: 'Digital Store Platform Fee: 0%', included: true },
        { text: 'Lead collection (Email list)', included: true },
        { text: 'Connect custom domain', included: true },
        { text: 'Advanced link scheduling', included: true },
        { text: 'Verified profile badge', included: true },
        { text: 'URL shortener feature', included: true },
      ],
      btn: 'Upgrade to Pro+',
      path: '/signup?plan=PRO_PLUS'
    }
  ]

  return (
    <div className="bg-cream min-h-screen">
      <SEO 
        title="Plans & Pricing"
        description="Choose the perfect plan for your creator journey. Start for free or unlock premium themes, UPI tip jar, and advanced analytics with our Pro and Pro+ plans."
        keywords="pricing, subscription, pro features, creator tools india"
      />
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-6xl font-extrabold font-syne text-ink mt-2 mb-6">Start free. Grow with us.</h2>
          <p className="text-muted text-sm max-w-md mx-auto">
            Choose the perfect subscription plan to build your custom bio links page and start selling products.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch pt-12">
          {plans.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "relative flex flex-col p-8 rounded-[32px] border-2 transition-all",
                p.featured 
                  ? 'bg-ink text-white border-orange shadow-orange lg:scale-105 z-10' 
                  : 'bg-white border-cream-3 shadow-card'
              )}
            >
              {p.featured && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Best Value
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold font-syne mb-2">{p.name}</h3>
                <p className={`${p.featured ? 'text-white/60' : 'text-muted'} text-sm`}>{p.desc}</p>
              </div>

              <div className="mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black font-syne">₹{p.price}</span>
                  <span className={`${p.featured ? 'text-white/60' : 'text-muted'} text-sm font-bold`}>/ month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm">
                    {f.included ? (
                      <CheckCircle2 className="text-orange" size={18} />
                    ) : (
                      <XCircle className="text-muted/40" size={18} />
                    )}
                    <span className={f.included ? '' : 'text-muted/40'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleUpgrade(p.id)}
                disabled={loadingPlan !== null}
                className={cn(
                  "w-full py-4 text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2",
                  p.featured 
                    ? 'bg-orange text-white hover:bg-orange-dark shadow-lg shadow-orange/20' 
                    : 'bg-cream-3 text-ink hover:bg-cream-4'
                )}
              >
                {loadingPlan === p.id ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  user?.plan === p.id ? 'Current Plan' : p.btn
                )}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <p className="text-muted text-sm mb-6">Need a custom plan for your agency? Let's talk.</p>
          <a href="mailto:hello@lynksy.app" className="text-orange font-bold hover:underline">Contact Sales →</a>
        </div>
      </div>

      {/* Footer Minimal */}
      <footer className="p-12 text-center text-muted text-xs border-t border-cream-3 mt-24">
        <p className="flex items-center justify-center gap-2">© 2024 Lynksy Platform. Built with <Heart size={12} className="text-red-500 fill-red-500" /> in India</p>
      </footer>

    </div>
  )
}
