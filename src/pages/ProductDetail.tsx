import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { 
  ArrowLeft, ShoppingBag, Star, 
  ShieldCheck, CheckCircle2,
  Package, Info, Share2
} from 'lucide-react'
import { Product } from '@/types/store'
import { User } from '@/types'
import { getProductById, getActiveProducts, getProductReviews } from '@/firebase/store'
import { getUserByUsername } from '@/firebase/firestore'
import { formatPrice, CATEGORY_INFO, formatFileSize } from '@/utils/storeUtils'
import { CheckoutModal } from '@/components/store/CheckoutModal'
import { ProductCard } from '@/components/store/ProductCard'
import { cn, getFallbackAvatarGradient, getFallbackAvatarInitials } from '@/utils/formatters'
import toast from 'react-hot-toast'

export default function ProductDetail() {
  const { username, productId } = useParams<{ username: string, productId: string }>()
  const navigate = useNavigate()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [creator, setCreator] = useState<User | null>(null)
  const [otherProducts, setOtherProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!username || !productId) return
      try {
        const u = await getUserByUsername(username)
        if (!u) return
        
        if (u.plan !== 'PRO' && u.plan !== 'PRO_PLUS') {
          toast.error("The creator's store is currently unavailable.")
          navigate(`/u/${username}`)
          return
        }
        
        setCreator(u)

        const p = await getProductById(u.uid, productId)
        if (!p || !p.isActive) {
          toast.error('Product not found')
          navigate(`/u/${username}/store`)
          return
        }
        setProduct(p)
        setActiveImage(p.coverImageUrl)

        const [others] = await Promise.all([
          getActiveProducts(u.uid),
          getProductReviews(u.uid, productId)
        ])
        setOtherProducts(others.filter(item => item.id !== productId).slice(0, 3))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [username, productId, navigate])

  if (loading) return <div className="min-h-screen bg-cream flex items-center justify-center"><Loader2 className="animate-spin text-orange" size={40} /></div>

  if (!product || !creator) return null

  const category = CATEGORY_INFO[product.category] || CATEGORY_INFO.other

  return (
    <div className="min-h-screen bg-cream selection:bg-orange selection:text-white pb-20">
      <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-cream-3 flex items-center justify-between">
        <Link to={`/u/${username}/store`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full bg-cream flex items-center justify-center group-hover:bg-orange/10 transition-colors">
            <ArrowLeft className="text-muted group-hover:text-orange" size={20} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-muted group-hover:text-ink">Back to Store</span>
        </Link>
        <button className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-muted hover:text-orange transition-colors">
          <Share2 size={20} />
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Left: Media */}
        <div className="space-y-6">
           <motion.div 
            layoutId={`product-image-${product.id}`}
            className="aspect-video bg-white rounded-[2.5rem] overflow-hidden border border-cream-3 shadow-2xl shadow-orange/5"
           >
              {activeImage ? (
                <img src={activeImage} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl" style={{ backgroundColor: `${category.color}10` }}>
                  {category.icon}
                </div>
              )}
           </motion.div>

           {product.previewImageUrls.length > 0 && (
             <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
                <button 
                  onClick={() => setActiveImage(product.coverImageUrl)}
                  className={cn(
                    "w-24 aspect-video rounded-xl overflow-hidden border-2 transition-all shrink-0",
                    activeImage === product.coverImageUrl ? "border-orange" : "border-transparent"
                  )}
                >
                  <img src={product.coverImageUrl!} className="w-full h-full object-cover" />
                </button>
                {product.previewImageUrls.map((url, i) => (
                   <button 
                    key={i}
                    onClick={() => setActiveImage(url)}
                    className={cn(
                      "w-24 aspect-video rounded-xl overflow-hidden border-2 transition-all shrink-0",
                      activeImage === url ? "border-orange" : "border-transparent"
                    )}
                   >
                    <img src={url} className="w-full h-full object-cover" />
                  </button>
                ))}
             </div>
           )}

           <div className="bg-white rounded-[2rem] p-8 space-y-6 border border-cream-3">
              <div className="flex items-center gap-3">
                <Info className="text-orange" size={20} />
                <h3 className="font-syne font-black text-lg uppercase tracking-tight">Product Description</h3>
              </div>
              <p className="text-muted text-sm leading-relaxed whitespace-pre-wrap">{product.description || product.shortDesc}</p>
           </div>
        </div>

        {/* Right: Info & Buy */}
        <div className="space-y-8">
           <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-orange/10 text-orange rounded-full text-[10px] font-black uppercase tracking-widest">{category.icon} {category.label}</span>
                  {product.isFeatured && <span className="px-3 py-1 bg-ink text-white rounded-full text-[10px] font-black uppercase tracking-widest">★ Featured</span>}
              </div>
              <h1 className="font-syne font-black text-4xl lg:text-5xl uppercase tracking-tighter leading-tight">{product.title}</h1>
              
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1.5">
                  <Star className="text-amber-400 fill-amber-400" size={16} />
                  <span className="text-xs font-black text-ink">{product.rating} <span className="text-muted font-bold">({product.reviewCount} reviews)</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="text-muted" size={16} />
                  <span className="text-xs font-black text-ink">{product.totalSales} <span className="text-muted font-bold">sales</span></span>
                </div>
              </div>
           </div>

           <div className="p-10 bg-white rounded-[3rem] border border-cream-3 shadow-xl shadow-orange/5 space-y-8">
              <div className="flex items-end justify-between">
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted">Investment</p>
                    <p className="font-syne font-black text-5xl text-orange">{formatPrice(product.price)}</p>
                 </div>
                 {product.price > 0 && <p className="text-[10px] font-black text-green-500 uppercase tracking-widest pb-2">0% Platform Fee</p>}
              </div>

              <div className="space-y-4">
                 <button 
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full py-6 bg-ink text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-orange hover:shadow-orange/20 transition-all active:scale-95 flex items-center justify-center gap-4"
                 >
                    {product.price === 0 ? 'Get it for Free →' : `Buy Now — ${formatPrice(product.price)} →`}
                 </button>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted justify-center">
                        <Package size={14} /> {formatFileSize(product.fileSize)}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted justify-center">
                        <CheckCircle2 className="text-green-500" size={14} /> 3 Downloads
                    </div>
                 </div>
              </div>

              <div className="pt-8 border-t border-cream-2 space-y-4">
                 <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 bg-cream rounded-xl flex items-center justify-center text-orange"><ShieldCheck size={20} /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted leading-relaxed">Secure transaction via <span className="text-ink">secure manual gateways</span>. Instant download link via email.</p>
                 </div>
              </div>
           </div>

           {/* Creator Info */}
           <div className="flex items-center justify-between p-6 bg-cream/50 rounded-[2rem] border border-cream-3">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-white rounded-2xl overflow-hidden border border-cream-3">
                    {creator.avatarUrl ? (
                       <img src={creator.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                       <div 
                          className="w-full h-full flex items-center justify-center text-sm font-black text-white"
                          style={{ background: getFallbackAvatarGradient(creator.displayName || creator.username || '') }}
                       >
                          {getFallbackAvatarInitials(creator.displayName || creator.username || '')}
                        </div>
                    )}
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-0.5">Created by</p>
                    <p className="text-sm font-black uppercase tracking-tight">{creator.displayName}</p>
                 </div>
              </div>
              <Link to={`/u/${username}`} className="px-4 py-2 bg-white border border-cream-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-orange transition-colors">Profile</Link>
           </div>
        </div>
      </main>

      {/* Other Products */}
      {otherProducts.length > 0 && (
         <section className="max-w-7xl mx-auto px-6 mt-32 space-y-10">
            <h2 className="font-syne font-black text-2xl uppercase tracking-tighter">More from {creator.displayName}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
               {otherProducts.map(p => (
                 <div key={p.id}>
                    <ProductCard 
                        product={p} 
                        creatorName={creator.displayName} 
                        username={creator.username} 
                        onBuyClick={(p) => navigate(`/u/${username}/store/${p.id}`)}
                        compact
                    />
                 </div>
               ))}
            </div>
         </section>
      )}

      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        product={product}
        creatorUid={creator.uid}
      />
    </div>
  )
}

function Loader2({ className, size }: { className?: string, size?: number }) {
    return <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className={className}><ShoppingBag size={size} /></motion.div>
}
