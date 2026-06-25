import { useUIStore } from '@/store/uiStore'
import { Modal } from '@/components/ui/Modal'
import { UPGRADE_COPY, PLAN_INFO, planRequiredFor, UpgradeFeature } from '@/constants/plans'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Crown, Check, ArrowRight, Zap, Target, Palette, BarChart3, Mail, ShieldCheck } from 'lucide-react'
import { PlanType } from '@/types'
import { cn } from '@/utils/formatters'
import { motion } from 'motion/react'

export function UpgradeModal() {
  const { upgradeModalOpen, upgradeFeature, closeUpgradeModal } = useUIStore()
  const navigate = useNavigate()

  const copy = (UPGRADE_COPY as Record<UpgradeFeature, { title: string; desc: string; cta: string }>)[(upgradeFeature as UpgradeFeature) || 'maxLinks'] || {
    title: 'Unlock Premium Feature',
    desc: 'Upgrade your plan to get access to advanced creator tools.',
    cta: 'View Plans'
  }

  const requiredPlan = planRequiredFor(upgradeFeature as UpgradeFeature) as PlanType
  const info = (PLAN_INFO as Record<PlanType, { label: string; price: number; color: string; icon: string; badge: string }>)[requiredPlan]

  const handleUpgrade = () => {
    closeUpgradeModal()
    navigate('/pricing')
  }

  // Plan-specific benefits
  const proBenefits = [
    { icon: <Palette size={16} />, text: '8+ Premium Themes' },
    { icon: <BarChart3 size={16} />, text: 'Advanced Analytics (Locations)' },
    { icon: <Target size={16} />, text: 'Link Scheduling & Goals' },
    { icon: <ShieldCheck size={16} />, text: 'Remove "Lynksy" Branding' }
  ]

  const proPlusBenefits = [
    { icon: <Sparkles size={16} />, text: 'Premium Animations' },
    { icon: <Mail size={16} />, text: 'Direct Email Collection' },
    { icon: <Zap size={16} />, text: 'Custom Domain (abhi.com)' },
    { icon: <Check size={16} />, text: '0% Transaction Fees' }
  ]

  const benefits = requiredPlan === 'PRO_PLUS' ? proPlusBenefits : proBenefits

  return (
    <Modal isOpen={upgradeModalOpen} onClose={closeUpgradeModal} title="">
      <div className="text-center -mt-4">
        {/* Header Visual */}
        <div className="relative mb-8">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto relative z-10 shadow-2xl",
              requiredPlan === 'PRO_PLUS' ? "bg-gradient-to-tr from-indigo-600 to-purple-400" : "bg-gradient-to-tr from-pink-600 to-rose-400"
            )}
          >
            {requiredPlan === 'PRO_PLUS' ? <Crown className="text-white" size={40} /> : <Zap className="text-white" size={40} />}
          </motion.div>
          
          <div className={cn(
            "absolute inset-0 blur-3xl opacity-20 -z-0 scale-150",
            requiredPlan === 'PRO_PLUS' ? "bg-indigo-600" : "bg-pink-600"
          )} />
        </div>
        
        <h2 className="text-3xl font-black text-ink mb-3 font-syne tracking-tight">{copy.title}</h2>
        <p className="text-muted text-sm px-6 mb-8 font-medium leading-relaxed">{copy.desc}</p>
        
        {/* Plan Spotlight Card */}
        <div className={cn(
          "rounded-[32px] p-6 mb-8 text-left relative overflow-hidden ring-1 ring-inset",
          requiredPlan === 'PRO_PLUS' 
            ? "bg-indigo-950 ring-indigo-500/20" 
            : "bg-pink-950 ring-pink-500/20"
        )}>
          {/* Animated Background Element */}
          <motion.div 
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.2, 1] 
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className={cn(
              "absolute -top-1/2 -right-1/4 w-full h-full opacity-10 blur-2xl rounded-full",
              requiredPlan === 'PRO_PLUS' ? "bg-indigo-400" : "bg-pink-400"
            )}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-inner",
                  requiredPlan === 'PRO_PLUS' ? "bg-white text-indigo-900" : "bg-white text-pink-900"
                )}>
                  {info.icon}
                </div>
                <div>
                   <h3 className="text-lg font-black text-white leading-tight">{info.label} Plan</h3>
                   <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Recommended for you</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-white text-lg font-black tracking-tighter">₹{info.price}</span>
                <span className="text-white/40 text-[10px] font-bold">/mo</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">What's included:</p>
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                    requiredPlan === 'PRO_PLUS' ? "bg-white/10 text-indigo-300" : "bg-white/10 text-pink-300"
                  )}>
                    {b.icon}
                  </div>
                  <span className="text-sm text-white/70 font-medium">{b.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button 
            onClick={handleUpgrade} 
            className={cn(
              "group w-full py-5 px-8 rounded-3xl text-sm font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95",
              requiredPlan === 'PRO_PLUS' 
                ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20" 
                : "bg-pink-600 hover:bg-pink-700 shadow-pink-600/20"
            )}
          >
            {copy.cta}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
          
          <button 
            onClick={closeUpgradeModal} 
            className="py-4 text-xs font-black uppercase tracking-widest text-muted hover:text-ink transition-all"
          >
            Not right now
          </button>
        </div>

        <p className="mt-6 text-[10px] text-muted-2 px-8 font-medium italic">
          Join 50,000+ creators growth today. Cancel anytime.
        </p>
      </div>
    </Modal>
  )
}
