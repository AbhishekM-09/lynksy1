import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  X, Upload, Image as ImageIcon, 
  Loader2, IndianRupee,
  Hash, FileText, Check,
  ShieldCheck, LayoutGrid,
  Sliders, BookOpen, GraduationCap, Music, Package, ChevronDown
} from 'lucide-react'
import { Product, ProductCategory } from '@/types/store'

const CATEGORY_ICONS: Record<ProductCategory, React.ComponentType<{ size?: number; className?: string }>> = {
  preset: Sliders,
  ebook: BookOpen,
  template: LayoutGrid,
  course: GraduationCap,
  music: Music,
  art: ImageIcon,
  other: Package,
}
import { CATEGORY_INFO, formatPrice } from '@/utils/storeUtils'
import { uploadProductFile, uploadProductCover, createProduct, updateProduct } from '@/firebase/store'
import { ProductCard } from './ProductCard'
import { cn } from '@/utils/formatters'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

interface AddEditProductModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  uid: string
  onSave: () => void
}

export function AddEditProductModal({ isOpen, onClose, product, uid, onSave }: AddEditProductModalProps) {
  const { user } = useAuthStore()
  const plan = user?.plan || 'FREE'
  const isPro = plan === 'PRO'
  const isProPlus = plan === 'PRO_PLUS'
  const feePercentText = (isPro || isProPlus) ? '0%' : '10%'
  const feePercent = (isPro || isProPlus) ? 0.0 : 0.10
  
  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    description: '',
    shortDesc: '',
    price: 0,
    category: 'preset',
    tags: [],
    isActive: true,
    isFeatured: false,
    currency: 'INR'
  })

  const [file, setFile] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (product) {
      setFormData(product)
    } else {
      setFormData({
        title: '',
        description: '',
        shortDesc: '',
        price: 0,
        category: 'preset',
        tags: [],
        isActive: true,
        isFeatured: false,
        currency: 'INR'
      })
    }
  }, [product, isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      // Prevent videos / MP4 format
      const isVideoType = selected.type?.startsWith('video/')
      const isVideoExtension = /\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v|3gp|mpeg|mpg)$/i.test(selected.name)
      if (isVideoType || isVideoExtension) {
        toast.error('Video formats (such as MP4) are not allowed in the digital store.')
        return
      }

      if (selected.size > 500 * 1024 * 1024) {
        toast.error('File size must be under 500MB')
        return
      }
      setFile(selected)
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        toast.error('Cover image must be under 5MB')
        return
      }
      setCover(selected)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if ((formData.tags?.length || 0) >= 5) {
        toast.error('Max 5 tags allowed')
        return
      }
      if (!formData.tags?.includes(tagInput.trim())) {
        setFormData({ ...formData, tags: [...(formData.tags || []), tagInput.trim()] })
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter(t => t !== tagToRemove) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.category) {
      toast.error('Please fill in required fields')
      return
    }

    if (!product && !file) {
      toast.error('Please upload a product file')
      return
    }

    setIsSubmitting(true)
    setUploadProgress(10)

    try {
      let finalFileUrl = formData.fileUrl || ''
      let finalFileName = formData.fileName || ''
      let finalFileSize = formData.fileSize || 0
      let finalFileType = formData.fileType || ''
      let finalCoverUrl = formData.coverImageUrl || ''

      // 1. Create product doc if new to get ID for storage path
      let productId = product?.id || ''
      const tempProductData = {
        uid,
        title: formData.title || '',
        description: formData.description || '',
        shortDesc: formData.shortDesc || '',
        price: Number(formData.price) || 0,
        category: formData.category as ProductCategory,
        tags: formData.tags || [],
        isActive: formData.isActive ?? true,
        isFeatured: formData.isFeatured ?? false,
        currency: 'INR' as const,
        coverImageUrl: finalCoverUrl,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        fileSize: finalFileSize,
        fileType: finalFileType,
        previewImageUrls: formData.previewImageUrls || [],
      }

      if (!product) {
        // Initially set to inactive until file is uploaded
        productId = await createProduct(uid, { 
          ...tempProductData, 
          isActive: false 
        })
      }

      setUploadProgress(30)

      // 2. Upload file if changed
      if (file) {
        const uploaded = await uploadProductFile(uid, productId, file)
        finalFileUrl = uploaded.path
        finalFileName = uploaded.name
        finalFileSize = uploaded.size
        finalFileType = uploaded.type
        setUploadProgress(70)
      }

      // 3. Upload cover if changed
      if (cover) {
        finalCoverUrl = await uploadProductCover(uid, productId, cover)
        setUploadProgress(90)
      }

      // 4. Final Update
      await updateProduct(uid, productId, {
        ...tempProductData,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        fileSize: finalFileSize,
        fileType: finalFileType,
        coverImageUrl: finalCoverUrl,
      })

      toast.success(product ? 'Product updated!' : 'Product published! 🎉')
      onSave()
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(error)
      toast.error(errorMessage || 'Failed to save product')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 lg:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative bg-cream w-full max-w-6xl h-full lg:h-[90vh] rounded-none lg:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row"
          >
            {/* Form Side */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-8 lg:p-12">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="font-syne font-black text-3xl uppercase tracking-tighter shadow-orange/10">
                    {product ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  <p className="text-muted text-xs font-bold uppercase tracking-widest mt-2">Digital goods for your Lynksy store</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-12 h-12 bg-cream rounded-2xl flex items-center justify-center text-muted hover:text-orange transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-10 pb-20">
                {/* File Upload Section */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted flex items-center gap-2">
                    <FileText size={14} className="text-orange" />
                    Product File (ZIP, PDF, presets etc.)
                  </label>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "group relative border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center transition-all cursor-pointer",
                      file || formData.fileUrl 
                        ? "border-green-500/30 bg-green-500/5" 
                        : "border-cream-3 hover:border-orange bg-cream/5"
                    )}
                  >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    
                    {isSubmitting && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-orange mb-3" size={32} />
                            <span className="text-xs font-black uppercase tracking-widest">{uploadProgress}% Uploading...</span>
                        </div>
                    )}

                    {file || formData.fileUrl ? (
                      <div className="text-center">
                        <Check className="text-green-500 mx-auto mb-3" size={32} />
                        <p className="text-sm font-bold truncate max-w-xs">{file?.name || formData.fileName}</p>
                        <p className="text-[10px] text-muted uppercase font-black tracking-widest mt-1">Change file</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="text-orange mx-auto mb-4 group-hover:scale-110 transition-transform" size={40} />
                        <p className="text-sm font-bold text-ink mb-1 uppercase tracking-tight">Drop your product here</p>
                        <p className="text-[10px] text-muted uppercase font-black tracking-widest">ZIP, PDF, Preset • Max 500MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Product Title</label>
                      <input 
                        type="text"
                        placeholder="e.g. Dreamy Wedding Presets"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-cream border-2 border-transparent focus:border-orange focus:bg-white rounded-[1.5rem] p-5 text-sm font-black focus:outline-none transition-all"
                      />
                   </div>

                   <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Category</label>
                      <div ref={categoryDropdownRef} className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                          className="w-full flex items-center justify-between bg-cream border-2 border-transparent hover:border-orange/20 focus:border-orange focus:bg-white rounded-[1.5rem] p-5 text-sm font-black focus:outline-none transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            {(() => {
                              const IconComponent = CATEGORY_ICONS[formData.category as ProductCategory] || CATEGORY_ICONS.other;
                              return <IconComponent size={18} className="text-orange" />;
                            })()}
                            <span className="text-sm font-black text-ink">{CATEGORY_INFO[formData.category as ProductCategory]?.label || 'Other'}</span>
                          </div>
                          <ChevronDown size={18} className={cn("text-muted transition-transform duration-200", isCategoryDropdownOpen && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                          {isCategoryDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              transition={{ duration: 0.15 }}
                              style={{ zIndex: 99 }}
                              className="absolute left-0 right-0 mt-2 bg-white border-2 border-cream-3 shadow-xl rounded-[1.5rem] p-2 space-y-1 max-h-[300px] overflow-y-auto"
                            >
                              {Object.entries(CATEGORY_INFO).map(([key, info]) => {
                                const IconComponent = CATEGORY_ICONS[key as ProductCategory] || CATEGORY_ICONS.other;
                                const isSelected = formData.category === key;
                                return (
                                  <button
                                    key={key}
                                    type="button"
                                    onClick={() => {
                                      setFormData({ ...formData, category: key as ProductCategory })
                                      setIsCategoryDropdownOpen(false)
                                    }}
                                    className={cn(
                                      "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left text-sm font-semibold transition-all",
                                      isSelected 
                                        ? "bg-orange text-white" 
                                        : "text-ink hover:bg-cream"
                                    )}
                                  >
                                    <IconComponent size={18} className={cn(isSelected ? "text-white" : "text-orange")} />
                                    <span>{info.label}</span>
                                  </button>
                                );
                              })}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                   </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Short Description (on card)</label>
                  <textarea
                    placeholder="Briefly describe your product..."
                    value={formData.shortDesc}
                    onChange={e => setFormData({ ...formData, shortDesc: e.target.value })}
                    maxLength={150}
                    className="w-full bg-cream border-2 border-transparent focus:border-orange focus:bg-white rounded-[1.5rem] p-5 text-sm font-bold focus:outline-none transition-all min-h-[100px] no-scrollbar"
                  />
                  <p className="text-right text-[10px] font-black text-muted uppercase tracking-widest">{formData.shortDesc?.length}/150</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Price */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Price (INR)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" size={18} />
                      <input 
                        type="number"
                        placeholder="0 for FREE"
                        value={formData.price ? formData.price / 100 : ''}
                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) * 100 })}
                        className="w-full bg-cream border-2 border-transparent focus:border-orange focus:bg-white rounded-[1.5rem] pl-12 pr-5 py-5 text-sm font-black focus:outline-none transition-all"
                      />
                    </div>
                    {formData.price === 0 ? (
                      <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">This product will be FREE</p>
                    ) : (
                      <p className="text-[10px] font-black text-orange uppercase tracking-widest">
                        You earn: {formatPrice(Math.round((formData.price || 0) * (1 - feePercent)))} ({feePercentText} platform fee)
                      </p>
                    )}
                  </div>

                  {/* Cover */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Cover Image (16:9)</label>
                    <div 
                        onClick={() => coverInputRef.current?.click()}
                        className="h-[64px] bg-cream border-2 border-dashed border-cream-3 rounded-[1.5rem] flex items-center px-6 gap-4 cursor-pointer hover:border-orange transition-all overflow-hidden"
                    >
                        <input type="file" ref={coverInputRef} onChange={handleCoverChange} className="hidden" />
                        <ImageIcon size={20} className="text-muted" />
                        <span className="text-xs font-black uppercase tracking-widest text-muted truncate">
                            {cover?.name || (formData.coverImageUrl ? 'Change Cover' : 'Upload Cover')}
                        </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Tags (max 5)</label>
                   <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags?.map(tag => (
                        <span key={tag} className="px-3 py-1.5 bg-orange/10 text-orange rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-ink"><X size={12} /></button>
                        </span>
                      ))}
                   </div>
                   <div className="relative">
                      <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" size={16} />
                      <input 
                        type="text"
                        placeholder="Type and press Enter..."
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="w-full bg-cream border-2 border-transparent focus:border-orange focus:bg-white rounded-[1.5rem] pl-12 pr-5 py-5 text-sm font-bold focus:outline-none transition-all"
                      />
                   </div>
                </div>

                <div className="p-8 bg-cream rounded-[2rem] border border-cream-3 flex items-center justify-between">
                    <div>
                        <h4 className="font-syne font-black text-xs uppercase tracking-widest mb-1">Store Visibility</h4>
                        <p className="text-[10px] text-muted uppercase font-black tracking-widest">Visible on your public store page</p>
                    </div>
                    <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                        className={cn(
                            "w-14 h-8 rounded-full p-1 transition-all",
                            formData.isActive ? "bg-green-500" : "bg-muted/40"
                        )}
                    >
                        <div className={cn("w-6 h-6 bg-white rounded-full shadow-sm transition-transform", formData.isActive ? "translate-x-6" : "translate-x-0")} />
                    </button>
                </div>
              </form>

              {/* Bottom Actions */}
              <div className="fixed bottom-0 left-0 right-0 lg:absolute lg:bottom-0 lg:left-0 lg:right-auto lg:w-[calc(100%-24rem)] p-6 bg-white/80 backdrop-blur-xl border-t border-cream-3 z-20">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-5 text-xs font-black uppercase tracking-widest text-muted hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-ink text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-orange hover:shadow-orange/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                        <><Loader2 className="animate-spin" size={18} /> Processing...</>
                    ) : (
                        product ? 'Save Changes' : 'Publish Product →'
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Side (Desktop Only) */}
            <div className="hidden lg:flex w-96 bg-cream p-12 flex-col items-center justify-center border-l border-cream-3">
              <div className="w-full space-y-8">
                <div className="text-center">
                    <span className="bg-orange/10 text-orange text-[10px] font-black tracking-[0.2em] px-3 py-1 rounded-full uppercase inline-block mb-4">Store Preview</span>
                    <h3 className="font-syne font-black text-xl uppercase tracking-tighter">See it in your store</h3>
                </div>
                
                <div className="perspective-1000">
                    <div className="rotate-y-6 transform-gpu">
                         <ProductCard 
                            product={formData as Product} 
                            creatorName="Creator" 
                            username="creator" 
                            onBuyClick={() => {}} 
                            compact={false}
                         />
                    </div>
                </div>

                <div className="bg-white/50 backdrop-blur p-6 rounded-[2rem] border border-white space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange"><LayoutGrid size={20} /></div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Modern Grid Layout</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500"><IndianRupee size={20} /></div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Instant Payments</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500"><ShieldCheck size={20} /></div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Secure File Delivery</p>
                    </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
