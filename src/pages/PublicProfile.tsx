import React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { getUserByUsername, getUserByCustomDomain, getActiveLinks, trackPageView, trackClick, trackTip, addEmailSubscriber, updateUser } from '@/firebase/firestore'
import { getShortLinkByCode } from '@/firebase/shortLinks'
import { QRCodeCanvas } from 'qrcode.react'
import { getProducts, updateProduct, deleteProduct } from '@/firebase/store'
import { getTheme } from '@/constants/themes'
import { AnimatedBackground } from '@/components/themes/AnimatedBackground'
import { filterLinksByPlan } from '@/constants/plans'
import { Spinner } from '@/components/ui/Spinner'
import { motion, AnimatePresence } from 'motion/react' // FIXED: Updated from framer-motion to motion/react
import { 
  Instagram, Youtube, Twitter, Linkedin,
  ChevronRight, CheckCircle2, Smartphone, Link as LinkIcon,
  Zap,
  ShoppingBag, ArrowRight
} from 'lucide-react'
import { buildUrlWithUTM } from '@/utils/planUtils'
import { cn, isLightColor, getFallbackAvatarGradient, getFallbackAvatarInitials } from '@/utils/formatters'
import type { User, Link as LinkType, Theme, Product } from '@/types'
import { getIconForUrl } from '@/utils/linkUtils'
import { formatPrice } from '@/utils/storeUtils'
import { CheckoutModal } from '@/components/store/CheckoutModal'
import { AddEditProductModal } from '@/components/store/AddEditProductModal'
import { useAuthStore } from '@/store/authStore'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { Edit3, Trash2, Eye, EyeOff, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

// Pookie Themes
import { getPookieTheme, POOKIE_THEMES } from '@/themes/pookie'
import { PookieBackground }   from '@/themes/pookie/PookieBackground'
import { PookieLinkButton }   from '@/themes/pookie/components/PookieLinkButton'
import { PookieAvatar }       from '@/themes/pookie/components/PookieAvatar'

// Safe helper to convert hex to rgba
const getRgba = (hexColor: string, alpha: number): string => {
  if (!hexColor || typeof hexColor !== 'string') return `rgba(0,0,0,${alpha})`
  let cleanHex = hexColor.trim()
  if (!cleanHex.startsWith('#')) {
    if (/^[0-9A-Fa-f]{3,6}$/.test(cleanHex)) {
      cleanHex = '#' + cleanHex
    } else {
      return `rgba(0,0,0,${alpha})`
    }
  }
  
  const hex = cleanHex.replace('#', '')
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16)
    const g = parseInt(hex[1] + hex[1], 16)
    const b = parseInt(hex[2] + hex[2], 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  } else if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
  return `rgba(0,0,0,${alpha})`
}

interface PublicProfileProps {
  usernameFromHost?: string;
  customDomain?: string;
}

export default function PublicProfile({ usernameFromHost, customDomain }: PublicProfileProps) {
  const { username: usernameFromParam } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const username = usernameFromHost || usernameFromParam
  
  const [user, setUser] = useState<User | null>(null)
  const [links, setLinks] = useState<LinkType[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState<Theme | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isProcessingDelete, setIsProcessingDelete] = useState<string | null>(null)
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false)
  const [generatedUpiLink, setGeneratedUpiLink] = useState('')
  const [modalUpiId, setModalUpiId] = useState('')
  const [modalDisplayName, setModalDisplayName] = useState('')
  const [modalAmount, setModalAmount] = useState('100')
  
  // Admin state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [loadError, setLoadError] = useState<string>('')

  const currentUser = useAuthStore(state => state.user)
  const isOwner = currentUser?.uid === user?.uid

  // Email Lead subscription states & handler
  const [subscriberEmail, setSubscriberEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribedSuccess, setSubscribedSuccess] = useState(false)
  const [subscriberError, setSubscriberError] = useState('')

  const handleSubscribeForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubscriberError('')
    
    const emailVal = subscriberEmail.trim().toLowerCase()
    if (!emailVal) {
      setSubscriberError('Email address is required')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailVal)) {
      setSubscriberError('Please enter a valid email address')
      return
    }
    
    setSubscribing(true)
    try {
      await addEmailSubscriber(user!.uid, user!.username, emailVal, 'public_profile')
      setSubscribedSuccess(true)
      setSubscriberEmail('')
      toast.success('Successfully subscribed!')
    } catch (err) {
      console.error(err)
      if (err instanceof Error && err.message === 'ALREADY_SUBSCRIBED') {
        setSubscriberError('You are already subscribed.')
      } else {
        setSubscriberError('Subscription failed. Please try again.')
      }
    } finally {
      setSubscribing(false)
    }
  }

  // Prevention for screenshots/copying
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && e.key === 'p')) {
        e.preventDefault()
        alert('Screenshots/Printing are disabled for digital products.')
      }
    }
    
    const handleContextMenu = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.product-card')) {
        e.preventDefault()
      }
    }

    if (products.length > 0) {
      window.addEventListener('keydown', handleKeyDown)
      window.addEventListener('contextmenu', handleContextMenu)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [products])

  const loadData = useCallback(async () => {
    try {
      setLoadError('')
      let u: User | null = null;
      console.log('PublicProfile: Attempting to load profile...', { username, customDomain })
      
      if (customDomain) {
        try {
          u = await getUserByCustomDomain(customDomain)
        } catch (err) {
          console.error('getUserByCustomDomain error:', err)
          setLoadError(`Custom domain lookup failed: ${err instanceof Error ? err.message : String(err)}`)
        }
      } else if (username) {
        try {
          u = await getUserByUsername(username)
          if (!u) {
            // Check if this is a valid short link code
            const shortLink = await getShortLinkByCode(username)
            if (shortLink) {
              window.location.replace(`/go/${username}`)
              return
            }
            setLoadError(`No profile registered under the username "${username}".`)
          }
        } catch (err) {
          console.error('getUserByUsername error:', err)
          setLoadError(`Username lookup failed: ${err instanceof Error ? err.message : String(err)}`)
        }
      } else {
        setLoadError('No username or custom domain was provided to build this public profile scene.')
      }

      console.log('PublicProfile: Fetch result:', { found: !!u, username: u?.username, uid: u?.uid })
      
      if (u) {
        // Enforce automatic subscription expiration and feature/theme fallback
        const now = new Date()
        const expiryTimestamp = u.expiryDate || u.planExpiresAt
        if (u.plan !== 'FREE' && expiryTimestamp) {
          const expDate = typeof expiryTimestamp.toDate === 'function' ? expiryTimestamp.toDate() : new Date(expiryTimestamp)
          if (expDate < now) {
            u = {
              ...u,
              plan: 'FREE',
              subscriptionStatus: 'EXPIRED',
              themeId: 'snow-white',
              planExpiresAt: null,
              planStartedAt: null
            }
            try {
              await updateUser(u.uid, {
                plan: 'FREE',
                subscriptionStatus: 'EXPIRED',
                themeId: 'snow-white',
                planExpiresAt: null,
                planStartedAt: null
              })
            } catch (err) {
              console.error('Failed to update expired user in Firestore during PublicProfile fetch:', err)
            }
          }
        }

        // Enforce plan-based domain rules
        const host = window.location.hostname;
        const isDevEnv = host.includes('run.app') || 
                         host.includes('localhost') || 
                         host.includes('aistudio') || 
                         host.includes('google');
        const isSubdomain = !isDevEnv && host.includes('lynksy.app') && host.split('.').length > 2 && !host.startsWith('www.');
        
        if (customDomain && u.plan !== 'PRO_PLUS') {
           // Revert visitors to standard path address if PRO_PLUS hosting expired
           window.location.replace(isDevEnv ? `/${u.username}` : `https://lynksy.app/${u.username}`);
           return;
        }
        
        if (isSubdomain && u.plan === 'FREE') {
          // Redirect free users away from subdomains to path-based (production only)
          window.location.href = `https://lynksy.app/${u.username}`;
          return;
        }

        const path = window.location.pathname;
        const isUPath = path.startsWith('/u/');
        const isMainAppDomain = host === 'localhost' || 
                                host.includes('run.app') || 
                                host === 'lynksy.app' || 
                                host.includes('aistudio') || 
                                host.includes('google');

        if (isMainAppDomain) {
          if (u.plan === 'FREE' && isUPath) {
            // Redirect FREE users from /u/username to /username
            window.location.replace(`/${u.username}`);
            return;
          }

          // In production, redirect PRO/PRO_PLUS users to their dedicated domain/subdomain
          const isProduction = !host.includes('localhost') && 
                               !host.includes('run.app') && 
                               !host.includes('aistudio') && 
                               !host.includes('google');
          if (isProduction && (u.plan === 'PRO' || u.plan === 'PRO_PLUS')) {
            if (u.plan === 'PRO_PLUS' && u.customDomain) {
              window.location.replace(`https://${u.customDomain}`);
              return;
            } else {
              window.location.replace(`https://${u.username}.lynksy.app`);
              return;
            }
          }

          // In dev environment, we keep those users on /u/ for functionality
          if (!isUPath && (u.plan === 'PRO' || u.plan === 'PRO_PLUS')) {
            window.location.replace(`/u/${u.username}`);
            return;
          }
        }

        setUser(u)
        setTheme(getTheme(u.themeId, u.plan))
        
        const isCurrentlyOwner = currentUser?.uid === u.uid
        const [activeLinks, allProdsRaw] = await Promise.all([
          getActiveLinks(u.uid).catch(() => []),
          getProducts(u.uid).catch(() => [])
        ])
        
        const finalProds = isCurrentlyOwner ? allProdsRaw : allProdsRaw.filter(p => p.isActive)
        console.log(`Loaded ${finalProds.length} products for user ${u.uid} (isOwner: ${isCurrentlyOwner})`)
        const restrictedLinks = filterLinksByPlan(activeLinks, u.plan)
        setLinks(restrictedLinks)
        setProducts(finalProds)
        trackPageView(u.username, u.uid)
        document.title = `${u.displayName} (@${u.username}) | Lynksy`
      }
    } catch (e) {
      console.error('Error loading public profile data:', e)
    } finally {
      setLoading(false)
    }
  }, [username, customDomain, currentUser?.uid])

  useEffect(() => {
    loadData()
  }, [username, customDomain, currentUser?.uid, loadData])

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (product: Product) => {
    const targetUid = product.uid || user?.uid
    if (!targetUid) return
    
    setIsProcessingDelete(product.id)
    const productTitle = product.title || product.name || 'this product'
    const loadingToast = toast.loading(`Deleting "${productTitle}"...`)
    try {
      console.log('PublicProfile: Initiating delete for:', product.id, 'UID:', targetUid)
      await deleteProduct(targetUid, product.id)
      toast.dismiss(loadingToast)
      toast.success('Product deleted')
      
      // Update local state
      setProducts(prev => prev.filter(p => p.id !== product.id))
      setDeletingId(null)
      
      // Sync full data
      setTimeout(() => loadData(), 1500)
    } catch (err: unknown) {
      console.error('PublicProfile: Delete call failed:', err)
      toast.dismiss(loadingToast)
      let errorMsg = 'Failed to delete product'
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message)
          errorMsg = `Error: ${parsed.error}`
        } catch {
          errorMsg = err.message
        }
      }
      toast.error(errorMsg)
    } finally {
      setIsProcessingDelete(null)
    }
  }

  const handleToggleHold = async (product: Product) => {
    const targetUid = product.uid || user?.uid
    if (!targetUid) return
    
    const newStatus = !product.isActive;

    // Immediate UI update
    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, isActive: newStatus } : p
    ));

    try {
      await updateProduct(targetUid, product.id, { isActive: newStatus })
      toast.success(newStatus ? 'Product published' : 'Product held (Draft)')
      
      // Delay full sync
      setTimeout(() => loadData(), 1500)
    } catch (err) {
      console.error('PublicProfile: Toggle hold failed:', err)
      toast.error('Failed to update status')
      // Revert
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, isActive: product.isActive } : p
      ));
    }
  }

  const upiLinkDoc = links.find(l => l.type === 'UPI' || l.type === 'upi_tip')

  const [upiAmount, setUpiAmount] = useState('100')

  useEffect(() => {
    if (upiLinkDoc?.defaultAmount) {
      setUpiAmount(String(upiLinkDoc.defaultAmount))
    } else if (user?.upiDefaultAmount) {
      setUpiAmount(String(user.upiDefaultAmount))
    }
  }, [upiLinkDoc, user?.upiDefaultAmount])

  const rawUpiId = user?.upiId || upiLinkDoc?.upiId || (upiLinkDoc?.url?.startsWith('upi://') ? new URLSearchParams(upiLinkDoc.url.split('?')[1]).get('pa') : null) || ''
  const targetUpiId = typeof rawUpiId === 'string' ? rawUpiId.trim() : ''
  const hasValidUpiId = !!targetUpiId && targetUpiId !== '' && targetUpiId.includes('@')
  
  // Enabled if EITHER profile settings enable it OR upi Link is active, AND user is premium (PRO or PRO_PLUS)
  const isUpiSetup = hasValidUpiId && 
                     (user?.upiEnabled !== false || (upiLinkDoc && upiLinkDoc.isActive !== false)) &&
                     (user?.plan === 'PRO' || user?.plan === 'PRO_PLUS')
  const showSupportCard = isUpiSetup

  const filteredLinks = links.filter(link => {
    if (link.type === 'UPI' || link.type === 'upi_tip') {
      return !showSupportCard
    }
    return true
  })

  // UPI configuration fallbacks
  const upiTitle = (user?.upiTitle && user.upiTitle !== '') ? user.upiTitle : (upiLinkDoc?.title && upiLinkDoc.title !== '' ? upiLinkDoc.title : 'Send Sweet Tip')
  const upiDescription = (user?.upiDescription && user.upiDescription !== '') ? user.upiDescription : (upiLinkDoc?.description && upiLinkDoc.description !== '' ? upiLinkDoc.description : 'Send a Sweet Tip')
  const upiGoalEnabled = user?.upiGoalEnabled !== undefined ? user.upiGoalEnabled : (upiLinkDoc?.upiGoalEnabled || false)
  const upiGoalTitle = (user?.upiGoalTitle && user.upiGoalTitle !== '') ? user.upiGoalTitle : (upiLinkDoc?.upiGoalTitle || 'Support Goal')
  const upiGoalTarget = Number(user?.upiGoalTarget) || Number(upiLinkDoc?.upiGoalTarget) || 0
  const upiGoalRaised = Number(user?.upiGoalRaised) || Number(upiLinkDoc?.upiGoalRaised) || 0

  const handleUPIPay = (customLinkDoc?: Link) => {
    const activeLinkDoc = customLinkDoc || upiLinkDoc
    const targetUpiId = user?.upiId || activeLinkDoc?.upiId || (activeLinkDoc?.url?.startsWith('upi://') ? new URLSearchParams(activeLinkDoc.url.split('?')[1]).get('pa') : null)

    if (!targetUpiId) {
      toast.error("Creator hasn't set up UPI yet")
      return
    }

    const targetDisplayName = activeLinkDoc?.displayName || user.upiDisplayName || user.displayName || user.username || 'Creator'
    
    // Choose the default amount for this link if configured, or use the current input amount
    const activeAmount = activeLinkDoc?.defaultAmount ? String(activeLinkDoc.defaultAmount) : upiAmount

    if (user?.uid) {
      trackClick(user.uid, { id: activeLinkDoc?.id || 'upi_tip', title: `UPI Tip ₹${activeAmount}` })
      trackTip(user.uid, targetUpiId, Number(activeAmount))
    }

    // Deep link for mobile
    const upiLink = `upi://pay?pa=${targetUpiId}&pn=${encodeURIComponent(targetDisplayName)}&am=${activeAmount}&cu=INR&tn=${encodeURIComponent(`Tip for ${targetDisplayName} via Lynksy`)}`
    
    // Check if mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      window.location.href = upiLink
    } else {
      setGeneratedUpiLink(upiLink)
      setModalUpiId(targetUpiId)
      setModalDisplayName(targetDisplayName)
      setModalAmount(activeAmount)
      setIsUpiModalOpen(true)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-cream"><Spinner size="lg" /></div>
  }

  if (!user || !theme) {
    const isDevEnv = typeof window !== 'undefined' && (
      window.location.hostname.includes('run.app') || 
      window.location.hostname.includes('localhost') || 
      window.location.hostname.includes('aistudio') || 
      window.location.hostname.includes('google')
    );
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-cream p-6 text-center">
        <LinkIcon className="text-orange mb-6" size={48} />
        <h1 className="text-3xl font-bold font-syne mb-2">404 — Page not found</h1>
        <p className="text-muted mb-8 text-sm max-w-md">This Lynksy page ({username ? `@${username}` : 'unknown'}) doesn't exist or has been deactivated.</p>
        <Link to="/" className="btn-primary mb-8">Create your own page →</Link>

        {isDevEnv && (
          <div className="max-w-md w-full bg-white border border-rose-200 rounded-2xl p-6 text-left shadow-sm">
            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-1">Development Diagnostics</span>
            <div className="text-[11px] text-rose-600 font-bold mb-3">Visible only in dev/builder mode</div>
            <div className="space-y-2 text-xs text-muted font-mono leading-relaxed">
              <p><span className="font-bold text-ink">Username in URL:</span> "{usernameFromParam || ''}"</p>
              <p><span className="font-bold text-ink">Username in Host:</span> "{usernameFromHost || ''}"</p>
              <p><span className="font-bold text-ink">Custom Domain:</span> "{customDomain || ''}"</p>
              <p><span className="font-bold text-ink">Combined target:</span> "{username || ''}"</p>
              <p><span className="font-bold text-ink">Active Uid:</span> "{currentUser?.uid || 'Not signed in'}"</p>
              <p><span className="font-bold text-ink">Active Email:</span> "{currentUser?.email || 'N/A'}"</p>
              <p><span className="font-bold text-ink">Active Profile Username:</span> "{currentUser?.username || 'N/A'}"</p>
              <div className="pt-2 border-t border-cream-3">
                <span className="font-bold text-ink">Details / Error:</span>
                <span className="text-rose-600 block bg-rose-50/50 p-2.5 rounded-xl border border-rose-100/50 mt-1 whitespace-pre-wrap leading-tight">
                  {loadError || 'No error. Verified user index lookup returned null / no matching user document found.'}
                </span>
              </div>
            </div>
            <div className="mt-4 border-t border-cream-3 pt-3 flex flex-col gap-1 text-[10px] text-muted-2">
              <p>• If "No profile registered under..." is shown, verify your username is set and onboarding is complete.</p>
              <p>• Check if security rules are blocking reads on the 'usernames' collection index.</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  const autoTextColor = isLightColor(theme.bgColor) ? '#000000' : '#FFFFFF'
  
  const effectiveAccentColor = user?.accentColor || theme.accentColor
  const effectiveButtonStyle = user?.buttonStyle || theme.buttonStyle
  const effectiveTextColor = user?.textColor || autoTextColor
  const effectiveButtonColor = user?.buttonColor || user?.accentColor || theme.accentColor
  const rawButtonTextColor = user?.buttonTextColor || theme.buttonTextColor || (effectiveButtonStyle === 'filled' || effectiveButtonStyle === 'pill' ? '#FFFFFF' : effectiveButtonColor)
  
  // Guard against contrast issues (e.g. white text on a white button or dark text on a dark button)
  const isButtonBgLight = isLightColor(effectiveButtonColor)
  const isButtonTextLight = isLightColor(rawButtonTextColor)
  const effectiveButtonTextColor = (effectiveButtonStyle === 'filled' || effectiveButtonStyle === 'pill')
    ? (isButtonBgLight === isButtonTextLight 
        ? (isButtonBgLight ? '#1C1813' : '#FFFFFF') 
        : rawButtonTextColor)
    : rawButtonTextColor

  const effectiveRadius = user.themeSettings?.borderRadius ?? theme.borderRadius ?? (effectiveButtonStyle === 'pill' ? 999 : 16)
  
  // For the support/UPI custom components, we use a beautiful soft radius instead of standard pill
  const upiCardRadius = 24
  const upiButtonRadius = 12

  const isBgLight = isLightColor(theme.bgColor)
  const standardCardBg = theme.isGlass 
    ? `rgba(255,255,255,${user.themeSettings?.cardTransparency ?? theme.cardTransparency ?? 0.1})` 
    : (isBgLight ? '#FFFFFF' : 'rgba(255,255,255,0.06)')
  const standardCardTextColor = isBgLight ? '#1C1813' : '#FFFFFF'
  const standardCardMutedColor = isBgLight ? '#655F55' : 'rgba(255,255,255,0.65)'

  const effectiveTransparency = user.themeSettings?.cardTransparency ?? theme.cardTransparency ?? (theme.isGlass ? 0.1 : 1)
  const effectiveFont = user.themeSettings?.fontStyle ?? theme.fontStyle ?? 'sans'

  const fontFamilies = {
    sans: 'font-jakarta',
    mono: 'font-mono',
    serif: 'font-serif',
    display: 'font-syne',
    grotesk: 'font-grotesk',
    rounded: 'font-rounded'
  }

  const currentFontClass = fontFamilies[effectiveFont] || 'font-jakarta'

  // --- POOKIE THEMES OVERRIDE ---
  const isPookieTheme = POOKIE_THEMES.some(t => t.id === user.themeId)
  const pookieTheme   = isPookieTheme ? getPookieTheme(user.themeId) : null

  if (pookieTheme) {
    return (
      <motion.div
        className={currentFontClass}
        style={{ background: pookieTheme.pageBg, minHeight: '100vh', position: 'relative' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <PookieBackground theme={pookieTheme} mobileOnly={false} />

        <div className="max-w-[480px] mx-auto px-5 py-12 flex flex-col items-center relative z-10">
          <PookieAvatar 
            avatarUrl={user.avatarUrl} 
            displayName={user.displayName} 
            theme={pookieTheme} 
          />

          {(() => {
            const nameText = user.displayName || 'Your Name'
            const nameLength = nameText.length
            let nameSizeClass = "text-2xl"
            if (nameLength > 18) {
              nameSizeClass = "text-lg sm:text-2xl"
            } else if (nameLength > 12) {
              nameSizeClass = "text-xl sm:text-2xl"
            }
            
            return (
              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, type: 'spring', stiffness: 280, damping: 22 }}
                className={cn("text-center mt-2 mb-1 font-black leading-tight px-4", nameSizeClass)}
                style={{ 
                  fontFamily: pookieTheme.nameFont, 
                  color: pookieTheme.nameColor,
                  textShadow: user.nameGlow || 'none'
                }}
              >
                <span className="align-middle inline-block">{nameText}</span>
                <VerifiedBadge user={user} size="md" className="inline-block ml-1.5 align-middle mt-0.5" />
              </motion.h1>
            )
          })()}

          {user.location && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, type: 'spring', stiffness: 280, damping: 22 }}
              className="flex items-center justify-center gap-1.5 text-sm mb-3 font-medium"
              style={{ color: pookieTheme.handleColor }}
            >
              <MapPin size={14} className="opacity-80 shrink-0" />
              <span>{user.location}</span>
            </motion.div>
          )}

          {user.bio && (
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, type: 'spring', stiffness: 280, damping: 22 }}
              className="text-center text-sm px-4 mb-6 leading-relaxed"
              style={{ color: pookieTheme.bioColor }}
            >
              {user.bio}
            </motion.p>
          )}

          {/* CTA Section */}
          {(products.length > 0 || isOwner) && (user.plan === 'PRO_PLUS' || user.plan === 'PRO' || products.length > 0) && (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.28 }}
               className="w-full flex justify-center mb-6"
            >
              <button 
                onClick={() => {
                  trackClick(user.uid, { id: 'store_cta', title: 'Store CTA' })
                  const isCustomDomain = !!customDomain || !(
                    window.location.hostname.includes('localhost') ||
                    window.location.hostname.includes('lynksy.app') ||
                    window.location.hostname.includes('run.app') ||
                    window.location.hostname.includes('aistudio')
                  );
                  navigate(isCustomDomain ? '/store' : `/${user.username}/store`);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-lg transition-transform hover:scale-105 active:scale-95"
                style={{ 
                  background: theme.id === 'pride-rainbow' ? 'rgba(255,255,255,0.1)' : pookieTheme.accentColor,
                  color: theme.id === 'pride-rainbow' ? '#FFFFFF' : (isLightColor(pookieTheme.accentColor) ? '#000000' : '#FFFFFF'),
                  border: theme.id === 'pride-rainbow' ? '2px solid transparent' : undefined,
                  animation: theme.id === 'pride-rainbow' ? 'rainbow-border 5s linear infinite' : undefined
                }}
              >
                <ShoppingBag size={15} />
                {isOwner && products.length === 0 ? "Set up Store" : "View Shop"}
                <ArrowRight size={13} />
              </button>
            </motion.div>
          )}

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3 mb-8"
          >
            {[
              { id: 'instagram', handle: user.instagramHandle, icon: Instagram, url: "https://instagram.com/{handle}" },
              { id: 'youtube', handle: user.youtubeHandle, icon: Youtube, url: "https://youtube.com/@{handle}" },
              { id: 'twitter', handle: user.twitterHandle, icon: Twitter, url: "https://twitter.com/{handle}" },
              { id: 'linkedin', handle: user.linkedinHandle, icon: Linkedin, url: "https://linkedin.com/in/{handle}" },
            ].map(social => social.handle ? (
              <motion.a
                key={social.id}
                href={social.url.replace('{handle}', social.handle)}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.15, y: -3 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full flex items-center justify-center border transition-all"
                style={{ 
                  background: pookieTheme.socialBg, 
                  borderColor: pookieTheme.socialBorder,
                  color: pookieTheme.socialIconColor,
                  backdropFilter: 'blur(8px)'
                }}
              >
                <social.icon size={18} />
              </motion.a>
            ) : null)}
          </motion.div>

          {/* Links Grid */}
          <div className="w-full space-y-3.5 mb-8">
            {filteredLinks.map((link, i) => (
              <PookieLinkButton
                key={link.id}
                link={link}
                theme={pookieTheme}
                uid={user.uid}
                index={i}
                onUpiClick={link.type === 'UPI' || link.type === 'upi_tip' ? () => handleUPIPay(link) : undefined}
              />
            ))}
          </div>

          {/* Email Subscription Form for Pookie Theme */}
          {user && user.emailFormActive && (user.plan === 'PRO' || user.plan === 'PRO_PLUS') && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full mb-6 p-6 rounded-[32px] border relative overflow-hidden"
              style={{ 
                background: pookieTheme.cardBg,
                borderColor: pookieTheme.cardBorder.split('solid ').pop() || '#eee',
                boxShadow: pookieTheme.cardShadow,
                border: user.plan === 'PRO_PLUS' ? `2px dashed ${pookieTheme.accentColor}` : undefined
              }}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-10" style={{ background: pookieTheme.accentColor }} />
              
              <div className="text-center mb-4">
                <h4 className="font-black text-lg mb-1" style={{ color: pookieTheme.nameColor, fontFamily: pookieTheme.nameFont }}>
                  {user.emailFormTitle || 'Join My Newsletter'}
                </h4>
                <p className="text-xs font-medium opacity-70 leading-relaxed max-w-sm mx-auto" style={{ color: pookieTheme.bioColor }}>
                  {user.emailFormDesc || 'Get updates, free resources and template launches.'}
                </p>
              </div>

              <AnimatePresence mode="wait">
                {subscribedSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-4 space-y-2"
                  >
                    <CheckCircle2 className="mx-auto" size={24} style={{ color: pookieTheme.accentColor }} />
                    <p className="text-xs font-bold" style={{ color: pookieTheme.nameColor }}>Successfully subscribed.</p>
                    <button 
                      onClick={() => setSubscribedSuccess(false)}
                      className="text-[10px] underline uppercase tracking-wider opacity-60 hover:opacity-100 transition-opacity"
                      style={{ color: pookieTheme.accentColor }}
                    >
                      Subscribe another email
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubscribeForm} className="space-y-3">
                    <div className="space-y-1">
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={subscriberEmail}
                        onChange={(e) => {
                          setSubscriberEmail(e.target.value)
                          if (subscriberError) setSubscriberError('')
                        }}
                        className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all font-sans"
                        style={{ 
                          color: pookieTheme.nameColor,
                          borderColor: pookieTheme.cardBorder.split('solid ').pop() || '#eee',
                          background: pookieTheme.socialBg || 'rgba(255,255,255,0.4)',
                        }}
                      />
                      {subscriberError && (
                        <p className="text-[10px] text-red-500 font-medium pl-1">{subscriberError}</p>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={subscribing}
                      className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
                      style={{
                        background: pookieTheme.accentColor,
                        color: isLightColor(pookieTheme.accentColor) ? '#000000' : '#FFFFFF'
                      }}
                    >
                      {subscribing ? (
                        <>
                          <div className={cn("w-3.5 h-3.5 border-2 rounded-full animate-spin", isLightColor(pookieTheme.accentColor) ? 'border-black border-t-transparent' : 'border-white border-t-transparent')} />
                          <span>Subscribing...</span>
                        </>
                      ) : (
                        <span>{user.emailFormBtn || 'Subscribe'}</span>
                      )}
                    </button>
                  </form>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Pookie UPI Tip Jar if plan is not FREE */}
          {showSupportCard && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full mb-12 p-6 rounded-[32px] border text-center relative overflow-hidden"
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
              <h4 className="font-black text-lg mb-1" style={{ color: pookieTheme.nameColor, fontFamily: pookieTheme.nameFont }}>{upiDescription}</h4>
              <p className="text-xs font-medium opacity-60 mb-6" style={{ color: pookieTheme.bioColor }}>Direct support via any UPI app 🎀</p>
              
              <div className="grid grid-cols-3 gap-2 mb-6">
                {['50', '100', '500'].map(amt => (
                  <button 
                    key={amt} 
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

              {/* Custom Sweet Tip input */}
              <div className="w-full mt-3 mb-6">
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black" style={{ color: pookieTheme.accentColor }}>₹</span>
                  <input 
                    type="number" 
                    value={upiAmount} 
                    onChange={(e) => setUpiAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 border rounded-xl text-xs font-black text-center focus:outline-none transition-all"
                    style={{ 
                      borderColor: pookieTheme.cardBorder.split('solid ').pop() || '#eee', 
                      color: pookieTheme.nameColor,
                      background: pookieTheme.socialBg || 'rgba(255,255,255,0.4)'
                    }}
                    placeholder="Custom Sweet Tip"
                    min="1"
                  />
                </div>
              </div>

              {/* Support goals section for PRO_PLUS */}
              {user.plan === 'PRO_PLUS' && upiGoalEnabled && (
                <div className="w-full mt-3 mb-6 p-4 rounded-2xl border text-left" style={{ background: `${pookieTheme.accentColor}10`, borderColor: pookieTheme.cardBorder.split('solid ').pop() || '#eee' }}>
                  {(() => {
                    const title = upiGoalTitle
                    const target = Number(upiGoalTarget)
                    const raised = Number(upiGoalRaised)
                    const percent = target > 0 ? Math.min(Math.round((raised / target) * 100), 100) : 0
                    return (
                      <>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider mb-2" style={{ color: pookieTheme.nameColor }}>
                           <span>🎀 Goal: {title}</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full overflow-hidden font-sans" style={{ background: `${pookieTheme.accentColor}20` }}>
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percent}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full"
                            style={{ background: pookieTheme.accentColor }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold mt-1" style={{ color: pookieTheme.bioColor }}>
                          <span>Raised: ₹{raised.toLocaleString('en-IN')}</span>
                          <span>Goal: ₹{target.toLocaleString('en-IN')}</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              )}

              <button 
                onClick={handleUPIPay}
                className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                style={{ 
                  background: pookieTheme.accentColor,
                  color: isLightColor(pookieTheme.accentColor) ? '#000000' : '#FFFFFF'
                }}
              >
                {upiTitle || 'Send Sweet Tip'} (₹{upiAmount}) <Zap size={14} fill="currentColor" />
              </button>
            </motion.div>
          )}

          {/* Custom products / store in pookie style?
              The request didn't specify changing products style for Pookie, but let's make it consistent.
          */}
          {products.length > 0 && (user.plan === 'PRO_PLUS' || user.plan === 'PRO' || products.length > 0) && (
             <div id="pookie-store" className="w-full space-y-6">
                <div className="flex items-center gap-2 px-1">
                   <div className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ background: `${pookieTheme.accentColor}20`, color: pookieTheme.accentColor }}>🛍️</div>
                   <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: pookieTheme.handleColor, opacity: 0.7 }}>Premium Store</h3>
                </div>
                <div className="grid gap-6">
                   {products.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        whileHover={{ y: -4, scale: 1.01 }}
                        onClick={() => {
                          trackClick(user.uid, { id: p.id, title: p.title })
                          setPreviewProduct(p)
                        }}
                        className="bg-white rounded-[32px] overflow-hidden border shadow-xl shadow-pink-500/5 group cursor-pointer"
                        style={{ borderColor: pookieTheme.cardBorder.split('solid ').pop() || '#eee' }}
                      >
                         <div className="aspect-[16/9] relative overflow-hidden">
                             {p.imageUrl ? (
                               <img src={p.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                             ) : (
                               <div className="w-full h-full bg-pink-50 flex items-center justify-center text-pink-200">
                                  <ShoppingBag size={48} />
                               </div>
                             )}
                             <div className="absolute top-4 left-4">
                                <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-pink-500 shadow-sm">
                                   {p.category || 'Digital'}
                                </span>
                             </div>
                         </div>
                         <div className="p-5 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                               <h4 className="font-bold text-lg truncate mb-0.5" style={{ color: pookieTheme.nameColor }}>{p.title}</h4>
                               <p className="text-pink-600 font-black text-xl">{formatPrice(p.price)}</p>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedProduct(p)
                                setIsCheckoutOpen(true)
                              }}
                              className="px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-transform hover:scale-105"
                              style={{ 
                                background: pookieTheme.accentColor,
                                color: isLightColor(pookieTheme.accentColor) ? '#000000' : '#FFFFFF'
                              }}
                            >
                               Get ↗
                            </button>
                         </div>
                      </motion.div>
                   ))}
                </div>
             </div>
          )}

          {/* Branding */}
          {user.showBranding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-16 text-center"
            >
              <Link to="/" className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity" style={{ color: pookieTheme.nameColor }}>
                Powered by Lynksy 🎀
              </Link>
            </motion.div>
          )}
        </div>

        <CheckoutModal 
          isOpen={isCheckoutOpen} 
          onClose={() => setIsCheckoutOpen(false)} 
          product={selectedProduct} 
          creatorUid={user.uid}
        />

        <AnimatePresence>
          {previewProduct && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setPreviewProduct(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white w-full max-w-xl rounded-[48px] overflow-hidden shadow-2xl relative"
                onClick={e => e.stopPropagation()}
              >
                <button onClick={() => setPreviewProduct(null)} className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors">
                  <ArrowRight className="rotate-180" size={20} />
                </button>
                <div className="h-64 sm:h-80 overflow-hidden">
                  {previewProduct.imageUrl ? (
                    <img src={previewProduct.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-pink-50" />
                  )}
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-pink-50 text-pink-500 rounded-full mb-3 inline-block">
                      {previewProduct.category || 'Premium Access'}
                    </span>
                    <h2 className="text-4xl font-black text-pink-900 leading-tight">{previewProduct.title}</h2>
                  </div>
                  <p className="text-pink-900/60 leading-relaxed text-lg">{previewProduct.description || "Get instant access to this exclusive content."}</p>
                  <div className="flex items-center justify-between pt-6 border-t border-pink-50">
                    <div>
                      <span className="text-xs font-black uppercase tracking-widest text-pink-400">Price</span>
                      <div className="text-4xl font-black text-pink-600">{formatPrice(previewProduct.price)}</div>
                    </div>
                    <button 
                      className="px-10 h-16 rounded-3xl bg-pink-500 text-white font-black text-sm uppercase tracking-widest hover:scale-105 transition-transform"
                      onClick={() => {
                        setSelectedProduct(previewProduct)
                        setPreviewProduct(null)
                        setIsCheckoutOpen(true)
                      }}
                    >
                      Buy Now ↗
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  const SocialIcon = ({ handle, icon: Icon, url }: { handle: string, icon: React.ElementType, url: string }) => {
    if (!handle) return null
    return (
      <motion.a 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        href={String(url || '').replace('{handle}', handle)} 
        target="_blank"  rel="noopener noreferrer"
        className="p-3 transition-colors rounded-full"
        style={{ color: effectiveTextColor, background: `${effectiveAccentColor}1A` }}
      >
        <Icon size={20} />
      </motion.a>
    )
  }

  return (
    <div 
      className={cn("min-h-screen transition-colors duration-500 relative", currentFontClass)}
    >
      <AnimatedBackground theme={theme} settings={user.themeSettings} mobileOnly={false} />
      <div className="max-w-[480px] mx-auto px-5 py-12 flex flex-col items-center relative z-10">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center mb-8 w-full"
        >
          <div 
            className="w-24 h-24 rounded-full border-4 overflow-hidden mb-6 shadow-xl relative"
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
                className="w-full h-full flex items-center justify-center text-3xl font-black relative z-10 text-white"
                style={{ background: getFallbackAvatarGradient(user.displayName || user.username || ''), color: '#FFFFFF' }}
              >
                {getFallbackAvatarInitials(user.displayName || user.username || '')}
              </div>
            )}
          </div>


          {(() => {
            const nameText = user.displayName || 'Your Name'
            const nameLength = nameText.length
            let nameSizeClass = "text-2xl"
            if (nameLength > 18) {
              nameSizeClass = "text-lg sm:text-2xl"
            } else if (nameLength > 12) {
              nameSizeClass = "text-xl sm:text-2xl"
            }
            
            return (
              <div className="mb-1 text-center sm:text-left leading-tight">
                <h1 
                  className={cn("font-extrabold inline-block align-middle", nameSizeClass)}
                  style={{ 
                    color: effectiveTextColor,
                    textShadow: user.nameGlow || 'none'
                  }}
                >
                  {nameText}
                </h1>
                <VerifiedBadge user={user} size="md" className="inline-block ml-1.5 align-middle mt-0.5" />
              </div>
            )
          })()}
          
          {user.location && (
            <div className="flex items-center gap-1.5 mb-4 text-xs font-semibold opacity-70" style={{ color: effectiveTextColor }}>
              <MapPin size={14} className="shrink-0" />
              <span>{user.location}</span>
            </div>
          )}
          
          {user.bio && (
            <p className="text-[15px] font-medium leading-relaxed max-w-sm mb-6" style={{ color: effectiveTextColor }}>
              {user.bio}
            </p>
          )}

          {/* CTA Section - Below Bio, Above Socials */}
          <div className="w-full flex flex-col items-center gap-4 mb-6">
            {(products.length > 0 || isOwner) && (user.plan === 'PRO_PLUS' || user.plan === 'PRO' || products.length > 0) && (
                  <button 
                    id="buy-products-cta"
                    onClick={() => {
                      if (user?.uid) {
                        trackClick(user.uid, { id: 'store_cta', title: 'Store CTA' })
                      }
                      const isCustomDomain = !!customDomain || !(
                        window.location.hostname.includes('localhost') ||
                        window.location.hostname.includes('lynksy.app') ||
                        window.location.hostname.includes('run.app') ||
                        window.location.hostname.includes('aistudio')
                      );
                      navigate(isCustomDomain ? '/store' : `/${user.username}/store`);
                    }}
                    className={cn(
                      "flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg transform hover:-translate-y-0.5 border active:scale-95",
                      ['midnight', 'gradient', 'royal', 'carbon', 'cyberpunk', 'aurora', 'solar', 'midnight-black', 'dark-neon'].includes(theme.id)
                        ? "bg-white text-black border-white/5 hover:bg-zinc-100"
                        : "bg-black text-white border-black/10 hover:bg-zinc-900"
                    )}
                  >
                <ShoppingBag size={16} className="shrink-0" />
                {isOwner && products.length === 0 ? "Set up your Products" : "Buy My Products"}
                <ArrowRight size={14} className="shrink-0" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <SocialIcon handle={user.instagramHandle} icon={Instagram} url="https://instagram.com/{handle}" />
            <SocialIcon handle={user.youtubeHandle} icon={Youtube} url="https://youtube.com/@{handle}" />
            <SocialIcon handle={user.twitterHandle} icon={Twitter} url="https://twitter.com/{handle}" />
            <SocialIcon handle={user.linkedinHandle} icon={Linkedin} url="https://linkedin.com/in/{handle}" />
          </div>
        </motion.div>

        {/* Links */}
        <div className="w-full space-y-4 mb-20">
          <AnimatePresence>
            {filteredLinks.map((link, i) => {
              const isUpiType = link.type === 'UPI' || link.type === 'upi_tip'
              return (
                <motion.a
                  key={link.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.02, translateY: -2 }}
                  whileTap={{ scale: 0.98 }}
                  href={isUpiType ? undefined : buildUrlWithUTM(link.url, { source: link.utmSource, medium: link.utmMedium, campaign: link.utmCampaign })}
                  target={isUpiType ? undefined : "_blank"}
                  onClick={(e) => {
                    if (isUpiType) {
                      e.preventDefault()
                      handleUPIPay(link)
                    } else {
                      trackClick(user.uid, { id: link.id, title: link.title })
                    }
                  }}
                  className={cn(
                    "group relative w-full p-4 flex items-center gap-4 transition-all shadow-md overflow-hidden cursor-pointer",
                  (effectiveButtonStyle === 'outline' || theme.id === 'pride-rainbow') && "border-2",
                  theme.isGlass && "backdrop-blur-md"
                )}
                style={{ 
                  borderRadius: `${effectiveRadius}px`,
                  background: theme.id === 'pride-rainbow' 
                    ? 'rgba(255,255,255,0.05)'
                    : (effectiveButtonStyle === 'filled' || effectiveButtonStyle === 'pill' 
                      ? (effectiveTransparency < 1 
                          ? getRgba(effectiveButtonColor, effectiveTransparency) 
                          : effectiveButtonColor) 
                      : effectiveButtonStyle === 'soft' 
                        ? getRgba(effectiveButtonColor, 0.1) 
                        : 'transparent'),
                  color: effectiveButtonStyle === 'filled' || effectiveButtonStyle === 'pill' ? effectiveButtonTextColor : effectiveButtonColor,
                  borderColor: theme.id === 'pride-rainbow' ? 'transparent' : effectiveButtonColor,
                  animation: theme.id === 'pride-rainbow' ? 'rainbow-border 5s linear infinite' : undefined,
                  backdropFilter: (theme.isGlass || theme.linkBackdrop) ? `blur(${user.themeSettings?.blurAmount || theme.blurAmount || 10}px)` : undefined,
                  boxShadow: theme.linkGlow ? `0 0 20px ${theme.linkGlow}` : undefined
                }}
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                
                <div 
                  className={cn(
                    "w-10 h-10 flex items-center justify-center rounded-xl bg-black/5 shrink-0 overflow-hidden",
                    (effectiveButtonStyle === 'filled' || effectiveButtonStyle === 'pill') && "bg-white/20"
                  )}
                >
                  {link.thumbnailUrl ? (
                    <img src={link.thumbnailUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  ) : isUpiType ? (
                    React.createElement(Smartphone, { size: 20 })
                  ) : (
                    React.createElement(getIconForUrl(link.url), { size: 20 })
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-[15px] truncate">{link.title}</h3>
                  {link.description && <p className="text-[10px] opacity-70 truncate mt-0.5">{link.description}</p>}
                </div>
                
                <ChevronRight size={18} className="opacity-40" />
              </motion.a>
            ); })}
          </AnimatePresence>

          {/* Email Subscription Form */}
          {user && user.emailFormActive && (user.plan === 'PRO' || user.plan === 'PRO_PLUS') && (
            <div className="pt-6">
              <div 
                className={cn(
                  "card border-2 p-6 flex flex-col relative overflow-hidden", 
                  theme.isGlass && "backdrop-blur-md"
                )}
                style={{ 
                  borderColor: user.plan === 'PRO_PLUS' ? effectiveAccentColor : `${effectiveButtonColor}20`, 
                  borderRadius: `${upiCardRadius}px`,
                  boxShadow: user.plan === 'PRO_PLUS' ? `0 0 25px ${effectiveAccentColor}30` : undefined,
                  background: standardCardBg
                }}
              >
                <div className="text-center mb-4">
                  <h4 className="font-extrabold text-lg mb-1" style={{ color: standardCardTextColor }}>
                    {user.emailFormTitle || 'Join My Newsletter'}
                  </h4>
                  <p className="text-[11px] opacity-70 leading-relaxed max-w-sm mx-auto" style={{ color: standardCardMutedColor }}>
                    {user.emailFormDesc || 'Get updates, free resources and template launches.'}
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {subscribedSuccess ? (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-4 space-y-2 animate-fadeIn"
                    >
                      <CheckCircle2 className="text-emerald-500 mx-auto" size={24} />
                      <p className="text-xs font-bold text-emerald-500">Successfully subscribed.</p>
                      <button 
                        onClick={() => setSubscribedSuccess(false)}
                        className="text-[10px] underline uppercase tracking-wider opacity-50 hover:opacity-100 transition-opacity"
                        style={{ color: effectiveButtonColor }}
                      >
                        Subscribe another email
                      </button>
                    </motion.div>
                  ) : (
                    <form 
                      onSubmit={handleSubscribeForm}
                      className="space-y-3"
                    >
                      <div className="space-y-1">
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={subscriberEmail}
                          onChange={(e) => {
                            setSubscriberEmail(e.target.value)
                            if (subscriberError) setSubscriberError('')
                          }}
                          className="w-full border rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all font-sans"
                          style={{ 
                            color: standardCardTextColor,
                            borderColor: isBgLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
                            background: isBgLight ? '#FFFFFF' : 'rgba(255,255,255,0.04)'
                          }}
                        />
                        {subscriberError && (
                          <p className="text-[10px] text-red-500 font-medium pl-1">{subscriberError}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={subscribing}
                        className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                        style={{
                          background: effectiveButtonColor,
                          color: effectiveButtonTextColor
                        }}
                      >
                        {subscribing ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Subscribing...</span>
                          </>
                        ) : (
                          <>
                            <span>{user.emailFormBtn || 'Subscribe'}</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* UPI Donation if link exists and plan is not FREE */}
          {showSupportCard && (
            <div className="pt-6">
              <div 
                className={cn(
                  "card border-2 p-6 flex flex-col items-center relative overflow-hidden", 
                  theme.isGlass && "backdrop-blur-md"
                )}
                style={{ 
                  borderColor: user.plan === 'PRO_PLUS' ? effectiveAccentColor : `${effectiveButtonColor}20`, 
                  borderRadius: `${upiCardRadius}px`,
                  boxShadow: user.plan === 'PRO_PLUS' ? `0 0 25px ${effectiveAccentColor}30` : undefined,
                  background: standardCardBg
                }}
              >

                <Smartphone style={{ color: effectiveButtonColor }} className="mb-3" size={32} />
                <h4 className="font-bold text-ink mb-1 text-center" style={{ color: standardCardTextColor }}>
                  {upiDescription || 'Support my work'}
                </h4>
                <p className="text-[11px] mb-6 text-center" style={{ color: standardCardMutedColor }}>Direct tip via any UPI app</p>
                
                <div className="grid grid-cols-3 gap-2 w-full mb-4">
                  {['50', '100', '500'].map(amt => (
                    <button 
                      key={amt} 
                      onClick={() => setUpiAmount(amt)}
                      className={cn(
                        "p-3 text-xs font-extrabold transition-all text-center flex items-center justify-center shadow-sm border border-transparent",
                        upiAmount === amt 
                          ? "" 
                          : "hover:scale-[1.02]"
                      )}
                      style={{ 
                        background: upiAmount === amt ? effectiveButtonColor : 'transparent',
                        color: upiAmount === amt ? effectiveButtonTextColor : standardCardTextColor,
                        borderColor: upiAmount === amt ? effectiveButtonColor : (isBgLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'),
                        borderRadius: `${upiButtonRadius}px`
                      }}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>

                {/* Custom Amount input in addition to preselected tip amounts */}
                <div className="w-full mb-4">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">₹</span>
                    <input 
                      type="number" 
                      value={upiAmount} 
                      onChange={(e) => setUpiAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 text-left text-xs font-bold border focus:outline-none transition-all shadow-sm"
                      style={{ 
                        borderRadius: `${upiButtonRadius}px`,
                        color: standardCardTextColor,
                        borderColor: isBgLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
                        background: isBgLight ? '#FFFFFF' : 'rgba(255,255,255,0.04)'
                      }}
                      placeholder="Enter custom sweet amount"
                      min="1"
                    />
                  </div>
                </div>

                {/* Support Goals section for PRO_PLUS */}
                {user.plan === 'PRO_PLUS' && upiGoalEnabled && (
                  <div className="w-full mb-5 p-3.5 border rounded-xl text-left" style={{ background: `${effectiveButtonColor}05`, borderColor: `${effectiveButtonColor}15` }}>
                    {(() => {
                      const title = upiGoalTitle || 'Support Goal'
                      const target = Number(upiGoalTarget || 0)
                      const raised = Number(upiGoalRaised || 0)
                      const percent = target > 0 ? Math.min(Math.round((raised / target) * 100), 100) : 0
                      return (
                        <>
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-2 text-ink" style={{ color: standardCardTextColor }}>
                            <span>Goal: {title}</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full overflow-hidden bg-black/[0.1] font-sans" style={{ background: isBgLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)' }}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percent}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full"
                              style={{ background: effectiveAccentColor || effectiveButtonColor }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[9px] font-bold mt-1.5" style={{ color: standardCardMutedColor }}>
                            <span>Raised: ₹{raised.toLocaleString('en-IN')}</span>
                            <span>Goal: ₹{target.toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                )}

                <button 
                  onClick={handleUPIPay}
                  className={cn("w-full py-3.5 flex items-center justify-center gap-2 font-extrabold transition-all hover:scale-[1.02] shadow-sm border-0")}
                  style={{ 
                    background: effectiveButtonColor, 
                    color: effectiveButtonTextColor,
                    borderRadius: `${upiButtonRadius}px`
                  }}
                >
                  <span>{upiTitle || 'Send Sweet Tip'} (₹{upiAmount})</span>
                  <Zap size={16} className={cn(effectiveButtonTextColor === '#FFFFFF' ? "fill-white" : "")} style={{ fill: effectiveButtonTextColor }} />
                </button>
              </div>
            </div>
          )}

          {/* Store Section */}
          {products.length > 0 && (user.plan === 'PRO_PLUS' || user.plan === 'PRO' || products.length > 0) && (
            <div id="digital-store-section" className="pt-10 space-y-5 w-full">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-orange/10">
                    <ShoppingBag size={20} style={{ color: effectiveAccentColor }} />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest opacity-80" style={{ color: effectiveTextColor }}>Digital Store</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                {products.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.1 * i,
                      type: 'spring',
                      stiffness: 100,
                      damping: 15
                    }}
                    whileHover={{ scale: 1.02, translateY: -4 }}
                    className={cn(
                      "product-card group relative flex flex-col p-1.5 sm:p-2.5 transition-all shadow-2xl overflow-hidden cursor-pointer border-2 select-none no-screenshot h-full",
                      isOwner && !p.isActive && "opacity-80 grayscale-[0.4]",
                      theme.isGlass && "backdrop-blur-md"
                    )}
                    style={{ 
                      borderColor: isBgLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)',
                      borderRadius: '16px',
                      background: standardCardBg
                    }}
                    onClick={() => {
                      if (user?.uid) {
                        trackClick(user.uid, { id: p.id, title: p.title })
                      }
                      setPreviewProduct(p)
                    }}
                  >
                    {/* Visual Flourish */}
                    <div 
                      className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[60px] opacity-10 group-hover:opacity-20 transition-opacity"
                      style={{ background: effectiveAccentColor }}
                    />

                    {/* Admin Overlay */}
                    {isOwner && (
                        <div className="absolute inset-0 z-20 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 sm:p-6 gap-1.5 sm:gap-3">
                            {!deletingId || deletingId !== p.id ? (
                              <>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleEdit(p); }}
                                    className="w-full bg-white text-ink py-2 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[11px] uppercase tracking-widest hover:bg-orange hover:text-white transition-all flex items-center justify-center gap-1 sm:gap-2"
                                >
                                    <Edit3 size={12} /> Edit Product
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleToggleHold(p); }}
                                    className="w-full bg-white/10 backdrop-blur-md text-white py-2 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[11px] uppercase tracking-widest border border-white/20 hover:bg-white hover:text-ink transition-all flex items-center justify-center gap-1 sm:gap-2"
                                >
                                    {p.isActive ? <><EyeOff size={12} /> Hold</> : <><Eye size={12} /> Publish</>}
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setDeletingId(p.id); }}
                                    className="w-full bg-red-500/20 text-red-100 py-2 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[11px] uppercase tracking-widest border border-red-500/30 hover:bg-red-500 hover:text-white transition-all"
                                >
                                    <Trash2 size={12} className="inline mr-1" /> Delete
                                </button>
                              </>
                            ) : (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="w-full bg-white rounded-2xl sm:rounded-[2rem] p-3 sm:p-6 text-center space-y-2 sm:space-y-4"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="space-y-0.5 sm:space-y-1">
                                  <p className="text-ink font-black text-[10px] sm:text-xs uppercase tracking-tight">Delete Product?</p>
                                  <p className="text-muted text-[8px] sm:text-[10px] font-bold uppercase tracking-widest">This is permanent.</p>
                                </div>
                                <div className="flex gap-1.5 sm:gap-2">
                                  <button 
                                    disabled={isProcessingDelete === p.id}
                                    onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                                    className="flex-1 py-1.5 sm:py-3 bg-cream rounded-lg sm:rounded-xl text-muted font-black text-[8px] sm:text-[10px] uppercase tracking-widest hover:bg-cream-2 transition-colors disabled:opacity-50"
                                  >
                                    No
                                  </button>
                                  <button 
                                    disabled={isProcessingDelete === p.id}
                                    onClick={(e) => { e.stopPropagation(); handleDelete(p); }}
                                    className="flex-1 py-1.5 sm:py-3 bg-red-500 rounded-lg sm:rounded-xl text-white font-black text-[8px] sm:text-[10px] uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center disabled:opacity-50"
                                  >
                                    {isProcessingDelete === p.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "YES"}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                        </div>
                    )}
                    
                    <div className="relative p-1.5 sm:p-3 z-10 flex-col flex-1 flex">
                      <div 
                        className="relative aspect-[4/3] overflow-hidden shadow-lg border-2 sm:border-4 border-white mb-2 sm:mb-4 rounded-xl sm:rounded-[20px]"
                      >
                        {p.coverImageUrl || p.imageUrl || p.image ? (
                          <img 
                            src={p.coverImageUrl || p.imageUrl || p.image || ""} 
                            alt={p.title || p.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 pointer-events-none" 
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-cream-3 opacity-30 gap-1 sm:gap-2 p-2" style={{ color: effectiveAccentColor }}>
                            <ShoppingBag className="w-6 h-6 sm:w-10 sm:h-10" strokeWidth={1.5} />
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-tighter text-center">Premium Bundle</span>
                          </div>
                        )}
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Tags */}
                        <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-wrap gap-1">
                          {isOwner && (
                             <span className={cn(
                                "text-[6px] sm:text-[8px] font-black uppercase tracking-widest px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md shadow-md backdrop-blur-md border",
                                p.isActive ? "bg-green-500/80 text-white border-green-400" : "bg-ink middle text-white border-white/20"
                             )}>
                                {p.isActive ? 'Live' : 'Draft'}
                             </span>
                          )}
                          <span 
                            className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full shadow-md backdrop-blur-md border border-white/30"
                            style={{ 
                              color: 'white',
                              background: `${effectiveAccentColor}CC`
                            }}
                          >
                             {p.category || 'Digital'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="px-1 flex-1">
                        <h4 
                          className="font-black text-xs sm:text-lg lg:text-xl tracking-tight leading-tight mb-0.5 sm:mb-1 group-hover:text-orange transition-colors line-clamp-1"
                          style={{ color: standardCardTextColor }}
                        >
                          {p.title || p.name}
                        </h4>
                        <p className="text-[9px] sm:text-[12px] opacity-70 line-clamp-1 sm:line-clamp-2 font-medium leading-relaxed mb-1" style={{ color: standardCardMutedColor }}>
                          {p.shortDesc || p.description || "Get instant access to this premium digital product. High-quality content guaranteed."}
                        </p>
                      </div>
                    </div>
 
                    <div 
                      className="relative mt-auto p-2 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between z-10 border-t border-cream-2/50 bg-cream-1/10 gap-2 w-full"
                      style={{ borderRadius: '0 0 16px 16px' }}
                    >
                       <div className="flex flex-col text-left">
                          <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest opacity-50" style={{ color: standardCardMutedColor }}>Premium Access</span>
                          <p className="text-sm sm:text-2xl font-black leading-none mt-0.5" style={{ color: effectiveAccentColor }}>
                            {formatPrice(p.price)}
                          </p>
                       </div>
                       
                       <motion.button
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         className="flex items-center justify-center gap-1.5 px-3 sm:px-6 py-1.5 sm:py-3 font-black text-[8px] sm:text-xs uppercase tracking-widest transition-all text-white shadow-lg"
                         style={{ 
                           background: effectiveButtonColor,
                           color: effectiveButtonTextColor,
                           borderRadius: '12px'
                         }}
                         onClick={(e) => {
                           e.stopPropagation()
                           setSelectedProduct(p)
                           setIsCheckoutOpen(true)
                         }}
                       >
                         <span>Buy Now</span> <ArrowRight className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 group-hover:translate-x-1 transition-transform" />
                       </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        <CheckoutModal 
          isOpen={isCheckoutOpen} 
          onClose={() => setIsCheckoutOpen(false)} 
          product={selectedProduct} 
          creatorUid={user.uid}
        />

        {/* UPI Tip QR Modal for Desktop Users */}
        <AnimatePresence>
          {isUpiModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
              onClick={() => setIsUpiModalOpen(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[28px] max-w-sm w-full p-6 text-center shadow-2xl border border-cream-2 relative text-ink"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setIsUpiModalOpen(false)}
                  className="absolute top-4 right-4 text-ink hover:opacity-60 font-bold text-lg"
                >
                  ✕
                </button>
                <h3 className="text-xl font-black font-syne text-ink mb-1">
                  Support {modalDisplayName || 'Creator'}
                </h3>
                <p className="text-[11px] text-muted mb-6 uppercase tracking-wider font-bold">
                  Scan with any UPI app to pay
                </p>

                <div className="bg-cream-1 p-4 rounded-2xl inline-block border border-cream-2/40 mb-6 shadow-inner mx-auto">
                  <QRCodeCanvas 
                    value={generatedUpiLink} 
                    size={200} 
                    className="mx-auto rounded-lg"
                  />
                </div>

                <div className="text-2xl font-black text-ink mb-1">
                  ₹{modalAmount}
                </div>
                
                <p className="text-xs font-bold text-muted mb-4 truncate max-w-full px-2" title={modalUpiId}>
                  UPI ID: {modalUpiId}
                </p>

                {/* Badges of major UPI apps */}
                <div className="flex justify-center items-center gap-3 py-3 border-t border-cream-2 mt-4">
                  {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                    <span 
                      key={app} 
                      className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border border-cream-2 text-ink bg-cream-1"
                    >
                      {app}
                    </span>
                  ))}
                </div>

                <button 
                  onClick={() => {
                    const upiId = modalUpiId || ''
                    navigator.clipboard.writeText(upiId)
                    toast.success('UPI ID copied!')
                  }}
                  className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl transition-all"
                >
                  Copy UPI ID
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Admin Edit Modal */}
        {isOwner && (
            <AddEditProductModal 
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false)
                    setEditingProduct(null)
                }}
                product={editingProduct}
                uid={user.uid}
                onSave={loadData}
            />
        )}

        {/* Product Preview Modal */}
        <AnimatePresence>
          {previewProduct && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setPreviewProduct(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white w-full max-w-xl rounded-[40px] overflow-hidden shadow-2xl relative product-card no-screenshot"
                onClick={e => e.stopPropagation()}
              >
                {/* Close Button */}
                <button 
                  onClick={() => setPreviewProduct(null)}
                  className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors"
                >
                  <ArrowRight className="rotate-180" size={20} />
                </button>

                <div className="relative h-64 overflow-hidden">
                  {previewProduct.imageUrl ? (
                    <img 
                      src={previewProduct.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover pointer-events-none" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-cream-3 flex items-center justify-center">
                      <ShoppingBag size={64} className="opacity-10" />
                    </div>
                  )}
                  {/* Watermark Overlay for protection */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] rotate-[-25deg]">
                    <div className="grid grid-cols-4 gap-12 font-black text-6xl">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <span key={`watermark-span-${i}`}>Lynksy</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span 
                        className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                        style={{ color: effectiveButtonColor, background: `${effectiveButtonColor}1A` }}
                      >
                        {previewProduct.category || 'Digital'}
                      </span>
                      <span className="text-[10px] font-bold text-muted flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-green-500" /> Verified Content
                      </span>
                    </div>
                    <h2 className="text-4xl font-black font-syne text-ink leading-tight">
                      {previewProduct.title}
                    </h2>
                  </div>

                  <p className="text-muted leading-relaxed text-lg">
                    {previewProduct.description || "This exclusive digital product includes high-quality content curated by the creator. Get instant access upon purchase."}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-cream-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-black uppercase tracking-widest text-muted">Price for Access</span>
                      <div className="text-4xl font-black text-ink">
                        {formatPrice(previewProduct.price)}
                      </div>
                    </div>
                    <button 
                      className="btn-primary h-16 px-10 rounded-3xl text-sm tracking-widest uppercase font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                      style={{ background: effectiveButtonColor, color: effectiveButtonTextColor }}
                      onClick={() => {
                        setSelectedProduct(previewProduct)
                        setPreviewProduct(null)
                        setIsCheckoutOpen(true)
                      }}
                    >
                      Unlock Now <Zap size={18} fill="currentColor" />
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-center text-muted font-medium opacity-50 uppercase tracking-tighter">
                    Secured by Lynksy. 100% Secure Payment.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Branding */}
        {(user.plan === 'FREE') && (
          <div className="mt-auto">
            <Link 
              to="/" 
              className="flex items-center gap-2 px-4 py-2 bg-black/5 hover:bg-black/10 transition-colors rounded-full"
            >
              <span className="text-xs font-bold font-syne" style={{ color: effectiveTextColor }}>Powered by Lynksy</span>
              <LinkIcon size={14} style={{ color: effectiveTextColor }} />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
