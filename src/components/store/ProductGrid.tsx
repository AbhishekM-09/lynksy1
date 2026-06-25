import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search } from 'lucide-react'
import { Product } from '@/types/store'
import { ProductCard } from './ProductCard'
import { StoreEmptyState } from './StoreEmptyState'
import { cn } from '@/utils/formatters'

interface ProductGridProps {
  products: Product[]
  creatorName: string
  username: string
  isLoading: boolean
  onBuyClick: (product: Product) => void
  isOwner?: boolean
  onEdit?: (product: Product) => void
  onDelete?: (product: Product) => void
  onToggleHold?: (product: Product) => void
  themeId?: string
}

export function ProductGrid({ 
  products, 
  creatorName, 
  username, 
  isLoading, 
  onBuyClick,
  isOwner = false,
  onEdit,
  onDelete,
  onToggleHold,
  themeId = 'saffron'
}: ProductGridProps) {
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'price-asc' | 'price-desc'>('newest')

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))]

  const filteredProducts = products
    .filter(p => filter === 'all' || p.category === filter)
    .filter(p => (p.title || p.name || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'popular') return b.totalSales - a.totalSales
      if (sortBy === 'price-asc') return a.price - b.price
      if (sortBy === 'price-desc') return b.price - a.price
      return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
    })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-cream-3 overflow-hidden animate-pulse">
            <div className="aspect-video bg-cream" />
            <div className="p-5 space-y-4">
              <div className="h-5 bg-cream rounded-lg w-2/3" />
              <div className="space-y-2">
                <div className="h-3 bg-cream rounded-lg w-full" />
                <div className="h-3 bg-cream rounded-lg w-4/5" />
              </div>
              <div className="pt-4 flex justify-between">
                <div className="h-8 bg-cream rounded-xl w-24" />
                <div className="h-8 bg-cream rounded-xl w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 w-full md:w-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                filter === cat 
                  ? "bg-orange border-orange text-white shadow-lg shadow-orange/20 scale-105" 
                  : "bg-white border-cream-3 text-muted hover:border-orange/30 hover:text-orange"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-cream-3 rounded-2xl text-xs font-bold text-ink focus:outline-none focus:border-orange focus:ring-4 focus:ring-orange/5 transition-all"
            />
          </div>
          
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular' | 'price-asc' | 'price-desc')}
            className="bg-white border border-cream-3 rounded-2xl px-4 py-2.5 text-xs font-bold text-muted focus:outline-none focus:border-orange transition-all cursor-pointer"
          >
            <option value="newest">Newest</option>
            <option value="popular">Popular</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <StoreEmptyState isOwner={isOwner} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map(product => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <ProductCard 
                  product={product}
                  creatorName={creatorName}
                  username={username}
                  onBuyClick={onBuyClick}
                  isOwner={isOwner}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleHold={onToggleHold}
                  themeId={themeId}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
