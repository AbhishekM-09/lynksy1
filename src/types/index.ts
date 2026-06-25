import { Timestamp } from 'firebase/firestore'

export type PlanType = 'FREE' | 'PRO' | 'PRO_PLUS'

export interface PlanLimits {
  maxLinks: number
  aiPerMonth: number
  maxAiBios: number
  analytics: 'basic' | 'medium' | 'advanced'
  canUseUPI: boolean
  transactionFee: number | null
  canCustomDomain: boolean
  canCustomThumbnails: boolean
  canRemoveBranding: boolean
  canSchedule: boolean
  canSellProducts: boolean
  canCollectEmails: boolean
  themes: string[] | 'all'
  premiumThemes: boolean
  ultraPremiumThemes: boolean
  premiumInsight: boolean
  analyticsHistory: boolean
  customBranding: boolean
  maxProducts: number
}

export interface ThemeSettings {
  primaryColor?: string
  secondaryColor?: string
  animationSpeed?: number
  glowIntensity?: number
  particleDensity?: number
  blurAmount?: number
  cardTransparency?: number
  borderRadius?: number
  fontStyle?: 'sans' | 'mono' | 'serif' | 'display' | 'grotesk' | 'rounded'
  bgGradientIntensity?: number
  avatarRing?: string
  avatarGlow?: string
  avatarRingAnimation?: string
  nameGlow?: string
  linkGlow?: string
  linkBackdrop?: string
}

export interface User {
  uid: string
  email: string
  username: string
  displayName: string
  firstName: string
  lastName: string
  bio: string
  avatarUrl: string | null
  category: string
  location: string
  website: string
  instagramHandle: string
  youtubeHandle: string
  twitterHandle: string
  spotifyUrl: string
  linkedinHandle: string
  upiId?: string
  customDomain?: string
  customDomainStatus?: 'PENDING' | 'CONNECTED' | 'ERROR'
  customDomainVerifiedAt?: Timestamp | null
  plan: PlanType
  planType: 'Monthly' | 'Yearly'
  planStartedAt: Timestamp | null
  planExpiresAt: Timestamp | null
  themeId: string
  themeSettings?: ThemeSettings
  accentColor: string
  bgColor: string
  buttonStyle: 'filled' | 'outline' | 'soft' | 'pill'
  textColor?: string
  buttonColor?: string
  buttonTextColor?: string
  cardTransparency?: number
  borderRadius?: number
  fontStyle?: 'sans' | 'mono' | 'serif' | 'display' | 'grotesk' | 'rounded'
  avatarRing?: string
  avatarGlow?: string
  avatarRingAnimation?: string
  nameGlow?: string
  isActive: boolean
  isVerified: boolean
  verifiedBadgeStyle?: 'orange' | 'dark-gold' | 'glass' | 'outline' | 'dark' | 'matte-emerald' | 'matte-rose' | 'matte-cobalt' | 'matte-purple' | 'matte-ruby'
  emailVerified?: boolean
  provider?: string | null
  providers?: string[]
  passwordEnabled?: boolean
  status?: 'ACTIVE' | 'SUSPENDED' | 'BANNED'
  onboardingDone: boolean
  usernameChangeCount: number
  aiUsedThisMonth: number
  aiBiosUsedThisMonth: number
  aiResetAt: Timestamp
  authProviders: string[]
  settings?: {
    emailNotifications: boolean
    twoFactorAuth: boolean
    searchIndexing: boolean
    pinCode?: string
    pinEnabled?: boolean
  }
  emailFormTitle?: string
  emailFormDesc?: string
  emailFormBtn?: string
  emailFormActive?: boolean
  welcomeEmailSubject?: string
  welcomeEmailBody?: string
  welcomeEmailActive?: boolean
  upiEnabled?: boolean
  upiTitle?: string
  upiDescription?: string
  upiDefaultAmount?: string
  upiDisplayName?: string
  upiGoalEnabled?: boolean
  upiGoalTitle?: string
  upiGoalTarget?: string
  upiGoalRaised?: string
  subscriptionStatus?: 'ACTIVE' | 'EXPIRED' | null
  purchaseDate?: Timestamp | null
  expiryDate?: Timestamp | null
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface EmailSubscriber {
  id: string
  creatorId: string
  creatorUsername: string
  email: string
  source: string
  subscribedAt: Timestamp
}

export interface Link {
  id: string
  title: string
  url: string
  type: LinkType
  emoji: string
  description: string
  thumbnailUrl: string | null
  position: number
  isActive: boolean
  isPinned: boolean
  showFrom: Timestamp | null
  showUntil: Timestamp | null
  utmSource: string
  utmMedium: string
  utmCampaign: string
  clickCount: number
  createdAt: Timestamp
  updatedAt: Timestamp

  // Custom UPI fields
  upiId?: string
  displayName?: string
  defaultAmount?: number
  buttonText?: string
  enabled?: boolean
  upiGoalEnabled?: boolean
  upiGoalTitle?: string
  upiGoalTarget?: number
  upiGoalRaised?: number
}

export type LinkType = 'URL' | 'WHATSAPP' | 'EMAIL' | 'PHONE' | 'UPI' | 'YOUTUBE' | 'INSTAGRAM' | 'FORM'

export interface Theme {
  id: string
  name: string
  bgColor: string
  textColor: string
  accentColor: string
  cardBg: string
  borderColor: string
  buttonStyle: 'filled' | 'outline' | 'pill' | 'soft'
  preview: string // CSS gradient or color for preview card
  requiredPlan: PlanType
  isAnimated?: boolean
  isGlass?: boolean
  fontStyle?: 'sans' | 'mono' | 'serif' | 'display' | 'grotesk' | 'rounded'
  borderRadius?: number
  cardTransparency?: number
  avatarRing?: string
  avatarGlow?: string
  avatarRingAnimation?: string
  nameGlow?: string
  linkGlow?: string
  linkBackdrop?: string
  animationType?: string
  buttonTextColor?: string
}

export interface AnalyticsData {
  totalViews: number
  totalClicks: number
  totalRevenue?: number
  totalSales?: number
  ctr: number
  uniqueVisitors: number
  viewsTrend: number
  clicksTrend: number
  dailyChart: { date: string; views: number; clicks: number }[]
  devices: { device: string; count: number }[]
  regions: { region: string; count: number }[]
  topLinks: { id: string; title: string; clicks: number }[]
  sources: { source: string; count: number }[]
  bestHour: string
}

export interface PageView {
  uid: string
  username: string
  device: string
  browser: string
  region: string
  referer: string
  timestamp: Timestamp
}

export interface ClickEvent {
  uid: string
  linkId: string
  linkTitle: string
  device: string
  browser: string
  region: string
  timestamp: Timestamp
}

export interface Product {
  id: string
  userId: string
  uid?: string // support for uid field
  name?: string
  title: string
  description: string
  shortDesc?: string
  price: number // in paise or actual value (careful with conversion)
  currency: string
  imageUrl?: string // old field
  coverImageUrl: string | null
  previewImageUrls?: string[]
  fileUrl: string
  fileName?: string
  fileSize: number
  fileType: string
  category: string
  tags?: string[]
  isActive: boolean
  isFeatured?: boolean
  position: number
  totalSales: number
  totalRevenue: number
  rating?: number
  reviewCount?: number
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Order {
  id: string
  productId: string
  creatorId: string
  buyerEmail: string
  amount: number
  currency: string
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED'
  downloadToken: string
  createdAt: Timestamp
}

export interface Download {
  id: string
  orderId: string
  productId: string
  downloadCount: number
  lastDownloadedAt: Timestamp
  ipAddress: string
}

export interface PublicProfile {
  username: string
  displayName: string
  bio: string
  avatarUrl: string | null
  isVerified: boolean
  themeId: string
  accentColor: string
  bgColor: string
  buttonStyle: string
  textColor?: string
  buttonColor?: string
  buttonTextColor?: string
  instagramHandle: string
  youtubeHandle: string
  twitterHandle: string
  spotifyUrl: string
  linkedinHandle: string
  showBranding: boolean
  links: PublicLink[]
}

export interface PublicLink {
  id: string
  title: string
  url: string
  emoji: string
  description: string
  thumbnailUrl: string | null
  type: LinkType
  utmSource: string
  utmMedium: string
  utmCampaign: string
}

export interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: 'PAID' | 'VOID' | 'UNPAID'
  plan: string
  planType: string
  billingDate: Timestamp
  createdAt: Timestamp
}

export interface UpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  feature: string
  requiredPlan: PlanType
  currentPlan: PlanType
}

export interface DetailedEvent {
  type: 'Page View' | 'Link Click'
  timestamp: Date | Timestamp
  dateStr: string
  device: string
  browser: string
  region: string
  refererOrLink: string
  linkTitle?: string
}

export interface ShortLink {
  id: string
  userId: string
  originalUrl: string
  shortCode: string
  clicks: number
  createdAt: Timestamp
  active: boolean
  uniqueVisitors?: number
  devices?: Record<string, number>
  browsers?: Record<string, number>
  countries?: Record<string, number>
  referrers?: Record<string, number>
  firstClick?: Timestamp | null
  lastClick?: Timestamp | null
}

export interface ShortLinkClick {
  id: string
  device: string
  browser: string
  country: string
  referrer: string
  timestamp: Timestamp
  isUnique: boolean
}

