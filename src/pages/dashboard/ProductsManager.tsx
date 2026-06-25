/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Package, Plus, Search, 
  Edit3, Eye, CheckCircle2, XCircle, Star,
  IndianRupee, ShoppingBag, Loader2
} from 'lucide-react'
import { Product } from '@/types/store'
import { useAuthStore } from '@/store/authStore'
import { getProducts, deleteProduct, updateProduct } from '@/firebase/store'
import { AddEditProductModal } from '@/components/store/AddEditProductModal'
import { formatPrice, CATEGORY_INFO } from '@/utils/storeUtils'
import { cn } from '@/utils/formatters'
import toast from 'react-hot-toast'
import { Navigate, useNavigate } from 'react-router-dom'

export default function ProductsManager() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'draft'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isProcessingDelete, setIsProcessingDelete] = useState<string | null>(null)

  const handleAddProductClick = () => {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  const loadProducts = useCallback(async () => {
    if (!user?.uid) return
    try {
      const data = await getProducts(user.uid)
      setProducts(data)
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const confirmDelete = async (id: string, title: string) => {
    if (!user) {
      toast.error('Identity not verified. Please refresh.')
      return
    }
    
    setIsProcessingDelete(id)
    const loadingToast = toast.loading('Deleting product...')
    try {
      console.log('ProductsManager: Starting delete for ID:', id, 'UID:', user.uid)
      await deleteProduct(user.uid, id)
      
      toast.dismiss(loadingToast)
      toast.success('Product deleted')
      
      // Immediate UI update
      setProducts(prev => prev.filter(p => p.id !== id))
      setDeletingId(null)
      
      // Final sync after a short delay
      setTimeout(() => loadProducts(), 1500)
    } catch (err: unknown) {
      toast.dismiss(loadingToast)
      console.error('ProductsManager: Delete failed permanently:', err)
      let errorMsg = 'Failed to delete product'
      if (err instanceof Error) {
        try {
          const parsed = JSON.parse(err.message)
          errorMsg = `Error: ${parsed.error}`
        } catch {
          errorMsg = err.message
        }
      }
      toast.error(errorMsg)
    } finally {
      setIsProcessingDelete(null)
    }
  }

  const handleDelete = (id: string, title: string) => {
    setDeletingId(id)
  }

  const toggleActive = async (product: Product) => {
     if (!product.isActive && (!product.fileUrl || product.fileUrl === "")) {
         toast.error("Cannot publish: Product file is missing. Please edit and upload a file.")
         return
     }
     
     // Immediate UI update
     const newStatus = !product.isActive;
     setProducts(prev => prev.map(p => 
       p.id === product.id ? { ...p, isActive: newStatus } : p
     ));

     try {
         await updateProduct(user!.uid, product.id, { isActive: newStatus })
         toast.success(newStatus ? 'Product published' : 'Product hidden')
         
         // Sync after a delay
         setTimeout(() => loadProducts(), 1500)
     } catch (err) {
         console.error('ProductsManager: Failed to toggle active status:', err)
         toast.error('Failed to update status')
         // Revert on error
         setProducts(prev => prev.map(p => 
           p.id === product.id ? { ...p, isActive: product.isActive } : p
         ));
     }
  }

  const filtered = products
    .filter(p => {
      if (activeTab === 'active') return p.isActive
      if (activeTab === 'draft') return !p.isActive
      return true
    })
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))

  if (user && user.plan !== 'PRO_PLUS') {
    return <Navigate to="/dashboard/store" replace />
  }

  return (
    <div className="px-0 sm:px-8 py-4 sm:py-8 max-w-7xl mx-auto space-y-8 sm:space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-3 sm:px-0">
        <div>
           <div className="flex items-center gap-2 mb-2 text-muted">
                <Package size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Product Management</span>
            </div>
           <h1 className="font-syne font-black text-2xl sm:text-4xl uppercase tracking-tighter">Products</h1>
        </div>
        
        <button 
          onClick={handleAddProductClick}
          className="px-8 py-3 sm:py-4 bg-orange text-white rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl shadow-orange/20 hover:bg-orange-hover active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Plus size={18} />
          New Product
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between px-3 sm:px-0">
         <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-cream-3">
             {['all', 'active', 'draft'].map((tab) => (
               <button
                key={tab}
                onClick={() => setActiveTab(tab as 'all' | 'active' | 'draft')}
                className={cn(
                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === tab 
                        ? "bg-ink text-white shadow-lg" 
                        : "text-muted hover:text-ink hover:bg-cream-1"
                )}
               >
                 {tab}
               </button>
             ))}
         </div>

         <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-cream-3 rounded-2xl text-xs font-bold focus:outline-none focus:border-orange transition-all"
            />
         </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 px-3 sm:px-0 animate-pulse">
           {[1,2,3].map(i => <div key={i} className="h-64 bg-white border border-cream-3 rounded-[2rem] sm:rounded-[2.5rem]" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mx-3 sm:mx-0 bg-white border border-cream-3 rounded-3xl sm:rounded-[3rem] p-10 sm:p-20 text-center space-y-6">
            <Package className="text-muted/20 mx-auto" size={80} />
            <p className="text-muted text-sm font-black uppercase tracking-widest">No products found</p>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="text-orange font-black text-[11px] uppercase tracking-[0.2em] hover:opacity-80"
            >
                Create your first product →
            </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 px-3 sm:px-0">
           {filtered.map(product => (
             <motion.div 
               layout
               key={product.id}
               className="group bg-white border border-cream-3 rounded-3xl sm:rounded-[2.5rem] overflow-hidden flex flex-col hover:shadow-2xl hover:shadow-orange/10 transition-all duration-500"
             >
                {/* Thumbnail Header */}
                <div className="aspect-[16/10] bg-cream relative overflow-hidden">
                   {product.coverImageUrl ? (
                     <img src={product.coverImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-4xl bg-orange/5">{CATEGORY_INFO[product.category]?.icon || '📦'}</div>
                   )}
                   
                   <div className="absolute top-4 left-4 flex gap-2">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border backdrop-blur-md",
                        product.isActive ? "bg-green-500/10 border-green-500/20 text-green-600" : "bg-ink/10 border-ink/20 text-ink/60"
                      )}>
                        {product.isActive ? 'Active' : 'Draft'}
                      </div>
                      {product.isFeatured && (
                         <div className="px-3 py-1 bg-orange border border-orange/20 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                            Featured
                         </div>
                      )}
                      {(!product.fileUrl || product.fileUrl === "") && (
                         <div className="px-3 py-1 bg-red-500 border border-red-500/20 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                            No File
                         </div>
                      )}
                   </div>

                   <div className="absolute inset-x-4 bottom-4 flex justify-between items-end">
                      <div className="bg-white/90 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-lg border border-white/20">
                         <span className="text-xl font-syne font-black text-ink">{formatPrice(product.price)}</span>
                      </div>
                      <div className="flex gap-2 translate-y-12 group-hover:translate-y-0 transition-transform duration-300">
                         <button 
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedProduct(product)
                                setIsModalOpen(true)
                            }}
                            className="p-3 bg-white text-ink rounded-xl shadow-lg border border-cream-2 hover:bg-orange hover:text-white hover:border-orange-hover transition-all"
                         >
                            <Edit3 size={16} />
                         </button>
                         <button 
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleActive(product)
                            }}
                            className={cn(
                                "p-3 rounded-xl shadow-lg border transition-all",
                                product.isActive 
                                  ? "bg-white text-muted border-cream-2 hover:bg-red-500 hover:text-white hover:border-red-600" 
                                  : "bg-green-500 text-white border-green-600 hover:bg-green-600"
                            )}
                         >
                            {product.isActive ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                         </button>
                      </div>
                   </div>
                </div>

                <div className="p-8 space-y-6 flex-1 flex flex-col relative overflow-hidden">
                   {/* Inline Confirmation Overlay */}
                   <AnimatePresence>
                     {deletingId === product.id && (
                       <motion.div 
                         initial={{ opacity: 0, x: '100%' }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: '100%' }}
                         className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm p-8 flex flex-col items-center justify-center text-center space-y-4"
                       >
                          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 mb-2">
                             <XCircle size={24} />
                          </div>
                          <div className="space-y-1">
                             <h4 className="font-syne font-black text-lg uppercase tracking-tight">Delete Product?</h4>
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted">This action is permanent and cannot be undone.</p>
                          </div>
                          <div className="flex gap-3 w-full">
                             <button 
                               onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                               className="flex-1 py-3 bg-cream rounded-xl text-[10px] font-black uppercase tracking-widest text-muted hover:bg-cream-2 transition-colors"
                             >
                                Cancel
                             </button>
                             <button 
                               onClick={(e) => { e.stopPropagation(); confirmDelete(product.id, product.title); }}
                               className="flex-1 py-3 bg-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                             >
                                {isProcessingDelete === product.id ? <Loader2 size={12} className="animate-spin" /> : "Yes, Delete"}
                             </button>
                          </div>
                       </motion.div>
                     )}
                   </AnimatePresence>

                   <div>
                       <div className="text-[10px] font-black uppercase tracking-widest text-muted mb-2 flex items-center gap-2">
                            {CATEGORY_INFO[product.category]?.icon} {CATEGORY_INFO[product.category]?.label}
                       </div>
                       <h3 className="font-syne font-black text-xl text-ink leading-tight line-clamp-2">{product.title}</h3>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-cream/40 p-4 rounded-2xl border border-cream-3">
                         <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 flex items-center gap-1">
                            <ShoppingBag size={10} /> Sales
                         </p>
                         <p className="font-syne font-black text-base">{product.totalSales}</p>
                      </div>
                      <div className="bg-cream/40 p-4 rounded-2xl border border-cream-3">
                         <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-1 flex items-center gap-1">
                            <IndianRupee size={10} /> Revenue
                         </p>
                         <p className="font-syne font-black text-base">{formatPrice(product.totalRevenue)}</p>
                      </div>
                   </div>

                   <div className="mt-auto pt-6 border-t border-cream-3 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <Star size={12} className="text-amber-400 fill-amber-400" />
                            <span className="text-[10px] font-black text-muted">{product.rating} ({product.reviewCount})</span>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setDeletingId(product.id); }}
                            className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 hover:text-red-500 transition-colors"
                        >
                            Delete
                        </button>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      )}

      <AddEditProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        uid={user!.uid}
        onSave={loadProducts}
      />
      <div className="hidden" //
      />
    </div>
  )
}
