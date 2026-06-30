import {
  doc, getDoc, setDoc, updateDoc, deleteDoc, collection,
  getDocs, addDoc, query, orderBy, where, limit,
  serverTimestamp, Timestamp, increment, writeBatch,
  getDocFromCache, onSnapshot,
} from 'firebase/firestore'
import { auth, db } from './config'
import type { User, Link, PlanType, PageView, ClickEvent, Invoice, AnalyticsData, Product, DetailedEvent, EmailSubscriber } from '@/types'

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ─── USER ────────────────────────────────────────────────────────
export const getUser = async (uid: string): Promise<User | null> => {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return null
    return { uid: snap.id, ...snap.data() } as User
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.warn(`getUser from server failed for ${uid} (${errorMsg}), attempting local cache...`)
    try {
      const cacheSnap = await getDocFromCache(doc(db, 'users', uid))
      if (cacheSnap.exists()) {
        return { uid: cacheSnap.id, ...cacheSnap.data() } as User
      }
    } catch (cacheError) {
      console.warn(`getUser from cache also failed: ${cacheError}`)
    }
    throw error
  }
}

export const getUserByUsername = async (username: string): Promise<User | null> => {
  const usernameLower = username.replace(/^@/, '').toLowerCase().trim()
  try {
    const unameDoc = await getDoc(doc(db, 'usernames', usernameLower))
    if (unameDoc.exists()) {
      const uid = unameDoc.data().uid
      const u = await getUser(uid)
      if (u) return u
    }
  } catch (e) {
    console.error('getUserByUsername index check error:', e)
  }
  
  try {
    // Robust direct query fallback on 'users' collection if index structure is absent/mismatched
    const q = query(collection(db, 'users'), where('username', '==', usernameLower), limit(1))
    const snap = await getDocs(q)
    if (!snap.empty) {
      return { uid: snap.docs[0].id, ...snap.docs[0].data() } as User
    }
  } catch (e) {
    console.error('getUserByUsername fallback query error:', e)
  }
  
  return null
}

export const getUserByCustomDomain = async (domain: string): Promise<User | null> => {
  const domainLower = domain.toLowerCase().trim()
  try {
    const cdDoc = await getDoc(doc(db, 'customDomains', domainLower))
    if (cdDoc.exists() && cdDoc.data().verified) {
      const uid = cdDoc.data().userId
      const u = await getUser(uid)
      if (u) return u
    }
  } catch (e) {
    console.error('getUserByCustomDomain customDomains check error:', e)
  }

  try {
    const domDoc = await getDoc(doc(db, 'domains', domainLower))
    if (domDoc.exists()) {
      const uid = domDoc.data().uid
      const u = await getUser(uid)
      if (u) return u
    }
  } catch (e) {
    console.error('getUserByCustomDomain index check error:', e)
  }
  
  try {
    // Robust direct query fallback on 'users' collection if index structure is absent/mismatched
    const q = query(collection(db, 'users'), where('customDomain', '==', domainLower), limit(1))
    const snap = await getDocs(q)
    if (!snap.empty) {
      return { uid: snap.docs[0].id, ...snap.docs[0].data() } as User
    }
  } catch (e) {
    console.error('getUserByCustomDomain fallback query error:', e)
  }
  
  return null
}

export const updateUser = async (uid: string, data: Partial<User>) => {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() })

  if (data.plan !== undefined || data.subscriptionStatus !== undefined) {
    try {
      const user = await getUser(uid)
      const subDocRef = doc(db, 'subscriptions', uid)
      await setDoc(subDocRef, {
        id: uid,
        userId: uid,
        email: user?.email || auth.currentUser?.email || '',
        username: user?.username || '',
        plan: data.plan ?? user?.plan ?? 'FREE',
        subscriptionStatus: data.subscriptionStatus ?? user?.subscriptionStatus ?? 'EXPIRED',
        status: data.subscriptionStatus ?? user?.subscriptionStatus ?? 'EXPIRED',
        planStartedAt: data.planStartedAt ?? user?.planStartedAt ?? null,
        planExpiresAt: data.planExpiresAt ?? user?.planExpiresAt ?? null,
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (err) {
      console.warn('Subscription sync in updateUser failed:', err)
    }
  }
}

export const checkCustomDomainAvailable = async (domain: string, currentUid: string): Promise<boolean> => {
  const domainLower = domain.toLowerCase().trim()
  try {
    const docSnap = await getDoc(doc(db, 'customDomains', domainLower))
    if (docSnap.exists()) {
       const data = docSnap.data()
       // Available only if it belongs to the current user (e.g. they want to retry/update)
       return data.userId === currentUid
    }
  } catch (e) {
    console.error('Error checking custom domain availability:', e)
  }
  return true
}

export const saveCustomDomainPending = async (uid: string, username: string, domain: string, token: string) => {
  const domainLower = domain.toLowerCase().trim()
  const batch = writeBatch(db)

  // Create pending custom domains record
  batch.set(doc(db, 'customDomains', domainLower), {
    userId: uid,
    username,
    domain: domainLower,
    customDomain: domainLower,
    verificationToken: token,
    verified: false,
    sslEnabled: false,
    createdAt: serverTimestamp(),
    verifiedAt: null
  })

  // Create legacy domain link registry
  batch.set(doc(db, 'domains', domainLower), {
    uid,
    createdAt: serverTimestamp()
  })

  // Update original user document with pending info
  batch.update(doc(db, 'users', uid), {
    customDomain: domainLower,
    customDomainStatus: 'PENDING',
    customDomainToken: token,
    updatedAt: serverTimestamp()
  })

  await batch.commit()
}

export const verifyCustomDomainSuccess = async (uid: string, domain: string) => {
  const domainLower = domain.toLowerCase().trim()
  const batch = writeBatch(db)

  batch.update(doc(db, 'customDomains', domainLower), {
    verified: true,
    sslEnabled: true,
    verifiedAt: serverTimestamp()
  })

  batch.update(doc(db, 'users', uid), {
    customDomainStatus: 'CONNECTED',
    updatedAt: serverTimestamp()
  })

  await batch.commit()
}

export const removeCustomDomain = async (uid: string, domain: string) => {
  const domainLower = domain.toLowerCase().trim()
  const batch = writeBatch(db)

  batch.delete(doc(db, 'customDomains', domainLower))
  batch.delete(doc(db, 'domains', domainLower))

  batch.update(doc(db, 'users', uid), {
    customDomain: null,
    customDomainStatus: null,
    customDomainToken: null,
    updatedAt: serverTimestamp()
  })

  await batch.commit()
}

export const saveCustomDomain = async (uid: string, domain: string, oldDomain?: string) => {
  const batch = writeBatch(db)
  const newDom = domain.toLowerCase().trim()
  
  if (oldDomain) {
    batch.delete(doc(db, 'domains', oldDomain.toLowerCase().trim()))
    batch.delete(doc(db, 'customDomains', oldDomain.toLowerCase().trim()))
  }

  if (newDom) {
    batch.set(doc(db, 'domains', newDom), {
      uid,
      createdAt: serverTimestamp()
    })
    batch.update(doc(db, 'users', uid), { 
      customDomain: newDom, 
      updatedAt: serverTimestamp() 
    })
  } else {
    // If clearing domain
    batch.update(doc(db, 'users', uid), { 
      customDomain: null, 
      updatedAt: serverTimestamp() 
    })
  }

  await batch.commit()
}

export const changeUsername = async (uid: string, oldUsername: string | undefined | null, newUsername: string) => {
  const oldUname = oldUsername ? oldUsername.toLowerCase().trim() : ''
  const newUname = newUsername.toLowerCase().trim()

  if (oldUname === newUname && oldUname !== '') {
    return
  }

  const batch = writeBatch(db)

  // 1. Delete old username mapping ONLY if it exists and is not empty
  if (oldUname) {
    try {
      const oldSnap = await getDoc(doc(db, 'usernames', oldUname))
      if (oldSnap.exists()) {
        batch.delete(doc(db, 'usernames', oldUname))
      }
    } catch (err) {
      console.warn(`Could not check/delete old username index '${oldUname}':`, err)
    }
  }

  // 2. Create new username mapping
  batch.set(doc(db, 'usernames', newUname), {
    uid,
    createdAt: serverTimestamp()
  })

  // 3. Update user document
  batch.update(doc(db, 'users', uid), {
    username: newUname,
    usernameChangeCount: increment(1),
    updatedAt: serverTimestamp()
  })

  await batch.commit()
}

export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  const reserved = ['admin','api','app','auth','blog','dashboard','help','login',
    'logout','onboarding','pricing','settings','signup','u','profile','billing','lynksy']
  if (reserved.includes(username.toLowerCase())) return false
  const snap = await getDoc(doc(db, 'usernames', username.toLowerCase()))
  if (!snap.exists()) return true

  // If the username index already exists but belongs to the current user, it is available
  const data = snap.data()
  if (data && data.uid && auth.currentUser && data.uid === auth.currentUser.uid) {
    return true
  }
  return false
}

// Log renewal event helper
export const logRenewalEvent = async (uid: string, plan: PlanType, type: 'Monthly' | 'Yearly' | 'AdminSet', purchaseDate: Date, expiryDate: Date) => {
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    if (!snap.exists()) return
    const user = snap.data() as User
    const renewalRef = doc(collection(db, 'renewal_history'))
    await setDoc(renewalRef, {
      id: renewalRef.id,
      uid,
      email: user.email || '',
      username: user.username || '',
      plan,
      planType: type,
      purchaseDate: Timestamp.fromDate(purchaseDate),
      expiryDate: Timestamp.fromDate(expiryDate),
      createdAt: serverTimestamp()
    })
  } catch (err) {
    console.error('Error logging renewal event:', err)
  }
}

// Plan expiry check — auto-downgrade if expired
export const checkAndUpdatePlanExpiry = async (uid: string): Promise<User | null> => {
  const user = await getUser(uid)
  if (!user) return null
  
  const now = new Date()
  const expiryTimestamp = user.expiryDate || user.planExpiresAt
  
  if (user.plan !== 'FREE' && expiryTimestamp) {
    const expired = expiryTimestamp.toDate() < now
    if (expired) {
      try {
        await updateDoc(doc(db, 'users', uid), {
          plan: 'FREE',
          subscriptionStatus: 'EXPIRED',
          themeId: 'snow-white', // switch to default free theme
          planExpiresAt: null,
          planStartedAt: null,
          updatedAt: serverTimestamp()
        })

        // SYNC to top-level subscriptions collection
        const subDocRef = doc(db, 'subscriptions', uid)
        await setDoc(subDocRef, {
          id: uid,
          userId: uid,
          email: user.email || '',
          username: user.username || '',
          plan: 'FREE',
          subscriptionStatus: 'EXPIRED',
          status: 'EXPIRED',
          planExpiresAt: null,
          planStartedAt: null,
          updatedAt: serverTimestamp()
        }, { merge: true })

      } catch (updateErr) {
        console.warn('Failed to update plan expiry state in Firestore (offline mode?):', updateErr)
      }
      return { 
        ...user, 
        plan: 'FREE', 
        subscriptionStatus: 'EXPIRED',
        themeId: 'snow-white',
        planExpiresAt: null,
        planStartedAt: null 
      }
    }
  }
  return user
}

// Admin: set user plan (called from admin panel)
export const adminSetPlan = async (uid: string, plan: PlanType, durationDays: number) => {
  const now = new Date()
  const expires = new Date(now)
  expires.setDate(expires.getDate() + durationDays)
  
  await updateDoc(doc(db, 'users', uid), {
    plan,
    planStartedAt: Timestamp.fromDate(now),
    planExpiresAt: Timestamp.fromDate(expires),
    purchaseDate: Timestamp.fromDate(now),
    expiryDate: Timestamp.fromDate(expires),
    subscriptionStatus: 'ACTIVE',
    updatedAt: serverTimestamp(),
  })

  // SYNC to subscriptions collection
  const user = await getUser(uid)
  const subDocRef = doc(db, 'subscriptions', uid)
  await setDoc(subDocRef, {
    id: uid,
    userId: uid,
    email: user?.email || '',
    username: user?.username || '',
    plan,
    subscriptionStatus: 'ACTIVE',
    status: 'ACTIVE',
    planStartedAt: Timestamp.fromDate(now),
    planExpiresAt: Timestamp.fromDate(expires),
    updatedAt: serverTimestamp()
  }, { merge: true })

  // Log to renewal_history
  await logRenewalEvent(uid, plan, 'AdminSet', now, expires)
}

// Admin: Update user status
export const updateUserStatus = async (uid: string, status: 'ACTIVE' | 'SUSPENDED' | 'BANNED', targetName?: string) => {
  await updateDoc(doc(db, 'users', uid), {
    status,
    isActive: status === 'ACTIVE',
    updatedAt: serverTimestamp()
  })

  // Log action
  if (auth.currentUser) {
    await logAdminAction({
      adminId: auth.currentUser.uid,
      adminEmail: auth.currentUser.email || 'unknown',
      action: `USER_${status}`,
      targetId: uid,
      targetName: targetName || uid,
      details: `Changed status to ${status}`
    })
  }
}

// AI usage tracking
export const incrementAiUsage = async (uid: string, user: User, type: 'general' | 'bio' = 'general') => {
  const now = new Date()
  
  // Safe Date conversion for timestamp objects that might be serialized/plain objects
  const parseDateSafe = (ts: unknown): Date => {
    if (!ts) return now
    const obj = ts as Record<string, unknown>
    if (typeof obj.toDate === 'function') return (obj.toDate as () => Date)()
    if (typeof obj.seconds === 'number') return new Date(obj.seconds * 1000)
    if (ts instanceof Date) return ts
    const parsed = new Date(ts as string | number)
    return isNaN(parsed.getTime()) ? now : parsed
  }

  const resetDate = user?.aiResetAt ? parseDateSafe(user.aiResetAt) : now
  const shouldReset = now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()

  const field = type === 'bio' ? 'aiBiosUsedThisMonth' : 'aiUsedThisMonth'

  try {
    if (shouldReset || !user?.aiResetAt) {
      await setDoc(doc(db, 'users', uid), {
        aiUsedThisMonth: type === 'general' ? 1 : 0,
        aiBiosUsedThisMonth: type === 'bio' ? 1 : 0,
        aiResetAt: serverTimestamp(), 
        updatedAt: serverTimestamp()
      }, { merge: true })
    } else {
      await setDoc(doc(db, 'users', uid), {
        [field]: increment(1), 
        updatedAt: serverTimestamp()
      }, { merge: true })
    }
  } catch (err) {
    console.warn("[incrementAiUsage] Failed to set/update AI usage with setDoc. Falling back to updateDoc:", err)
    try {
      if (shouldReset || !user?.aiResetAt) {
        await updateDoc(doc(db, 'users', uid), {
          aiUsedThisMonth: type === 'general' ? 1 : 0,
          aiBiosUsedThisMonth: type === 'bio' ? 1 : 0,
          aiResetAt: serverTimestamp(), 
          updatedAt: serverTimestamp()
        })
      } else {
        await updateDoc(doc(db, 'users', uid), {
          [field]: increment(1), 
          updatedAt: serverTimestamp()
        })
      }
    } catch (innerErr) {
      console.error("[incrementAiUsage] Both setDoc and updateDoc failed:", innerErr)
      // Do not throw to prevent blocking the bio generation or user onboarding
    }
  }
}

// ─── LINKS ───────────────────────────────────────────────────────
export const getLinks = async (uid: string): Promise<Link[]> => {
  const q = query(collection(db, 'users', uid, 'links'))
  const snap = await getDocs(q)
  const links = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Link))
    .filter(l => l.title && l.title.trim() !== '')
  
  // In-memory sort: isPinned (descending), position (ascending)
  return links.sort((a, b) => {
    const pinA = a.isPinned ? 1 : 0
    const pinB = b.isPinned ? 1 : 0
    if (pinB !== pinA) {
      return pinB - pinA
    }
    const posA = a.position ?? 999999
    const posB = b.position ?? 999999
    return posA - posB
  })
}

const safeToMillis = (val: unknown): number => {
  if (!val) return 0
  const obj = val as { toMillis?: () => number; toDate?: () => { getTime: () => number } }
  if (typeof obj.toMillis === 'function') return obj.toMillis()
  if (typeof obj.toDate === 'function') {
    const d = obj.toDate()
    return d ? d.getTime() : 0
  }
  if (val instanceof Date) return val.getTime()
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const d = new Date(val)
    return isNaN(d.getTime()) ? 0 : d.getTime()
  }
  return 0
}

export const getActiveLinks = async (uid: string): Promise<Link[]> => {
  const q = query(collection(db, 'users', uid, 'links'))
  const snap = await getDocs(q)
  const nowMs = Date.now()
  const links = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Link))
    .filter(l => {
      if (l.isActive === false) return false
      if (!l.title || l.title.trim() === '') return false
      const fromMs = l.showFrom ? safeToMillis(l.showFrom) : 0
      const untilMs = l.showUntil ? safeToMillis(l.showUntil) : 0
      
      const afterFrom  = !fromMs || fromMs <= nowMs
      const beforeUntil= !untilMs || untilMs >= nowMs
      return afterFrom && beforeUntil
    })

  // In-memory sort: isPinned (descending), position (ascending)
  return links.sort((a, b) => {
    const pinA = a.isPinned ? 1 : 0
    const pinB = b.isPinned ? 1 : 0
    if (pinB !== pinA) {
      return pinB - pinA
    }
    const posA = a.position ?? 999999
    const posB = b.position ?? 999999
    return posA - posB
  })
}

export const createLink = async (uid: string, data: Omit<Link, 'id'|'createdAt'|'updatedAt'|'clickCount'>): Promise<string> => {
  const ref = await addDoc(collection(db, 'users', uid, 'links'), {
    ...data, clickCount: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  })
  return ref.id
}

export const updateLink = async (uid: string, linkId: string, data: Partial<Link>) => {
  const path = `users/${uid}/links/${linkId}`
  try {
    await updateDoc(doc(db, 'users', uid, 'links', linkId), { ...data, updatedAt: serverTimestamp() })
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path)
  }
}

export const deleteLink = async (uid: string, linkId: string) => {
  const path = `users/${uid}/links/${linkId}`
  try {
    await deleteDoc(doc(db, 'users', uid, 'links', linkId))
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path)
  }
}

export const reorderLinks = async (uid: string, links: { id: string; position: number }[]) => {
  const batch = writeBatch(db)
  links.forEach(({ id, position }) => {
    batch.update(doc(db, 'users', uid, 'links', id), { position, updatedAt: serverTimestamp() })
  })
  await batch.commit()
}

// ─── PRODUCTS ────────────────────────────────────────────────────
export const getActiveProducts = async (uid: string): Promise<Product[]> => {
  const q = query(
    collection(db, 'users', uid, 'products'),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product))
}

// ─── ANALYTICS ───────────────────────────────────────────────────
export const trackPageView = async (username: string, uid: string) => {
  const ua = navigator.userAgent
  const isMobile = /mobile|android|iphone/i.test(ua)
  const isTablet = /ipad|tablet/i.test(ua)
  const device = isMobile && !isTablet ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  
  const browser = /edg\//i.test(ua) ? 'Edge' 
                : /chrome/i.test(ua) ? 'Chrome'
                : /safari/i.test(ua) ? 'Safari' 
                : /firefox/i.test(ua) ? 'Firefox' : 'Other'
                
  const referer = document.referrer || 'direct'
  let region = 'Unknown'

  try {
    // Check session storage first
    const cachedRegion = sessionStorage.getItem('lk_region')
    if (cachedRegion) {
      region = cachedRegion
    } else {
      let gotLoc = false

      // Try freeipapi.com first (extremely fast, generous rate limit, HTTPS)
      try {
        const res = await fetch('https://freeipapi.com/api/json').catch(() => null)
        if (res && res.ok) {
          const data = await res.json()
          if (data.cityName && data.countryName) {
            region = `${data.cityName}, ${data.countryName}`
            gotLoc = true
          } else if (data.countryName) {
            region = data.countryName
            gotLoc = true
          }
        }
      } catch (e) {
        console.warn('freeipapi failed:', e)
      }

      if (!gotLoc) {
        // Try ipwho.is as second fallback (fast, HTTPS, free for up to 10k/day)
        try {
          const res = await fetch('https://ipwho.is/').catch(() => null)
          if (res && res.ok) {
            const data = await res.json()
            if (data.success && data.city && data.country) {
              region = `${data.city}, ${data.country}`
              gotLoc = true
            } else if (data.success && data.country) {
              region = data.country
              gotLoc = true
            }
          }
        } catch (e) {
          console.warn('ipwhois failed:', e)
        }
      }

      if (!gotLoc) {
        // Try original ipapi.co as third fallback
        try {
          const res = await fetch('https://ipapi.co/json/').catch(() => null)
          if (res && res.ok) {
            const data = await res.json()
            if (data.city && data.country_name) {
              region = `${data.city}, ${data.country_name}`
              gotLoc = true
            } else if (data.country_name) {
              region = data.country_name
              gotLoc = true
            }
          }
        } catch (e) {
          console.warn('ipapi failed:', e)
        }
      }

      if (!gotLoc) {
        // Safe formatted timezone fallback
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
        if (tz && tz.includes('/')) {
          region = tz.split('/').pop()?.replace(/_/g, ' ') || 'Unknown'
        } else {
          region = tz || 'Unknown'
        }
      }

      sessionStorage.setItem('lk_region', region)
    }
  } catch {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    if (tz && tz.includes('/')) {
      region = tz.split('/').pop()?.replace(/_/g, ' ') || 'Unknown'
    } else {
      region = tz || 'Unknown'
    }
  }

  try {
    await addDoc(collection(db, 'users', uid, 'pageViews'), {
      uid, username, device, browser, region, referer, timestamp: serverTimestamp()
    })
    // Update daily aggregate
    const dateKey = new Date().toISOString().split('T')[0]
    const dayRef = doc(db, 'analytics', uid, 'daily', dateKey)
    
    try {
      await setDoc(dayRef, { 
        views: increment(1), 
        clicks: increment(0),
        date: dateKey,
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (error) {
      console.error('Error updating daily views:', error)
    }
  } catch (error) {
    console.error('Error tracking page view:', error)
  }
}

export const trackClick = async (uid: string, link: { id: string; title: string }) => {
  try {
    const ua = navigator.userAgent
    const isMobile = /mobile|android|iphone/i.test(ua)
    const isTablet = /ipad|tablet/i.test(ua)
    const device = isMobile && !isTablet ? 'mobile' : isTablet ? 'tablet' : 'desktop'
    
    const browser = /chrome/i.test(ua) ? 'Chrome' 
                  : /safari/i.test(ua) ? 'Safari' 
                  : /firefox/i.test(ua) ? 'Firefox' : 'Other'
    
    let region = 'Unknown'
    try {
      const cachedRegion = sessionStorage.getItem('lk_region')
      if (cachedRegion) {
        region = cachedRegion
      } else {
        const locRes = await fetch('https://ipapi.co/json/').catch(() => null)
        if (locRes && locRes.ok) {
          const locData = await locRes.json()
          if (locData.city && locData.country_name) {
            region = `${locData.city}, ${locData.country_name}`
          } else if (locData.country_name) {
            region = locData.country_name
          }
          sessionStorage.setItem('lk_region', region)
        } else {
          region = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
        }
      }
    } catch {
      region = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
    }

    // 1. Record raw click event
    try {
      await addDoc(collection(db, 'users', uid, 'clickEvents'), {
        uid, linkId: link.id, linkTitle: link.title, device, browser, region, timestamp: serverTimestamp()
      })
    } catch (error) { console.error('Raw click record failed:', error) }

    // 2. Update the link document counter
    try {
      await updateDoc(doc(db, 'users', uid, 'links', link.id), { 
        clickCount: increment(1),
        lastClickedAt: serverTimestamp()
      })
    } catch { console.error('Link counter update failed:') }

    // 3. Update daily aggregate
    const dateKey = new Date().toISOString().split('T')[0]
    const dayRef = doc(db, 'analytics', uid, 'daily', dateKey)
    
    try {
      await setDoc(dayRef, {
        clicks: increment(1),
        views: increment(0),
        date: dateKey,
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (e) {
      console.error('Error tracking click:', e)
    }
  } catch (e) {
    console.error('Error tracking click:', e)
  }
}

export const trackTip = async (uid: string, upiId: string, amount: number) => {
  try {
    const ua = navigator.userAgent
    const isMobile = /mobile|android|iphone/i.test(ua)
    const isTablet = /ipad|tablet/i.test(ua)
    const device = isMobile && !isTablet ? 'mobile' : isTablet ? 'tablet' : 'desktop'
    
    const browser = /chrome/i.test(ua) ? 'Chrome' 
                  : /safari/i.test(ua) ? 'Safari' 
                  : /firefox/i.test(ua) ? 'Firefox' : 'Other'
    
    let region = 'Unknown'
    try {
      const cachedRegion = sessionStorage.getItem('lk_region')
      if (cachedRegion) {
        region = cachedRegion
      } else {
        const locRes = await fetch('https://ipapi.co/json/').catch(() => null)
        if (locRes && locRes.ok) {
          const locData = await locRes.json()
          if (locData.city && locData.country_name) {
            region = `${locData.city}, ${locData.country_name}`
          } else if (locData.country_name) {
            region = locData.country_name
          }
          sessionStorage.setItem('lk_region', region)
        } else {
          region = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
        }
      }
    } catch {
      region = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
    }

    try {
      // Save directly inside users/{uid}/analytics/tips
      await addDoc(collection(db, 'users', uid, 'analytics', 'tips', 'records'), {
        upiId,
        amount,
        device,
        browser,
        region,
        timestamp: serverTimestamp()
      })
    } catch (error) {
      console.error('Raw tip tracking record failed:', error)
    }
  } catch (error) {
    console.error('Error in trackTip helper:', error)
  }
}

export const getAnalytics = async (uid: string, days: number = 30): Promise<AnalyticsData> => {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startTs = Timestamp.fromDate(startDate)

  // Get page views
  const pvQuery = query(collection(db, 'users', uid, 'pageViews'),
    where('timestamp', '>=', startTs))
  const pvSnap = await getDocs(pvQuery).catch(err => {
    console.error('Error fetching pageViews in getAnalytics:', err)
    return null
  })

  // Get click events
  const ceQuery = query(collection(db, 'users', uid, 'clickEvents'),
    where('timestamp', '>=', startTs))
  const ceSnap = await getDocs(ceQuery).catch(err => {
    console.error('Error fetching clickEvents in getAnalytics:', err)
    return null
  })

  // Get daily aggregates
  const dailyQuery = query(collection(db, 'analytics', uid, 'daily'), orderBy('date', 'desc'), limit(days))
  const dailySnap = await getDocs(dailyQuery).catch(err => {
    console.error('Error fetching daily aggregates in getAnalytics:', err)
    return null
  })

  const pageViews = (pvSnap?.docs || []).map(d => d.data() as PageView).filter(Boolean)
  const clicks    = (ceSnap?.docs || []).map(d => d.data() as ClickEvent).filter(Boolean)
  const daily     = (dailySnap?.docs || []).map(d => d.data() as { date: string; views: number; clicks: number }).filter(d => d && d.date)

  // Fill date gaps
  const dailyMap = new Map<string, { date: string; views: number; clicks: number }>(daily.map(d => [d.date, d]))
  const dailyChart: { date: string; views: number; clicks: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    dailyChart.push({ date: key, views: dailyMap.get(key)?.views ?? 0, clicks: dailyMap.get(key)?.clicks ?? 0 })
  }

  // Device breakdown
  const deviceMap: Record<string, number> = {}
  pageViews.forEach(pv => {
    if (pv && pv.device) {
      const dev = String(pv.device).toLowerCase()
      deviceMap[dev] = (deviceMap[dev] ?? 0) + 1
    }
  })
  const devices = Object.entries(deviceMap).map(([device, count]) => ({ device, count }))

  // Top links
  const linkClickMap: Record<string, { title: string; count: number }> = {}
  clicks.forEach(ce => {
    if (ce && ce.linkId) {
      if (!linkClickMap[ce.linkId]) {
        linkClickMap[ce.linkId] = { title: ce.linkTitle || 'Untitled Link', count: 0 }
      }
      linkClickMap[ce.linkId].count++
    }
  })
  const topLinks = Object.entries(linkClickMap)
    .map(([id, { title, count }]) => ({ id, title, clicks: count }))
    .sort((a, b) => b.clicks - a.clicks).slice(0, 10)

  // Sources from referer
  const sourceMap: Record<string, number> = {}
  pageViews.forEach(pv => {
    if (pv) {
      const refererStr = String(pv.referer || '').toLowerCase()
      const src = refererStr.includes('instagram') ? 'Instagram'
                : refererStr.includes('youtube') ? 'YouTube'
                : refererStr.includes('twitter') || refererStr.includes('x.com') ? 'Twitter/X'
                : refererStr === 'direct' ? 'Direct' : 'Other'
      sourceMap[src] = (sourceMap[src] ?? 0) + 1
    }
  })
  const sources = Object.entries(sourceMap).map(([source, count]) => ({ source, count }))

  const totalViews  = pageViews.length
  const totalClicks = clicks.length
  const ctr = totalViews > 0 ? Math.round(totalClicks / totalViews * 1000) / 10 : 0
  
  const uniqueVisitors = new Set(pageViews.map(pv => (pv.region || '') + (pv.browser || ''))).size

  // Calculate trends (compare current period with previous same-length period)
  const prevStartDate = new Date(startDate)
  prevStartDate.setDate(prevStartDate.getDate() - days)
  const prevStartTs = Timestamp.fromDate(prevStartDate)

  let prevViews = 0
  let prevClicks = 0

  try {
    const prevPvQuery = query(collection(db, 'users', uid, 'pageViews'),
      where('timestamp', '>=', prevStartTs),
      where('timestamp', '<', startTs))
    const prevPvSnap = await getDocs(prevPvQuery)
    prevViews = prevPvSnap.docs.length
  } catch (err) {
    console.error('Error fetching prev pageViews:', err)
  }

  try {
    const prevCeQuery = query(collection(db, 'users', uid, 'clickEvents'),
      where('timestamp', '>=', prevStartTs),
      where('timestamp', '<', startTs))
    const prevCeSnap = await getDocs(prevCeQuery)
    prevClicks = prevCeSnap.docs.length
  } catch (err) {
    console.error('Error fetching prev clickEvents:', err)
  }

  const viewsTrend = prevViews > 0 
    ? Math.round(((totalViews - prevViews) / prevViews) * 100) 
    : (totalViews > 0 ? totalViews * 100 : 0)
  const clicksTrend = prevClicks > 0 
    ? Math.round(((totalClicks - prevClicks) / prevClicks) * 100) 
    : (totalClicks > 0 ? totalClicks * 100 : 0)

  // Regions breakdown
  const regionMap: Record<string, number> = {}
  pageViews.forEach(pv => { 
    if (pv && pv.region) {
      const cleanRegion = String(pv.region || '').includes('/') && !String(pv.region || '').includes(',')
        ? (String(pv.region || '').split('/').pop()?.replace(/_/g, ' ') || 'Other')
        : (pv.region || 'Unknown')
      regionMap[cleanRegion] = (regionMap[cleanRegion] ?? 0) + 1 
    }
  })
  const regions = Object.entries(regionMap)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Hourly breakdown
  const hourMap: Record<number, number> = {}
  pageViews.forEach(pv => {
    if (pv && pv.timestamp) {
      try {
        const hour = typeof pv.timestamp.toDate === 'function' 
          ? pv.timestamp.toDate().getHours() 
          : new Date(pv.timestamp as unknown as string | number | Date).getHours()
        hourMap[hour] = (hourMap[hour] ?? 0) + 1
      } catch (e) {
        console.error('Error parsing timestamp to date in getAnalytics:', e)
      }
    }
  })
  const bestHourNum = Object.entries(hourMap).sort((a, b) => b[1] - a[1])[0]?.[0]
  const bestHour = bestHourNum !== undefined ? `${bestHourNum}:00` : 'None'

  return { 
    totalViews, 
    totalClicks, 
    ctr, 
    uniqueVisitors,
    viewsTrend, 
    clicksTrend, 
    dailyChart, 
    devices, 
    regions, 
    topLinks, 
    sources, 
    bestHour 
  }
}

// ─── BILLING ─────────────────────────────────────────────────────
export const getInvoices = async (uid: string): Promise<Invoice[]> => {
  const q = query(collection(db, 'users', uid, 'invoices'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Invoice))
}

export const recordInvoice = async (uid: string, data: Omit<Invoice, 'id' | 'createdAt'>) => {
  await addDoc(collection(db, 'users', uid, 'invoices'), {
    ...data,
    createdAt: serverTimestamp()
  })
}

export const cancelSubscription = async (uid: string) => {
  // In a real app, this would call a Stripe API, then update DB.
  // Here we just set planExpiresAt to something soon to simulate cancelation at period end.
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 1) // Set to expire in 1 day
  await updateDoc(doc(db, 'users', uid), {
    planExpiresAt: Timestamp.fromDate(expiry),
    updatedAt: serverTimestamp()
  })

  // SYNC to subscriptions collection
  const user = await getUser(uid)
  const subDocRef = doc(db, 'subscriptions', uid)
  await setDoc(subDocRef, {
    id: uid,
    userId: uid,
    email: user?.email || '',
    username: user?.username || '',
    planExpiresAt: Timestamp.fromDate(expiry),
    updatedAt: serverTimestamp()
  }, { merge: true })
}

export const updatePlan = async (uid: string, plan: PlanType, type: 'Monthly' | 'Yearly') => {
  const now = new Date()
  const expires = new Date(now)
  if (type === 'Monthly') expires.setMonth(expires.getMonth() + 1)
  else expires.setFullYear(expires.getFullYear() + 1)

  const amount = plan === 'PRO' ? (type === 'Monthly' ? 299 : 2990) : (type === 'Monthly' ? 599 : 5990)
  
  const batch = writeBatch(db)
  
  // 1. Update user plan
  batch.update(doc(db, 'users', uid), {
    plan,
    planType: type,
    planStartedAt: Timestamp.fromDate(now),
    planExpiresAt: Timestamp.fromDate(expires),
    purchaseDate: Timestamp.fromDate(now),
    expiryDate: Timestamp.fromDate(expires),
    subscriptionStatus: 'ACTIVE',
    updatedAt: serverTimestamp()
  })

  // 2. Record invoice
  const invRef = doc(collection(db, 'users', uid, 'invoices'))
  batch.set(invRef, {
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    amount,
    currency: 'INR',
    status: 'PAID',
    plan,
    planType: type,
    billingDate: serverTimestamp(),
    createdAt: serverTimestamp()
  })

  await batch.commit()

  // SYNC to subscriptions collection
  const user = await getUser(uid)
  const subDocRef = doc(db, 'subscriptions', uid)
  await setDoc(subDocRef, {
    id: uid,
    userId: uid,
    email: user?.email || '',
    username: user?.username || '',
    plan,
    subscriptionStatus: 'ACTIVE',
    status: 'ACTIVE',
    planStartedAt: Timestamp.fromDate(now),
    planExpiresAt: Timestamp.fromDate(expires),
    updatedAt: serverTimestamp()
  }, { merge: true })

  // 3. Log to renewal history
  await logRenewalEvent(uid, plan, type, now, expires)
}

export const deleteUserAccount = async (uid: string, username: string, email?: string, customDomain?: string) => {
  const batch = writeBatch(db)

  // 1. Delete mapping documents only if they exist (though Firestore allows deleting non-existent docs, 
  // but let's be explicit and ensure we are using the correct paths)
  if (username) {
    batch.delete(doc(db, 'usernames', username.toLowerCase().trim()))
  }
  
  if (email) {
    batch.delete(doc(db, 'emails', email.toLowerCase().trim()))
  }

  if (customDomain) {
    batch.delete(doc(db, 'domains', customDomain.toLowerCase().trim()))
    batch.delete(doc(db, 'customDomains', customDomain.toLowerCase().trim()))
  }

  // 2. Delete the main user document
  batch.delete(doc(db, 'users', uid))

  // 3. Delete subcollections (links, pageViews, clickEvents, products, orders, invoices)
  // NOTE: Firebase doesn't auto-delete subcollections. We should ideally delete them too.
  // But for a batch, we are limited to 500 operations.
  // In a production app, this would be a Cloud Function.
  // For now, we delete the main mappings and the user doc.

  try {
    await batch.commit()
  } catch (error) {
    console.error('Batch delete failed:', error)
    throw error
  }

  // 3. Log action (ONLY if user is admin, since only admins can write to adminLogs)
  // Check if current user is the admin (hardcoded in rules as abhimattikopp9845@gmail.com)
  const isAdmin = auth.currentUser?.email?.toLowerCase() === 'abhimattikopp9845@gmail.com'
  
  if (isAdmin) {
    try {
      await logAdminAction({
        adminId: auth.currentUser!.uid,
        adminEmail: auth.currentUser!.email || 'unknown',
        action: 'USER_DELETE',
        targetId: uid,
        targetName: username,
        details: `Deleted user account ${username}`
      })
    } catch (error) {
      console.error('Non-critical: Admin log failed:', error)
    }
  }
}

// ─── APP SETTINGS ───────────────────────────────────────────────
export interface AppSettings {
  appName: string;
  maintenanceMode: boolean;
  proPriceMonthly: number;
  proPlusPriceMonthly: number;
  updatedAt?: Timestamp;
}

export interface AdminLog {
  id?: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId?: string;
  targetName?: string;
  details?: string;
  timestamp: Timestamp;
}

export const getAppSettings = async (): Promise<AppSettings | null> => {
  const path = 'appSettings/global'
  try {
    const snap = await getDoc(doc(db, 'appSettings', 'global'))
    if (!snap.exists()) return null
    return snap.data() as AppSettings
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path)
    return null
  }
}

export const updateAppSettings = async (data: Partial<AppSettings>) => {
  await setDoc(doc(db, 'appSettings', 'global'), { 
    ...data, 
    updatedAt: serverTimestamp() 
  }, { merge: true })

  // Log action
  if (auth.currentUser) {
    await logAdminAction({
      adminId: auth.currentUser.uid,
      adminEmail: auth.currentUser.email || 'unknown',
      action: 'SETTINGS_UPDATE',
      details: `Updated app settings: ${Object.keys(data).join(', ')}`
    })
  }
}

// ─── ADMIN LOGS ──────────────────────────────────────────────────
export const logAdminAction = async (log: Omit<AdminLog, 'timestamp'>) => {
  const path = 'adminLogs'
  try {
    await addDoc(collection(db, path), {
      ...log,
      timestamp: serverTimestamp()
    })
  } catch (error) {
    console.error('Error logging admin action:', error)
  }
}

export const getAdminLogs = async (limitCount = 50): Promise<AdminLog[]> => {
  const path = 'adminLogs'
  try {
    const q = query(collection(db, path), orderBy('timestamp', 'desc'), limit(limitCount))
    const snap = await getDocs(q)
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminLog))
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path)
    return []
  }
}

export const getDetailedEvents = async (uid: string, days: number = 30): Promise<DetailedEvent[]> => {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  const startTs = Timestamp.fromDate(startDate)

  // Get page views
  const pvQuery = query(collection(db, 'users', uid, 'pageViews'),
    where('timestamp', '>=', startTs))
  const pvSnap = await getDocs(pvQuery).catch(err => {
    console.error('Error fetching pageViews in getDetailedEvents:', err)
    return null
  })

  // Get click events
  const ceQuery = query(collection(db, 'users', uid, 'clickEvents'),
    where('timestamp', '>=', startTs))
  const ceSnap = await getDocs(ceQuery).catch(err => {
    console.error('Error fetching clickEvents in getDetailedEvents:', err)
    return null
  })

  const events: DetailedEvent[] = []

  if (pvSnap) {
    pvSnap.docs.forEach(d => {
      const data = d.data() as PageView
      if (!data) return
      let date: Date
      try {
        date = data.timestamp && typeof data.timestamp.toDate === 'function'
          ? data.timestamp.toDate()
          : new Date(data.timestamp as unknown as string | number | Date)
      } catch {
        date = new Date()
      }
      events.push({
        type: 'Page View',
        timestamp: date,
        dateStr: date.toISOString(),
        device: data.device || 'Unknown',
        browser: data.browser || 'Unknown',
        region: data.region || 'Unknown',
        refererOrLink: data.referer || 'Direct',
      })
    })
  }

  if (ceSnap) {
    ceSnap.docs.forEach(d => {
      const data = d.data() as ClickEvent
      if (!data) return
      let date: Date
      try {
        date = data.timestamp && typeof data.timestamp.toDate === 'function'
          ? data.timestamp.toDate()
          : new Date(data.timestamp as unknown as string | number | Date)
      } catch {
        date = new Date()
      }
      events.push({
        type: 'Link Click',
        timestamp: date,
        dateStr: date.toISOString(),
        device: data.device || 'Unknown',
        browser: data.browser || 'Unknown',
        region: data.region || 'Unknown',
        refererOrLink: data.linkId || 'Unknown Link',
        linkTitle: data.linkTitle || 'Untitled Link',
      })
    })
  }

  // Sort chronologically (newest first)
  return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

// ─── EMAIL SUBSCRIBERS ───────────────────────────────────────────
export const getEmailSubscribers = async (creatorId: string): Promise<EmailSubscriber[]> => {
  const path = 'emailSubscribers'
  try {
    const q = query(
      collection(db, path),
      where('creatorId', '==', creatorId)
    )
    const snap = await getDocs(q)
    const subs = snap.docs.map(d => ({ id: d.id, ...d.data() } as EmailSubscriber))
    // Manual sorting because compound query might require single-field indexes we don't want to force
    return subs.sort((a, b) => {
      const tA = a.subscribedAt?.toMillis?.() || 0
      const tB = b.subscribedAt?.toMillis?.() || 0
      return tB - tA
    })
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path)
    return []
  }
}

export const subscribeToEmailSubscribers = (
  creatorId: string,
  onUpdate: (subs: EmailSubscriber[]) => void,
  onError?: (error: unknown) => void
) => {
  const path = 'emailSubscribers'
  const q = query(
    collection(db, path),
    where('creatorId', '==', creatorId)
  )
  return onSnapshot(
    q,
    (snap) => {
      const subs = snap.docs.map(d => ({ id: d.id, ...d.data() } as EmailSubscriber))
      const sorted = subs.sort((a, b) => {
        const tA = a.subscribedAt?.toMillis?.() || 0
        const tB = b.subscribedAt?.toMillis?.() || 0
        return tB - tA
      })
      onUpdate(sorted)
    },
    (error) => {
      if (onError) {
        onError(error)
      } else {
        handleFirestoreError(error, OperationType.LIST, path)
      }
    }
  )
}

export const addEmailSubscriber = async (
  creatorId: string,
  creatorUsername: string,
  email: string,
  source = 'public_profile'
): Promise<string> => {
  const emailLower = email.trim().toLowerCase()
  // Clean special characters for firestore ID safety
  const safeEmailKey = emailLower.replace(/[^a-zA-Z0-9@.-]/g, '_')
  const docId = `${creatorId}_${safeEmailKey}`
  const path = `emailSubscribers/${docId}`
  
  try {
    // Validate creator exists
    const creator = await getUser(creatorId)
    if (!creator) {
      throw new Error('Creator profile not found.')
    }

    // 1. Check for duplicates using getDoc (requires 'get' permission on the specific document path, which is public)
    const docRef = doc(db, 'emailSubscribers', docId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      throw new Error('ALREADY_SUBSCRIBED')
    }

    // 2. Add subscriber using setDoc so we use the deterministic ID
    await setDoc(docRef, {
      creatorId,
      creatorUsername,
      email: emailLower,
      source,
      subscribedAt: serverTimestamp()
    }, { isInsertOnly: true })
    return docId
  } catch (error) {
    if (error instanceof Error && error.message === 'ALREADY_SUBSCRIBED') {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, path)
    throw error;
  }
}

export const deleteEmailSubscriber = async (subscriberId: string) => {
  const path = `emailSubscribers/${subscriberId}`
  try {
    await deleteDoc(doc(db, 'emailSubscribers', subscriberId))
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path)
  }
}

export interface PaymentHistoryItem {
  id: string
  userId: string
  email: string
  planPurchased: string
  amountPaid: number
  date: unknown
  paymentId: string
  status: 'SUCCESS' | 'FAILED'
  createdAt: unknown
}

export const getPaymentHistory = async (uid: string): Promise<PaymentHistoryItem[]> => {
  try {
    const q = query(
      collection(db, 'payment_history'),
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentHistoryItem))
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return []
  }
}

export const addPaymentHistory = async (paymentData: Omit<PaymentHistoryItem, 'id'>) => {
  try {
    const docRef = doc(collection(db, 'payment_history'))
    await setDoc(docRef, paymentData)
    return docRef.id
  } catch (error) {
    console.error('Error adding payment history client-side:', error)
    return null
  }
}

