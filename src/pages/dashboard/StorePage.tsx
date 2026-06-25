import React, { useState, useEffect, useRef } from 'react'
import { 
  ShoppingBag, Plus, Trash2, Edit2, 
  Eye, EyeOff, Save, X, Package, IndianRupee,
  Upload, FileText, CheckCircle2, TrendingUp,
  Loader2, Image as ImageIcon,
  Sliders, BookOpen, GraduationCap, Layers, Cpu, ChevronDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuthStore } from '@/store/authStore'
import { db, storage, auth } from '@/firebase/config'
import { 
  collection, query, orderBy, onSnapshot, 
  addDoc, deleteDoc, updateDoc, doc, serverTimestamp
} from 'firebase/firestore'
import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, StorageError } from 'firebase/storage'
import { cn } from '@/utils/formatters'
import { PlanGate } from '@/components/ui/PlanGate'
import { usePlan } from '@/hooks/usePlan'
import { formatPrice } from '@/utils/currency'
import type { Product } from '@/types'
import { toast } from 'react-hot-toast'

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  toast.error(`Operation failed: ${errInfo.error}`)
}

const CATEGORIES = [
  'E-book', 'Course', 'Template', 'Preset', 'Digital Art', 'Software', 'Other'
]

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'E-book': BookOpen,
  'Course': GraduationCap,
  'Template': Layers,
  'Preset': Sliders,
  'Digital Art': ImageIcon,
  'Software': Cpu,
  'Other': Package,
}

export default function StorePage() {
  const { user } = useAuthStore()
  const { limits, openUpgradeModal } = usePlan()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingProduct, setUploadingProduct] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDraggingImage, setIsDraggingImage] = useState(false)
  const [isDraggingProduct, setIsDraggingProduct] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  
  const [editForm, setEditForm] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    currency: 'INR',
    imageUrl: '',
    fileUrl: '',
    fileSize: 0,
    fileType: '',
    category: 'E-book',
    isActive: true,
    totalSales: 0,
    totalRevenue: 0
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  const imageInputRef = useRef<HTMLInputElement>(null)
  const productInputRef = useRef<HTMLInputElement>(null)

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
    return () => {
      if (imagePreview && !imagePreview.startsWith('http')) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  // Analytics state
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    activeProducts: 0
  })

  useEffect(() => {
    if (!user?.uid) return

    const path = `users/${user.uid}/products`
    const q = query(
      collection(db, path),
      orderBy('position', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prods = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[]
      setProducts(prods)
      
      const sales = prods.reduce((acc, p) => acc + (p.totalSales || 0), 0)
      const revenue = prods.reduce((acc, p) => acc + (p.totalRevenue || 0), 0)
      const active = prods.filter(p => p.isActive).length
      
      setStats({
        totalSales: sales,
        totalRevenue: revenue,
        activeProducts: active
      })
      
      setLoading(false)
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  const handleFileUpload = async (file: File, type: 'image' | 'product') => {
    // Explicitly check Firebase Auth state
    const currentUser = auth.currentUser
    if (!currentUser) {
      toast.error('Session expired. Please sign in again.')
      return
    }

    // Video/MP4 check
    if (type === 'product') {
      const isVideoType = file.type?.startsWith('video/')
      const isVideoExtension = /\.(mp4|mov|avi|mkv|webm|flv|wmv|m4v|3gp|mpeg|mpg)$/i.test(file.name)
      if (isVideoType || isVideoExtension) {
        toast.error('Video formats (such as MP4) are not allowed in the digital store.')
        return
      }
    }
    
    // Size check
    if (type === 'product' && file.size > 100 * 1024 * 1024) {
      toast.error('File too large (max 100MB)')
      return
    }

    if (type === 'image' && file.size > 10 * 1024 * 1024) {
      toast.error('Image too large (max 10MB)')
      return
    }

    const setUploading = type === 'image' ? setUploadingImage : setUploadingProduct
    
    // Cleanup previous preview if it exists
    if (type === 'image' && imagePreview && !imagePreview.startsWith('http')) {
      URL.revokeObjectURL(imagePreview)
    }

    setUploading(true)
    setUploadProgress(1) 
    if (type === 'image') setIsDraggingImage(false)
    else setIsDraggingProduct(false)

    // Immediate local preview
    if (type === 'image') {
      const localUrl = URL.createObjectURL(file)
      setImagePreview(localUrl)
    } 

    const toastId = toast.loading(`Uploading ${type === 'image' ? 'image' : 'product file'}...`)

    try {
      const extension = file.name.split('.').pop() || (type === 'image' ? 'png' : 'bin')
      const targetUid = currentUser.uid
      const filename = `${type}_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`
      const storagePath = `users/${targetUid}/store/${filename}`
      const storageRef = ref(storage, storagePath)
      
      const metadata = {
        contentType: file.type || (type === 'image' ? 'image/png' : 'application/octet-stream')
      }

      if (type === 'image') {
        const uploadResult = await uploadBytes(storageRef, file, metadata)
        const downloadURL = await getDownloadURL(uploadResult.ref)
        
        setEditForm(prev => ({ ...prev, imageUrl: downloadURL }))
        setImagePreview(downloadURL)
        setUploading(false)
        setUploadProgress(100)
        toast.dismiss(toastId)
        toast.success('Image uploaded!')
      } else {
        // Keep resumable for potentially large product files
        const uploadTask = uploadBytesResumable(storageRef, file, metadata)

        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = snapshot.totalBytes > 0 
              ? (snapshot.bytesTransferred / snapshot.totalBytes) * 100 
              : 0
            setUploadProgress(Math.max(1, progress))
          }, 
          (error: StorageError) => {
            console.error(`Storage Error (${type}):`, error)
            toast.dismiss(toastId)
            
            let friendlyMsg = error.message
            if (error.code === 'storage/unauthorized') {
              friendlyMsg = 'Permission denied. Check your authentication.'
            } else if (error.code === 'storage/retry-limit-exceeded') {
              friendlyMsg = 'Upload timed out. Please check your connection and try again.'
            }
            
            toast.error(`File upload failed: ${friendlyMsg}`)
            setUploading(false)
            setUploadProgress(0)
          }, 
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
              
              setEditForm(prev => ({
                ...prev,
                fileUrl: downloadURL,
                fileSize: file.size,
                fileType: file.type
              }));
              
              setUploading(false)
              setUploadProgress(100)
              toast.dismiss(toastId)
              toast.success('Product file uploaded!')
            } catch (urlErr) {
              console.error('Error getting download URL:', urlErr)
              toast.dismiss(toastId)
              toast.error('Failed to get download link')
              setUploading(false)
            }
          }
        )
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Fatal upload error:', error)
      toast.dismiss(toastId)
      
      let msg = 'Initialization failed'
      if (error.code === 'storage/retry-limit-exceeded') {
        msg = 'Connection timed out. Please try again.'
      }
      
      toast.error(msg)
      setUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.uid) return

    // dynamic limit check
    if (!editingId && products.length >= limits.maxProducts) {
      if (user?.plan === 'PRO') {
        toast.error("Pro plan is limited to 10 products. Please upgrade to Pro+ for unlimited products!")
        openUpgradeModal('maxProducts')
      } else {
        toast.error(`${user?.plan === 'PRO_PLUS' ? 'Pro+' : 'Free'} plan limited to ${limits.maxProducts} products. Upgrade for more!`)
        openUpgradeModal('maxProducts')
      }
      return
    }

    if (!editForm.name) {
      toast.error('Product title is required')
      return
    }

    if (editForm.price === undefined || editForm.price < 0) {
      toast.error('Valid price is required')
      return
    }

    setIsSavingProduct(true)
    const path = `users/${user.uid}/products`
    
    try {
      // Clean up editForm to remove 'id' and undefined/null values that might cause Firestore issues
      const cleanedData = Object.fromEntries(
        Object.entries(editForm).filter(([k, v]) => k !== 'id' && v !== undefined && v !== null)
      )

      const data = {
        ...cleanedData,
        userId: user.uid,
        updatedAt: serverTimestamp()
      }

      if (editingId) {
        await updateDoc(doc(db, path, editingId), data)
        toast.success('Product updated successfully')
      } else {
        await addDoc(collection(db, path), {
          ...data,
          position: products.length,
          totalSales: 0,
          totalRevenue: 0,
          createdAt: serverTimestamp()
        })
        toast.success('Product launched successfully')
      }

      setIsEditing(false)
      setEditingId(null)
      setImagePreview(null)
      setEditForm({
        name: '',
        description: '',
        price: 0,
        currency: 'INR',
        imageUrl: '',
        fileUrl: '',
        fileSize: 0,
        fileType: '',
        category: 'E-book',
        isActive: true
      })
    } catch (err: unknown) {
      console.error('Error saving product:', err)
      handleFirestoreError(err, OperationType.WRITE, path)
    } finally {
      setIsSavingProduct(false)
    }
  }

  const handleDelete = (id: string) => {
    setDeleteId(id)
  }

  const confirmDelete = async () => {
    if (!user?.uid || !deleteId) return
    const path = `users/${user.uid}/products/${deleteId}`
    try {
      await deleteDoc(doc(db, path))
      toast.success('Product deleted successfully')
      setDeleteId(null)
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path)
    }
  }

  const toggleActive = async (product: Product) => {
    if (!user?.uid) return
    const path = `users/${user.uid}/products/${product.id}`
    try {
      await updateDoc(doc(db, path), {
        isActive: !product.isActive,
        updatedAt: serverTimestamp()
      })
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path)
    }
  }

  return (
    <PlanGate feature="canSellProducts">
      <div className="max-w-5xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-ink flex items-center gap-3">
             <ShoppingBag className="text-orange" size={32} />
             Digital Products
          </h1>
          <p className="text-muted text-sm mt-1">Sustain your creativity by selling digital goods</p>
        </div>
        
        <button
          onClick={() => {
            setIsEditing(true)
            setEditingId(null)
            setImagePreview(null)
            setEditForm({
              name: '',
              description: '',
              price: 0,
              currency: 'INR',
              imageUrl: '',
              fileUrl: '',
              category: 'E-book',
              isActive: true
            })
          }}
          className="w-full sm:w-auto bg-orange text-white px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange/20 text-sm sm:text-base"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          Create Product
        </button>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: 'Revenue', value: formatPrice(stats.totalRevenue, products[0]?.currency || 'INR'), icon: IndianRupee, color: 'text-orange', bg: 'bg-orange/5' },
          { label: 'Sales', value: stats.totalSales, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-500/5' },
          { label: 'Active', value: stats.activeProducts, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/5' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-cream-3 p-4 sm:p-5 rounded-2xl sm:rounded-[2rem] flex flex-col justify-between shadow-sm hover:border-orange transition-all group min-h-[100px] sm:min-h-[130px]"
          >
            <div className="flex items-center justify-between mb-2">
                 <span className="text-[8px] sm:text-[10px] font-black text-muted uppercase tracking-widest bg-cream-3 px-2 py-1 rounded-md">{stat.label}</span>
                 <div className={cn("p-2 sm:p-2.5 rounded-xl transition-all shadow-sm", stat.bg, stat.color)}>
                    <stat.icon size={16} className="sm:w-[20px] sm:h-[20px]" />
                 </div>
            </div>
            <h3 className="font-syne font-black text-base sm:text-2xl text-ink truncate leading-tight transition-colors group-hover:text-ink">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50 text-center">
              <Loader2 className="w-12 h-12 text-orange animate-spin" />
              <p className="text-sm font-bold text-ink">Synchronizing your inventory...</p>
            </div>
          ) : products.length === 0 && !isEditing ? (
            <div className="card text-center py-20 bg-cream/30 border-dashed border-2 border-cream-3">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-ink/5">
                <Upload size={40} className="text-orange" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">Ready to start earning?</h3>
              <p className="text-muted text-sm mb-8 max-w-xs mx-auto">
                Upload your first PDF, ZIP, or Preset and start selling to your audience today.
              </p>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-ink text-white px-8 py-3 rounded-2xl font-bold hover:scale-105 transition-all"
              >
                Launch Your First Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              <AnimatePresence mode="popLayout">
                {products.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1, 
                      y: 0,
                      transition: { delay: i * 0.05 }
                    }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    whileHover={{ y: -5 }}
                    className={cn(
                      "relative group bg-white rounded-[20px] sm:rounded-[32px] p-3 sm:p-4 flex flex-col transition-all duration-500 border-2 border-transparent hover:border-orange/30 shadow-xl shadow-ink/5 hover:shadow-orange/10",
                      !p.isActive && "opacity-60"
                    )}
                  >
                    {/* Status Badge */}
                    {!p.isActive && (
                      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
                        <span className="bg-ink/80 backdrop-blur-md text-[8px] sm:text-[10px] text-white font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest border border-white/10 shadow-lg">
                          Inactive
                        </span>
                      </div>
                    )}

                    {/* Image/Thumbnail Container */}
                    <div className="relative aspect-square rounded-[16px] sm:rounded-[24px] overflow-hidden mb-3 sm:mb-6 bg-cream-3 border-2 border-cream-2 group-hover:border-orange/50 transition-colors">
                      {p.imageUrl ? (
                        <img 
                           src={p.imageUrl} 
                           alt={p.name} 
                           className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-1 sm:gap-2 p-2">
                           <ImageIcon size={24} className="sm:w-10 sm:h-10 text-muted/60" strokeWidth={1.5} />
                           <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-40 text-center">Digital Item</span>
                        </div>
                      )}
                      
                      {/* Hover Overlay for Quick Actions */}
                      <div className="absolute inset-0 bg-ink/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-3">
                        <button
                          onClick={() => toggleActive(p)}
                          className={cn(
                            "w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-2xl flex items-center justify-center transition-all hover:scale-110 shadow-xl",
                            p.isActive ? "bg-white text-orange" : "bg-white text-muted"
                          )}
                        >
                          {p.isActive ? <Eye size={14} className="sm:w-5 sm:h-5" /> : <EyeOff size={14} className="sm:w-5 sm:h-5" />}
                        </button>
                        <button
                          onClick={() => {
                            setEditForm(p)
                            setEditingId(p.id)
                            setIsEditing(true)
                            setImagePreview(p.imageUrl)
                          }}
                          className="w-8 h-8 sm:w-12 sm:h-12 bg-orange text-white rounded-lg sm:rounded-2xl flex items-center justify-center transition-all hover:scale-110 shadow-xl"
                        >
                          <Edit2 size={14} className="sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="w-8 h-8 sm:w-12 sm:h-12 bg-white text-red-500 rounded-lg sm:rounded-2xl flex items-center justify-center transition-all hover:scale-110 shadow-xl"
                        >
                          <Trash2 size={14} className="sm:w-5 sm:h-5" />
                        </button>
                      </div>

                      {/* Category Tag */}
                      <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
                        <span className="bg-white/95 backdrop-blur-md text-[7px] sm:text-[9px] font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border border-ink/5 shadow-sm text-ink/80 uppercase tracking-widest">
                          {p.category}
                        </span>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 px-0.5 sm:px-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs sm:text-lg font-black text-ink mb-0.5 sm:mb-1 group-hover:text-orange transition-colors line-clamp-1">
                          {p.name}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-muted font-medium line-clamp-2 mb-2 sm:mb-4 leading-relaxed opacity-70">
                          {p.description || "No description provided"}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2 sm:gap-3 mt-auto pt-2 sm:pt-4 border-t border-cream-2 border-dashed">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[8px] sm:text-[10px] font-black uppercase text-muted tracking-tighter opacity-50">Price</span>
                            <p className="text-sm sm:text-2xl font-black text-ink tracking-tight">
                              {formatPrice(p.price, p.currency)}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className="text-[8px] sm:text-[10px] font-black uppercase text-muted tracking-tighter opacity-50">Sales</span>
                            <div className="flex items-center gap-1 text-orange font-black text-[10px] sm:text-sm">
                               <Package size={12} className="sm:w-[14px] sm:h-[14px]" />
                               {p.totalSales || 0}
                            </div>
                          </div>
                        </div>

                        {/* Revenue Micro-stat */}
                        <div className="bg-cream/30 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 flex items-center justify-between">
                           <div className="flex items-center gap-1 sm:gap-2">
                             <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                               <TrendingUp size={10} className="sm:w-3 sm:h-3" />
                             </div>
                             <span className="text-[8px] sm:text-[9px] font-black uppercase text-ink/40 tracking-widest">Revenue</span>
                           </div>
                           <span className="text-[10px] sm:text-xs font-black text-ink">
                             {formatPrice(p.totalRevenue || 0, p.currency)}
                           </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      {/* Upload/Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-ink/90 backdrop-blur-md"
            onClick={() => !(uploadingImage || uploadingProduct) && setIsEditing(false)}
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-4 sm:p-6 border-b border-cream-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center text-orange">
                  {editingId ? <Edit2 size={20} /> : <Plus size={20} />}
                </div>
                <h2 className="text-xl font-bold text-ink">
                  {editingId ? 'Refine Product' : 'List New Product'}
                </h2>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 hover:bg-cream-3 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-8 space-y-8 overflow-y-auto custom-scrollbar">
               {/* File Upload Area */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Image Upload */}
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-ink/40">Product Image (Main)</label>
                    <div 
                      onClick={() => !uploadingImage && imageInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDraggingImage(true)
                      }}
                      onDragLeave={() => setIsDraggingImage(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDraggingImage(false)
                        const file = e.dataTransfer.files?.[0]
                        if (file && file.type.startsWith('image/')) {
                          handleFileUpload(file, 'image')
                        } else if (file) {
                          toast.error('Please upload an image file')
                        }
                      }}
                      className={cn(
                        "relative aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all group cursor-pointer",
                        editForm.imageUrl ? "border-solid border-orange" : "bg-cream/30",
                        isDraggingImage ? "border-orange bg-orange/5 scale-[1.02]" : "border-cream-3 hover:border-orange/30",
                        uploadingImage && "cursor-not-allowed opacity-80"
                      )}
                    >
                      {/* Hidden Input */}
                      <input 
                         ref={imageInputRef}
                         type="file" 
                         accept="image/*" 
                         className="hidden"
                         onChange={e => {
                           const file = e.target.files?.[0]
                           if (!file) return
                           handleFileUpload(file, 'image')
                           e.target.value = ''
                         }}
                      />

                      {uploadingImage ? (
                        <div className="text-center p-6 w-full z-10 px-6">
                          <Loader2 className="mx-auto mb-3 text-orange animate-spin" size={32} />
                          <div className="w-full h-1.5 bg-cream-3 rounded-full overflow-hidden mb-2">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${uploadProgress}%` }}
                               className="h-full bg-orange" 
                             />
                          </div>
                          <p className="text-[10px] font-black text-orange uppercase tracking-widest">{Math.round(uploadProgress)}% Uploading</p>
                        </div>
                      ) : (editForm.imageUrl || imagePreview) ? (
                        <>
                          <img src={imagePreview || editForm.imageUrl} className="w-full h-full object-cover" />
                          <div className={cn(
                            "absolute inset-0 bg-ink/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10",
                            !imagePreview && editForm.imageUrl && "opacity-0"
                          )}>
                             <Upload className="text-white mb-2" size={24} />
                             <span className="text-[10px] font-black text-white uppercase tracking-widest">Change Image</span>
                          </div>
                          {uploadingImage && (
                            <div className="absolute inset-0 bg-ink/40 flex flex-col items-center justify-center z-20">
                               <Loader2 className="text-white animate-spin" size={32} />
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center p-6 z-10">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm text-muted group-hover:text-orange transition-colors">
                            <ImageIcon size={24} />
                          </div>
                          <p className="text-xs font-bold text-ink">Click or drag image</p>
                          <p className="text-[10px] text-muted mt-1">High-quality square PNG/JPG</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product File Upload */}
                  <div className="space-y-3">
                    <label className="text-xs font-black uppercase tracking-widest text-ink/40">Product File (Secure)</label>
                    <div 
                      onClick={() => !uploadingProduct && productInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault()
                        setIsDraggingProduct(true)
                      }}
                      onDragLeave={() => setIsDraggingProduct(false)}
                      onDrop={(e) => {
                        e.preventDefault()
                        setIsDraggingProduct(false)
                        const file = e.dataTransfer.files?.[0]
                        if (file) {
                          handleFileUpload(file, 'product')
                        }
                      }}
                      className={cn(
                        "relative aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all group cursor-pointer",
                        editForm.fileUrl ? "border-solid border-green-500 bg-green-50/10" : "bg-cream/30",
                        isDraggingProduct ? "border-orange bg-orange/5 scale-[1.02]" : "border-cream-3 hover:border-orange/30",
                        uploadingProduct && "cursor-not-allowed opacity-80"
                      )}
                    >
                      {/* Hidden Input */}
                      <input 
                         ref={productInputRef}
                         type="file" 
                         className="hidden"
                         onChange={e => {
                           const file = e.target.files?.[0]
                           if (!file) return
                           handleFileUpload(file, 'product')
                           e.target.value = ''
                         }}
                      />

                      {uploadingProduct ? (
                        <div className="text-center p-6 w-full px-8 z-10">
                          <Loader2 className="mx-auto mb-4 text-orange animate-spin" size={32} />
                          <div className="w-full h-1.5 bg-cream-3 rounded-full overflow-hidden mb-2">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${uploadProgress}%` }}
                               className="h-full bg-orange" 
                             />
                          </div>
                          <p className="text-[10px] font-black text-orange uppercase tracking-widest">{Math.round(uploadProgress)}% Uploading</p>
                        </div>
                      ) : editForm.fileUrl ? (
                        <div className="text-center p-6 z-10">
                          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-sm text-green-500">
                             <FileText size={32} />
                          </div>
                          <p className="text-sm font-bold text-ink max-w-[150px] truncate mx-auto">{editForm.fileType?.includes('pdf') ? 'Product PDF' : 'Digital Archive'}</p>
                          <p className="text-[10px] text-muted font-black uppercase mt-1">{(editForm.fileSize! / 1024 / 1024).toFixed(2)} MB</p>
                          <div className="mt-4 bg-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-orange border border-cream-3 shadow-sm group-hover:bg-cream transition-colors">
                            Change File
                          </div>
                        </div>
                      ) : (
                        <div className="text-center p-6 z-10">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm text-muted group-hover:text-orange transition-colors">
                            <Upload size={24} />
                          </div>
                          <p className="text-xs font-bold text-ink">Click or drag file</p>
                          <p className="text-[10px] text-muted mt-1">PDF, ZIP, MP3 (Max 100MB)</p>
                        </div>
                      )}
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-ink/40 px-1">Product Title</label>
                    <input 
                      type="text"
                      required
                      value={editForm.name}
                      onChange={e => setEditForm(prev => ({...prev, name: e.target.value}))}
                      placeholder="e.g. Lightroom Master Presets Pack"
                      className="w-full bg-cream p-4 rounded-2xl border-2 border-transparent focus:border-orange focus:bg-white outline-none transition-all font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-ink/40 px-1">Category</label>
                        <div ref={categoryDropdownRef} className="relative">
                          <button
                            type="button"
                            onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                            className="w-full flex items-center justify-between bg-cream border-2 border-transparent hover:border-orange/20 focus:border-orange focus:bg-white p-4 rounded-2xl outline-none transition-all font-bold text-left cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              {(() => {
                                const IconComponent = CATEGORY_ICONS[editForm.category || 'Other'] || CATEGORY_ICONS['Other'];
                                return <IconComponent size={18} className="text-orange" />;
                              })()}
                              <span className="text-sm font-bold text-ink">{editForm.category || 'Other'}</span>
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
                                className="absolute left-0 right-0 mt-2 bg-white border-2 border-cream-3 shadow-xl rounded-2xl p-2 space-y-1 max-h-[300px] overflow-y-auto"
                              >
                                {CATEGORIES.map(c => {
                                  const IconComponent = CATEGORY_ICONS[c] || CATEGORY_ICONS['Other'];
                                  const isSelected = editForm.category === c;
                                  return (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => {
                                        setEditForm(prev => ({ ...prev, category: c }))
                                        setIsCategoryDropdownOpen(false)
                                      }}
                                      className={cn(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all",
                                        isSelected 
                                          ? "bg-orange text-white" 
                                          : "text-ink hover:bg-cream"
                                      )}
                                    >
                                      <IconComponent size={18} className={cn(isSelected ? "text-white" : "text-orange")} />
                                      <span>{c}</span>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-ink/40 px-1">Price</label>
                        <div className="relative">
                          <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
                          <input 
                            type="number"
                            required
                            min="0"
                            value={editForm.price}
                            onChange={e => setEditForm(prev => ({...prev, price: Number(e.target.value)}))}
                            className="w-full bg-cream p-4 pl-12 rounded-2xl border-2 border-transparent focus:border-orange focus:bg-white outline-none transition-all font-bold"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-ink/40 px-1">Description</label>
                    <textarea 
                      value={editForm.description}
                      onChange={e => setEditForm(prev => ({...prev, description: e.target.value}))}
                      placeholder="Explain the value buyers will get from this product..."
                      rows={4}
                      className="w-full bg-cream p-4 rounded-2xl border-2 border-transparent focus:border-orange focus:bg-white outline-none transition-all font-bold resize-none"
                    />
                  </div>

                  <div className="p-4 bg-cream/30 rounded-2xl flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange shadow-sm">
                           {editForm.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                        </div>
                        <div>
                           <p className="text-sm font-bold text-ink">Public Visibility</p>
                           <p className="text-[10px] text-muted font-bold">Show this product on your profile</p>
                        </div>
                     </div>
                     <button
                        type="button"
                        onClick={() => setEditForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                        className={cn(
                          "w-14 h-8 rounded-full transition-all relative",
                          editForm.isActive ? "bg-orange" : "bg-muted/20"
                        )}
                     >
                        <motion.div 
                          animate={{ x: editForm.isActive ? 24 : 4 }}
                          className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-md" 
                        />
                     </button>
                  </div>
               </div>
            </div>

            <div className="p-4 sm:p-6 pb-6 sm:pb-8 bg-cream/5 border-t border-cream-3 flex gap-3 sm:gap-4 shrink-0">
              <button
                type="button"
                disabled={uploadingImage || uploadingProduct}
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 sm:py-4 text-xs sm:text-sm font-bold text-ink bg-white border-2 border-cream-3 rounded-2xl hover:bg-cream transition-all flex items-center justify-center gap-2"
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={uploadingImage || uploadingProduct || isSavingProduct || !editForm.name || !editForm.price}
                type="button"
                className="flex-[2] py-3 sm:py-4 text-xs sm:text-sm font-bold text-white bg-orange rounded-2xl shadow-xl shadow-orange/20 hover:scale-[1.02] active:scale-[0.99] disabled:grayscale disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {(uploadingImage || uploadingProduct || isSavingProduct) ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSavingProduct ? 'Syncing...' : (editingId ? 'Save Changes' : (editForm.fileUrl ? 'Launch Product' : 'Save Draft'))}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/90 backdrop-blur-md"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-[24px] flex items-center justify-center mx-auto mb-6 text-red-500">
                <Trash2 size={40} />
              </div>
              
              <h3 className="text-2xl font-black text-ink mb-2">Delete Product?</h3>
              <p className="text-muted text-sm mb-8">
                This action is permanent and cannot be undone. All product data will be lost.
              </p>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={confirmDelete}
                  className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-sm hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                >
                  DELETE PERMANENTLY
                </button>
                <button
                  onClick={() => setDeleteId(null)}
                  className="w-full py-4 bg-cream text-ink rounded-2xl font-black text-sm hover:bg-cream-3 transition-all active:scale-95"
                >
                  BACK TO STORE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Analytics Tip */}
    </div>
    </PlanGate>
  )
}
