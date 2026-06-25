import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { 
  ArrowLeft, ShoppingBag, 
  Globe, Share2, ShieldCheck,
  TrendingUp, Award, CheckCircle2
} from 'lucide-react'
import { Product, StoreStats } from '@/types/store'
import { User } from '@/types'
import { getProducts, getStoreStats, deleteProduct, updateProduct } from '@/firebase/store'
import { getUserByUsername, getUserByCustomDomain, trackPageView, trackClick } from '@/firebase/firestore'
import { ProductGrid } from '@/components/store/ProductGrid'
import { ProductCard } from '@/components/store/ProductCard'
import { CheckoutModal } from '@/components/store/CheckoutModal'
import { AddEditProductModal } from '@/components/store/AddEditProductModal'
import { useAuthStore } from '@/store/authStore'
import { Spinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

import { getFallbackAvatarGradient, getFallbackAvatarInitials } from '@/utils/formatters'

interface PublicStoreProps {
  usernameFromProp?: string;
  customDomain?: string;
}

export default function PublicStore({ usernameFromProp, customDomain }: PublicStoreProps) {
  const { username: usernameFromParam } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const username = usernameFromProp || usernameFromParam
  
  const [creator, setCreator] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<StoreStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  
  // Admin State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  
  const currentUser = useAuthStore(state => state.user)
  const isOwner = currentUser?.uid === creator?.uid

  const loadStore = useCallback(async () => {
    try {
      let u: User | null = null;
      
      if (customDomain) {
        u = await getUserByCustomDomain(customDomain)
      } else if (username) {
        u = await getUserByUsername(username)
      }

      if (!u) {
        setLoading(false)
        return
      }
      setCreator(u)

      // Load products for all plans if they have them
      const isCurrentlyOwner = currentUser?.uid === u.uid
      const [allProductsRaw, storeStats] = await Promise.all([
        getProducts(u.uid).catch(() => []),
        getStoreStats(u.uid).catch(() => null)
      ])
      
      const finalProducts = isCurrentlyOwner ? allProductsRaw : allProductsRaw.filter(p => p.isActive)
      setProducts(finalProducts)
      setStats(storeStats)
      
      if (u.username && u.uid) {
        trackPageView(u.username, u.uid)
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to load store')
    } finally {
      setLoading(false)
    }
  }, [username, customDomain, currentUser?.uid])

  useEffect(() => {
    loadStore()
  }, [username, customDomain, currentUser?.uid, loadStore])

  const handleBuy = (product: Product) => {
    if (creator?.uid) {
      trackClick(creator.uid, { id: product.id, title: product.title })
    }
    setSelectedProduct(product)
    setIsCheckoutOpen(true)
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsEditModalOpen(true)
  }

  const handleDelete = async (product: Product) => {
    const targetUid = product.uid || creator?.uid
    if (!targetUid) {
      toast.error('Could not identify product owner')
      return
    }
    
    const productTitle = product.title || product.name || 'this product'
    const loadingToast = toast.loading(`Deleting "${productTitle}"...`)
    try {
      console.log('PublicStore: Initiating delete for', product.id, 'under UID', targetUid)
      await deleteProduct(targetUid, product.id)
      toast.dismiss(loadingToast)
      toast.success('Product deleted')
      
      // Immediate UI update
      setProducts(prev => prev.filter(p => p.id !== product.id))
      
      // Sync full store after a short delay
      setTimeout(() => loadStore(), 1500)
    } catch (err: unknown) {
      console.error('PublicStore: Delete failed', err)
      toast.dismiss(loadingToast)
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
    }
  }

  const handleToggleHold = async (product: Product) => {
    const targetUid = product.uid || creator?.uid
    if (!targetUid) return
    
    const newStatus = !product.isActive;
    
    // Immediate UI update
    setProducts(prev => prev.map(p => 
      p.id === product.id ? { ...p, isActive: newStatus } : p
    ));

    try {
      await updateProduct(targetUid, product.id, { isActive: newStatus })
      toast.success(newStatus ? 'Product published' : 'Product held (Draft)')
      
      // Delay full sync
      setTimeout(() => loadStore(), 1500)
    } catch (err) {
      console.error('PublicStore: Toggle hold failed:', err)
      toast.error('Failed to update status')
      // Revert if error
      setProducts(prev => prev.map(p => 
        p.id === product.id ? { ...p, isActive: product.isActive } : p
      ));
    }
  }

  const handleShare = () => {
    navigator.share?.({
      title: `${creator?.displayName}'s Store - Lynksy`,
      url: window.location.href
    }).catch(() => {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard')
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="font-syne font-black uppercase tracking-[0.2em] text-muted text-[10px]">Opening Store...</p>
        </div>
      </div>
    )
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-10 text-center">
        <h1 className="font-syne font-black text-4xl uppercase tracking-tighter mb-4">404 Creator Not Found</h1>
        <p className="text-muted mb-8">This store link doesn't seem to exist or has been removed.</p>
        <Link to="/" className="bg-ink text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all hover:bg-orange">Back to Home</Link>
      </div>
    )
  }

  if (products.length === 0 && !isOwner) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-10 text-center">
        <div className="w-24 h-24 bg-orange/10 rounded-[2rem] flex items-center justify-center mb-6">
           <ShoppingBag className="text-orange" size={40} />
        </div>
        <h1 className="font-syne font-black text-4xl uppercase tracking-tighter mb-4">Store Empty</h1>
        <p className="text-muted max-w-md mb-8">
           This creator hasn't added any products to their store yet.
        </p>
        <Link to={`/${username}`} className="bg-ink text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all hover:bg-orange">Visit Profile instead</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream selection:bg-orange selection:text-white">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-cream-3 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center group-hover:bg-orange/10 transition-colors">
            <ArrowLeft className="text-muted group-hover:text-orange" size={20} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-muted group-hover:text-ink text-left">Back to {creator.displayName}</span>
        </button>
        
        <button 
          onClick={handleShare}
          className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-muted hover:text-orange transition-colors"
        >
          <Share2 size={20} />
        </button>
      </nav>

      {/* Header Section */}
      <header className="bg-ink pt-32 pb-20 px-[5vw] relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange/20 to-transparent" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-orange/10 blur-[120px] rounded-full" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10 text-center">
            <motion.div 
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               className="w-24 h-24 rounded-[2.5rem] bg-white p-1 shadow-2xl mx-auto mb-8 border border-white/10"
            >
                {creator.avatarUrl ? (
                  <img src={creator.avatarUrl} alt={creator.displayName} className="w-full h-full object-cover rounded-[2.2rem]" referrerPolicy="no-referrer" />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center text-3xl font-black rounded-[2.2rem] text-white"
                    style={{ background: getFallbackAvatarGradient(creator.displayName || creator.username || '') }}
                  >
                    {getFallbackAvatarInitials(creator.displayName || creator.username || '')}
                  </div>
                )}
            </motion.div>

            <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="space-y-4"
            >
                <div className="flex flex-col items-center justify-center">
                    <h1 className="font-syne font-black text-4xl lg:text-6xl text-white uppercase tracking-tighter text-center">
                        {creator.displayName}'s Store
                    </h1>
                </div>
                
                <p className="text-white/40 font-bold uppercase tracking-[0.3em] pl-[0.3em] text-xs text-center">@{creator.username} • Digital Shop</p>

                <div className="flex flex-wrap items-center justify-center gap-8 mt-10 pt-10 border-t border-white/5">
                    <div className="text-center group">
                        <p className="text-white font-syne font-black text-2xl group-hover:text-orange transition-colors">{products.length}</p>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Products</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center group">
                        <p className="text-white font-syne font-black text-2xl group-hover:text-orange transition-colors">{stats?.totalSales || 0}</p>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Sales</p>
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="text-center group">
                        <p className="text-white font-syne font-black text-2xl group-hover:text-orange transition-colors">★ {creator.avgRating || 5.0}</p>
                        <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Rating</p>
                    </div>
                </div>
            </motion.div>
        </div>
      </header>

      {/* Store Content */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        {products.length > 0 && products.some(p => p.isFeatured) && (
            <div className="mb-20">
                <div className="flex items-center gap-3 mb-10">
                    <Award className="text-orange" />
                    <h2 className="font-syne font-black text-2xl uppercase tracking-tighter">Featured Goods</h2>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-2 gap-3 sm:gap-8">
                    {products.filter(p => p.isFeatured).map(p => (
                        <div key={p.id} className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-orange to-blue-500 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition-opacity" />
                            <ProductCard 
                                product={p} 
                                creatorName={creator.displayName} 
                                username={creator.username} 
                                onBuyClick={handleBuy}
                                isOwner={isOwner}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggleHold={handleToggleHold}
                                themeId={creator.themeId}
                            />
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="flex items-center gap-3 mb-10">
            <TrendingUp className="text-muted" />
            <h2 className="font-syne font-black text-2xl uppercase tracking-tighter">All Products</h2>
        </div>

        <ProductGrid 
            products={products}
            creatorName={creator.displayName}
            username={creator.username}
            isLoading={false}
            onBuyClick={handleBuy}
            isOwner={isOwner}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleHold={handleToggleHold}
            themeId={creator.themeId}
        />
        
        {/* Quality Badges */}
        <div className="mt-32 pt-20 border-t border-cream-3 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
                <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto text-orange">
                    <ShieldCheck size={32} />
                </div>
                <h4 className="font-syne font-black uppercase tracking-tight">Secure Checkout</h4>
                <p className="text-muted text-sm leading-relaxed px-10 md:px-0 uppercase tracking-wider text-[10px] font-black">All payments are protected and processed via secure manual gateways.</p>
            </div>
            <div className="space-y-4">
                <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto text-blue-500">
                    <CheckCircle2 size={32} />
                </div>
                <h4 className="font-syne font-black uppercase tracking-tight">Instant Delivery</h4>
                <p className="text-muted text-sm leading-relaxed px-10 md:px-0 uppercase tracking-wider text-[10px] font-black">Get immediate access to your digital files instantly after payment confirmation.</p>
            </div>
            <div className="space-y-4">
                <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto text-green-500">
                    <Globe size={32} />
                </div>
                <h4 className="font-syne font-black uppercase tracking-tight">Lifetime Access</h4>
                <p className="text-muted text-sm leading-relaxed px-10 md:px-0 uppercase tracking-wider text-[10px] font-black">Once purchased, your download link is sent to your email for easy future access.</p>
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-20 px-[5vw] text-center border-t border-cream-3">
          <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-8 h-8 bg-orange rounded-xl flex items-center justify-center text-white font-black">L</div>
              <span className="font-syne font-black uppercase tracking-tighter text-ink text-xl">Lynksy Store</span>
          </div>
          <p className="text-muted text-[10px] font-black uppercase tracking-widest leading-loose">
              Lynksy Store is a marketplace for digital goods. <br/>
              © {new Date().getFullYear()} Lynksy. Built by Creators, for Creators.
          </p>
      </footer>

      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={selectedProduct}
        creatorUid={creator.uid}
      />

      {/* Admin Edit Modal */}
      {isOwner && (
        <AddEditProductModal
            isOpen={isEditModalOpen}
            onClose={() => {
                setIsEditModalOpen(false)
                setEditingProduct(null)
            }}
            product={editingProduct}
            uid={creator.uid}
            onSave={loadStore}
        />
      )}
    </div>
  )
}
