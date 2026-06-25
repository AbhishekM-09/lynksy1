import { Printer, X } from 'lucide-react'
import { Invoice } from '@/types'
import { motion, AnimatePresence } from 'motion/react'

interface InvoiceModalProps {
  invoice: Invoice | null
  onClose: () => void
}

export function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  if (!invoice) return null

  const handlePrint = () => {
    window.print()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center p-6 border-b border-cream-3">
             <h3 className="text-lg font-bold text-ink">Invoice Detail</h3>
             <button onClick={onClose} className="p-2 hover:bg-cream-2 rounded-xl transition-colors">
                <X size={20} />
             </button>
          </div>

          <div id="invoice-content" className="p-10 space-y-10 bg-white">
             <div className="flex justify-between items-start">
                <div>
                   <h1 className="text-3xl font-black text-ink mb-2">Lynksy.</h1>
                   <p className="text-xs text-muted">Smart Link-in-Bio for Bharat</p>
                </div>
                <div className="text-right">
                   <p className="text-xs font-bold uppercase text-muted tracking-widest mb-1">Invoice Number</p>
                   <p className="text-lg font-black text-ink">{invoice.invoiceNumber}</p>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-10 border-y border-cream-2 py-8">
                <div>
                   <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Bill From</p>
                   <p className="text-sm font-bold text-ink underline">Lynksy Bharat Pvt Ltd</p>
                   <p className="text-xs text-muted mt-1 leading-relaxed">
                      Creative Block, Link Road,<br />
                      Bengaluru, Karnataka 560001<br />
                      India
                   </p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Billing Date</p>
                   <p className="text-sm font-bold text-ink">{invoice.billingDate.toDate().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
                </div>
             </div>

             <div>
                <table className="w-full text-left">
                   <thead>
                      <tr className="border-b-2 border-ink">
                         <th className="py-4 text-[10px] font-bold text-muted uppercase tracking-widest">Description</th>
                         <th className="py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-center">Plan</th>
                         <th className="py-4 text-[10px] font-bold text-muted uppercase tracking-widest text-right">Amount</th>
                      </tr>
                   </thead>
                   <tbody>
                      <tr className="border-b border-cream-2">
                         <td className="py-6">
                            <p className="text-sm font-bold text-ink leading-tight">Lynksy Premium Subscription</p>
                            <p className="text-[10px] text-muted mt-1 uppercase font-bold tracking-wide">Period: {invoice.planType}</p>
                         </td>
                         <td className="py-6 text-center">
                            <span className="px-2 py-1 bg-ink text-white text-[9px] font-black rounded-lg">{invoice.plan}</span>
                         </td>
                         <td className="py-6 text-right">
                            <p className="text-sm font-black text-ink">₹{invoice.amount.toLocaleString('en-IN')}</p>
                         </td>
                      </tr>
                   </tbody>
                </table>
             </div>

             <div className="flex justify-end pt-4">
                <div className="w-48 space-y-3">
                   <div className="flex justify-between text-xs text-muted font-bold">
                      <span>Subtotal</span>
                      <span>₹{invoice.amount.toLocaleString('en-IN')}</span>
                   </div>
                   <div className="flex justify-between text-xs text-muted font-bold">
                      <span>Tax (GST 18%)</span>
                      <span>₹0</span>
                   </div>
                   <div className="flex justify-between text-lg font-black text-ink pt-3 border-t border-ink">
                      <span>Total</span>
                      <span>₹{invoice.amount.toLocaleString('en-IN')}</span>
                   </div>
                </div>
             </div>

             <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs font-black text-green-600 uppercase tracking-widest">Payment Status: {invoice.status}</p>
             </div>
          </div>

          <div className="p-6 bg-cream-1 border-t border-cream-3 flex justify-end gap-4 no-print">
             <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-3 bg-white border border-cream-3 rounded-xl text-xs font-bold text-ink hover:bg-cream-2 transition-all">
                <Printer size={16} /> Print/PDF
             </button>
             <button onClick={onClose} className="px-6 py-3 bg-ink text-white rounded-xl text-xs font-bold hover:shadow-xl transition-all">
                Close
             </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
