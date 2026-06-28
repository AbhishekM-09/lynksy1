import { PLAN_LIMITS, UPGRADE_COPY } from '@/constants/plans'
import type { PlanType, User } from '@/types'

export const checkFeature = (plan: PlanType, feature: keyof typeof PLAN_LIMITS['FREE']) => {
  const limits = PLAN_LIMITS[plan]
  return limits[feature as keyof typeof limits]
}

export const isLinkLimitReached = (plan: PlanType, count: number): boolean =>
  count >= PLAN_LIMITS[plan].maxLinks

export const isAiLimitReached = (plan: PlanType, used: number): boolean =>
  PLAN_LIMITS[plan].aiPerMonth !== 999 && used >= PLAN_LIMITS[plan].aiPerMonth

export const getUpgradeCopy = (feature: string) =>
  UPGRADE_COPY[feature as keyof typeof UPGRADE_COPY] ??
  { title: 'Upgrade Required', desc: 'Upgrade your plan to unlock this feature', cta: 'Upgrade' }

import { Timestamp } from 'firebase/firestore'

export const formatPlanExpiry = (expiresAt: Timestamp | Date | null): string => {
  if (!expiresAt) return 'Never expires'
  const date = expiresAt instanceof Timestamp ? expiresAt.toDate() : (expiresAt instanceof Date ? expiresAt : new Date(expiresAt as string | number))
  const days = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Expired'
  if (days === 0) return 'Expires today'
  if (days === 1) return 'Expires tomorrow'
  return `Expires in ${days} days`
}

export const buildUrlWithUTM = (url: string, utm: { source?: string; medium?: string; campaign?: string }): string => {
  if (!utm.source && !utm.medium && !utm.campaign) return url
  try {
    const u = new URL(url)
    if (utm.source)   u.searchParams.set('utm_source',   utm.source)
    if (utm.medium)   u.searchParams.set('utm_medium',   utm.medium)
    if (utm.campaign) u.searchParams.set('utm_campaign', utm.campaign)
    return u.toString()
  } catch { return url }
}

export const getPublicUrl = (user: Partial<User> | null) => {
  if (!user?.username) return '/'
  return `/${user.username}`
}

export const getUserUrls = (user: Partial<User> | null) => {
  const plan = user?.plan || 'FREE'
  const host = window.location.host
  const origin = window.location.origin
  const username = user?.username || ''
  
  const path = getPublicUrl(user)
  let actualUrl = `${origin}${path}`
  
  const isProduction = !host.includes('localhost') && 
                       !host.includes('run.app') && 
                       !host.includes('aistudio') && 
                       !host.includes('google') &&
                       !host.includes('.onrender.com')
  const baseHost = 'lynksy.app'
  
  // Pretty labels for UI (branding)
  let displayLabel = `${host}${path}`
  
  if (plan === 'PRO_PLUS' && user?.customDomain) {
    displayLabel = user.customDomain
    if (isProduction) {
      actualUrl = `https://${user.customDomain}`
    } else {
      // In dev environment, we use a query param to simulate the custom domain
      actualUrl = `${origin}${path}?domain=${user.customDomain}`
    }
  } else if (plan === 'PRO' || plan === 'PRO_PLUS') {
    displayLabel = `${username}.${baseHost}`
    if (isProduction) {
      actualUrl = `https://${displayLabel}`
    } else {
      // actualUrl remains origin + path so it's clickable in dev environment
    }
  } else {
    // FREE plan: always show the lynksy.app/username format
    displayLabel = `${baseHost}/${username}`
  }

  return {
    actual: actualUrl,
    display: displayLabel,
    path: path,
    isCustom: plan !== 'FREE'
  }
}
