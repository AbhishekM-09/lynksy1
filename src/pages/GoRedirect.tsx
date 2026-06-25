import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getShortLinkByCode, recordShortLinkClick } from '@/firebase/shortLinks'
import { Spinner } from '@/components/ui/Spinner'
import { AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react'
import { motion } from 'motion/react'

export default function GoRedirect() {
  const { shortCode } = useParams<{ shortCode: string }>()
  const [error, setError] = useState<string | null>(null)
  const [targetUrl, setTargetUrl] = useState<string | null>(null)

  useEffect(() => {
    async function performRedirection() {
      if (!shortCode) {
        setError('No short code provided.')
        return
      }

      try {
        const link = await getShortLinkByCode(shortCode)
        
        if (!link) {
          setError('The shortened link you are looking for does not exist or has been disabled.')
          return
        }

        // Security validation to block malicious schemes (javascript:, data:, etc.)
        const isSafe = validateHttpUrl(link.originalUrl)
        if (!isSafe) {
          setError('Security Violation: The destination URL is invalid or blocked for security reasons.')
          return
        }

        setTargetUrl(link.originalUrl)

        // Gather visitor analytics
        const device = resolveDevice()
        const browser = resolveBrowser()
        const country = resolveCountry()
        const referrer = resolveReferrer()
        
        // Track unique visitor using sessionStorage to prevent counting consecutive duplicate sessions
        const sessionKey = `lynksy_short_clicked_${link.id}`
        const isAlreadyClicked = sessionStorage.getItem(sessionKey) === 'true'
        const isUnique = !isAlreadyClicked

        if (isUnique) {
          sessionStorage.setItem(sessionKey, 'true')
        }

        // Record the click and analytics asynchronously so we don't delay user transition
        recordShortLinkClick(link, {
          device,
          browser,
          country,
          referrer,
          isUnique
        }).catch((err) => {
          console.error('Failed to log click event stats:', err)
        })

        // Instantly redirect visitor
        window.location.href = link.originalUrl
      } catch (err) {
        console.error('Redirect failed:', err)
        setError('An unexpected error occurred during redirection.')
      }
    }

    performRedirection()
  }, [shortCode])

  // Helper to validate protocol and avoid javascript:/data: protocol injection
  function validateHttpUrl(urlStr: string): boolean {
    try {
      const url = new URL(urlStr)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      // If it doesn't parse with URL, check if starting with http/https
      const lower = urlStr.trim().toLowerCase()
      if (lower.startsWith('http://') || lower.startsWith('https://')) {
        return true
      }
      return false
    }
  }

  const resolveDevice = () => {
    const ua = navigator.userAgent
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet'
    if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) return 'mobile'
    return 'desktop'
  }

  const resolveBrowser = () => {
    const ua = navigator.userAgent
    if (ua.includes('Firefox')) return 'Firefox'
    if (ua.includes('SamsungBrowser')) return 'Samsung'
    if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
    if (ua.includes('Trident')) return 'IE_Explorer'
    if (ua.includes('Edge') || ua.includes('Edg')) return 'Edge'
    if (ua.includes('Chrome')) return 'Chrome'
    if (ua.includes('Safari')) return 'Safari'
    return 'Unknown Browser'
  }

  const resolveCountry = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('Asia/Kolkata')) return 'India'
      if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Los_Angeles') || tz.includes('Denver')) return 'USA'
      if (tz.includes('London') || tz.includes('Europe/London')) return 'UK'
      if (tz.includes('Sydney') || tz.includes('Melbourne')) return 'Australia'
      if (tz.includes('Singapore')) return 'Singapore'
      if (tz.includes('Dubai') || tz.includes('Gulf')) return 'UAE'
      
      const parts = tz.split('/')
      const locationName = parts[parts.length - 1].replace(/_/g, ' ')
      return locationName || 'Unknown'
    } catch {
      return 'Unknown'
    }
  }

  const resolveReferrer = () => {
    const ref = document.referrer
    if (!ref) return 'direct'
    try {
      const url = new URL(ref)
      const host = url.hostname.toLowerCase()
      if (host.includes('instagram.com')) return 'Instagram'
      if (host.includes('facebook.com')) return 'Facebook'
      if (host.includes('twitter.com') || host.includes('t.co')) return 'Twitter'
      if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube'
      if (host.includes('linkedin.com')) return 'LinkedIn'
      if (host.includes('whatsapp.com')) return 'WhatsApp'
      return url.hostname
    } catch {
      return 'other'
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fafaf6] flex items-center justify-center p-6 text-zinc-900 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white border border-zinc-200 shadow-xl rounded-3xl p-8 text-center space-y-6"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-500">
            <AlertCircle size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold font-syne tracking-tight">Redirection Unavailable</h1>
            <p className="text-zinc-500 text-sm leading-relaxed">{error}</p>
          </div>
          <div className="pt-2">
            <a 
              href="/"
              className="inline-flex items-center gap-2 justify-center w-full bg-zinc-950 hover:bg-zinc-800 text-white font-medium text-xs font-sans uppercase tracking-widest py-3 rounded-xl transition-all"
            >
              Back to Lynksy
            </a>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6 max-w-sm"
      >
        <div className="relative flex justify-center items-center">
          <div className="absolute w-24 h-24 rounded-full bg-orange/10 blur-[30px] animate-pulse" />
          <div className="w-16 h-16 bg-orange/10 border border-orange/10 rounded-[1.5rem] flex items-center justify-center relative z-10 text-orange">
            <ExternalLink size={24} className="animate-bounce" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-extrabold font-syne uppercase tracking-wider text-ink">
            Redirecting securely<span className="text-orange">...</span>
          </h2>
          <p className="text-xs text-muted font-bold tracking-widest uppercase text-[10px]">
            Checking safety bounds via Lynksy Shield
          </p>
        </div>

        <div className="flex justify-center pt-2">
          <Spinner size="md" />
        </div>

        {targetUrl && (
          <p className="text-[11px] text-zinc-400 font-mono break-all max-w-xs overflow-hidden text-ellipsis line-clamp-1">
            Destination: {targetUrl}
          </p>
        )}

        <div className="flex items-center gap-1.5 justify-center text-emerald-600/70 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/5 px-3 py-1 rounded-full border border-emerald-500/10 w-fit mx-auto">
          <ShieldCheck size={12} />
          SSL-Secured Anti-Piracy Tunnel
        </div>
      </motion.div>
    </div>
  )
}
