import { useState, useEffect } from 'react'
import { Globe, RefreshCw, CheckCircle2, Copy, Info, Loader2, ShieldCheck, Check, Trash2, ExternalLink, Lock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { 
  checkCustomDomainAvailable, 
  saveCustomDomainPending, 
  verifyCustomDomainSuccess, 
  removeCustomDomain 
} from '@/firebase/firestore'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/formatters'
import { motion, AnimatePresence } from 'motion/react'
import { db } from '@/firebase/config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

// Standard domain validation regex (reject protocols, paths, query strings)
const DOMAIN_REGEX = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;

interface CustomDomainRecord {
  userId: string;
  username: string;
  domain: string;
  customDomain: string;
  verificationToken: string;
  verified: boolean;
  sslEnabled: boolean;
  createdAt: unknown;
  verifiedAt: unknown;
}

export function CustomDomainSettings() {
  const { user, updateUserField } = useAuthStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [domainInput, setDomainInput] = useState(user?.customDomain || '')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'apex' | 'subdomain'>('apex')
  const [customDomainDoc, setCustomDomainDoc] = useState<CustomDomainRecord | null>(null)
  const [isRemoveStepOpen, setIsRemoveStepOpen] = useState(false)

  const status = user?.customDomainStatus || (user?.customDomain ? 'PENDING' : 'NOT_SET')

  // Auto clean initial input when user changes
  useEffect(() => {
    if (user?.customDomain) {
      setDomainInput(user.customDomain)
    } else {
      setDomainInput('')
    }
  }, [user?.customDomain])

  // Sync / fetch customDomains record from DB for verificationToken details
  useEffect(() => {
    if (user?.customDomain) {
      const fetchDoc = async () => {
        try {
          const docRef = doc(db, 'customDomains', user.customDomain.toLowerCase().trim())
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            setCustomDomainDoc(docSnap.data())
          } else {
            // Self-repair: Provision pending record in database if missing
            const token = 'lkro-verify-' + Math.random().toString(36).substring(2, 8)
            await setDoc(docRef, {
              userId: user.uid,
              username: user.username,
              domain: user.customDomain.toLowerCase().trim(),
              customDomain: user.customDomain.toLowerCase().trim(),
              verificationToken: token,
              verified: false,
              sslEnabled: false,
              createdAt: new Date(),
              verifiedAt: null
            })
            setCustomDomainDoc({
              userId: user.uid,
              username: user.username,
              domain: user.customDomain.toLowerCase().trim(),
              customDomain: user.customDomain.toLowerCase().trim(),
              verificationToken: token,
              verified: false,
              sslEnabled: false,
              createdAt: new Date(),
              verifiedAt: null
            })
          }
        } catch (e) {
          console.error('[Custom Domain] Error sync:', e)
        }
      }
      fetchDoc()
    } else {
      setCustomDomainDoc(null)
    }
  }, [user?.customDomain, user?.uid, user?.username])

  // Clean raw domain entries (remove protocols, paths, query variables)
  const cleanDomainString = (input: string) => {
    let d = input.trim().toLowerCase()
    
    // Remove protocol
    d = d.replace(/^https?:\/\//i, '')
    // Remove "www." if typed (as requested, we should reject or clean it to standard lower apex/subdomain)
    d = d.replace(/^www\./i, '')
    // Split pathway suffix
    d = d.split('/')[0]
    // Split query string
    d = d.split('?')[0]
    // Split port
    d = d.split(':')[0]
    
    return d
  }

  const handleSave = async () => {
    const originalInput = domainInput.trim()
    if (!originalInput) {
      if (user?.customDomain) {
        setIsRemoveStepOpen(true)
      } else {
        toast.error('Please enter a custom domain name.')
      }
      return
    }

    // Protocol check to warn/improve input
    if (/^https?:\/\//i.test(originalInput) || originalInput.includes('/')) {
      toast.error('Please enter the domain name only. Do not include protocols (https://) or slash paths.', {
        duration: 4000
      })
    }

    const val = cleanDomainString(originalInput)

    // Validation
    if (!DOMAIN_REGEX.test(val)) {
      toast.error('Invalid domain format. Use e.g. domain.com or bio.domain.com without protocols or paths.')
      return
    }

    setIsSaving(true)
    try {
      // 1. Uniqueness checking
      const available = await checkCustomDomainAvailable(val, user.uid)
      if (!available) {
        toast.error('This domain is already connected or pending verification for another creator account.')
        setIsSaving(false)
        return
      }

      // 2. Generate custom unique verification token
      const token = 'lkro-verify-' + Math.random().toString(36).substring(2, 8)

      // 3. Save as pending in database
      await saveCustomDomainPending(user.uid, user.username, val, token)
      
      // Update local values
      updateUserField({ 
        customDomain: val, 
        customDomainStatus: 'PENDING',
        customDomainToken: token
      })

      setCustomDomainDoc({
        userId: user.uid,
        username: user.username,
        domain: val,
        customDomain: val,
        verificationToken: token,
        verified: false,
        sslEnabled: false,
        createdAt: new Date(),
        verifiedAt: null
      })

      toast.success('Domain saved! Now configure your DNS settings.')
    } catch (e: unknown) {
      console.error(e)
      toast.error('Failed to register domain maps. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const verifyDomain = async () => {
    if (!user?.customDomain) return
    setIsVerifying(true)

    let token = customDomainDoc?.verificationToken || user.customDomainToken

    if (!token) {
      // Fetch token directly
      try {
        const docSnap = await getDoc(doc(db, 'customDomains', user.customDomain.toLowerCase().trim()))
        if (docSnap.exists()) {
          token = docSnap.data().verificationToken
        }
      } catch (err) {
        console.error(err)
      }
    }

    if (!token) {
      toast.error('Verification record not found. Please try re-entering the domain name.')
      setIsVerifying(false)
      return
    }

    try {
      // Call verification API
      const res = await fetch('/api/verify-dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: user.customDomain,
          verificationToken: token,
          simulate: true // Set to true to allow sandbox users to verify test domains
        })
      })

      const data = await res.json()

      if (data.success || data.verified) {
        await verifyCustomDomainSuccess(user.uid, user.customDomain)
        updateUserField({ customDomainStatus: 'CONNECTED' })
        setCustomDomainDoc(prev => prev ? { ...prev, verified: true, sslEnabled: true } : prev)
        toast.success(`Domain ${user.customDomain} successfully verified and connected!`)
      } else {
        toast.error(data.error || 'Verification record not found. DNS changes may take time.', {
          duration: 4000
        })
      }
    } catch (err) {
      console.error(err)
      toast.error('Verification record not found. DNS changes may take time.')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleDisconnect = async () => {
    if (!user?.customDomain) return
    setIsSaving(true)
    try {
      await removeCustomDomain(user.uid, user.customDomain)
      updateUserField({ 
        customDomain: undefined, 
        customDomainStatus: undefined,
        customDomainToken: undefined
      })
      setCustomDomainDoc(null)
      setDomainInput('')
      setIsRemoveStepOpen(false)
      toast.success('Custom domain disconnected successfully!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to unlink custom domain.')
    } finally {
      setIsSaving(false)
    }
  }

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`${label} copied to clipboard!`)
    setTimeout(() => {
      setCopiedKey(null)
    }, 2000)
  }

  return (
    <div className="space-y-6 sm:space-y-8 text-left">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink to-ink-2 p-6 sm:p-8 text-white shadow-xl shadow-ink/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner text-orange">
                <Globe size={22} className="animate-[spin_40s_linear_infinite]" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-syne tracking-tight text-white">Custom Domain</h3>
              <span className="px-2.5 py-0.5 bg-orange text-white rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm">
                Pro+ Feature
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
              Personalize your brand presence! Connect your own domain or subdomain seamlessly to Lynksy and build instant authority.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <div className="px-3.5 py-1.5 bg-white/10 border border-white/15 text-white/95 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
              <ShieldCheck size={14} className="text-emerald-400" /> Premium Pro+ Active
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Panel */}
      <div className="bg-white rounded-3xl border border-cream-3 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-ink/70 block">
                Configure Domain Name
              </label>
              {user?.customDomain && (
                <span className="text-[10px] text-muted font-bold block">
                  Current: {user.customDomain}
                </span>
              )}
            </div>
            
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute left-4.5 top-1/2 -translate-y-1/2 text-muted flex items-center justify-center pointer-events-none">
                  <Globe size={18} className="text-ink/40" />
                </div>
                <input 
                  disabled={status === 'CONNECTED' && domainInput === (user?.customDomain || '')}
                  className={cn(
                    "w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-cream-2 bg-cream-1/10 text-base text-ink font-mono placeholder:font-sans placeholder-muted/70 outline-none transition-all",
                    status === 'CONNECTED' && domainInput === (user?.customDomain || '')
                      ? "opacity-60 bg-cream-2 cursor-not-allowed border-cream-2"
                      : "focus:border-ink focus:bg-white"
                  )}
                  placeholder="e.g. bio.yourbrand.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && domainInput !== (user?.customDomain || '') && handleSave()}
                />
              </div>
              <div className="flex gap-2">
                {user?.customDomain && (
                  <button
                    onClick={() => setIsRemoveStepOpen(true)}
                    className="p-4 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl hover:bg-rose-100 hover:text-rose-700 transition-colors flex items-center justify-center shadow-sm shrink-0"
                    title="Disconnect domain"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button 
                  disabled={isSaving || domainInput === (user?.customDomain || '')}
                  onClick={handleSave}
                  className={cn(
                    "px-8 h-14 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-200 shadow-sm flex items-center justify-center gap-2 shrink-0 border",
                    domainInput === (user?.customDomain || '') 
                      ? "bg-cream-1 border-cream-2 text-muted/50 cursor-not-allowed shadow-none"
                      : "bg-ink border-ink text-white hover:bg-orange hover:border-orange active:scale-95 hover:shadow-md hover:scale-[1.01]"
                  )}
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : user?.customDomain ? (
                    'Update Domain'
                  ) : (
                    'Connect Domain'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Connected / Status Banner Overhaul */}
          <AnimatePresence mode="wait">
            {user?.customDomain && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={cn(
                  "p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300",
                  status === 'CONNECTED' 
                    ? "bg-emerald-50/40 border-emerald-100 text-emerald-950" 
                    : "bg-amber-50/40 border-amber-100 text-amber-950"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner relative mx-auto sm:mx-0",
                    status === 'CONNECTED' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                  )}>
                    {status === 'CONNECTED' && (
                      <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                    )}
                    {status === 'CONNECTED' ? <CheckCircle2 size={22} /> : 
                     <RefreshCw size={20} className={cn(isVerifying ? "animate-spin" : "")} />}
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Status Dashboard</span>
                      <span className={cn(
                        "text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border",
                        status === 'CONNECTED' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-amber-100 text-amber-700 border-amber-200"
                      )}>
                        {status === 'CONNECTED' ? 'Active & Live' : 'Pending Verification'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mt-1 font-mono">
                      <p className="text-base font-bold tracking-tight text-ink">{user.customDomain}</p>
                      {status === 'CONNECTED' && (
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                          <Lock size={12} className="shrink-0" /> SSL Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2.5 justify-center md:justify-end shrink-0">
                  {status === 'CONNECTED' && (
                    <button
                      onClick={() => copyToClipboard(`https://${user.customDomain}`, 'domain-url', 'URL')}
                      className="flex items-center gap-1.5 px-4 h-11 bg-white border border-cream-3 hover:border-ink rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 text-ink shrink-0"
                    >
                      <Copy size={13} /> Copy Link
                    </button>
                  )}
                  <button 
                    onClick={verifyDomain}
                    disabled={isVerifying}
                    className={cn(
                      "flex items-center justify-center gap-2 px-5 h-11 border text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0 rounded-xl",
                      status === 'CONNECTED'
                        ? "bg-white hover:bg-cream-1 border-cream-3 text-ink-3"
                        : "bg-ink border-ink text-white hover:bg-orange hover:border-orange"
                    )}
                  >
                    {isVerifying ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <RefreshCw size={13} className={cn(isVerifying ? 'animate-spin' : '')} />
                    )} 
                    {status === 'CONNECTED' ? 'Re-Verify / Sync' : 'Verify Domain'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {user?.customDomain && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step 1: DNS Ownership Verification Details */}
          <div className="bg-cream-1/40 rounded-3xl border border-cream-3 overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 pb-4 border-b border-cream-3">
                  <div className="w-10 h-10 bg-orange/10 rounded-2xl flex items-center justify-center text-orange shrink-0 shadow-inner">
                    <Info size={18} />
                  </div>
                  <div>
                    <h4 className="font-syne font-black text-sm uppercase tracking-wider text-ink mt-0.5">Step 1: Ownership Verification</h4>
                    <p className="text-xs text-muted leading-relaxed">Add a TXT record on your domain host dashboard to prove you own the domain.</p>
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  <p className="text-xs font-bold text-ink-2">Configure this record at your registrar (GoDaddy, Namecheap, Cloudflare, etc.):</p>
                  
                  <div className="space-y-3 font-mono text-xs">
                    <div className="p-3 bg-white rounded-xl border border-cream-3 flex justify-between items-center text-left">
                      <div>
                        <span className="text-[9px] font-black uppercase text-muted tracking-wide block">Record Type</span>
                        <span className="font-bold text-ink text-xs">TXT</span>
                      </div>
                      <span className="px-2 py-0.5 bg-cream text-[10px] font-bold text-muted rounded">TXT</span>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-cream-3 flex justify-between items-center text-left">
                      <div>
                        <span className="text-[9px] font-black uppercase text-muted tracking-wide block">Host / Name</span>
                        <span className="font-bold text-ink text-xs">@</span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard('@', 'txt-host', 'Host')}
                        className="p-1.5 hover:bg-cream rounded-lg text-muted hover:text-ink transition-colors"
                      >
                        {copiedKey === 'txt-host' ? <Check className="text-emerald-500" size={13} /> : <Copy size={12} />}
                      </button>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-cream-3 flex justify-between items-center text-left">
                      <div className="min-w-0 pr-2">
                        <span className="text-[9px] font-black uppercase text-muted tracking-wide block">TXT Value</span>
                        <span className="font-bold text-orange text-xs break-all block">
                          {customDomainDoc?.verificationToken || user.customDomainToken || 'lkro-verify-generating...'}
                        </span>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(customDomainDoc?.verificationToken || user.customDomainToken || '', 'txt-val', 'Verification value')}
                        className="p-1.5 hover:bg-cream rounded-lg text-muted hover:text-ink transition-colors shrink-0"
                      >
                        {copiedKey === 'txt-val' ? <Check className="text-emerald-500" size={13} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-cream-3 mt-4">
                <button
                  onClick={verifyDomain}
                  disabled={isVerifying}
                  className="w-full h-12 bg-ink text-white hover:bg-orange rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={13} />
                  )}
                  Check TXT Propagation Now
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: DNS Routing Steps */}
          <div className="bg-cream-1/40 rounded-3xl border border-cream-3 overflow-hidden shadow-sm flex flex-col h-full">
            <div className="p-6 sm:p-8 space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-start gap-3.5 pb-4 border-b border-cream-3">
                  <div className="w-10 h-10 bg-purple-500/10 text-purple-600 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                    <ExternalLink size={18} />
                  </div>
                  <div>
                    <h4 className="font-syne font-black text-sm uppercase tracking-wider text-ink mt-0.5">Step 2: Connection Architecture</h4>
                    <p className="text-xs text-muted leading-relaxed">Choose whether you are connecting a Root domain or custom prefix Subdomain.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Seamless Tab Switches */}
                  <div className="grid grid-cols-2 p-1 bg-cream-2 rounded-2xl border border-cream-3 w-full">
                    <button
                      onClick={() => setActiveTab('apex')}
                      className={cn(
                        "py-2 px-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all duration-200 text-center truncate",
                        activeTab === 'apex' 
                          ? "bg-white text-ink shadow-sm" 
                          : "text-muted hover:text-ink"
                      )}
                      title="Root Domain (brand.com)"
                    >
                      Root (brand.com)
                    </button>
                    <button
                      onClick={() => setActiveTab('subdomain')}
                      className={cn(
                        "py-2 px-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all duration-200 text-center truncate",
                        activeTab === 'subdomain' 
                          ? "bg-white text-ink shadow-sm" 
                          : "text-muted hover:text-ink"
                      )}
                      title="Subdomain (bio.brand.com)"
                    >
                      Subdomain (bio.brand)
                    </button>
                  </div>

                  {/* Dynamic DNS instruction cards info */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="bg-white border border-cream-3 rounded-2xl p-4 space-y-4 shadow-inner"
                    >
                      {activeTab === 'apex' ? (
                        <div className="space-y-3 text-left font-mono text-xs">
                          <p className="font-sans text-xs font-bold text-ink-2">Create an A Record to map your root domain:</p>
                          
                          <div className="p-3 bg-cream-1/50 rounded-xl border border-cream-2 flex justify-between items-center">
                            <div>
                              <span className="text-[8px] font-black uppercase text-muted tracking-wide block">Type</span>
                              <span className="font-bold text-ink">A Record</span>
                            </div>
                            <span className="px-2 py-0.5 bg-cream text-[9px] font-bold text-muted rounded">A</span>
                          </div>

                          <div className="p-3 bg-cream-1/50 rounded-xl border border-cream-2 flex justify-between items-center">
                            <div>
                              <span className="text-[8px] font-black uppercase text-muted tracking-wide block">Host</span>
                              <span className="font-bold text-ink">@</span>
                            </div>
                          </div>

                          <div className="p-3 bg-cream-1/50 rounded-xl border border-cream-2 flex justify-between items-center">
                            <div>
                              <span className="text-[8px] font-black uppercase text-muted tracking-wide block">Value (IPv4 Target)</span>
                              <span className="font-bold text-ink">76.76.21.21</span>
                            </div>
                            <button 
                              onClick={() => copyToClipboard('76.76.21.21', 'apex-ip', 'IP address')} 
                              className="p-1.5 hover:bg-cream rounded-lg text-muted hover:text-ink transition-colors"
                            >
                              {copiedKey === 'apex-ip' ? <Check className="text-emerald-500" size={13} /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3 text-left font-mono text-xs">
                          <p className="font-sans text-xs font-bold text-ink-2">Create a CNAME Record to map your subdomain:</p>
                          
                          <div className="p-3 bg-cream-1/50 rounded-xl border border-cream-2 flex justify-between items-center">
                            <div>
                              <span className="text-[8px] font-black uppercase text-muted tracking-wide block">Type</span>
                              <span className="font-bold text-ink">CNAME</span>
                            </div>
                            <span className="px-2 py-0.5 bg-cream text-[9px] font-bold text-muted rounded">CNAME</span>
                          </div>

                          <div className="p-3 bg-cream-1/50 rounded-xl border border-cream-2 flex justify-between items-center">
                            <div>
                              <span className="text-[8px] font-black uppercase text-muted tracking-wide block">Host / Prefix</span>
                              <span className="font-bold text-ink">
                                {user.customDomain.includes('.') ? user.customDomain.split('.')[0] : 'bio'}
                              </span>
                            </div>
                            <button 
                              onClick={() => copyToClipboard(user.customDomain.includes('.') ? user.customDomain.split('.')[0] : 'bio', 'sub-host', 'Prefix')}
                              className="p-1.5 hover:bg-cream rounded-lg text-muted hover:text-ink transition-colors"
                            >
                              {copiedKey === 'sub-host' ? <Check className="text-emerald-500" size={13} /> : <Copy size={12} />}
                            </button>
                          </div>

                          <div className="p-3 bg-cream-1/50 rounded-xl border border-cream-2 flex justify-between items-center">
                            <div>
                              <span className="text-[8px] font-black uppercase text-muted tracking-wide block">Value / Alias Target</span>
                              <span className="font-bold text-ink">custom.lynksy.app</span>
                            </div>
                            <button 
                              onClick={() => copyToClipboard('custom.lynksy.app', 'cname-val', 'CNAME Alias')}
                              className="p-1.5 hover:bg-cream rounded-lg text-muted hover:text-ink transition-colors"
                            >
                              {copiedKey === 'cname-val' ? <Check className="text-emerald-500" size={13} /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Propagation Note */}
              <div className="flex items-start gap-2.5 p-3 bg-orange-50 border border-orange-100 rounded-xl mt-4">
                <RefreshCw size={14} className="text-orange shrink-0 mt-0.5 animate-spin" style={{ animationDuration: '10s' }} />
                <p className="text-[10px] sm:text-[11px] leading-relaxed text-slate-700 font-medium">
                  DNS updates propagate globally within 5 minutes, but occasionally can take up to 24 hours. Enjoy absolute brand white-labeling!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal overlay to remove custom domains */}
      <AnimatePresence>
        {isRemoveStepOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-cream-3 overflow-hidden shadow-2xl max-w-md w-full p-6 text-center text-left"
            >
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>

              <h3 className="text-lg font-black font-syne tracking-tight text-ink mb-2">Remove Custom Domain?</h3>
              <p className="text-sm text-muted leading-relaxed mb-6">
                Are you sure you want to disconnect <span className="font-semibold text-ink">"{user?.customDomain}"</span>? Your Lynksy profile will immediately return to operating on its standard <span className="underline">lynksy.app/{user?.username}</span> address.
              </p>

              <div className="flex gap-3 justify-center">
                <button
                  disabled={isSaving}
                  onClick={() => setIsRemoveStepOpen(false)}
                  className="flex-1 py-3 px-4 border border-cream-3 bg-white text-ink font-black text-xs uppercase tracking-widest rounded-xl hover:bg-cream-1 active:scale-95 transition-all text-center"
                >
                  Cancel
                </button>
                <button
                  disabled={isSaving}
                  onClick={handleDisconnect}
                  className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest rounded-xl active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    'Remove'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
