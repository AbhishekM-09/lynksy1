/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Plus, Package, ShoppingBag, IndianRupee, 
  TrendingUp, Clock, ArrowUpRight, Copy, ExternalLink,
  Crown, Sparkles, Layout, BarChart, AlertCircle,
  Loader2, CheckCircle2, Users, CreditCard, Search, 
  Download, HelpCircle, Check, XCircle, ArrowUp, Calendar,
  FileSpreadsheet, ShieldCheck, ArrowRight, Settings, Info,
  DollarSign, ArrowDownLeft, ChevronRight, Eye, EyeOff, Edit, Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { 
  getStoreStats, getOrders, getProducts, deleteProduct, updateProduct, refundOrder,
  getWithdrawals, createWithdrawalRequest 
} from '@/firebase/store'
import { updateUser } from '@/firebase/firestore'
import { StoreStats, Order, Product, Withdrawal } from '@/types/store'
import { formatPrice } from '@/utils/storeUtils'
import { AddEditProductModal } from '@/components/store/AddEditProductModal'
import { cn } from '@/utils/formatters'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface WithdrawalModalProps {
  isOpen: boolean
  onClose: () => void
  availableBalance: number
  uid: string
  onSubmitSuccess: () => void
}

function WithdrawalModal({ isOpen, onClose, availableBalance, uid, onSubmitSuccess }: WithdrawalModalProps) {
  const { user } = useAuthStore()
  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank'>('upi')
  const [upiId, setUpiId] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError('Please enter a valid transfer amount')
      return
    }
    if (parsedAmount < 200) {
      setValidationError('Minimum withdrawal limit is ₹200')
      return
    }
    if (parsedAmount > availableBalance) {
      setValidationError(`Maximum withdrawal limit is your available balance (₹${availableBalance.toLocaleString()})`)
      return
    }

    if (paymentMethod === 'upi') {
      if (!upiId.trim()) {
        setValidationError('UPI ID is required')
        return
      }
      if (!upiId.includes('@')) {
        setValidationError('Please enter a valid UPI ID (e.g. name@upi)')
        return
      }
    } else {
      if (!accountHolderName.trim()) {
        setValidationError('Account Holder Name is required')
        return
      }
      if (!bankName.trim()) {
        setValidationError('Bank Name is required')
        return
      }
      if (!accountNumber.trim()) {
        setValidationError('Account Number is required')
        return
      }
      if (!ifscCode.trim()) {
        setValidationError('IFSC Code is required')
        return
      }
    }

    setIsSubmitting(true)
    try {
      const payload: Omit<Withdrawal, 'id' | 'createdAt' | 'updatedAt' | 'status'> = {
        amount: parsedAmount,
        paymentMethod,
        upiId: paymentMethod === 'upi' ? upiId.trim() : '',
        accountHolderName: paymentMethod === 'bank' ? accountHolderName.trim() : '',
        bankName: paymentMethod === 'bank' ? bankName.trim() : '',
        accountNumber: paymentMethod === 'bank' ? accountNumber.trim() : '',
        ifscCode: paymentMethod === 'bank' ? ifscCode.trim() : '',
        referenceNumber: 'RET_REF' + Math.floor(Math.random() * 900000 + 100000),
      }

      await createWithdrawalRequest(uid, payload, {
        username: user?.username || 'unknown',
        email: user?.email || 'unknown',
        displayName: user?.displayName || 'unknown'
      })
      toast.success('Withdrawal request submitted successfully!')
      
      // Reset state
      setAmount('')
      setUpiId('')
      setAccountHolderName('')
      setBankName('')
      setAccountNumber('')
      setIfscCode('')
      onSubmitSuccess()
      onClose()
    } catch (err: unknown) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to submit withdrawal request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="bg-cream-1 p-6 flex items-center justify-between border-b border-cream-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange/10 text-orange rounded-xl">
                <CreditCard size={18} />
              </div>
              <div>
                <h3 className="font-syne font-black text-ink text-sm uppercase tracking-tight">Withdraw Funds</h3>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Available balance: ₹{availableBalance.toLocaleString()}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white border border-cream-3 flex items-center justify-center text-muted hover:text-ink transition-colors"
            >
              <XCircle size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {validationError && (
              <div className="p-4 bg-orange/5 border border-orange/15 rounded-xl flex items-start gap-2.5 text-xs font-bold text-orange select-none">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Transfer Amount (INR)</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted font-black text-sm">₹</div>
                <input 
                  type="number"
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={e => {
                    setAmount(e.target.value)
                    setValidationError(null)
                  }}
                  className="w-full pl-10 pr-4 py-4 bg-cream-1 border-2 border-transparent rounded-[1.25rem] text-sm font-bold focus:border-orange focus:bg-white focus:outline-none transition-all"
                  required
                />
              </div>
              <p className="text-[10px] text-muted ml-1 uppercase tracking-wider font-bold">Minimum: ₹200 • Available limit: ₹{availableBalance.toLocaleString()}</p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Select Disbursal Route</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('upi')
                    setValidationError(null)
                  }}
                  className={cn(
                    "p-4 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all text-center",
                    paymentMethod === 'upi'
                      ? "border-orange bg-orange/5 text-orange"
                      : "border-cream-3 hover:border-ink text-muted hover:text-ink bg-white"
                  )}
                >
                  UPI Payout
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('bank')
                    setValidationError(null)
                  }}
                  className={cn(
                    "p-4 rounded-xl border-2 font-black text-xs uppercase tracking-widest transition-all text-center",
                    paymentMethod === 'bank'
                      ? "border-orange bg-orange/5 text-orange"
                      : "border-cream-3 hover:border-ink text-muted hover:text-ink bg-white"
                  )}
                >
                  Bank Transfer
                </button>
              </div>
            </div>

            {/* Dynamic Inputs */}
            {paymentMethod === 'upi' ? (
              <div className="space-y-2 animate-fade-in">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">UPI Handle / ID</label>
                <input
                  type="text"
                  placeholder="e.g. rahul@ybl"
                  value={upiId}
                  onChange={e => {
                    setUpiId(e.target.value)
                    setValidationError(null)
                  }}
                  className="w-full px-4 py-4 bg-cream-1 border-2 border-transparent rounded-[1.25rem] text-sm font-bold focus:border-orange focus:bg-white focus:outline-none transition-all"
                  required
                />
                <p className="text-[10px] text-muted ml-1 uppercase tracking-wider font-bold">Instant Disbursal straight to your bank account via UPI</p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in sm:max-h-[220px] overflow-y-auto pr-1">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="e.g. RAHUL SHARMA"
                    value={accountHolderName}
                    onChange={e => setAccountHolderName(e.target.value)}
                    className="w-full px-4 py-4 bg-cream-1 border-2 border-transparent rounded-[1.25rem] text-sm font-bold focus:border-orange focus:bg-white focus:outline-none transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC BANK"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      className="w-full px-4 py-4 bg-cream-1 border-2 border-transparent rounded-[1.1rem] text-xs font-bold focus:border-orange focus:bg-white focus:outline-none transition-all"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0000123"
                      value={ifscCode}
                      onChange={e => setIfscCode(e.target.value)}
                      className="w-full px-4 py-4 bg-cream-1 border-2 border-transparent rounded-[1.1rem] text-xs font-bold focus:border-orange focus:bg-white focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Account Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 5010020304050"
                    value={accountNumber}
                    onChange={e => setAccountNumber(e.target.value)}
                    className="w-full px-4 py-4 bg-cream-1 border-2 border-transparent rounded-[1.25rem] text-sm font-bold focus:border-orange focus:bg-white focus:outline-none transition-all"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4.5 bg-orange text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-hover outline-none transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                'Request Cashout Disbursal'
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default function StoreDashboard() {
  const { user, updateUserField } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'wallet' | 'withdrawals' | 'settings'>('products')

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productSearch, setProductSearch] = useState('')
  const [productFilterTab, setProductFilterTab] = useState<'all' | 'active' | 'draft'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)

  // Orders state
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderFilterTab, setOrderFilterTab] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all')

  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true)
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false)

  // Settings form states
  const [storeName, setStoreName] = useState(user?.storeName || '')
  const [storeDescription, setStoreDescription] = useState(user?.storeDescription || '')
  const [storeCurrency, setStoreCurrency] = useState(user?.storeCurrency || 'INR')
  const [defaultDownloadMessage, setDefaultDownloadMessage] = useState(user?.defaultDownloadMessage || '')
  const [refundPolicy, setRefundPolicy] = useState(user?.refundPolicy || '')
  const [termsAndConditions, setTermsAndConditions] = useState(user?.termsAndConditions || '')
  const [storeVisibility, setStoreVisibility] = useState(user?.storeVisibility !== false)
  const [digitalDeliverySettings, setDigitalDeliverySettings] = useState(user?.digitalDeliverySettings !== false)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const uid = user?.uid

  // Synchronise settings input when user profile changes
  const hasInitializedSettings = useRef(false)
  useEffect(() => {
    if (user && !hasInitializedSettings.current) {
      setStoreName(user.storeName || '')
      setStoreDescription(user.storeDescription || '')
      setStoreCurrency(user.storeCurrency || 'INR')
      setDefaultDownloadMessage(user.defaultDownloadMessage || '')
      setRefundPolicy(user.refundPolicy || '')
      setTermsAndConditions(user.termsAndConditions || '')
      hasInitializedSettings.current = true
    }
  }, [user])

  // Core loaders
  const loadProductsData = useCallback(async () => {
    if (!uid) return
    try {
      setLoadingProducts(true)
      const data = await getProducts(uid)
      setProducts(data)
    } catch (e) {
      console.error('Error fetching products:', e)
    } finally {
      setLoadingProducts(false)
    }
  }, [uid])

  const loadOrdersData = useCallback(async () => {
    if (!uid) return
    try {
      setLoadingOrders(true)
      const data = await getOrders(uid, 500)
      setAllOrders(data)
    } catch (e) {
      console.error('Error fetching orders:', e)
    } finally {
      setLoadingOrders(false)
    }
  }, [uid])

  const loadWithdrawalsData = useCallback(async () => {
    if (!uid) return
    try {
      setLoadingWithdrawals(true)
      const data = await getWithdrawals(uid)
      setWithdrawals(data)
    } catch (e) {
      console.error('Error fetching cashouts:', e)
    } finally {
      setLoadingWithdrawals(false)
    }
  }, [uid])

  useEffect(() => {
    if (!uid) return
    loadProductsData()
    loadOrdersData()
    loadWithdrawalsData()
  }, [uid, loadProductsData, loadOrdersData, loadWithdrawalsData])

  useEffect(() => {
    const path = window.location.pathname;
    if (path.endsWith('/orders')) {
      setActiveTab('orders');
    } else if (path.endsWith('/products')) {
      setActiveTab('products');
    }
  }, [])

  // Calculations for Wallet & Stats
  const paidOrders = allOrders.filter(o => o.status === 'paid' || o.status === 'delivered')
  const totalSalesCount = paidOrders.length
  const totalOrdersCount = allOrders.length

  const lifetimeEarningsRupees = paidOrders.reduce((sum, o) => sum + ((o.creatorEarnings || 0) / 100), 0)
  const pendingBalanceRupees = allOrders
    .filter(o => o.status === 'pending')
    .reduce((sum, o) => sum + ((o.creatorEarnings || 0) / 100), 0)

  // Total amount of requested/processed cashouts
  const totalWithdrawnRupees = withdrawals
    .filter(w => w.status === 'paid' || w.status === 'completed' || w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0)

  const availableBalanceRupees = Math.max(0, lifetimeEarningsRupees - totalWithdrawnRupees)

  // Combined transactions ledger
  const transactions = [
    ...paidOrders.map(o => ({
      id: `sale_${o.id}`,
      type: 'Sale' as const,
      description: `${o.productTitle || 'Digital Item'} • Buyer: ${o.buyerName || 'Audience'}`,
      amount: (o.creatorEarnings || 0) / 100,
      status: 'Completed' as const,
      date: o.createdAt?.toDate ? o.createdAt.toDate() : new Date(),
    })),
    ...allOrders.filter(o => o.status === 'refunded').map(o => ({
      id: `ref_${o.id}`,
      type: 'Refund' as const,
      description: `Refund for ${o.productTitle || 'Digital Item'} (${o.buyerName || 'Audience'})`,
      amount: -((o.creatorEarnings || 0) / 100),
      status: 'Completed' as const,
      date: o.createdAt?.toDate ? o.createdAt.toDate() : new Date(),
    })),
    ...withdrawals.map(w => ({
      id: `w_tx_${w.id}`,
      type: 'Withdrawal' as const,
      description: `Disbursal withdrawal to ${w.paymentMethod === 'upi' ? `UPI (${w.upiId})` : `${w.bankName || 'Bank'}`}`,
      amount: -w.amount,
      status: (w.status === 'paid' || w.status === 'completed') ? ('Completed' as const) : (w.status === 'pending' ? ('Pending' as const) : ('Failed' as const)),
      date: w.createdAt?.toDate ? w.createdAt.toDate() : new Date(),
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  // Product Actions
  const handleToggleProductActive = async (prod: Product) => {
    if (!uid) return
    const originalStatus = prod.isActive
    try {
      // Optimistic update
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, isActive: !p.isActive } : p))
      await updateProduct(uid, prod.id, { isActive: !prod.isActive })
      toast.success(`Product state set to ${!originalStatus ? 'Active' : 'Draft'}`)
    } catch {
      // Rolback
      setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, isActive: originalStatus } : p))
      toast.error('Failed to update product state')
    }
  }

  const handleDeleteProductClick = (prod: Product) => {
    setProductToDelete(prod)
  }

  const handleConfirmDeleteProduct = async (id: string) => {
    if (!uid) return

    const loadingToast = toast.loading('Deleting product...')
    try {
      await deleteProduct(uid, id)
      toast.dismiss(loadingToast)
      toast.success('Product permanently removed')
      setProducts(prev => prev.filter(p => p.id !== id))
      setProductToDelete(null)
    } catch (err: unknown) {
      toast.dismiss(loadingToast)
      toast.error('Failed to delete product')
    }
  }

  // Orders Actions
  const handleRefundOrder = async (orderId: string) => {
    if (!uid) return
    const confirmRefund = window.confirm('Are you select to refund this customer? This operation will debit your store balance.')
    if (!confirmRefund) return

    const loadingToast = toast.loading('Refunding order transaction...')
    try {
      await refundOrder(uid, orderId)
      toast.dismiss(loadingToast)
      toast.success('Refund completed successfully')
      loadOrdersData()
      loadWithdrawalsData()
    } catch (err: unknown) {
      toast.dismiss(loadingToast)
      toast.error('Failed to issue refund')
    }
  }

  const exportOrdersCSV = () => {
    if (allOrders.length === 0) {
      toast.error('No store orders located to export.')
      return
    }
    
    const headers = ['Order Registration Date', 'Buyer Full Name', 'Customer Email', 'Digital Product', 'Net Price Paid (₹)', 'Disbursal Commission', 'Disbursal Status', 'Registry Order ID']
    const csvContent = [
      headers.join(','),
      ...allOrders.map(o => [
        o.createdAt?.toDate ? format(o.createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss') : '',
        `"${o.buyerName.replace(/"/g, '""')}"`,
        o.buyerEmail,
        `"${o.productTitle.replace(/"/g, '""')}"`,
        o.productPrice / 100,
        (o.creatorEarnings || 0) / 100,
        o.status.toUpperCase(),
        o.id
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `lynksy_sales_orders_${format(new Date(), 'yyyy-MM-dd')}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('CSV order register ledger downloaded!')
  }

  // Save Settings
  const handleSaveSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid) return

    setIsSavingSettings(true)
    const loadToast = toast.loading('Saving custom settings...')
    try {
      const payload = {
        storeName: storeName.trim(),
        storeDescription: storeDescription.trim(),
        storeCurrency,
        defaultDownloadMessage: defaultDownloadMessage.trim(),
        refundPolicy: refundPolicy.trim(),
        termsAndConditions: termsAndConditions.trim(),
        storeVisibility,
        digitalDeliverySettings,
      }

      await updateUser(uid, payload)
      updateUserField(payload)
      toast.dismiss(loadToast)
      toast.success('Store Settings updated successfully!')
    } catch (err) {
      toast.dismiss(loadToast)
      toast.error('Failed to save settings information')
    } finally {
      setIsSavingSettings(false)
    }
  }

  // Filter systems
  const filteredProducts = products
    .filter(p => {
      if (productFilterTab === 'active') return p.isActive
      if (productFilterTab === 'draft') return !p.isActive
      return true
    })
    .filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase()) || (p.description || '').toLowerCase().includes(productSearch.toLowerCase()))

  const filteredOrders = allOrders
    .filter(o => {
      if (orderFilterTab === 'paid') return o.status === 'paid' || o.status === 'delivered'
      if (orderFilterTab === 'pending') return o.status === 'pending'
      if (orderFilterTab === 'refunded') return o.status === 'refunded'
      return true
    })
    .filter(o => o.buyerName.toLowerCase().includes(orderSearch.toLowerCase()) || o.buyerEmail.toLowerCase().includes(orderSearch.toLowerCase()) || o.productTitle.toLowerCase().includes(orderSearch.toLowerCase()))

  return (
    <div className="px-4 sm:px-8 py-6 sm:py-10 max-w-7xl mx-auto space-y-8 sm:space-y-12">
      
      {/* Upper header segment */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted">
            <ShoppingBag size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Lynksy Commerce Center</span>
          </div>
          <h1 className="font-syne font-black text-3xl sm:text-5xl uppercase tracking-tighter text-ink">
            {activeTab === 'products' && 'Digital Storefront'}
            {activeTab === 'orders' && 'Order Registry'}
            {activeTab === 'wallet' && 'Creator Balance Sheet'}
            {activeTab === 'withdrawals' && 'Settlement Disbursals'}
            {activeTab === 'settings' && 'Store Management'}
          </h1>
          <p className="text-muted text-xs font-medium">
            {activeTab === 'products' && 'Organize features, edit descriptions, toggle tags, and manage core items.'}
            {activeTab === 'orders' && 'Monitor buyer entries, track email consent, export CSV ledgers.'}
            {activeTab === 'wallet' && 'Analyze daily stream revenues, lifetime sales, and trigger instant cashouts.'}
            {activeTab === 'withdrawals' && 'Track historical transfer receipts, status logs, and recipient destinations.'}
            {activeTab === 'settings' && 'Personalize store names, download attachments, currency formats, and cancellation policies.'}
          </p>
        </div>

        {activeTab === 'products' && (
          <button 
            onClick={() => {
              setSelectedProduct(null)
              setIsProductModalOpen(true)
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-orange text-white rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-widest hover:bg-orange-hover transition-all shadow-lg shadow-orange/15 active:scale-95"
          >
            <Plus size={16} /> Add digital product
          </button>
        )}

        {activeTab === 'orders' && (
          <button 
            onClick={exportOrdersCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-white border border-cream-3 text-ink rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-widest hover:bg-ink hover:text-white transition-all shadow-sm active:scale-95"
          >
            <Download size={16} /> Export CSV ledger
          </button>
        )}

        {(activeTab === 'wallet' || activeTab === 'withdrawals') && (
          <button 
            onClick={() => setIsWithdrawalModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 sm:py-4 bg-orange text-white rounded-2xl font-black text-[11px] sm:text-xs uppercase tracking-widest hover:bg-orange-hover transition-all shadow-lg shadow-orange/15 active:scale-95"
          >
            <DollarSign size={16} /> Withdraw funds now
          </button>
        )}
      </div>

      {/* Primary Navigation System */}
      <div className="flex border-b border-cream-3 overflow-x-auto no-scrollbar scroll-smooth gap-1 pt-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        {[
          { id: 'products', label: 'Item Catalog', icon: Package },
          { id: 'orders', label: 'Store Orders', icon: ShoppingBag },
          { id: 'wallet', label: 'Wallet & Sheet', icon: DollarSign },
          { id: 'withdrawals', label: 'Cashouts history', icon: CreditCard },
          { id: 'settings', label: 'Store Settings', icon: Settings }
        ].map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'products' | 'orders' | 'wallet' | 'withdrawals' | 'settings')}
              id={`tab-btn-${tab.id}`}
              className={cn(
                "px-5 sm:px-7 py-4 text-[10px] sm:text-xs font-black uppercase tracking-[0.15em] border-b-2 font-syne flex items-center gap-2.5 transition-all whitespace-nowrap -mb-[2px] shrink-0",
                isActive 
                  ? "border-orange text-orange font-black" 
                  : "border-transparent text-muted hover:text-ink hover:border-cream-3"
              )}
            >
              <tab.icon size={14} className={isActive ? "text-orange" : "text-muted group-hover:text-ink"} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Main Content Layouts */}
      <div className="min-y-[450px]">
        {/* TAB 1: PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Filter systems */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="w-full sm:w-auto grid grid-cols-3 sm:flex items-center gap-1 sm:gap-1.5 bg-white p-1 rounded-xl border border-cream-3">
                {[
                  { id: 'all', label: 'All products' },
                  { id: 'active', label: 'Active status' },
                  { id: 'draft', label: 'Drafts catalog' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setProductFilterTab(item.id as 'all' | 'active' | 'draft')}
                    className={cn(
                      "px-1 sm:px-5 py-2 rounded-lg text-[7.5px] min-[360px]:text-[8.5px] sm:text-[9px] font-black uppercase tracking-wide sm:tracking-widest transition-all text-center whitespace-nowrap truncate",
                      productFilterTab === item.id 
                        ? "bg-ink text-white shadow-md shadow-ink/10" 
                        : "text-muted hover:text-ink hover:bg-cream-1"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="text"
                  placeholder="Search catalog products..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-cream-3 rounded-xl text-xs font-bold focus:outline-none focus:border-orange focus:bg-white transition-all bg-cream-1/30"
                />
              </div>
            </div>

            {loadingProducts ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="animate-spin text-orange" />
                <p className="text-xs uppercase tracking-widest font-black text-muted">Retrieving catalog records...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {filteredProducts.map(prod => (
                  <motion.div 
                    key={prod.id} 
                    className="group bg-white border border-cream-3 rounded-xl sm:rounded-[2rem] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Preview Block */}
                      <div className="relative aspect-[16/10] bg-cream-1 overflow-hidden">
                        {prod.coverImageUrl ? (
                          <img 
                            src={prod.coverImageUrl} 
                            alt={prod.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl sm:text-4xl text-muted font-black uppercase tracking-tight bg-gradient-to-br from-cream-1 to-cream-2 select-none">
                            <span className="opacity-25">{prod.title.slice(0, 2)}</span>
                          </div>
                        )}
                        <span className="absolute top-2 left-2 sm:top-4 sm:left-4 inline-flex px-1.5 sm:px-3 py-0.5 sm:py-1 bg-white/90 backdrop-blur-md rounded-full text-[7px] sm:text-[9px] font-black uppercase tracking-wider text-ink border border-cream-3 shadow-inner">
                          {prod.category}
                        </span>

                        <button
                          onClick={() => handleToggleProductActive(prod)}
                          className={cn(
                            "absolute top-2 right-2 sm:top-4 sm:right-4 inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[6px] sm:text-[8px] font-black uppercase tracking-wider shadow-md select-none transition-all",
                            prod.isActive 
                              ? "bg-green-100 text-green-700 border border-green-200" 
                              : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                          )}
                        >
                          <span className={cn("w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full", prod.isActive ? "bg-green-500 animate-pulse" : "bg-zinc-400")} />
                          {prod.isActive ? 'Active' : 'Draft'}
                        </button>
                      </div>

                      <div className="p-3 sm:p-6.5 space-y-1.5 sm:space-y-3">
                        <div className="space-y-0.5 sm:space-y-1">
                          <h3 className="font-syne font-black text-ink text-xs sm:text-lg uppercase tracking-tight group-hover:text-orange transition-colors duration-150 line-clamp-1">{prod.title}</h3>
                          <p className="text-muted text-[10px] sm:text-xs font-medium line-clamp-1 sm:line-clamp-2 leading-normal sm:leading-relaxed h-3.5 sm:h-8">{prod.description || 'No custom description supplied.'}</p>
                        </div>
                        
                        {/* Financial metrics list */}
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 border-t border-cream-2 pt-1.5 sm:pt-3 text-[7px] sm:text-[10px] text-muted font-bold uppercase tracking-wider">
                          <div>
                            <span className="block text-muted/50 text-[6px] sm:text-[8px]">Net Pricing</span>
                            <span className="font-black text-ink font-syne text-[10px] sm:text-sm">{formatPrice(prod.price)}</span>
                          </div>
                          <div className="text-right">
                            <span className="block text-muted/50 text-[6px] sm:text-[8px]">Catalog Sales</span>
                            <span className="font-black text-ink font-syne text-[10px] sm:text-sm">{prod.totalSales || 0} units</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operational controls */}
                    <div className="mx-2 mb-2.5 sm:mx-6.5 sm:mb-6 bg-cream-1/50 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex items-center justify-between border border-cream-2">
                      <button
                        onClick={() => {
                          setSelectedProduct(prod)
                          setIsProductModalOpen(true)
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2.5 text-[8px] sm:text-[9px] font-black text-muted uppercase tracking-widest rounded-lg sm:rounded-xl hover:bg-white hover:text-ink transition-all active:scale-95"
                      >
                        <Edit size={10} className="sm:w-3 sm:h-3" /> <span className="line-clamp-1">Edit Details</span>
                      </button>
                      
                      <div className="w-1" />

                      <button
                        onClick={() => handleDeleteProductClick(prod)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 sm:py-2.5 text-[8px] sm:text-[9px] font-black text-muted uppercase tracking-widest rounded-lg sm:rounded-xl hover:bg-orange/10 hover:text-orange transition-all active:scale-95"
                      >
                        <Trash2 size={10} className="sm:w-3 sm:h-3" /> <span className="line-clamp-1">Remove</span>
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-cream-3 rounded-3xl p-12 text-center text-muted col-span-3 space-y-4 shadow-sm">
                <Package size={44} className="mx-auto text-muted/30 animate-bounce" />
                <h4 className="font-syne font-black text-ink text-sm">No items matching filter found</h4>
                <p className="text-xs max-w-xs mx-auto leading-relaxed">Add a new digital item, or tweak search criteria, to inspect public materials.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Orders summary banner */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                { label: 'Total Revenue Gross', value: formatPrice(lifetimeEarningsRupees * 100), cardColor: 'bg-ink text-white', accent: 'bg-orange/20' },
                { label: 'Authorized Orders', value: `${totalSalesCount} units`, cardColor: 'bg-white border text-ink', accent: '' },
                { label: 'Pending Purchases', value: `${allOrders.filter(o => o.status === 'pending').length} units`, cardColor: 'bg-white border text-ink', accent: '' },
                { label: 'Refunded Transactions', value: `${allOrders.filter(o => o.status === 'refunded').length} units`, cardColor: 'bg-white border text-ink', accent: '' }
              ].map((item, idx) => (
                <div key={idx} className={cn("p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] space-y-1 relative overflow-hidden", item.cardColor)}>
                  {item.accent && <div className={cn("absolute right-0 top-0 w-24 h-24 blur-3xl rounded-full", item.accent)} />}
                  <span className="block text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-muted/70">{item.label}</span>
                  <h3 className="font-syne font-black text-sm sm:text-2xl mt-1 truncate">{item.value}</h3>
                </div>
              ))}
            </div>

            {/* Filter systems */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-cream-3 overflow-x-auto no-scrollbar w-full md:w-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                {[
                  { id: 'all', label: 'All history' },
                  { id: 'paid', label: 'Payments cleared' },
                  { id: 'pending', label: 'Pending clearance' },
                  { id: 'refunded', label: 'Refund log' }
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setOrderFilterTab(item.id as 'all' | 'paid' | 'pending' | 'refunded')}
                    className={cn(
                      "px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap shrink-0",
                      orderFilterTab === item.id 
                        ? "bg-ink text-white shadow-sm" 
                        : "text-muted hover:text-ink hover:bg-cream-1"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-80">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="text"
                  placeholder="Search buyer name/email..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white border border-cream-3 rounded-xl text-xs font-bold focus:outline-none focus:border-orange focus:bg-white transition-all bg-cream-1/30"
                />
              </div>
            </div>

            {loadingOrders ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="animate-spin text-orange" />
                <p className="text-xs uppercase tracking-widest font-black text-muted">Scanning customer ledger...</p>
              </div>
            ) : filteredOrders.length > 0 ? (
              <>
                {/* Desktop view */}
                <div className="hidden md:block bg-white border border-cream-3 rounded-3xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px] text-sm">
                      <thead>
                        <tr className="border-b border-cream-3 bg-cream-1/50 text-muted text-[10px] uppercase font-black tracking-widest">
                          <th className="py-4 pl-5">Customer Info</th>
                          <th className="py-4">Item Details</th>
                          <th className="py-4">Gross/Earnings</th>
                          <th className="py-4">Fulfillment Plan</th>
                          <th className="py-4">Created At</th>
                          <th className="py-4 pr-5 text-right">Fulfillment Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-3 text-ink">
                        {filteredOrders.map(o => {
                          const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date()
                          return (
                            <tr key={o.id} className="hover:bg-cream-1/20 transition-colors">
                              <td className="py-4 pl-5">
                                <div className="font-bold text-ink">{o.buyerName}</div>
                                <div className="text-[11px] text-muted font-mono">{o.buyerEmail}</div>
                                {o.buyerPhone && <div className="text-[9px] text-muted font-mono">{o.buyerPhone}</div>}
                              </td>
                              <td className="py-4">
                                <div className="font-bold text-ink max-w-[200px] truncate">{o.productTitle}</div>
                                <div className="text-[9px] text-muted font-mono">ID: {o.id.slice(0, 10).toLowerCase()}...</div>
                              </td>
                              <td className="py-4">
                                <div className="font-bold text-ink">{formatPrice(o.productPrice)}</div>
                                <div className="text-[10px] text-green-600 font-bold">Earned: {formatPrice(o.creatorEarnings)}</div>
                              </td>
                              <td className="py-4 pl-1">
                                {o.emailConsent ? (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[8px] font-black uppercase tracking-wider select-none border border-green-100">
                                    ✓ Marketing Ok
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-50 text-zinc-500 rounded text-[8px] font-black uppercase tracking-wider select-none border border-zinc-100">
                                    ✗ Out-out
                                  </span>
                                )}
                              </td>
                              <td className="py-4 text-xs font-bold text-muted font-mono">
                                {format(orderDate, 'MMM dd, yyyy HH:mm')}
                              </td>
                              <td className="py-4 text-right pr-5">
                                <div className="flex flex-col items-end gap-1">
                                  <span className={cn(
                                    "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                                    o.status === 'paid' || o.status === 'delivered'
                                      ? "bg-green-100 text-green-700 border border-green-200"
                                      : (o.status === 'refunded' ? "bg-zinc-100 text-zinc-600 border border-zinc-200" : "bg-amber-100 text-amber-700 border border-amber-200")
                                  )}>
                                    {o.status}
                                  </span>
                                  {(o.status === 'paid' || o.status === 'delivered') && (
                                    <button
                                      onClick={() => handleRefundOrder(o.id)}
                                      className="text-[9px] text-muted hover:text-orange font-black uppercase tracking-widest mt-1 hover:underline"
                                    >
                                      Refund buyer
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile view card list */}
                <div className="space-y-4 md:hidden">
                  {filteredOrders.map(o => {
                    const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date()
                    return (
                      <div key={o.id} className="bg-white border border-cream-3 rounded-2xl p-5 space-y-4 shadow-sm">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <div className="font-bold text-ink text-sm">{o.buyerName}</div>
                            <div className="text-[10px] text-muted font-mono">{o.buyerEmail}</div>
                            {o.buyerPhone && <div className="text-[9px] text-muted font-mono">{o.buyerPhone}</div>}
                          </div>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0",
                            o.status === 'paid' || o.status === 'delivered'
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : (o.status === 'refunded' ? "bg-zinc-100 text-zinc-600 border border-zinc-200" : "bg-amber-100 text-amber-700 border border-amber-200")
                          )}>
                            {o.status}
                          </span>
                        </div>

                        <div className="border-t border-cream-2 pt-3 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted font-bold uppercase tracking-wider text-[9px]">Product</span>
                            <span className="font-bold text-ink truncate max-w-[180px]">{o.productTitle}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted font-bold uppercase tracking-wider text-[9px]">Price Paid</span>
                            <span className="font-bold text-ink">{formatPrice(o.productPrice)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted font-bold uppercase tracking-wider text-[9px]">Your Earnings</span>
                            <span className="font-bold text-green-600">{formatPrice(o.creatorEarnings)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted font-bold uppercase tracking-wider text-[9px]">Date</span>
                            <span className="text-muted font-mono font-bold text-[10px]">{format(orderDate, 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted font-bold uppercase tracking-wider text-[9px]">Consent</span>
                            {o.emailConsent ? (
                              <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[8px] font-black uppercase border border-green-100">Marketing Ok</span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-zinc-50 text-zinc-500 rounded text-[8px] font-black uppercase border border-zinc-100">Opt-out</span>
                            )}
                          </div>
                        </div>

                        {(o.status === 'paid' || o.status === 'delivered') && (
                          <button
                            onClick={() => handleRefundOrder(o.id)}
                            className="w-full py-2.5 bg-orange/5 text-orange hover:bg-orange/10 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border border-orange/10 block text-center"
                          >
                            Refund buyer
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="bg-white border border-cream-3 rounded-3xl p-12 text-center text-muted space-y-4 shadow-sm">
                <ShoppingBag size={44} className="mx-auto text-muted/30 animate-pulse" />
                <h4 className="font-syne font-black text-ink text-sm">No transaction entries found</h4>
                <p className="text-xs max-w-xs mx-auto leading-relaxed">Buyers manifest once secure download checkouts complete on your public storefront.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: WALLET */}
        {activeTab === 'wallet' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Balance sheet cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Available */}
              <div className="p-5 sm:p-8 bg-gradient-to-br from-orange to-orange-hover text-white rounded-2xl sm:rounded-[2rem] shadow-xl space-y-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full" />
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">Available Balance</p>
                <div className="space-y-1">
                  <h2 className="font-syne font-black text-3xl sm:text-5xl tracking-tight">₹{availableBalanceRupees.toLocaleString()}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">Cleared and ready to withdraw instantly</p>
                </div>
                <button
                  onClick={() => setIsWithdrawalModalOpen(true)}
                  className="w-full py-3.5 bg-white text-orange hover:bg-cream-1 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-200 shadow-md flex items-center justify-center gap-2 pr-4 active:scale-95"
                >
                  <DollarSign size={14} /> Withdraw Now
                </button>
              </div>

              {/* Card 2: Pending */}
              <div className="p-5 sm:p-8 bg-white border border-cream-3 rounded-2xl sm:rounded-[2rem] shadow-sm space-y-5 relative overflow-hidden">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Pending Balance</p>
                <div className="space-y-1">
                  <h2 className="font-syne font-black text-3xl sm:text-5xl text-ink tracking-tight">₹{pendingBalanceRupees.toLocaleString()}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted/50">Scheduled checkouts awaiting clearing</p>
                </div>
                <div className="pt-2 text-[10px] text-muted font-bold uppercase tracking-wider flex items-center gap-1.5 border-t border-cream-2">
                  <Clock size={14} className="text-orange shrink-0" />
                  Standard 24-48h processing speed
                </div>
              </div>

              {/* Card 3: Lifetime metrics */}
              <div className="p-5 sm:p-8 bg-white border border-cream-3 rounded-2xl sm:rounded-[2rem] shadow-sm space-y-5 relative overflow-hidden">
                <p className="text-[10px] font-black text-muted uppercase tracking-widest font-syne">Lifetime Earnings</p>
                <div className="space-y-1">
                  <h2 className="font-syne font-black text-3xl sm:text-5xl text-ink tracking-tight">₹{lifetimeEarningsRupees.toLocaleString()}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted/50">Cumulative performance history gross</p>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-cream-2 pt-3 text-[9px] text-muted font-bold uppercase tracking-wider">
                  <div>
                    <span className="block text-muted/50 text-[8px]">Sales Volume</span>
                    <span className="font-black text-ink">{totalSalesCount} units</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-muted/50 text-[8px]">Order volume</span>
                    <span className="font-black text-ink">{totalOrdersCount} count</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent transactions log */}
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-syne font-black text-ink text-xl uppercase tracking-tighter">Recent Business Transactions</h3>
                <p className="text-muted text-[10px] font-black uppercase tracking-widest">A comprehensive log of buyer sales, refunds, and disbursal cashouts</p>
              </div>

              {transactions.length > 0 ? (
                <>
                  {/* Desktop Transactions Table */}
                  <div className="hidden md:block bg-white border border-cream-3 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[650px] text-sm">
                        <thead>
                          <tr className="border-b border-cream-3 bg-cream-1/50 text-muted text-[10px] uppercase font-black tracking-widest">
                            <th className="py-4 pl-5">Event Date</th>
                            <th className="py-4">Type</th>
                            <th className="py-4">Description</th>
                            <th className="py-4 text-center">Amount</th>
                            <th className="py-4 pr-5 text-right">Event Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-3 text-ink">
                          {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-cream-1/10 transition-colors">
                              <td className="py-4 pl-5 font-mono text-xs text-muted font-bold">
                                {format(tx.date, 'MMM dd, yyyy HH:mm')}
                              </td>
                              <td className="py-4">
                                <span className={cn(
                                  "inline-flex px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                                  tx.type === 'Sale' 
                                    ? "bg-green-50 text-green-700 border-green-100" 
                                    : (tx.type === 'Refund' ? "bg-orange/5 text-orange border-orange/10" : "bg-blue-50 text-blue-700 border-blue-100")
                                )}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="py-4 font-bold text-xs text-ink max-w-[300px] truncate">
                                {tx.description}
                              </td>
                              <td className={cn(
                                "py-4 text-center font-black font-syne text-sm",
                                tx.amount > 0 ? "text-green-600" : "text-ink"
                              )}>
                                {tx.amount > 0 ? `+₹${tx.amount.toLocaleString()}` : `-₹${Math.abs(tx.amount).toLocaleString()}`}
                              </td>
                              <td className="py-4 text-right pr-5 text-xs">
                                <span className={cn(
                                  "font-bold uppercase tracking-wider text-[10px]",
                                  (tx.status === 'Completed' || tx.status === 'Received') ? "text-green-600" : (tx.status === 'Pending' ? "text-amber-500" : "text-muted")
                                )}>
                                  ● {tx.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Mobile Transactions Card list */}
                  <div className="space-y-3 md:hidden">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="bg-white border border-cream-3 rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <span className={cn(
                              "inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border",
                              tx.type === 'Sale' 
                                ? "bg-green-50 text-green-700 border-green-100" 
                                : (tx.type === 'Refund' ? "bg-orange/5 text-orange border-orange/10" : "bg-blue-50 text-blue-700 border-blue-100")
                            )}>
                              {tx.type}
                            </span>
                            <div className="font-bold text-xs text-ink max-w-[200px] truncate">{tx.description}</div>
                          </div>
                          <div className="text-right space-y-0.5 shrink-0">
                            <div className={cn(
                              "font-black font-syne text-sm",
                              tx.amount > 0 ? "text-green-600" : "text-ink"
                            )}>
                              {tx.amount > 0 ? `+₹${tx.amount.toLocaleString()}` : `-₹${Math.abs(tx.amount).toLocaleString()}`}
                            </div>
                            <div className="text-[9px] text-muted font-mono font-bold">
                              {format(tx.date, 'MMM dd, HH:mm')}
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-[10px] border-t border-cream-2 pt-2.5">
                          <span className="text-muted font-bold uppercase tracking-wider text-[8px]">Status</span>
                          <span className={cn(
                            "font-black uppercase tracking-wider text-[9px]",
                            (tx.status === 'Completed' || tx.status === 'Received') ? "text-green-600" : (tx.status === 'Pending' ? "text-amber-500" : "text-muted")
                          )}>
                            ● {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-white border border-cream-3 rounded-2xl p-12 text-center text-muted shadow-sm">
                  <CreditCard size={40} className="mx-auto text-muted/30 animate-pulse mb-3" />
                  <h4 className="font-bold text-ink text-sm">No transaction occurrences recorded yet</h4>
                  <p className="text-xs max-w-sm mx-auto leading-relaxed">Transactions pop up here automatically when you generate digital products sales or execute withdrawal requests.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: WITHDRAWALS */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Title / Description */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-cream-2 pb-5">
              <div className="space-y-1">
                <h3 className="font-syne font-black text-ink text-xl uppercase tracking-tighter">Settlement Disbursals Registry</h3>
                <p className="text-muted text-[10px] font-black uppercase tracking-widest">History log of requested funds transfers to bank accounts or UPI handles</p>
              </div>
              <button 
                onClick={() => setIsWithdrawalModalOpen(true)}
                className="px-6 py-3 bg-ink text-white hover:bg-orange hover:text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all active:scale-95 text-center shrink-0 shadow"
              >
                Request Withdrawal Cashout
              </button>
            </div>

            {loadingWithdrawals ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="animate-spin text-orange" />
                <p className="text-xs uppercase tracking-widest font-black text-muted">Scanning disbursal schedules...</p>
              </div>
            ) : withdrawals.length > 0 ? (
              <>
                {/* Desktop Withdrawals Table */}
                <div className="hidden md:block bg-white border border-cream-3 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px] text-sm">
                      <thead>
                        <tr className="border-b border-cream-3 bg-cream-1/50 text-muted text-[10px] uppercase font-black tracking-widest">
                          <th className="py-4 pl-5">Requested On</th>
                          <th className="py-4">Route Type</th>
                          <th className="py-4">Transferred Destination</th>
                          <th className="py-4 text-center">Amount Requested</th>
                          <th className="py-4 text-center">System Reference</th>
                          <th className="py-4 pr-5 text-right">Settlement Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cream-3 text-ink">
                        {withdrawals.map((w) => {
                          const date = w.createdAt?.toDate ? w.createdAt.toDate() : new Date()
                          return (
                            <tr key={w.id} className="hover:bg-cream-1/10 transition-colors">
                              <td className="py-4 pl-5 font-mono text-xs text-muted font-bold">
                                {format(date, 'MMM dd, yyyy HH:mm')}
                              </td>
                              <td className="py-2.5">
                                <span className="px-2.5 py-1 text-[8px] font-black uppercase tracking-wider rounded bg-cream-1 border border-cream-3">
                                  {w.paymentMethod === 'upi' ? 'UPI Handle' : 'Bank Disbursal'}
                                </span>
                              </td>
                              <td className="py-4 font-bold text-xs">
                                {w.paymentMethod === 'upi' ? (
                                  <span className="font-mono text-ink">{w.upiId}</span>
                                ) : (
                                  <div className="space-y-0.5">
                                    <div className="font-syne uppercase text-ink">{w.accountHolderName}</div>
                                    <div className="text-[10px] text-muted font-mono">{w.bankName} • A/C: {w.accountNumber?.slice(-4).padStart(10, '*')}</div>
                                  </div>
                                )}
                              </td>
                              <td className="py-4 text-center font-black font-syne text-sm text-ink text-orange-hover">
                                ₹{w.amount.toLocaleString()}
                              </td>
                              <td className="py-4 text-center font-mono text-xs font-bold text-muted">
                                {w.referenceNumber || 'AWAITING'}
                              </td>
                              <td className="py-4 text-right pr-5">
                                <span className={cn(
                                  "inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider select-none border",
                                  (w.status === 'paid' || w.status === 'completed') 
                                    ? "bg-green-100 text-green-700 border-green-200" 
                                    : (w.status === 'pending' ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200")
                                )}>
                                  {(w.status === 'paid' || w.status === 'completed') ? 'completed' : w.status}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mobile Withdrawals Card List */}
                <div className="space-y-3.5 md:hidden">
                  {withdrawals.map((w) => {
                    const date = w.createdAt?.toDate ? w.createdAt.toDate() : new Date()
                    return (
                      <div key={w.id} className="bg-white border border-cream-3 rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                        <div className="flex justify-between items-start gap-2">
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded bg-cream-1 border border-cream-3">
                              {w.paymentMethod === 'upi' ? 'UPI' : 'Bank Disbursal'}
                            </span>
                            <div className="pt-1 select-all font-mono font-medium text-xs text-ink">
                              {w.paymentMethod === 'upi' ? (
                                <span className="font-semibold">{w.upiId}</span>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="font-syne font-black text-ink uppercase text-[11px]">{w.accountHolderName}</div>
                                  <div className="text-[10px] text-muted">{w.bankName} • {w.accountNumber?.slice(-4).padStart(8, '*')}</div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right space-y-0.5">
                            <div className="font-black font-syne text-sm text-ink">
                              ₹{w.amount.toLocaleString()}
                            </div>
                            <div className="text-[9px] text-muted font-mono font-bold">
                              {format(date, 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-cream-2 pt-2.5 flex justify-between items-center text-xs">
                          <div>
                            <span className="block text-muted text-[8px] font-bold uppercase tracking-wider">Ref No</span>
                            <span className="font-mono text-[10px] font-bold text-muted">{w.referenceNumber || 'AWAITING'}</span>
                          </div>
                          <div className="text-right">
                            <span className={cn(
                              "inline-flex px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider select-none border",
                              (w.status === 'paid' || w.status === 'completed') 
                                ? "bg-green-100 text-green-700 border-green-200" 
                                : (w.status === 'pending' ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-red-100 text-red-700 border-red-200")
                            )}>
                              {(w.status === 'paid' || w.status === 'completed') ? 'completed' : w.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="bg-white border border-cream-3 rounded-2xl p-12 text-center text-muted shadow-sm">
                <CreditCard size={40} className="mx-auto text-muted/30 animate-pulse mb-3" />
                <h4 className="font-bold text-ink text-sm">No withdrawals historical runs registered</h4>
                <p className="text-xs max-w-sm mx-auto leading-relaxed">Ensure Available segment is at least ₹200, then click top button to draft your first bank disbursal scheduling request.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: STORE SETTINGS */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto animate-in fade-in duration-200">
            <form onSubmit={handleSaveSettingsSubmit} className="bg-white border border-cream-3 rounded-[2.5rem] p-6 sm:p-10 space-y-8 shadow-sm">
              <div className="border-b border-cream-2 pb-5 space-y-1">
                <h3 className="font-syne font-black text-2xl uppercase tracking-tighter text-ink">Store Settings Portal</h3>
                <p className="text-muted text-[10px] font-black uppercase tracking-widest">Adjust default checkout text, currencies, refund schedules, and Terms</p>
              </div>

              {/* Form elements */}
              <div className="space-y-6">
                
                {/* Store Name & Currency row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Store Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Rahul's Creative Assets"
                      value={storeName}
                      onChange={e => setStoreName(e.target.value)}
                      className="w-full px-4 py-4 bg-cream-1 border-2 border-transparent rounded-2xl text-xs font-bold focus:border-orange focus:bg-white focus:outline-none transition-all"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Store Currency</label>
                    <select
                      value={storeCurrency}
                      onChange={e => setStoreCurrency(e.target.value)}
                      className="w-full px-4 py-4 bg-cream-1 border-2 border-transparent rounded-2xl text-xs font-bold focus:border-orange focus:bg-white focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="INR">INR (₹) Indian Rupee</option>
                      <option value="USD">USD ($) Dollars</option>
                      <option value="EUR">EUR (€) Euros</option>
                      <option value="GBP">GBP (£) Pounds</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Store Description / Subtitle</label>
                  <textarea 
                    rows={3}
                    placeholder="Describe your premium books, source files, or educational videos to checkouts..."
                    value={storeDescription}
                    onChange={e => setStoreDescription(e.target.value)}
                    className="w-full px-4 py-4 bg-cream-1 border-2 border-transparent rounded-2xl text-xs font-bold focus:border-orange focus:bg-white focus:outline-none transition-all leading-relaxed"
                  />
                </div>

                {/* Default Download message */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 ml-1">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Default Download Message</label>
                    <span className="text-[8px] bg-ink/5 text-muted px-1.5 py-0.5 rounded uppercase font-black tracking-widest">Recommended</span>
                  </div>
                  <textarea 
                    rows={3}
                    placeholder="e.g. Thank you for your purchase! Here is your secure download link. Reach out to support for inquiry."
                    value={defaultDownloadMessage}
                    onChange={e => setDefaultDownloadMessage(e.target.value)}
                    className="w-full px-4 py-4 bg-cream-1 border-2 border-transparent rounded-2xl text-xs font-bold focus:border-orange focus:bg-white focus:outline-none transition-all leading-relaxed"
                  />
                  <p className="text-[10px] text-muted ml-1 leading-relaxed">This custom text is shown directly to verified buyers on the checkout success dialog, and appended to their secure delivery receipts.</p>
                </div>

                {/* Refund Policy & Terms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Refund & Return Policy</label>
                    <textarea 
                      rows={4}
                      placeholder="e.g. Due to the immediate download nature of digital products, refunds are only issued if the download fails..."
                      value={refundPolicy}
                      onChange={e => setRefundPolicy(e.target.value)}
                      className="w-full px-4 py-4 bg-cream-1 border-2 border-transparent rounded-2xl text-xs font-bold focus:border-orange focus:bg-white focus:outline-none transition-all leading-relaxed h-32"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Terms of Service</label>
                    <textarea 
                      rows={4}
                      placeholder="e.g. By completing this purchase, you agree to a single personal license. Redistribution of items is strictly prohibited..."
                      value={termsAndConditions}
                      onChange={e => setTermsAndConditions(e.target.value)}
                      className="w-full px-4 py-4 bg-cream-1 border-2 border-transparent rounded-2xl text-xs font-bold focus:border-orange focus:bg-white focus:outline-none transition-all leading-relaxed h-32"
                    />
                  </div>
                </div>

                {/* Toggles row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-cream-2 pt-6">
                  {/* Toggle 1: Visibility */}
                  <div className="flex items-center justify-between p-4.5 bg-cream-1/50 rounded-2xl border border-cream-2">
                    <div className="space-y-0.5 pr-2">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-ink">Public Storefront Visibility</span>
                      <span className="block text-[8px] text-muted font-bold uppercase tracking-wider">Keep products open to the public catalog</span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={storeVisibility}
                        onChange={e => setStoreVisibility(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-cream-3 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-cream-3 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange" />
                    </label>
                  </div>

                  {/* Toggle 2: Digital Delivery Settings */}
                  <div className="flex items-center justify-between p-4.5 bg-cream-1/50 rounded-2xl border border-cream-2">
                    <div className="space-y-0.5 pr-2">
                      <span className="block text-[10px] font-black uppercase tracking-wider text-ink">Secure Digital Email Transmittals</span>
                      <span className="block text-[8px] text-muted font-bold uppercase tracking-wider">Auto-email digital attachments to buyers</span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={digitalDeliverySettings}
                        onChange={e => setDigitalDeliverySettings(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-cream-3 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-cream-3 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange" />
                    </label>
                  </div>
                </div>

              </div>

              {/* Submit button block */}
              <button
                type="submit"
                disabled={isSavingSettings}
                className="w-full py-4.5 bg-orange hover:bg-orange-hover text-white rounded-2xl font-black text-xs uppercase tracking-widest outline-none transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-orange/15"
              >
                {isSavingSettings ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving settings information...
                  </>
                ) : (
                  'Save Settings Information'
                )}
              </button>

            </form>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modals */}
      <AddEditProductModal 
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        product={selectedProduct}
        uid={uid || ''}
        onSave={() => {
          loadProductsData()
          setIsProductModalOpen(false)
        }}
      />

      {/* Withdraw Modal */}
      <WithdrawalModal 
        isOpen={isWithdrawalModalOpen}
        onClose={() => setIsWithdrawalModalOpen(false)}
        availableBalance={availableBalanceRupees}
        uid={uid || ''}
        onSubmitSuccess={() => {
          loadWithdrawalsData()
          loadOrdersData()
        }}
      />

      {/* Delete Confirmation Popup Card */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
              onClick={() => setProductToDelete(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden z-10 p-6 sm:p-8 space-y-6 border border-cream-3"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-orange/10 text-orange rounded-full flex items-center justify-center shadow-inner">
                  <AlertCircle size={24} className="animate-pulse" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="font-syne font-black text-ink text-base uppercase tracking-tight">Confirm Deletion</h3>
                  <p className="text-xs text-muted leading-relaxed max-w-[280px]">
                    Are you absolutely sure you want to permanently delete <span className="font-black text-ink">{productToDelete.title}</span>? This action is irreversible.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  className="flex-1 py-3 bg-cream-1 hover:bg-cream-2 text-ink rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-200 active:scale-95 border border-cream-3 text-center"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDeleteProduct(productToDelete.id)}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all duration-200 active:scale-95 shadow-md shadow-red-600/15 text-center"
                >
                  Yes, Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
