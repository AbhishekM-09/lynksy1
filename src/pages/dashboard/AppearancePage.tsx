import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { updateUser, getLinks, getActiveProducts } from '@/firebase/firestore'
import { usePlan } from '@/hooks/usePlan'
import { THEMES, getTheme } from '@/constants/themes'
import { PhonePreview } from '@/components/links/PhonePreview'
import { cn, isLightColor } from '@/utils/formatters'
import type { Link, Product, User } from '@/types'
import { Palette, MousePointer2, Check, Lock, RefreshCw, Eye, Plus, Sliders, Zap, Sparkles, Award } from 'lucide-react'
import { HexColorPicker } from 'react-colorful'
import { motion, AnimatePresence } from 'motion/react'
import { POOKIE_THEMES, getPookieTheme } from '@/themes/pookie'
import { PookieBackground } from '@/themes/pookie/PookieBackground'
import { PookieThemeSelector } from '@/themes/pookie/components/PookieThemeSelector'
import { VerifiedBadge, VerifiedBadgeStyle } from '@/components/ui/VerifiedBadge'

const BUTTON_STYLES = [
  { id: 'filled', label: 'Filled', desc: 'Solid background' },
  { id: 'pill', label: 'Pill', desc: 'Full rounded corners' },
  { id: 'outline', label: 'Outline', desc: 'Border only' },
  { id: 'soft', label: 'Soft', desc: 'Light opacity' },
]

const BRAND_COLORS = [
  '#FF6B00', '#1C1813', '#7C3AED', '#EC4899', 
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444',
  '#06B6D4', '#6366F1', '#A855F7', '#D946EF',
  '#14B8A6', '#8B5CF6', '#F43F5E', '#22C55E'
]

const BADGE_STYLES = [
  { id: 'dark-gold', label: 'Matte & Gold', desc: 'Sovereign luxury gilt outline checkmark' },
  { id: 'matte-emerald', label: 'Matte & Emerald', desc: 'Imperial jade metallic outline checkmark' },
  { id: 'matte-rose', label: 'Matte & Rose', desc: 'Luxe pink amethyst metallic outline checkmark' },
  { id: 'matte-cobalt', label: 'Matte & Cobalt', desc: 'Polished sapphire metallic outline checkmark' },
  { id: 'matte-purple', label: 'Matte & Purple', desc: 'Aero-grade violet metallic outline checkmark' },
  { id: 'matte-ruby', label: 'Matte & Ruby', desc: 'Lustrous ruby red metallic outline checkmark' },
]

export default function AppearancePage() {
  const { user, updateUserField } = useAuthStore()
  const { sidebarOpen } = useUIStore()
  const { plan, gate, can } = usePlan()
  
  const [activeTab, setActiveTab] = useState<'themes' | 'custom'>('themes')
  const [isDirty, setIsDirty] = useState(false)
  const [formData, rawSetFormData] = useState({
    themeId: user?.themeId || 'saffron',
    accentColor: user?.accentColor || '#FF6B00',
    buttonStyle: user?.buttonStyle || 'filled',
    textColor: user?.textColor || '',
    buttonColor: user?.buttonColor || '',
    buttonTextColor: user?.buttonTextColor || '',
    verifiedBadgeStyle: user?.verifiedBadgeStyle || 'dark-gold',
    themeSettings: {
      animationSpeed: user?.themeSettings?.animationSpeed || 1,
      glowIntensity: user?.themeSettings?.glowIntensity || 1,
      particleDensity: user?.themeSettings?.particleDensity || 1,
      blurAmount: user?.themeSettings?.blurAmount || 1,
    }
  })

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const setFormData: typeof rawSetFormData = (updater: any) => {
    rawSetFormData(updater)
    setIsDirty(true)
  }

  const [links, setLinks] = useState<Link[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showMobilePreview, setShowMobilePreview] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1280)
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  const hasChanges = user && (
    formData.themeId !== (user.themeId || 'saffron') ||
    formData.accentColor !== (user.accentColor || getTheme(user.themeId || 'saffron', plan).accentColor) ||
    formData.buttonStyle !== (user.buttonStyle || 'filled') ||
    formData.textColor !== (user.textColor || getTheme(user.themeId || 'saffron', plan).textColor) ||
    formData.buttonColor !== (user.buttonColor || getTheme(user.themeId || 'saffron', plan).accentColor) ||
    formData.buttonTextColor !== (user.buttonTextColor || '#FFFFFF') ||
    formData.verifiedBadgeStyle !== (user.verifiedBadgeStyle || 'dark-gold') ||
    JSON.stringify(formData.themeSettings) !== JSON.stringify(user.themeSettings || {
      animationSpeed: 1,
      glowIntensity: 1,
      particleDensity: 1,
      blurAmount: 1
    })
  )

  useEffect(() => {
    if (user?.uid) {
      const theme = getTheme(user.themeId || 'saffron', plan)
      getLinks(user.uid).then(setLinks)
      getActiveProducts(user.uid).then(setProducts)
      rawSetFormData({
        themeId: user.themeId || 'saffron',
        accentColor: user.accentColor || theme.accentColor,
        buttonStyle: user.buttonStyle as User['buttonStyle'],
        textColor: user.textColor || theme.textColor,
        buttonColor: user.buttonColor || theme.accentColor,
        buttonTextColor: user.buttonTextColor || '#FFFFFF',
        verifiedBadgeStyle: user.verifiedBadgeStyle || 'dark-gold',
        themeSettings: {
          animationSpeed: user.themeSettings?.animationSpeed || 1,
          glowIntensity: user.themeSettings?.glowIntensity || 1,
          particleDensity: user.themeSettings?.particleDensity || 1,
          blurAmount: user.themeSettings?.blurAmount || 1,
        }
      })
      setIsDirty(false)
    }
  }, [
    user?.uid, user?.themeId, user?.accentColor, user?.buttonStyle, user?.textColor, 
    user?.buttonColor, user?.buttonTextColor, user?.verifiedBadgeStyle, plan,
    user?.themeSettings?.animationSpeed,
    user?.themeSettings?.glowIntensity,
    user?.themeSettings?.particleDensity,
    user?.themeSettings?.blurAmount
  ])

  useEffect(() => {
    if (user && plan) {
      const normalizedTheme = getTheme(user.themeId, plan);
      if (normalizedTheme.id !== user.themeId) {
        // Theme is no longer valid for this plan, downgrade in DB and state
        const updateData = { 
          themeId: normalizedTheme.id, 
          accentColor: normalizedTheme.accentColor,
          buttonStyle: normalizedTheme.buttonStyle 
        };
        // Auto-fix invalid themes immediately in DB
        updateUser(user.uid, updateData).then(() => updateUserField(updateData))
        rawSetFormData(prev => ({ 
          ...prev, 
          ...updateData
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, plan]);

  const handleThemeSelect = (tId: string, reqPlan: string) => {
    if ((reqPlan === 'PRO' && plan === 'FREE') || (reqPlan === 'PRO_PLUS' && plan !== 'PRO_PLUS')) {
      gate(reqPlan === 'PRO_PLUS' ? 'ultraPremiumThemes' : 'premiumThemes', () => {})
      return
    }
    const theme = getTheme(tId, plan)
    const newData = { 
      ...formData, 
      themeId: tId, 
      accentColor: theme.accentColor,
      buttonStyle: theme.buttonStyle,
      textColor: theme.textColor,
      buttonColor: theme.accentColor,
      buttonTextColor: theme.buttonTextColor || '#FFFFFF',
      themeSettings: {
        ...formData.themeSettings,
        animationSpeed: user?.themeSettings?.animationSpeed || 1,
        glowIntensity: user?.themeSettings?.glowIntensity || 1,
        particleDensity: user?.themeSettings?.particleDensity || 1,
        blurAmount: user?.themeSettings?.blurAmount || 1,
      }
    }
    setFormData(newData)
    setIsDirty(true)
  }

  const handleSave = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await updateUser(user.uid, formData)
      updateUserField(formData)
      setIsDirty(false)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDiscard = () => {
    if (!user) return
    const theme = getTheme(user.themeId || 'saffron', plan)
    rawSetFormData({
      themeId: user.themeId || 'saffron',
      accentColor: user.accentColor || theme.accentColor,
      buttonStyle: user.buttonStyle as User['buttonStyle'],
      textColor: user.textColor || theme.textColor,
      buttonColor: user.buttonColor || theme.accentColor,
      buttonTextColor: user.buttonTextColor || '#FFFFFF',
      verifiedBadgeStyle: user.verifiedBadgeStyle || 'dark-gold',
      themeSettings: {
        animationSpeed: user.themeSettings?.animationSpeed || 1,
        glowIntensity: user.themeSettings?.glowIntensity || 1,
        particleDensity: user.themeSettings?.particleDensity || 1,
        blurAmount: user.themeSettings?.blurAmount || 1,
      }
    })
    setIsDirty(false)
  }

  const primaryColor = formData.accentColor || '#FF6B00'

  return (
    <div className="grid xl:grid-cols-[1fr_320px] gap-8 relative xl:h-[calc(100vh-140px)] xl:overflow-hidden pb-12">
      {/* Mobile Floating Preview Trigger */}
      <button 
        onClick={() => setShowMobilePreview(true)}
        className="fixed bottom-6 right-6 z-40 xl:hidden w-14 h-14 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
        style={{ backgroundColor: primaryColor }}
      >
        <Eye size={24} />
      </button>

      <div className="space-y-10 xl:h-full xl:overflow-y-auto xl:pr-3 pb-24 no-scrollbar">
        <div className="flex items-center gap-4 border-b border-cream-3">
          <button 
            onClick={() => setActiveTab('themes')}
            className={cn(
              "pb-4 px-2 text-sm font-bold transition-all relative font-syne",
              activeTab === 'themes' ? "text-ink" : "text-muted hover:text-ink"
            )}
          >
            Themes
            {activeTab === 'themes' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: primaryColor }} />}
          </button>
          <button 
            onClick={() => {
              if (!can('customBranding')) {
                gate('customBranding', () => {})
                return
              }
              setActiveTab('custom')
            }}
            className={cn(
              "pb-4 px-2 text-sm font-bold transition-all relative font-syne",
              activeTab === 'custom' ? "text-ink" : "text-muted hover:text-ink"
            )}
          >
            Custom Branding
            {activeTab === 'custom' && <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: primaryColor }} />}
          </button>
        </div>

        {activeTab === 'themes' ? (
          <section className="space-y-10">
            {/* Quick Accent Selection */}
            <div className="bg-white p-6 rounded-[32px] border-2 border-cream-3 space-y-4 shadow-sm">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Palette size={16} style={{ color: primaryColor }} />
                  <span className="text-xs font-bold text-ink">Quick Accent Color</span>
                </div>
                <button 
                  onClick={() => setActiveTab('custom')}
                  className="text-[10px] font-black uppercase tracking-widest text-muted hover:text-ink transition-colors"
                >
                  Custom Branding →
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {BRAND_COLORS.slice(0, 12).map(c => (
                  <button
                    key={c}
                    onClick={() => { 
                      const newData = { 
                        ...formData, 
                        accentColor: c,
                        buttonColor: c
                      }
                      setFormData(newData)
                    }}
                    className={cn(
                      "w-8 h-8 rounded-xl border-2 transition-all hover:scale-110 active:scale-95",
                      formData.accentColor === c ? "ring-2 ring-offset-2 ring-ink" : "border-cream-3 shadow-sm"
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {THEMES.filter(t => !t.id.startsWith('pookie-') && !['strawberry-milk', 'cloud-nine', 'bubblegum-pop', 'butter-yellow', 'matcha-latte', 'baby-blue-sky', 'candy-floss', 'peach-boba', 'lavender-dreams', 'y2k-glitter'].includes(t.id)).map(t => {
                const isLocked = (t.requiredPlan === 'PRO' && plan === 'FREE') || (t.requiredPlan === 'PRO_PLUS' && plan !== 'PRO_PLUS')
                const isSelected = formData.themeId === t.id

                return (
                  <button
                    key={t.id}
                    onClick={() => handleThemeSelect(t.id, t.requiredPlan)}
                    className={cn(
                      "group relative flex flex-col p-1.5 sm:p-2 bg-white rounded-2xl border-2 transition-all overflow-hidden",
                      isSelected ? "shadow-lg ring-4" : "border-cream-3 hover:border-muted-2"
                    )}
                    style={{ 
                      borderColor: isSelected ? primaryColor : undefined,
                      boxShadow: isSelected ? `0 10px 15px -3px ${primaryColor}33` : undefined,
                      outlineColor: isSelected ? `${primaryColor}1A` : undefined
                    }}
                  >
                    <div className="w-full h-32 sm:h-40 rounded-xl mb-2 sm:mb-3 flex flex-col items-center justify-center gap-2 p-4 relative overflow-hidden">
                      <div className="absolute inset-0" style={{ background: t.preview }} />
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white/20 mb-1 sm:mb-2 z-10" />
                       <div className="w-full h-2.5 sm:h-3 rounded-full bg-white/20 z-10" />
                       <div className="w-full h-2.5 sm:h-3 rounded-full bg-white/20 z-10" />
                    </div>
                    
                    <div className="flex items-center justify-between px-1 sm:px-2 pb-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-ink">{t.name}</span>
                        {t.isAnimated && <span className="text-[7px] font-black text-orange">ANIMATED</span>}
                      </div>
                      {isLocked ? (
                        <Lock size={12} className="text-muted" />
                      ) : (
                        isSelected && <Check size={14} style={{ color: primaryColor }} />
                      )}
                    </div>

                    {isLocked && (
                      <div className="absolute top-2 right-2 bg-ink/80 backdrop-blur-md text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                        {t.requiredPlan}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Pookie Premium Themes Section */}
            <div className="space-y-6 pt-8 border-t border-cream-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <Sparkles size={20} className="text-pink-500" fill="currentColor" />
                    <h3 className="text-lg font-black font-syne text-ink">Premium Themes</h3>
                  </div>
                  <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Exclusive aesthetic themes for our top creators</p>
                </div>
                {plan === 'FREE' && (
                  <span className="bg-pink-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-pink-500/20">
                    <Lock size={10} /> PRO Exclusive
                  </span>
                )}
              </div>

              <div className="bg-pink-50/50 p-6 rounded-[40px] border-2 border-pink-100 shadow-sm">
                <PookieThemeSelector 
                  currentThemeId={formData.themeId}
                  onSelect={(tId) => handleThemeSelect(tId, 'PRO_PLUS')}
                  userPlan={plan}
                  onUpgrade={() => gate('ultraPremiumThemes', () => {})}
                />
              </div>
            </div>

            {/* Animation Customization - PRO+ ONLY */}
            <AnimatePresence>
              {getTheme(formData.themeId, plan).isAnimated && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="bg-white p-8 rounded-[40px] border-2 border-cream-3 space-y-8 shadow-xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12">
                    <Zap size={120} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange/10 flex items-center justify-center">
                        <Sliders size={20} className="text-orange" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black font-syne text-ink">Theme Settings</h3>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Customize your animated profile</p>
                      </div>
                    </div>
                    {plan !== 'PRO_PLUS' && (
                       <span className="px-3 py-1 bg-ink text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                         <Lock size={10} /> PRO+ Only
                       </span>
                    )}
                  </div>

                  <div className={cn("max-w-2xl", plan !== 'PRO_PLUS' && "opacity-40 pointer-events-none grayscale")}>
                    <div className="grid sm:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted">Animation Speed</label>
                            <span className="text-[11px] font-mono font-bold text-ink">{formData.themeSettings?.animationSpeed ?? 1}x</span>
                          </div>
                          <input 
                            type="range" min="0.5" max="2" step="0.1"
                            value={formData.themeSettings?.animationSpeed ?? 1}
                            onChange={(e) => setFormData({
                              ...formData,
                              themeSettings: { ...formData.themeSettings, animationSpeed: parseFloat(e.target.value) }
                            })}
                            className="w-full accent-orange"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted">Glow Intensity</label>
                            <span className="text-[11px] font-mono font-bold text-ink">{formData.themeSettings?.glowIntensity ?? 1}x</span>
                          </div>
                          <input 
                            type="range" min="0" max="2" step="0.1"
                            value={formData.themeSettings?.glowIntensity ?? 1}
                            onChange={(e) => setFormData({
                              ...formData,
                              themeSettings: { ...formData.themeSettings, glowIntensity: parseFloat(e.target.value) }
                            })}
                            className="w-full accent-orange"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted">Particle Density</label>
                            <span className="text-[11px] font-mono font-bold text-ink">{formData.themeSettings?.particleDensity ?? 1}x</span>
                          </div>
                          <input 
                            type="range" min="0" max="3" step="0.1"
                            value={formData.themeSettings?.particleDensity ?? 1}
                            onChange={(e) => setFormData({
                              ...formData,
                              themeSettings: { ...formData.themeSettings, particleDensity: parseFloat(e.target.value) }
                            })}
                            className="w-full accent-orange"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <label className="text-[11px] font-black uppercase tracking-widest text-muted">Blur Effect</label>
                            <span className="text-[11px] font-mono font-bold text-ink">{formData.themeSettings?.blurAmount ?? 1}x</span>
                          </div>
                          <input 
                            type="range" min="0" max="2" step="0.1"
                            value={formData.themeSettings?.blurAmount ?? 1}
                            onChange={(e) => setFormData({
                              ...formData,
                              themeSettings: { ...formData.themeSettings, blurAmount: parseFloat(e.target.value) }
                            })}
                            className="w-full accent-orange"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {plan !== 'PRO_PLUS' && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center p-8 z-20">
                      <div className="bg-ink text-white p-6 rounded-3xl shadow-2xl text-center max-w-xs space-y-4">
                        <Zap className="mx-auto text-orange" size={32} fill="currentColor" />
                        <h4 className="font-syne font-black uppercase text-sm tracking-widest">Upgrade to PRO+</h4>
                        <p className="text-[10px] font-medium opacity-70 leading-relaxed">
                          Unlock full customization of animated themes, custom speeds, particle density, and more.
                        </p>
                        <button 
                          onClick={() => gate('canCollectEmails', () => {})}
                          className="w-full py-3 bg-orange text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg shadow-orange/20"
                        >
                          Unlock Theme Engine
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Premium Theme Customization Section */}
            {plan !== 'FREE' && (
              <div className="pt-8 border-t border-cream-2 space-y-12">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-orange/10">
                    <Zap size={20} className="text-orange" fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-ink">Premium Customization</h3>
                    <p className="text-xs font-medium text-muted">Fine-tune your brand aesthetics with expert controls.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                   {/* Font Style */}
                   <div className="space-y-4">
                      <label className="label-text">Typography Style</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { id: 'sans', name: 'Modern Sans', class: 'font-jakarta' },
                          { id: 'grotesk', name: 'Retro Grotesk', class: 'font-grotesk' },
                          { id: 'serif', name: 'Classic Serif', class: 'font-serif' },
                          { id: 'mono', name: 'Tech Mono', class: 'font-mono' },
                          { id: 'rounded', name: 'Playful Rounded', class: 'font-rounded' },
                          { id: 'display', name: 'Artistic Display', class: 'font-syne' }
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setFormData({
                              ...formData,
                              themeSettings: { 
                                ...formData.themeSettings, 
                                fontStyle: f.id as 'sans' | 'mono' | 'serif' | 'display' | 'grotesk' | 'rounded'
                              }
                            })}
                            className={cn(
                              "p-4 rounded-2xl border-2 text-left transition-all hover:scale-[1.02]",
                              (formData.themeSettings?.fontStyle === f.id || (!formData.themeSettings?.fontStyle && f.id === 'sans'))
                                ? "bg-ink border-ink text-white" 
                                : "bg-white border-cream-3 text-ink hover:border-muted"
                            )}
                          >
                            <span className={cn("text-xs font-bold block mb-1", f.class)}>Aa</span>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-70">{f.name}</span>
                          </button>
                        ))}
                      </div>
                   </div>

                   {/* Border Radius */}
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="label-text">Corner Rounding</label>
                        <span className="text-[10px] font-mono font-bold text-orange">{formData.themeSettings?.borderRadius ?? 16}px</span>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-cream-3 shadow-sm">
                        <input 
                          type="range" min="0" max="40" step="4"
                          value={formData.themeSettings?.borderRadius ?? 16}
                          onChange={(e) => setFormData({
                            ...formData,
                            themeSettings: { ...formData.themeSettings, borderRadius: parseInt(e.target.value) }
                          })}
                          className="w-full accent-orange h-2 bg-cream rounded-full appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between mt-4">
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted">Sharp</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted">Extra Rounded</span>
                        </div>
                      </div>
                   </div>

                   {/* Card Transparency */}
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="label-text">Glass Transparency</label>
                        <span className="text-[10px] font-mono font-bold text-orange">{Math.round((formData.themeSettings?.cardTransparency ?? 1) * 100)}%</span>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-cream-3 shadow-sm">
                        <input 
                          type="range" min="0.05" max="1" step="0.05"
                          value={formData.themeSettings?.cardTransparency ?? 1}
                          onChange={(e) => setFormData({
                            ...formData,
                            themeSettings: { ...formData.themeSettings, cardTransparency: parseFloat(e.target.value) }
                          })}
                          className="w-full accent-orange h-2 bg-cream rounded-full appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between mt-4">
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted">Ghost</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted">Solid</span>
                        </div>
                      </div>
                   </div>

                   {/* Gradient Intensity */}
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="label-text">Gradient Strength</label>
                        <span className="text-[10px] font-mono font-bold text-orange">{Math.round((formData.themeSettings?.bgGradientIntensity ?? 0.5) * 100)}%</span>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-cream-3 shadow-sm">
                        <input 
                          type="range" min="0" max="1" step="0.1"
                          value={formData.themeSettings?.bgGradientIntensity ?? 0.5}
                          onChange={(e) => setFormData({
                            ...formData,
                            themeSettings: { ...formData.themeSettings, bgGradientIntensity: parseFloat(e.target.value) }
                          })}
                          className="w-full accent-orange h-2 bg-cream rounded-full appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between mt-4">
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted">Subtle</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted">Vibrant</span>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

          </section>
        ) : (
          <div className="space-y-12">
             {/* Theme & Color Customization */}
             <section className="space-y-10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette size={18} style={{ color: primaryColor }} />
                      <h4 className="text-sm font-bold text-ink">Brand Accent Color</h4>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted">Direct Pick</span>
                  </div>
                  
                  <div className="bg-white p-6 rounded-[32px] border-2 border-cream-3 space-y-6 shadow-sm">
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                      {BRAND_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => { 
                            const newData = { 
                              ...formData, 
                              accentColor: c,
                              buttonColor: c,
                              textColor: (c === '#1C1813' || c === '#111827') ? '#FFFFFF' : formData.textColor
                            }
                            setFormData(newData)
                          }}
                          className={cn(
                            "aspect-square rounded-2xl border-2 transition-all hover:scale-110 active:scale-95 group relative",
                            formData.accentColor === c ? "ring-2 ring-offset-2 ring-ink" : "border-cream-3"
                          )}
                          style={{ background: c }}
                        >
                          {formData.accentColor === c && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check size={12} className={cn((c === '#1C1813' || c === '#111827') ? "text-white" : "text-white shadow-sm")} />
                            </div>
                          )}
                        </button>
                      ))}
                      <button 
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className={cn(
                          "aspect-square rounded-2xl border-2 border-dashed border-cream-3 flex items-center justify-center text-muted hover:border-ink hover:text-ink transition-all",
                          showColorPicker && "bg-cream border-ink text-ink"
                        )}
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    <AnimatePresence>
                      {showColorPicker && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pt-4 border-t border-cream overflow-hidden"
                        >
                           <div className="p-4 bg-cream/30 rounded-3xl grid md:grid-cols-[200px_1fr] gap-6">
                              <div className="[&_.react-colorful]:w-full [&_.react-colorful]:h-32">
                                <HexColorPicker 
                                  color={formData.accentColor} 
                                  onChange={(c) => { 
                                    setFormData(prev => ({ ...prev, accentColor: c })); 
                                  }} 
                                />
                              </div>
                              <div className="space-y-4">
                                <div className="p-4 bg-white rounded-2xl border border-cream shadow-sm">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Hex Value</p>
                                  <input 
                                    type="text"
                                    value={formData.accentColor}
                                    onChange={(e) => {
                                      const val = e.target.value
                                      setFormData(prev => ({ ...prev, accentColor: val }))
                                    }}
                                    className="w-full text-xl font-mono font-bold text-ink bg-transparent outline-none"
                                  />
                                </div>
                                <p className="text-[10px] text-muted leading-relaxed font-medium">Fine-tune your brand color. This updates links, profile borders, and button accents.</p>
                              </div>
                           </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-ink/50">Base Text</h4>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-cream-3 hover:border-muted shadow-sm transition-all">
                      <div 
                        className="w-10 h-10 rounded-xl shrink-0 border border-cream-3 shadow-inner" 
                        style={{ backgroundColor: formData.textColor }} 
                      />
                      <div className="flex-1">
                        <input 
                          type="color" 
                          value={formData.textColor}
                          onChange={(e) => { 
                            const val = e.target.value
                            setFormData({...formData, textColor: val})
                          }}
                          className="absolute w-0 h-0 opacity-0"
                          id="textColInv"
                        />
                        <label htmlFor="textColInv" className="block text-[10px] font-mono font-bold cursor-pointer uppercase truncate">
                          {formData.textColor}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-ink/50">Button Fill</h4>
                    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-cream-3 hover:border-muted shadow-sm transition-all">
                      <div 
                        className="w-10 h-10 rounded-xl shrink-0 border border-cream-3 shadow-inner" 
                        style={{ backgroundColor: formData.buttonColor || formData.accentColor }} 
                      />
                      <div className="flex-1">
                        <input 
                          type="color" 
                          value={formData.buttonColor || formData.accentColor}
                          onChange={(e) => { 
                            const val = e.target.value
                            setFormData({...formData, buttonColor: val})
                          }}
                          className="absolute w-0 h-0 opacity-0"
                          id="buttColInv"
                        />
                        <label htmlFor="buttColInv" className="block text-[10px] font-mono font-bold cursor-pointer uppercase truncate">
                          {formData.buttonColor || 'Same'}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-ink/50">Label Color</h4>
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                        onClick={() => {
                          const newData = { ...formData, buttonTextColor: '#FFFFFF' }
                          setFormData(newData)
                        }}
                        className={cn(
                          "h-16 flex flex-col items-center justify-center rounded-2xl border-2 transition-all",
                          formData.buttonTextColor === '#FFFFFF' ? "bg-ink border-ink" : "border-cream-3 hover:border-muted group"
                        )}
                       >
                        <div className="w-5 h-5 bg-white rounded shadow-sm mb-2" />
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", formData.buttonTextColor === '#FFFFFF' ? "text-white" : "text-muted group-hover:text-ink")}>White</span>
                       </button>
                       <button 
                        onClick={() => {
                          const newData = { ...formData, buttonTextColor: '#1C1813' }
                          setFormData(newData)
                        }}
                        className={cn(
                          "h-16 flex flex-col items-center justify-center rounded-2xl border-2 transition-all",
                          formData.buttonTextColor === '#1C1813' ? "bg-ink border-ink" : "border-cream-3 hover:border-muted group"
                        )}
                       >
                        <div className="w-5 h-5 bg-ink rounded shadow-sm mb-2" />
                        <span className={cn("text-[9px] font-black uppercase tracking-widest", formData.buttonTextColor === '#1C1813' ? "text-white" : "text-muted group-hover:text-ink")}>Dark</span>
                       </button>
                    </div>
                  </div>
                </div>
             </section>

             {/* Button Styles */}
             <section className="space-y-4">
                <div className="flex items-center gap-2">
                  <MousePointer2 size={18} style={{ color: primaryColor }} />
                  <h3 className="text-lg font-bold text-ink">Button Styles</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                   {BUTTON_STYLES.map(s => (
                     <button
                        key={s.id}
                        onClick={() => { 
                          const newData = { ...formData, buttonStyle: s.id as User['buttonStyle'] };
                          setFormData(newData); 
                        }}
                        className={cn(
                          "p-4 rounded-2xl border-2 transition-all flex items-center justify-between group text-left",
                          formData.buttonStyle === s.id ? "bg-opacity-5" : "border-cream-3 hover:border-muted-2"
                        )}
                        style={{ 
                          borderColor: formData.buttonStyle === s.id ? primaryColor : undefined,
                          backgroundColor: formData.buttonStyle === s.id ? `${primaryColor}0D` : undefined
                        }}
                     >
                       <div>
                         <p className="text-xs font-bold text-ink">{s.label}</p>
                         <p className="text-[10px] text-muted">{s.desc}</p>
                       </div>
                       <div 
                         className={cn(
                           "w-12 h-6 border-2 transition-all",
                           s.id === 'filled' ? "rounded-md" :
                           s.id === 'pill' ? "rounded-full" :
                           s.id === 'outline' ? "rounded-md" :
                           "rounded-md"
                         )}
                         style={{
                           background: s.id === 'filled' || s.id === 'pill' ? (formData.buttonColor || formData.accentColor) : s.id === 'soft' ? `${formData.buttonColor || formData.accentColor}33` : 'transparent',
                           borderColor: formData.buttonColor || formData.accentColor,
                         }}
                       />
                     </button>
                   ))}
                </div>
             </section>

             {/* Premium Verified Badge System */}
             <section className="space-y-4 pt-6 border-t border-cream-3">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Award size={18} style={{ color: primaryColor }} />
                   <h3 className="text-lg font-bold text-ink">Verified Badge Style</h3>
                 </div>
                 {plan !== 'PRO_PLUS' && (
                   <span className={cn("bg-purple-100 text-purple-700 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider", plan === 'PRO_PLUS' && "hidden")}>
                     PREMIUM FEATURE
                   </span>
                 )}
               </div>
               
               <p className="text-xs text-muted max-w-lg">
                 Customize the look of your exclusive creator verification ornament. Select from premium high-end designs.
               </p>

               <div className="grid sm:grid-cols-2 gap-3 mt-3">
                 {BADGE_STYLES.map(style => {
                   const isStyleLocked = plan !== 'PRO_PLUS'
                   return (
                     <button
                       key={style.id}
                       type="button"
                       onClick={() => {
                         if (isStyleLocked) {
                           gate('ultraPremiumThemes', () => {})
                           return
                         }
                         setFormData(prev => ({
                           ...prev,
                           verifiedBadgeStyle: style.id as User['verifiedBadgeStyle']
                         }))
                       }}
                       className={cn(
                         "relative p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left group overflow-hidden",
                         formData.verifiedBadgeStyle === style.id 
                           ? "bg-opacity-5 border-purple-500 bg-purple-500/5 select-none" 
                           : "border-cream-3 hover:border-muted-2"
                       )}
                       style={{
                         borderColor: formData.verifiedBadgeStyle === style.id ? '#A855F7' : undefined
                       }}
                     >
                       <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl bg-cream/30">
                         <VerifiedBadge 
                           user={{ 
                             plan: 'PRO_PLUS', // Force rendering for display inside selection buttons
                             isVerified: true,
                             status: 'ACTIVE',
                             verifiedBadgeStyle: style.id as VerifiedBadgeStyle
                           }} 
                           size="md" 
                           forceShow
                         />
                       </div>
                       
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-1.5">
                           <p className="text-xs font-bold text-ink truncate">{style.label}</p>
                           {isStyleLocked && (
                             <Lock size={10} className="text-purple-500 shrink-0" />
                           )}
                         </div>
                         <p className="text-[10px] text-muted line-clamp-1">{style.desc}</p>
                       </div>
                     </button>
                   )
                 })}
               </div>
             </section>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted font-medium bg-cream-2 p-4 rounded-xl">
           <RefreshCw size={14} className={isSaving ? 'animate-spin' : ''} />
           {isSaving ? 'Saving changes...' : (hasChanges && isDirty ? 'Unsaved changes' : 'All changes applied')}
        </div>
      </div>

      {/* Floating Save Controls */}
      <AnimatePresence>
        {hasChanges && isDirty && !sidebarOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 w-[90%] md:w-auto overflow-hidden bg-ink text-white rounded-3xl shadow-2xl shadow-ink/20 border border-white/10 p-2 md:p-3 flex items-center gap-2 md:gap-4 ring-4 ring-ink/10"
          >
            <div className="hidden md:flex flex-col px-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Unsaved Changes</span>
              <span className="text-xs font-bold whitespace-nowrap">Apply to your profile</span>
            </div>
            
            <button 
              onClick={handleDiscard}
              disabled={isSaving}
              className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Discard
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-white/5 active:scale-95 transition-all disabled:grayscale disabled:opacity-50"
              style={{ 
                backgroundColor: primaryColor,
                color: isLightColor(primaryColor) ? '#000000' : '#FFFFFF'
              }}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply Changes'
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview */}
      <div className="hidden xl:block xl:sticky xl:top-0 self-start">
        {isDesktop && <PhonePreview user={{ ...user, ...formData } as Partial<User>} links={links} products={products} showStore={false} />}
      </div>

      {/* Mobile Preview Modal */}
      <AnimatePresence>
        {showMobilePreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] xl:hidden flex flex-col pt-12 pb-6 px-4 bg-ink/90 backdrop-blur-md"
            style={{ 
              background: POOKIE_THEMES.some(t => t.id === formData.themeId) 
                ? getPookieTheme(formData.themeId).pageBg 
                : undefined 
            }}
          >
            {POOKIE_THEMES.some(t => t.id === formData.themeId) && (
              <PookieBackground theme={getPookieTheme(formData.themeId)} />
            )}
            <div className="absolute top-4 right-4 z-[70]">
               <button 
                 onClick={() => setShowMobilePreview(false)}
                 className="w-10 h-10 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
               >
                 <Plus size={24} className="rotate-45" />
               </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center">
               <div className="relative z-10 scale-90 sm:scale-100">
                  <PhonePreview user={{ ...user, ...formData } as Partial<User>} links={links} products={products} showStore={false} />
               </div>
            </div>

            <p className="text-white/40 text-[10px] text-center font-bold uppercase tracking-widest mt-4">
               Live Preview • Unsaved Changes
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
