import { useRef, useState, createElement } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import type { PookieTheme } from '../index'
import { buildUrlWithUTM } from '@/utils/planUtils'
import { trackClick } from '@/firebase/firestore'
import { cn } from '@/utils/formatters'
import type { Link } from '@/types'
import { getIconForUrl } from '@/utils/linkUtils'

interface Props {
  link: Link
  theme: PookieTheme
  uid: string
  index: number
  onUpiClick?: (e: React.MouseEvent) => void
}

export function PookieLinkButton({ link, theme, uid, index, onUpiClick }: Props) {
  const [isHovered, setIsHovered] = useState(false)
  const btnRef = useRef<HTMLAnchorElement>(null)

  const finalUrl = buildUrlWithUTM(link.url, {
    source: link.utmSource, medium: link.utmMedium, campaign: link.utmCampaign,
  })

  // Real App Icon / Emoji display logic handled inline

  function handleClick(e: React.MouseEvent) {
    if (onUpiClick) {
      e.preventDefault()
      onUpiClick(e)
      return
    }

    trackClick(uid, { id: link.id, title: link.title })

    // Cute bounce ripple effect (mini sparks)
    const btn = btnRef.current
    if (btn) {
      const rect = btn.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const ripple = document.createElement('div')
      ripple.className = 'pookie-ripple'
      ripple.style.left = `${x}px`
      ripple.style.top = `${y}px`
      ripple.style.background = theme.accentColor
      btn.appendChild(ripple)
      setTimeout(() => ripple.remove(), 600)
    }
  }

  return (
    <motion.a
      ref={btnRef}
      href={onUpiClick ? undefined : finalUrl}
      target={onUpiClick ? undefined : "_blank"}
      rel="noopener noreferrer"
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: 0.1 + index * 0.05,
        duration: 0.5,
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "relative flex items-center gap-3 w-full p-3 overflow-hidden transition-all duration-300",
        "group cursor-pointer no-underline"
      )}
      style={{
        borderRadius: theme.cardRadius,
        background: isHovered ? theme.cardBgHover : theme.cardBg,
        border: theme.cardBorder,
        boxShadow: isHovered ? theme.cardShadowHover : theme.cardShadow,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        color: theme.btnTextColor,
        fontFamily: theme.btnFont,
      }}
    >
      {/* Shimmer Effect */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ x: '-100%', opacity: 0 }}
            animate={{ x: '200%', opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Icon Area */}
      <motion.div
        className="shrink-0 w-8 h-8 flex items-center justify-center text-lg z-10 overflow-hidden"
        style={{
          background: link.thumbnailUrl ? 'transparent' : theme.accentGlow.replace(/[\d.]+\)$/, '0.15)'),
          borderRadius: link.thumbnailUrl ? '25%' : '40%',
          color: theme.accentColor === '#FFFFFF' ? theme.pageBg2 : theme.btnTextColor
        }}
        animate={isHovered ? { rotate: link.thumbnailUrl ? 0 : [0, -10, 10, 0], scale: 1.1 } : { rotate: 0, scale: 1 }}
        transition={{ 
          rotate: { type: 'tween', duration: 0.4, ease: "easeInOut" },
          scale: { type: 'spring', stiffness: 400 }
        }}
      >
        {link.thumbnailUrl ? (
          <img src={link.thumbnailUrl} className="w-full h-full object-cover" alt="" />
        ) : (link.emoji && link.emoji !== '✨') ? (
          link.emoji
        ) : (
          createElement(getIconForUrl(link.url), { size: 18 })
        )}
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0 z-10">
        <h3 className="font-bold text-[9px] truncate uppercase tracking-wider leading-none">
          {link.title}
        </h3>
      </div>

      {/* Chevron */}
      <motion.div
        className="shrink-0 z-10 opacity-30"
        animate={isHovered ? { x: 3 } : { x: 0 }}
      >
        <ChevronRight size={18} />
      </motion.div>

      <style>{`
        .pookie-ripple {
          position: absolute;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          transform: scale(0);
          animation: pookie-ripple-anim 0.6s ease-out;
          pointer-events: none;
          z-index: 5;
          opacity: 0.6;
        }
        @keyframes pookie-ripple-anim {
          to { transform: scale(40); opacity: 0; }
        }
      `}</style>
    </motion.a>
  )
}
