import type { PlanType, PlanLimits, Link } from '@/types'

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    maxLinks: 5,
    aiPerMonth: 3,
    maxAiBios: 3,
    analytics: 'basic',
    canUseUPI: false,
    transactionFee: null,
    canCustomDomain: false,
    canCustomThumbnails: false,
    canRemoveBranding: false,
    canSchedule: false,
    canSellProducts: false,
    canCollectEmails: false,
    themes: ['minimal', 'saffron'],
    premiumThemes: false,
    ultraPremiumThemes: false,
    premiumInsight: false,
    analyticsHistory: false,
    customBranding: false,
    maxProducts: 0,
  },
  PRO: {
    maxLinks: 999,
    aiPerMonth: 50,
    maxAiBios: 10,
    analytics: 'medium',
    canUseUPI: true,
    transactionFee: 0,
    canCustomDomain: false,
    canCustomThumbnails: true,
    canRemoveBranding: true,
    canSchedule: true,
    canSellProducts: true,
    canCollectEmails: true,
    themes: ['minimal','saffron','midnight','bloom','creator','gradient','ocean','forest'],
    premiumThemes: true,
    ultraPremiumThemes: false,
    premiumInsight: true,
    analyticsHistory: true,
    customBranding: true,
    maxProducts: 10,
  },
  PRO_PLUS: {
    maxLinks: 999,
    aiPerMonth: 999,
    maxAiBios: 999,
    analytics: 'advanced',
    canUseUPI: true,
    transactionFee: 0,
    canCustomDomain: true,
    canCustomThumbnails: true,
    canRemoveBranding: true,
    canSchedule: true,
    canSellProducts: true,
    canCollectEmails: true,
    themes: 'all',
    premiumThemes: true,
    ultraPremiumThemes: true,
    premiumInsight: true,
    analyticsHistory: true,
    customBranding: true,
    maxProducts: 999,
  },
}

export const PLAN_INFO = {
  FREE:     { label: 'Free',  price: 0,   color: '#9A8F84', icon: 'Free', badge: 'Free' },
  PRO:      { label: 'Pro',   price: 199, color: '#FF6B00', icon: 'Pro', badge: 'Pro' },
  PRO_PLUS: { label: 'Pro+',  price: 399, color: '#6B3FA0', icon: 'Pro+', badge: 'Pro+' },
}

// Helper: get limits for any plan
export const getPlanLimits = (plan: PlanType): PlanLimits => PLAN_LIMITS[plan]

// Helper: can user access a feature?
export const canAccess = (plan: PlanType, feature: keyof PlanLimits): boolean => {
  const limits = PLAN_LIMITS[plan]
  const val = limits[feature]
  if (typeof val === 'boolean') return val
  if (typeof val === 'number')  return val > 0
  if (Array.isArray(val))       return val.length > 0
  if (val === 'all')            return true
  if (val === null)             return false
  return false
}

// Helper: which plan unlocks a feature?
export const planRequiredFor = (feature: keyof PlanLimits): PlanType => {
  if (feature === 'maxProducts') return 'PRO_PLUS'
  if (canAccess('FREE', feature)) return 'FREE'
  if (canAccess('PRO', feature))  return 'PRO'
  return 'PRO_PLUS'
}

// Helper: Safely get epoch time in milliseconds from any date/timestamp format
export const safeTimeToMillis = (val: unknown): number => {
  if (!val) return 0
  const obj = val as { toMillis?: () => number; toDate?: () => { getTime: () => number } }
  if (typeof obj.toMillis === 'function') return obj.toMillis()
  if (typeof obj.toDate === 'function') {
    const d = obj.toDate()
    return d ? d.getTime() : 0
  }
  if (val instanceof Date) return val.getTime()
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? 0 : d.getTime()
  }
  return 0
}

// Helper: Filter links based on plan limits
export const filterLinksByPlan = (links: Link[], plan: PlanType): Link[] => {
  const safePlan = plan || 'FREE'
  const limits = PLAN_LIMITS[safePlan] || PLAN_LIMITS['FREE']
  
  return (links || [])
    .filter(link => {
      // Filter by type
      if ((link.type === 'UPI' || link.type === 'upi_tip') && !limits.canUseUPI) return false
      if (link.type === 'FORM' && !limits.canCollectEmails) return false
      
      // Filter by scheduled links (if not allowed, only show if no schedule or currently active)
      if (!limits.canSchedule && (link.showFrom || link.showUntil)) {
        const now = Date.now()
        const fromMs = link.showFrom ? safeTimeToMillis(link.showFrom) : 0
        const untilMs = link.showUntil ? safeTimeToMillis(link.showUntil) : 0
        
        if (fromMs && fromMs > now) return false
        if (untilMs && untilMs < now) return false
      }
      
      return true
    })
    .slice(0, limits.maxLinks)
}

export type UpgradeFeature = keyof typeof UPGRADE_COPY

// Plan upgrade copy
export const UPGRADE_COPY = {
  canUseUPI:          { title: 'UPI Payments', desc: 'Start earning with UPI in Pro', cta: 'Upgrade to Pro' },
  canRemoveBranding:  { title: 'Remove Branding', desc: 'Upgrade to remove branding', cta: 'Upgrade to Pro' },
  canSchedule:        { title: 'Link Scheduling', desc: 'Schedule links to go live automatically', cta: 'Upgrade to Pro' },
  canCustomDomain:    { title: 'Custom Domain', desc: 'Use your own domain name (e.g. abhi.com)', cta: 'Go Pro+' },
  canCustomThumbnails:  { title: 'Link Thumbnails', desc: 'Upload custom images for each link', cta: 'Upgrade to Pro' },
  canSellProducts:    { title: 'Sell Products', desc: 'Sell digital products right from your profile with up to 10 items in Pro', cta: 'Upgrade to Pro' },
  canCollectEmails:   { title: 'Email Collection', desc: 'Build your email list', cta: 'Upgrade to Pro' },
  maxLinks:           { title: 'Unlimited Links', desc: 'Unlimited links. Unlimited growth.', cta: 'Upgrade to Pro' },
  aiPerMonth:         { title: 'More AI Generations', desc: 'Get more AI-powered content ideas', cta: 'Upgrade' },
  premiumThemes:      { title: 'Premium Themes', desc: 'Unlock vibrant and high-res themes', cta: 'Upgrade to Pro' },
  ultraPremiumThemes: { title: 'Premium Plus Themes', desc: 'Exclusive aesthetic themes for top creators', cta: 'Upgrade to Pro+' },
  premiumInsight:     { title: 'Premium Insights', desc: 'See locations and device types', cta: 'Upgrade to Pro' },
  analyticsHistory:   { title: 'Analytics History', desc: 'Track performance over months', cta: 'Upgrade to Pro' },
  customBranding:     { title: 'Custom Branding', desc: 'Unlock advanced customization options', cta: 'Upgrade to Pro' },
  maxProducts:        { title: 'Unlimited Products', desc: 'Sell more than 10 products with zero platform fees and no limits', cta: 'Go Pro+' },
}
