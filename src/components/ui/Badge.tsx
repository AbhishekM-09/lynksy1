import React from 'react'
import { cn } from '@/utils/formatters'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'orange' | 'green' | 'red' | 'blue' | 'purple' | 'gray' | 'amber'
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ children, variant = 'gray', size = 'md', className }: BadgeProps) {
  const variants = {
    orange: 'bg-orange-light text-orange',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-700',
    gray: 'bg-gray-100 text-gray-700',
    amber: 'bg-amber-50 text-amber-700',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-bold rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  )
}
