import React, { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/utils/formatters'

export type VerifiedBadgeStyle = 'orange' | 'dark-gold' | 'glass' | 'outline' | 'dark' | 'matte-emerald' | 'matte-rose' | 'matte-cobalt' | 'matte-purple' | 'matte-ruby'

const getWavyPath = (cx: number, cy: number, rPeak: number, rValley: number, peaks: number = 12) => {
  const points = []
  const steps = peaks * 2
  for (let i = 0; i < steps; i++) {
    const angle = (i * Math.PI) / peaks - Math.PI / 2
    const r = i % 2 === 0 ? rPeak : rValley
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    })
  }
  
  let d = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`
  for (let i = 0; i < steps; i++) {
    const next = points[(i + 1) % steps]
    const midAngle = ((i + 0.5) * Math.PI) / peaks - Math.PI / 2
    const rControl = (rPeak + rValley) / 2 + (rPeak - rValley) * 0.15
    const ctrlX = cx + rControl * Math.cos(midAngle)
    const ctrlY = cy + rControl * Math.sin(midAngle)
    d += ` Q ${ctrlX.toFixed(2)},${ctrlY.toFixed(2)} ${next.x.toFixed(2)},${next.y.toFixed(2)}`
  }
  d += ' Z'
  return d
}

interface VerifiedBadgeProps {
  user?: {
    plan?: string
    isVerified?: boolean
    status?: string
    verifiedBadgeStyle?: VerifiedBadgeStyle
  } | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
  forceShow?: boolean
}

export function VerifiedBadge({ 
  user, 
  size = 'md', 
  className,
  forceShow = false 
}: VerifiedBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  // Verify eligibility: Must be Pro Plus, active, and verified
  const isEligible = forceShow || (user && (
    user.plan === 'PRO_PLUS' && 
    user.isVerified === true &&
    user.status !== 'SUSPENDED' && 
    user.status !== 'BANNED'
  ))

  if (!isEligible) return null

  // Ensure style falls back cleanly to 'dark-gold' as key premium badge icon, and map old 'orange' to 'dark-gold'
  let badgeStyle: VerifiedBadgeStyle = user?.verifiedBadgeStyle || 'dark-gold'
  if (badgeStyle === 'orange') {
    badgeStyle = 'dark-gold'
  }

  // Dimensions based on size (make the matte rosette badges slightly larger so their rich 3D elements and details pop)
  const isPremiumMatte = ['dark-gold', 'matte-emerald', 'matte-rose', 'matte-cobalt', 'matte-purple', 'matte-ruby'].includes(badgeStyle)
  const sizeClasses = {
    sm: isPremiumMatte ? 'w-[20px] h-[20px]' : 'w-4 h-4',
    md: isPremiumMatte ? 'w-[24px] h-[24px]' : 'w-[18px] h-[18px]',
    lg: isPremiumMatte ? 'w-[32px] h-[32px]' : 'w-6 h-6'
  }

  const checkSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-[10px] h-[10px]',
    lg: 'w-3.5 h-3.5'
  }

  // Animation variants
  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  const shimmerVariants = {
    animate: {
      x: ['-100%', '200%'],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut",
        repeatDelay: 1.5
      }
    }
  }

  // Multi-variant configurations
  const renderBadgeContent = () => {
    switch (badgeStyle) {
      case 'dark-gold':
      case 'matte-emerald':
      case 'matte-rose':
      case 'matte-cobalt':
      case 'matte-purple':
      case 'matte-ruby': {
        const config: Record<string, {
          stops: React.JSX.Element
          glintColor: string
          shimmerColor: string
        }> = {
          'dark-gold': {
            stops: (
              <>
                <stop offset="0%" stopColor="#DFB65D" />
                <stop offset="20%" stopColor="#FDF4C5" />
                <stop offset="40%" stopColor="#B38728" />
                <stop offset="60%" stopColor="#F9EB9A" />
                <stop offset="80%" stopColor="#9C711C" />
                <stop offset="100%" stopColor="#E9C16C" />
              </>
            ),
            glintColor: '#FFF2B2',
            shimmerColor: 'from-transparent via-[#FFDF73]/25 to-transparent'
          },
          'matte-emerald': {
            stops: (
              <>
                <stop offset="0%" stopColor="#E6FDF5" />
                <stop offset="20%" stopColor="#A7F3D0" />
                <stop offset="40%" stopColor="#10B981" />
                <stop offset="60%" stopColor="#34D399" />
                <stop offset="80%" stopColor="#064E3B" />
                <stop offset="100%" stopColor="#059669" />
              </>
            ),
            glintColor: '#A7F3D0',
            shimmerColor: 'from-transparent via-[#34D399]/25 to-transparent'
          },
          'matte-rose': {
            stops: (
              <>
                <stop offset="0%" stopColor="#FFF1F2" />
                <stop offset="20%" stopColor="#FBCFE8" />
                <stop offset="40%" stopColor="#F43F5E" />
                <stop offset="60%" stopColor="#FDA4AF" />
                <stop offset="80%" stopColor="#9F1239" />
                <stop offset="100%" stopColor="#E11D48" />
              </>
            ),
            glintColor: '#FDF2F4',
            shimmerColor: 'from-transparent via-[#FDA4AF]/25 to-transparent'
          },
          'matte-cobalt': {
            stops: (
              <>
                <stop offset="0%" stopColor="#EFF6FF" />
                <stop offset="20%" stopColor="#BFDBFE" />
                <stop offset="40%" stopColor="#2563EB" />
                <stop offset="60%" stopColor="#93C5FD" />
                <stop offset="80%" stopColor="#1E3A8A" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </>
            ),
            glintColor: '#BFDBFE',
            shimmerColor: 'from-transparent via-[#60A5FA]/25 to-transparent'
          },
          'matte-purple': {
            stops: (
              <>
                <stop offset="0%" stopColor="#F5F3FF" />
                <stop offset="20%" stopColor="#E9D5FF" />
                <stop offset="40%" stopColor="#7C3AED" />
                <stop offset="60%" stopColor="#C084FC" />
                <stop offset="80%" stopColor="#4C1D95" />
                <stop offset="100%" stopColor="#6D28D9" />
              </>
            ),
            glintColor: '#E9D5FF',
            shimmerColor: 'from-transparent via-[#A855F7]/25 to-transparent'
          },
          'matte-ruby': {
            stops: (
              <>
                <stop offset="0%" stopColor="#FEF2F2" />
                <stop offset="20%" stopColor="#FECACA" />
                <stop offset="40%" stopColor="#DC2626" />
                <stop offset="60%" stopColor="#FCA5A5" />
                <stop offset="80%" stopColor="#7F1D1D" />
                <stop offset="100%" stopColor="#B91C1C" />
              </>
            ),
            glintColor: '#FECACA',
            shimmerColor: 'from-transparent via-[#EF4444]/25 to-transparent'
          }
        }

        const activeConfig = config[badgeStyle] || config['dark-gold']
        const rimGradientId = `goldRimGradient-${badgeStyle}`

        return (
          <motion.div 
            className="relative w-full h-full flex items-center justify-center"
            variants={pulseVariants}
            animate="animate"
          >
            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full drop-shadow-[0_2.5px_6px_rgba(0,0,0,0.55)]"
            >
              <defs>
                {/* 3D Metallic Gradient */}
                <linearGradient id={rimGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                  {activeConfig.stops}
                </linearGradient>

                {/* Outer Black-Grey Matte Gradient */}
                <linearGradient id="blackMatteGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2A2A2D" />
                  <stop offset="50%" stopColor="#1C1C1F" />
                  <stop offset="100%" stopColor="#0B0B0C" />
                </linearGradient>

                {/* Inner Deep Matte Black Radial Gradient */}
                <radialGradient id="innerBlackGradient" cx="50%" cy="50%" r="50%" fx="35%" fy="35%">
                  <stop offset="0%" stopColor="#222225" />
                  <stop offset="65%" stopColor="#111113" />
                  <stop offset="100%" stopColor="#030304" />
                </radialGradient>

                {/* Glamour Specular Glow Filter */}
                <filter id="badgeGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Step 1: Outer Rosette Rim (Metal-filled backing rosette) */}
              <path 
                d={getWavyPath(50, 50, 48, 41, 12)} 
                fill={`url(#${rimGradientId})`} 
              />

              {/* Step 2: Inner Matte Black Rosette Body */}
              <path 
                d={getWavyPath(50, 50, 45.2, 38.7, 12)} 
                fill="url(#blackMatteGradient)" 
              />

              {/* Step 3: Inner Metallic Ring */}
              <circle 
                cx="50" 
                cy="50" 
                r="25.5" 
                fill="none" 
                stroke={`url(#${rimGradientId})`} 
                strokeWidth="1.8" 
              />

              {/* Step 4: Inner Matte Black Core */}
              <circle 
                cx="50" 
                cy="50" 
                r="23.8" 
                fill="url(#innerBlackGradient)" 
              />

              {/* Step 5: Sparkling Specular Glint Highlight (Top-Right of Inner Ring) */}
              <g transform="translate(68, 32)">
                <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" filter="url(#badgeGlow)" />
                <ellipse rx="5" ry="0.8" fill="#FFFFFF" opacity="0.75" />
                <ellipse rx="0.8" ry="5" fill="#FFFFFF" opacity="0.75" />
                <circle cx="0" cy="0" r="3" fill={activeConfig.glintColor} opacity="0.4" filter="url(#badgeGlow)" />
              </g>

              {/* Step 6: Luxury 3D Embossed Metallic Checkmark inside the inner black core */}
              <polyline 
                points="36 50, 45 59, 64 39" 
                fill="none" 
                stroke={`url(#${rimGradientId})`} 
                strokeWidth="6" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
              />
            </svg>

            {/* Shimmer sweeping effect overlaid nicely via CSS */}
            <motion.div 
              className={cn("absolute inset-0 w-2/3 h-full bg-gradient-to-r -skew-x-12 pointer-events-none", activeConfig.shimmerColor)}
              variants={shimmerVariants}
              animate="animate"
            />
          </motion.div>
        )
      }

      case 'glass':
        return (
          <motion.div 
            className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden border border-white/20 bg-white/15 backdrop-blur-[2px] shadow-[0_4px_12px_rgba(255,255,255,0.06)]"
            variants={pulseVariants}
            animate="animate"
          >
            {/* Soft backdrop glow gradient */}
            <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-indigo-500/10" />
            
            {/* Glass shimmer */}
            <motion.div 
              className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
              variants={shimmerVariants}
              animate="animate"
            />
            
            {/* Neon Accent tick */}
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="url(#glassCheckGradient)" 
              strokeWidth="5" 
              className={cn(checkSizeClasses[size])}
            >
              <defs>
                <linearGradient id="glassCheckGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EC4899" />
                  <stop offset="50%" stopColor="#A855F7" />
                  <stop offset="100%" stopColor="#6366F1" />
                </linearGradient>
              </defs>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
        )

      case 'outline':
        return (
          <motion.div 
            className="relative w-full h-full rounded-full flex items-center justify-center bg-transparent border-2 border-current hover:opacity-100 opacity-90 transition-opacity"
            whileHover={{ scale: 1.1 }}
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="4" 
              className={cn(checkSizeClasses[size])}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
        )

      case 'dark':
        return (
          <motion.div 
            className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-zinc-950 border border-zinc-800 shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
            variants={pulseVariants}
            animate="animate"
          >
            {/* Cyberpunk neon reflection accent */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-900" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
            
            {/* Shimmer effect */}
            <motion.div 
              className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -skew-x-12"
              variants={shimmerVariants}
              animate="animate"
            />
            
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#06B6D4" 
              strokeWidth="4.5" 
              className={cn("drop-shadow-[0_0_2px_rgba(6,182,212,0.5)]", checkSizeClasses[size])}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
        )

      case 'orange':
      default:
        return (
          <motion.div 
            className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden bg-[#FF6B00] shadow-[0_2px_10px_rgba(255,107,0,0.25)]"
            variants={pulseVariants}
            animate="animate"
          >
            {/* Glow backing */}
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-600 to-[#FF6B00]" />
            
            {/* Linear sweep */}
            <motion.div 
              className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
              variants={shimmerVariants}
              animate="animate"
            />
            
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="4.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={cn(checkSizeClasses[size])}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
        )
    }
  }

  return (
    <div 
      className={cn("relative inline-flex items-center justify-center select-none cursor-pointer p-[1px] z-20", className)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onClick={(e) => {
        e.stopPropagation()
        setShowTooltip(prev => !prev)
      }}
    >
      <motion.div
        className={cn("flex items-center justify-center", sizeClasses[size])}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      >
        {renderBadgeContent()}
      </motion.div>

      {/* Premium Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: -10 }}
            exit={{ opacity: 0, scale: 0.85, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-2xl flex items-center gap-1.5 whitespace-nowrap z-50 pointer-events-none"
          >
            {/* Small Glowing Dot inside tooltip to signify Status */}
            <div className={cn(
              "w-1.5 h-1.5 rounded-full animate-ping shrink-0",
              badgeStyle === 'dark-gold' ? "bg-[#D4AF37]" :
              badgeStyle === 'matte-emerald' ? "bg-emerald-400" :
              badgeStyle === 'matte-rose' ? "bg-rose-400" :
              badgeStyle === 'matte-cobalt' ? "bg-blue-400" :
              badgeStyle === 'matte-purple' ? "bg-purple-400" :
              badgeStyle === 'matte-ruby' ? "bg-red-500" :
              badgeStyle === 'glass' ? "bg-fuchsia-400" :
              badgeStyle === 'dark' ? "bg-cyan-400" : "bg-[#FF6B00]"
            )} />
            <div className={cn(
              "absolute w-1.5 h-1.5 rounded-full shrink-0",
              badgeStyle === 'dark-gold' ? "bg-[#D4AF37]" :
              badgeStyle === 'matte-emerald' ? "bg-emerald-400" :
              badgeStyle === 'matte-rose' ? "bg-rose-400" :
              badgeStyle === 'matte-cobalt' ? "bg-blue-400" :
              badgeStyle === 'matte-purple' ? "bg-purple-400" :
              badgeStyle === 'matte-ruby' ? "bg-red-500" :
              badgeStyle === 'glass' ? "bg-fuchsia-400" :
              badgeStyle === 'dark' ? "bg-cyan-400" : "bg-[#FF6B00]"
            )} />
            <span className="ml-1 pl-1 text-[9px] font-bold tracking-widest text-[#F9F9FB]">
              {user?.plan === 'PRO_PLUS' ? 'Verified Pro Plus Creator' : 'Verified Creator'}
            </span>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] border-4 border-transparent border-t-zinc-900" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
