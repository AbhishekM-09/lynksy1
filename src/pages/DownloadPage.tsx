import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '@/firebase/config'
import { doc, getDoc, addDoc, serverTimestamp, collection } from 'firebase/firestore'
import { ShoppingBag, Download, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react'
import { Spinner } from '@/components/ui/Spinner'
import { motion } from 'motion/react'
import type { Order, Product } from '@/types'
import { toast } from 'react-hot-toast'

export default function DownloadPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<Order | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) return
      setLoading(true)
      try {
        const orderSnap = await getDoc(doc(db, 'orders', orderId))
        if (!orderSnap.exists()) {
          setError('Order not found')
          setLoading(false)
          return
        }
        const orderData = orderSnap.data() as Order
        
        // Secure Token Verification
        const urlParams = new URLSearchParams(window.location.search)
        const tokenFromUrl = urlParams.get('token')
        
        if (!tokenFromUrl || tokenFromUrl !== orderData.downloadToken) {
          setError('Invalid or expired download token')
          setLoading(false)
          return
        }

        if (orderData.paymentStatus !== 'COMPLETED') {
          setError('Payment for this order has not been completed')
          setLoading(false)
          return
        }

        setOrder({ id: orderSnap.id, ...orderData })

        const productPath = `users/${orderData.creatorId}/products/${orderData.productId}`
        const productSnap = await getDoc(doc(db, productPath))
        if (productSnap.exists()) {
          setProduct({ id: productSnap.id, ...productSnap.data() } as Product)
        }
      } catch (err) {
        console.error('Fetch error:', err)
        setError('Failed to load access page')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [orderId])

  const handleDownload = async () => {
    if (!order || !product) return

    try {
      // Record download
      await addDoc(collection(db, 'downloads'), {
        orderId: order.id,
        productId: product.id,
        downloadCount: 1,
        lastDownloadedAt: serverTimestamp(),
        ipAddress: 'simulated' // In real env, we'd get this from server
      })

      // Trigger download
      if (product.fileUrl) {
         window.open(product.fileUrl, '_blank')
         toast.success('Starting download...')
      }
    } catch (err) {
      console.error('Download error:', err)
      toast.error('Download failed')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-4">
          <Spinner size="lg" />
        </div>
        <p className="text-[#0D0A08] font-bold">Verifying Access...</p>
      </div>
    )
  }

  if (error || !order || !product) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
           <AlertCircle size={40} />
        </div>
        <h1 className="text-2xl font-black text-ink mb-2">Access Denied</h1>
        <p className="text-muted mb-8 max-w-xs">{error || "We couldn't verify your purchase access."}</p>
        <Link to="/" className="bg-ink text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2">
           <ArrowLeft size={18} /> Back to Lynksy
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col">
      {/* Navbar Style Header */}
      <div className="bg-white border-b border-cream-3 py-4 px-6 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange text-white rounded-lg flex items-center justify-center">
               <ShoppingBag size={18} />
            </div>
            <span className="font-black text-ink tracking-tight">Lynksy Delivery</span>
         </div>
         <div className="flex items-center gap-2 bg-green-50 text-green-600 px-3 py-1.5 rounded-full border border-green-100">
            <ShieldCheck size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">Verified Order</span>
         </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
         <motion.div 
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           className="w-full max-w-xl"
         >
            <div className="card-premium overflow-hidden">
               <div className="p-8 md:p-12 text-center border-b border-cream-3">
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] overflow-hidden mx-auto mb-8 shadow-2xl skew-y-3 hover:skew-y-0 transition-transform duration-500">
                     {product.imageUrl ? (
                       <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full bg-cream-3 flex items-center justify-center text-muted">
                          <ShoppingBag size={48} />
                       </div>
                     )}
                  </div>

                  <h1 className="text-3xl md:text-4xl font-black text-ink mb-4 tracking-tight leading-tight">
                    {product.name}
                  </h1>
                  
                  <div className="flex flex-wrap justify-center gap-3 mb-8">
                     <span className="bg-orange/10 text-orange text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                       {product.category}
                     </span>
                     <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                       Digital Delivery
                     </span>
                     <span className="bg-ink/5 text-ink text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
                       {product.fileType?.split('/')[1]?.toUpperCase() || 'Digital'} File
                     </span>
                  </div>

                  <p className="text-muted text-lg mb-10 leading-relaxed max-w-md mx-auto italic font-medium">
                    "{product.description || 'Access your purchased assets below.'}"
                  </p>

                  <button
                    onClick={handleDownload}
                    className="group relative w-full bg-orange text-white py-6 px-10 rounded-[24px] font-black text-xl shadow-2xl shadow-orange/30 hover:scale-[1.02] active:scale-95 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                    <span className="flex items-center justify-center gap-3">
                       Download File <Download size={24} className="group-hover:translate-y-1 transition-transform" />
                    </span>
                  </button>

                  <p className="mt-6 text-[10px] font-bold text-muted uppercase tracking-[0.2em] opacity-40">
                    Order Ref: {order.id.substring(0, 12)}...
                  </p>
               </div>

               <div className="p-8 bg-cream/20 grid grid-cols-2 gap-8 md:gap-12">
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">Delivery Details</h4>
                    <p className="text-sm font-bold text-ink truncate">{order.buyerEmail}</p>
                    <p className="text-[10px] text-muted font-medium">Link originally sent here</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted mb-2">File Info</h4>
                    <p className="text-sm font-bold text-ink">{(product.fileSize! / 1024 / 1024).toFixed(2)} MB</p>
                    <p className="text-[10px] text-muted font-medium">Lifetime secure access</p>
                  </div>
               </div>
            </div>

            <div className="mt-12 text-center">
               <p className="text-xs font-bold text-muted mb-4">Having trouble with your download?</p>
               <div className="flex justify-center gap-6">
                  <a href="#" className="text-[10px] font-black uppercase tracking-widest text-ink hover:text-orange transition-colors">Help Center</a>
                  <a href="#" className="text-[10px] font-black uppercase tracking-widest text-ink hover:text-orange transition-colors">Report Issue</a>
                  <a href="#" className="text-[10px] font-black uppercase tracking-widest text-ink hover:text-orange transition-colors">Contact Seller</a>
               </div>
            </div>
         </motion.div>
      </div>

      <div className="py-12 px-6 text-center shrink-0">
          <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-muted hover:text-ink transition-colors">
            <ShoppingBag size={14} /> Created with Lynksy
          </Link>
      </div>
    </div>
  )
}
