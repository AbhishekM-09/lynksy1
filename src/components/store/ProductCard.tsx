import { useState, MouseEvent } from 'react'
import { motion } from 'motion/react'
import { Star, ShoppingBag, Edit3, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Product } from '@/types/store'
import { formatPrice, CATEGORY_INFO } from '@/utils/storeUtils'
import { cn } from '@/utils/formatters'

interface ProductCardProps {
  product: Product
  creatorName: string
  username: string
  onBuyClick: (product: Product) => void
  compact?: boolean
  isOwner?: boolean
  onEdit?: (product: Product) => void
  onDelete?: (product: Product) => void
  onToggleHold?: (product: Product) => void
  themeId?: string
}

export function ProductCard({ 
  product, 
  onBuyClick, 
  compact = false,
  isOwner = false,
  onEdit,
  onDelete,
  onToggleHold,
  themeId = 'saffron'
}: ProductCardProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const category = CATEGORY_INFO[product.category] || CATEGORY_INFO.other
  const isDarkTheme = themeId === 'dark' || themeId === 'midnight' || themeId === 'forest' || themeId === 'blood'
  const title = product.title || product.name || 'Untitled Product'
  const coverUrl = product.coverImageUrl || product.imageUrl || product.image

  const handleDelete = async (e: MouseEvent) => {
    e.stopPropagation()
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      await onDelete(product)
    } finally {
      setIsDeleting(false)
      setShowConfirmDelete(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "group bg-white rounded-[16px] sm:rounded-[20px] border border-cream-3 overflow-hidden transition-all duration-300 h-full flex flex-col",
        !compact && "hover:shadow-2xl hover:shadow-orange/10",
        isOwner && !product.isActive && "opacity-80 grayscale-[0.5]"
      )}
    >
      {/* Cover Image */}
      <div className="aspect-video relative overflow-hidden bg-cream">
        {coverUrl ? (
          <img 
            src={coverUrl} 
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center text-2xl sm:text-4xl"
            style={{ backgroundColor: `${category.color}15` }}
          >
            {category.icon}
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-black/40 backdrop-blur-md text-white text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex items-center gap-1 sm:gap-1.5 border border-white/10">
          <span>{category.icon}</span>
          {category.label}
        </div>

        {/* Status Badge (Owner only) */}
        {isOwner && (
            <div className={cn(
              "absolute bottom-2 left-2 sm:bottom-3 sm:left-3 px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest border backdrop-blur-md",
              product.isActive ? "bg-green-500/80 text-white border-green-400" : "bg-ink/80 text-white border-white/20"
            )}>
              {product.isActive ? 'Live' : 'Draft'}
            </div>
        )}

        {/* Featured Badge */}
        {product.isFeatured && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-orange text-white text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full shadow-lg shadow-orange/20 flex items-center gap-1">
            <Star size={8} className="fill-white sm:w-2.5 sm:h-2.5" /> Featured
          </div>
        )}
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 sm:gap-3 p-2 sm:p-4 z-20">
            {isOwner ? (
                <div className="flex flex-col gap-1.5 w-full max-w-[140px] sm:max-w-[180px] translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    {!showConfirmDelete ? (
                      <>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEdit?.(product); }}
                            className="w-full bg-white text-ink py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black text-[8px] sm:text-[10px] uppercase tracking-widest hover:bg-orange hover:text-white transition-all flex items-center justify-center gap-1 sm:gap-2"
                        >
                            <Edit3 size={10} className="sm:w-3 sm:h-3" /> Edit Product
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleHold?.(product); }}
                            className="w-full bg-white/10 backdrop-blur-md text-white py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black text-[8px] sm:text-[10px] uppercase tracking-widest border border-white/20 hover:bg-white hover:text-ink transition-all flex items-center justify-center gap-1 sm:gap-2"
                        >
                            {product.isActive ? <><EyeOff size={10} className="sm:w-3 sm:h-3" /> Hide</> : <><Eye size={10} className="sm:w-3 sm:h-3" /> Publish</>}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(true); }}
                            className="w-full bg-red-500/10 text-red-100 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black text-[8px] sm:text-[10px] uppercase tracking-widest border border-red-500/30 hover:bg-red-500 hover:text-white transition-all"
                        >
                            Delete
                        </button>
                      </>
                    ) : (
                      <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-2xl space-y-2 sm:space-y-3 relative overflow-hidden">
                        <div className="text-center">
                          <p className="text-ink font-black text-[8px] sm:text-[10px] uppercase tracking-tighter mb-0.5 sm:mb-1">Delete?</p>
                          <p className="text-muted text-[7px] sm:text-[8px] font-bold uppercase">Irreversible.</p>
                        </div>
                        <div className="flex gap-1.5">
                           <button 
                             disabled={isDeleting}
                             onClick={(e) => { e.stopPropagation(); setShowConfirmDelete(false); }}
                             className="flex-1 bg-cream py-1.5 sm:py-2 rounded-lg text-muted font-black text-[7px] sm:text-[8px] uppercase tracking-widest hover:bg-cream-2 transition-colors disabled:opacity-50"
                           >
                               No
                           </button>
                           <button 
                             disabled={isDeleting}
                             onClick={handleDelete}
                             className="flex-1 bg-red-500 py-1.5 sm:py-2 rounded-lg text-white font-black text-[7px] sm:text-[8px] uppercase tracking-widest hover:bg-red-600 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                           >
                               {isDeleting ? <Loader2 size={8} className="animate-spin" /> : "Delete"}
                           </button>
                        </div>
                      </div>
                    )}
                </div>
            ) : (
                <button 
                  onClick={() => onBuyClick(product)}
                  className="bg-white text-ink px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center gap-1.5 sm:gap-2"
                >
                  <ShoppingBag size={12} className="sm:w-3.5 sm:h-3.5" />
                  Quick View
                </button>
            )}
        </div>
      </div>

      {/* Card Body */}
      <div className={cn("p-3 sm:p-4", compact ? "p-2.5 sm:p-3" : "p-4 sm:p-5")}>
        <h3 className="font-syne font-bold text-ink text-xs sm:text-sm lg:text-base line-clamp-1 mb-0.5 sm:mb-1 group-hover:text-orange transition-colors">
          {title}
        </h3>
        {!compact && (
          <p className="text-muted text-[10px] sm:text-xs line-clamp-2 mb-2 sm:mb-4 leading-relaxed h-7 sm:h-8">
            {product.shortDesc || 'No description provided.'}
          </p>
        )}

        {!compact && (
          <div className="flex items-center justify-between mb-2 sm:mb-4 pt-2 sm:pt-4 border-t border-cream-2">
            <div className="flex items-center gap-1">
              <Star size={10} className={cn("sm:w-3 sm:h-3", product.rating > 0 ? "text-amber-400 fill-amber-400" : "text-muted")} />
              <span className="text-[8px] sm:text-[10px] font-bold text-muted uppercase tracking-wider">{product.rating || '0.0'}</span>
            </div>
            <div className="flex items-center gap-1">
              <ShoppingBag size={10} className="sm:w-3 sm:h-3 text-muted" />
              <span className="text-[8px] sm:text-[10px] font-bold text-muted uppercase tracking-wider">{product.totalSales} Sold</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-auto gap-1.5 sm:gap-1">
          <div className={cn("font-syne font-black shrink-0", compact ? "text-xs sm:text-lg" : "text-sm sm:text-2xl")}>
            {product.price === 0 ? (
              <span className="text-green-500">Free</span>
            ) : (
              <span className="text-orange">{formatPrice(product.price)}</span>
            )}
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); onBuyClick(product); }}
            className={cn(
              "font-black text-[7px] sm:text-[10px] uppercase tracking-widest px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-[8px] sm:rounded-xl transition-all active:scale-95 shadow-md whitespace-nowrap text-center",
              product.price === 0 
                ? "bg-cream text-muted border border-cream-3 hover:bg-orange/5 hover:text-orange hover:border-orange/20"
                : isDarkTheme ? "bg-white text-black hover:bg-cream" : "bg-black text-white hover:bg-ink"
            )}
          >
            {product.price === 0 ? 'Get Free' : 'Buy Now'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
