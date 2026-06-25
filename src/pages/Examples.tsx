import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { 
  ExternalLink, Sparkles, Smartphone, Palette, Check, User, Zap, Eye
} from 'lucide-react'
import { THEMES } from '@/constants/themes'
import { cn } from '@/utils/formatters'
import { getIconForUrl } from '@/utils/linkUtils'
import { Navbar } from '@/components/layout/Navbar'
import { AnimatedBackground } from '@/components/themes/AnimatedBackground'
import { getPookieTheme, POOKIE_THEMES } from '@/themes/pookie'
import { PookieBackground } from '@/themes/pookie/PookieBackground'
import { PookieAvatar } from '@/themes/pookie/components/PookieAvatar'
import { PookieLinkButton } from '@/themes/pookie/components/PookieLinkButton'
import type { Link as LinkType } from '@/types'



const DUMMY_LINKS = [
  { id: '1', title: 'Connect on Instagram', url: 'https://instagram.com', isActive: true, isPinned: true },
  { id: '2', title: 'Watch my YouTube', url: 'https://youtube.com', isActive: true, isPinned: false },
  { id: '3', title: 'Portfolio Website', url: 'https://myportfolio.com', isActive: true, isPinned: false },
  { id: '4', title: 'Support via UPI', url: 'https://pay.upi', isActive: true, isPinned: false },
]

export default function Examples() {
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  
  const filteredThemes = useMemo(() => {
    const pookieIds = [
      'strawberry-milk', 'cloud-nine', 'bubblegum-pop', 'butter-yellow', 
      'matcha-latte', 'baby-blue-sky', 'candy-floss', 'peach-boba', 
      'lavender-dreams', 'y2k-glitter'
    ];
    
    const roseGlass = THEMES.find(t => t.id === 'rose-glass');
    const pookies = THEMES.filter(t => pookieIds.includes(t.id));
    const remainingAnimated = THEMES.filter(t => 
      t.isAnimated && 
      t.requiredPlan === 'PRO_PLUS' && 
      t.id !== 'rose-glass' && 
      !pookieIds.includes(t.id)
    );
    
    const result = [];
    if (roseGlass) {
      result.push(roseGlass);
    }
    result.push(...pookies);
    result.push(...remainingAnimated);
    
    return Array.from(new Map(result.map(item => [item.id, item])).values());
  }, [])

  const [selectedThemeId, setSelectedThemeId] = useState(filteredThemes[0]?.id || 'rose-glass')
  const currentTheme = THEMES.find(t => t.id === selectedThemeId) || THEMES[0]

  const isPookie = POOKIE_THEMES.some(t => t.id === selectedThemeId)
  const pookieTheme = isPookie ? getPookieTheme(selectedThemeId) : null

  return (
    <div className="min-h-screen bg-white">
      {!showMobilePreview && <Navbar />}

      {/* Hero Section */}
      <section className={cn(
        "pt-32 pb-16 px-6 transition-all duration-300",
        showMobilePreview ? "lg:block hidden" : "block"
      )}>
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl lg:text-7xl font-black text-ink mb-6 font-syne leading-tight">
              Design that defines <span className="text-orange italic">You.</span>
            </h1>
            <p className="text-lg text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
              Lynksy isn't just a list of links—it's your digital identity. 
              Switch between our curated Indian-centric themes below and see the magic happen instantly.
            </p>

            <div className="flex flex-wrap justify-center gap-8 py-8 border-y border-gray-100">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cream-2 rounded-xl flex items-center justify-center">
                     <Smartphone className="text-ink" size={20} />
                  </div>
                  <div className="text-left">
                     <h3 className="text-xs font-black text-ink">Mobile First</h3>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cream-2 rounded-xl flex items-center justify-center">
                     <Palette className="text-ink" size={20} />
                  </div>
                  <div className="text-left">
                     <h3 className="text-xs font-black text-ink">Custom Themes</h3>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cream-2 rounded-xl flex items-center justify-center">
                     <Sparkles className="text-ink" size={20} />
                  </div>
                  <div className="text-left">
                     <h3 className="text-xs font-black text-ink">Instant Setup</h3>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Playground Section */}
      <section className="pb-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Floating Preview Trigger */}
          <button 
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="fixed bottom-10 right-6 z-50 lg:hidden w-16 h-16 bg-ink text-white rounded-full shadow-2xl flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-all group border-4 border-white/20"
          >
            {showMobilePreview ? (
              <>
                <Palette size={20} className="mb-0.5 group-hover:rotate-12 transition-transform" />
                <span className="text-[8px] font-black uppercase tracking-tighter">Themes</span>
              </>
            ) : (
              <>
                <Eye size={20} className="mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-black uppercase tracking-tighter">Preview</span>
              </>
            )}
          </button>

          <div className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
            
            {/* Theme Selector (Scrollable Grid) */}
            <div className={cn(
              "space-y-8 transition-all duration-500",
              showMobilePreview ? "hidden lg:block opacity-0 lg:opacity-100" : "block opacity-100"
            )}>
              <div className="bg-white sticky top-20 z-10 py-4 mb-4">
                <h2 className="text-2xl font-black text-ink font-syne">1. Choose a Theme</h2>
                <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">Found over {filteredThemes.length} premium templates</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {filteredThemes.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedThemeId(theme.id)}
                    className={cn(
                      "p-4 rounded-3xl transition-all text-left relative group border-2",
                      selectedThemeId === theme.id 
                        ? "bg-white border-orange shadow-xl shadow-orange/10" 
                        : "bg-white border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className="w-full aspect-[16/9] rounded-2xl mb-4 overflow-hidden border border-gray-100 relative">
                       <div 
                         className="absolute inset-0 z-0"
                         style={{ background: theme.preview || theme.bgColor }}
                       />
                       <div className="relative z-10 p-4 h-full flex flex-col justify-end">
                          <div className="space-y-1">
                             <div className="h-2 w-full rounded bg-white/40 backdrop-blur-sm" />
                             <div className="h-2 w-2/3 rounded bg-white/40 backdrop-blur-sm" />
                          </div>
                       </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-ink">{theme.name}</h3>
                      </div>
                      {selectedThemeId === theme.id && (
                        <div className="w-6 h-6 bg-orange text-white rounded-full flex items-center justify-center">
                           <Check size={12} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Live Preview (Sticky) */}
            <div className={cn(
              "lg:sticky lg:top-24 flex flex-col items-center transition-all duration-500",
              showMobilePreview 
                ? "fixed inset-0 z-[60] bg-white flex flex-col items-center justify-center p-6 lg:bg-transparent lg:relative lg:inset-auto lg:z-0 lg:flex overflow-hidden" 
                : "hidden lg:flex opacity-0 lg:opacity-100"
            )}>
              <div className={cn("mb-6 w-full text-center", showMobilePreview && "hidden lg:block")}>
                <h2 className="text-2xl font-black text-ink font-syne">2. Live Preview</h2>
                <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">See your changes in real-time</p>
              </div>

              {/* Back button for mobile preview */}
              {showMobilePreview && (
                <div className="lg:hidden absolute top-6 right-6 z-[70]">
                  <button 
                    onClick={() => setShowMobilePreview(false)}
                    className="w-10 h-10 bg-ink-2 text-white rounded-full flex items-center justify-center hover:bg-ink transition-all"
                  >
                    <Check size={24} />
                  </button>
                </div>
              )}

              <motion.div
                key={selectedThemeId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className={cn("relative", showMobilePreview && "scale-90 sm:scale-100")}
              >
                {/* Device Frame */}
                <div className="relative z-10 w-[300px] h-[600px] bg-ink rounded-[48px] border-[10px] border-ink-2 shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-ink-2 rounded-b-2xl z-20" />
                  
                  <div 
                    className="w-full h-full pt-16 pb-8 px-6 overflow-y-auto scrollbar-hide flex flex-col items-center transition-colors duration-500 relative"
                    style={{ backgroundColor: pookieTheme ? 'transparent' : currentTheme.bgColor, background: pookieTheme ? pookieTheme.pageBg : undefined }}
                  >
                    {!pookieTheme && currentTheme.isAnimated && (
                      <AnimatedBackground theme={currentTheme} mobileOnly={false} />
                    )}
                    {pookieTheme && (
                      <PookieBackground theme={pookieTheme} mobileOnly={false} />
                    )}

                    <div className="relative z-10 w-full flex flex-col items-center">
                      {pookieTheme ? (
                        <PookieAvatar 
                          displayName="TrendSetter"
                          theme={pookieTheme}
                        />
                      ) : (
                        <div 
                          className="w-20 h-20 rounded-full border-4 shadow-lg mb-6 flex-shrink-0 relative overflow-hidden" 
                          style={{ 
                            borderColor: currentTheme.accentColor,
                            animation: currentTheme.avatarRingAnimation && currentTheme.avatarRingAnimation !== 'none' ? `${currentTheme.avatarRingAnimation} 3s ease-in-out infinite` : 'none',
                            boxShadow: currentTheme.avatarGlow || 'none'
                          }}
                        >
                          {currentTheme.avatarRingAnimation && (
                            <div 
                              className="absolute inset-0 rounded-full"
                              style={{ 
                                border: currentTheme.avatarRing || `2px solid ${currentTheme.accentColor}`,
                                animation: `${currentTheme.avatarRingAnimation} 4s linear infinite`
                              }}
                            />
                          )}
                          <div className="w-full h-full bg-cream-3 rounded-full flex items-center justify-center">
                            <User size={32} className="text-ink opacity-60" />
                          </div>
                        </div>
                      )}
                      
                      <h2 
                        className="font-black mb-1 font-syne text-center" 
                        style={pookieTheme ? { 
                          color: pookieTheme.nameColor,
                          fontFamily: pookieTheme.nameFont,
                          fontSize: '14px',
                          textShadow: currentTheme.nameGlow || 'none'
                        } : {
                          color: currentTheme.textColor,
                          fontSize: '18px', // text-lg equivalent
                          textShadow: currentTheme.nameGlow || 'none'
                        }}
                      >
                        @TrendSetter
                      </h2>
                      <p 
                        className="text-center mb-6 opacity-70 px-4 leading-relaxed" 
                        style={pookieTheme ? {
                          color: pookieTheme.handleColor,
                          fontSize: '8px',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase'
                        } : {
                          color: currentTheme.textColor,
                          fontSize: '10px'
                        }}
                      >
                        Curating the best of Indian culture and modern lifestyle. Join the movement.
                      </p>

                      <div className="w-full space-y-3">
                        {DUMMY_LINKS.map((link, i) => (
                          pookieTheme ? (
                            <PookieLinkButton
                              key={link.id}
                              link={link as LinkType}
                              theme={pookieTheme}
                              uid="demo"
                              index={i}
                            />
                          ) : (
                            <div
                              key={link.id}
                              className={cn(
                                "w-full py-3 px-5 flex items-center gap-3 transition-all shadow-sm",
                                currentTheme.buttonStyle === 'filled' ? "rounded-xl" :
                                currentTheme.buttonStyle === 'pill' ? "rounded-full" :
                                currentTheme.buttonStyle === 'soft' ? "rounded-xl" :
                                "rounded-xl border-2"
                              )}
                              style={{ 
                                backgroundColor: currentTheme.buttonStyle === 'filled' || currentTheme.buttonStyle === 'pill' 
                                  ? currentTheme.accentColor 
                                  : currentTheme.buttonStyle === 'soft' 
                                    ? `${currentTheme.accentColor}1A`
                                    : 'transparent',
                                color: currentTheme.buttonTextColor || (currentTheme.buttonStyle === 'filled' || currentTheme.buttonStyle === 'pill' ? '#FFFFFF' : currentTheme.accentColor),
                                borderColor: currentTheme.accentColor,
                                backdropFilter: currentTheme.isGlass ? `blur(${currentTheme.blurAmount || 10}px)` : undefined,
                                boxShadow: currentTheme.linkGlow ? `0 0 20px ${currentTheme.linkGlow}` : undefined
                              }}
                            >
                               <div className="w-4 h-4 flex items-center justify-center shrink-0">
                                  {React.createElement(getIconForUrl(link.url), { size: 16 })}
                               </div>
                               <span className="text-xs font-black truncate">{link.title}</span>
                               <ExternalLink size={12} className="ml-auto opacity-50" />
                            </div>
                          )
                        ))}
                      </div>

                      <div 
                        className="mt-8 pt-8 pb-4 text-[8px] font-black uppercase tracking-tighter opacity-30 flex items-center gap-2" 
                        style={{ color: pookieTheme ? pookieTheme.brandingColor : currentTheme.textColor }}
                      >
                        <span>Powered by Lynksy</span>
                        <Zap size={10} />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Background Glow */}
                <div 
                  className="absolute inset-0 blur-[100px] opacity-30 -z-10 transition-colors duration-700 rounded-full" 
                  style={{ backgroundColor: currentTheme.accentColor }}
                />
              </motion.div>

              <div className="mt-8 text-center bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 w-full max-w-[300px]">
                <p className="text-xs font-bold text-indigo-700 mb-2 italic">Matched with your vibe?</p>
                <Link to="/signup" className="btn-primary btn-sm w-full">Start Designing Now</Link>
              </div>
            </div>

          </div>
        </div>
      </section>



      {/* Footer CTA */}
      <section className="py-20 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-black text-ink mb-6 font-syne italic leading-tight">Like what you see?</h2>
          <p className="text-lg text-muted mb-10">
            Join thousands of creators who are already growing their presence with Lynksy. 
            It takes less than 2 minutes to get started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup" className="btn-primary btn-lg w-full sm:w-auto">Get Started Free</Link>
            <Link to="/pricing" className="btn-outline btn-lg w-full sm:w-auto border-ink text-ink hover:bg-ink hover:text-white">View Plans</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
