import { ShoppingBag, Package } from 'lucide-react'

interface StoreEmptyStateProps {
  isOwner: boolean
  onAddProduct?: () => void
}

export function StoreEmptyState({ isOwner, onAddProduct }: StoreEmptyStateProps) {
  return (
    <div className="py-20 px-10 text-center flex flex-col items-center">
      <div className="w-32 h-32 bg-orange/5 rounded-[3rem] flex items-center justify-center mb-6 relative">
        <div className="absolute inset-0 bg-orange/5 blur-3xl animate-pulse rounded-full" />
        {isOwner ? (
          <ShoppingBag className="text-orange relative z-10" size={48} />
        ) : (
          <Package className="text-orange relative z-10" size={48} />
        )}
      </div>

      <h3 className="font-syne font-black text-2xl text-ink mb-3 uppercase tracking-tighter">
        {isOwner ? 'Your store is empty' : 'No products yet'}
      </h3>
      <p className="text-muted text-sm max-w-sm mx-auto mb-8 leading-relaxed">
        {isOwner 
          ? 'Add your first digital product and start earning from your audience. Sell presets, eBooks, templates, and more.' 
          : 'This creator hasn’t added any products to their store yet. Check back soon for amazing digital goods!'}
      </p>

      {isOwner && onAddProduct && (
        <button
          onClick={onAddProduct}
          className="bg-orange text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-orange-hover hover:scale-105 active:scale-95 transition-all shadow-xl shadow-orange/20 flex items-center gap-3"
        >
          <Package size={20} />
          Add Your First Product
        </button>
      )}
    </div>
  )
}
