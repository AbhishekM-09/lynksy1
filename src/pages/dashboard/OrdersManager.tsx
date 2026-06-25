/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  ShoppingBag, Search, Download
} from 'lucide-react'
import { Order } from '@/types/store'
import { useAuthStore } from '@/store/authStore'
import { getOrders, refundOrder } from '@/firebase/store'
import { OrderCard } from '@/components/store/OrderCard'
import { formatPrice } from '@/utils/storeUtils'
import { cn } from '@/utils/formatters'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Navigate } from 'react-router-dom'

export default function OrdersManager() {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'paid' | 'pending' | 'refunded'>('all')

  const loadOrders = useCallback(async () => {
    if (!user?.uid) return
    try {
      const data = await getOrders(user.uid, 500)
      setOrders(data)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  const handleRefund = async (id: string) => {
     try {
         await refundOrder(user!.uid, id)
         toast.success('Order status updated')
         loadOrders()
     } catch (e) {
         toast.error('Failed to update status')
     }
  }

  const exportCSV = () => {
    if (orders.length === 0) return
    
    const headers = ['Date', 'Buyer Name', 'Email', 'Product', 'Amount (₹)', 'Status', 'Order ID']
    const csvData = orders.map(o => [
      format(o.createdAt.toDate(), 'yyyy-MM-dd HH:mm:ss'),
      `"${o.buyerName}"`,
      o.buyerEmail,
      `"${o.productTitle}"`,
      o.productPrice / 100,
      o.status.toUpperCase(),
      o.id
    ])
    
    const csvContent = [headers, ...csvData].map(e => e.join(',')).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `lynksy-orders-${format(new Date(), 'yyyy-MM-dd')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filtered = orders
    .filter(o => {
      if (activeTab === 'paid') return o.status === 'paid' || o.status === 'delivered'
      if (activeTab === 'pending') return o.status === 'pending'
      if (activeTab === 'refunded') return o.status === 'refunded'
      return true
    })
    .filter(o => (
      o.buyerName.toLowerCase().includes(search.toLowerCase()) || 
      o.buyerEmail.toLowerCase().includes(search.toLowerCase()) ||
      o.productTitle.toLowerCase().includes(search.toLowerCase())
    ))

  const totalRevenue = orders
    .filter(o => o.status === 'paid' || o.status === 'delivered')
    .reduce((sum, o) => sum + o.creatorEarnings, 0)

  if (user && user.plan !== 'PRO_PLUS') {
    return <Navigate to="/dashboard/store" replace />
  }

  return (
    <div className="px-0 sm:px-8 py-4 sm:py-8 max-w-7xl mx-auto space-y-8 sm:space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-3 sm:px-0">
        <div>
           <div className="flex items-center gap-2 mb-2 text-muted">
                <ShoppingBag size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Transaction Registry</span>
            </div>
           <h1 className="font-syne font-black text-2xl sm:text-4xl uppercase tracking-tighter">Orders</h1>
        </div>
        
        <button 
          onClick={exportCSV}
          className="px-8 py-3 sm:py-4 bg-white border border-cream-3 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest text-ink hover:bg-ink hover:text-white transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 px-3 sm:px-0">
          <div className="bg-ink p-4 sm:p-6 rounded-3xl sm:rounded-[2.5rem] space-y-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange/20 blur-3xl rounded-full" />
              <p className="text-white/40 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Total Earned</p>
              <h3 className="text-white font-syne font-black text-xl sm:text-2xl">{formatPrice(totalRevenue)}</h3>
          </div>
          <div className="bg-white border border-cream-3 p-4 sm:p-6 rounded-3xl sm:rounded-[2.5rem] space-y-1">
              <p className="text-muted text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Paid Orders</p>
              <h3 className="text-ink font-syne font-black text-xl sm:text-2xl">{orders.filter(o => o.status === 'paid').length}</h3>
          </div>
          <div className="bg-white border border-cream-3 p-4 sm:p-6 rounded-3xl sm:rounded-[2.5rem] space-y-1">
              <p className="text-muted text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Pending</p>
              <h3 className="text-ink font-syne font-black text-xl sm:text-2xl">{orders.filter(o => o.status === 'pending').length}</h3>
          </div>
          <div className="bg-white border border-cream-3 p-4 sm:p-6 rounded-3xl sm:rounded-[2.5rem] space-y-1">
              <p className="text-muted text-[8px] sm:text-[9px] font-black uppercase tracking-widest">Refunded</p>
              <h3 className="text-ink font-syne font-black text-xl sm:text-2xl">{orders.filter(o => o.status === 'refunded').length}</h3>
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between px-3 sm:px-0">
         <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-cream-3 overflow-x-auto no-scrollbar w-full lg:w-auto">
             {['all', 'paid', 'pending', 'refunded'].map((tab) => (
               <button
                key={tab}
                onClick={() => setActiveTab(tab as 'all' | 'paid' | 'pending' | 'refunded')}
                className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    activeTab === tab 
                        ? "bg-orange text-white shadow-lg shadow-orange/20" 
                        : "text-muted hover:text-ink hover:bg-cream-1"
                )}
               >
                 {tab}
               </button>
             ))}
         </div>

         <div className="relative w-full lg:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search by buyer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-cream-3 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange transition-all"
            />
         </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
           {[1,2,3,4,5].map(i => <div key={i} className="h-28 bg-white border border-cream-3 rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-cream-3 rounded-[3rem] p-20 text-center space-y-6">
            <div className="w-20 h-20 bg-cream rounded-full flex items-center justify-center mx-auto text-muted/30">
                <ShoppingBag size={32} />
            </div>
            <p className="text-muted text-sm font-black uppercase tracking-widest">No matching orders found</p>
        </div>
      ) : (
        <div className="space-y-4 pb-20">
           {filtered.map(order => (
             <motion.div
               key={order.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
             >
               <OrderCard order={order} onRefund={handleRefund} />
             </motion.div>
           ))}
        </div>
      )}
    </div>
  )
}
