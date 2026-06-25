import React, { useEffect, useState } from 'react'
import { LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/utils/formatters'

interface StatCardProps {
  label: string
  value: number
  trend?: number
  prefix?: string
  suffix?: string
  icon: LucideIcon
  isLoading?: boolean
  description?: string
  isAlert?: boolean
}

export function StatCard({ label, value, trend, prefix = '', suffix = '', icon: Icon, isLoading, description, isAlert }: StatCardProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (isLoading) return

    let startTimestamp: number | null = null
    const duration = 1200 // 1.2s smooth animation
    const startValue = 0
    const endValue = value

    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      
      // Standard Ease-out Quad formula
      const easeProgress = progress * (2 - progress)
      
      setCount(Math.floor(startValue + easeProgress * (endValue - startValue)))

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      }
    }

    animationFrameId = requestAnimationFrame(step)
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [value, isLoading])

  const isPositive = (trend || 0) >= 0

  if (isLoading) {
    return <Skeleton className="h-[140px] rounded-[24px]" />
  }

  return (
    <div className={cn(
      "card bg-white p-6 sm:p-7 hover:border-[#6366F1]/50 transition-all group h-full flex flex-col justify-between",
      isAlert ? "border-red-400 bg-red-50/5 ring-1 ring-red-400/20 shadow-red-50" : ""
    )}>
      <div>
        <div className="flex items-center justify-between mb-5">
          <span className={cn(
            "text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-lg px-2.5 py-1.5",
            isAlert ? "text-red-600 bg-red-50 border border-red-100" : "text-ink-3 bg-cream"
          )}>{label}</span>
          <div className={cn(
            "p-2 sm:p-2.5 rounded-xl transition-all shadow-sm",
            isAlert 
              ? "bg-red-50 text-red-500 group-hover:bg-red-500 group-hover:text-white" 
              : "bg-cream text-ink group-hover:bg-[#6366F1] group-hover:text-white"
          )}>
            <Icon size={18} className="sm:w-5 sm:h-5" />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <h3 className={cn(
            "text-2xl sm:text-3xl font-black font-syne tracking-tight flex items-baseline gap-1.5",
            isAlert ? "text-red-500" : "text-ink"
          )}>
            {prefix}{count.toLocaleString()}{suffix}
            {isAlert && <span className="text-[10px] font-bold text-red-500 uppercase tracking-tight">⚠️ Over Limit</span>}
          </h3>
          
          {trend !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded-md",
                isPositive ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50"
              )}>
                {isPositive ? '+' : ''}{trend}%
              </span>
              <span className="text-[9px] sm:text-[10px] text-muted font-bold uppercase tracking-tighter">from last period</span>
            </div>
          )}
        </div>
      </div>

      {description && (
        <div className={cn(
          "mt-4 pt-3 border-t text-[10px] leading-relaxed font-medium",
          isAlert ? "border-red-100 text-red-500/80" : "border-cream-2 text-muted"
        )}>
          {description}
        </div>
      )}
    </div>
  )
}
