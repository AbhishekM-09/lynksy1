import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { PLAN_LIMITS, canAccess } from '@/constants/plans'
import { PlanLimits, PlanType } from '@/types'

export function usePlan() {
  const user = useAuthStore(s => s.user)
  const openUpgradeModal = useUIStore(s => s.openUpgradeModal)
  const plan = (user?.plan ?? 'FREE') as PlanType
  const limits = PLAN_LIMITS[plan]

  const gate = (feature: string, callback: () => void) => {
    const has = canAccess(plan, feature as keyof PlanLimits)
    if (!has) { openUpgradeModal(feature); return }
    callback()
  }

  return {
    plan, limits,
    can: (feature: keyof typeof limits) => canAccess(plan, feature),
    gate,
    openUpgradeModal,
    isPro: plan === 'PRO' || plan === 'PRO_PLUS',
    isProPlus: plan === 'PRO_PLUS',
    isFree: plan === 'FREE',
  }
}
