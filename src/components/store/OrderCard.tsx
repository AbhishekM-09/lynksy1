import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  CheckCircle2, Clock, AlertCircle, 
  ChevronRight,
  Mail, Phone, RefreshCcw
} from 'lucide-react'
import { Order } from '@/types/store'
import { formatPrice } from '@/utils/storeUtils'
import { cn } from '@/utils/formatters'
import { formatDistanceToNow } from 'date-fns'

interface OrderCardProps {
  order: Order
  onRefund: (orderId: string) => void
}

export function OrderCard({ order, onRefund }: OrderCardProps) {
  const [showConfirmRefund, setShowConfirmRefund] = useState(false)

  const statusTags = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: Clock },
    paid: { label: 'Paid', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    delivered: { label: 'Delivered', color: 'bg-blue-100 text-blue-700', icon: CheckCircle2 },
    refunded: { label: 'Refunded', color: 'bg-red-100 text-red-700', icon: AlertCircle },
    failed: { label: 'Failed', color: 'bg-ink/10 text-ink', icon: AlertCircle }
  }

  const status = statusTags[order.status] || statusTags.failed
  const Icon = status.icon

  return (
    <div className="bg-white border border-cream-3 rounded-2xl overflow-hidden mb-4 hover:shadow-lg transition-all duration-300 w-full min-w-0">
      <div className="p-3 sm:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 w-full min-w-0">
          <div className="flex items-start gap-2.5 sm:gap-4 min-w-0 flex-1">
            <div className={cn("w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0", status.color)}>
              <Icon size={18} className="sm:w-6 sm:h-6" />
            </div>
            
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <h4 className="font-syne font-black text-xs sm:text-sm uppercase tracking-tight truncate max-w-[140px] sm:max-w-none">{order.buyerName}</h4>
                <div className={cn("text-[7px] sm:text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full whitespace-nowrap", status.color)}>
                  {status.label}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-widest min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <Mail size={10} className="shrink-0" />
                  <span className="truncate max-w-[160px] sm:max-w-none">{order.buyerEmail}</span>
                </div>
                {order.buyerPhone && (
                   <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <Phone size={10} className="shrink-0" />
                    {order.buyerPhone}
                  </div>
                )}
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <Clock size={10} className="shrink-0" />
                  {formatDistanceToNow(order.createdAt.toDate(), { addSuffix: true })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-8 pt-2.5 md:pt-0 border-t md:border-t-0 border-cream-2 min-w-0">
            <div className="text-left md:text-right min-w-0">
              <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-muted mb-0.5 sm:mb-1 truncate max-w-[140px] sm:max-w-[200px]">{order.productTitle}</p>
              <p className="font-syne font-black text-sm sm:text-lg text-orange">{formatPrice(order.productPrice)}</p>
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
               {order.status === 'paid' && (
                 <button 
                  onClick={() => setShowConfirmRefund(true)}
                  className="w-8 h-8 sm:w-10 sm:h-10 bg-red-50 text-red-500 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all transform active:scale-90"
                  title="Refund Order"
                 >
                   <RefreshCcw size={14} className="sm:w-4 sm:h-4" />
                 </button>
               )}
               <button 
                onClick={() => window.open(order.downloadUrl, '_blank')}
                disabled={!order.downloadToken || order.status !== 'paid'}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-cream text-ink rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-ink hover:text-white transition-all disabled:opacity-30 transform active:scale-90"
               >
                 <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
               </button>
            </div>
          </div>
        </div>

        {order.status === 'paid' && (
          <div className="mt-4 pt-4 border-t border-cream-2 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Downloads: {order.downloadCount} / {order.maxDownloads}
             </div>
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted">
                <div className="w-1.5 h-1.5 rounded-full bg-orange" />
                Token: <span className="text-ink">{order.downloadToken.slice(0, 8)}...</span>
             </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showConfirmRefund && (
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="bg-red-50 overflow-hidden"
          >
            <div className="p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <AlertCircle className="text-red-500" size={20} />
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-700">Confirm refund for {order.buyerName}?</p>
                    <p className="text-[9px] font-bold text-red-600/60 uppercase tracking-widest">Note: Actual refund must be processed in Razorpay Dashboard.</p>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowConfirmRefund(false)}
                    className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-muted"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                        onRefund(order.id)
                        setShowConfirmRefund(false)
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20"
                  >
                    Confirm Refund
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
