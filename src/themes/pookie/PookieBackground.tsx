import { BubbleEffect }   from './icons/BubbleEffect'
import { SparkleEffect }  from './icons/SparkleEffect'
import { FloatingIcons }  from './icons/FloatingIcons'
import type { PookieTheme } from './index'
import { cn } from '@/utils/formatters'

// These already exist from the PRO+ theme system:
import { WaveBackground }     from '@/components/themes/animations/WaveBackground'
import { CherryBlossoms }     from '@/components/themes/animations/CherryBlossoms'
import { StarField }          from '@/components/themes/animations/StarField'

interface Props { 
  theme: PookieTheme 
  mobileOnly?: boolean
}

export function PookieBackground({ theme, mobileOnly }: Props) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none z-0 overflow-hidden", mobileOnly && "lg:hidden")}>
      {/* ── Canvas background effect ── */}
      {theme.bgEffect === 'bubbles'  && <BubbleEffect  color={theme.bgEffectColor} />}
      {theme.bgEffect === 'sparkles' && <SparkleEffect color={theme.bgEffectColor} />}
      {theme.bgEffect === 'petals'   && <CherryBlossoms />}
      {theme.bgEffect === 'clouds'   && <WaveBackground color={theme.bgEffectColor} />}
      {theme.bgEffect === 'stars'    && <StarField color={theme.bgEffectColor} count={60} />}

      {/* ── Floating emoji icons (always shown) ── */}
      <FloatingIcons theme={theme} />

      {/* ── Soft radial glow blobs behind content ── */}
      <div aria-hidden="true" style={{ position:'absolute', inset:0, zIndex:0, pointerEvents:'none', overflow:'hidden' }}>
        {/* Top-left blob */}
        <div style={{
          position: 'absolute', top: '-10%', left: '-10%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          backgroundImage: `radial-gradient(circle, ${theme.avatarBlobColor} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          animation: 'blobDrift1 18s ease-in-out infinite',
        }} />
        {/* Bottom-right blob */}
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-10%',
          width: '45vw', height: '45vw', borderRadius: '50%',
          backgroundImage: `radial-gradient(circle, ${theme.avatarBlobColor} 0%, transparent 70%)`,
          filter: 'blur(40px)',
          animation: 'blobDrift2 22s ease-in-out infinite',
        }} />
        {/* Center subtle blob */}
        <div style={{
          position: 'absolute', top: '40%', left: '30%',
          width: '40vw', height: '40vw', borderRadius: '50%',
          backgroundImage: `radial-gradient(circle, ${theme.accentGlow.replace(/[\d.]+\)$/, '0.08)')} 0%, transparent 70%)`,
          filter: 'blur(60px)',
          animation: 'blobDrift3 26s ease-in-out infinite',
        }} />
      </div>

      <style>{`
        @keyframes blobDrift1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(5vw,-4vw) scale(1.12); }
          66%      { transform: translate(-3vw,6vw) scale(0.94); }
        }
        @keyframes blobDrift2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-6vw,4vw) scale(1.1); }
          80%      { transform: translate(4vw,-5vw) scale(0.92); }
        }
        @keyframes blobDrift3 {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(-4vw,-4vw); }
        }
      `}</style>
    </div>
  )
}
