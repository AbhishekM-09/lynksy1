import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, addDoc, query, where, orderBy, limit,
  serverTimestamp, increment, Timestamp
} from 'firebase/firestore'
import {
  ref, uploadBytes, getDownloadURL, deleteObject,
} from 'firebase/storage'
import { db, storage, auth } from './config'
import { nanoid } from 'nanoid'
import type { Product, Order, Review, DownloadToken, StoreStats, Withdrawal } from '@/types/store'

// ─── UTILS ──────────────────────────────────────────────────

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
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ─── PRODUCTS ──────────────────────────────────────────────────

export async function getProducts(uid: string): Promise<Product[]> {
  const q = query(
    collection(db, 'users', uid, 'products')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
}

export async function getActiveProducts(uid: string): Promise<Product[]> {
  const q = query(
    collection(db, 'users', uid, 'products'),
    where('isActive', '==', true)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
}

export async function getProductById(uid: string, productId: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'products', productId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Product
}

export async function createProduct(
  uid: string,
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalSales' | 'totalRevenue' | 'rating' | 'reviewCount'>
): Promise<string> {
  const productRef = await addDoc(collection(db, 'users', uid, 'products'), {
    ...data,
    uid,
    totalSales: 0,
    totalRevenue: 0,
    rating: 0,
    reviewCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return productRef.id
}

export async function updateProduct(
  uid: string,
  productId: string,
  data: Partial<Product>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _, uid: __, createdAt: ___, ...finalData } = data
  await updateDoc(doc(db, 'users', uid, 'products', productId), {
    ...finalData,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteProduct(uid: string, productId: string): Promise<void> {
  const path = `users/${uid}/products/${productId}`
  console.log('deleteProduct init:', { uid, productId, path })
  
  if (!uid || !productId) {
    console.error('deleteProduct: Missing uid or productId')
    throw new Error('Missing identification for deletion (uid or productId is empty)')
  }

  // 1. Delete the Firestore document FIRST (Critical Step)
  // We do this first so the user sees the item disappear immediately from queries
  try {
    console.log('Attempting primary Firestore deleteDoc on:', path)
    const productDocRef = doc(db, 'users', uid, 'products', productId)
    
    // Fetch data BEFORE deletion for storage cleanup references
    const productSnap = await getDoc(productDocRef)
    const productData = productSnap.exists() ? (productSnap.data() as Product) : null
    
    await deleteDoc(productDocRef)
    console.log('Firestore deleteDoc successful for:', productId)

    // 2. Cleanup Storage (Best effort, non-blocking)
    if (productData) {
      // Execute in background, don't await to minimize UI latency
      const cleanupStorage = async () => {
        try {
          // Main File
          if (productData.fileUrl && !productData.fileUrl.startsWith('http')) {
            const fileRef = ref(storage, productData.fileUrl)
            await deleteObject(fileRef).catch(e => console.warn('Storage: File delete failed (may not exist):', e))
          }
          
          // Cover Image
          const coverUrl = productData.coverImageUrl || productData.imageUrl || productData.image
          if (coverUrl && (coverUrl.includes('firebasestorage') || !coverUrl.startsWith('http')) && !coverUrl.startsWith('https://lh3.googleusercontent.com')) {
            const coverRef = ref(storage, coverUrl)
            await deleteObject(coverRef).catch(e => console.warn('Storage: Cover delete failed (may not exist):', e))
          }
        } catch (e) {
          console.warn('Storage cleanup non-critical error:', e)
        }
      }
      cleanupStorage()
    }
  } catch (error) {
    console.error('deleteProduct CRITICAL Firestore error:', error)
    handleFirestoreError(error, OperationType.DELETE, path)
  }
}

// ─── FILE UPLOAD ───────────────────────────────────────────────

export async function uploadProductFile(
  uid: string,
  productId: string,
  file: File
): Promise<{ path: string; name: string; size: number; type: string }> {
  // Validate file
  const MAX_SIZE = 500 * 1024 * 1024 // 500MB
  if (file.size > MAX_SIZE) throw new Error('File must be under 500MB')

  const allowedTypes = [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'audio/mpeg', 'audio/mp3',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]
  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.xmp')) {
    throw new Error('File type not supported. Allowed: PDF, ZIP, images, audio, video, Excel')
  }

  // Double-Check Blocked Dangerous Extensions (Executables, installer packages, shell scripts)
  const filenameLower = file.name.toLowerCase();
  const dangerousExtensions = ['.exe', '.sh', '.js', '.ts', '.jsx', '.tsx', '.bat', '.cmd', '.msi', '.vbs', '.py', '.php', '.pl', '.cgi', '.jar', '.html', '.htm', '.com', '.scr', '.vbe', '.pif'];
  for (const ext of dangerousExtensions) {
    if (filenameLower.endsWith(ext)) {
      throw new Error(`Uploading executable files or scripting files (${ext}) is strictly prohibited for security reasons.`);
    }
  }

  const ext = file.name.split('.').pop()
  const storagePath = `products/${uid}/${productId}/file.${ext}`
  const storageRef = ref(storage, storagePath)

  await uploadBytes(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      uploadedBy: uid,
      originalName: file.name,
    },
  })

  return {
    path: storagePath,
    name: file.name,
    size: file.size,
    type: file.type,
  }
}

export async function uploadProductCover(
  uid: string,
  productId: string,
  file: File
): Promise<string> {
  const allowed = ['image/jpeg', 'image/png', 'image/webp']
  const fileExt = file.name ? file.name.split('.').pop()?.toLowerCase() : ''
  let fileType = file.type
  if (!allowed.includes(fileType)) {
    if (fileExt === 'jpg' || fileExt === 'jpeg') fileType = 'image/jpeg'
    else if (fileExt === 'png') fileType = 'image/png'
    else if (fileExt === 'webp') fileType = 'image/webp'
  }

  if (!allowed.includes(fileType)) throw new Error('Cover must be JPEG, PNG, or WebP')
  if (file.size > 5 * 1024 * 1024) throw new Error('Cover image must be under 5MB')

  const ext = fileType.split('/')[1]
  const storagePath = `products/${uid}/${productId}/cover.${ext}`
  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, file, { contentType: fileType })
  return getDownloadURL(storageRef)
}

// ─── ORDERS ────────────────────────────────────────────────────

export async function getOrders(uid: string, limitCount = 50): Promise<Order[]> {
  const q = query(
    collection(db, 'users', uid, 'orders'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
}

export async function getOrdersByProduct(uid: string, productId: string): Promise<Order[]> {
  const q = query(
    collection(db, 'users', uid, 'orders'),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order))
}

export async function createOrder(
  uid: string,
  data: {
    productId: string
    productTitle: string
    productPrice: number
    buyerName: string
    buyerEmail: string
    buyerPhone: string | null
    razorpayOrderId: string // Keeping for DB consistency, can be 'MANUAL' or 'FREE'
    emailConsent?: boolean
  }
): Promise<string> {
  const token = nanoid(32) // Secure download token
  const downloadExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

  let plan = 'FREE'
  try {
    const userSnap = await getDoc(doc(db, 'users', uid))
    if (userSnap.exists()) {
      plan = userSnap.data()?.plan || 'FREE'
    }
  } catch (error) {
    console.error('Error fetching creator plan for order fee calculation:', error)
  }

  const isPro = plan === 'PRO'
  const isProPlus = plan === 'PRO_PLUS'
  const feePercent = (isPro || isProPlus) ? 0.0 : 0.10
  const platformFee = Math.round(data.productPrice * feePercent)
  const creatorEarnings = data.productPrice - platformFee

  const orderRef = await addDoc(collection(db, 'users', uid, 'orders'), {
    ...data,
    status: 'pending',
    emailConsent: data.emailConsent ?? false,
    downloadToken: token,
    downloadUrl: '',
    downloadExpiresAt: Timestamp.fromDate(downloadExpiry),
    downloadCount: 0,
    maxDownloads: 3,
    platformFee,
    creatorEarnings,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return orderRef.id
}

// Called after successful Razorpay payment
export async function confirmOrderPayment(
  uid: string,
  orderId: string,
  productId: string,
  paymentDetails: {
    razorpayPaymentId: string
    razorpaySignature: string
    fileStoragePath: string
    fileName: string
    fileSize: number
    buyerEmail: string
  }
): Promise<string> {
  const token = nanoid(32)
  const downloadExpiry = Timestamp.fromDate(new Date(Date.now() + 48 * 60 * 60 * 1000))

  let finalFileUrl = paymentDetails.fileStoragePath
  let finalFileName = paymentDetails.fileName
  let finalFileSize = paymentDetails.fileSize

  // If details are missing for some reason, try to fetch from product doc
  if (!finalFileUrl || !finalFileName) {
    const productSnap = await getDoc(doc(db, 'users', uid, 'products', productId))
    if (productSnap.exists()) {
      const p = productSnap.data() as Product
      finalFileUrl = finalFileUrl || p.fileUrl
      finalFileName = finalFileName || p.fileName
      finalFileSize = finalFileSize || p.fileSize
    }
  }

  if (!finalFileUrl) {
    const errorMsg = `Product storage path missing for productId: ${productId}`
    throw new Error(errorMsg)
  }

  // Create download token in public collection
  await setDoc(doc(db, 'downloads', token), {
    token,
    orderId,
    productId,
    uid,
    fileUrl: finalFileUrl,
    fileName: finalFileName,
    fileSize: finalFileSize,
    expiresAt: downloadExpiry,
    downloadCount: 0,
    maxDownloads: 3,
    buyerEmail: paymentDetails.buyerEmail,
  } as DownloadToken)

  // Update order status
  await updateDoc(doc(db, 'users', uid, 'orders', orderId), {
    status: 'paid',
    downloadToken: token,
    downloadUrl: `/download/${token}`,
    updatedAt: serverTimestamp(),
  })

  // Increment product sales stats
  const orderSnap = await getDoc(doc(db, 'users', uid, 'orders', orderId))
  const price = orderSnap.data()?.productPrice ?? 0

  await updateDoc(doc(db, 'users', uid, 'products', productId), {
    totalSales: increment(1),
    totalRevenue: increment(price),
    updatedAt: serverTimestamp(),
  })

  // Write to top-level orders too for single source of truth and admin view!
  const orderData = orderSnap.data()
  if (orderData) {
    let creatorName = 'Creator'
    let creatorEmail = ''
    try {
      const creatorSnap = await getDoc(doc(db, 'users', uid))
      if (creatorSnap.exists()) {
        const data = creatorSnap.data()
        creatorName = data.displayName || data.username || 'Creator'
        creatorEmail = data.email || ''
      }
    } catch (e) {
      console.warn('Could not fetch creator details in confirmOrderPayment:', e)
    }

    await setDoc(doc(db, 'orders', orderId), {
      id: orderId,
      productId: orderData.productId || productId,
      productTitle: orderData.productTitle || '',
      productName: orderData.productTitle || '',
      productPrice: orderData.productPrice || price,
      amount: orderData.productPrice || price,
      creatorId: uid,
      userId: uid,
      creatorName: creatorName,
      buyerEmail: orderData.buyerEmail || paymentDetails.buyerEmail,
      buyerName: orderData.buyerName || 'Buyer',
      commission: orderData.platformFee || 0,
      platformFee: orderData.platformFee || 0,
      creatorEarnings: orderData.creatorEarnings || 0,
      currency: orderData.currency || 'INR',
      status: 'paid',
      paymentStatus: 'COMPLETED',
      downloadToken: token,
      createdAt: orderData.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // Update top-level creator payout
    await setDoc(doc(db, 'payouts', uid), {
      id: uid,
      creatorId: uid,
      creatorName: creatorName,
      creatorEmail: creatorEmail,
      pendingAmount: increment(orderData.creatorEarnings || 0),
      paidAmount: increment(0),
      status: 'PENDING',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true })
  }

  return token
}

export async function refundOrder(uid: string, orderId: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'orders', orderId), {
    status: 'refunded',
    updatedAt: serverTimestamp(),
  })
  
  try {
    await updateDoc(doc(db, 'orders', orderId), {
      status: 'refunded',
      paymentStatus: 'REFUNDED',
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    console.warn('Top-level refund update failed (might not exist in other collection):', err)
  }
}

// ─── DOWNLOAD TOKEN VERIFICATION ──────────────────────────────

export async function verifyDownloadToken(
  token: string
): Promise<DownloadToken | { error: string }> {
  const snap = await getDoc(doc(db, 'downloads', token))
  if (!snap.exists()) return { error: 'Invalid download link' }

  const data = snap.data() as DownloadToken

  if (!data.fileUrl) {
    console.error('Download token missing fileUrl:', token, data)
    return { error: 'This download link is corrupted (missing file path). Please contact support.' }
  }

  if (data.expiresAt.toDate() < new Date()) {
    return { error: 'This download link has expired (48-hour limit)' }
  }
  if (data.downloadCount >= data.maxDownloads) {
    return { error: 'Download limit reached (max 3 downloads per purchase)' }
  }

  return data
}

export async function incrementDownloadCount(token: string): Promise<void> {
  await updateDoc(doc(db, 'downloads', token), {
    downloadCount: increment(1),
  })
}

export async function getSignedDownloadUrl(storagePath: string): Promise<string> {
  if (!storagePath) {
    console.error('getSignedDownloadUrl: storagePath is falsy', { storagePath })
    throw new Error('Storage path is missing for this download.')
  }
  
  if (storagePath.startsWith('http')) return storagePath
  
  try {
    const fileRef = ref(storage, storagePath)
    return await getDownloadURL(fileRef)
  } catch (error: unknown) {
    const err = error as { code: string; message: string }
    console.error('getSignedDownloadUrl error:', err, { storagePath })
    if (err.code === 'storage/object-not-found') {
      throw new Error('The file no longer exists in storage. Please contact the creator.')
    }
    throw new Error(`Failed to generate download link: ${err.message}`)
  }
}

// ─── REVIEWS ──────────────────────────────────────────────────

export async function getProductReviews(uid: string, productId: string): Promise<Review[]> {
  const q = query(
    collection(db, 'users', uid, 'reviews'),
    where('productId', '==', productId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Review))
}

export async function addReview(
  uid: string,
  data: Omit<Review, 'id' | 'createdAt'>
): Promise<void> {
  await addDoc(collection(db, 'users', uid, 'reviews'), {
    ...data,
    createdAt: serverTimestamp(),
  })

  // Update product rating
  const product = await getProductById(uid, data.productId)
  if (product) {
    const newCount = product.reviewCount + 1
    const newRating = (product.rating * product.reviewCount + data.rating) / newCount
    await updateDoc(doc(db, 'users', uid, 'products', data.productId), {
      rating: Math.round(newRating * 10) / 10,
      reviewCount: newCount,
      updatedAt: serverTimestamp(),
    })
  }
}

// ─── STORE STATS ──────────────────────────────────────────────

export async function getStoreStats(uid: string, days?: number): Promise<StoreStats> {
  const [productsResult, ordersResult] = await Promise.allSettled([
    getProducts(uid),
    getOrders(uid, 1000), // Increase limit for stats
  ])

  const productsList = productsResult.status === 'fulfilled' ? productsResult.value : []
  let orders = ordersResult.status === 'fulfilled' ? ordersResult.value : []

  // Filter orders by date if specified
  if (days && orders.length > 0) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    orders = orders.filter(o => o.createdAt && o.createdAt.toDate() >= cutoff)
  }

  const activeProducts = productsList.filter(p => p.isActive).length
  const paidOrders = orders.filter(o => o.status === 'paid' || o.status === 'delivered')
  const pendingOrders = orders.filter(o => o.status === 'pending').length
  
  // For public stats, we can rely on totalSales from products if orders is denied
  const totalSales = ordersResult.status === 'fulfilled' 
    ? paidOrders.length 
    : productsList.reduce((sum, p) => sum + (p.totalSales || 0), 0)

  const totalRevenue = ordersResult.status === 'fulfilled'
    ? paidOrders.reduce((sum, o) => sum + o.creatorEarnings, 0)
    : productsList.reduce((sum, p) => sum + (p.totalRevenue || 0), 0)

  const topProduct = productsList.length > 0
    ? [...productsList].sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0))[0]
    : null

  return {
    totalRevenue,
    totalSales,
    totalProducts: productsList.length,
    activeProducts,
    pendingOrders,
    topProduct: topProduct ? { title: topProduct.title, sales: topProduct.totalSales } : null,
  }
}

// ─── WITHDRAWALS ──────────────────────────────────────────────

export async function getWithdrawals(uid: string): Promise<Withdrawal[]> {
  const path = `users/${uid}/withdrawals`
  try {
    const q = query(
      collection(db, 'users', uid, 'withdrawals'),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Withdrawal))
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path)
    return []
  }
}

export async function createWithdrawalRequest(
  uid: string,
  data: Omit<Withdrawal, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  userDetails?: { username: string; email: string; displayName?: string }
): Promise<string> {
  const path = `users/${uid}/withdrawals`
  try {
    const docRef = await addDoc(collection(db, 'users', uid, 'withdrawals'), {
      ...data,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Also write a copy to the root withdrawals collection so that the Admin Panel can display it
    await setDoc(doc(db, 'withdrawals', docRef.id), {
      ...data,
      id: docRef.id,
      uid,
      username: userDetails?.username || 'unknown',
      userEmail: userDetails?.email || 'unknown',
      userDisplayName: userDetails?.displayName || userDetails?.username || 'unknown',
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // Notify the admin via email through our backend API
    try {
      await fetch('/api/withdrawals/notify-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          withdrawalId: docRef.id,
          uid,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          upiId: data.upiId || '',
          accountHolderName: data.accountHolderName || '',
          bankName: data.bankName || '',
          accountNumber: data.accountNumber || '',
          ifscCode: data.ifscCode || '',
          referenceNumber: data.referenceNumber,
          username: userDetails?.username || 'unknown',
          userEmail: userDetails?.email || 'unknown',
          userDisplayName: userDetails?.displayName || 'unknown',
        }),
      })
    } catch (e) {
      console.error('Failed to dispatch withdrawal email to admin:', e)
    }

    return docRef.id
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path)
    throw error
  }
}

