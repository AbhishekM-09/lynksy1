import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/utils/formatters'
import { useAuthStore } from '@/store/authStore'
import { changeUsername, checkUsernameAvailable, getInvoices, cancelSubscription, updatePlan, updateUser, deleteUserAccount, getPaymentHistory, PaymentHistoryItem } from '@/firebase/firestore'
import { 
  linkGoogleToAccount, addPasswordToAccount, 
  changePassword as changePass, signOutUser,
  unlinkProviderFromAccount, sendForgotPasswordEmail
} from '@/firebase/auth'
import { PasswordStrength } from '@/components/auth/PasswordStrength'
import { AuthAlert } from '@/components/auth/AuthAlert'
import { usePlan } from '@/hooks/usePlan'
import { getUserUrls } from '@/utils/planUtils'
import { 
  User, Mail, Shield, CreditCard, 
  Trash2, CheckCircle2, AlertTriangle, Crown,
  Fingerprint, Loader2, Globe, FileText, Download,
  Copy, ExternalLink, Lock, ChevronDown
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useDebounce } from '@/hooks/useDebounce'
import { InvoiceModal } from '@/components/dashboard/InvoiceModal'
import { Invoice } from '@/types'
import { auth } from '@/firebase/config'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Timestamp } from 'firebase/firestore'
import { PinModal } from '@/components/dashboard/PinModal'
import { CustomDomainSettings } from '@/components/dashboard/CustomDomainSettings'
import { ConfirmDeleteModal } from '@/components/dashboard/ConfirmDeleteModal'

export default function SettingsPage() {
  const { user, updateUserField, clearAuth } = useAuthStore()
  const { plan, limits } = usePlan()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const [isGoogleLinked, setIsGoogleLinked] = useState(false)
  const [isPasswordSet, setIsPasswordSet] = useState(false)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (user) {
      const googleLinked = !!(user.authProviders?.includes('google.com') || user.providers?.includes('google') || user.provider === 'google' || auth.currentUser?.providerData.some(p => p.providerId === 'google.com'))
      
      const hasPasswordProvider = !!(
        auth.currentUser?.providerData.some(provider => provider.providerId === 'password') ||
        user.authProviders?.includes('password') || 
        user.providers?.includes('password') || 
        user.passwordEnabled
      )

      setIsGoogleLinked(googleLinked)
      setIsPasswordSet(hasPasswordProvider)
    }
  }, [user])

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showPersonalInfoSection, setShowPersonalInfoSection] = useState(false)
  const [showChangePasswordForm, setShowChangePasswordForm] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })

  const handleLinkGoogle = async () => {
    setIsSaving(true)
    setAuthError('')
    try {
      const result = await linkGoogleToAccount()
      if (result.success) {
        toast.success('Google account linked!')
        updateUserField({ 
          authProviders: Array.from(new Set([...(user?.authProviders || []), 'google.com'])),
          providers: Array.from(new Set([...(user?.providers || []), 'google', 'password'])),
          linkedProviders: true
        })
      } else {
        setAuthError(result.error || 'Failed to link Google')
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e))
      setAuthError(err.message || 'Failed to link Google')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnlinkGoogle = async () => {
    setIsSaving(true)
    setAuthError('')
    try {
      const result = await unlinkProviderFromAccount('google.com')
      if (result.success) {
        toast.success('Google account unlinked successfully!')
        const newAuthProviders = (user?.authProviders || []).filter(p => p !== 'google.com')
        const providersList = (user?.providers || []).filter(p => p !== 'google')
        updateUserField({ 
          authProviders: newAuthProviders,
          providers: providersList
        })
      } else {
        setAuthError(result.error || 'Failed to unlink Google')
        toast.error(result.error || 'Failed to unlink Google')
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e))
      setAuthError(err.message || 'Failed to unlink Google')
      toast.error(err.message || 'Failed to unlink Google')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnlinkPassword = async () => {
    setIsSaving(true)
    setAuthError('')
    try {
      const result = await unlinkProviderFromAccount('password')
      if (result.success) {
        toast.success('Password login disabled/unlinked successfully!')
        const newAuthProviders = (user?.authProviders || []).filter(p => p !== 'password')
        const providersList = (user?.providers || []).filter(p => p !== 'password')
        updateUserField({ 
          authProviders: newAuthProviders,
          providers: providersList,
          passwordEnabled: false
        })
        setShowChangePasswordForm(false)
      } else {
        setAuthError(result.error || 'Failed to disable password')
        toast.error(result.error || 'Failed to disable password')
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e))
      setAuthError(err.message || 'Failed to disable password')
      toast.error(err.message || 'Failed to disable password')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetPassword = async () => {
    if (passwords.new !== passwords.confirm) return toast.error('Passwords do not match')
    setIsSaving(true)
    setAuthError('')
    try {
      const result = await addPasswordToAccount(passwords.new)
      if (result.success) {
        toast.success('Password set! You can now log in with email too.')
        updateUserField({ 
          authProviders: Array.from(new Set([...(user?.authProviders || []), 'password'])),
          providers: Array.from(new Set([...(user?.providers || []), 'google', 'password'])),
          passwordEnabled: true
        })
        setShowPasswordForm(false)
        setPasswords({ current: '', new: '', confirm: '' })
      } else {
        const errorMsg = result.error || 'Failed to set password'
        setAuthError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (e: unknown) {
       const err = e instanceof Error ? e : new Error(String(e))
       const errorMsg = err.message || 'Error occurred'
       setAuthError(errorMsg)
       toast.error(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) return toast.error('New passwords do not match')
    setIsSaving(true)
    setAuthError('')
    try {
      const result = await changePass(passwords.current, passwords.new)
      if (result.success) {
        toast.success('Password changed successfully!')
        updateUserField({ 
          authProviders: Array.from(new Set([...(user?.authProviders || []), 'password'])),
          providers: Array.from(new Set([...(user?.providers || []), 'password'])),
          passwordEnabled: true
        })
        setShowChangePasswordForm(false)
        setPasswords({ current: '', new: '', confirm: '' })
      } else {
        setAuthError(result.error || 'Failed to change password')
      }
    } catch (e: unknown) {
      const err = e instanceof Error ? e : new Error(String(e))
      setAuthError(err.message || 'Error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleResetPassword = async () => {
    const email = user?.email || auth.currentUser?.email
    if (!email) {
      toast.error('Could not find account email address')
      return
    }
    setIsSaving(true)
    setAuthError('')
    try {
      const result = await sendForgotPasswordEmail(email)
      if (result.success) {
        toast.success(`Password reset email sent to ${email}`)
      } else {
        setAuthError(result.error || 'Failed to send reset email')
        toast.error(result.error || 'Failed to send reset email')
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      const errorMsg = error.message || 'Failed to send password reset email'
      setAuthError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsSaving(false)
    }
  }

  const { actual: profileUrl, display: displayUrl } = getUserUrls(user)

  const tabParam = searchParams.get('tab')
  const initialTab = (tabParam === 'billing' || tabParam === 'safety') ? tabParam : 'account'
  const [activeTab, setActiveTab] = useState<'account' | 'safety' | 'billing'>(initialTab)

  useEffect(() => {
    const freshTab = searchParams.get('tab')
    if (freshTab === 'billing' || freshTab === 'safety' || freshTab === 'account') {
      setActiveTab(freshTab)
    }
  }, [searchParams])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryItem[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  
  // PIN management
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [pinMode, setPinMode] = useState<'set' | 'verify'>('set')
  
  // Delete account modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  
  // Security settings
  const settings = user?.settings || {
    emailNotifications: true,
    twoFactorAuth: false,
    searchIndexing: true,
    pinEnabled: false
  }

  const handleToggleSecurity = async (key: keyof typeof settings) => {
    if (!user?.uid) return

    // If enabling 2FA/App Lock and no PIN is set, open modal to set PIN
    if (key === 'twoFactorAuth' && !settings.twoFactorAuth && !user.settings?.pinCode) {
      setPinMode('set')
      setIsPinModalOpen(true)
      return
    }

    const newValue = !settings[key]
    const newSettings = { ...settings, [key]: newValue }
    
    // Also sync pinEnabled with twoFactorAuth
    if (key === 'twoFactorAuth') {
      newSettings.pinEnabled = newValue
    }

    try {
      await updateUser(user.uid, { settings: newSettings })
      updateUserField({ settings: newSettings })
      toast.success(`${String(key).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} ${newValue ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error('Failed to update setting')
    }
  }

  const handlePinComplete = async (pin: string) => {
    if (!user?.uid) return
    setIsSaving(true)
    try {
      const newSettings = { 
        ...settings, 
        pinCode: pin, 
        pinEnabled: true,
        twoFactorAuth: true 
      }
      await updateUser(user.uid, { settings: newSettings })
      updateUserField({ settings: newSettings })
      setIsPinModalOpen(false)
      toast.success('Security PIN set successfully!')
    } catch {
      toast.error('Failed to save security PIN')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteAccount = async () => {
    if (!user?.uid || !user.username) return
    
    setIsSaving(true)
    try {
      await deleteUserAccount(user.uid, user.username, user.email, user.customDomain)
      
      // Attempt to delete auth user (only works if recent login)
      try {
        await auth.currentUser?.delete()
      } catch (e: unknown) {
        const error = e as { code?: string }
        if (error.code === 'auth/requires-recent-login') {
          toast.error('Session expired. Please logout and login again before deleting.')
          setIsSaving(false)
          setIsDeleteModalOpen(false)
          return
        }
      }

      clearAuth()
      toast.success('Account deleted successfully')
      navigate('/')
    } catch (e: unknown) {
      const error = e as Error
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setIsSaving(false)
      setIsDeleteModalOpen(false)
    }
  }
  
  // Username management
  const [username, setUsername] = useState(user?.username || '')

  useEffect(() => {
    if (user?.username && !username) {
      setUsername(user.username)
    }
  }, [user?.username, username])

  const debouncedUsername = useDebounce(username, 500)
  const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null)
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameError, setUsernameError] = useState('')
 
  const loadInvoices = useCallback(async () => {
    if (!user?.uid) return
    setIsLoadingInvoices(true)
    setIsLoadingHistory(true)
    try {
      const [resInvoices, resHistory] = await Promise.all([
        getInvoices(user.uid).catch(() => []),
        getPaymentHistory(user.uid).catch(() => [])
      ])
      setInvoices(resInvoices)
      setPaymentHistory(resHistory)
    } finally {
      setIsLoadingInvoices(false)
      setIsLoadingHistory(false)
    }
  }, [user?.uid])

  useEffect(() => {
    if (activeTab === 'billing' && user?.uid) {
      loadInvoices()
    }
  }, [activeTab, user?.uid, loadInvoices])

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel? You will lose premium features at the end of your billing cycle.')) return
    if (!user?.uid) return
    setIsSaving(true)
    try {
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + 1)
      const ts = Timestamp.fromDate(expiry)
      await cancelSubscription(user.uid)
      toast.success('Your subscription will end on ' + expiry.toLocaleDateString())
      updateUserField({ planExpiresAt: ts })
    } catch {
      toast.error('Failed to cancel subscription')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpgradeTest = async (newPlan: 'PRO' | 'PRO_PLUS') => {
    if (!user?.uid) return
    setIsSaving(true)
    try {
      const now = new Date()
      const expires = new Date(now)
      expires.setMonth(expires.getMonth() + 1)

      await updatePlan(user.uid, newPlan, 'Monthly')
      toast.success(`Upgraded to ${newPlan} successfully!`)
      updateUserField({ 
        plan: newPlan, 
        planType: 'Monthly',
        planStartedAt: Timestamp.fromDate(now),
        planExpiresAt: Timestamp.fromDate(expires),
        purchaseDate: Timestamp.fromDate(now),
        expiryDate: Timestamp.fromDate(expires),
        subscriptionStatus: 'ACTIVE'
      })
      loadInvoices()
    } catch {
      toast.error('Upgrade failed')
    } finally {
      setIsSaving(false)
    }
  }

  const getUsernameChangeLimit = (p: string) => {
    if (p === 'PRO_PLUS') return 30
    if (p === 'PRO') return 20
    return 15
  }

  const changeLimit = getUsernameChangeLimit(plan)
  const currentChanges = user?.usernameChangeCount || 0
  const changesRemaining = Math.max(0, changeLimit - currentChanges)
  const isLimitReached = changesRemaining <= 0

  useEffect(() => {
    if (!debouncedUsername || debouncedUsername === user?.username) {
      setIsUsernameValid(null)
      setUsernameError('')
      return
    }

    if (isLimitReached) {
      setIsUsernameValid(false)
      setUsernameError(`Limit reached (${changeLimit}/${changeLimit} changes used)`)
      return
    }

    if (debouncedUsername.length < 3) {
      setIsUsernameValid(false)
      setUsernameError('Min 3 characters')
      return
    }

    const check = async () => {
      setIsCheckingUsername(true)
      try {
        const available = await checkUsernameAvailable(debouncedUsername)
        setIsUsernameValid(available)
        setUsernameError(available ? '' : 'Username taken')
      } catch (e) {
        setIsUsernameValid(false)
        console.error('Check username error:', e)
      } finally {
        setIsCheckingUsername(false)
      }
    }

    check()
  }, [debouncedUsername, user?.username, isLimitReached, changeLimit])

  const handleUpdateUsername = async () => {
    if (!user || isUsernameValid === false) return
    setIsSaving(true)
    try {
      await changeUsername(user.uid, user.username || '', username)
      updateUserField({ username })
      toast.success('Username changed successfully!')
    } catch (e: unknown) {
      const error = e as Error
      toast.error(error.message || 'Failed to update username')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-10 pb-20 px-4 sm:px-6 mx-auto w-full min-w-0">
      {/* Premium Tab Switcher */}
      <div className="sm:px-0">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-cream-2 p-1.5 rounded-2xl border border-cream-3 shadow-sm">
          <button 
            onClick={() => setActiveTab('account')} 
            className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === 'account' 
                ? 'bg-ink text-white shadow-md shadow-ink/10' 
                : 'text-muted hover:text-ink'
            }`}
          >
            <User size={14} className="sm:w-3.5 sm:h-3.5" /> 
            <span className="hidden xs:inline">Account</span>
            <span className="xs:hidden">Acc</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('safety')} 
            className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === 'safety' 
                ? 'bg-ink text-white shadow-md shadow-ink/10' 
                : 'text-muted hover:text-ink'
            }`}
          >
            <Shield size={14} className="sm:w-3.5 sm:h-3.5" /> 
            <span className="hidden xs:inline">Safety</span>
            <span className="xs:hidden">Safe</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('billing')} 
            className={`flex items-center justify-center gap-1.5 sm:gap-2.5 py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-xl transition-all ${
              activeTab === 'billing' 
                ? 'bg-ink text-white shadow-md shadow-ink/10' 
                : 'text-muted hover:text-ink'
            }`}
          >
            <CreditCard size={14} className="sm:w-3.5 sm:h-3.5" /> 
            <span className="hidden xs:inline">Billing</span>
            <span className="xs:hidden">Bill</span>
          </button>
        </div>
      </div>

      {activeTab === 'account' && (
        <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-2 duration-300">
          
          {/* Public URL Box */}
          <section className="bg-white border border-cream-3 rounded-3xl p-4 sm:p-6 md:p-8 space-y-6 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center gap-3 border-b border-cream-2 pb-4 sm:pb-5">
              <div className="p-2 sm:p-2.5 bg-orange/10 text-orange rounded-xl shrink-0 shadow-inner">
                <Globe size={18} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-ink">Public URL</h3>
                <p className="text-xs text-muted">Optimize and direct your profile connection endpoints.</p>
              </div>
            </div>

            <div className="grid gap-4 overflow-hidden">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink-3">Your Public Identity</label>
                <div className="bg-ink border-2 border-white/5 p-4 sm:p-6 rounded-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="w-full min-w-0">
                      <p className="text-[9px] font-black uppercase text-orange tracking-widest mb-1">
                        {plan === 'FREE' ? 'Standard URL' : (user?.customDomain ? 'Custom Domain' : 'Personal Subdomain')}
                      </p>
                      <p className="text-sm sm:text-base md:text-xl font-bold text-white font-mono break-all md:truncate w-full">
                        {displayUrl}
                      </p>
                    </div>
                    <div className="flex flex-col xs:flex-row gap-2 w-full md:w-auto shrink-0">
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(profileUrl)
                          toast.success('Link copied!')
                        }}
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-white text-ink hover:bg-orange hover:text-white font-bold py-2 sm:py-2.5 text-xs rounded-xl px-4 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-center"
                      >
                        <Copy size={13} /> Copy Link
                      </button>
                      <a 
                        href={profileUrl} 
                        target="_blank" 
                        className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 border border-white/20 text-white hover:bg-white/10 font-bold py-2 sm:py-2.5 text-xs rounded-xl px-4 transition-all hover:scale-[1.02] active:scale-[0.98] text-center"
                      >
                        <ExternalLink size={13} /> Visit Site
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink-3">Edit Lynksy Username</label>
                
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <div className="relative flex-1 min-w-0">
                    <div className="flex items-center border-2 border-cream-2 rounded-2xl bg-cream-1/30 focus-within:border-ink focus-within:bg-white transition-all overflow-hidden">
                      <span className="px-3 py-3.5 sm:py-4 text-muted font-black text-[11px] sm:text-xs bg-cream-2/70 border-r border-cream-2 whitespace-nowrap select-none shrink-0">
                        lynksy.app/
                      </span>
                      <div className="flex-1 flex items-center relative min-w-0">
                        <input 
                          className="w-full px-3 py-3 bg-transparent outline-none text-sm font-bold text-ink min-w-0"
                          value={username}
                          placeholder="your_name"
                          onChange={e => setUsername(String(e.target.value || '').toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                        />
                        {isCheckingUsername && (
                          <div className="px-3 shrink-0">
                            <Loader2 size={14} className="animate-spin text-muted" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    disabled={isSaving || username === (user?.username || '') || isUsernameValid === false || isCheckingUsername || isLimitReached}
                    onClick={handleUpdateUsername}
                    className="w-full sm:w-auto h-12 sm:h-14 px-6 font-black text-xs uppercase tracking-widest text-white bg-ink rounded-2xl hover:bg-orange transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Save Username'}
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 font-mono">
                  <div>
                    {usernameError && <p className="text-[10px] text-red-500 uppercase font-black">{usernameError}</p>}
                    {isUsernameValid === true && <p className="text-[10px] text-emerald-600 uppercase font-black">🌟 Available & verified!</p>}
                  </div>
                  <p className="text-[9px] text-muted uppercase font-black tracking-wider">
                    Modifications: <span className="text-orange">{currentChanges} / {changeLimit}</span> used. 
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Custom Domain Section Wrapper with modern unlock panel */}
          <section className="bg-white border border-cream-3 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden">
            {!limits.canCustomDomain && (
               <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6 bg-white/80 backdrop-blur-[4px]">
                  <div className="p-3 bg-orange/10 text-orange rounded-3xl mb-3 shadow-inner">
                    <Crown className="animate-pulse" size={28} />
                  </div>
                  <p className="text-base sm:text-lg font-black text-ink uppercase tracking-wider font-syne">Custom Domain Suite</p>
                  <p className="text-xs text-muted mb-5 max-w-[240px] leading-relaxed">Unlock complete white-label custom domain pointing structures for unmatched authority.</p>
                  <button onClick={() => setActiveTab('billing')} className="px-6 py-2.5 bg-ink text-white hover:bg-orange rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95">Upgrade Subscription</button>
               </div>
            )}
            <CustomDomainSettings />
          </section>

          {/* Combined Personal Info & Sign-in Methods Accordion */}
          <section className="bg-white border border-cream-3 rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <button 
              onClick={() => setShowPersonalInfoSection(!showPersonalInfoSection)}
              className="w-full text-left p-5 sm:p-8 flex items-center justify-between gap-4 hover:bg-cream-1/10 transition-colors focus:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 bg-orange/10 text-orange rounded-xl shrink-0 shadow-inner">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-ink">Personal Info & Sign-in Methods</h3>
                  <p className="text-xs text-muted">Manage your account credentials, verification state, and login gateways.</p>
                </div>
              </div>
              <div className="text-muted hover:text-ink shrink-0 p-1">
                <ChevronDown 
                  size={20} 
                  className={`transition-transform duration-300 ${showPersonalInfoSection ? 'rotate-180 text-orange' : 'rotate-0 text-muted'}`}
                />
              </div>
            </button>

            {showPersonalInfoSection && (
              <div className="px-5 pb-5 sm:px-8 sm:pb-8 pt-0 border-t border-cream-2 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                
                {/* Personal Info Content block */}
                <div className="space-y-6 pt-6">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange bg-orange/10 px-2.5 py-1 rounded-lg">Verified Identity Details</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-ink-3">Verified Email Address</label>
                      <div className="relative">
                         <Mail className="absolute left-4.5 top-1/2 -translate-y-1/2 text-muted-2" size={14} />
                         <input className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-cream-2 bg-cream-1/30 text-muted font-bold text-sm cursor-not-allowed outline-none" value={user?.email} disabled />
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-ink-3">Account Verification</label>
                      <div className="flex items-center gap-2.5 h-14 px-4.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-bold text-sm sm:text-sm">
                         <CheckCircle2 size={18} className="text-emerald-500 shrink-0" /> 
                         <span className="uppercase tracking-wide text-xs font-black">Verified Lynksy Creator</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sign-in Methods Content block */}
                <div className="space-y-6 pt-8 border-t border-cream-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-orange bg-orange/10 px-2.5 py-1 rounded-lg">Secure Auth Credentials</p>
                  </div>

                  <div className="space-y-4">
                    {/* Google Provider Details */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4.5 bg-cream-2 rounded-2xl border border-cream-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-cream-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-black text-ink">Google Sign-In Connection</p>
                          <p className="text-[10px] text-muted tracking-tight">
                            {isGoogleLinked ? 'Connected successfully' : 'Not linked to this login'}
                          </p>
                        </div>
                      </div>
                      {isGoogleLinked ? (
                        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 shrink-0 w-full md:w-auto justify-start md:justify-end">
                          <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-100 font-bold w-full md:w-auto">
                            <CheckCircle2 size={13} className="text-emerald-500" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Active Link</span>
                          </div>
                          {isPasswordSet && (
                            <button 
                              onClick={handleUnlinkGoogle}
                              disabled={isSaving}
                              className="h-10 text-[9px] px-3 rounded-xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 hover:text-red-700 font-black uppercase tracking-widest transition-all cursor-pointer w-full md:w-auto text-center"
                            >
                              {isSaving ? <Loader2 size={12} className="animate-spin" /> : 'Unlink'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <button 
                          onClick={handleLinkGoogle}
                          disabled={isSaving}
                          className="w-full md:w-auto h-11 text-[10px] px-4 rounded-xl bg-white border border-cream-3 text-ink hover:border-orange hover:text-orange transition-all font-black uppercase tracking-widest cursor-pointer shadow-sm text-center flex justify-center items-center"
                        >
                          {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Link Google Account'}
                        </button>
                      )}
                    </div>

                    {/* Password Provider Details */}
                    <div className="flex flex-col gap-4.5 p-4.5 bg-cream-2 rounded-2xl border border-cream-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0 border border-cream-2">
                            <Lock size={18} className="text-ink" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-ink">Direct Login Keyphrase</p>
                            <p className="text-[10px] tracking-tight">
                              {isPasswordSet ? (
                                <span className="text-emerald-700 font-bold flex items-center gap-1">
                                  ✅ Direct login credentials active
                                </span>
                              ) : (
                                <span className="text-muted">Password login currently disabled</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {isPasswordSet ? (
                          <div className="flex flex-wrap md:flex-nowrap items-center gap-2 shrink-0 w-full md:w-auto">
                            <button 
                              onClick={() => setShowChangePasswordForm(!showChangePasswordForm)}
                              className="w-full md:w-auto h-11 text-[10px] px-4 rounded-xl bg-white border border-cream-3 text-ink hover:border-orange hover:text-orange transition-all font-black uppercase tracking-widest cursor-pointer text-center flex justify-center items-center"
                            >
                              {showChangePasswordForm ? 'Cancel' : 'Change Password'}
                            </button>
                            <button 
                              onClick={handleResetPassword}
                              disabled={isSaving}
                              className="w-full md:w-auto h-11 text-[10px] px-4 rounded-xl bg-white border border-cream-3 text-ink hover:border-orange hover:text-orange transition-all font-black uppercase tracking-widest cursor-pointer text-center flex justify-center items-center"
                            >
                              {isSaving ? <Loader2 size={12} className="animate-spin" /> : 'Send Reset Link'}
                            </button>
                            {isGoogleLinked && (
                              <button 
                                onClick={handleUnlinkPassword}
                                disabled={isSaving}
                                className="w-full md:w-auto h-11 text-[10px] px-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 transition-all font-black uppercase tracking-widest cursor-pointer text-center flex justify-center items-center"
                              >
                                {isSaving ? <Loader2 size={12} className="animate-spin" /> : 'Deactivate'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <button 
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                            className="w-full md:w-auto h-11 text-[10px] px-4 rounded-xl bg-white border-2 border-orange text-orange hover:bg-orange/5 transition-all font-black uppercase tracking-widest cursor-pointer text-center flex justify-center items-center"
                          >
                            {showPasswordForm ? 'Cancel Set' : 'Set Account Password'}
                          </button>
                        )}
                      </div>

                      {/* Set Password Form */}
                      {showPasswordForm && !isPasswordSet && (
                        <div className="pt-4 border-t border-cream-3 space-y-4">
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase tracking-widest text-muted">Choose New Password</label>
                             <input 
                               type="password" 
                               className="w-full h-11 px-4 rounded-xl border-2 border-cream-3 bg-white text-sm outline-none outline-0"
                               value={passwords.new}
                               onChange={e => setPasswords({...passwords, new: e.target.value})}
                             />
                             <PasswordStrength password={passwords.new} />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase tracking-widest text-muted">Confirm New Password</label>
                             <input 
                               type="password" 
                               className="w-full h-11 px-4 rounded-xl border-2 border-cream-3 bg-white text-sm outline-none"
                               value={passwords.confirm}
                               onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                             />
                          </div>
                          <button 
                            onClick={handleSetPassword}
                            disabled={isSaving || passwords.new.length < 8}
                            className="w-full btn-primary h-11 text-xs gap-2 shrink-0 cursor-pointer"
                          >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Activate Credentials'}
                          </button>
                        </div>
                      )}

                      {/* Change Password Form */}
                      {showChangePasswordForm && isPasswordSet && (
                        <div className="pt-4 border-t border-cream-3 space-y-4">
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase tracking-widest text-muted">Current Auth Key</label>
                             <input 
                               type="password" 
                               className="w-full h-11 px-4 rounded-xl border-2 border-cream-3 bg-white text-sm outline-none"
                               value={passwords.current}
                               onChange={e => setPasswords({...passwords, current: e.target.value})}
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase tracking-widest text-muted">Choose New Security Password</label>
                             <input 
                               type="password" 
                               className="w-full h-11 px-4 rounded-xl border-2 border-cream-3 bg-white text-sm outline-none"
                               value={passwords.new}
                               onChange={e => setPasswords({...passwords, new: e.target.value})}
                             />
                             <PasswordStrength password={passwords.new} />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase tracking-widest text-muted">Confirm New Security Password</label>
                             <input 
                               type="password" 
                               className="w-full h-11 px-4 rounded-xl border-2 border-cream-3 bg-white text-sm outline-none"
                               value={passwords.confirm}
                               onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                             />
                          </div>
                          <button 
                            onClick={handleChangePassword}
                            disabled={isSaving || passwords.new.length < 8}
                            className="w-full btn-primary h-11 text-xs gap-2 cursor-pointer"
                          >
                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : 'Update Active Password'}
                          </button>
                        </div>
                      )}

                      <AuthAlert message={authError} onDismiss={() => setAuthError('')} />
                    </div>

                    {/* Multi-session check */}
                    <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-4 p-4 bg-orange-50/45 border border-orange-100 rounded-2xl">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-cream-3 shrink-0">
                           <Fingerprint size={18} className="text-orange" />
                         </div>
                         <div className="min-w-0 text-left">
                           <p className="text-xs font-black text-ink">Active Device Session</p>
                           <p className="text-[9px] text-orange tracking-tight uppercase font-black opacity-60">Connected live</p>
                         </div>
                       </div>
                       <button 
                         onClick={() => signOutUser().then(() => { clearAuth(); navigate('/login'); })}
                         className="text-[10px] font-black uppercase tracking-widest text-orange hover:underline cursor-pointer shrink-0 self-start xs:self-auto"
                       >
                         Log out device
                       </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </section>
        </div>
      )}

      {activeTab === 'safety' && (
        <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-2 duration-300">
           {/* Security and privacy settings block */}
           <section className="bg-white border border-cream-3 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center justify-between border-b border-cream-2 pb-4 sm:pb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-ink mb-1">Security & Shielding</h3>
                  <p className="text-xs text-muted">Harden your public profile accessibility parameters.</p>
                </div>
                <div className="p-2 sm:p-2.5 bg-orange/10 text-orange rounded-xl shrink-0 shadow-inner">
                  <Shield size={20} />
                </div>
              </div>
              
              <div className="space-y-3">
                {[
                  { id: 'emailNotifications' as const, icon: Mail, label: 'Creator Activity Newsletters', desc: 'Monthly performance roundups and safety alerts.', enabled: settings.emailNotifications },
                  { id: 'twoFactorAuth' as const, icon: Fingerprint, label: 'App Locking Security Shield', desc: 'Harden dashboards with a numeric pincode.', enabled: settings.twoFactorAuth },
                  { id: 'searchIndexing' as const, icon: Globe, label: 'Public Search Indexing', desc: 'Allows Google/Bing bots to crawl and index your web-identity.', enabled: settings.searchIndexing },
                ].map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => handleToggleSecurity(item.id)}
                    className="flex items-center justify-between p-4 bg-cream-2 rounded-2xl hover:bg-cream-3/80 transition-colors cursor-pointer group border border-cream-2"
                  >
                    <div className="flex items-center gap-3.5 sm:gap-4 overflow-hidden">
                      <div className="p-2.5 bg-white rounded-xl text-ink group-hover:text-orange transition-colors shrink-0 shadow-sm border border-cream-2">
                        <item.icon size={16} />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="text-xs sm:text-sm font-black text-ink truncate">{item.label}</p>
                        <p className="text-[10px] text-muted leading-tight mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    
                    {/* Modern fluid toggle switch */}
                    <div className={`w-11 sm:w-12 h-6 sm:h-6.5 rounded-full relative transition-colors duration-200 shrink-0 ${item.enabled ? 'bg-orange' : 'bg-cream-3 border border-cream-3'}`}>
                      <div className={`absolute top-[3px] w-4.5 sm:w-5 h-4.5 sm:h-5 bg-white rounded-full transition-all duration-200 shadow-sm ${item.enabled ? 'right-[3px]' : 'left-[3px]'}`} />
                    </div>
                  </div>
                ))}
              </div>
           </section>

           {/* Danger zone panel */}
           <section className="bg-red-50/10 border-2 border-dashed border-red-100 rounded-3xl p-5 sm:p-8 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl shrink-0 mt-0.5">
                  <AlertTriangle size={20} />
                </div>
                <div className="text-left space-y-1">
                  <h3 className="text-base sm:text-lg font-black text-red-600">Danger Zone</h3>
                  <p className="text-xs text-muted max-w-lg leading-relaxed">Permanent metadata cleanup. Removing accounts will instantly drop subscriber maps, registered tip links, custom domain DNS routes, and historical analytics charts. This action cannot be reversed.</p>
                </div>
              </div>
              <div className="pt-2">
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-red-600 bg-white border border-red-200 hover:text-white hover:bg-red-600 w-full sm:w-auto px-6 py-3 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Trash2 size={15} /> Delete Account Permanently</>}
                </button>
              </div>
           </section>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-2 duration-300">
           
           {/* Subscription Glossy Bento Card */}
           <section className="bg-gradient-to-br from-ink to-ink-2 hover:to-zinc-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-ink/10 transition-all duration-300">
              <div className="absolute top-0 right-0 p-6 opacity-5 sm:opacity-[0.08] pointer-events-none">
                 <Crown size={120} className="animate-[pulse_4s_ease-in-out_infinite]" />
              </div>
              
              <div className="relative z-10 space-y-6 sm:space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-white/10">
                   <div>
                     <span className="text-[8px] font-black uppercase text-orange tracking-widest bg-orange/10 px-2.5 py-1 rounded-full border border-orange/10">Connected tier</span>
                     <h3 className="text-2xl sm:text-3xl font-black font-syne mt-1.5 tracking-tight">Active Plan: {String(plan || '').replace('_', ' ')}</h3>
                     <p className="text-white/50 text-xs mt-1.5 font-medium">Billed {user?.planType || 'Monthly'} • Next renewal date: <span className="font-mono text-white/70">{user?.planExpiresAt?.toDate().toLocaleDateString()}</span></p>
                   </div>
                   <div className="bg-emerald-500 text-white text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest shadow-md shrink-0 flex items-center gap-1.5 border border-emerald-400">
                     <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Active Status
                   </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                   <div>
                     <p className="text-[10px] font-black text-white/40 uppercase mb-4 tracking-widest font-mono">Real-time resource quota usage</p>
                     
                     <div className="space-y-5">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                             <span className="opacity-70 flex items-center gap-1.5"><Globe size={12} /> Active Redirect Links</span>
                             <span className="font-mono text-orange">{limits.maxLinks === 999 ? '∞ Limitless' : `8 / ${limits.maxLinks}`}</span>
                          </div>
                          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full bg-orange rounded-full transition-all duration-1000" style={{ width: '50%' }} />
                          </div>
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                             <span className="opacity-70 flex items-center gap-1.5"><Sparkles size={12} /> AI Bios Constructed</span>
                             <span className="font-mono text-purple-400">{limits.maxAiBios === 999 ? '∞ Limitless' : `1 / ${limits.maxAiBios}`}</span>
                          </div>
                          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: '20%' }} />
                          </div>
                        </div>
                     </div>
                   </div>

                   <div className="flex flex-col justify-end gap-3 shrink-0">
                      {plan === 'FREE' ? (
                        <button 
                          onClick={() => handleUpgradeTest('PRO')} 
                          disabled={isSaving} 
                          className="w-full inline-flex items-center justify-center gap-2 bg-orange hover:bg-orange-hover text-white font-black uppercase text-xs tracking-widest py-4 rounded-2xl transition-all shadow-lg shadow-orange/15 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                        >
                           {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Crown size={15} /> Upgrade to Premium Pro</>}
                        </button>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleUpgradeTest(plan === 'PRO' ? 'PRO_PLUS' : 'PRO')} 
                            disabled={isSaving} 
                            className="w-full inline-flex items-center justify-center gap-2 border border-white/20 bg-white/10 hover:bg-white/15 text-white font-black uppercase text-xs tracking-widest py-3.5 rounded-2xl transition-all cursor-pointer"
                          >
                             {isSaving ? <Loader2 size={16} className="animate-spin" /> : plan === 'PRO' ? 'Ascend to Pro+' : 'Downgrade to Standard Pro'}
                          </button>
                          
                          <button 
                            onClick={handleCancelSubscription} 
                            disabled={isSaving} 
                            className="text-white/40 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest text-center underline decoration-white/20 underline-offset-4 cursor-pointer"
                          >
                             Cancel Subscription
                          </button>
                        </>
                      )}
                   </div>
                </div>
              </div>
           </section>

           {/* Invoice details billing history */}
           <div className="px-1 space-y-4">
              <div className="flex items-center gap-2 pb-1.5">
                 <div className="p-1.5 bg-orange/10 text-orange rounded-lg">
                   <FileText size={16} />
                 </div>
                 <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-ink mt-0.5">Billing & Invoices History</h4>
              </div>
              
              {isLoadingInvoices ? (
                <div className="flex justify-center p-12 bg-white rounded-3xl border border-cream-3"><Loader2 className="animate-spin text-muted" /></div>
              ) : invoices.length > 0 ? (
                <div className="bg-white border border-cream-3 rounded-3xl p-1 overflow-hidden divide-y divide-cream-3 shadow-sm">
                   {invoices.map((inv) => (
                      <div key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 hover:bg-cream-1/30 transition-colors group gap-3">
                         <div className="flex items-center gap-3 sm:gap-4.5 overflow-hidden">
                            <div className="w-11 h-11 bg-cream-2 rounded-xl flex items-center justify-center text-ink shrink-0 shadow-inner group-hover:bg-cream-3 transition-colors">
                               <FileText size={18} />
                            </div>
                            <div className="min-w-0 text-left">
                               <p className="text-xs sm:text-sm font-black text-ink truncate group-hover:text-orange transition-colors">{inv.invoiceNumber}</p>
                               <p className="text-[10px] text-muted truncate font-mono mt-0.5">{inv.billingDate.toDate().toLocaleDateString()} • {inv.plan}</p>
                            </div>
                         </div>
                         <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto sm:shrink-0 border-t border-cream-2 sm:border-t-0 pt-3 sm:pt-0">
                            <p className="text-xs sm:text-sm font-black font-mono text-ink">₹{inv.amount.toLocaleString('en-IN')}</p>
                            <button 
                               onClick={() => setSelectedInvoice(inv)}
                               className="p-2.5 text-muted hover:text-white hover:bg-ink rounded-xl border border-transparent hover:border-cream-3 transition-all cursor-pointer shrink-0"
                            >
                               <Download size={15} />
                            </button>
                         </div>
                      </div>
                   ))}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-12 border-2 border-dashed border-cream-3 rounded-3xl text-center flex-col bg-white">
                   <div className="p-3 bg-cream-1/80 border border-cream-2 text-muted rounded-2xl shadow-inner mb-1.5">
                     <AlertTriangle size={24} />
                   </div>
                   <p className="text-sm font-black text-ink uppercase tracking-wide">No Invoices Located</p>
                   <p className="text-xs text-muted max-w-xs leading-relaxed">Awaiting your first premium upgrade transaction event.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Payment history list */}
      {activeTab === 'billing' && (
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
          <div className="px-1 space-y-4 pt-6">
             <div className="flex items-center gap-2 pb-1.5">
                <div className="p-1.5 bg-purple-500/10 text-purple-600 rounded-lg">
                  <CreditCard size={16} />
                </div>
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-ink mt-0.5">Razorpay Payment Transaction History</h4>
             </div>
             
             {isLoadingHistory ? (
               <div className="flex justify-center p-12 bg-white rounded-3xl border border-cream-3"><Loader2 className="animate-spin text-muted" /></div>
             ) : paymentHistory.length > 0 ? (
               <div className="bg-white border border-cream-3 rounded-3xl p-1 overflow-hidden divide-y divide-cream-3 shadow-sm">
                  {paymentHistory.map((ph) => (
                     <div key={ph.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 transition-colors group gap-3">
                        <div className="flex items-center gap-4.5 overflow-hidden">
                           <div className="w-11 h-11 bg-cream-2 rounded-xl flex items-center justify-center text-ink shrink-0 shadow-inner group-hover:bg-cream-3 transition-colors">
                              <CreditCard size={18} />
                           </div>
                           <div className="min-w-0 text-left w-full">
                              <div className="flex items-center gap-2">
                                <p className="text-xs sm:text-sm font-black text-ink">{ph.planPurchased === 'PRO' ? 'Lynksy Pro Plan' : 'Lynksy Pro+ Plan'}</p>
                                <span className={cn(
                                  "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                                  ph.status === 'SUCCESS' ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"
                                )}>
                                  {ph.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted truncate font-mono mt-0.5">
                                ID: {ph.paymentId} • {ph.date?.toDate ? ph.date.toDate().toLocaleString() : (ph.createdAt ? new Date(ph.createdAt).toLocaleString() : '')}
                              </p>
                           </div>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto sm:shrink-0 border-t border-cream-2 sm:border-t-0 pt-3 sm:pt-0 font-bold p-1 sm:p-2.5 font-mono text-ink">
                           <span className="inline sm:hidden text-[10px] uppercase text-muted tracking-widest font-sans font-black">Amount</span>
                           ₹{ph.amountPaid}
                        </div>
                     </div>
                  ))}
               </div>
             ) : (
               <div className="flex items-center gap-3 p-12 border-2 border-dashed border-cream-3 rounded-3xl text-center flex-col bg-white">
                  <div className="p-3 bg-cream-1/80 border border-cream-2 text-muted rounded-2xl shadow-inner mb-1.5">
                    <CreditCard size={24} />
                  </div>
                  <p className="text-sm font-black text-ink uppercase tracking-wide">No payment history located</p>
                  <p className="text-xs text-muted max-w-xs leading-relaxed">Ensure a subscription has been active via Razorpay.</p>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Payments settings section removed */}

      {/* Modals & Dialog blocks */}
      <InvoiceModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
      
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        mode={pinMode}
        onComplete={handlePinComplete}
        userName={user?.username || ''}
      />
      
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteAccount}
        isLoading={isSaving}
        username={user?.username || ''}
      />
    </div>
  )
}
