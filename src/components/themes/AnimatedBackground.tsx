import React, { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { Theme, ThemeSettings } from '@/types'
import { Heart, Cloud } from 'lucide-react'
import { cn } from '@/utils/formatters'
import { AuroraBackground } from './animations/AuroraBackground'
import { StarField } from './animations/StarField'
import { FloatingParticles } from './animations/FloatingParticles'
import { WaveBackground } from './animations/WaveBackground'
import { CherryBlossoms } from './animations/CherryBlossoms'
import { NeonGlow } from './animations/NeonGlow'
import { RainbowBackground } from './animations/RainbowBackground'

// Pookie Themes
import { POOKIE_THEMES, getPookieTheme } from '@/themes/pookie'
import { PookieBackground } from '@/themes/pookie/PookieBackground'

interface AnimatedBackgroundProps {
  theme: Theme
  settings?: ThemeSettings
  mobileOnly?: boolean
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ theme, settings, mobileOnly }) => {
  const prefersReducedMotion = useReducedMotion()
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const {
    primaryColor = theme.accentColor,
    animationSpeed = 1,
    blurAmount = 1
  } = settings || {}

  const speedMultiplier = 1 / animationSpeed

  useEffect(() => {
    const canHover = window.matchMedia('(pointer: fine)').matches
    if (prefersReducedMotion || !theme.isAnimated || !canHover) return

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [prefersReducedMotion, theme.isAnimated])

  const renderAnimation = () => {
    // --- POOKIE THEMES OVERRIDE ---
    const isPookieTheme = POOKIE_THEMES.some(t => t.id === theme.id)
    if (isPookieTheme) {
      const pTheme = getPookieTheme(theme.id)
      return <PookieBackground theme={pTheme} />
    }

    if (!theme.isAnimated || prefersReducedMotion) return null
    const canHover = typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches
    
    // Central focal point that sits behind content
    const centralHalo = (
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] max-w-[600px] aspect-square rounded-full blur-[80px] opacity-20 pointer-events-none"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 4 * speedMultiplier,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          backgroundImage: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`,
          filter: `blur(${blurAmount * 80}px)`
        }}
      />
    )

    const mouseGlow = canHover && (
      <motion.div
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
        initial={false}
      >
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full blur-[150px] opacity-30 mix-blend-overlay"
          animate={{
            x: mousePos.x - 400,
            y: mousePos.y - 400,
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 50, mass: 1 }}
          style={{ 
            backgroundImage: `radial-gradient(circle, ${primaryColor} 0%, transparent 70%)`
          }}
        />
      </motion.div>
    )

    switch (theme.animationType) {
      case 'aurora':
        return <AuroraBackground />
      case 'stars':
        return <StarField color={primaryColor} />
      case 'particles':
        return <FloatingParticles color={primaryColor} count={30} />
      case 'waves':
        return <WaveBackground color={primaryColor} />
      case 'petals':
        return <CherryBlossoms />
      case 'neon':
        return <NeonGlow color={primaryColor} />
      case 'hearts':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-pink-400 opacity-20"
                initial={{ x: `${Math.random() * 100}%`, y: '110%', scale: 0 }}
                animate={{
                  y: '-10%',
                  scale: [0, 1, 1, 0],
                  rotate: [0, 45, -45, 0],
                }}
                transition={{
                  duration: (Math.random() * 10 + 10) * speedMultiplier,
                  repeat: Infinity,
                  delay: Math.random() * 20,
                  ease: "linear",
                }}
                style={{ color: i % 2 === 0 ? primaryColor : (theme.bgColor === '#FFFFFF' ? '#FFC0CB' : '#333333') }}
              >
                <Heart size={Math.random() * 20 + 10} fill="currentColor" />
              </motion.div>
            ))}
          </div>
        )
      case 'bubbles':
        return (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-white/30 backdrop-blur-[1px]"
                initial={{ bottom: '-10%', left: `${Math.random() * 100}%`, scale: 0.5 }}
                animate={{
                  bottom: '110%',
                  left: `${(Math.random() * 100) + Math.sin(i) * 5}%`,
                  scale: [0.5, 1.2, 0.8],
                  opacity: [0, 0.4, 0],
                }}
                transition={{
                  duration: (Math.random() * 10 + 10) * speedMultiplier,
                  repeat: Infinity,
                  delay: Math.random() * 10,
                  ease: "linear",
                }}
                style={{ 
                  width: Math.random() * 30 + 10, 
                  height: Math.random() * 30 + 10,
                  backgroundImage: `radial-gradient(circle at 30% 30%, white 0%, ${primaryColor}22 100%)`
                }}
              />
            ))}
          </div>
        )
      case 'fireflies':
        return (
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 25 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full blur-[2px]"
                animate={{
                  x: [0, Math.random() * 100 - 50, 0],
                  y: [0, Math.random() * 100 - 50, 0],
                  opacity: [0, 1, 0],
                  scale: [0.5, 1.5, 0.5],
                }}
                transition={{
                  duration: (Math.random() * 5 + 5) * speedMultiplier,
                  repeat: Infinity,
                  delay: Math.random() * 10,
                }}
                style={{ 
                  width: 4, 
                  height: 4, 
                  backgroundColor: '#EAB308',
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  boxShadow: `0 0 10px #EAB308`
                }}
              />
            ))}
          </div>
        )
      case 'clouds':
        return (
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-white/40"
                initial={{ x: '-20%', top: `${Math.random() * 100}%` }}
                animate={{ x: '120%' }}
                transition={{
                  duration: (Math.random() * 20 + 20) * speedMultiplier,
                  repeat: Infinity,
                  delay: Math.random() * 20,
                  ease: "linear",
                }}
              >
                <Cloud size={Math.random() * 60 + 40} fill="currentColor" />
              </motion.div>
            ))}
          </div>
        )
      case 'rainbow':
        return <RainbowBackground speed={animationSpeed} />
      default:
        return (
          <div className="absolute inset-0 overflow-hidden">
            {centralHalo}
            {mouseGlow}
          </div>
        )
    }
  }

  return (
    <div className={cn(
      "absolute inset-0 z-0 pointer-events-none overflow-hidden",
      mobileOnly && "lg:hidden"
    )} style={{ backgroundColor: theme.bgColor }}>
      {renderAnimation()}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      
      <style>{`
        @keyframes aurora-ring {
          0%   { border-color: #00FFAA; box-shadow: 0 0 20px #00FFAA44; }
          33%  { border-color: #4B8EFF; box-shadow: 0 0 20px #4B8EFF44; }
          66%  { border-color: #AA00FF; box-shadow: 0 0 20px #AA00FF44; }
          100% { border-color: #00FFAA; box-shadow: 0 0 20px #00FFAA44; }
        }
        @keyframes gold-pulse {
          0%, 100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 20px rgba(212,175,55,0.4); }
          50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 40px rgba(212,175,55,0.7); }
        }
        @keyframes glass-ring {
          0%, 100% { border-color: rgba(255,255,255,0.3); box-shadow: 0 0 15px rgba(255,255,255,0.2); }
          50% { border-color: rgba(255,255,255,0.8); box-shadow: 0 0 30px rgba(255,255,255,0.4); }
        }
        @keyframes cosmic-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(168,85,247,0.4), 0 0 40px rgba(168,85,247,0.2); }
          50% { box-shadow: 0 0 40px rgba(168,85,247,0.7), 0 0 80px rgba(168,85,247,0.3); }
        }
        @keyframes royal-ring {
          0% { border-color: #FF6B00; }
          50% { border-color: #FFD700; transform: scale(1.02); }
          100% { border-color: #FF6B00; }
        }
        @keyframes wave-ring {
          0%, 100% { box-shadow: 0 0 15px rgba(14,165,233,0.3); }
          50% { box-shadow: 0 0 35px rgba(14,165,233,0.6); }
        }
        @keyframes neon-pulse {
          0%, 100% { border-color: rgba(0,255,136,0.3); box-shadow: 0 0 10px rgba(0,255,136,0.3); }
          50% { border-color: rgba(0,255,136,1); box-shadow: 0 0 25px rgba(0,255,136,0.8); }
        }
        @keyframes crystal-ring {
          0% { border-color: rgba(99,102,241,0.3); }
          33% { border-color: rgba(139,92,246,0.5); }
          66% { border-color: rgba(59,130,246,0.4); }
          100% { border-color: rgba(99,102,241,0.3); }
        }
        @keyframes ring-pulse {
          0%, 100% { box-shadow: 0 0 15px rgba(236,72,153,0.2); }
          50% { box-shadow: 0 0 35px rgba(236,72,153,0.5); }
        }
        @keyframes rainbow-border {
          0% { border-color: #FF0000; box-shadow: 0 0 15px rgba(255,0,0,0.3); }
          14% { border-color: #FF7F00; box-shadow: 0 0 15px rgba(255,127,0,0.3); }
          28% { border-color: #FFFF00; box-shadow: 0 0 15px rgba(255,255,0,0.3); }
          42% { border-color: #00FF00; box-shadow: 0 0 15px rgba(0,255,0,0.3); }
          57% { border-color: #0000FF; box-shadow: 0 0 15px rgba(0,0,255,0.3); }
          71% { border-color: #4B0082; box-shadow: 0 0 15px rgba(75,0,130,0.3); }
          85% { border-color: #9400D3; box-shadow: 0 0 15px rgba(148,0,211,0.3); }
          100% { border-color: #FF0000; box-shadow: 0 0 15px rgba(255,0,0,0.3); }
        }
      `}</style>
    </div>
  )
}
