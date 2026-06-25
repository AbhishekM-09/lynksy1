import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import type { PookieTheme } from '../index'

interface FloatingIcon {
  id: number
  icon: string
  x: number          // % from left
  y: number          // % from top
  size: number       // px
  opacity: number
  duration: number   // animation cycle seconds
  delay: number
  blur: boolean
  driftX: number     // drift range %
  driftY: number     // drift range %
  rotate: number     // start rotation degrees
  rotateDrift: number // rotation range
}

interface Props {
  theme: PookieTheme
}

export function FloatingIcons({ theme }: Props) {
  const [icons, setIcons] = useState<FloatingIcon[]>([])
  const idRef = useRef(0)

  useEffect(() => {
    const generated: FloatingIcon[] = []

    theme.floatingIcons.forEach(config => {
      for (let i = 0; i < config.count; i++) {
        const [sMin, sMax]  = config.size
        const [oMin, oMax]  = config.opacity
        const [spMin, spMax]= config.speed

        generated.push({
          id:          idRef.current++,
          icon:        config.icon,
          x:           5 + Math.random() * 90,    // 5% to 95%
          y:           2 + Math.random() * 96,    // 2% to 98%
          size:        sMin + Math.random() * (sMax - sMin),
          opacity:     oMin + Math.random() * (oMax - oMin),
          duration:    spMin + Math.random() * (spMax - spMin),
          delay:       Math.random() * -20,       // negative = start mid-animation
          blur:        config.blur ?? false,
          driftX:      3 + Math.random() * 6,     // drift 3-9% left/right
          driftY:      3 + Math.random() * 6,
          rotate:      Math.random() * 360,
          rotateDrift: -20 + Math.random() * 40,  // rotate ±20deg
        })
      }
    })

    setIcons(generated)
  }, [theme.id, theme.floatingIcons])

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, zIndex: 0,
        pointerEvents: 'none', overflow: 'hidden',
      }}
    >
      {icons.map(icon => (
        <motion.div
          key={icon.id}
          style={{
            position:   'absolute',
            left:       `${icon.x}%`,
            top:        `${icon.y}%`,
            fontSize:   `${icon.size}px`,
            opacity:    icon.opacity,
            lineHeight: 1,
            filter:     icon.blur ? 'blur(1.5px)' : 'none',
            userSelect: 'none',
            willChange: 'transform',
          }}
          animate={{
            x: [0, `${icon.driftX}%`, `-${icon.driftX * 0.6}%`, 0],
            y: [0, `-${icon.driftY}%`, `${icon.driftY * 0.7}%`, 0],
            rotate:  [icon.rotate, icon.rotate + icon.rotateDrift, icon.rotate],
            opacity: [icon.opacity, icon.opacity * 0.5, icon.opacity * 0.8, icon.opacity],
            scale:   [1, 1.08, 0.95, 1],
          }}
          transition={{
            duration:   icon.duration,
            delay:      icon.delay,
            repeat:     Infinity,
            ease:       'easeInOut',
            times:      [0, 0.35, 0.7, 1],
          }}
        >
          {icon.icon}
        </motion.div>
      ))}
    </div>
  )
}
