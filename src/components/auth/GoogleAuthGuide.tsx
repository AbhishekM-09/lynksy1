import { useState } from 'react'
import { HelpCircle, Copy, Check, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

export function GoogleAuthGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedSite, setCopiedSite] = useState(false)
  const [copiedRedirect1, setCopiedRedirect1] = useState(false)
  const [copiedRedirect2, setCopiedRedirect2] = useState(false)

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://lynksy.app'
  
  // Resolve standard development and shared endpoints based on origin signature
  const isDev = currentOrigin.includes('ais-dev-')
  const devUrl = isDev 
    ? currentOrigin 
    : currentOrigin.replace('ais-pre-', 'ais-dev-')
  
  const preUrl = currentOrigin.includes('ais-pre-')
    ? currentOrigin
    : currentOrigin.replace('ais-dev-', 'ais-pre-')

  const siteUrl = currentOrigin
  const redirectUrl1 = `${devUrl}/**`
  const redirectUrl2 = `${preUrl}/**`

  const handleCopy = (text: string, setValue: (v: boolean) => void) => {
    try {
      navigator.clipboard.writeText(text)
      setValue(true)
      setTimeout(() => setValue(false), 2000)
    } catch (err) {
      console.error('Failed to copy text', err)
    }
  }

  return (
    <div className="w-full bg-amber-50/50 border border-amber-200/60 rounded-xl overflow-hidden mt-3 transition-all duration-200 text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-amber-50/80 transition-colors text-amber-800"
      >
        <div className="flex items-center gap-2">
          <HelpCircle size={15} className="text-amber-600 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider">
            Google Auth redirecting to localhost? Setup Guide
          </span>
        </div>
        <div>
          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </div>
      </button>

      {isOpen && (
        <div className="px-4 pb-4 pt-1 text-xs text-amber-900 border-t border-amber-100 bg-amber-50/30 space-y-3 leading-relaxed">
          <p className="text-[11px] text-amber-800">
            Because this application runs in a dynamic, secure Cloud preview container, your Supabase project needs to know that this domain is trusted.
            If your domain is not whitelisted, Supabase will fall back to redirecting to your default Site URL (which is usually <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">localhost</code>), causing a <code className="bg-amber-100 px-1 py-0.5 rounded text-red-700">Connection Refused</code> error.
          </p>

          <div className="space-y-2 mt-2">
            <h4 className="font-bold text-[10px] text-amber-800 uppercase tracking-wider">
              1. Open Supabase Dashboard
            </h4>
            <a
              href="https://supabase.com/dashboard/project/_/auth/url-configuration"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300 rounded-md text-[10px] font-black text-amber-800 uppercase tracking-widest hover:bg-amber-100 transition-colors shadow-sm"
            >
              Go to URL Configuration <ExternalLink size={10} />
            </a>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-[10px] text-amber-800 uppercase tracking-wider">
              2. Add these URLs
            </h4>
            
            {/* Site URL config */}
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                Site URL
              </span>
              <div className="flex items-center gap-2 bg-white/90 border border-amber-200 rounded-lg p-1.5 font-mono text-[10px] text-zinc-700 shadow-inner">
                <span className="flex-1 truncate select-all">{siteUrl}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(siteUrl, setCopiedSite)}
                  className="p-1 hover:bg-amber-50 rounded text-amber-700 transition-colors shrink-0"
                >
                  {copiedSite ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Redirect URL 1 config */}
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                Redirect URI (Development)
              </span>
              <div className="flex items-center gap-2 bg-white/90 border border-amber-200 rounded-lg p-1.5 font-mono text-[10px] text-zinc-700 shadow-inner">
                <span className="flex-1 truncate select-all">{redirectUrl1}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(redirectUrl1, setCopiedRedirect1)}
                  className="p-1 hover:bg-amber-50 rounded text-amber-700 transition-colors shrink-0"
                >
                  {copiedRedirect1 ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* Redirect URL 2 config */}
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-700">
                Redirect URI (Preview/Shared)
              </span>
              <div className="flex items-center gap-2 bg-white/90 border border-amber-200 rounded-lg p-1.5 font-mono text-[10px] text-zinc-700 shadow-inner">
                <span className="flex-1 truncate select-all">{redirectUrl2}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(redirectUrl2, setCopiedRedirect2)}
                  className="p-1 hover:bg-amber-50 rounded text-amber-700 transition-colors shrink-0"
                >
                  {copiedRedirect2 ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-amber-700/80 font-medium">
            💡 <span className="font-bold">Pro Tip:</span> If you cannot configure your Supabase Dashboard right now, you can sign in/sign up instantly using the <span className="underline">Email & Password</span> option below instead.
          </div>
        </div>
      )}
    </div>
  )
}
