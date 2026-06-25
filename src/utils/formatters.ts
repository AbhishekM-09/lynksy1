import { formatDistanceToNow } from 'date-fns'
import { Timestamp } from 'firebase/firestore'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

export const getLuminance = (hex: string): number => {
  const color = hex.startsWith('#') ? hex.slice(1) : hex
  const r = parseInt(color.slice(0, 2), 16) / 255
  const g = parseInt(color.slice(2, 4), 16) / 255
  const b = parseInt(color.slice(4, 6), 16) / 255

  const f = (n: number) => n <= 0.03928 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

export const isLightColor = (hex: string): boolean => {
  if (!hex || hex === 'transparent') return true
  try {
    return getLuminance(hex) > 0.5
  } catch {
    return true
  }
}

export const formatCount = (n: number): string => {
  if (n >= 10_000_000) return `${(n/10_000_000).toFixed(1)}Cr`
  if (n >= 100_000)    return `${(n/100_000).toFixed(1)}L`
  if (n >= 1_000)      return `${(n/1_000).toFixed(1)}K`
  return String(n)
}

export const formatINR = (n: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

export const timeAgo = (ts: Timestamp | null): string => {
  if (!ts) return ''
  try { return formatDistanceToNow(ts.toDate(), { addSuffix: true }) }
  catch { return '' }
}

export const formatDate = (ts: Timestamp | null): string => {
  if (!ts) return ''
  try { return ts.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return '' }
}

export const getFallbackAvatarGradient = (seed: string): string => {
  const gradients = [
    'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',   // Coral Sunset
    'linear-gradient(135deg, #4E65FF 0%, #92EFFD 100%)',   // Ocean Breeze
    'linear-gradient(135deg, #7F00FF 0%, #E100FF 100%)',   // Royal Purple
    'linear-gradient(135deg, #11998E 0%, #38EF7D 100%)',   // Jungle Emerald
    'linear-gradient(135deg, #F857A6 0%, #FF5858 100%)',   // Pink Tulip
    'linear-gradient(135deg, #3A7BD5 0%, #3A6073 100%)',   // Steel Blue
    'linear-gradient(135deg, #FF9966 0%, #FF5E62 100%)',   // Neon Orange
    'linear-gradient(135deg, #EC53B0 0%, #A31D8F 100%)',   // Orchid Magic
    'linear-gradient(135deg, #43C6AC 0%, #191654 100%)',   // Aurora Teal
    'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)'    // Sky Blue
  ]
  if (!seed) return gradients[0]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % gradients.length
  return gradients[index]
}

export const getFallbackAvatarInitials = (name: string): string => {
  if (!name || !name.trim()) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  const first = parts[0].charAt(0)
  const last = parts[parts.length - 1].charAt(0)
  return (first + last).toUpperCase()
}

