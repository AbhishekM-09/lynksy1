import React from 'react'
import { Lock } from 'lucide-react'
import { usePlan } from '@/hooks/usePlan'
import { PLAN_INFO } from '@/constants/plans'
import { planRequiredFor } from '@/constants/plans'

import { PlanLimits, PlanType } from '@/types'

interface PlanGateProps {
  feature: keyof PlanLimits
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PlanGate({ feature, children, fallback }: PlanGateProps) {
  const { can, gate } = usePlan()
  const hasAccess = can(feature)

  if (hasAccess) return <>{children}</>

  if (fallback) return <>{fallback}</>

  const requiredPlan = planRequiredFor(feature)
  const planName = (PLAN_INFO as Record<PlanType, { label: string }>)[requiredPlan].label

  return (
    <div className="relative group">
      <div className="filter blur-[1px] pointer-events-none opacity-40">
        {children}
      </div>
      <div className="lock-overlay">
        <div className="bg-white p-3 rounded-full shadow-lg mb-2">
          <Lock size={20} className="text-orange" />
        </div>
        <p className="text-xs font-bold text-ink mb-2">Requires {planName}</p>
        <button
          onClick={() => gate(feature, () => {})}
          className="btn-primary btn-sm"
        >
          Upgrade
        </button>
      </div>
    </div>
  )
}
