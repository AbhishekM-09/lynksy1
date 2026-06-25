import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'
import { usePlan } from '@/hooks/usePlan'
import { getEmailSubscribers, deleteEmailSubscriber, updateUser } from '@/firebase/firestore'
import { EmailSubscriber } from '@/types'
import { 
  Mail, Settings, Sparkles, Plus, Loader2, Copy, Trash2, Search,
  Download, BarChart3, TrendingUp, Calendar, AlertCircle, CheckCircle,
  ChevronLeft, ChevronRight, Lock, Eye, FileSpreadsheet
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { motion, AnimatePresence } from 'motion/react'
import { getFallbackAvatarGradient, getFallbackAvatarInitials } from '@/utils/formatters'

export default function EmailCollectionPage() {
  const { user, updateUserField } = useAuthStore()
  const { isFree, isPro, isProPlus, gate } = usePlan()

  // Tab state: 'setup' | 'welcome' | 'subscribers'
  const [activeTab, setActiveTab] = useState<'setup' | 'welcome' | 'subscribers'>('setup')

  // Settings State
  const [isSaving, setIsSaving] = useState(false)
  const [emailFormActive, setEmailFormActive] = useState(user?.emailFormActive ?? false)
  const [emailFormTitle, setEmailFormTitle] = useState(user?.emailFormTitle ?? 'Join My Newsletter')
  const [emailFormDesc, setEmailFormDesc] = useState(user?.emailFormDesc ?? 'Get weekly updates, tech tips, and exclusive resources.')
  const [emailFormBtn, setEmailFormBtn] = useState(user?.emailFormBtn ?? 'Subscribe')

  // Welcome Email State (PRO+ Only)
  const [welcomeEmailActive, setWelcomeEmailActive] = useState(user?.welcomeEmailActive ?? false)
  const [welcomeEmailSubject, setWelcomeEmailSubject] = useState(user?.welcomeEmailSubject ?? 'Welcome to my newsletter! 👋')
  const [welcomeEmailBody, setWelcomeEmailBody] = useState(user?.welcomeEmailBody ?? 'Hi there!\n\nThank you so much for joining my email list. I am super excited to share my journey, updates, and templates with you.\n\nStay tuned!\nBest regards')

  // Subscribers State
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([])
  const [isLoadingSubs, setIsLoadingSubs] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Analytics options
  const [chartDays, setChartDays] = useState<7 | 30 | 90>(7)

  // Load Subscribers
  const fetchSubs = useCallback(async () => {
    if (!user?.uid || isFree) return
    setIsLoadingSubs(true)
    try {
      const data = await getEmailSubscribers(user.uid)
      setSubscribers(data)
    } catch (e) {
      console.error(e)
      toast.error('Failed to load subscribers')
    } finally {
      setIsLoadingSubs(false)
    }
  }, [user?.uid, isFree])

  useEffect(() => {
    fetchSubs()
  }, [fetchSubs])

  // Save Settings Handlers
  const handleSaveSetup = async () => {
    if (!user?.uid) return
    setIsSaving(true)
    try {
      await updateUser(user.uid, {
        emailFormActive,
        emailFormTitle: emailFormTitle.trim(),
        emailFormDesc: emailFormDesc.trim(),
        emailFormBtn: emailFormBtn.trim()
      })
      updateUserField({
        emailFormActive,
        emailFormTitle: emailFormTitle.trim(),
        emailFormDesc: emailFormDesc.trim(),
        emailFormBtn: emailFormBtn.trim()
      })
      toast.success('Subscription settings saved successfully!')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveWelcomeEmail = async () => {
    if (!user?.uid) return
    if (!isProPlus) {
      gate('canCustomDomain', () => {}) // triggers upgrade to Pro+
      return
    }
    setIsSaving(true)
    try {
      await updateUser(user.uid, {
        welcomeEmailActive,
        welcomeEmailSubject: welcomeEmailSubject.trim(),
        welcomeEmailBody: welcomeEmailBody.trim()
      })
      updateUserField({
        welcomeEmailActive,
        welcomeEmailSubject: welcomeEmailSubject.trim(),
        welcomeEmailBody: welcomeEmailBody.trim()
      })
      toast.success('Welcome Email settings updated!')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save welcome email template')
    } finally {
      setIsSaving(false)
    }
  }

  // Automatic Toggle Handlers (Highlight & Save instantly)
  const handleToggleActive = async () => {
    if (!user?.uid) return
    const newValue = !emailFormActive
    setEmailFormActive(newValue)
    try {
      await updateUser(user.uid, {
        emailFormActive: newValue,
        emailFormTitle: emailFormTitle.trim(),
        emailFormDesc: emailFormDesc.trim(),
        emailFormBtn: emailFormBtn.trim()
      })
      updateUserField({
        emailFormActive: newValue,
        emailFormTitle: emailFormTitle.trim(),
        emailFormDesc: emailFormDesc.trim(),
        emailFormBtn: emailFormBtn.trim()
      })
      toast.success(newValue ? 'Subscription form is now LIVE and displayed on your public profile!' : 'Subscription form deactivated from public profile.')
    } catch (e) {
      console.error(e)
      setEmailFormActive(!newValue) // Rollback on error
      toast.error('Failed to change subscription status')
    }
  }

  const handleToggleWelcomeActive = async () => {
    if (!user?.uid) return
    if (!isProPlus) {
      gate('canCustomDomain', () => {}) // triggers upgrade to Pro+
      return
    }
    const newValue = !welcomeEmailActive
    setWelcomeEmailActive(newValue)
    try {
      await updateUser(user.uid, {
        welcomeEmailActive: newValue,
        welcomeEmailSubject: welcomeEmailSubject.trim(),
        welcomeEmailBody: welcomeEmailBody.trim()
      })
      updateUserField({
        welcomeEmailActive: newValue,
        welcomeEmailSubject: welcomeEmailSubject.trim(),
        welcomeEmailBody: welcomeEmailBody.trim()
      })
      toast.success(newValue ? 'Welcome email campaign enabled!' : 'Welcome email campaign suspended.')
    } catch (e) {
      console.error(e)
      setWelcomeEmailActive(!newValue) // Rollback on error
      toast.error('Failed to change campaign status')
    }
  }

  // Delete subscriber
  const handleDeleteSub = async (id: string) => {
    try {
      await deleteEmailSubscriber(id)
      setSubscribers(prev => prev.filter(item => item.id !== id))
      toast.success('Subscriber removed successfully')
      setConfirmDeleteId(null)
    } catch (e) {
      console.error(e)
      toast.error('Failed to delete subscriber')
    }
  }

  // Exports
  const handleExportCSV = () => {
    if (!isPro) {
      toast.error('Export functionalities are a PRO / PRO+ premium feature', {
        icon: '👑',
        duration: 4000
      })
      return
    }
    if (subscribers.length === 0) {
      toast.error('No subscribers to export.')
      return
    }

    const headers = ['Email Address', 'Date Joined', 'Source']
    const rows = subscribers.map(s => [
      s.email,
      s.subscribedAt ? s.subscribedAt.toDate().toLocaleString() : '',
      s.source || 'public_profile'
    ])

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `subscribers_${user?.username || 'creator'}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('CSV downloaded successfully!')
  }

  const handleExportExcel = () => {
    if (!isPro) {
      toast.error('Export functionalities are a PRO / PRO+ premium feature', {
        icon: '👑',
        duration: 4000
      })
      return
    }
    if (subscribers.length === 0) {
      toast.error('No subscribers to export.')
      return
    }

    try {
      const worksheet = XLSX.utils.json_to_sheet(
        subscribers.map((s, idx) => ({
          'S.No': idx + 1,
          'Email Address': s.email,
          'Date Joined': s.subscribedAt ? s.subscribedAt.toDate().toLocaleString() : 'N/A',
          'Source': s.source || 'Public Profile'
        }))
      )
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Subscribers')
      XLSX.writeFile(workbook, `subscribers_${user?.username || 'creator'}_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast.success('Excel workbook downloaded successfully!')
    } catch {
      toast.error('Excel generation failed.')
    }
  }

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    toast.success('Email copied to clipboard')
  }

  // Filter & Pagination Calculations
  const filteredSubscribers = subscribers.filter(sub => 
    sub.email.toLowerCase().includes(searchQuery.toLowerCase().trim())
  )

  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage)
  const paginatedSubscribers = filteredSubscribers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Metrics Logic
  const totalCount = subscribers.length
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const subsToday = subscribers.filter(s => s.subscribedAt?.toDate() >= oneDayAgo).length
  const subsThisMonth = subscribers.filter(s => s.subscribedAt?.toDate() >= thirtyDaysAgo).length
  
  // Calculate Growth Rate % (Month over Month relative progress)
  const previousMonthCount = totalCount - subsThisMonth
  const growthRatePercent = previousMonthCount > 0 
    ? Math.round((subsThisMonth / previousMonthCount) * 100)
    : totalCount > 0 ? 100 : 0

  // Chart aggregation logic (for Pro+)
  const chartData = []
  const groupData: Record<string, number> = {}
  subscribers.forEach(sub => {
    if (sub.subscribedAt) {
      const dateStr = sub.subscribedAt.toDate().toISOString().split('T')[0]
      groupData[dateStr] = (groupData[dateStr] || 0) + 1
    }
  })

  for (let i = chartDays - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    chartData.push({
      dateStr: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      'New Subscribers': groupData[key] || 0
    })
  }

  // LOCKED STATE FOR FREE USERS
  if (isFree) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="bg-gradient-to-b from-[#18181B] to-[#0D0D0F] border border-white/5 rounded-[2.5rem] p-8 md:p-14 text-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange via-purple-500 to-orange" />
          
          {/* Ambient Glow */}
          <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-orange/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Locked Icon Wrapper */}
          <div className="w-20 h-20 bg-orange/10 border border-orange/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner relative animate-pulse">
            <Mail size={36} className="text-orange" />
            <div className="absolute bottom-1 right-1 bg-ink border border-white/10 w-6 h-6 rounded-lg flex items-center justify-center shadow-lg">
              <Lock size={12} className="text-orange" />
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white font-syne tracking-tight mb-4">
            Email Collection <span className="text-orange">&</span> Lead Generation
          </h2>
          <p className="text-sm md:text-base text-white/50 max-w-lg mx-auto mb-10 leading-relaxed font-sans">
            Build, nurture, and grow your audience. Collect subscriber emails directly from your public Lynksy page and manage them from a clean dashboard.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left mb-10">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-all">
              <div className="text-orange bg-orange/10 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                <Plus size={16} />
              </div>
              <p className="text-xs font-bold text-white mb-1">Interactive Page forms</p>
              <p className="text-[10px] text-white/40 leading-relaxed">Let profile visitors join your newsletter in one quick tap.</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-all">
              <div className="text-[#6B3FA0] bg-[#6B3FA0]/10 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                <BarChart3 size={16} />
              </div>
              <p className="text-xs font-bold text-white mb-1">Subscriber dashboard</p>
              <p className="text-[10px] text-white/40 leading-relaxed">Search, paginated arrays, analytics reports and welcome series.</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-all">
              <div className="text-emerald-500 bg-emerald-500/10 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
                <Download size={16} />
              </div>
              <p className="text-xs font-bold text-white mb-1">Export Anywhere</p>
              <p className="text-[10px] text-white/40 leading-relaxed">Download your lead list directly as clean CSV or Excel files.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => gate('canCollectEmails', () => {})}
              className="w-full sm:w-auto px-8 py-3.5 bg-orange hover:bg-orange/90 text-white rounded-2xl font-bold font-syne text-sm transition-all shadow-lg hover:shadow-orange/20 active:scale-95"
            >
              Unlock with Pro
            </button>
            <p className="text-xs text-white/30">Requires Pro subscription</p>
          </div>
        </div>
      </div>
    )
  }

  // ACTIVE INTERFACE (PRO / PRO+)
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-zinc-200/80 p-5 md:p-6 rounded-[2rem] shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-zinc-900 font-syne tracking-tight">
              Email Collection <span className="text-orange">&</span> Leads
            </h1>
            <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${isProPlus ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-orange/10 text-orange border border-orange-200/35'}`}>
              {isProPlus ? 'Pro+' : 'Pro'}
            </span>
          </div>
          <p className="text-xs text-zinc-550 font-sans max-w-xl">
            Allow your visitors to subscribe directly to your newsletter. Set custom forms, automate welcome communications, and watch your brand database grow.
          </p>
        </div>

        {/* Rapid Status Stats */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-zinc-50 border border-zinc-200/60 px-4 py-2 rounded-2xl text-center min-w-[80px]">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Leads</p>
            <p className="text-lg font-black text-zinc-905 font-syne">{totalCount}</p>
          </div>
          <div className="bg-zinc-50 border border-zinc-200/60 px-4 py-2 rounded-2xl text-center min-w-[80px]">
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Today</p>
            <p className="text-lg font-black text-orange font-syne">+{subsToday}</p>
          </div>
        </div>
      </div>

      {/* Navigation Layout Tabs */}
      <div className="grid grid-cols-3 md:flex md:w-max w-full bg-zinc-50/70 md:bg-white p-1 md:p-1.5 rounded-2xl md:rounded-2.5xl gap-1 md:gap-2 shadow-sm border border-zinc-200/80">
        <button
          onClick={() => setActiveTab('setup')}
          className={`px-1.5 py-2.5 md:px-5 md:py-3 rounded-xl md:rounded-2xl text-[9px] sm:text-[10px] md:text-[11px] font-black tracking-wider uppercase font-syne transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer ${
            activeTab === 'setup' 
              ? 'bg-orange text-white shadow-lg shadow-orange/15' 
              : 'text-zinc-750 hover:bg-zinc-100/80'
          }`}
        >
          <Settings size={14} className="shrink-0" />
          <span className="hidden sm:inline">Form Configuration</span>
          <span className="sm:hidden">Form</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('subscribers')
            fetchSubs()
          }}
          className={`px-1.5 py-2.5 md:px-5 md:py-3 rounded-xl md:rounded-2xl text-[9px] sm:text-[10px] md:text-[11px] font-black tracking-wider uppercase font-syne transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 cursor-pointer relative overflow-hidden ${
            activeTab === 'subscribers' 
              ? 'bg-orange text-white shadow-lg shadow-orange/15' 
              : 'text-zinc-750 hover:bg-zinc-100/80 border border-dashed border-orange-400/40'
          }`}
        >
          <Mail size={14} className={activeTab === 'subscribers' ? 'shrink-0' : 'text-orange animate-pulse shrink-0'} />
          <span className="hidden sm:inline">Subscribers & Leads ({totalCount})</span>
          <span className="sm:hidden">Leads ({totalCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('welcome')}
          className={`px-1.5 py-2.5 md:px-5 md:py-3 rounded-xl md:rounded-2xl text-[9px] sm:text-[10px] md:text-[11px] font-black tracking-wider uppercase font-syne transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 relative cursor-pointer ${
            activeTab === 'welcome' 
              ? 'bg-orange text-white shadow-lg shadow-orange/15' 
              : 'text-zinc-750 hover:bg-zinc-100/80'
          }`}
        >
          <Sparkles size={14} className="shrink-0" />
          <span className="hidden sm:inline">Welcome Automation</span>
          <span className="sm:hidden">Welcome</span>
          {!isProPlus && (
            <span className={activeTab === 'welcome' ? 'bg-purple-100 text-purple-700 text-[8px] font-black p-0.5 px-2 rounded-full uppercase scale-75 sm:scale-90 border border-purple-200' : 'bg-purple-100 text-purple-600 text-[8px] font-black p-0.5 px-2 rounded-full uppercase scale-75 sm:scale-90 border border-purple-200'}>PRO+</span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* SETUP CONTAINER */}
        {activeTab === 'setup' && (
          <>
            {/* Quick Helper Banner */}
            <div className="lg:col-span-12 bg-white border border-orange-500/20 p-5 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4 w-full mb-2 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange/10 flex items-center justify-center text-orange shrink-0">
                  <Mail size={18} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-black">Looking for your Audience & Subscriber Leads?</h4>
                  <p className="text-[10px] text-black/60 leading-relaxed">Search, analyze, and download your captured email records as clean CSV or Excel files in one click!</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('subscribers')
                  fetchSubs()
                }}
                className="w-full md:w-auto px-4 py-2 bg-gradient-to-r from-orange to-orange-600 hover:from-orange/90 hover:to-orange/80 text-white font-syne text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-lg shadow-orange/10 transition-all duration-300"
              >
                Go to Subscribers & Leads →
              </button>
            </div>

            <div className="lg:col-span-7 bg-white border border-zinc-200/80 p-5 md:p-6 rounded-[2rem] space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange/10 flex items-center justify-center text-orange">
                    <Settings size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider font-syne">Form Settings</h3>
                </div>

                {/* Status Toggle */}
                <div id="form-live-toggle" className="flex flex-wrap items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl p-2 px-3.5 shadow-xs">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Form Status:
                  </span>
                  
                  {/* The Black Custom Toggle Button */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider transition-colors duration-200 ${
                      emailFormActive ? "text-zinc-400" : "text-zinc-950 font-black"
                    }`}>
                      OFF
                    </span>
                    
                    <button
                      type="button"
                      onClick={handleToggleActive}
                      aria-label="Toggle Form Live Status"
                      className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 relative cursor-pointer outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-900 ${
                        emailFormActive ? "bg-zinc-900" : "bg-zinc-200"
                      }`}
                    >
                      {/* Inner shifting circle/knob */}
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${
                          emailFormActive ? "translate-x-7" : "translate-x-0"
                        }`}
                      />
                    </button>
                    
                    <span className={`text-[10px] font-black uppercase tracking-wider transition-colors duration-200 ${
                      emailFormActive ? "text-emerald-650 font-black" : "text-zinc-400"
                    }`}>
                      LIVE
                    </span>
                  </div>

                  {/* Visual helper badge */}
                  <div className="hidden sm:block h-4 w-[1px] bg-zinc-300 mx-1" />
                  
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                    emailFormActive 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" 
                      : "bg-zinc-100 text-zinc-500 border border-zinc-200/40"
                  }`}>
                    <span className="relative flex h-1.5 w-1.5">
                      {emailFormActive && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${emailFormActive ? "bg-emerald-500" : "bg-zinc-400"}`} />
                    </span>
                    <span>{emailFormActive ? "Live on Profile" : "Hidden"}</span>
                  </span>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="space-y-4 font-sans">
                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1.5 uppercase tracking-wide">Subscription Title</label>
                  <input
                    type="text"
                    value={emailFormTitle}
                    onChange={(e) => setEmailFormTitle(e.target.value)}
                    maxLength={100}
                    placeholder="e.g. Join My Newsletter"
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-orange focus:ring-1 focus:ring-orange/20 transition-all font-sans"
                  />
                  <span className="text-[9px] text-zinc-400 block mt-1 text-right">{emailFormTitle.length}/100</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1.5 uppercase tracking-wide">Subscription Description</label>
                  <textarea
                    value={emailFormDesc}
                    onChange={(e) => setEmailFormDesc(e.target.value)}
                    maxLength={300}
                    rows={3}
                    placeholder="e.g. Sign up to stay up to date with my latest projects, resource packs and blog updates."
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-orange focus:ring-1 focus:ring-orange/20 transition-all font-sans resize-none"
                  />
                  <span className="text-[9px] text-zinc-400 block mt-1 text-right">{emailFormDesc.length}/300</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-600 mb-1.5 uppercase tracking-wide">Button Text</label>
                  <input
                    type="text"
                    value={emailFormBtn}
                    onChange={(e) => setEmailFormBtn(e.target.value)}
                    maxLength={24}
                    placeholder="e.g. Subscribe"
                    className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-orange focus:ring-1 focus:ring-orange/20 transition-all font-sans"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveSetup}
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-orange hover:bg-orange/90 text-white rounded-xl font-bold font-syne text-xs transition-all active:scale-95 flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={12} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* REAL-TIME PREVIEW */}
            <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-[2rem] p-5 md:p-6 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-4">
                <Eye size={14} className="text-zinc-400" />
                <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider font-syne">Real-Time Mock Preview</h3>
              </div>

              <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200/80 relative min-h-[350px] flex flex-col justify-between overflow-hidden shadow-inner">
                <span className="absolute top-2 right-2 bg-zinc-200 text-zinc-500 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">PROFILE MATCH</span>
                
                {/* Simulated Public Profile Core */}
                <div className="space-y-6 pt-4 flex-1 flex flex-col justify-center">
                  
                  {/* Simulated Profile Identity Panel */}
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div 
                      className="w-12 h-12 rounded-full border border-orange/40 flex items-center justify-center text-white font-bold font-syne shadow-[0_4px_20px_rgba(255,107,0,0.15)] overflow-hidden"
                      style={!user?.avatarUrl ? { background: getFallbackAvatarGradient(user?.displayName || user?.username || 'U') } : {}}
                    >
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        getFallbackAvatarInitials(user?.displayName || user?.username || 'U')
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-zinc-900">@{user?.username || 'username'}</p>
                      <p className="text-[10px] text-zinc-500">{user?.bio || 'Creator on Lynksy'}</p>
                    </div>
                  </div>

                  {/* FORM RENDER (Only visible if active toggled) */}
                  <div className="relative">
                    <AnimatePresence mode="wait">
                      {emailFormActive ? (
                        <motion.div
                          key="preview-form-active"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-4 space-y-3.5 relative"
                        >
                          <div className="space-y-1 text-center">
                            <h4 className="text-xs font-black text-zinc-900 font-syne">{emailFormTitle || 'Join My Newsletter'}</h4>
                            <p className="text-[10px] text-zinc-500 leading-relaxed max-w-[240px] mx-auto">{emailFormDesc || 'Get updates...'}</p>
                          </div>

                          <div className="space-y-2 font-sans">
                            <input
                              type="email"
                              disabled
                              placeholder="you@gmail.com"
                              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-[10px] text-zinc-400 focus:outline-none pointer-events-none"
                            />
                            <button
                              type="button"
                              className="w-full rounded-xl bg-orange text-white text-[10px] font-bold font-syne py-2 hover:opacity-90 cursor-default active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                            >
                              <Mail size={10} />
                              <span>{emailFormBtn || 'Subscribe'}</span>
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="preview-form-inactive"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="p-8 border border-dashed border-zinc-200 rounded-2xl text-center space-y-2 bg-white"
                        >
                          <Mail size={20} className="text-zinc-300 mx-auto" />
                          <p className="text-[10px] font-bold text-zinc-400">Email subscribe form is deactivated.</p>
                          <p className="text-[9px] text-zinc-300">Enable "Form Live" setting block to render on your profile.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <span className="text-[8px] text-zinc-400">Powered by Lynksy.app</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* WELCOME EMAIL TAB */}
        {activeTab === 'welcome' && (
          <div className="lg:col-span-12 max-w-4xl mx-auto w-full">
            <AnimatePresence mode="wait">
              {!isProPlus ? (
                // Locked state for normal PRO users (MoM upgrade trigger!)
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-purple-50/80 via-white to-purple-50/50 border border-purple-200 rounded-[2rem] p-6 md:p-12 text-center relative overflow-hidden shadow-sm"
                >
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-purple-500 via-pink-550 to-purple-500" />
                  
                  <div className="w-16 h-16 bg-purple-50 border border-purple-100 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="text-purple-600" size={28} />
                  </div>

                  <h3 className="text-lg md:text-xl font-black text-zinc-900 font-syne tracking-tight mb-2">
                    Welcome Email Automation
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-md mx-auto mb-8 font-sans leading-relaxed">
                    Create automated onboarding loops. Configure custom subjects and greeting copies to automatically message every lead the instant they join your list.
                  </p>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 text-left max-w-md mx-auto space-y-3 mb-8">
                    <p className="text-xs font-bold text-zinc-800 font-syne uppercase tracking-wider">Plan Perks Added:</p>
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <span className="text-purple-600 font-bold shrink-0">✓</span>
                      <span>Instant system notification integrations</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <span className="text-purple-600 font-bold shrink-0">✓</span>
                      <span>Increase click conversion by 4.2x with auto onboarding</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-600">
                      <span className="text-purple-600 font-bold shrink-0">✓</span>
                      <span>Zero setup manual intervention required</span>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={() => gate('canCustomDomain', () => {})}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white rounded-xl font-bold font-syne text-xs transition-all tracking-wider shadow-md hover:shadow-purple-500/20 active:scale-95"
                    >
                      Upgrade to PRO+ to Unlock
                    </button>
                  </div>
                </motion.div>
              ) : (
                // PRO+ welcome email management screen
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-zinc-200 rounded-[2rem] p-5 md:p-6 space-y-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                        <Sparkles size={16} />
                      </div>
                      <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider font-syne">Welcome Email Automation</h3>
                    </div>

                    {/* Status Toggle */}
                    <div id="welcome-live-toggle" className="flex flex-wrap items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl p-2 px-3.5 shadow-xs">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Campaign:
                      </span>
                      
                      {/* The Black Custom Toggle Button */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider transition-colors duration-200 ${
                          welcomeEmailActive ? "text-zinc-400" : "text-purple-950 font-black"
                        }`}>
                          PAUSED
                        </span>
                        
                        <button
                          type="button"
                          onClick={handleToggleWelcomeActive}
                          aria-label="Toggle Welcome Email campaign"
                          className={`w-14 h-7 flex items-center rounded-full p-1 transition-colors duration-300 relative cursor-pointer outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 ${
                            welcomeEmailActive ? "bg-zinc-900" : "bg-zinc-200"
                          }`}
                        >
                          {/* Inner shifting circle/knob */}
                          <div
                            className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${
                              welcomeEmailActive ? "translate-x-7" : "translate-x-0"
                            }`}
                          />
                        </button>
                        
                        <span className={`text-[10px] font-black uppercase tracking-wider transition-colors duration-200 ${
                          welcomeEmailActive ? "text-purple-600 font-black" : "text-zinc-400"
                        }`}>
                          ACTIVE
                        </span>
                      </div>

                      {/* Visual helper badge */}
                      <div className="hidden sm:block h-4 w-[1px] bg-zinc-300 mx-1" />
                      
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                        welcomeEmailActive 
                          ? "bg-purple-50 text-purple-700 border border-purple-200/50" 
                          : "bg-zinc-100 text-zinc-500 border border-zinc-200/40"
                      }`}>
                        <span className="relative flex h-1.5 w-1.5">
                          {welcomeEmailActive && (
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                          )}
                          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${welcomeEmailActive ? "bg-purple-500" : "bg-zinc-400"}`} />
                        </span>
                        <span>{welcomeEmailActive ? "Active" : "Paused"}</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-550 leading-relaxed font-sans max-w-2xl border-b border-zinc-100 pb-4">
                    When active, Lynksy will automatically dispatch a beautiful branded welcome email to each subscriber. The email delivers from our cloud server system carrying your chosen template configurations dynamically.
                  </p>

                  <div className="space-y-4 font-sans max-w-2xl">
                    <div>
                      <label className="block text-xs font-bold text-zinc-650 mb-1.5 uppercase tracking-wide">Email Subject Title</label>
                      <input
                        type="text"
                        value={welcomeEmailSubject}
                        onChange={(e) => setWelcomeEmailSubject(e.target.value)}
                        placeholder="Welcome to my circle! 👋"
                        className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-950 focus:outline-none focus:bg-white focus:border-purple-400 transition-all font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-zinc-650 mb-1.5 uppercase tracking-wide">Onboarding Message Content</label>
                      <textarea
                        value={welcomeEmailBody}
                        onChange={(e) => setWelcomeEmailBody(e.target.value)}
                        rows={8}
                        placeholder="Hi there! Thank you so much for joining my leads list..."
                        className="w-full bg-zinc-50/50 border border-zinc-200 rounded-xl px-4 py-3 text-xs text-zinc-950 focus:outline-none focus:bg-white focus:border-purple-400 transition-all font-sans resize-y font-mono leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveWelcomeEmail}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold font-syne text-xs transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-purple-500/10"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle size={12} />
                          <span>Sync Campaign</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* SUBSCRIBERS & ANALYTICS LISTS */}
        {activeTab === 'subscribers' && (
          <div className="lg:col-span-12 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Active Leads</span>
                  <Mail className="text-zinc-450" size={14} />
                </div>
                <p className="text-2xl font-black text-zinc-900 font-syne tracking-tight">
                  {isLoadingSubs ? '...' : totalCount}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-[#1A7A50] font-sans font-bold mt-1">
                  <TrendingUp size={10} />
                  <span>+{subsThisMonth} added this month</span>
                </div>
              </div>

              <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Joined Past 24 Hours</span>
                  <Calendar className="text-zinc-450" size={14} />
                </div>
                <p className="text-2xl font-black text-orange font-syne tracking-tight">
                  {isLoadingSubs ? '...' : `+${subsToday}`}
                </p>
                <p className="text-[9px] text-zinc-400 font-sans mt-1">Direct from profile form</p>
              </div>

              <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Growth Rate (30D)</span>
                  <TrendingUp className="text-zinc-450" size={14} />
                </div>
                <p className="text-2xl font-black text-zinc-900 font-syne tracking-tight">
                  {isLoadingSubs ? '...' : `+${growthRatePercent}%`}
                </p>
                <p className="text-[9px] text-zinc-400 font-sans mt-1">Compared with previous month</p>
              </div>

              <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Premium Reports</span>
                  <Sparkles className="text-purple-600" size={14} />
                </div>
                <div className="pt-1">
                  {isProPlus ? (
                    <span className="bg-purple-100 text-purple-700 border border-purple-200 text-[9px] font-black uppercase px-2 py-0.5 rounded-md">PRO+ Activated</span>
                  ) : (
                    <button
                      onClick={() => gate('canCustomDomain', () => {})}
                      className="bg-orange/10 text-orange border border-orange-250/20 text-[9px] hover:bg-orange/20 font-black uppercase px-2 py-1 rounded-md transition-all active:scale-95 cursor-pointer"
                    >
                      Unlock Pro+ Charts
                    </button>
                  )}
                </div>
                <p className="text-[9px] text-zinc-400 font-sans mt-2">Exports and interactive timelines</p>
              </div>
            </div>

            {/* Interactive Signups Trend Map (PRO+ Exclusive) */}
            <AnimatePresence mode="wait">
              {isProPlus ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-zinc-200 shadow-sm p-5 md:p-6 rounded-[2rem] space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-zinc-900 font-syne uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp size={14} className="text-purple-600" />
                        <span>Growth Chart Timeline</span>
                      </h4>
                      <p className="text-[10px] text-zinc-500">Visualizing raw daily lead capture counts</p>
                    </div>

                    {/* Timeline range sliders */}
                    <div className="flex items-center gap-1.5 bg-zinc-100 border border-zinc-200/80 p-1 rounded-xl self-start">
                      {[7, 30, 90].map((daysCount) => (
                        <button
                          key={daysCount}
                          onClick={() => setChartDays(daysCount as 7 | 30 | 90)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider font-syne transition-all ${chartDays === daysCount ? 'bg-white text-purple-700 shadow-sm border border-purple-200/30' : 'text-zinc-500 hover:text-zinc-800'}`}
                        >
                          {daysCount} Days
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recharts chart area */}
                  <div className="h-[220px] w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="purpleGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#A855F7" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis 
                          dataKey="dateStr" 
                          stroke="#bbb" 
                          tickLine={false}
                          style={{ fontSize: 9, fontFamily: 'monospace' }} 
                        />
                        <YAxis 
                          stroke="#bbb" 
                          tickLine={false} 
                          allowDecimals={false}
                          style={{ fontSize: 9, fontFamily: 'monospace' }} 
                        />
                        <Tooltip
                          contentStyle={{ background: '#ffffff', border: '1px solid #e4e4e7', borderRadius: '12px' }}
                          labelStyle={{ color: '#71717a', fontSize: '10px', fontWeight: 'bold' }}
                          itemStyle={{ color: '#1a1a1a', fontSize: '11px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="New Subscribers" 
                          stroke="#A855F7" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#purpleGlow)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              ) : (
                // Blurred premium banner for standard Pro
                <div className="bg-white border border-zinc-200 shadow-sm p-8 rounded-[2rem] text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-purple-500/30" />
                  
                  {/* Blurry simulated charts content */}
                  <div className="opacity-10 pointer-events-none filter blur-[4px] py-4 select-none">
                    <div className="h-28 w-4/5 mx-auto border-b border-zinc-300 bg-gradient-to-t from-orange/5 to-transparent rounded-t-lg" />
                    <div className="flex gap-4 justify-around mt-2 max-w-sm mx-auto">
                      <div className="w-10 h-3 bg-zinc-300" />
                      <div className="w-10 h-3 bg-zinc-300" />
                      <div className="w-10 h-3 bg-zinc-300" />
                    </div>
                  </div>

                  {/* Absolute overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white/85 backdrop-blur-[1.5px]">
                    <div className="bg-purple-50 border border-purple-200 w-10 h-10 rounded-xl flex items-center justify-center text-purple-600 mb-3">
                      <Lock size={16} />
                    </div>
                    <h4 className="text-xs font-black text-zinc-900 font-syne uppercase tracking-wider mb-1">
                      Interactive Growth Charts are locked
                    </h4>
                    <p className="text-[10px] text-zinc-500 max-w-xs mb-4 leading-relaxed font-sans">
                      Upgrade from standard Pro to **PRO+** to access granular signups charts, download CSV logs, and automated onboarding integrations.
                    </p>
                    <button
                      onClick={() => gate('canCustomDomain', () => {})}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[10px] font-black font-syne uppercase tracking-wide transition-all active:scale-95 shadow-md cursor-pointer"
                    >
                      Go Pro+
                    </button>
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* SUBSCRIBERS LIST SECTION */}
            <div className="bg-white border border-zinc-200 shadow-sm rounded-[2rem] overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-black text-zinc-900 uppercase tracking-wider font-syne">Audiences & Leads Table</h3>
                  <p className="text-[10px] text-zinc-500">Manage your newsletter signups database</p>
                </div>

                {/* Search & Export options */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
                  <div className="relative font-sans w-full sm:min-w-[240px]">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" size={12} />
                    <input
                      type="text"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-4 py-2.5 text-[11px] text-zinc-900 focus:outline-none focus:bg-white focus:border-orange transition-all font-sans"
                      placeholder="Search email target..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                    />
                  </div>

                  {/* Excel Export Buttons (Pro vs Free gated) */}
                  <div className="flex items-center justify-between sm:justify-start gap-1.5 bg-zinc-50 border border-zinc-200 p-1 rounded-xl w-full sm:w-auto shrink-0">
                    <button
                      onClick={handleExportCSV}
                      className="flex-1 sm:flex-none p-2.5 text-zinc-650 hover:text-zinc-905 hover:bg-zinc-200/65 rounded-lg transition-all text-xs font-bold font-syne tracking-wide flex items-center justify-center gap-1.5 cursor-pointer"
                      title={isPro ? "Export CSV" : "Pro Feature"}
                    >
                      <Download size={14} className={isPro ? 'text-zinc-800' : 'text-orange/60'} />
                      <span className="text-[10px] uppercase font-bold tracking-wider">CSV</span>
                      {!isPro && <Lock size={8} className="text-orange/60 shrink-0" />}
                    </button>

                    <button
                      onClick={handleExportExcel}
                      className="flex-1 sm:flex-none p-2.5 text-zinc-650 hover:text-zinc-905 hover:bg-zinc-200/65 rounded-lg transition-all text-xs font-bold font-syne tracking-wide flex items-center justify-center gap-1.5 border-l border-zinc-200 cursor-pointer"
                      title={isPro ? "Export Excel (.xlsx)" : "Pro Feature"}
                    >
                      <FileSpreadsheet size={14} className={isPro ? 'text-emerald-600' : 'text-orange/60'} />
                      <span className="text-[10px] uppercase font-bold tracking-wider">XLSX</span>
                      {!isPro && <Lock size={8} className="text-orange/60 shrink-0" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Desktop Table View (visible md and up) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="py-4 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-wider">Subscriber Email</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-wider">Date Joined</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-wider">Signup Source</th>
                      <th className="py-4 px-6 text-[10px] font-black uppercase text-zinc-500 tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {isLoadingSubs ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-zinc-405 font-sans">
                          <Loader2 size={24} className="animate-spin text-orange mx-auto mb-2" />
                          <p className="text-xs">Gathering database leads...</p>
                        </td>
                      </tr>
                    ) : paginatedSubscribers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-zinc-405 font-sans space-y-2">
                          <AlertCircle size={24} className="text-zinc-300 mx-auto mb-1" />
                          <p className="text-xs font-bold text-zinc-700">No subscribers matching display filters.</p>
                          <p className="text-[10px] text-zinc-400 max-w-xs mx-auto">Emails logged from subscription profile blocks will aggregate directly inside this master matrix list.</p>
                        </td>
                      </tr>
                    ) : (
                      paginatedSubscribers.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-50/45 transition-all">
                          {/* Email Column */}
                          <td className="py-4 px-6 font-mono text-xs text-zinc-900 max-w-[240px] truncate font-bold">
                            {item.email}
                          </td>

                          {/* Joined Date Column */}
                          <td className="py-4 px-6 text-xs text-zinc-500">
                            {item.subscribedAt ? item.subscribedAt.toDate().toLocaleDateString(undefined, { 
                              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            }) : 'Just now'}
                          </td>

                          {/* Source Column */}
                          <td className="py-4 px-6">
                            <span className="text-[9px] font-black uppercase tracking-wider bg-zinc-105 border border-zinc-200 text-zinc-605 px-2 py-0.5 rounded-full">
                              {item.source === 'public_profile' ? 'Profile Form' : item.source || 'profile'}
                            </span>
                          </td>

                          {/* Actions Column */}
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Copy button */}
                              <button
                                onClick={() => handleCopyEmail(item.email)}
                                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                title="Copy email address"
                              >
                                <Copy size={12} />
                              </button>

                              {/* Delete confirm dialog workflow */}
                              <AnimatePresence mode="wait">
                                {confirmDeleteId === item.id ? (
                                  <div className="flex items-center gap-1 animate-fadeIn">
                                    <button
                                      onClick={() => handleDeleteSub(item.id!)}
                                      className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white text-[9px] font-bold uppercase rounded-md transition-all active:scale-95 shadow-md cursor-pointer"
                                      title="Confirm Removal"
                                    >
                                      Remove
                                    </button>
                                    <button
                                      onClick={() => setConfirmDeleteId(null)}
                                      className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-500 text-[9px] font-bold uppercase rounded-md transition-all active:scale-95 cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setConfirmDeleteId(item.id!)}
                                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                                    title="Delete subscriber log"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </AnimatePresence>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View (visible phone/tablet) */}
              <div className="block md:hidden divide-y divide-zinc-100">
                {isLoadingSubs ? (
                  <div className="py-12 text-center text-zinc-405 font-sans">
                    <Loader2 size={24} className="animate-spin text-orange mx-auto mb-2" />
                    <p className="text-xs">Gathering database leads...</p>
                  </div>
                ) : paginatedSubscribers.length === 0 ? (
                  <div className="py-12 text-center text-zinc-400 font-sans p-6 space-y-2">
                    <AlertCircle size={24} className="text-zinc-300 mx-auto mb-1" />
                    <p className="text-sm font-bold text-zinc-700">No subscribers matching display filters.</p>
                    <p className="text-xs text-zinc-400 max-w-xs mx-auto">Emails logged from subscription profile blocks will aggregate directly inside this master matrix list.</p>
                  </div>
                ) : (
                  paginatedSubscribers.map((item) => (
                    <div key={item.id} className="p-5 space-y-4 hover:bg-zinc-50/50 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 min-w-0 flex-1 flex flex-col justify-center">
                          <p className="font-mono text-xs sm:text-sm text-zinc-900 font-bold break-all select-all">{item.email}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[8px] font-black uppercase tracking-wider bg-zinc-100 border border-zinc-200/60 text-zinc-650 px-2 py-0.5 rounded-full">
                              {item.source === 'public_profile' ? 'Profile Form' : item.source || 'profile'}
                            </span>
                            <span className="text-[10px] text-zinc-500">
                              {item.subscribedAt ? item.subscribedAt.toDate().toLocaleDateString(undefined, { 
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              }) : 'Just now'}
                            </span>
                          </div>
                        </div>

                        {/* Quick Copy */}
                        <button
                          onClick={() => handleCopyEmail(item.email)}
                          className="w-10 h-10 select-none rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-900 flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer"
                          title="Copy Email"
                        >
                          <Copy size={16} />
                        </button>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-100 pt-3.5">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Data Actions</span>
                        
                        <AnimatePresence mode="wait">
                          {confirmDeleteId === item.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDeleteSub(item.id!)}
                                className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 size={10} />
                                Remove
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-550 text-[10px] font-bold uppercase rounded-xl transition-all active:scale-95 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(item.id!)}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold uppercase rounded-xl transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 size={12} />
                              Delete Lead
                            </button>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Table pagination navigation */}
              {totalPages > 1 && (
                <div className="p-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between font-sans">
                  <p className="text-[10px] text-zinc-550">
                    Showing page <span className="font-bold text-zinc-800">{currentPage}</span> of <span className="font-bold text-zinc-800">{totalPages}</span>
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-zinc-750 cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-zinc-750 cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
