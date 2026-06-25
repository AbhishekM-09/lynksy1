import { cn } from '@/utils/formatters'

interface SkeletonProps {
  className?: string
  count?: number
}

export function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn('shimmer rounded-xl', className)} />
      ))}
    </>
  )
}
