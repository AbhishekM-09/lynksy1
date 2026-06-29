import { motion } from 'motion/react'
import { Lock, Check, Sparkles, Gift } from 'lucide-react'
import { POOKIE_THEMES } from '../index'

interface Props {
  currentThemeId: string
  userPlan?: string
  onSelect: (id: string) => void
  onUpgrade: () => void
}

export function PookieThemeSelector({ currentThemeId, onSelect, onUpgrade }: Props) {
  const isEligible = true

  return (
    <div className="space-y-4">
      {/* Promo Header for Locked State */}
      {!isEligible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl flex items-center gap-4 border border-pink-200/50 bg-gradient-to-br from-pink-50 to-purple-50"
        >
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-500 flex items-center justify-center shrink-0 shadow-sm">
            <Gift size={20} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm text-pink-900">Premium Themes (10)</h4>
            <p className="text-xs text-pink-700/70">PRO+ exclusive adorable aesthetics</p>
          </div>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r from-pink-500 to-purple-500 shadow-lg shadow-pink-500/20 flex items-center gap-1.5 shrink-0"
          >
            Go Pro+ <Sparkles size={11} className="animate-pulse" />
          </button>
        </motion.div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {POOKIE_THEMES.map((theme, i) => {
          const isSelected = currentThemeId === theme.id
          const locked = !isEligible

          return (
            <motion.div
              key={theme.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => locked ? onUpgrade() : onSelect(theme.id)}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                isSelected ? 'border-pink-500 shadow-lg shadow-pink-500/10' : 'border-transparent hover:border-pink-200 shadow-sm'
              }`}
            >
              {/* Preview */}
              <div 
                className="h-24 relative flex flex-col items-center justify-center gap-1.5 p-3"
                style={{ backgroundImage: theme.pageBg }}
              >
                {/* Micro Preview Icons */}
                <div className="absolute inset-x-2 top-2 flex justify-between pointer-events-none opacity-40">
                  {theme.floatingIcons.slice(0, 3).map((cfg, j) => (
                    <motion.span 
                      key={j} 
                      className="text-[10px]"
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2, repeat: Infinity, delay: j * 0.5 }}
                    >
                      {cfg.icon}
                    </motion.span>
                  ))}
                </div>

                {/* Avatar Mock */}
                <div 
                  className="w-7 h-7 rounded-full border-2 border-white/40 shadow-sm mb-1"
                  style={{ background: theme.accentColor }} 
                />
                
                {/* Link Mocks */}
                <div className="w-full space-y-1">
                  <div className="h-2 rounded-full w-full bg-white/30" />
                  <div className="h-2 rounded-full w-[80%] mx-auto bg-white/20" />
                </div>

                {/* Status Overlays */}
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 bg-pink-500 p-1 rounded-full text-white">
                    <Check size={10} />
                  </div>
                )}
                {locked && (
                  <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center">
                    <Lock size={14} className="text-pink-900/50" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="px-3 py-2 bg-white">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs">{theme.emoji}</span>
                  <span className="text-[10px] font-bold text-ink-1 truncate">{theme.name}</span>
                </div>
                <span className="text-[9px] text-ink-3 truncate block">{theme.vibe}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
