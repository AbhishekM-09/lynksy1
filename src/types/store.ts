import type { Timestamp } from 'firebase/firestore'

export type ProductCategory =
  | 'preset'
  | 'ebook'
  | 'template'
  | 'course'
  | 'music'
  | 'art'
  | 'other'

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'delivered'
  | 'refunded'
  | 'failed'

export interface Product {
  id: string
  uid: string
  title: string
  name?: string              // Fallback for older products
  description: string
  shortDesc: string
  price: number              // in paise (₹1 = 100 paise). 0 = free
  currency: 'INR'
  category: ProductCategory
  tags: string[]
  coverImageUrl: string | null
  imageUrl?: string | null   // Fallback for older products
  image?: string | null      // Some older products might have 'image'
  previewImageUrls: string[]
  fileUrl: string            // Firebase Storage path (private)
  fileName: string
  fileSize: number           // bytes
  fileType: string
  isActive: boolean
  isFeatured: boolean
  totalSales: number
  totalRevenue: number       // in paise
  rating: number             // 0-5
  reviewCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Order {
  id: string
  productId: string
  productTitle: string
  productPrice: number
  buyerName: string
  buyerEmail: string
  buyerPhone: string | null
  status: OrderStatus
  emailConsent?: boolean
  downloadToken: string
  downloadUrl: string
  downloadExpiresAt: Timestamp
  downloadCount: number
  maxDownloads: number
  platformFee: number
  creatorEarnings: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Review {
  id: string
  productId: string
  buyerName: string
  buyerEmail: string
  rating: number
  comment: string
  isVerified: boolean
  createdAt: Timestamp
}

export interface DownloadToken {
  token: string
  orderId: string
  productId: string
  uid: string
  fileUrl: string
  fileName: string
  fileSize: number
  expiresAt: Timestamp
  downloadCount: number
  maxDownloads: number
  buyerEmail: string
}

export interface StoreStats {
  totalRevenue: number       // paise
  totalSales: number
  totalProducts: number
  activeProducts: number
  pendingOrders: number
  topProduct: { title: string; sales: number } | null
}

export interface PaymentConnection {
  id?: string
  user_id: string
  provider: string
  merchant_id?: string
  account_id?: string
  business_name?: string
  email?: string
  phone?: string
  status: 'connected' | 'disconnected'
  connected_at: Timestamp | null
  last_synced_at: Timestamp | null
  created_at: Timestamp | null
  updated_at: Timestamp | null
}

export interface Withdrawal {
  id: string
  amount: number // in Rupee or paise. Let's make it INR Rupees as requested: "₹8,240", "₹560" etc.
  paymentMethod: 'upi' | 'bank'
  status: 'pending' | 'paid' | 'failed'
  createdAt: Timestamp
  updatedAt: Timestamp
  referenceNumber?: string
  upiId?: string
  accountHolderName?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
}

