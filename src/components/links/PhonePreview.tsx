import React, { useState, useEffect } from 'react'
import { getTheme } from '@/constants/themes'
import { AnimatedBackground } from '@/components/themes/AnimatedBackground'
import { filterLinksByPlan } from '@/constants/plans'
import { cn, isLightColor, getFallbackAvatarGradient, getFallbackAvatarInitials } from '@/utils/formatters'
import type { User, Link, Product } from '@/types'
import { Instagram, Youtube, Twitter, Linkedin, Link as LinkIcon, ShoppingBag, ArrowRight, MapPin, Smartphone, Zap } from 'lucide-react'
import { getIconForUrl } from '@/utils/linkUtils'
import { trackClick } from '@/firebase/firestore'
import { formatPrice } from '@/utils/currency'

// Pookie Theme Imports
import { POOKIE_THEMES, getPookieTheme } from '@/themes/pookie'
import { PookieBackground } from '@/themes/pookie/PookieBackground'
import { PookieLinkButton } from '@/themes/pookie/components/PookieLinkButton'
import { PookieAvatar } from '@/themes/pookie/components/PookieAvatar'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'

interface PhonePreviewProps {
  user: Partial<User>
  links: Link[]
  products?: Product[]
  showStore?: boolean
}

export function PhonePreview({ user, links, products = [], showStore = true }: PhonePreviewProps) {
  const plan = user.plan || 'FREE'
  const isPookie = POOKIE_THEMES.some(t => t.id === user.themeId)
  const pookieTheme = isPookie ? getPookieTheme(user.themeId!) : null
  const theme = getTheme(user.themeId || 'saffron', plan)
  
  const autoTextColor = isLightColor(theme.bgColor) ? '#000000' : '#FFFFFF'
  
  const effectiveAccentColor = user.accentColor || theme.accentColor
  const effectiveButtonStyle = user.buttonStyle || theme.buttonStyle
  const effectiveTextColor = user.textColor || autoTextColor
  const effectiveButtonColor = user.buttonColor || user.accentColor || theme.accentColor
  const rawButtonTextColor = user.buttonTextColor || theme.buttonTextColor || (effectiveButtonStyle === 'filled' || effectiveButtonStyle === 'pill' ? '#FFFFFF' : effectiveButtonColor)
  
  const isButtonBgLight = isLightColor(effectiveButtonColor)
  const isButtonTextLight = isLightColor(rawButtonTextColor)
  const effectiveButtonTextColor = user.buttonTextColor 
    ? user.buttonTextColor 
    : ((effectiveButtonStyle === 'filled' || effectiveButtonStyle === 'pill')
        ? (isButtonBgLight === isButtonTextLight 
            ? (isButtonBgLight ? '#1C1813' : '#FFFFFF') 
            : rawButtonTextColor)
        : rawButtonTextColor)

  const effectiveRadius = user.themeSettings?.borderRadius ?? theme.borderRadius ?? (effectiveButtonStyle === 'pill' ? 999 : 16)
  const effectiveTransparency = user.themeSettings?.cardTransparency ?? theme.cardTransparency ?? (theme.isGlass ? 0.1 : 1)
  const effectiveFont = user.themeSettings?.fontStyle ?? theme.fontStyle ?? 'sans'

  const isBgLight = isLightColor(theme.bgColor)
  const standardCardBg = theme.isGlass 
    ? `rgba(255,255,255,${user.themeSettings?.cardTransparency ?? theme.cardTransparency ?? 0.1})` 
    : (isBgLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)')
  const standardCardTextColor = isBgLight ? '#1C1813' : '#FFFFFF'
  const standardCardMutedColor = isBgLight ? '#655F55' : 'rgba(255,255,255,0.65)'

  const fontFamilies = {
    sans: 'font-jakarta',
    mono: 'font-mono',
    serif: 'font-serif',
    display: 'font-syne',
    grotesk: 'font-grotesk',
    rounded: 'font-rounded'
  }

  const currentFontClass = fontFamilies[effectiveFont] || 'font-jakarta'

  const [upiAmount, setUpiAmount] = useState('100')

  const upiLinkDoc = links.find(l => l.type === 'UPI' || l.type === 'upi_tip')

  useEffect(() => {
    if (upiLinkDoc?.defaultAmount) {
      setUpiAmount(String(upiLinkDoc.defaultAmount))
    } else if (user?.upiDefaultAmount) {
      setUpiAmount(String(user.upiDefaultAmount))
    }
  }, [upiLinkDoc?.defaultAmount, user?.upiDefaultAmount])

  const rawUpiId = user?.upiId || upiLinkDoc?.upiId || (upiLinkDoc?.url?.startsWith('upi://') ? new URLSearchParams(upiLinkDoc.url.split('?')[1]).get('pa') : null) || ''
  const targetUpiId = typeof rawUpiId === 'string' ? rawUpiId.trim() : ''
  const hasValidUpiId = !!targetUpiId && targetUpiId !== '' && targetUpiId.includes('@')
  
  // Enabled if EITHER profile settings enable it OR upi Link is active
  const isUpiSetup = hasValidUpiId && (user?.upiEnabled !== false || (upiLinkDoc && upiLinkDoc.isActive !== false))
  const showSupportCard = isUpiSetup

  // Support details (merge fallback)
  const upiTitle = (user?.upiTitle && user.upiTitle !== '') ? user.upiTitle : (upiLinkDoc?.title && upiLinkDoc.title !== '' ? upiLinkDoc.title : 'Send Sweet Tip')
  const upiDescription = (user?.upiDescription && user.upiDescription !== '') ? user.upiDescription : (upiLinkDoc?.description && upiLinkDoc.description !== '' ? upiLinkDoc.description : 'Send a Sweet Tip')
  const upiGoalEnabled = user?.upiGoalEnabled !== undefined ? user.upiGoalEnabled : (upiLinkDoc?.upiGoalEnabled || false)
  const upiGoalTitle = (user?.upiGoalTitle && user.upiGoalTitle !== '') ? user.upiGoalTitle : (upiLinkDoc?.upiGoalTitle || 'Support Goal')
  const upiGoalTarget = Number(user?.upiGoalTarget) || Number(upiLinkDoc?.upiGoalTarget) || 0
  const upiGoalRaised = Number(user?.upiGoalRaised) || Number(upiLinkDoc?.upiGoalRaised) || 0
  const upiCardRadius = 24
  const upiButtonRadius = 12

  // Enforce plan-based link limits and types
  const displayLinks = filterLinksByPlan(links, plan)

  const filteredLinks = displayLinks.filter(link => {
    if (!link.title || link.title.trim() === '') {
      return false
    }
    if (link.type === 'UPI' || link.type === 'upi_tip') {
      return !showSupportCard
    }
    return true
  })

  const SocialIcon = ({ handle, icon: Icon, url, isPookie }: { handle?: string, icon: React.ElementType, url: string, isPookie?: boolean }) => {
    if (!handle) return null
    return (
      <a 
        href={String(url || '').replace('{handle}', handle)} 
        target="_blank"  rel="noopener noreferrer"
        className={cn(
          "p-2 transition-transform hover:scale-110",
          isPookie ? "rounded-xl border shadow-sm" : "opacity-70"
        )}
        style={{ 
          color: pookieTheme ? pookieTheme.socialIconColor : effectiveTextColor,
          backgroundColor: isPookie ? pookieTheme?.socialBg : 'transparent',
          borderColor: isPookie ? pookieTheme?.socialBorder : 'transparent'
        }}
      >
        <Icon size={isPookie ? 16 : 18} />
      </a>
    )
  }

  // If it's a Pookie theme, render the Pookie specific preview
  if (pookieTheme) {
    return (
      <div 
        className={cn("relative mx-auto w-[280px] h-[560px] rounded-[45px] border-[10px] border-ink-2 shadow-2xl overflow-hidden shrink-0 transition-all duration-500 flex flex-col", pookieTheme.nameFont.includes('Syne') ? 'font-syne' : 'font-jakarta')}
        style={{ backgroundImage: pookieTheme.pageBg }}
      >
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-ink-2 rounded-b-2xl z-10" />
          
          <PookieBackground theme={pookieTheme} />

          {/* Preview Badge */}
          {filteredLinks.length === 0 && (
            <div className="absolute top-10 left-0 right-0 z-50 pointer-events-none flex justify-center">
              <div className="bg-ink/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-[0.2em] py-1 px-3 rounded-full flex items-center gap-1.5 shadow-xl border border-white/10">
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                Preview Mode
              </div>
            </div>
          )}

          <div className="w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center pt-10 pb-8 px-4 relative z-10">
            <div className="shrink-0 mb-4">
              <PookieAvatar 
                  avatarUrl={user.avatarUrl || null} 
                  displayName={user.displayName || 'Your Name'} 
                  theme={pookieTheme} 
              />
            </div>

            {(() => {
              const nameText = user.displayName || 'Your Name'
              const nameLength = nameText.length
              let nameSize = "14px"
              if (nameLength > 18) {
                nameSize = "11px"
              } else if (nameLength > 12) {
                nameSize = "12px"
              } else if (nameLength > 8) {
                nameSize = "13px"
              }
              
              return (
                <div 
                  className="font-black mt-3 mb-1 text-center leading-tight px-2 shrink-0 max-w-full"
                  style={{ 
                    color: pookieTheme.nameColor, 
                    fontFamily: pookieTheme.nameFont,
                    fontSize: nameSize,
                    textShadow: user.nameGlow || 'none'
                  }}
                >
                  <span className="align-middle inline-block truncate max-w-[85%]">{nameText}</span>
                  <VerifiedBadge user={user} size="sm" className="inline-block ml-1.5 align-middle" />
                </div>
              )
            })()}

            {user.location && (
              <div 
                className="flex items-center justify-center gap-1 text-[8px] font-black uppercase tracking-widest mb-3 opacity-80 shrink-0"
                style={{ color: pookieTheme.handleColor }}
              >
                <MapPin size={9} className="opacity-80 shrink-0" />
                <span>{user.location}</span>
              </div>
            )}
            
            <p 
              className="text-[8px] font-bold text-center mb-5 px-6 uppercase tracking-wider opacity-80 leading-relaxed shrink-0"
              style={{ color: pookieTheme.bioColor }}
            >
              {user.bio || 'This is where your bio will appear.'}
            </p>

            {/* CTA Section */}
            {products.length > 0 && (plan === 'PRO' || plan === 'PRO_PLUS') && (
              <div className="w-full flex justify-center mb-5 shrink-0">
                <div 
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-widest shadow-md"
                  style={{ 
                    background: pookieTheme.accentColor,
                    color: isLightColor(pookieTheme.accentColor) ? '#000000' : '#FFFFFF',
                  }}
                >
                  <ShoppingBag size={11} className="shrink-0" />
                  <span>View Shop</span>
                  <ArrowRight size={10} className="shrink-0" />
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-2 mb-4 shrink-0">
              <SocialIcon handle={user.instagramHandle} icon={Instagram} url="https://instagram.com/{handle}" isPookie={true} />
              <SocialIcon handle={user.youtubeHandle} icon={Youtube} url="https://youtube.com/@{handle}" isPookie={true} />
              <SocialIcon handle={user.twitterHandle} icon={Twitter} url="https://twitter.com/{handle}" isPookie={true} />
              <SocialIcon handle={user.linkedinHandle} icon={Linkedin} url="https://linkedin.com/in/{handle}" isPookie={true} />
            </div>

            <div className="w-full space-y-3 mb-6">
              {filteredLinks.length > 0 ? (
                filteredLinks.map((link, i) => (
                  <PookieLinkButton
                    key={link.id}
                    link={link}
                    theme={pookieTheme}
                    uid={user.uid || ''}
                    index={i}
                  />
                ))
              ) : (
                <div className="space-y-3 w-full">
                  {[
                    { title: 'My Viral Youtube Video', url: 'https://youtube.com/watch' },
                    { title: 'Daily Life Updates', url: 'https://instagram.com/pookie' },
                    { title: 'Support My Work', url: 'https://buymeacoffee.com' },
                    { title: 'Check My Website', url: 'https://google.com' }
                  ].map((link, i) => (
                    <PookieLinkButton
                      key={i}
                      link={{ ...link, id: `demo-${i}`, isActive: true } as Link}
                      theme={pookieTheme}
                      uid=""
                      index={i}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pookie-styled Email Newsletter Form */}
            {user.emailFormActive && (plan === 'PRO' || plan === 'PRO_PLUS') && (
              <div 
                className="w-full mb-6 p-6 rounded-[32px] border relative overflow-hidden shrink-0"
                style={{ 
                  background: pookieTheme.cardBg,
                  borderColor: pookieTheme.cardBorder.split('solid ').pop() || '#eee',
                  boxShadow: pookieTheme.cardShadow,
                  border: user.plan === 'PRO_PLUS' ? `2px dashed ${pookieTheme.accentColor}` : undefined
                }}
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-10" style={{ background: pookieTheme.accentColor }} />
                
                <div className="text-center mb-4">
                  <h4 className="font-black text-base sm:text-lg mb-1 leading-normal" style={{ color: pookieTheme.nameColor, fontFamily: pookieTheme.nameFont }}>
                    {user.emailFormTitle || 'Join My Newsletter'}
                  </h4>
                  <p className="text-[10px] sm:text-xs font-medium opacity-70 leading-relaxed max-w-sm mx-auto" style={{ color: pookieTheme.bioColor }}>
                    {user.emailFormDesc || 'Get updates, free resources and template launches.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <input
                    type="email"
                    disabled
                    placeholder="Enter your email"
                    className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all font-sans text-center"
                    style={{ 
                      color: pookieTheme.nameColor,
                      borderColor: pookieTheme.cardBorder.split('solid ').pop() || '#eee',
                      background: pookieTheme.socialBg || 'rgba(255,255,255,0.4)',
                    }}
                  />
                  <button
                    type="button"
                    className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md flex items-center justify-center animate-fadeIn"
                    style={{
                      background: pookieTheme.accentColor,
                      color: isLightColor(pookieTheme.accentColor) ? '#000000' : '#FFFFFF'
                    }}
                  >
                    <span>{user.emailFormBtn || 'Subscribe'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Pookie UPI Tip Jar */}
            {showSupportCard && (
              <div 
                className="w-full mb-6 p-6 rounded-[32px] border text-center relative overflow-hidden shrink-0"
                style={{ 
                  background: pookieTheme.cardBg,
                  borderColor: pookieTheme.cardBorder.split('solid ').pop() || '#eee',
                  boxShadow: pookieTheme.cardShadow,
                  border: user.plan === 'PRO_PLUS' ? `2px dashed ${pookieTheme.accentColor}` : undefined
                }}
              >
                <div className="absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-10" style={{ background: pookieTheme.accentColor }} />
                
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${pookieTheme.accentColor}15`, color: pookieTheme.accentColor }}>
                  <Smartphone size={24} />
                </div>
                <h4 className="font-black text-base sm:text-lg mb-1 leading-normal" style={{ color: pookieTheme.nameColor, fontFamily: pookieTheme.nameFont }}>{upiDescription}</h4>
                <p className="text-[10px] sm:text-xs font-medium opacity-60 mb-6" style={{ color: pookieTheme.bioColor }}>Direct support via any UPI app 🎀</p>
                
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {['50', '100', '500'].map(amt => (
                    <button 
                      key={amt} 
                      type="button"
                      onClick={() => setUpiAmount(amt)}
                      className={cn(
                        "py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest border transition-all",
                        upiAmount === amt 
                          ? "text-white" 
                          : "bg-transparent"
                      )}
                      style={{ 
                        background: upiAmount === amt ? pookieTheme.accentColor : 'transparent',
                        color: upiAmount === amt 
                          ? (isLightColor(pookieTheme.accentColor) ? '#000000' : '#FFFFFF') 
                          : pookieTheme.nameColor,
                        borderColor: upiAmount === amt ? pookieTheme.accentColor : pookieTheme.cardBorder.split('solid ').pop() || '#eee'
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Input Field */}
                <div className="w-full mb-6">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black" style={{ color: pookieTheme.accentColor }}>₹</span>
                    <input 
                      type="number" 
                      value={upiAmount} 
                      onChange={(e) => setUpiAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 border rounded-xl text-xs font-black text-center focus:outline-none transition-all"
                      style={{ 
                        borderColor: pookieTheme.cardBorder.split('solid ').pop() || '#eee', 
                        color: pookieTheme.nameColor,
                        background: pookieTheme.socialBg || 'rgba(255,255,255,0.4)',
                      }}
                      placeholder="Custom Amount"
                      min="1"
                    />
                  </div>
                </div>

                {/* Support Goals section for PRO_PLUS */}
                {user.plan === 'PRO_PLUS' && upiGoalEnabled && (
                  <div className="w-full mb-6 p-4 rounded-2xl border text-left" style={{ background: `${pookieTheme.accentColor}10`, borderColor: pookieTheme.cardBorder.split('solid ').pop() || '#eee' }}>
                    {(() => {
                      const title = upiGoalTitle
                      const target = Number(upiGoalTarget)
                      const raised = Number(upiGoalRaised)
                      const percent = target > 0 ? Math.min(Math.round((raised / target) * 100), 100) : 0
                      return (
                        <>
                          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider mb-1.5" style={{ color: pookieTheme.nameColor }}>
                            <span>🎀 Goal: {title}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full overflow-hidden font-sans" style={{ background: `${pookieTheme.accentColor}20` }}>
                            <div 
                              className="h-full transition-all duration-500"
                              style={{ width: `${percent}%`, background: pookieTheme.accentColor }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[8px] font-bold mt-1.5" style={{ color: pookieTheme.bioColor }}>
                            <span>Raised: ₹{raised.toLocaleString('en-IN')}</span>
                            <span>Goal: ₹{target.toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}

                <button 
                  type="button"
                  className="w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-transform shrink-0"
                  style={{ 
                    background: pookieTheme.accentColor,
                    color: isLightColor(pookieTheme.accentColor) ? '#000000' : '#FFFFFF'
                  }}
                >
                  <span>{upiTitle || 'Send Sweet Tip'} ({upiAmount})</span>
                  <Zap size={10} className={cn((isLightColor(pookieTheme.accentColor) ? "fill-black text-black" : "fill-white text-white"))} style={{ fill: isLightColor(pookieTheme.accentColor) ? '#000000' : '#FFFFFF' }} />
                </button>
              </div>
            )}

            {/* Store Products */}
            {showStore && products.length > 0 && (plan === 'PRO_PLUS' || plan === 'PRO' || products.length > 0) && (
              <div className="w-full space-y-4 pt-2 mb-10 shrink-0">
                 <div className="flex items-center gap-1.5 px-1 opacity-60">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] bg-white/20">🛍️</div>
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: pookieTheme.handleColor }}>Shop</span>
                 </div>
                 <div className="space-y-4">
                    {products.map((p) => (
                       <div 
                        key={p.id}
                        className="rounded-[24px] overflow-hidden border shadow-sm p-1.5 shrink-0"
                        style={{ 
                          background: pookieTheme.cardBg,
                          borderColor: pookieTheme.cardBorder.split('solid ').pop() || '#eee' 
                        }}
                       >
                          <div className="aspect-[21/9] relative overflow-hidden rounded-[20px]">
                              {p.imageUrl ? (
                                <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-pink-50 flex items-center justify-center text-pink-200">
                                   <ShoppingBag size={24} />
                                </div>
                              )}
                          </div>
                          <div className="p-3 flex items-center justify-between gap-2">
                             <div className="min-w-0">
                                <h4 className="font-bold text-xs truncate" style={{ color: pookieTheme.nameColor }}>{p.name || p.title}</h4>
                                <p className="font-black text-xs" style={{ color: pookieTheme.accentColor }}>{formatPrice(p.price, p.currency)}</p>
                             </div>
                             <div 
                               className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                               style={{ 
                                 background: pookieTheme.accentColor,
                                 color: isLightColor(pookieTheme.accentColor) ? '#000000' : '#FFFFFF'
                                }}
                             >
                                <ArrowRight size={12} />
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {/* Branding */}
            <div className="mt-auto pt-8 flex items-center gap-1.5 opacity-40 shrink-0">
              <span className="text-[10px] font-bold" style={{ color: pookieTheme.brandingColor }}>Lynksy</span>
              <LinkIcon size={10} style={{ color: pookieTheme.brandingColor }} />
            </div>
          </div>
      </div>
    )
  }

  return (
    <div className={cn("relative mx-auto w-[280px] h-[560px] bg-ink rounded-[45px] border-[10px] border-ink-2 shadow-2xl overflow-hidden shrink-0 flex flex-col", currentFontClass)}>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-ink-2 rounded-b-2xl z-10" />
        
        {/* Screen Background */}
        <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none">
          <AnimatedBackground theme={theme} settings={user.themeSettings} />
        </div>

        {/* Preview Badge */}
        {filteredLinks.length === 0 && (
          <div className="absolute top-10 left-0 right-0 z-50 pointer-events-none flex justify-center">
            <div className="bg-white/80 backdrop-blur-md text-ink text-[8px] font-black uppercase tracking-[0.2em] py-1 px-3 rounded-full flex items-center gap-1.5 shadow-xl border border-cream-3">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              Preview Mode
            </div>
          </div>
        )}

        {/* Screen */}
        <div 
          className="w-full h-full overflow-y-auto no-scrollbar flex flex-col items-center pt-12 pb-8 px-4 relative z-10"
        >
          
          {/* Avatar */}
            <div 
              className="w-20 h-20 rounded-full border-4 overflow-hidden mb-4 shrink-0 shadow-lg relative"
              style={{ 
                borderColor: user.avatarRing?.includes('transparent') ? 'transparent' : (user.avatarRing?.split(' ').pop() || effectiveAccentColor),
                boxShadow: user.avatarGlow || 'none',
                animation: user.avatarRingAnimation && user.avatarRingAnimation !== 'none' ? `${user.avatarRingAnimation} 3s ease-in-out infinite` : 'none'
              }}
            >
              {/* Shahi Animated Ring Overlay */}
              {user.avatarRingAnimation && (
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{ 
                    border: user.avatarRing || `2px solid ${effectiveAccentColor}`,
                    animation: `${user.avatarRingAnimation} 4s linear infinite`
                  }}
                />
              )}
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="w-full h-full object-cover relative z-10" referrerPolicy="no-referrer" />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-2xl font-black relative z-10 text-white"
                  style={{ background: getFallbackAvatarGradient(user.displayName || user.username || ''), color: '#FFFFFF' }}
                >
                  {getFallbackAvatarInitials(user.displayName || user.username || '')}
                </div>
              )}
            </div>

            {/* Name & Bio */}
            {(() => {
              const nameText = user.displayName || 'Your Name'
              const nameLength = nameText.length
              let nameSizeClass = "text-base"
              if (nameLength > 16) {
                nameSizeClass = "text-[11px]"
              } else if (nameLength > 12) {
                nameSizeClass = "text-[12px]"
              } else if (nameLength > 8) {
                nameSizeClass = "text-[14px]"
              } else {
                nameSizeClass = "text-[15px]"
              }
              
              return (
                <div className="text-center mb-1 leading-tight px-4">
                  <h3 
                    className={cn("font-bold inline-block align-middle", nameSizeClass)}
                    style={{ 
                      color: effectiveTextColor,
                      textShadow: user.nameGlow || 'none'
                    }}
                  >
                    {nameText}
                  </h3>
                  <VerifiedBadge user={user} size="sm" className="inline-block ml-1 align-middle" />
                </div>
              )
            })()}

            {user.location && (
              <div 
                className="flex items-center justify-center gap-1 text-[8px] font-bold uppercase tracking-widest mb-3 opacity-70"
                style={{ color: effectiveTextColor }}
              >
                <MapPin size={9} className="opacity-80 shrink-0" />
                <span>{user.location}</span>
              </div>
            )}

            <p className="text-[10px] text-center mb-4 leading-relaxed opacity-70 px-4" style={{ color: effectiveTextColor }}>
              {user.bio || 'This is where your bio will appear. Write something engaging!'}
            </p>

            {/* CTA Section - Below Bio, Above Socials */}
            {products.length > 0 && (plan === 'PRO' || plan === 'PRO_PLUS') && (
              <div className="w-full flex flex-col items-center gap-4 mb-4">
                <div 
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md border",
                    ['midnight', 'gradient', 'royal', 'carbon', 'cyberpunk', 'aurora', 'solar', 'midnight-black', 'dark-neon'].includes(theme.id)
                      ? "bg-white text-black border-white/5"
                      : "bg-black text-white border-black/10"
                  )}
                >
                  <ShoppingBag size={11} className="shrink-0" />
                  <span>Buy My Products</span>
                  <ArrowRight size={10} className="shrink-0" />
                </div>
              </div>
            )}

            {/* Social Icons */}
            <div className="flex flex-wrap justify-center gap-1 mb-4">
              <SocialIcon handle={user.instagramHandle} icon={Instagram} url="https://instagram.com/{handle}" isPookie={false} />
              <SocialIcon handle={user.youtubeHandle} icon={Youtube} url="https://youtube.com/@{handle}" isPookie={false} />
              <SocialIcon handle={user.twitterHandle} icon={Twitter} url="https://twitter.com/{handle}" isPookie={false} />
              <SocialIcon handle={user.linkedinHandle} icon={Linkedin} url="https://linkedin.com/in/{handle}" isPookie={false} />
            </div>

            {/* Links */}
            <div className="w-full space-y-3">
              {filteredLinks.length > 0 ? (
                filteredLinks.map(link => (
                  <a
                    key={link.id}
                    href={link.isActive ? link.url : undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!link.isActive) {
                        e.preventDefault()
                        return
                      }
                      if (user.uid) trackClick(user.uid, { id: link.id, title: link.title })
                    }}
                    className={cn(
                      "w-full py-3 px-4 flex items-center gap-3 transition-transform hover:scale-[1.02] shadow-sm",
                      (effectiveButtonStyle === 'outline' || theme.id === 'pride-rainbow') && "border-2",
                      !link.isActive && "opacity-40 grayscale-[0.5]",
                      theme.isGlass && "backdrop-blur-md"
                    )}
                    style={{ 
                      borderRadius: `${effectiveRadius}px`,
                      background: theme.id === 'pride-rainbow'
                        ? 'rgba(255,255,255,0.05)'
                        : (effectiveButtonStyle === 'filled' || effectiveButtonStyle === 'pill' 
                          ? (effectiveTransparency < 1 
                              ? `rgba(${parseInt(effectiveButtonColor.slice(1,3), 16)}, ${parseInt(effectiveButtonColor.slice(3,5), 16)}, ${parseInt(effectiveButtonColor.slice(5,7), 16)}, ${effectiveTransparency})` 
                              : effectiveButtonColor) 
                          : effectiveButtonStyle === 'soft' 
                            ? `rgba(${parseInt(effectiveButtonColor.slice(1,3), 16)}, ${parseInt(effectiveButtonColor.slice(3,5), 16)}, ${parseInt(effectiveButtonColor.slice(5,7), 16)}, 0.1)` 
                            : 'transparent'),
                      color: effectiveButtonTextColor,
                      borderColor: theme.id === 'pride-rainbow' ? 'transparent' : effectiveButtonColor,
                      animation: theme.id === 'pride-rainbow' ? 'rainbow-border 5s linear infinite' : undefined,
                      backdropFilter: (theme.isGlass || theme.linkBackdrop) ? `blur(${user.themeSettings?.blurAmount || theme.blurAmount || 10}px)` : undefined,
                      boxShadow: theme.linkGlow ? `0 0 10px ${theme.linkGlow}` : undefined
                    }}
                  >
                    <div className="w-6 h-6 flex items-center justify-center shrink-0 overflow-hidden rounded-md">
                      {link.thumbnailUrl ? (
                        <img src={link.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        React.createElement(getIconForUrl(link.url), { size: 16 })
                      )}
                    </div>
                    <span className="text-xs font-bold truncate flex-1">{link.title}</span>
                    {!link.isActive && <span className="text-[8px] font-black uppercase opacity-50">Hidden</span>}
                  </a>
                ))
              ) : (
                <div 
                  className="w-full h-24 border-2 border-dashed border-muted-2 rounded-2xl flex items-center justify-center opacity-30"
                  style={{ borderRadius: `${effectiveRadius}px` }}
                >
                  <span className="text-[10px] font-medium" style={{ color: effectiveTextColor }}>No active links</span>
                </div>
              )}
            </div>

            {/* Standard Theme Email Subscription Form */}
            {user.emailFormActive && (plan === 'PRO' || plan === 'PRO_PLUS') && (
              <div className="pt-4 pb-2 w-full">
                <div 
                  className={cn(
                    "card border-2 p-4 flex flex-col relative overflow-hidden", 
                    theme.isGlass && "backdrop-blur-md"
                  )}
                  style={{ 
                    borderColor: user.plan === 'PRO_PLUS' ? effectiveAccentColor : `${effectiveButtonColor}20`, 
                    borderRadius: `${upiCardRadius}px`,
                    boxShadow: user.plan === 'PRO_PLUS' ? `0 0 15px ${effectiveAccentColor}20` : undefined,
                    background: standardCardBg
                  }}
                >
                  <div className="text-center mb-3">
                    <h4 className="font-extrabold text-[12px] mb-0.5" style={{ color: standardCardTextColor }}>
                      {user.emailFormTitle || 'Join My Newsletter'}
                    </h4>
                    <p className="text-[9px] opacity-70 leading-relaxed max-w-sm mx-auto" style={{ color: standardCardMutedColor }}>
                      {user.emailFormDesc || 'Get updates, free resources and template launches.'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <input
                      type="email"
                      disabled
                      placeholder="Enter your email"
                      className="w-full border rounded-lg px-3 py-1.5 text-[9px] focus:outline-none transition-all font-sans text-center"
                      style={{ 
                        color: standardCardTextColor,
                        borderColor: isBgLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
                        background: isBgLight ? '#FFFFFF' : 'rgba(255,255,255,0.04)'
                      }}
                    />
                    <button
                      type="button"
                      className="w-full py-2 rounded-xl text-[9px] font-bold flex items-center justify-center transition-all"
                      style={{
                        background: effectiveButtonColor,
                        color: effectiveButtonTextColor
                      }}
                    >
                      <span>{user.emailFormBtn || 'Subscribe'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Standard Theme UPI Tip Jar Card */}
            {showSupportCard && (
              <div className="pt-4 pb-2 w-full">
                <div 
                  className={cn(
                    "card border-2 p-4 flex flex-col items-center relative overflow-hidden", 
                    theme.isGlass && "backdrop-blur-md"
                  )}
                  style={{ 
                    borderColor: user.plan === 'PRO_PLUS' ? effectiveAccentColor : `${effectiveButtonColor}20`, 
                    borderRadius: `${upiCardRadius}px`,
                    boxShadow: user.plan === 'PRO_PLUS' ? `0 0 15px ${effectiveAccentColor}20` : undefined,
                    background: standardCardBg
                  }}
                >

                  <Smartphone style={{ color: effectiveButtonColor }} className="mb-2" size={24} />
                  <h4 className="font-bold text-ink mb-0.5 text-xs text-center leading-tight" style={{ color: standardCardTextColor }}>
                    {upiDescription || 'Support my work'}
                  </h4>
                  <p className="text-[9px] mb-4 text-center" style={{ color: standardCardMutedColor }}>Direct tip via any UPI app</p>
                  
                  <div className="grid grid-cols-3 gap-1.5 w-full mb-3">
                    {['50', '100', '500'].map(amt => (
                      <button 
                        key={amt} 
                        type="button"
                        onClick={() => setUpiAmount(amt)}
                        className={cn(
                          "p-2 border text-[10px] font-bold transition-all flex items-center justify-center",
                          upiAmount === amt 
                            ? "" 
                            : "hover:scale-105"
                        )}
                        style={{ 
                          borderColor: upiAmount === amt ? effectiveButtonColor : (isBgLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'),
                          background: upiAmount === amt ? effectiveButtonColor : 'transparent',
                          color: upiAmount === amt ? effectiveButtonTextColor : standardCardTextColor,
                          borderRadius: `${upiButtonRadius}px`
                        }}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  {/* Custom Amount Input */}
                  <div className="w-full mb-3">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted/60">₹</span>
                      <input 
                        type="number" 
                        value={upiAmount} 
                        onChange={(e) => setUpiAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 border text-[10px] font-bold text-left focus:outline-none transition-all"
                        style={{ 
                          color: standardCardTextColor,
                          borderColor: isBgLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
                          background: isBgLight ? '#FFFFFF' : 'rgba(255,255,255,0.04)',
                          borderRadius: `${upiButtonRadius}px` 
                        }}
                        placeholder="Custom amount"
                        min="1"
                      />
                    </div>
                  </div>

                  {/* Support Goals section for PRO_PLUS */}
                  {user.plan === 'PRO_PLUS' && upiGoalEnabled && (
                    <div className="w-full mb-3.5 p-2.5 border rounded-xl text-left" style={{ background: `${effectiveButtonColor}05`, borderColor: `${effectiveButtonColor}15` }}>
                      {(() => {
                        const title = upiGoalTitle || 'Support Goal'
                        const target = Number(upiGoalTarget || 0)
                        const raised = Number(upiGoalRaised || 0)
                        const percent = target > 0 ? Math.min(Math.round((raised / target) * 100), 100) : 0
                        return (
                          <>
                            <div className="flex justify-between items-center text-[8px] font-bold uppercase tracking-wider mb-1 text-ink pt-0.5" style={{ color: standardCardTextColor }}>
                              <span>Goal: {title}</span>
                              <span>{percent}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden bg-black/[0.1] font-sans" style={{ background: isBgLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)' }}>
                              <div 
                                className="h-full transition-all duration-500"
                                style={{ width: `${percent}%`, background: effectiveAccentColor || effectiveButtonColor }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[7px] font-bold mt-1" style={{ color: standardCardMutedColor }}>
                              <span>Raised: ₹{raised.toLocaleString('en-IN')}</span>
                              <span>Goal: ₹{target.toLocaleString('en-IN')}</span>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}

                  <button 
                    type="button"
                    className="w-full py-2.5 text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 shadow-sm active:scale-95"
                    style={{ 
                      background: effectiveButtonColor, 
                      color: effectiveButtonTextColor,
                      borderRadius: `${upiButtonRadius}px` 
                    }}
                  >
                    <span>{upiTitle || 'Send Sweet Tip'} ({upiAmount})</span>
                    <Zap size={10} className={cn(effectiveButtonTextColor === '#FFFFFF' ? "fill-white" : "")} style={{ fill: effectiveButtonTextColor }} />
                  </button>
                </div>
              </div>
            )}

            {/* Store Products */}
            {showStore && products.length > 0 && (plan === 'PRO_PLUS' || plan === 'PRO' || products.length > 0) && (
              <div className="w-full space-y-4 pt-6">
                <div className="flex items-center gap-2 px-1">
                   <div className="p-1 px-2 rounded-lg bg-orange/10 flex items-center gap-1.5">
                     <ShoppingBag size={10} className="text-orange" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-orange">Store</span>
                   </div>
                </div>
                <div className="space-y-4">
                  {products.map(p => (
                      <div 
                        key={p.id}
                        className={cn(
                          "w-full p-1.5 shadow-lg border-2",
                          theme.isGlass && "backdrop-blur-md"
                        )}
                         style={{ 
                           borderColor: isBgLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
                           borderRadius: '20px',
                           background: standardCardBg
                         }}
                      >
                        <div className="flex flex-col">
                          <div 
                            className="relative aspect-[4/3] overflow-hidden mb-2 shadow-sm border border-cream-2"
                            style={{ borderRadius: '20px' }}
                          >
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center bg-cream-3 opacity-20 gap-1" style={{ color: effectiveAccentColor }}>
                                <ShoppingBag size={20} />
                                <span className="text-[6px] font-black uppercase opacity-50">Premium Digital</span>
                                <span className="text-[6px] font-black uppercase opacity-50">Premium Digital</span>
                              </div>
                            )}
                            <div className="absolute top-2 left-2">
                               <span 
                                 className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm"
                                 style={{ background: effectiveAccentColor, color: '#FFFFFF' }}
                               >
                                 {p.category || 'Digital'}
                               </span>
                            </div>
                          </div>
                          <div className="px-2 pb-2">
                            <h4 className="text-[11px] font-black truncate leading-tight mb-1" style={{ color: standardCardTextColor }}>{p.name || p.title}</h4>
                            <div className="flex items-center justify-between">
                               <p className="text-[10px] font-extrabold" style={{ color: effectiveAccentColor }}>{formatPrice(p.price, p.currency)}</p>
                               <div 
                                 className="w-7 h-7 rounded-full flex items-center justify-center shadow-md shadow-accent/20"
                                 style={{ background: effectiveButtonColor, color: effectiveButtonTextColor }}
                               >
                                 <ArrowRight size={10} />
                               </div>
                            </div>
                          </div>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            )}

            {/* Branding */}
            <div className="mt-auto pt-8 flex items-center gap-1.5 opacity-40">
              <span className="text-[10px] font-bold" style={{ color: effectiveTextColor }}>Lynksy</span>
              <LinkIcon size={10} style={{ color: effectiveTextColor }} />
            </div>
          </div>
      </div>
    )
  }
