import { motion } from 'motion/react'
import type { PookieTheme } from '../index'

interface Props {
  avatarUrl: string | null
  displayName: string
  theme: PookieTheme
}

export function PookieAvatar({ avatarUrl, displayName, theme }: Props) {
  const initial = displayName?.charAt(0).toUpperCase() || '?'
  const [c1, c2, c3] = theme.avatarRingColors

  return (
    <div className="relative flex justify-center mb-3">
      {/* Soft blob behind avatar */}
      <div 
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '110px', height: '110px',
          borderRadius: '50%',
          background: theme.avatarBlobColor,
          filter: 'blur(24px)',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
        }} 
      />

      {/* Animated Ring */}
      <motion.div
        style={{
          position: 'relative',
          padding: '3px',
          borderRadius: '50%',
          backgroundImage: `linear-gradient(135deg, ${c1}, ${c2}, ${c3 || c1}, ${c1})`,
          backgroundSize: '300% 300%',
          boxShadow: theme.avatarGlow,
        }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      >
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 relative z-10 bg-white/10 backdrop-blur-sm">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={displayName} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center text-3xl font-black text-white"
              style={{ backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})` }}
            >
              {initial}
            </div>
          )}
        </div>
      </motion.div>


    </div>
  )
}
