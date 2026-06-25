import React, { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import { 
  createShortLink, getShortLinks, deleteShortLink, toggleShortLinkActive, isAliasAvailable 
} from '@/firebase/shortLinks'
import { ShortLink } from '@/types'
import { 
  Link2, Plus, Sparkles, Copy, Check, Trash2, Search, Zap, AlertCircle, 
  BarChart3, Globe, Laptop, Smartphone, Tablet, ExternalLink, Calendar, 
  RefreshCw, Power, Crown
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'

export default function URLShortener() {
  const { user } = useAuthStore()

  // If user is not PRO+ they get blocked here
  const hasAccess = user?.plan === 'PRO_PLUS'

  const [links, setLinks] = useState<ShortLink[]>([])
  const [loading, setLoading] = useState(true)
  const [btnLoading, setBtnLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Selected link for displaying full analytics
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null)

  // Form states
  const [originalUrl, setOriginalUrl] = useState('')
  const [customAlias, setCustomAlias] = useState('')
  const [aliasChecking, setAliasChecking] = useState(false)

  // State to track copied link IDs for copy visual feedback
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (hasAccess && user?.uid) {
      fetchLinks()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAccess, user?.uid])

  async function fetchLinks() {
    if (!user?.uid) return
    setLoading(true)
    try {
      const data = await getShortLinks(user.uid)
      setLinks(data)
      if (data.length > 0 && !selectedLinkId) {
        setSelectedLinkId(data[0].id)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to retrieve short links')
    } finally {
      setLoading(false)
    }
  }

  // Auto choice fallback for selected link if deleted
  const selectedLink = useMemo(() => {
    return links.find(l => l.id === selectedLinkId) || null
  }, [links, selectedLinkId])

  // Filter links for search
  const filteredLinks = useMemo(() => {
    return links.filter(link => {
      const query = searchQuery.toLowerCase()
      return (
        link.originalUrl.toLowerCase().includes(query) ||
        link.shortCode.toLowerCase().includes(query)
      )
    })
  }, [links, searchQuery])

  // Aggregate stats across ALL links
  const totalClicksAcrossLinks = useMemo(() => {
    return links.reduce((acc, curr) => acc + (curr.clicks || 0), 0)
  }, [links])

  const topPerformingLink = useMemo(() => {
    if (links.length === 0) return null
    return [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0))[0]
  }, [links])

  // Process selected link analytics data for nice charts/progress bars
  const selectedLinkAnalytics = useMemo(() => {
    if (!selectedLink) return null

    const mapToRankedArray = (record: Record<string, number> | undefined) => {
      if (!record) return []
      return Object.entries(record)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    }

    return {
      devices: mapToRankedArray(selectedLink.devices),
      browsers: mapToRankedArray(selectedLink.browsers),
      countries: mapToRankedArray(selectedLink.countries),
      referrers: mapToRankedArray(selectedLink.referrers)
    }
  }, [selectedLink])

  // Copy button action
  const handleCopy = (code: string, id: string) => {
    const fullUrl = `https://lynksy.app/${code}`
    navigator.clipboard.writeText(fullUrl)
    setCopiedId(id)
    toast.success('Short link copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Validate URL protocol and pattern before saving
  const validateUrl = (urlStr: string): boolean => {
    try {
      const url = new URL(urlStr)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      // Allow fallback validation
      const lower = urlStr.trim().toLowerCase()
      return lower.startsWith('http://') || lower.startsWith('https://')
    }
  }

  // Check custom alias availability
  const checkAliasAvailability = async (aliasValue: string): Promise<boolean> => {
    if (!aliasValue.trim()) return true
    const clean = aliasValue.trim().toLowerCase()
    
    // Validate characters to prevent injection / URL corruption
    const validPattern = /^[a-zA-Z0-9_\-]+$/
    if (!validPattern.test(clean)) {
      toast.error('Alias can only contain letters, numbers, hyphens, and underscores.')
      return false
    }

    setAliasChecking(true)
    const available = await isAliasAvailable(clean)
    setAliasChecking(false)
    return available
  }

  // Form submission: Create shortened link
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) return

    if (!originalUrl.trim()) {
      toast.error('Please enter a target URL')
      return
    }

    // Safety checks / Block malicious URLs
    const target = originalUrl.trim()
    if (target.toLowerCase().startsWith('javascript:') || target.toLowerCase().startsWith('data:')) {
      toast.error('Security Warning: This protocol is blocked for security and anti-XSS reasons.')
      return
    }

    if (!validateUrl(target)) {
      toast.error('Invalid URL. Make sure it starts with http:// or https://')
      return
    }

    setBtnLoading(true)
    try {
      let code = customAlias.trim()
      
      if (code) {
        // Double check alias availability
        const isOk = await checkAliasAvailability(code)
        if (!isOk) {
          toast.error('This custom alias is already taken. Please choose a different one.')
          setBtnLoading(false)
          return
        }
      } else {
        // Generate random 6-character unique code
        let uniqueCode = ''
        let isUnique = false
        let retries = 5
        
        while (!isUnique && retries > 0) {
          uniqueCode = Math.random().toString(36).substring(2, 8).toLowerCase()
          isUnique = await isAliasAvailable(uniqueCode)
          retries--
        }

        if (!isUnique) {
          throw new Error('Failed to generate a unique short link. Please try again.')
        }
        code = uniqueCode
      }

      const freshLink = await createShortLink(user.uid, target, code)
      
      // Update local state
      setLinks(prev => [freshLink, ...prev])
      setSelectedLinkId(freshLink.id)
      
      // Reset form fields
      setOriginalUrl('')
      setCustomAlias('')
      toast.success('Short link generated successfully!')
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Error occurred while creating short link'
      toast.error(msg)
    } finally {
      setBtnLoading(false)
    }
  }

  // Disable / Enable link
  const handleToggleState = async (linkId: string, currentActive: boolean) => {
    try {
      await toggleShortLinkActive(linkId, !currentActive)
      setLinks(prev => prev.map(l => l.id === linkId ? { ...l, active: !currentActive } : l))
      toast.success(currentActive ? 'Short url disabled' : 'Short url enabled')
    } catch {
      toast.error('Failed to update link status')
    }
  }

  // Delete Short Link
  const handleDelete = async (linkId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteShortLink(linkId)
      setLinks(prev => prev.filter(l => l.id !== linkId))
      
      if (selectedLinkId === linkId) {
        setSelectedLinkId(null)
      }
      toast.success('Short link successfully deleted')
    } catch {
      toast.error('Failed to remove link')
    }
  }

  // Format click timestamps safely
  const formatTimestamp = (ts: unknown) => {
    if (!ts) return 'Never'
    try {
      const isFirestoreTimestamp = ts && typeof ts === 'object' && 'toDate' in ts;
      const date = isFirestoreTimestamp 
        ? (ts as { toDate: () => Date }).toDate() 
        : new Date(ts as string | number | Date)
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Recent'
    }
  }

  // Lock Screen for Free & Pro tiers
  if (!hasAccess) {
    return (
      <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[70vh] text-center font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 max-w-lg"
        >
          <div className="w-24 h-24 bg-purple-600/10 rounded-[2.5rem] flex items-center justify-center mb-8 relative mx-auto">
             <div className="absolute inset-0 bg-purple-600/10 blur-[60px] rounded-full animate-pulse" />
             <Crown className="text-purple-600 relative z-10" size={48} />
          </div>
          
          <div className="space-y-4">
            <span className="px-4 py-1.5 rounded-full bg-purple-600/10 text-purple-600 text-[10px] font-black uppercase tracking-widest border border-purple-500/15 inline-block">
              Premium Monetization Module
            </span>
            <h1 className="font-outfit font-black text-4xl lg:text-5xl uppercase tracking-tighter mb-4">
              URL Shortener is a <span className="text-purple-600">Pro+</span> Feature
            </h1>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-md mx-auto">
              Generate elite, customizable short codes like <span className="font-bold underline text-zinc-900">lynksy.app/ebook</span> to track deep visitor device, browser, referrer patterns with flat 0% zero commission.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 max-w-sm mx-auto">
              <Link 
                  to="/pricing" 
                  className="flex-1 bg-ink text-white py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-purple-600 hover:shadow-xl hover:shadow-purple-600/20 transition-all active:scale-95 text-center cursor-pointer"
              >
                  Upgrade to Pro+ Now
              </Link>
              <Link 
                  to="/dashboard" 
                  className="flex-1 bg-cream-3/40 border border-cream-3 text-ink py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cream-3/60 transition-all active:scale-95 text-center"
              >
                  Back to Overview
              </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-0 sm:px-8 py-4 sm:py-8 max-w-7xl mx-auto space-y-8 pb-24 font-sans">
      
      {/* Dynamic Header stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange/10 flex items-center justify-center text-orange shrink-0">
            <Link2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Short Links</p>
            <p className="text-2xl font-black text-zinc-900 mt-0.5">{links.length}</p>
          </div>
        </div>
        
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-600 shrink-0">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Combined Clicks</p>
            <p className="text-2xl font-black text-zinc-900 mt-0.5">{totalClicksAcrossLinks}</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-600 shrink-0">
            <Zap size={24} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Top Performing Alias</p>
            <p className="text-sm font-bold text-zinc-900 truncate mt-0.5">
              {topPerformingLink ? `/${topPerformingLink.shortCode} (${topPerformingLink.clicks} clicks)` : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Generator & Links Management List */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Create Short Link Form Card */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-orange" size={18} />
              <h2 className="text-sm font-black uppercase tracking-wider text-ink">Create New Shortened Link</h2>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block mb-1">Destination URL</label>
                <input 
                  type="text" 
                  value={originalUrl}
                  onChange={e => setOriginalUrl(e.target.value)}
                  placeholder="https://example.com/very-long-product-or-utm-url"
                  className="w-full px-4 py-3 border border-zinc-200 rounded-xl outline-none text-xs font-medium focus:border-ink transition-colors"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Custom Alias (Optional)</label>
                  {customAlias && (
                    <span className="text-[9px] font-extrabold text-orange uppercase tracking-widest">
                      lynksy.app/{customAlias.toLowerCase()}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input 
                    type="text" 
                    value={customAlias}
                    onChange={e => setCustomAlias(e.target.value.toLowerCase().trim())}
                    placeholder="e.g. course, discount, catalog"
                    className="w-full px-4 py-3 border border-zinc-200 rounded-xl outline-none text-xs font-medium focus:border-ink transition-colors pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {aliasChecking ? (
                      <RefreshCw size={14} className="animate-spin text-zinc-400" />
                    ) : (
                      <Link2 size={14} className="text-zinc-400" />
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={btnLoading}
                className="w-full bg-ink hover:bg-orange disabled:bg-zinc-400 text-white font-black text-xs uppercase tracking-widest h-12 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-zinc-950/5 active:scale-95"
              >
                {btnLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    <span>Adding Link...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Shorten Destination URL</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Manage Links Card */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-ink flex items-center gap-2">
                <span>Manage Short URLs</span>
                <span className="bg-zinc-100 text-zinc-600 text-[10px] font-black px-2 py-0.5 rounded-full inline-block">
                  {filteredLinks.length}
                </span>
              </h3>
              
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search short Code/URL..."
                  className="pl-9 pr-4 py-2 border border-zinc-200 rounded-xl outline-none text-xs font-medium focus:border-ink transition-colors w-full sm:w-52"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="animate-spin" />
                <span className="text-xs font-medium">Fetching secure link catalog...</span>
              </div>
            ) : filteredLinks.length === 0 ? (
              <div className="py-12 text-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-6">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">No short URLs found</p>
                <p className="text-[10px] text-zinc-400">Specify an original target URL in the top card as your blueprint.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                {filteredLinks.map((link) => {
                  const isSelected = selectedLinkId === link.id
                  
                  return (
                    <div 
                      key={link.id}
                      onClick={() => setSelectedLinkId(link.id)}
                      className={`border p-4 rounded-xl transition-all cursor-pointer relative group flex items-start justify-between gap-4 ${
                        isSelected 
                          ? 'border-orange bg-orange/5 shadow-sm' 
                          : 'border-zinc-150 hover:border-zinc-300 hover:bg-zinc-50/50 bg-white'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-ink tracking-tight font-outfit select-all break-all leading-tight">
                            /{link.shortCode}
                          </span>
                          
                          <span className={`h-1.5 w-1.5 rounded-full ${link.active ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                        </div>
                        
                        <p className="text-[11px] text-zinc-400 truncate break-all max-w-[280px] sm:max-w-[340px] font-outfit">
                          {link.originalUrl}
                        </p>

                        <div className="flex items-center gap-4 text-[10px] font-bold text-zinc-400 pt-1">
                          <span className="flex items-center gap-1">
                            <BarChart3 size={11} />
                            {link.clicks || 0} clicks
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar size={11} />
                            {formatTimestamp(link.createdAt).split(',')[0]}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                        {/* Copy Link */}
                        <button 
                          onClick={() => handleCopy(link.shortCode, link.id)}
                          className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-all active:scale-95 cursor-pointer"
                          title="Copy shortened URL"
                        >
                          {copiedId === link.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                        </button>

                        {/* Toggle Active status */}
                        <button 
                          onClick={() => handleToggleState(link.id, link.active)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
                            link.active 
                              ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' 
                              : 'bg-zinc-100 text-zinc-400 hover:bg-zinc-200'
                          }`}
                          title={link.active ? "Disable Shortened Link" : "Enable Shortened Link"}
                        >
                          <Power size={14} />
                        </button>

                        {/* Delete Link */}
                        <button 
                          onClick={(e) => handleDelete(link.id, e)}
                          className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500 hover:text-white flex items-center justify-center text-red-500 transition-all active:scale-95 cursor-pointer"
                          title="Delete Shortened Link"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deep analytics on selected Link */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 shadow-sm min-h-[460px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="text-purple-600" size={18} />
                  <h3 className="text-xs font-black uppercase tracking-wider text-ink">Link Analytics details</h3>
                </div>
                {selectedLink && (
                  <span className="text-[10px] font-black uppercase tracking-wider bg-orange/15 text-orange px-2.5 py-0.5 rounded-full select-all font-outfit">
                    /{selectedLink.shortCode}
                  </span>
                )}
              </div>

              {!selectedLink ? (
                <div className="py-24 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
                  <AlertCircle size={32} className="opacity-30" />
                  <span className="text-xs font-bold uppercase tracking-wider">No Link Selected</span>
                  <p className="text-[10px] text-zinc-400">Select any shortening node in your ledger to view live aggregate metrics.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Metric counters */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 text-center">
                      <p className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Session clicks</p>
                      <p className="text-xl font-black text-ink mt-0.5">{selectedLink.clicks || 0}</p>
                    </div>
                    <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 text-center">
                      <p className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Unique Visitors</p>
                      <p className="text-xl font-black text-ink mt-0.5">{selectedLink.uniqueVisitors || 0}</p>
                    </div>
                  </div>

                  {/* Destination Info */}
                  <div className="bg-zinc-50 border border-zinc-150/85 p-3.5 rounded-xl text-xs space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 uppercase tracking-widest font-black">
                      <span>Destination</span>
                      <a href={selectedLink.originalUrl} target="_blank" rel="noreferrer" className="flex items-center gap-0.5 text-orange hover:underline normal-case">
                        Visit <ExternalLink size={10} />
                      </a>
                    </div>
                    <p className="font-outfit text-zinc-600 leading-normal break-all font-medium select-all">
                      {selectedLink.originalUrl}
                    </p>
                  </div>

                  {/* Dynamic Indicators: Referral sources */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-ink border-b border-zinc-100 pb-1 flex items-center justify-between">
                      <span>Top Referrers</span>
                      <span className="text-zinc-400">Count</span>
                    </h4>
                    {selectedLinkAnalytics?.referrers.length === 0 ? (
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide text-center py-2 h-8">No referrals recorded yet</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedLinkAnalytics?.referrers.slice(0, 4).map(item => {
                          const percent = Math.round((item.count / (selectedLink.clicks || 1)) * 100)
                          return (
                            <div key={item.name} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-zinc-600">
                                <span className="truncate">{item.name}</span>
                                <span>{item.count} ({percent}%)</span>
                              </div>
                              <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-orange h-full rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Dynamic Indicators: Countries & Locations */}
                  <div className="space-y-3.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-ink border-b border-zinc-100 pb-1 flex items-center justify-between">
                      <span>Top Locations</span>
                      <span className="text-zinc-400">Clicks</span>
                    </h4>
                    {selectedLinkAnalytics?.countries.length === 0 ? (
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide text-center py-2 h-8">No country info cached</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedLinkAnalytics?.countries.slice(0, 4).map(item => {
                          const percent = Math.round((item.count / (selectedLink.clicks || 1)) * 100)
                          return (
                            <div key={item.name} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-zinc-600">
                                <span className="flex items-center gap-1">
                                  <Globe size={11} className="text-zinc-400" />
                                  {item.name}
                                </span>
                                <span>{item.count}</span>
                              </div>
                              <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-purple-600 h-full rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Tech stack: Devices & Browsers Split */}
                  <div className="grid grid-cols-2 gap-6 pt-2 border-t border-zinc-100">
                    <div className="space-y-2.5">
                      <p className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Device Profile</p>
                      {selectedLinkAnalytics?.devices.length === 0 ? (
                        <p className="text-[10px] text-zinc-400">N/A</p>
                      ) : (
                        <div className="space-y-1.5">
                          {selectedLinkAnalytics?.devices.map(item => (
                            <div key={item.name} className="flex items-center justify-between text-[11px] font-bold text-zinc-600">
                              <span className="flex items-center gap-1 capitalize">
                                {item.name === 'mobile' ? <Smartphone size={10} /> : item.name === 'tablet' ? <Tablet size={10} /> : <Laptop size={10} />}
                                {item.name}
                              </span>
                              <span className="text-zinc-400">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <p className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">Browser Profile</p>
                      {selectedLinkAnalytics?.browsers.length === 0 ? (
                        <p className="text-[10px] text-zinc-400">N/A</p>
                      ) : (
                        <div className="space-y-1.5">
                          {selectedLinkAnalytics?.browsers.map(item => (
                            <div key={item.name} className="flex items-center justify-between text-[11px] font-bold text-zinc-600">
                              <span className="truncate">{item.name}</span>
                              <span className="text-zinc-400">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {selectedLink && (
              <div className="border-t border-zinc-100 pt-4 mt-6 text-[10px] font-bold text-zinc-400 flex flex-col sm:flex-row justify-between gap-2">
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> First click: {formatTimestamp(selectedLink.firstClick)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> Last click: {formatTimestamp(selectedLink.lastClick)}
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}
